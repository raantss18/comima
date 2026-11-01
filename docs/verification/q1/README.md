# Q1 — les quatre chapitres restants d’Engel

ARHeritiana, 28 octobre 2026. Douze notions et 180 questions nouvelles, soit trois notions par chapitre et quinze questions par notion. Chacune contient une fiche FR/EN et trois questions à chacune des cinq difficultés. Banque complète après P1/Q1 : **24 notions, 516 questions**.

| Chapitre | Notions (préfixes des identifiants) |
| --- | --- |
| 10 — Polynômes | `polynomes-racines`, `polynomes-factorisations`, `polynomes-restes` |
| 11 — Équations fonctionnelles | `fonctionnelles-substitutions`, `fonctionnelles-polynomiales`, `fonctionnelles-iterations` |
| 13 — Jeux | `jeux-positions`, `jeux-symetrie`, `jeux-algebriques` |
| 14 — Autres stratégies | `strategies-graphes`, `strategies-descente`, `strategies-conjugues` |

Formats existants uniquement : numérique, expression, ensemble, couple, vrai-faux, QCM, ordre et trous. Aucun moteur, workflow, template, version, compte ou secret modifié. Aucun énoncé de bibliothèque ou chapitre PDF modifié : rien à recompiler en LaTeX dans ce lot de quiz.

## Sources et vérification

Chaque question cite en commentaire la référence complète et l’identifiant de l’exercice source. `sources.json` fournit les 180 correspondances ; les traductions et adaptations sont explicites. La relecture des preuves et ses limites sont dans `REVIEW.md`. Aucune solution de livre n’est recopiée, aucune revue humaine n’est déclarée.

Commandes reproductibles depuis la racine :

```sh
python3 docs/verification/q1/check.py
node docs/verification/q1/render.mjs
npm run app-packs
npm test
npm run build
```

- Calculs indépendants : 180 contrats de sources ; 158 contrôles de réponses et modèles finis, avec séparation explicite des preuves universelles. Vérifications symboliques, fractions exactes, récursions binaires, jeux finis par deux méthodes, attaques sur les 64 cases, triangulations et coloriage à neuf sommets.
- KaTeX strict : **2 076 formules** acceptées, 1 334 champs textuels parcourus, aucun délimiteur isolé.
- `npm run app-packs` : 24 notions, 516 questions, 9 paquets ; bibliothèque inchangée (1 366 exercices, 10 cours).
- `npm test` : 38 réussis, 1 ignoré (WASM absent localement). Le CI `check` teste le vrai moteur Rust et Flutter avant fusion ; l’acceptation d’une clé par le moteur ne démontre pas la justesse mathématique de cette clé.
- Build de production et contrôle Flutter supplémentaire : résultats à consigner après exécution.

Le fichier `../q1-mobile.dart` contrôle les titres, fiches, énoncés, explications, choix, étapes et textes à trous FR/EN à 320 px et police ×1/×2. Il est copié temporairement dans `app/test/` pour exécution, puis retiré ; il n’introduit aucune modification du code de l’application.

Les contrôles après fusion (pages FR/EN et empreintes des paquets) ainsi que les parcours manuels complets sur téléphone, mise à jour installée et hors ligne doivent être distingués de ces validations automatisées. Aucun parcours manuel Android complet n’est annoncé ici.
