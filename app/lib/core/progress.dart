import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:path_provider/path_provider.dart';

import 'content.dart';
import 'uuid.dart';

/// Profils (téléphones partagés) et progression, enregistrés localement dans un fichier JSON
/// écrit de façon atomique. Le compte (facultatif) synchronise le journal avec le serveur :
/// chaque réponse porte un identifiant unique et un indicateur « envoyée » (`s`).
class ProgressStore {
  /// Version du format des données locales. Pour la changer : ajouter une migration
  /// `schema - 1 → schema` dans [_migrations] (jamais modifier une migration publiée), afin
  /// qu'une installation de la toute première version passe d'un coup à la plus récente.
  static const schema = 4;
  static final Map<int, void Function(Map<String, dynamic>)> _migrations = {
    // 0 → 1 : fichier sans numéro de schéma (aucune version publiée ne l'a produit).
    0: (d) {
      d['profiles'] ??= <dynamic>[];
    },
    // 1 → 2 (version 0.2.0) : journal d'entraînement (statistiques) et réglages des rappels.
    1: (d) {
      for (final p in (d['profiles'] as List).cast<Map<String, dynamic>>()) {
        // Les réponses déjà données en 0.1.0 alimentent le journal (dernier résultat connu).
        final answers = (p['answers'] as Map?)?.cast<String, dynamic>() ?? {};
        p['log'] ??= [
          for (final e in answers.entries)
            {'q': e.key, 'ok': (e.value as Map)['ok'] == true, 't': (e.value as Map)['t'] ?? DateTime.now().toIso8601String()},
        ];
      }
      d['reminders'] ??= <String, dynamic>{};
    },
    // 2 → 3 (version 0.3.0) : identifiant unique de chaque réponse (envoi idempotent au serveur),
    // indicateur « envoyée », profils à envoyer.
    2: (d) {
      for (final p in (d['profiles'] as List).cast<Map<String, dynamic>>()) {
        for (final e in ((p['log'] as List?) ?? const []).cast<Map<String, dynamic>>()) {
          e['id'] ??= newUuid();
          e['s'] ??= false;
        }
        p['dirty'] ??= true;
      }
    },
    // 3 → 4 (version 0.6.0) : marque-pages (lu, testé, à continuer, fait, étoile) par profil.
    3: (d) {
      for (final p in (d['profiles'] as List).cast<Map<String, dynamic>>()) {
        p['marks'] ??= <String, dynamic>{};
      }
    },
  };

  // ignore: prefer_initializing_formals
  ProgressStore({Directory? dir}) : _dir = dir;

  final Directory? _dir;

  Map<String, dynamic> _data = {
    'schema': schema,
    'profiles': <dynamic>[],
    'current': null,
    'lang': null,
    'reminders': <String, dynamic>{},
  };
  late File _file;
  bool _readOnly = false;

  Future<void> load() async {
    final dir = _dir ?? await getApplicationSupportDirectory();
    _file = File('${dir.path}/progress.json');
    for (final f in [_file, File('${_file.path}.tmp')]) {
      try {
        if (f.existsSync()) {
          final d = jsonDecode(await f.readAsString()) as Map<String, dynamic>;
          var v = (d['schema'] as int?) ?? 0;
          if (v > schema) {
            _readOnly = true; // données d'une version plus récente : ne rien écraser
            continue;
          }
          final migrated = v < schema;
          while (v < schema) {
            _migrations[v]!(d);
            d['schema'] = ++v;
          }
          _data = d;
          if (migrated) {
            await File('${_file.path}.bak').writeAsString(await f.readAsString());
            await _save();
          }
          return;
        }
      } catch (_) {}
    }
  }

  Future<void> _save() async {
    if (_readOnly) return;
    final tmp = File('${_file.path}.tmp');
    await tmp.writeAsString(jsonEncode(_data), flush: true);
    await tmp.rename(_file.path);
  }

  String? get lang => _data['lang'] as String?;
  set lang(String? v) {
    _data['lang'] = v;
    _save();
  }

  List<Map<String, dynamic>> get profiles => (_data['profiles'] as List).cast<Map<String, dynamic>>();

  Map<String, dynamic>? profile(String id) {
    for (final p in profiles) {
      if (p['id'] == id) return p;
    }
    return null;
  }

  Map<String, dynamic>? get current {
    final id = _data['current'];
    for (final p in profiles) {
      if (p['id'] == id) return p;
    }
    return profiles.isEmpty ? null : profiles.first;
  }

  /// Informations d'inscription : name, birthYear, school, region, centre.
  Future<void> addProfile(Map<String, dynamic> info) async {
    final id = '${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(1 << 32)}';
    profiles.add({...info, 'id': id, 'xp': 0, 'answers': <String, dynamic>{}, 'log': <dynamic>[], 'marks': <String, dynamic>{}, 'dirty': true});
    _data['current'] = id;
    await _save();
  }

  Future<void> updateProfile(String id, Map<String, dynamic> info) async {
    for (final p in profiles) {
      if (p['id'] == id) p.addAll({...info, 'dirty': true});
    }
    await _save();
  }

  /// Supprime un profil et toute sa progression (le dernier profil ne peut pas l'être).
  Future<bool> deleteProfile(String id) async {
    if (profiles.length <= 1) return false;
    profiles.removeWhere((p) => p['id'] == id);
    if (_data['current'] == id) _data['current'] = profiles.first['id'];
    await _save();
    return true;
  }

  /// Petites préférences de l'application (rappel de mise à jour reporté, etc.).
  String? pref(String key) => ((_data['prefs'] as Map?)?[key]) as String?;

  Future<void> setPref(String key, String? value) async {
    final m = (_data['prefs'] ??= <String, dynamic>{}) as Map<String, dynamic>;
    if (value == null) {
      m.remove(key);
    } else {
      m[key] = value;
    }
    await _save();
  }

  Map<String, dynamic> get reminders => (_data['reminders'] as Map<String, dynamic>?) ?? {};

  Future<void> setReminders(Map<String, dynamic> r) async {
    _data['reminders'] = r;
    await _save();
  }

  /// Journal des réponses du profil courant (le plus ancien d'abord), pour les statistiques.
  List<Map<String, dynamic>> get log => ((current?['log'] as List?) ?? const []).cast<Map<String, dynamic>>();

  Future<void> select(String id) async {
    _data['current'] = id;
    await _save();
  }

  int get xp => (current?['xp'] as int?) ?? 0;

  /// XP au début du niveau courant et du suivant (niveau L : 100·(L−1)² XP).
  int get xpLevelStart => 100 * (level - 1) * (level - 1);
  int get xpLevelEnd => 100 * level * level;

  /// Jours consécutifs avec au moins une réponse (aujourd'hui compte s'il y en a une, sinon on
  /// repart d'hier : la série n'est pas perdue tant que la journée n'est pas finie).
  int get streak {
    final days = <DateTime>{};
    for (final e in log) {
      final d = DateTime.tryParse(e['t'] as String? ?? '')?.toLocal();
      if (d != null) days.add(DateTime(d.year, d.month, d.day));
    }
    final now = DateTime.now();
    var d = DateTime(now.year, now.month, now.day);
    if (!days.contains(d)) d = d.subtract(const Duration(days: 1));
    var n = 0;
    while (days.contains(d)) {
      n++;
      d = d.subtract(const Duration(days: 1));
    }
    return n;
  }

  /// Niveau du joueur : 100 XP pour passer le niveau 1, puis de plus en plus.
  int get level => 1 + sqrt(xp / 100).floor();

  Map<String, dynamic> get _answers => (current?['answers'] as Map<String, dynamic>?) ?? {};

  bool? lastResult(String qid) => (_answers[qid] as Map?)?['ok'] as bool?;

  /// Enregistre une réponse corrigée ; renvoie les XP gagnés (premier succès seulement).
  Future<int> record(Map<String, dynamic> q, bool ok, {String? notion, String? theme, int? ms}) async {
    final p = current;
    if (p == null) return 0;
    final id = q['id'] as String;
    final prev = _answers[id] as Map<String, dynamic>?;
    final firstSuccess = ok && !((prev?['best'] as bool?) ?? false);
    final gain = firstSuccess ? 10 * (q['difficulte'] as int) : 0;
    (p['answers'] as Map<String, dynamic>)[id] = {
      'ok': ok,
      'best': ok || ((prev?['best'] as bool?) ?? false),
      'n': ((prev?['n'] as int?) ?? 0) + 1,
      't': DateTime.now().toUtc().toIso8601String(),
    };
    p['xp'] = xp + gain;
    final log = (p['log'] ??= <dynamic>[]) as List;
    log.add({
      'id': newUuid(),
      's': false,
      'q': id,
      'ok': ok,
      't': DateTime.now().toIso8601String(),
      'type': q['type'],
      'd': q['difficulte'],
      'n': ?notion,
      'th': ?theme,
      'ms': ?ms,
    });
    if (log.length > 5000) log.removeRange(0, log.length - 5000); // fichier borné
    await _save();
    return gain;
  }

  static bool autoGraded(Map<String, dynamic> q) => !['code', 'simulation', 'preuve'].contains(q['type']);

  /// Part des questions corrigées automatiquement dont la dernière réponse est juste.
  double mastery(Iterable<Map<String, dynamic>> qs) {
    final graded = qs.where(autoGraded).toList();
    if (graded.isEmpty) return 0;
    return graded.where((q) => lastResult(q['id'] as String) == true).length / graded.length;
  }

  double notionMastery(Notion n) => mastery(n.questions);

  bool stepMastered(Notion n, int etape) => mastery(n.questions.where((q) => q['difficulte'] == etape)) >= 0.8;

  // ------------------------------------------------------------------ compte et synchronisation

  /// Session du compte lié à un profil : {userId, email, access, refresh, exp, lastSync}, ou null.
  Map<String, dynamic>? authOf(String id) => (profile(id)?['auth'] as Map?)?.cast<String, dynamic>();

  Future<void> setAuth(String id, Map<String, dynamic>? auth) async {
    final p = profile(id);
    if (p == null) return;
    if (auth == null) {
      p.remove('auth');
    } else {
      p['auth'] = auth;
    }
    await _save();
  }

  /// Lie le profil à un compte (une fois pour toutes : un profil ne change pas de compte,
  /// pour ne jamais mélanger les données de deux personnes).
  Future<void> linkAccount(String id, String userId) async {
    profile(id)?['accountId'] = userId;
    await _save();
  }

  Future<void> clearDirty(String id) async {
    profile(id)?['dirty'] = false;
    await _save();
  }

  /// Réponses pas encore envoyées au serveur, les plus anciennes d'abord.
  List<Map<String, dynamic>> unsynced(String id, {int limit = 200}) {
    final log = ((profile(id)?['log'] as List?) ?? const []).cast<Map<String, dynamic>>();
    return log.where((e) => e['s'] != true).take(limit).toList();
  }

  Future<void> markSynced(String id, Iterable<String> entryIds) async {
    final ids = entryIds.toSet();
    for (final e in ((profile(id)?['log'] as List?) ?? const []).cast<Map<String, dynamic>>()) {
      if (ids.contains(e['id'])) e['s'] = true;
    }
    await _save();
  }

  // ------------------------------------------------------------------ marque-pages

  /// États d'un marque-page (l'absence d'état = « pas encore vu », donc « non fait »).
  static const markStatuses = ['lu', 'teste', 'continuer', 'fait'];

  /// Clé d'un élément des bibliothèques : `exo:<id>`, `cours:<id>`, `sujet:<id>` (comme sur le site).
  static String markKey(String kind, Object? id) => '$kind:$id';

  Map<String, dynamic> get _marks => (current?['marks'] as Map<String, dynamic>?) ?? {};

  String? markStatus(String item) => (_marks[item] as Map?)?['st'] as String?;

  bool markStarred(String item) => (_marks[item] as Map?)?['star'] == true;

  /// Nombre d'éléments par état (et `star` pour les étoiles), pour les statistiques.
  Map<String, int> get markCounts {
    final out = <String, int>{};
    for (final m in _marks.values.cast<Map<String, dynamic>>()) {
      final st = m['st'] as String?;
      if (st != null) out[st] = (out[st] ?? 0) + 1;
      if (m['star'] == true) out['star'] = (out['star'] ?? 0) + 1;
    }
    return out;
  }

  /// Pose un marque-page (valeurs absolues : état [status] ou aucun, étoile [starred]).
  Future<void> setMark(String item, {required String? status, required bool starred}) async {
    final p = current;
    if (p == null) return;
    if (status != null && !markStatuses.contains(status)) return;
    final marks = (p['marks'] ??= <String, dynamic>{}) as Map<String, dynamic>;
    marks[item] = {'st': status, 'star': starred, 't': DateTime.now().toUtc().toIso8601String(), 's': false};
    await _save();
  }

  /// Marque-pages pas encore envoyés au serveur.
  List<MapEntry<String, Map<String, dynamic>>> unsyncedMarks(String id, {int limit = 500}) {
    final marks = (profile(id)?['marks'] as Map?)?.cast<String, dynamic>() ?? const {};
    return [
      for (final e in marks.entries)
        if ((e.value as Map)['s'] != true) MapEntry(e.key, (e.value as Map).cast<String, dynamic>()),
    ].take(limit).toList();
  }

  /// Marque comme envoyés ceux qui n'ont pas été modifiés depuis l'envoi (même date `t`).
  Future<void> markMarksSynced(String id, Iterable<MapEntry<String, Map<String, dynamic>>> sent) async {
    final marks = (profile(id)?['marks'] as Map?)?.cast<String, dynamic>() ?? const {};
    for (final e in sent) {
      final cur = marks[e.key] as Map<String, dynamic>?;
      if (cur != null && cur['t'] == e.value['t']) cur['s'] = true;
    }
    await _save();
  }

  /// Fusionne les marque-pages du serveur : pour chaque élément, **le plus récent gagne**.
  /// Renvoie le nombre d'éléments mis à jour sur ce téléphone.
  Future<int> mergeRemoteMarks(String id, List<Map<String, dynamic>> rows) async {
    final p = profile(id);
    if (p == null) return 0;
    final marks = (p['marks'] ??= <String, dynamic>{}) as Map<String, dynamic>;
    var n = 0;
    for (final r in rows) {
      final item = r['item'] as String?;
      final when = DateTime.tryParse(r['updated_at'] as String? ?? '')?.toUtc();
      if (item == null || when == null) continue;
      final local = marks[item] as Map<String, dynamic>?;
      final localWhen = local == null ? null : DateTime.tryParse(local['t'] as String? ?? '')?.toUtc();
      if (localWhen != null && !when.isAfter(localWhen)) continue; // le téléphone est plus récent (ou égal)
      final st = r['status'] as String?;
      marks[item] = {
        'st': markStatuses.contains(st) ? st : null,
        'star': r['starred'] == true,
        't': when.toIso8601String(),
        's': true,
      };
      n++;
    }
    if (n > 0) await _save();
    return n;
  }

  /// Reprend le profil enregistré sur le serveur (nouveau téléphone, même compte).
  Future<void> adoptServerProfile(String id, Map<String, dynamic> row) async {
    final p = profile(id);
    if (p == null) return;
    p['name'] = row['display_name'] ?? p['name'];
    p['birthYear'] = row['birth_year'];
    p['school'] = row['school'];
    p['region'] = row['region'];
    p['centre'] = row['centre_id'];
    p['serverRole'] = row['role'];
    if (row['role'] == 'encadreur' || row['role'] == 'admin') p['role'] = 'encadreur';
    p['dirty'] = false;
    await _save();
  }

  Future<void> setServerRole(String id, String? role) async {
    profile(id)?['serverRole'] = role;
    await _save();
  }

  /// Fusionne les réponses du serveur absentes de ce téléphone dans le journal, puis met à jour
  /// les dernières réponses, les meilleures et les XP comme si elles avaient été données ici.
  /// Renvoie le nombre de réponses ajoutées.
  Future<int> mergeRemote(String id, List<Map<String, dynamic>> rows) async {
    final p = profile(id);
    if (p == null) return 0;
    final log = (p['log'] ??= <dynamic>[]) as List;
    final known = {for (final e in log.cast<Map<String, dynamic>>()) e['id']};
    final fresh = rows.where((r) => !known.contains(r['id'])).toList()
      ..sort((a, b) => DateTime.parse(a['answered_at'] as String).compareTo(DateTime.parse(b['answered_at'] as String)));
    final answers = (p['answers'] ??= <String, dynamic>{}) as Map<String, dynamic>;
    var xp = (p['xp'] as int?) ?? 0;
    for (final r in fresh) {
      final q = r['question_id'] as String;
      final ok = r['ok'] == true;
      final when = DateTime.parse(r['answered_at'] as String).toUtc();
      final prev = answers[q] as Map<String, dynamic>?;
      final prevBest = (prev?['best'] as bool?) ?? false;
      final prevWhen = prev == null ? null : DateTime.tryParse(prev['t'] as String? ?? '')?.toUtc();
      if (ok && !prevBest) xp += 10 * ((r['difficulty'] as int?) ?? 1);
      answers[q] = {
        'ok': prevWhen != null && prevWhen.isAfter(when) ? prev!['ok'] : ok,
        'best': ok || prevBest,
        'n': ((prev?['n'] as int?) ?? 0) + 1,
        't': prevWhen != null && prevWhen.isAfter(when) ? prev!['t'] : when.toIso8601String(),
      };
      log.add({
        'id': r['id'],
        's': true,
        'q': q,
        'ok': ok,
        't': when.toIso8601String(),
        'type': r['qtype'],
        'd': r['difficulty'],
        'n': ?r['notion_id'],
        'th': ?r['theme'],
        'ms': ?r['duration_ms'],
      });
    }
    if (fresh.isNotEmpty) {
      log.sort((a, b) => DateTime.parse(a['t'] as String).compareTo(DateTime.parse(b['t'] as String)));
      if (log.length > 5000) log.removeRange(0, log.length - 5000);
      p['xp'] = xp;
      await _save();
    }
    return fresh.length;
  }
}
