# Consignes pour les sessions Claude (Antsa et ARHeritiana)

Ce dépôt est travaillé depuis **deux machines**. Avant toute chose :

1. Lire `docs/REPARTITION.md` : qui fait quoi, choix, règles de coordination. **La conception de cours
   (chapitres, recueil, fiches, quiz, illustrations, simulations, jeu de constructions, solutions) est la
   part d'ARHeritiana ; la technique et la publication de l'application sont celles d'Antsa.**
2. Lire les listes de tâches : `docs/TODO.md` (site) et `docs/app/TODO.md` (application). Inscrire son nom
   dans « Pris par » avant de commencer ; ne jamais prendre une tâche déjà prise.
3. `git pull` avant de brancher ; une branche + une PR par tâche ; **fusionner seulement quand tous les
   contrôles sont verts** ; regrouper les fusions (chaque fusion sur `main` relance le déploiement et annule
   celui en cours).

## Règles qui ne se discutent pas

- **Ne pas publier de version** (ni toucher `app/pubspec.yaml`, `app/release.json(.sig)`, aux tags
  `app-v*`, à `release-keys/`) sauf si tu es la session d'Antsa. Les clés de signature ne sont jamais dans Git.
- **Aucun secret** (clé, mot de passe, `service_role`) dans Git, une PR, un journal ou une discussion.
- **Contenu sourcé, rien d'inventé** : énoncés repris à l'identique avec la source complète
  (`scripts/import-lot.mjs`), traductions signalées, aucune solution de livre recopiée. Le dossier
  `ressource/` (livres, sujets) est ignoré par Git et n'est jamais publié.
- **Compiler les PDF de ses lots** (`node scripts/build-latex.mjs`) et corriger les erreurs LaTeX avant la PR
  (un `#` doit s'écrire `\#`).
- **Léger et confortable**, site et application ; tester sur téléphone (largeur mobile) ; l'application doit
  rester compatible avec les anciennes WebView Android (pas de `?.`, `??`, `replaceChildren`… sans polyfill).
- Les nouveautés d'une version vont sous `## [Non publié]` de `app/CHANGELOG.md` (une ligne par changement,
  en français et en anglais) ; seul celui qui publie crée la section datée.
- Le site n'affiche **jamais** de numéro de version de l'application.

## Commandes utiles

```bash
npm test                         # tests du site (doivent passer avant toute PR)
node scripts/build-index.mjs     # index des exercices, sujets, cours
node scripts/build-app-packs.mjs # paquets de contenu de l'application (valide content/app/)
node scripts/build-latex.mjs     # compile les PDF (long la première fois, ensuite incrémental)
cd app/native && cargo test      # moteur de correction + banque de questions
```
