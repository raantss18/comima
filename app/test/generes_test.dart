import 'dart:io';
import 'dart:math';

import 'package:comima/core/app_state.dart';
import 'package:comima/core/content.dart';
import 'package:comima/core/generated.dart';
import 'package:comima/core/progress.dart';
import 'package:comima/ui/notion.dart';
import 'package:comima/ui/practice.dart';
import 'package:flutter_test/flutter_test.dart';

/// Faux moteur : une question numérique par (modèle, niveau, graine), sans dépendre de la bibliothèque native.
Map<String, dynamic>? fake(String kind, int level, int seed) => {
      'id': 'g:$kind:$level:$seed',
      'generated': true,
      'type': 'numeric',
      'difficulte': level,
      'theme': 'algèbre',
      'notion': kind == 'a' ? 'n1' : 'n2',
      'enonce': {'fr': 'Question $kind $seed'},
      'reponse': '1',
    };

final kinds = [
  {'id': 'a', 'theme': 'algèbre', 'notions': ['n1']},
  {'id': 'b', 'theme': 'algèbre', 'notions': ['n2']},
  {'id': 'c', 'theme': 'algèbre', 'notions': ['n1', 'n2']},
];

Generator generator([int seed = 1]) => Generator(generate: fake, kinds: kinds, random: Random(seed));

Map<String, dynamic> bank(String id, int d) => {'id': id, 'type': 'numeric', 'enonce': 'x', 'reponse': '1', 'difficulte': d};

Future<AppState> state() async {
  final s = AppState(dir: Directory.systemTemp.createTempSync('comima-gen'));
  await s.progress.load();
  await s.progress.addProfile({'name': 'Rova', 'role': 'eleve'});
  s.progress.lang = 'fr';
  Notion n(String id, String ch) => Notion({'id': id, 'theme': 'algèbre', 'niveau': 1, 'chapitre': ch, 'titre': {'fr': id}, 'questions': [for (var i = 0; i < 6; i++) bank('$id-$i', 1 + i % 3)]});
  s.content.libraryMeta = {'cours': [{'id': 'c1', 'numero': 1, 'titre': {'fr': 'Chapitre 1'}}, {'id': 'c2', 'numero': 2, 'titre': {'fr': 'Chapitre 2'}}]};
  s.content.packs = [Pack({'id': 'p', 'theme': 'algèbre', 'niveau': 1, 'notions': [n('n1', 'c1').raw, n('n2', 'c2').raw]})];
  return s;
}

void main() {
  test('questions générées : nombre demandé, énoncés tous différents, niveaux voisins du niveau visé', () {
    final qs = generator().mixed(null, 12, tier: 3);
    expect(qs.length, 12);
    expect({for (final q in qs) '${q['enonce']}'}.length, 12);
    expect(qs.every((q) => (q['difficulte'] as int) >= 2 && (q['difficulte'] as int) <= 4), isTrue);
    expect(generator().mixed(null, 0), isEmpty);
  });

  test('pour une notion et une étape : seulement les modèles de la notion, exactement au niveau demandé', () {
    final qs = generator().forNotion('n1', 2, 6);
    expect(qs, isNotEmpty);
    expect(qs.every((q) => q['difficulte'] == 2), isTrue);
    expect(qs.every((q) => (q['id'] as String).startsWith('g:a:') || (q['id'] as String).startsWith('g:c:')), isTrue, reason: 'pas de modèle de n2');
  });

  test('deux séries successives ne se ressemblent pas', () {
    final g = generator(5);
    final a = g.forNotion('n1', 1, 4).map((q) => q['id']).toList();
    final b = g.forNotion('n1', 1, 4).map((q) => q['id']).toList();
    expect(a.toSet().intersection(b.toSet()), isEmpty);
  });

  test('moteur absent ou en échec : aucune question générée, jamais d\'exception', () {
    final g = Generator(generate: (k, l, s) => null, kinds: kinds);
    expect(g.mixed(null, 5), isEmpty);
    expect(Generator(generate: fake, kinds: const []).mixed(null, 5), isEmpty, reason: 'aucun modèle connu');
  });

  test('série de l\'étape : questions rédigées + générées, mélangées, défis au choix à la fin', () async {
    final s = await state();
    final n1 = s.content.packs.first.notions.first;
    final manual = {'id': 'm1', 'type': 'preuve', 'difficulte': 1, 'enonce': 'p'};
    final series = seriesFor(n1, [...n1.questions.where((q) => q['difficulte'] == 2), manual], level: 2, generator: generator());
    expect(series.where((q) => q['generated'] == true).length, 4);
    expect(series.where((q) => q['generated'] != true && q['type'] == 'numeric').length, 2);
    expect(series.last['id'], 'm1');
  });

  test('séries au hasard : toujours le nombre demandé, mélange rédigé / généré, limité à ce qui a été lu', () async {
    final s = await state();
    var all = randomQuestions(s, PracticeScope.all, count: 10, generator: generator());
    expect(all.length, 10);
    expect(all.where((q) => q['generated'] == true).length, 6);
    expect(all.where((q) => q['generated'] != true).length, 4);
    // Rien de lu : le choix « ce que j'ai lu » est vide côté rédigé, et les modèles sont ceux des notions lues (aucune).
    final read = randomQuestions(s, PracticeScope.read, count: 10, generator: generator());
    expect(read.where((q) => q['generated'] != true), isEmpty);
    await s.touch('cours', 'c2');
    final read2 = randomQuestions(s, PracticeScope.read, count: 10, generator: generator());
    expect(read2.where((q) => q['generated'] != true).every((q) => q['notion'] == 'n2'), isTrue);
    expect(read2.where((q) => q['generated'] == true).every((q) => q['notion'] == 'n2' || (q['id'] as String).startsWith('g:c:')), isTrue);
    // Sans `count` : seulement les questions rédigées (comportement d'avant).
    all = randomQuestions(s, PracticeScope.all, generator: generator());
    expect(all.every((q) => q['generated'] != true), isTrue);
  });

  test('XP des questions générées : plafonnés par jour, rien dans les réponses mémorisées', () async {
    final s = await state();
    final id = s.progress.current!['id'] as String;
    final gen = generator();
    final before = (s.progress.profile(id)!['answers'] as Map).length;
    var total = 0;
    for (var i = 0; i < 60; i++) {
      total += await s.progress.record(fake('a', 3, i)!, true, notion: 'n1');
    }
    expect(total, ProgressStore.maxGeneratedXpPerDay, reason: '6 XP par bonne réponse, plafonnées à 60 par jour');
    expect((s.progress.profile(id)!['answers'] as Map).length, before, reason: 'pas une entrée par question générée');
    expect(await s.progress.record(fake('a', 3, 999)!, true), 0);
    expect(await s.progress.record(fake('a', 3, 1000)!, false), 0);
    expect(gen.kinds.length, 3);
    // Mais ces réponses comptent dans les statistiques (journal).
    expect(s.progress.log.where((e) => (e['q'] as String).startsWith('g:')).length, 62);
  });

  test('synchronisation : une question générée reprise du serveur n\'ajoute ni XP ni réponse mémorisée', () async {
    final s = await state();
    final id = s.progress.current!['id'] as String;
    final xp = s.progress.xp;
    final added = await s.progress.mergeRemote(id, [
      {'id': 'r1', 'question_id': 'g:pgcd:3:42', 'ok': true, 'difficulty': 3, 'answered_at': '2026-10-27T10:00:00Z'},
      {'id': 'r2', 'question_id': 'rs-01', 'ok': true, 'difficulty': 1, 'answered_at': '2026-10-27T10:01:00Z'},
    ]);
    expect(added, 2);
    expect(s.progress.xp, xp + 10, reason: 'seule la question rédigée rapporte des XP à la reprise');
    final answers = s.progress.profile(id)!['answers'] as Map;
    expect(answers.containsKey('g:pgcd:3:42'), isFalse);
    expect(answers.containsKey('rs-01'), isTrue);
  });
}
