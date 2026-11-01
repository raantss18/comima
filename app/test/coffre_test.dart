import 'dart:io';

import 'package:comima/core/app_state.dart';
import 'package:comima/core/coffre.dart';
import 'package:comima/ui/library.dart';
import 'package:comima/ui/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

CoffreStore store(Directory dir, Future<List<Map<String, dynamic>>?> Function(List<String>) fetch) => CoffreStore(File('${dir.path}/coffre.json'), fetch);

void main() {
  late Directory dir;
  setUp(() => dir = Directory.systemTemp.createTempSync('comima-coffre'));

  test('sans compte connecté : rien n\'est lu, et rien n\'est gardé', () async {
    final c = store(dir, (items) async => null);
    final r = await c.get('q:a');
    expect(r.status, CoffreStatus.signedOut);
    expect(File('${dir.path}/coffre.json').existsSync(), isFalse);
  });

  test('élève ou encadreur pas encore validé : le serveur ne rend rien, le coffre reste fermé', () async {
    final c = store(dir, (items) async => <Map<String, dynamic>>[]);
    expect((await c.get('exo:e1')).status, CoffreStatus.denied);
    expect((await c.getMany(['q:a', 'q:b'])).values.every((r) => r.status == CoffreStatus.denied), isTrue);
  });

  test('encadreur validé : texte lu, gardé sur le téléphone, relu hors ligne, effacé à la déconnexion', () async {
    var calls = 0;
    var offline = false;
    final c = store(dir, (items) async {
      calls++;
      if (offline) throw const SocketException('hors ligne');
      return [
        for (final i in items) if (i != 'q:absent') {'item': i, 'contenu': {'fr': 'Solution de $i', 'en': 'Solution of $i'}},
      ];
    });
    var r = await c.get('exo:e1');
    expect(r.status, CoffreStatus.ok);
    expect(r.contenu!['fr'], 'Solution de exo:e1');
    expect(calls, 1);

    r = await c.get('exo:e1'); // copie locale : pas de nouvelle requête
    expect(r.status, CoffreStatus.ok);
    expect(calls, 1);

    // Une autre instance (redémarrage) relit la copie, même sans réseau.
    offline = true;
    final c2 = store(dir, (items) async => throw const SocketException('hors ligne'));
    expect((await c2.get('exo:e1')).status, CoffreStatus.ok);
    expect((await c2.get('exo:e2')).status, CoffreStatus.offline);

    // Un élément qui n'existe pas : « manquant » (le serveur répond, mais sans ce texte).
    offline = false;
    final many = await c.getMany(['exo:e1', 'q:absent', 'q:b']);
    expect(many['q:absent']!.status, CoffreStatus.missing);
    expect(many['q:b']!.status, CoffreStatus.ok);

    await c.clear();
    expect(File('${dir.path}/coffre.json').existsSync(), isFalse);
    final c3 = store(dir, (items) async => throw const SocketException('hors ligne'));
    expect((await c3.get('exo:e1')).status, CoffreStatus.offline, reason: 'la copie a bien disparu');
  });

  test('un serveur qui renvoie des lignes étrangères ou abîmées : elles sont ignorées', () async {
    final c = store(dir, (items) async => [
          {'item': 'q:autre', 'contenu': {'fr': 'intrus'}},
          {'item': 'q:a', 'contenu': 'pas un objet'},
          {'item': 42, 'contenu': {'fr': 'x'}},
          {'item': 'q:a2', 'contenu': {'fr': 'bon'}},
        ]);
    final m = await c.getMany(['q:a', 'q:a2']);
    expect(m['q:a2']!.status, CoffreStatus.ok);
    expect(m['q:a']!.status, CoffreStatus.missing);
    expect(m.containsKey('q:autre'), isFalse);
  });

  Future<AppState> state(String role) async {
    final s = AppState(dir: Directory.systemTemp.createTempSync('comima-coffre-ui'));
    await s.progress.load();
    await s.progress.addProfile({'name': 'Rova', 'role': role});
    s.progress.lang = 'fr';
    s.coffre = store(Directory.systemTemp.createTempSync('c'), (items) async => [
          for (final i in items) {'item': i, 'contenu': {'fr': 'TEXTE-DU-COFFRE', 'en': 'VAULT-TEXT'}},
        ]);
    return s;
  }

  final exo = {'id': 'e1', 'titre': {'fr': 'Un exercice'}, 'enonce': {'fr': 'Énoncé'}, 'solutionTex': null, 'coffre': true};

  testWidgets('exercice : l\'élève ne voit rien du coffre ; l\'encadreur le lit après l\'avoir demandé', (tester) async {
    final eleve = (await tester.runAsync(() => state('eleve')))!;
    await tester.pumpWidget(AppScope(state: eleve, child: MaterialApp(theme: buildTheme(Brightness.light), home: ExercisePage(ex: exo))));
    await tester.pumpAndSettle();
    expect(find.textContaining('TEXTE-DU-COFFRE'), findsNothing);
    expect(find.textContaining('Voir la solution'), findsNothing);

    final coach = (await tester.runAsync(() => state('encadreur')))!;
    await tester.pumpWidget(AppScope(state: coach, child: MaterialApp(theme: buildTheme(Brightness.light), home: ExercisePage(ex: exo))));
    await tester.pumpAndSettle();
    expect(find.textContaining('TEXTE-DU-COFFRE'), findsNothing, reason: 'cachée jusqu\'au clic');
    // Les fichiers se lisent hors de l'horloge simulée du test : on charge le coffre avant d'afficher.
    await tester.runAsync(() => coach.coffre.get('exo:e1'));
    await tester.tap(find.textContaining('Voir la solution'));
    await tester.pumpAndSettle();
    expect(find.textContaining('TEXTE-DU-COFFRE'), findsOneWidget);
  });
}
