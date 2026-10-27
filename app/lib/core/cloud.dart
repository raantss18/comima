import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

/// Projet Supabase : URL et clé publique `anon` (protégée par les règles d'accès du serveur,
/// faite pour être embarquée). Injectées à la construction (`--dart-define`, voir
/// tool/build_apk.sh) ; sans elles, les comptes sont désactivés et l'application reste 100 %
/// locale.
class CloudConfig {
  const CloudConfig({this.url = const String.fromEnvironment('SUPABASE_URL'), this.key = const String.fromEnvironment('SUPABASE_KEY')});

  final String url;
  final String key;

  bool get enabled => url.startsWith('https://') && key.isNotEmpty;

  /// Schéma du projet partagé réservé à COMIMa (voir supabase/README.md).
  static const schema = 'comima';
  static const redirect = 'mg.comima.app://login-callback';
}

/// Erreur lisible renvoyée par le serveur ({code, message}).
class CloudException implements Exception {
  CloudException(this.status, this.message, [this.code]);
  final int status;
  final String message;
  final String? code;

  bool get unauthorized => status == 401 || status == 403;
  bool get invalidLogin => code == 'invalid_credentials' || message.toLowerCase().contains('invalid login');
  bool get notConfirmed => code == 'email_not_confirmed' || message.toLowerCase().contains('not confirmed');
  bool get emailDisabled => code == 'email_provider_disabled' || message.toLowerCase().contains('email logins are disabled');
  /// La table des marque-pages n'existe pas (encore) sur le serveur : l'application reste en local.
  bool get missingTable => status == 404 || code == 'PGRST205' || code == '42P01';
  bool get exists => code == 'user_already_exists' || message.toLowerCase().contains('already registered');

  @override
  String toString() => 'CloudException($status, $message)';
}

/// Ce que le serveur permet aujourd'hui (détecté à l'exécution, sans rien créer) : l'application
/// n'affiche que les modes de connexion réellement activés, et les comptes « s'allument » seuls
/// quand le Bureau a terminé la configuration du projet — sans nouvelle version de l'application.
class CloudStatus {
  const CloudStatus({this.reachable = false, this.email = false, this.google = false, this.facebook = false, this.schemaReady = false});

  final bool reachable;
  final bool email;
  final bool google;
  final bool facebook;

  /// Schéma `comima` exposé et tables créées.
  final bool schemaReady;

  bool get ready => reachable && schemaReady && (email || google || facebook);

  static const unknown = CloudStatus();
}

/// Jeton de session : accès (court), renouvellement (long), identité.
class Session {
  Session({required this.access, required this.refresh, required this.exp, required this.userId, this.email});

  final String access;
  final String refresh;

  /// Expiration de l'accès, en secondes depuis 1970 (UTC).
  final int exp;
  final String userId;
  final String? email;

  bool get expiresSoon => DateTime.now().millisecondsSinceEpoch ~/ 1000 > exp - 60;

  Map<String, dynamic> toJson() => {'access': access, 'refresh': refresh, 'exp': exp, 'userId': userId, 'email': email};

  factory Session.fromJson(Map<String, dynamic> j) => Session(
        access: j['access'] as String,
        refresh: j['refresh'] as String,
        exp: j['exp'] as int,
        userId: j['userId'] as String,
        email: j['email'] as String?,
      );

  factory Session.fromToken(Map<String, dynamic> t) {
    final user = (t['user'] as Map?)?.cast<String, dynamic>() ?? {};
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    return Session(
      access: t['access_token'] as String,
      refresh: t['refresh_token'] as String,
      exp: (t['expires_at'] as int?) ?? now + ((t['expires_in'] as int?) ?? 3600),
      userId: (user['id'] ?? _subject(t['access_token'] as String)) as String,
      email: user['email'] as String?,
    );
  }

  static String _subject(String jwt) {
    final p = jwt.split('.')[1];
    return (jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(p)))) as Map)['sub'] as String;
  }
}

/// Connexion PKCE : le secret (`verifier`) reste sur le téléphone ; seul son empreinte
/// (`challenge`) part avec la demande. Un lien de retour intercepté ne suffit donc pas.
class Pkce {
  Pkce._(this.verifier, this.challenge);

  final String verifier;
  final String challenge;

  factory Pkce.create([Random? rng]) {
    final r = rng ?? Random.secure();
    final verifier = base64Url.encode(List<int>.generate(48, (_) => r.nextInt(256))).replaceAll('=', '');
    return Pkce.fromVerifier(verifier);
  }

  factory Pkce.fromVerifier(String verifier) =>
      Pkce._(verifier, base64Url.encode(sha256.convert(ascii.encode(verifier)).bytes).replaceAll('=', ''));
}

/// Ajoute un délai maximal à chaque requête : sur une connexion qui s'arrête, l'application ne
/// reste jamais bloquée en attente.
class _TimeoutClient extends http.BaseClient {
  _TimeoutClient(this._inner);

  final http.Client _inner;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) => _inner.send(request).timeout(const Duration(seconds: 25));
}

/// Client minimal de l'API Supabase (GoTrue + PostgREST) : quelques requêtes HTTP plutôt qu'une
/// bibliothèque de plusieurs Mo, pour garder l'application légère.
class Cloud {
  Cloud(this.config, {http.Client? client}) : _http = _TimeoutClient(client ?? http.Client());

  final CloudConfig config;
  final http.Client _http;

  Map<String, String> _headers({String? token, bool schema = false, Map<String, String>? extra}) => {
        'apikey': config.key,
        'Authorization': 'Bearer ${token ?? config.key}',
        'Content-Type': 'application/json',
        if (schema) 'Content-Profile': CloudConfig.schema,
        if (schema) 'Accept-Profile': CloudConfig.schema,
        ...?extra,
      };

  dynamic _decode(http.Response r) {
    final body = r.body.isEmpty ? null : jsonDecode(utf8.decode(r.bodyBytes));
    if (r.statusCode >= 200 && r.statusCode < 300) return body;
    final m = body is Map ? body : const {};
    throw CloudException(
      r.statusCode,
      (m['error_description'] ?? m['msg'] ?? m['message'] ?? 'Erreur ${r.statusCode}').toString(),
      (m['error_code'] ?? m['code'])?.toString(),
    );
  }

  Uri _u(String path, [Map<String, String>? q]) => Uri.parse('${config.url}$path').replace(queryParameters: q);

  // ---------------------------------------------------------------- état du serveur

  Future<CloudStatus> status() async {
    try {
      final r = await _http.get(_u('/auth/v1/settings'), headers: _headers());
      if (r.statusCode != 200) return CloudStatus.unknown;
      final ext = ((jsonDecode(utf8.decode(r.bodyBytes)) as Map)['external'] as Map?) ?? const {};
      // Le schéma doit être exposé ET créé : sans connexion, le serveur répond « permission
      // refusée » (c'est le bon signe) ; sinon « schéma invalide » / « table introuvable ».
      final probe = await _http.get(_u('/rest/v1/centres', {'limit': '1'}), headers: _headers(schema: true));
      final code = (jsonDecode(utf8.decode(probe.bodyBytes.isEmpty ? utf8.encode('{}') : probe.bodyBytes)) as dynamic);
      final c = code is Map ? code['code']?.toString() : null;
      return CloudStatus(
        reachable: true,
        email: ext['email'] == true,
        google: ext['google'] == true,
        facebook: ext['facebook'] == true,
        schemaReady: c != 'PGRST106' && c != 'PGRST205' && c != '3F000',
      );
    } catch (_) {
      return CloudStatus.unknown;
    }
  }

  // ---------------------------------------------------------------- connexion

  /// Inscription par e-mail. Renvoie une session si le projet n'exige pas de confirmation,
  /// sinon null : l'élève doit d'abord cliquer le lien reçu par e-mail.
  Future<Session?> signUp(String email, String password, {String? displayName}) async {
    final r = await _http.post(
      _u('/auth/v1/signup', {'redirect_to': CloudConfig.redirect}),
      headers: _headers(),
      body: jsonEncode({
        'email': email,
        'password': password,
        'data': {'display_name': ?displayName, 'app': 'comima'},
      }),
    );
    final b = _decode(r) as Map<String, dynamic>;
    return b['access_token'] == null ? null : Session.fromToken(b);
  }

  Future<Session> signIn(String email, String password) async {
    final r = await _http.post(
      _u('/auth/v1/token', {'grant_type': 'password'}),
      headers: _headers(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    return Session.fromToken(_decode(r) as Map<String, dynamic>);
  }

  Future<void> recover(String email) async {
    _decode(await _http.post(
      _u('/auth/v1/recover', {'redirect_to': CloudConfig.redirect}),
      headers: _headers(),
      body: jsonEncode({'email': email}),
    ));
  }

  /// Adresse à ouvrir dans le navigateur pour « Continuer avec Google / Facebook ».
  Uri oauthUrl(String provider, Pkce pkce) => _u('/auth/v1/authorize', {
        'provider': provider,
        'redirect_to': CloudConfig.redirect,
        'code_challenge': pkce.challenge,
        'code_challenge_method': 's256',
      });

  /// Échange le code reçu au retour du navigateur contre une session.
  Future<Session> exchangeCode(String code, String verifier) async {
    final r = await _http.post(
      _u('/auth/v1/token', {'grant_type': 'pkce'}),
      headers: _headers(),
      body: jsonEncode({'auth_code': code, 'code_verifier': verifier}),
    );
    return Session.fromToken(_decode(r) as Map<String, dynamic>);
  }

  /// Lien de confirmation d'e-mail : les jetons arrivent dans le fragment de l'adresse.
  Future<Session> sessionFromTokens(String access, String refresh) async {
    final u = _decode(await _http.get(_u('/auth/v1/user'), headers: _headers(token: access))) as Map<String, dynamic>;
    return Session.fromToken({'access_token': access, 'refresh_token': refresh, 'user': u});
  }

  Future<Session> refresh(Session s) async {
    final r = await _http.post(
      _u('/auth/v1/token', {'grant_type': 'refresh_token'}),
      headers: _headers(),
      body: jsonEncode({'refresh_token': s.refresh}),
    );
    return Session.fromToken(_decode(r) as Map<String, dynamic>);
  }

  Future<void> signOut(Session s) async {
    try {
      await _http.post(_u('/auth/v1/logout', {'scope': 'local'}), headers: _headers(token: s.access));
    } catch (_) {
      // Hors ligne : la déconnexion locale suffit, le jeton expirera.
    }
  }

  // ---------------------------------------------------------------- données (schéma comima)

  /// Profil COMIMa du compte, ou null s'il n'existe pas encore.
  Future<Map<String, dynamic>?> myProfile(Session s) async {
    final rows = _decode(await _http.get(
      _u('/rest/v1/profiles', {'id': 'eq.${s.userId}', 'select': '*'}),
      headers: _headers(token: s.access, schema: true),
    )) as List;
    return rows.isEmpty ? null : (rows.first as Map).cast<String, dynamic>();
  }

  /// Crée ou met à jour le profil (le rôle n'est jamais modifiable par ce chemin).
  Future<Map<String, dynamic>> register(Session s, Map<String, dynamic> p) async {
    final r = await _http.post(
      _u('/rest/v1/rpc/register'),
      headers: _headers(token: s.access, schema: true),
      body: jsonEncode({
        'p_display_name': p['name'],
        'p_birth_year': p['birthYear'],
        'p_school': p['school'],
        'p_region': p['region'],
        'p_centre_id': p['centre'] == 'aucun' ? null : p['centre'],
        'p_requested_role': p['role'] == 'encadreur' ? 'encadreur' : 'eleve',
      }),
    );
    return (_decode(r) as Map).cast<String, dynamic>();
  }

  /// Signale la version de l'application (statistiques d'usage, 1.1.0). Rien d'autre n'est envoyé : ni position ni appareil.
  Future<void> touch(Session s, String appVersion) async {
    _decode(await _http.post(
      _u('/rest/v1/rpc/touch'),
      headers: _headers(token: s.access, schema: true),
      body: jsonEncode({'p_app_version': appVersion}),
    ));
  }

  /// Envoie des réponses ; celles déjà connues du serveur (même identifiant) sont ignorées.
  Future<void> pushAttempts(Session s, List<Map<String, dynamic>> rows) async {
    if (rows.isEmpty) return;
    _decode(await _http.post(
      _u('/rest/v1/attempts', {'on_conflict': 'id'}),
      headers: _headers(token: s.access, schema: true, extra: {'Prefer': 'resolution=ignore-duplicates,return=minimal'}),
      body: jsonEncode(rows),
    ));
  }

  /// Toutes les réponses du compte (par pages), pour retrouver sa progression sur un autre téléphone.
  Future<List<Map<String, dynamic>>> pullAttempts(Session s, {int page = 1000}) async {
    final out = <Map<String, dynamic>>[];
    for (var from = 0;; from += page) {
      final rows = _decode(await _http.get(
        _u('/rest/v1/attempts', {
          'user_id': 'eq.${s.userId}',
          'select': 'id,question_id,notion_id,theme,qtype,difficulty,ok,duration_ms,answered_at',
          'order': 'answered_at.asc',
        }),
        headers: _headers(token: s.access, schema: true, extra: {'Range-Unit': 'items', 'Range': '$from-${from + page - 1}'}),
      )) as List;
      out.addAll(rows.cast<Map<String, dynamic>>());
      if (rows.length < page) return out;
    }
  }

  /// Envoie des marque-pages ; pour un élément déjà connu, le serveur garde le plus récent.
  Future<void> pushMarks(Session s, List<Map<String, dynamic>> rows) async {
    if (rows.isEmpty) return;
    _decode(await _http.post(
      _u('/rest/v1/marks', {'on_conflict': 'user_id,item'}),
      headers: _headers(token: s.access, schema: true, extra: {'Prefer': 'resolution=merge-duplicates,return=minimal'}),
      body: jsonEncode(rows),
    ));
  }

  /// Tous les marque-pages du compte (par pages).
  Future<List<Map<String, dynamic>>> pullMarks(Session s, {int page = 1000}) async {
    final out = <Map<String, dynamic>>[];
    for (var from = 0;; from += page) {
      final rows = _decode(await _http.get(
        _u('/rest/v1/marks', {'user_id': 'eq.${s.userId}', 'select': 'item,status,starred,updated_at', 'order': 'item.asc'}),
        headers: _headers(token: s.access, schema: true, extra: {'Range-Unit': 'items', 'Range': '$from-${from + page - 1}'}),
      )) as List;
      out.addAll(rows.cast<Map<String, dynamic>>());
      if (rows.length < page) return out;
    }
  }

  // ---------------------------------------------------------------- groupes (vue encadreur)

  /// Groupes que le compte encadre ou a rejoints, avec leurs membres visibles (l'encadreur voit tous
  /// ses élèves ; un élève ne voit que lui-même).
  Future<List<Map<String, dynamic>>> myGroups(Session s) async {
    final rows = _decode(await _http.get(
      _u('/rest/v1/groups', {'select': 'id,name,join_code,coach_id,group_members(user_id,profiles(display_name))', 'order': 'created_at.asc'}),
      headers: _headers(token: s.access, schema: true),
    )) as List;
    return rows.cast<Map<String, dynamic>>();
  }

  Future<void> createGroup(Session s, String name) async {
    _decode(await _http.post(
      _u('/rest/v1/groups'),
      headers: _headers(token: s.access, schema: true, extra: {'Prefer': 'return=minimal'}),
      body: jsonEncode({'name': name, 'coach_id': s.userId}),
    ));
  }

  /// Rejoint un groupe avec le code de l'encadreur ; renvoie le nom du groupe.
  Future<String> joinGroup(Session s, String code) async {
    final rows = _decode(await _http.post(
      _u('/rest/v1/rpc/join_group'),
      headers: _headers(token: s.access, schema: true),
      body: jsonEncode({'p_code': code}),
    ));
    final r = rows is List && rows.isNotEmpty ? rows.first : rows;
    return (r is Map ? r['name'] : '').toString();
  }

  Future<void> leaveGroup(Session s, String groupId) async {
    _decode(await _http.delete(
      _u('/rest/v1/group_members', {'group_id': 'eq.$groupId', 'user_id': 'eq.${s.userId}'}),
      headers: _headers(token: s.access, schema: true),
    ));
  }

  /// Nouveau code d'invitation : l'ancien cesse de marcher.
  Future<String> renewGroupCode(Session s, String groupId) async {
    final r = _decode(await _http.post(
      _u('/rest/v1/rpc/renew_group_code'),
      headers: _headers(token: s.access, schema: true),
      body: jsonEncode({'p_group': groupId}),
    ));
    return r.toString();
  }

  /// Marque-pages d'élèves (réservé à leur encadreur : règles d'accès côté serveur).
  Future<List<Map<String, dynamic>>> marksOf(Session s, List<String> userIds, {int page = 1000}) async {
    if (userIds.isEmpty) return const [];
    final out = <Map<String, dynamic>>[];
    for (var from = 0;; from += page) {
      final rows = _decode(await _http.get(
        _u('/rest/v1/marks', {'user_id': 'in.(${userIds.join(',')})', 'select': 'user_id,item,status,starred,updated_at', 'order': 'updated_at.desc'}),
        headers: _headers(token: s.access, schema: true, extra: {'Range-Unit': 'items', 'Range': '$from-${from + page - 1}'}),
      )) as List;
      out.addAll(rows.cast<Map<String, dynamic>>());
      if (rows.length < page) return out;
    }
  }

  /// Supprime le profil COMIMa en ligne (et ses réponses). Le compte de connexion, partagé avec
  /// d'autres applications, n'est pas touché.
  Future<void> deleteMyProfile(Session s) async {
    _decode(await _http.delete(_u('/rest/v1/profiles', {'id': 'eq.${s.userId}'}), headers: _headers(token: s.access, schema: true)));
  }
}
