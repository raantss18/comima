import 'dart:convert';
import 'dart:io';

import 'package:comima/core/progress.dart';
import 'package:flutter_test/flutter_test.dart';

Future<(Directory, ProgressStore)> fresh() async {
  final dir = Directory.systemTemp.createTempSync('comima-rob');
  final s = ProgressStore(dir: dir);
  await s.load();
  await s.addProfile({'name': 'Rova', 'role': 'eleve'});
  return (dir, s);
}

void main() {
  test('fichier de progression illisible : l\'application démarre, l\'ancien fichier est gardé à part', () async {
    final (dir, s) = await fresh();
    await s.setMark('exo:a', status: 'fait', starred: false);
    await File('${dir.path}/progress.json').writeAsString('{"profiles": [ { "id": "x", "a');
    final s2 = ProgressStore(dir: dir);
    await s2.load(); // ne doit pas lever d'exception
    expect(s2.profiles, isEmpty);
    expect(File('${dir.path}/progress.json.corrupt').existsSync(), isTrue);
  });

  test('fichier principal abîmé mais copie valide : la copie est reprise', () async {
    final (dir, s) = await fresh();
    final good = await File('${dir.path}/progress.json').readAsString();
    await File('${dir.path}/progress.json.bak').writeAsString(good);
    await File('${dir.path}/progress.json').writeAsString('garbage \u0000\u0001');
    final s2 = ProgressStore(dir: dir);
    await s2.load();
    expect(s2.profiles.length, 1);
    expect(s2.profiles.first['name'], 'Rova');
  });

  test('formes inattendues (types faux, valeurs nulles) : jamais de plantage au démarrage', () async {
    final dir = Directory.systemTemp.createTempSync('comima-rob2');
    for (final bad in [
      {'schema': 4, 'profiles': 'oui'},
      {'schema': 4, 'profiles': [1, 2]},
      {'schema': 4, 'profiles': [{'id': 5}]},
      {'schema': 4, 'profiles': [{'id': 'a', 'answers': []}]},
      {'schema': 4, 'profiles': [{'id': 'a', 'log': {}}], 'current': 3},
      {'schema': 'x', 'profiles': []},
      [1, 2, 3],
      'texte',
      null,
    ]) {
      await File('${dir.path}/progress.json').writeAsString(jsonEncode(bad));
      final s = ProgressStore(dir: dir);
      await s.load();
      expect(() => s.profiles, returnsNormally);
      expect(s.current, anyOf(isNull, isA<Map>()));
    }
  });

  test('données d\'une version plus récente : lecture seule, rien n\'est écrasé', () async {
    final dir = Directory.systemTemp.createTempSync('comima-rob3');
    final futur = jsonEncode({'schema': 99, 'profiles': [{'id': 'a', 'name': 'Futur'}], 'current': 'a'});
    await File('${dir.path}/progress.json').writeAsString(futur);
    final s = ProgressStore(dir: dir);
    await s.load();
    await s.addProfile({'name': 'Autre'});
    expect(await File('${dir.path}/progress.json').readAsString(), futur);
  });

  test('serveur défaillant ou hostile : lignes mal formées ignorées, jamais d\'exception', () async {
    final (_, s) = await fresh();
    final id = s.current!['id'] as String;
    final bad = <Map<String, dynamic>>[
      {'item': 5, 'status': 'fait', 'updated_at': '2026-10-26T10:00:00Z'},
      {'item': 'exo:ok', 'status': 7, 'starred': 'oui', 'updated_at': 'pas une date'},
      {'item': 'dossier:x', 'status': 'fait', 'updated_at': '2026-10-26T10:00:00Z'},
      {'item': 'exo:${'a' * 500}', 'status': 'fait', 'updated_at': '2026-10-26T10:00:00Z'},
      {'item': 'exo:<script>', 'status': 'fait', 'updated_at': '2026-10-26T10:00:00Z'},
      {'item': null, 'updated_at': null},
      {},
    ];
    expect(await s.mergeRemoteMarks(id, bad), 0);
    expect((s.profile(id)!['marks'] as Map).length, 0);
    final good = {'item': 'exo:engel-09-15', 'status': 'fait', 'starred': true, 'updated_at': '2026-10-26T10:00:00Z'};
    expect(await s.mergeRemoteMarks(id, [...bad, good]), 1);
    expect(s.markStatus('exo:engel-09-15'), 'fait');

    final junk = <Map<String, dynamic>>[
      {'id': 1, 'question_id': 'q', 'ok': true, 'answered_at': '2026-10-26T10:00:00Z'},
      {'id': 'a', 'question_id': 3, 'ok': true, 'answered_at': '2026-10-26T10:00:00Z'},
      {'id': 'b', 'question_id': 'q', 'ok': true, 'answered_at': 'hier'},
      {'id': 'c', 'question_id': 'q' * 999, 'ok': true, 'answered_at': '2026-10-26T10:00:00Z'},
      {'id': 'd', 'question_id': 'q', 'ok': true, 'answered_at': '2026-10-26T10:00:00Z', 'difficulty': 'difficile', 'theme': {'x': 1}, 'duration_ms': 'long'},
      {},
    ];
    expect(await s.mergeRemote(id, junk), 1); // seule la ligne « d » est reprise, champs facultatifs nettoyés
    final entry = (s.profile(id)!['log'] as List).last as Map;
    expect(entry['d'], isNull);
    expect(entry.containsKey('th'), isFalse);
  });
}
