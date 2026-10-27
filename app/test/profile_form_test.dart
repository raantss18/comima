import 'dart:io';

import 'package:comima/core/app_state.dart';
import 'package:comima/ui/profile_form.dart';
import 'package:comima/ui/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Future<AppState> state() async {
  final s = AppState(dir: Directory.systemTemp.createTempSync('comima-form'));
  await s.progress.load();
  await s.progress.addProfile({'name': 'Rova', 'role': 'eleve'});
  s.progress.lang = 'fr';
  return s;
}

Widget host(AppState s, void Function(BuildContext) open) => AppScope(
      state: s,
      child: MaterialApp(
        theme: buildTheme(Brightness.light),
        home: Builder(builder: (c) => Scaffold(body: Center(child: TextButton(onPressed: () => open(c), child: const Text('ouvrir'))))),
      ),
    );

void main() {
  testWidgets('profil jamais synchronisé : le rôle peut passer d\'élève à encadreur (naissance facultative)', (tester) async {
    tester.view.physicalSize = const Size(400, 1200);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final s = (await tester.runAsync(state))!;
    Map<String, dynamic>? out;
    await tester.pumpWidget(host(s, (c) async => out = await showProfileForm(c, initial: s.progress.current, roleEditable: true)));
    await tester.tap(find.text('ouvrir'));
    await tester.pumpAndSettle();
    expect(find.byType(SegmentedButton<String>), findsOneWidget);
    await tester.tap(find.text('Encadreur'));
    await tester.pumpAndSettle();
    expect(find.textContaining('fixé à la première synchronisation'), findsOneWidget);
    // Région et centre sont obligatoires : on les choisit si la liste du site est disponible, sinon on vérifie seulement le bouton.
    expect(find.byType(DropdownButtonFormField<int>), findsOneWidget); // l'année de naissance est proposée aussi aux encadreurs
    expect(out, isNull);
  });

  testWidgets('profil déjà synchronisé : le rôle reste fixé', (tester) async {
    tester.view.physicalSize = const Size(400, 1200);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final s = (await tester.runAsync(state))!;
    await tester.pumpWidget(host(s, (c) => showProfileForm(c, initial: s.progress.current)));
    await tester.tap(find.text('ouvrir'));
    await tester.pumpAndSettle();
    expect(find.byType(SegmentedButton<String>), findsNothing);
    expect(find.textContaining('ne peut pas être modifié'), findsOneWidget);
  });
}
