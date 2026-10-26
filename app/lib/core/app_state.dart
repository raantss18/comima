import 'dart:async';
import 'dart:ui';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:url_launcher/url_launcher.dart';

import 'cloud.dart';
import 'content.dart';
import 'progress.dart';
import 'reminders.dart';
import 'sync.dart';
import 'updater.dart';

class AppState extends ChangeNotifier {
  final content = ContentStore();
  final progress = ProgressStore();
  final updater = Updater();
  final reminders = Reminders();

  /// Comptes (facultatifs) : désactivés si l'URL du projet n'a pas été fournie à la compilation.
  late final cloud = Cloud(const CloudConfig());
  late final sync = Sync(cloud, progress);
  bool get accountsEnabled => cloud.config.enabled;

  /// Profil en cours de connexion et secret PKCE de la demande en cours.
  String? _pendingProfile;
  Pkce? _pendingPkce;
  final syncing = <String>{};

  /// Ce que le serveur permet (rafraîchi au plus toutes les 10 minutes).
  CloudStatus cloudStatus = CloudStatus.unknown;
  DateTime? _statusAt;
  bool get accountsReady => accountsEnabled && cloudStatus.ready;

  Future<CloudStatus> refreshCloudStatus({bool force = false}) async {
    if (!accountsEnabled) return cloudStatus;
    final at = _statusAt;
    if (!force && at != null && DateTime.now().difference(at) < const Duration(minutes: 10) && cloudStatus.reachable) return cloudStatus;
    _statusAt = DateTime.now();
    cloudStatus = await cloud.status();
    notifyListeners();
    return cloudStatus;
  }

  // ---------------------------------------------------------------- mise à jour de l'application

  /// Nouvelle version trouvée (null = à jour). Vérifiée au démarrage et au retour dans
  /// l'application, au plus toutes les 6 heures.
  AppRelease? availableUpdate;
  DateTime? _updateCheckedAt;

  Future<void> checkUpdate({bool force = false}) async {
    final at = _updateCheckedAt;
    if (!force && at != null && DateTime.now().difference(at) < const Duration(hours: 6)) return;
    _updateCheckedAt = DateTime.now();
    availableUpdate = await updater.check();
    notifyListeners();
  }

  /// Proposer la mise à jour maintenant ? Oui sauf si l'élève a dit « plus tard » pour cette
  /// version il y a moins de 24 h ; une mise à jour obligatoire est toujours proposée.
  bool get shouldPromptUpdate {
    final r = availableUpdate;
    if (r == null) return false;
    if (r.mandatory) return true;
    final until = DateTime.tryParse(progress.pref('updateSnoozeUntil') ?? '');
    return !(progress.pref('updateSnoozeBuild') == '${r.build}' && until != null && until.isAfter(DateTime.now()));
  }

  Future<void> snoozeUpdate() async {
    final r = availableUpdate;
    if (r == null) return;
    await progress.setPref('updateSnoozeBuild', '${r.build}');
    await progress.setPref('updateSnoozeUntil', DateTime.now().add(const Duration(hours: 24)).toIso8601String());
  }

  /// Dernier message de connexion à montrer à l'élève (code de i18n), puis effacé.
  String? accountMessage;
  static const _system = MethodChannel('mg.comima.app/system');
  Timer? _syncTimer;

  String get lang => progress.lang ?? (PlatformDispatcher.instance.locale.languageCode == 'en' ? 'en' : 'fr');

  set lang(String v) {
    progress.lang = v;
    notifyListeners();
  }

  Future<void> init() async {
    await Future.wait([content.load(), progress.load(), updater.init()]);
    if (accountsEnabled) {
      // Retour du navigateur (Google, Facebook) ou du lien de confirmation e-mail.
      _system.setMethodCallHandler((call) async {
        if (call.method == 'deepLink') await handleLink(Uri.parse(call.arguments as String));
      });
      final pending = await _system.invokeMethod<String>('takeLink').catchError((_) => null);
      if (pending != null) unawaited(handleLink(Uri.parse(pending)));
      unawaited(refreshCloudStatus());
      final id = progress.current?['id'] as String?;
      if (id != null && progress.authOf(id) != null) unawaited(syncProfile(id));
    }
  }

  // ---------------------------------------------------------------- comptes et synchronisation

  void _say(String code) {
    accountMessage = code;
    notifyListeners();
  }

  /// Ouvre Google ou Facebook dans le navigateur ; le retour arrive par [handleLink].
  Future<bool> startOAuth(String profileId, String provider) async {
    _pendingProfile = profileId;
    _pendingPkce = Pkce.create();
    return launchUrl(cloud.oauthUrl(provider, _pendingPkce!), mode: LaunchMode.externalApplication);
  }

  Future<void> handleLink(Uri u) async {
    final profileId = _pendingProfile ?? progress.current?['id'] as String?;
    if (profileId == null) return;
    try {
      final frag = u.fragment.isEmpty ? <String, String>{} : Uri.splitQueryString(u.fragment);
      Session? s;
      if (u.queryParameters['code'] != null && _pendingPkce != null) {
        s = await cloud.exchangeCode(u.queryParameters['code']!, _pendingPkce!.verifier);
      } else if (frag['access_token'] != null && frag['refresh_token'] != null) {
        s = await cloud.sessionFromTokens(frag['access_token']!, frag['refresh_token']!); // e-mail confirmé
      } else if ((u.queryParameters['error_description'] ?? frag['error_description']) != null) {
        _say('login_cancelled');
        return;
      }
      _pendingPkce = null;
      _pendingProfile = null;
      if (s == null) return;
      if (!await sync.signIn(profileId, s)) {
        _say('other_account');
        return;
      }
      _say('signed_in');
      await syncProfile(profileId);
    } on CloudException catch (_) {
      _say('login_failed');
    } catch (_) {
      _say('offline');
    }
  }

  /// Connexion par e-mail ; renvoie un code de message (null = connecté).
  Future<String?> signInEmail(String profileId, String email, String password) async {
    try {
      final s = await cloud.signIn(email.trim(), password);
      if (!await sync.signIn(profileId, s)) return 'other_account';
      unawaited(syncProfile(profileId));
      return null;
    } on CloudException catch (e) {
      return e.emailDisabled ? 'email_disabled' : (e.notConfirmed ? 'not_confirmed' : (e.invalidLogin ? 'bad_login' : 'login_failed'));
    } catch (_) {
      return 'offline';
    }
  }

  /// Création de compte ; renvoie 'check_mail' si l'e-mail doit d'abord être confirmé.
  Future<String?> signUpEmail(String profileId, String email, String password) async {
    try {
      final name = progress.profile(profileId)?['name'] as String?;
      final s = await cloud.signUp(email.trim(), password, displayName: name);
      if (s == null) return 'check_mail';
      if (!await sync.signIn(profileId, s)) return 'other_account';
      unawaited(syncProfile(profileId));
      return null;
    } on CloudException catch (e) {
      return e.emailDisabled ? 'email_disabled' : (e.exists ? 'exists' : 'login_failed');
    } catch (_) {
      return 'offline';
    }
  }

  Future<String?> recoverPassword(String email) async {
    try {
      await cloud.recover(email.trim());
      return 'check_mail';
    } catch (_) {
      return 'offline';
    }
  }

  Future<SyncResult> syncProfile(String profileId) async {
    if (!accountsEnabled || syncing.contains(profileId)) return SyncResult.ok;
    syncing.add(profileId);
    notifyListeners();
    final r = await sync.run(profileId);
    syncing.remove(profileId);
    notifyListeners();
    return r;
  }

  /// Envoi discret après une série de questions (regroupe les appels rapprochés).
  void syncSoon() {
    final id = progress.current?['id'] as String?;
    if (!accountsEnabled || id == null || progress.authOf(id) == null) return;
    _syncTimer?.cancel();
    _syncTimer = Timer(const Duration(seconds: 20), () => syncProfile(id));
  }

  Future<void> signOutProfile(String profileId) async {
    await sync.signOut(profileId);
    notifyListeners();
  }

  /// Supprime le profil COMIMa en ligne (le compte de connexion, partagé avec d'autres
  /// applications du projet, reste). Les données locales ne sont pas touchées.
  Future<bool> deleteOnline(String profileId) async {
    try {
      final s = await sync.session(profileId);
      if (s == null) return false;
      await cloud.deleteMyProfile(s);
      await sync.signOut(profileId);
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Exécute un appel au serveur avec la session du profil ; null si le profil n'est pas connecté.
  Future<T?> withSession<T>(String profileId, Future<T> Function(Cloud cloud, Session session) f) async {
    final s = await sync.session(profileId);
    if (s == null) return null;
    return f(cloud, s);
  }

  Future<UpdateResult> updateContent() async {
    final r = await content.update();
    notifyListeners();
    return r;
  }

  Future<int> record(Map<String, dynamic> q, bool ok, {String? notion, String? theme, int? ms}) async {
    final gain = await progress.record(q, ok, notion: notion, theme: theme, ms: ms);
    syncSoon();
    if (Reminders.trainedToday(progress)) reminders.reschedule(progress, lang); // pas de rappel aujourd'hui
    notifyListeners();
    return gain;
  }

  /// Marque-page d'un exercice, sujet ou cours (voir [ProgressStore.markKey]) ; synchronisé discrètement.
  Future<void> setMark(String item, {required String? status, required bool starred}) async {
    await progress.setMark(item, status: status, starred: starred);
    syncSoon();
    notifyListeners();
  }

  Future<void> setReminders(Map<String, dynamic> r) async {
    await progress.setReminders(r);
    await reminders.reschedule(progress, lang);
    notifyListeners();
  }

  Future<void> addProfile(Map<String, dynamic> info) async {
    await progress.addProfile(info);
    notifyListeners();
  }

  Future<void> updateProfile(String id, Map<String, dynamic> info) async {
    await progress.updateProfile(id, info);
    notifyListeners();
  }

  Future<bool> deleteProfile(String id) async {
    final ok = await progress.deleteProfile(id);
    notifyListeners();
    return ok;
  }

  Future<void> selectProfile(String id) async {
    await progress.select(id);
    notifyListeners();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  /// Sans abonnement aux changements (utilisable dans `initState` et les gestionnaires d'événements).
  static AppState read(BuildContext context) => context.getInheritedWidgetOfExactType<AppScope>()!.notifier!;

  static AppState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
