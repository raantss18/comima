# PY1 — validation du chapitre lycée (28 octobre 2026)

Contenu : chapitre 9 « Python et algorithmes de base », 9 pages A5 (pages 114 à 122), dix exercices FR/EN. Bibliographie et adaptations : `docs/sources/PY1.md`. Aucun corrigé d’exercice n’est ajouté.

## Vérifications locales

- `python3 docs/verification/py1-cours.py` : **OK**, les sept programmes imprimés sont extraits du chapitre et exécutés sous CPython et dans le moteur COMIMa ; 1 435 exécutions identiques. Les résultats sont aussi comparés à des calculs indépendants : PGCD, position d’insertion, Fibonacci et primalité.
- `COMIMA_ONLY=cours/09-python-algorithmes/ node scripts/build-latex.mjs` : **OK**, un chapitre compilé ; `COMIMA_ONLY=exercices/recueil-9- node scripts/build-latex.mjs` : **OK**, vingt PDF FR/EN compilés. Aucun `Overfull` dans les journaux finaux. Les neuf pages du chapitre et les vingt pages des exercices ont été rendues et relues visuellement ; correction du débordement de l’exercice `range`.
- `node scripts/build-index.mjs`, `node scripts/build-app-packs.mjs`, `node scripts/pagination.mjs` : **OK**, chapitre et dix exercices présents, pagination continue, aucune solution associée aux nouveaux exercices.
- `npm test` : **OK**, 38 tests réussis, un ignoré car le moteur WebAssembly n’est pas compilé localement.
- `cargo test --manifest-path app/native/Cargo.toml` : **OK**, aucune erreur (un test de charge ignoré par défaut).
- `BASE_PATH=/ SITE_URL=https://www.comima.mg ./node_modules/.bin/astro build` : **OK**, 2 882 pages produites.
- Application : copie temporaire de `py1-cours-ui.dart` sous `app/test/`, puis `flutter test test/math_text_test.dart test/reponses_test.dart test/py1_temp_test.dart` : **OK**, 50 tests, dont les dix énoncés dans les deux langues à 320 px et aux échelles de texte 1 et 2. La copie temporaire est supprimée après le test. Aucun code de l’application n’est modifié.
- Navigateur local à 375 px : **OK**, chapitre (plan de neuf sections, dix liens d’exercices) et exercice final ; formules rendues et crédits/source visibles. Largeur du document 360 px, inférieure à celle de la fenêtre (375 px), aucun défilement horizontal.

## Limites explicites

Le déploiement en ligne et le téléchargement des nouveaux paquets ont ensuite été vérifiés après fusion : voir le complément PY1 de `docs/RAPPORT-TESTS.md` et `py1-en-ligne.py`. Les vérifications Flutter portent sur le rendu des textes et le contrôle des réponses ; elles ne remplacent pas l’ouverture manuelle du PDF dans une application Android installée, ni un parcours hors ligne complet.
