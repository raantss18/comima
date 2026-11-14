import 'dart:io';

import 'package:comima/core/app_state.dart';
import 'package:comima/ui/library.dart';
import 'package:comima/ui/quiz.dart';
import 'package:comima/ui/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

const secret = 'SOLUTION-SECRETE-42';

Future<AppState> state({String role = 'eleve', String? serverRole, bool signedIn = true}) async {
  final s = AppState(dir: Directory.systemTemp.createTempSync('comima-rep'));
  await s.progress.load();
  await s.progress.addProfile({'name': 'Rova', 'role': role});
  if (serverRole != null) {
    s.progress.current!['serverRole'] = serverRole;
    if (signedIn) s.progress.current!['auth'] = {'access_token': 'jeton-de-test'};
  }
  s.progress.lang = 'fr';
  return s;
}

Widget app(AppState s, Widget home) => AppScope(state: s, child: MaterialApp(theme: buildTheme(Brightness.light), home: home));

final exo = {
  'id': 'e1',
  'titre': {'fr': 'Un exercice'},
  'enonce': {'fr': 'Énoncé visible'},
  'solutionTex': {'fr': secret},
  'solution': 'pdfs/exercices/e1/solution.pdf',
};

void main() {
  test('qui est encadreur : seul le serveur le dit, pour un compte connecté ; sinon on est élève', () async {
    expect((await state()).isCoach, isFalse);
    expect((await state(role: 'encadreur')).isCoach, isFalse, reason: 'un profil local qui se dit encadreur reste élève');
    expect((await state(role: 'encadreur', serverRole: 'encadreur', signedIn: false)).isCoach, isFalse, reason: 'déconnecté');
    expect((await state(serverRole: 'admin')).isCoach, isTrue);
    expect((await state(serverRole: 'encadreur')).isCoach, isTrue);
    expect((await state(serverRole: 'eleve')).isCoach, isFalse);
  });

  test('question de code : l\'élève apprend seulement le dépassement de temps, jamais le détail ni l\'attendu', () {
    final faux = {'status': 'incorrect', 'code': 'py_fail', 'detail': 'f(3) → 7', 'expected': '9'};
    final temps = {'status': 'incorrect', 'code': 'py_timeout', 'detail': 'f(3)'};
    final eleveFaux = wrongMessage(faux, coach: false, lang: 'fr');
    expect(eleveFaux, 'Pas tout à fait. Tu pourras la retenter plus tard.');
    final eleveTemps = wrongMessage(temps, coach: false, lang: 'fr');
    expect(eleveTemps, contains('trop de temps'));
    expect(eleveTemps, isNot(contains('f(3)')));
    final coach = wrongMessage(faux, coach: true, lang: 'fr');
    expect(coach, allOf(contains('f(3) → 7'), contains('9')));
  });

  testWidgets('exercice : un élève ne voit jamais la solution, ni le bouton pour l\'afficher', (tester) async {
    final s = (await tester.runAsync(state))!;
    await tester.pumpWidget(app(s, ExercisePage(ex: exo)));
    await tester.pumpAndSettle();
    expect(find.textContaining('Énoncé visible'), findsOneWidget);
    expect(find.textContaining(secret), findsNothing);
    expect(find.textContaining('Voir la solution'), findsNothing);
    expect(find.textContaining('réservées aux encadreurs'), findsOneWidget);
    expect(find.textContaining('comima.mg'), findsNothing, reason: 'plus de lien vers un PDF de solution');
  });

  testWidgets('exercice : un encadreur voit la solution après l\'avoir demandée', (tester) async {
    final s = (await tester.runAsync(() => state(role: 'encadreur', serverRole: 'encadreur')))!;
    await tester.pumpWidget(app(s, ExercisePage(ex: exo)));
    await tester.pumpAndSettle();
    expect(find.textContaining(secret), findsNothing, reason: 'cachée jusqu\'au clic, même pour un encadreur');
    await tester.tap(find.textContaining('Voir la solution'));
    await tester.pumpAndSettle();
    expect(find.textContaining(secret), findsOneWidget);
  });

  testWidgets('défis au choix : l\'explication est réservée aux encadreurs', (tester) async {
    final q = [
      {'id': 'b1', 'type': 'preuve', 'difficulte': 1, 'enonce': {'fr': 'Prouve que…'}, 'explication': {'fr': secret}},
    ];
    final eleve = (await tester.runAsync(state))!;
    await tester.pumpWidget(app(eleve, BonusPage(title: 't', questions: q)));
    await tester.pumpAndSettle();
    expect(find.textContaining('Prouve'), findsOneWidget);
    expect(find.textContaining('Voir l'), findsNothing);
    expect(find.textContaining(secret), findsNothing);

    final coach = (await tester.runAsync(() => state(role: 'encadreur', serverRole: 'encadreur')))!;
    await tester.pumpWidget(app(coach, BonusPage(title: 't', questions: q)));
    await tester.pumpAndSettle();
    expect(find.byType(ExpansionTile), findsWidgets);
  });
}
