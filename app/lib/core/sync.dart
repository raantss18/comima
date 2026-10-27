import 'dart:async';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'cloud.dart';
import 'progress.dart';

enum SyncResult { ok, offline, signedOut, failed }

/// Synchronisation d'un profil avec son compte : profil, puis réponses.
///
/// Principes :
///  - le téléphone reste la référence tant qu'il est hors ligne : rien n'est jamais bloqué ;
///  - chaque réponse a un identifiant unique : renvoyer deux fois ne crée aucun doublon ;
///  - nouveau téléphone, même compte : le profil et les réponses du serveur sont repris AVANT
///    d'envoyer quoi que ce soit, pour ne pas écraser de bonnes données par un profil vide.
class Sync {
  Sync(this.cloud, this.store);

  final Cloud cloud;
  final ProgressStore store;

  /// Version de l'application (ex. « 1.1.0 »), signalée au serveur à chaque synchronisation.
  String appVersion = '';

  /// Session valide du profil (renouvelée si besoin), ou null.
  Future<Session?> session(String profileId) async {
    final j = store.authOf(profileId);
    if (j == null) return null;
    var s = Session.fromJson(j);
    if (s.expiresSoon) {
      try {
        s = await cloud.refresh(s);
        await store.setAuth(profileId, {...j, ...s.toJson()});
      } on CloudException catch (e) {
        if (e.unauthorized || e.status == 400) {
          await store.setAuth(profileId, null); // renouvellement refusé : déconnecté
          return null;
        }
        rethrow;
      }
    }
    return s;
  }

  /// Enregistre la session. Refuse un compte différent de celui déjà lié au profil : les
  /// données de deux personnes ne doivent jamais se mélanger sur un profil.
  Future<bool> signIn(String profileId, Session s) async {
    final linked = store.profile(profileId)?['accountId'];
    if (linked != null && linked != s.userId) return false;
    await store.setAuth(profileId, s.toJson());
    return true;
  }

  Future<void> signOut(String profileId) async {
    final s = await session(profileId).catchError((_) => null);
    if (s != null) await cloud.signOut(s);
    await store.setAuth(profileId, null);
  }

  Future<SyncResult> run(String profileId) async {
    final p = store.profile(profileId);
    if (p == null) return SyncResult.failed;
    try {
      final s = await session(profileId);
      if (s == null) return SyncResult.signedOut;

      // 1. Profil : reprendre celui du serveur s'il existe, sinon envoyer le nôtre.
      final remote = await cloud.myProfile(s);
      if (remote != null && p['accountId'] == null) {
        await store.adoptServerProfile(profileId, remote);
      } else if (remote == null || p['dirty'] == true) {
        final r = await cloud.register(s, p);
        await store.setServerRole(profileId, r['role'] as String?);
        await store.clearDirty(profileId);
      } else {
        await store.setServerRole(profileId, remote['role'] as String?);
      }
      await store.linkAccount(profileId, s.userId);

      // 2. Réponses du serveur absentes de ce téléphone.
      await store.mergeRemote(profileId, await cloud.pullAttempts(s));

      // 3. Réponses de ce téléphone absentes du serveur (par lots).
      for (var batch = store.unsynced(profileId); batch.isNotEmpty; batch = store.unsynced(profileId)) {
        await cloud.pushAttempts(s, [for (final e in batch) _row(s, e)]);
        await store.markSynced(profileId, [for (final e in batch) e['id'] as String]);
      }

      // 4. Marque-pages (0.6.0) : le plus récent gagne. Un serveur sans la table (migration pas
      //    encore faite) ne doit rien casser : les marque-pages restent sur le téléphone.
      try {
        await store.mergeRemoteMarks(profileId, await cloud.pullMarks(s));
        for (var batch = store.unsyncedMarks(profileId); batch.isNotEmpty; batch = store.unsyncedMarks(profileId)) {
          await cloud.pushMarks(s, [for (final m in batch) _markRow(s, m.key, m.value)]);
          await store.markMarksSynced(profileId, batch);
        }
      } on CloudException catch (e) {
        if (!e.missingTable) rethrow;
      }

      // 5. Version de l'application (statistiques d'usage). Un serveur sans la fonction (migration pas encore
      //    faite) ou une erreur ici ne doit jamais faire échouer la synchronisation.
      if (appVersion.isNotEmpty) {
        try {
          await cloud.touch(s, appVersion);
        } on CloudException catch (e) {
          if (e.unauthorized) rethrow;
        }
      }

      final auth = store.authOf(profileId);
      if (auth != null) await store.setAuth(profileId, {...auth, 'lastSync': DateTime.now().toUtc().toIso8601String()});
      return SyncResult.ok;
    } on CloudException catch (e) {
      if (e.unauthorized) {
        await store.setAuth(profileId, null);
        return SyncResult.signedOut;
      }
      return SyncResult.failed;
    } on SocketException {
      return SyncResult.offline; // pas de réseau : on réessaiera
    } on TimeoutException {
      return SyncResult.offline;
    } on http.ClientException {
      return SyncResult.offline;
    } catch (_) {
      return SyncResult.failed; // réponse inattendue : à signaler, pas à confondre avec « hors ligne »
    }
  }

  static Map<String, dynamic> _markRow(Session s, String item, Map<String, dynamic> m) => {
        'user_id': s.userId,
        'item': item,
        'status': m['st'],
        'starred': m['star'] == true,
        'updated_at': m['t'],
      };

  static Map<String, dynamic> _row(Session s, Map<String, dynamic> e) => {
        'id': e['id'],
        'user_id': s.userId,
        'question_id': e['q'],
        'notion_id': e['n'],
        'theme': e['th'],
        'qtype': e['type'],
        'difficulty': e['d'],
        'ok': e['ok'] == true,
        'duration_ms': e['ms'],
        'answered_at': DateTime.parse(e['t'] as String).toUtc().toIso8601String(),
      };
}
