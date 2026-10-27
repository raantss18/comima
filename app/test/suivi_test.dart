import 'dart:io';

import 'package:comima/core/app_state.dart';
import 'package:comima/core/content.dart';
import 'package:comima/ui/practice.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, dynamic> q(String id) => {'id': id, 'type': 'numeric', 'enonce': 'x', 'reponse': '1', 'difficulte': 1};

Future<AppState> state() async {
  final s = AppState(dir: Directory.systemTemp.createTempSync('comima-suivi'));
  await s.progress.load();
  await s.progress.addProfile({'name': 'Rova', 'role': 'eleve'});
  s.content.libraryMeta = {
    'cours': [
      {'id': 'c1', 'numero': 1, 'titre': {'fr': 'Chapitre 1'}},
      {'id': 'c2', 'numero': 2, 'titre': {'fr': 'Chapitre 2'}},
    ],
    'exercices': [
      {'id': 'e-ch2', 'tags': ['recueil', 'chapitre 2', 'exercice 2.1']},
      {'id': 'e-libre', 'tags': ['recueil']},
    ],
  };
  Notion n(String id, String ch) => Notion({'id': id, 'theme': 'algèbre', 'niveau': 1, 'chapitre': ch, 'titre': {'fr': id}, 'questions': [q('$id-1'), q('$id-2')]});
  s.content.packs = [
    Pack({'id': 'p', 'theme': 'algèbre', 'niveau': 1, 'notions': [n('n1', 'c1').raw, n('n2', 'c2').raw]}),
  ];
  return s;
}

void main() {
  test('ouvrir un cours, un exercice ou un sujet le marque « lu », sans écraser un état déjà posé', () async {
    final s = (await state());
    await s.touch('cours', 'c1');
    await s.touch('exo', 'e-ch2');
    await s.touch('sujet', 'imo-2020');
    expect(s.progress.markStatus('cours:c1'), 'lu');
    expect(s.progress.markStatus('exo:e-ch2'), 'lu');
    expect(s.progress.markStatus('sujet:imo-2020'), 'lu');

    await s.progress.setMark('cours:c1', status: 'fait', starred: true);
    await s.touch('cours', 'c1'); // déjà « fait » : on ne le rabaisse pas à « lu », l'étoile reste
    expect(s.progress.markStatus('cours:c1'), 'fait');
    expect(s.progress.markStarred('cours:c1'), isTrue);

    await s.touch('notion', 'n1'); // une notion d'entraînement n'est pas une ressource à marquer
    await s.touch('actu', 'a');
    expect(s.progress.markStatus('notion:n1'), isNull);
  });

  test('questions au hasard : tous les cours, ou seulement ce qui a été lu (cours lus + exercices vus)', () async {
    final s = await state();
    expect(notionsForScope(s, PracticeScope.all).length, 2);
    expect(notionsForScope(s, PracticeScope.read), isEmpty);
    expect(randomQuestions(s, PracticeScope.read), isEmpty);

    await s.touch('cours', 'c1');
    expect([for (final n in notionsForScope(s, PracticeScope.read)) n.id], ['n1']);

    await s.touch('exo', 'e-ch2'); // un exercice du chapitre 2 ouvre aussi les questions du chapitre 2
    expect({for (final n in notionsForScope(s, PracticeScope.read)) n.id}, {'n1', 'n2'});
    final qs = randomQuestions(s, PracticeScope.read);
    expect(qs.length, 4);
    expect(qs.every((x) => x['notion'] != null && x['theme'] == 'algèbre'), isTrue);
    expect(readCourseTitles(s), ['Chapitre 1', 'Chapitre 2']);

    await s.touch('exo', 'e-libre'); // sans étiquette de chapitre : marqué lu, mais sans lien de cours
    expect(s.progress.markStatus('exo:e-libre'), 'lu');
    expect(s.studiedChapters, {'c1', 'c2'});
  });
}
