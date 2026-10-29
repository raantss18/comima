import 'dart:io';

import 'package:comima/core/app_state.dart';
import 'package:comima/ui/defi_page.dart';
import 'package:comima/ui/design.dart';
import 'package:comima/ui/library.dart';
import 'package:comima/ui/python_page.dart';
import 'package:comima/ui/quiz.dart';
import 'package:comima/ui/theme.dart';
import 'package:comima/ui/welcome.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Future<AppState> state({String name = 'Rova', String lang = 'fr'}) async {
  final s = AppState(dir: Directory.systemTemp.createTempSync('comima-home'));
  await s.progress.load();
  await s.progress.addProfile({'name': name, 'role': 'eleve'});
  s.progress.lang = lang;
  return s;
}

Widget app(AppState s, Widget home, {double scale = 1}) => AppScope(
      state: s,
      child: MaterialApp(
        theme: buildTheme(Brightness.light),
        builder: (c, w) => MediaQuery(data: MediaQuery.of(c).copyWith(textScaler: TextScaler.linear(scale)), child: w!),
        home: home,
      ),
    );

void main() {
  testWidgets('accueil : bienvenue avec le prénom, cinq tuiles (le logo ouvre Profil et réglages), aucune barre de raccourcis', (tester) async {
    tester.view.physicalSize = const Size(400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final s = (await tester.runAsync(state))!;
    await tester.pumpWidget(app(s, const WelcomePage()));
    await tester.pumpAndSettle();
    expect(find.textContaining('Rova'), findsOneWidget);
    for (final label in ['Entraînement', 'Défi', 'Bibliothèque', 'Actualités', 'Python']) {
      expect(find.text(label), findsOneWidget, reason: label);
    }
    expect(find.text('Profil et réglages'), findsNothing, reason: 'pas de tuile : c\'est le logo');
    expect(find.byType(AppBar), findsNothing); // plus de barre d'icônes en haut
    // Le logo de l'accueil ouvre « Profil et réglages ».
    await tester.tap(find.bySemanticsLabel('Profil et réglages'));
    await tester.pumpAndSettle();
    expect(find.text('Profil et réglages'), findsWidgets);
    expect(find.byType(AppBar), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  for (final scale in [1.0, 1.5, 2.0]) {
    testWidgets('accueil sans chevauchement ni dépassement (police ×$scale, petit écran)', (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final s = (await tester.runAsync(() => state(name: 'Mamitiana Andriamanjato')))!;
      await tester.pumpWidget(app(s, const WelcomePage(), scale: scale));
      await tester.pumpAndSettle();
      final ex = tester.takeException();
      expect(ex, isNull, reason: ex is FlutterError ? ex.diagnostics.map((d) => d.toString()).join(' | ') : '$ex'); // un dépassement lèverait une exception de rendu
      await tester.drag(find.byType(ListView), const Offset(0, -2000));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('une tuile ouvre sa section ; le logo ouvre la liste (sections + Reprendre)', (tester) async {
    tester.view.physicalSize = const Size(400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final s = (await tester.runAsync(state))!;
    await tester.pumpWidget(app(s, const WelcomePage()));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Défi'));
    await tester.pumpAndSettle();
    expect(find.text('Défi chronométré'), findsOneWidget);
    await tester.tap(find.byType(LogoMenuButton));
    await tester.pumpAndSettle();
    for (final label in ['Accueil', 'Entraînement', 'Bibliothèque', 'Actualités', 'Python', 'Profil et réglages']) {
      expect(find.text(label), findsWidgets, reason: label);
    }
    await tester.tap(find.text('Python').last);
    await tester.pumpAndSettle();
    expect(find.byType(TextField), findsWidgets); // l'éditeur
    expect(find.text('Exécuter'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  for (final scale in [1.0, 2.0]) {
    for (final entry in {'Python': const PythonPage(), 'Défi': const DefiPage()}.entries) {
      testWidgets('${entry.key} : aucun dépassement (police ×$scale, 320 px)', (tester) async {
        tester.view.physicalSize = const Size(320, 640);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);
        final s = (await tester.runAsync(state))!;
        await tester.pumpWidget(app(s, entry.value, scale: scale));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        await tester.drag(find.byType(ListView).first, const Offset(0, -1500));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });
    }
  }

  for (final scale in [1.0, 2.0]) {
    testWidgets('question à cinq étoiles : en-tête sans dépassement (police ×$scale, 320 px)', (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final s = (await tester.runAsync(state))!;
      final q = {
        'id': 'test-5', 'type': 'vrai-faux', 'difficulte': 5, 'reponse': true,
        'enonce': {'fr': 'Énoncé', 'en': 'Statement'},
      };
      await tester.pumpWidget(app(s, QuizPage(title: 'Périodes, sommes télescopiques', questions: List.generate(12, (i) => {...q, 'id': 'test-$i'})), scale: scale));
      await tester.pumpAndSettle();
      expect(find.text('★★★★★'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('page d\'un chapitre : la liste de ses exercices (chapitre 9, Python et algorithmes)', (tester) async {
    tester.view.physicalSize = const Size(320, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final s = (await tester.runAsync(state))!;
    s.content.libraryMeta = {'cours': [{'id': '09-python-algorithmes', 'numero': 9, 'titre': {'fr': 'Chapitre 9', 'en': 'Chapter 9'}, 'description': {'fr': 'Python', 'en': 'Python'}}]};
    s.content.library = [
      {'id': 'recueil-9-01', 'titre': {'fr': 'Fonction affine', 'en': 'Affine function'}, 'difficulte': 1, 'tags': ['chapitre 9']},
      {'id': 'recueil-8-01', 'titre': {'fr': 'Autre chapitre', 'en': 'Other'}, 'difficulte': 1, 'tags': ['chapitre 8']},
    ];
    final ch = s.content.list('cours').first;
    await tester.pumpWidget(app(s, CoursePage(chapter: ch)));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Exercices du chapitre'), 300, scrollable: find.byType(Scrollable).first);
    expect(find.text('Exercices du chapitre'), findsOneWidget);
    expect(find.text('Fonction affine'), findsOneWidget);
    expect(find.text('Autre chapitre'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  test('historique : dernière page en tête, sans doublon, 20 au plus', () async {
    final s = await state();
    final id = s.progress.current!['id'] as String;
    for (var i = 0; i < 30; i++) {
      await s.progress.touchHistory(id, 'exo', 'e$i');
    }
    await s.progress.touchHistory(id, 'cours', 'c1');
    await s.progress.touchHistory(id, 'exo', 'e29'); // revient en tête, une seule fois
    final h = s.progress.history(id);
    expect(h.length, 20);
    expect(h.first['id'], 'e29');
    expect(h.where((e) => e['id'] == 'e29').length, 1);
    expect(h[1]['id'], 'c1');
  });
}
