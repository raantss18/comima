import 'dart:io';

import 'package:comima/core/app_state.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('défis : les versions réussies sont gardées par profil, sans doublon, et survivent au redémarrage', () async {
    final dir = Directory.systemTemp.createTempSync('comima-defis');
    final s = AppState(dir: dir);
    await s.progress.load();
    await s.progress.addProfile({'name': 'Rova', 'role': 'eleve'});
    expect(s.progress.solvedDefis, isEmpty);
    await s.progress.solveDefi('robot-qui-tourne', 0);
    await s.progress.solveDefi('robot-qui-tourne', 0);
    await s.progress.solveDefi('robot-qui-tourne', 2);
    await s.progress.solveDefi('code-du-cadenas', 1);
    // Valeurs refusées : identifiant ou version invalides.
    await s.progress.solveDefi('../x', 0);
    await s.progress.solveDefi('bons-voisins', -1);
    expect(s.progress.solvedDefis, {'robot-qui-tourne': [0, 2], 'code-du-cadenas': [1]});

    final again = AppState(dir: dir);
    await again.progress.load();
    expect(again.progress.solvedDefis, {'robot-qui-tourne': [0, 2], 'code-du-cadenas': [1]});

    // Un autre profil part de zéro.
    await again.progress.addProfile({'name': 'Hery', 'role': 'eleve'});
    expect(again.progress.solvedDefis, isEmpty);
  });
}
