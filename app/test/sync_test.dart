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
  var refreshCalls = 0;
  var offline = false;

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
    if (path == '/rest/v1/attempts' && r.method == 'GET') return jr(attempts, 200);
    if (path == '/rest/v1/attempts' && r.method == 'POST') {
      for (final row in (jsonDecode(r.body) as List).cast<Map<String, dynamic>>()) {
        if (!attempts.any((a) => a['id'] == row['id'])) attempts.add(row); // ignore-duplicates
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
}
