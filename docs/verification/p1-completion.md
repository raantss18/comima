# P1 — couverture des étapes des trois notions Suites

ARHeritiana, session Codex, 28 octobre 2026. Périmètre : les trois notions Suites déjà engagées dans P1, avec au moins cinq questions rédigées à chacune des cinq difficultés. Les notions de bases des autres thèmes ne sont pas artificiellement prolongées jusqu’au niveau olympiade.

| Notion | Avant (difficultés 1 à 5) | Après |
| --- | --- | --- |
| suites-convergence | 4, 9, 7, 4, 2 | 5, 9, 7, 5, 5 |
| suites-lineaires | 7, 7, 9, 5, 1 | 7, 7, 9, 5, 5 |
| suites-periodes-sommes | 6, 7, 10, 5, 4 | 6, 7, 10, 5, 5 |

Dix ajouts : sc-27 à sc-31, sl-30 à sl-33, sp-33. Les commentaires YAML citent les métadonnées et les énoncés anglais conservés dans `content/exercices/engel-09-*`. Sous-questions/adaptations explicites, corrections originales ; le PDF privé d’Engel n’est pas disponible dans ce nouvel environnement et aucune nouvelle confrontation au livre n’est revendiquée.

`python3 docs/verification/p1-completion.py` contrôle les réponses par calcul exact : identités symboliques, bornes binomiales, permutations par énumération et programmation dynamique, pavages par occupation des cases et comptage par blocs. Les implications générales de preuve reposent aussi sur la relecture mathématique des corrections, pas sur des échantillons.

Validation locale : `npm run app-packs` accepté ; `npm test` : 38 réussis, 1 ignoré (moteur WASM absent). Aucun chapitre ni énoncé PDF modifié : pas de PDF à recompiler. Rust et Flutter doivent être validés par le contrôle CI `check` avant fusion. Les essais complets dans l’application Android et le contrôle après publication restent à attester ; cette note ne les remplace pas.
