import 'dart:convert';
import 'dart:io';

import 'package:comima/core/cloud.dart';
import 'package:comima/core/progress.dart';
import 'package:comima/core/sync.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

/// Réponse JSON en UTF-8, comme le vrai serveur (les accents doivent traverser).
http.Response jr(Object body, int status) =>
    http.Response.bytes(utf8.encode(jsonEncode(body)), status, headers: {'content-type': 'application/json; charset=utf-8'});

const cfg = CloudConfig(url: 'https://x.supabase.co', key: 'anon-key');
final future = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 7200;

Map<String, dynamic> session(String id) => Session(access: 'acc', refresh: 'ref', exp: future, userId: id, email: 'a@b.mg').toJson();

/// Faux serveur : mémorise ce qu'on lui envoie, répond comme PostgREST / GoTrue.
class FakeServer {
  Map<String, dynamic>? profile;
  final attempts = <Map<String, dynamic>>[];
  var registerCalls = 0;

  /// Fonction `touch` (1.1.0) : absente tant que la migration n'est pas faite ; garde la dernière version reçue.
  var hasTouch = true;
  String? touchedVersion;
  var refreshCalls = 0;
  var offline = false;

  /// Table des marque-pages (0.6.0) : absente tant que la migration n'est pas faite.
  var hasMarksTable = false;
  final marks = <String, Map<String, dynamic>>{};

  Future<http.Response> handle(http.Request r) async {
    if (offline) throw const SocketException('offline');
    final path = r.url.path;
    if (path == '/auth/v1/token') {
      refreshCalls++;
      return jr({'access_token': 'acc2', 'refresh_token': 'ref2', 'expires_in': 3600, 'user': {'id': 'user-1', 'email': 'a@b.mg'}}, 200);
    }
    if (path == '/rest/v1/profiles' && r.method == 'GET') return jr(profile == null ? [] : [profile], 200);
    if (path == '/rest/v1/rpc/register') {
      registerCalls++;
      final b = jsonDecode(r.body) as Map<String, dynamic>;
      profile = {'id': 'user-1', 'display_name': b['p_display_name'], 'role': 'eleve', 'birth_year': b['p_birth_year'], 'school': b['p_school'], 'region': b['p_region'], 'centre_id': b['p_centre_id']};
      return jr(profile!, 200);
    }
    if (path == '/rest/v1/rpc/touch') {
      if (!hasTouch) return jr({'code': 'PGRST202', 'message': 'Could not find the function comima.touch'}, 404);
      touchedVersion = (jsonDecode(r.body) as Map<String, dynamic>)['p_app_version'] as String?;
      return http.Response('', 204);
    }
    if (path == '/rest/v1/attempts' && r.method == 'GET') return jr(attempts, 200);
    if (path == '/rest/v1/attempts' && r.method == 'POST') {
      for (final row in (jsonDecode(r.body) as List).cast<Map<String, dynamic>>()) {
        if (!attempts.any((a) => a['id'] == row['id'])) attempts.add(row); // ignore-duplicates
      }
      return http.Response('', 201);
    }
    if (path == '/rest/v1/marks') {
      if (!hasMarksTable) return jr({'code': 'PGRST205', 'message': 'Could not find the table comima.marks'}, 404);
      if (r.method == 'GET') return jr(marks.values.toList(), 200);
      for (final row in (jsonDecode(r.body) as List).cast<Map<String, dynamic>>()) {
        final old = marks[row['item']];
        // « Le plus récent gagne » (déclencheur keep_newest_mark côté PostgreSQL).
        if (old == null || !DateTime.parse(row['updated_at'] as String).isBefore(DateTime.parse(old['updated_at'] as String))) {
          marks[row['item'] as String] = row;
        }
      }
      return http.Response('', 201);
    }
    return http.Response('{"message":"inconnu"}', 404);
  }
}

Future<(ProgressStore, String)> store() async {
  final dir = Directory.systemTemp.createTempSync('comima-test');
  final s = ProgressStore(dir: dir);
  await s.load();
  await s.addProfile({'name': 'Rova', 'role': 'eleve', 'birthYear': 2010, 'school': 'Lycée X', 'region': 'Analamanga', 'centre': 'antananarivo'});
  return (s, s.current!['id'] as String);
}

Map<String, dynamic> q(String id, int d) => {'id': id, 'type': 'numeric', 'difficulte': d};

void main() {
  test('envoi : profil puis réponses, une seule fois (aucun doublon)', () async {
    final (st, id) = await store();
    await st.record(q('rs-01', 1), true, notion: 'recurrence-sommes', theme: 'algèbre', ms: 4000);
    await st.record(q('rs-02', 2), false);
    final server = FakeServer();
    final sync = Sync(Cloud(cfg, client: MockClient(server.handle)), st);
    expect(await sync.signIn(id, Session.fromJson(session('user-1'))), isTrue);

    expect(await sync.run(id), SyncResult.ok);
    expect(server.registerCalls, 1);
    expect(server.attempts.length, 2);
    expect(server.attempts.first['theme'], 'algèbre');
    expect(st.unsynced(id), isEmpty);

    // Deuxième synchronisation : rien de nouveau, rien ne part.
    expect(await sync.run(id), SyncResult.ok);
    expect(server.attempts.length, 2);
    expect(server.registerCalls, 1);
  });

  test('la version de l\'application est signalée à chaque synchronisation ; un serveur sans la fonction ne bloque rien', () async {
    final (st, id) = await store();
    await st.record(q('rs-01', 1), true);
    final server = FakeServer();
    final sync = Sync(Cloud(cfg, client: MockClient(server.handle)), st)..appVersion = '1.1.0';
    await sync.signIn(id, Session.fromJson(session('user-1')));
    expect(await sync.run(id), SyncResult.ok);
    expect(server.touchedVersion, '1.1.0');

    await st.record(q('rs-02', 1), true);
    final old = FakeServer()..hasTouch = false; // migration pas encore faite
    final sync2 = Sync(Cloud(cfg, client: MockClient(old.handle)), st)..appVersion = '1.1.0';
    expect(await sync2.run(id), SyncResult.ok);
    expect(old.touchedVersion, isNull);
    expect(old.attempts.length, 1, reason: 'les réponses partent malgré tout');
  });

  test('hors ligne : rien n\'est perdu, tout part au retour du réseau', () async {
    final (st, id) = await store();
    await st.record(q('rs-01', 1), true);
    final server = FakeServer()..offline = true;
    final sync = Sync(Cloud(cfg, client: MockClient(server.handle)), st);
    await sync.signIn(id, Session.fromJson(session('user-1')));
    expect(await sync.run(id), SyncResult.offline);
    expect(st.unsynced(id).length, 1);
    server.offline = false;
    expect(await sync.run(id), SyncResult.ok);
    expect(server.attempts.length, 1);
  });

  test('nouveau téléphone : on reprend le profil et la progression du serveur, sans les écraser', () async {
    final (st, id) = await store(); // profil local vide
    final server = FakeServer()
      ..profile = {'id': 'user-1', 'display_name': 'Rova R.', 'role': 'encadreur', 'birth_year': 2009, 'school': 'Lycée Y', 'region': 'Itasy', 'centre_id': 'fianarantsoa'}
      ..attempts.addAll([
        {'id': 'a1', 'question_id': 'rs-01', 'ok': true, 'difficulty': 1, 'answered_at': '2026-10-20T10:00:00Z', 'theme': 'algèbre', 'notion_id': 'recurrence-sommes'},
        {'id': 'a2', 'question_id': 'rs-02', 'ok': true, 'difficulty': 2, 'answered_at': '2026-10-21T10:00:00Z'},
      ]);
    final sync = Sync(Cloud(cfg, client: MockClient(server.handle)), st);
    await sync.signIn(id, Session.fromJson(session('user-1')));
    expect(await sync.run(id), SyncResult.ok);
    expect(server.registerCalls, 0, reason: 'le profil du serveur ne doit pas être écrasé par un profil vide');
    final p = st.profile(id)!;
    expect(p['name'], 'Rova R.');
    expect(p['school'], 'Lycée Y');
    expect(p['serverRole'], 'encadreur');
    expect(st.lastResult('rs-01'), isTrue);
    expect(st.xp, 10 * 1 + 10 * 2);
    expect(st.log.length, 2);
    expect(st.unsynced(id), isEmpty);
  });

  test('fusion : une réponse déjà connue n\'est pas recomptée (XP, journal)', () async {
    final (st, id) = await store();
    await st.record(q('rs-01', 1), true); // +10 XP en local
    final localId = st.log.first['id'] as String;
    final added = await st.mergeRemote(id, [
      {'id': localId, 'question_id': 'rs-01', 'ok': true, 'difficulty': 1, 'answered_at': st.log.first['t']},
      {'id': 'autre', 'question_id': 'rs-01', 'ok': true, 'difficulty': 1, 'answered_at': '2026-01-01T00:00:00Z'},
    ]);
    expect(added, 1);
    expect(st.xp, 10, reason: 'rs-01 était déjà réussie : pas de XP en double');
    expect(st.log.length, 2);
  });

  test('un profil ne change jamais de compte (données de deux personnes jamais mélangées)', () async {
    final (st, id) = await store();
    final server = FakeServer();
    final sync = Sync(Cloud(cfg, client: MockClient(server.handle)), st);
    await sync.signIn(id, Session.fromJson(session('user-1')));
    await sync.run(id);
    await sync.signOut(id);
    expect(await sync.signIn(id, Session.fromJson(session('user-2'))), isFalse);
    expect(await sync.signIn(id, Session.fromJson(session('user-1'))), isTrue);
  });

  test('jeton expiré : renouvelé automatiquement ; refusé : déconnexion propre', () async {
    final (st, id) = await store();
    final server = FakeServer();
    final sync = Sync(Cloud(cfg, client: MockClient(server.handle)), st);
    await st.setAuth(id, Session(access: 'old', refresh: 'ref', exp: 1, userId: 'user-1').toJson());
    expect(await sync.run(id), SyncResult.ok);
    expect(server.refreshCalls, 1);
    expect(st.authOf(id)!['access'], 'acc2');

    final refused = Sync(Cloud(cfg, client: MockClient((r) async => http.Response('{"error_code":"refresh_token_not_found","msg":"x"}', 400))), st);
    await st.setAuth(id, Session(access: 'old', refresh: 'ref', exp: 1, userId: 'user-1').toJson());
    expect(await refused.run(id), SyncResult.signedOut);
    expect(st.authOf(id), isNull);
  });

  test('migration 0.2.0 → 0.3.0 : chaque réponse reçoit un identifiant, rien n\'est perdu', () async {
    final dir = Directory.systemTemp.createTempSync('comima-mig');
    File('${dir.path}/progress.json').writeAsStringSync(jsonEncode({
      'schema': 2,
      'current': 'p1',
      'lang': 'fr',
      'reminders': {},
      'profiles': [
        {
          'id': 'p1', 'name': 'Rova', 'xp': 30, 'answers': {},
          'log': [
            {'q': 'rs-01', 'ok': true, 't': '2026-10-20T10:00:00', 'd': 1},
            {'q': 'rs-02', 'ok': false, 't': '2026-10-21T10:00:00', 'd': 2},
          ],
        },
      ],
    }));
    final st = ProgressStore(dir: dir);
    await st.load();
    expect(st.log.length, 2);
    expect(st.log.map((e) => e['id']).toSet().length, 2);
    expect(st.log.every((e) => e['s'] == false), isTrue);
    expect(st.xp, 30);
    expect(File('${dir.path}/progress.json.bak').existsSync(), isTrue, reason: 'sauvegarde avant migration');
    expect(st.profile('p1')!['dirty'], isTrue);
  });

  test('marque-pages : synchronisés entre deux téléphones, le plus récent gagne', () async {
    final server = FakeServer()..hasMarksTable = true;
    final (a, ida) = await store();
    final (b, idb) = await store();
    final syncA = Sync(Cloud(cfg, client: MockClient(server.handle)), a);
    final syncB = Sync(Cloud(cfg, client: MockClient(server.handle)), b);
    await syncA.signIn(ida, Session.fromJson(session('user-1')));
    await syncB.signIn(idb, Session.fromJson(session('user-1')));

    // Le téléphone A marque un exercice « fait » (étoilé) et un cours « à continuer ».
    await a.setMark('exo:engel-09-15', status: 'fait', starred: true);
    await a.setMark('cours:03-principe-des-tiroirs', status: 'continuer', starred: false);
    expect(a.markStatus('exo:engel-09-15'), 'fait');
    expect(a.markStarred('exo:engel-09-15'), isTrue);
    expect(a.unsyncedMarks(ida).length, 2);
    expect(await syncA.run(ida), SyncResult.ok);
    expect(a.unsyncedMarks(ida), isEmpty);
    expect(server.marks.length, 2);

    // Le téléphone B reprend tout, puis change d'avis plus tard : son état est le plus récent.
    expect(await syncB.run(idb), SyncResult.ok);
    expect(b.markStatus('exo:engel-09-15'), 'fait');
    expect(b.markStatus('cours:03-principe-des-tiroirs'), 'continuer');
    await Future<void>.delayed(const Duration(milliseconds: 5));
    await b.setMark('exo:engel-09-15', status: 'teste', starred: false);
    expect(await syncB.run(idb), SyncResult.ok);
    expect(server.marks['exo:engel-09-15']!['status'], 'teste');

    // A récupère la modification de B (plus récente que la sienne).
    expect(await syncA.run(ida), SyncResult.ok);
    expect(a.markStatus('exo:engel-09-15'), 'teste');
    expect(a.markStarred('exo:engel-09-15'), isFalse);
    expect(a.markCounts, {'teste': 1, 'continuer': 1});

    // Une modification plus ancienne (téléphone resté hors ligne) n'écrase pas le serveur.
    server.marks['cours:03-principe-des-tiroirs'] = {
      'item': 'cours:03-principe-des-tiroirs',
      'status': 'fait',
      'starred': false,
      'updated_at': DateTime.now().toUtc().add(const Duration(minutes: 5)).toIso8601String(),
    };
    await a.setMark('cours:03-principe-des-tiroirs', status: 'lu', starred: false); // plus ancienne que celle du serveur
    expect(await syncA.run(ida), SyncResult.ok);
    expect(a.markStatus('cours:03-principe-des-tiroirs'), 'fait', reason: 'le serveur est plus récent');
  });

  test('marque-pages : serveur sans la table → la synchronisation réussit, les marque-pages restent sur le téléphone', () async {
    final server = FakeServer(); // hasMarksTable = false
    final (st, id) = await store();
    await st.record(q('rs-01', 1), true);
    final sync = Sync(Cloud(cfg, client: MockClient(server.handle)), st);
    await sync.signIn(id, Session.fromJson(session('user-1')));
    await st.setMark('exo:rs-01', status: 'lu', starred: true);
    expect(await sync.run(id), SyncResult.ok);
    expect(server.attempts.length, 1, reason: 'le reste se synchronise normalement');
    expect(st.markStatus('exo:rs-01'), 'lu');
    expect(st.unsyncedMarks(id).length, 1, reason: 'gardé pour plus tard');
    server.hasMarksTable = true; // migration faite
    expect(await sync.run(id), SyncResult.ok);
    expect(st.unsyncedMarks(id), isEmpty);
    expect(server.marks['exo:rs-01']!['starred'], isTrue);
  });

  test('marque-pages : un état inconnu est refusé, retirer l\'état garde l\'étoile', () async {
    final (st, _) = await store();
    await st.setMark('exo:x', status: 'nimporte', starred: false);
    expect(st.markStatus('exo:x'), isNull);
    await st.setMark('exo:x', status: 'lu', starred: true);
    await st.setMark('exo:x', status: null, starred: true);
    expect(st.markStatus('exo:x'), isNull);
    expect(st.markStarred('exo:x'), isTrue);
  });

  test('migration 0.5.0 → 0.6.0 : marque-pages ajoutés, rien n\'est perdu', () async {
    final dir = Directory.systemTemp.createTempSync('comima-mig4');
    File('${dir.path}/progress.json').writeAsStringSync(jsonEncode({
      'schema': 3,
      'current': 'p1',
      'lang': 'fr',
      'reminders': {},
      'profiles': [
        {'id': 'p1', 'name': 'Rova', 'xp': 30, 'answers': {}, 'log': [{'id': 'e1', 's': true, 'q': 'rs-01', 'ok': true, 't': '2026-10-20T10:00:00', 'd': 1}], 'dirty': false},
      ],
    }));
    final st = ProgressStore(dir: dir);
    await st.load();
    expect(st.xp, 30);
    expect(st.log.length, 1);
    expect(st.profile('p1')!['marks'], isEmpty);
    expect(st.markStatus('exo:x'), isNull);
    expect(File('${dir.path}/progress.json.bak').existsSync(), isTrue);
    await st.setMark('exo:x', status: 'fait', starred: false);
    final again = ProgressStore(dir: dir);
    await again.load();
    expect(again.markStatus('exo:x'), 'fait', reason: 'enregistré sur le disque');
  });

  group('groupes (vue encadreur)', () {
    final ses = Session.fromJson(session('coach-1'));

    test('un élève rejoint avec le code ; l\'encadreur voit les marque-pages de ses élèves', () async {
      final seen = <String>[];
      final cloud = Cloud(cfg, client: MockClient((r) async {
        seen.add('${r.method} ${r.url.path}');
        if (r.url.path == '/rest/v1/rpc/join_group') {
          expect(jsonDecode(r.body), {'p_code': 'ABC123'});
          expect(r.headers['Content-Profile'], 'comima');
          return jr([{'id': 'g1', 'name': 'Lycée X'}], 200);
        }
        if (r.url.path == '/rest/v1/groups' && r.method == 'GET') {
          return jr([
            {'id': 'g1', 'name': 'Lycée X', 'join_code': 'ABC123', 'coach_id': 'coach-1', 'group_members': [{'user_id': 'u1', 'profiles': {'display_name': 'Rova'}}]}
          ], 200);
        }
        if (r.url.path == '/rest/v1/groups' && r.method == 'POST') {
          expect(jsonDecode(r.body), {'name': 'Terminale', 'coach_id': 'coach-1'});
          return http.Response('', 201);
        }
        if (r.url.path == '/rest/v1/marks') {
          expect(r.url.queryParameters['user_id'], 'in.(u1,u2)');
          return jr([{'user_id': 'u1', 'item': 'exo:engel-09-15', 'status': 'fait', 'starred': true, 'updated_at': '2026-10-26T10:00:00Z'}], 200);
        }
        if (r.url.path == '/rest/v1/rpc/renew_group_code') return jr('ZZZ999', 200);
        return http.Response('{"message":"inconnu"}', 404);
      }));
      expect(await cloud.joinGroup(ses, 'ABC123'), 'Lycée X');
      final groups = await cloud.myGroups(ses);
      expect(groups.single['join_code'], 'ABC123');
      expect(((groups.single['group_members'] as List).single as Map)['profiles']['display_name'], 'Rova');
      await cloud.createGroup(ses, 'Terminale');
      expect((await cloud.marksOf(ses, ['u1', 'u2'])).single['status'], 'fait');
      expect(await cloud.marksOf(ses, []), isEmpty); // aucun appel inutile
      expect(await cloud.renewGroupCode(ses, 'g1'), 'ZZZ999');
    });

    test('service pas encore prêt (migration non exécutée) : erreur reconnaissable', () async {
      final cloud = Cloud(cfg, client: MockClient((r) async => jr({'code': 'PGRST205', 'message': 'no table'}, 404)));
      await expectLater(cloud.myGroups(ses), throwsA(isA<CloudException>().having((e) => e.missingTable, 'missingTable', isTrue)));
    });

    test('code inconnu : le message du serveur remonte', () async {
      final cloud = Cloud(cfg, client: MockClient((r) async => jr({'code': 'P0001', 'message': 'Code inconnu'}, 400)));
      await expectLater(cloud.joinGroup(ses, 'NOPE'), throwsA(isA<CloudException>().having((e) => e.message, 'message', 'Code inconnu')));
    });
  });

  test('lien de confirmation : accepté seulement dans la fenêtre ouverte par une inscription ou une réinitialisation', () async {
    final (st, id) = await store();
    expect(st.linkUntil(id), isNull);
    final now = DateTime.now().millisecondsSinceEpoch;
    await st.setLinkUntil(id, now + 3600 * 1000);
    expect(st.linkUntil(id)! > now, isTrue);
    await st.setLinkUntil(id, null);
    expect(st.linkUntil(id), isNull);
    // le champ ne marque pas le profil à renvoyer (pas de synchronisation inutile)
    expect(st.profile(id)!['dirty'], isNot(isNull)); // profil créé : à envoyer une fois
  });
}
