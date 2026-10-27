# Banque rédigée 1.3.0 — complément final du 27 octobre 2026

PR #123, ARHeritiana (session Codex). Le complément reprend les quatre notions encore sous le seuil ; il ne remplace pas les ajouts déjà présents dans la PR.

| Notion | Avant ce complément | Après |
| --- | ---: | ---: |
| suites-lineaires | 20 | 25 |
| tiroirs-bases | 23 | 25 |
| invariants | 23 | 25 |
| suites-periodes-sommes | 24 | 25 |

La banque complète contient **315 questions dans 12 notions**, de 25 à 30 par notion. Les niveaux de difficulté déterminent les étapes (voir `content/app/README.md`). Aucun nouveau type ni format de question.

## Sources et corrections

Les dix ajouts sont des sous-questions explicitement signalées comme adaptations pédagogiques. Les références ont été confrontées aux énoncés et métadonnées présents dans `content/exercices/` : Engel 9.5 (p. 225), 9.36 (p. 227), 9.58–59 (p. 229), 1.49–50 (p. 13), recueil COMIMa 3.5 et 3.16. Les commentaires YAML donnent la provenance ; les corrections FR/EN sont rédigées pour ces questions.

## Vérifications reproductibles

- `node docs/verification/banque-1-3-0.mjs` : seuil de 25 dans chaque notion et réponses des dix ajouts. Pavages énumérés case par case puis comparés au raisonnement par blocs ; opérations des invariants explorées dans tous les ordres ; moyenne calculée exactement puis comparée à la formule des différences ; somme calculée par table puis par télescopage des sommes partielles.
- `node scripts/check-content.mjs` : 315 questions, aucune redondance ; 1 356 énoncés d'exercices comparés.
- `npm run app-packs` : validation du format et construction des huit paquets de contenu.
- Les 222 occurrences de formules des dix ajouts (énoncés, choix et explications FR/EN) sont acceptées par KaTeX avec `throwOnError: true`.

La suite standard `npm test` et le build Astro sont également lancés avant la mise à jour de la PR. Le contrôle CI `check` exécute les tests Rust des réponses et les tests Flutter. Rust/Flutter ne sont pas installés dans le conteneur local ; le test WebAssembly local est ignoré tant que son binaire n'est pas compilé. Les fichiers PDF ne changent pas dans ce lot YAML.

Les essais manuels dans l'application installée et dans l'interface du site en ligne ne sont pas attestés ici : ils restent dans la tâche distincte « Rapport de tests », `docs/RAPPORT-TESTS.md` (B1, B2 et B6 notamment). Cette note ne remplace pas ce rapport.
