# Consignes pour les sessions Codex (Antsa et ARHeritiana)

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

## Collaboration : qui fusionne quoi (décisions d'Antsa et d'ARHeritiana, 26 oct. 2026)

**Flux commun.** Une branche et une PR par tâche ; la tâche terminée, vérifiée (`npm test`) et poussée,
**ouvrir la PR tout de suite**, sans attendre qu'on le demande. Titre en français. Fusion **squash**, seulement
quand `check`, `web` et `supabase` sont verts, en regroupant les fusions (chaque fusion sur `main` relance le
déploiement et annule celui en cours).

**1. Autonome : fusionner soi-même, sans relecture ni demande** (ARHeritiana, et Antsa pour ses propres PR) —
une PR qui ne touche **que** :
`content/**` (exercices, sujets, cours, quiz, fiches et questions d'entraînement), `src/content/**` (actualités),
`src/scripts/fiche/**` et `src/scripts/cours/**` (illustrations), `docs/**`, la section `## [Non publié]` de
`app/CHANGELOG.md`. Le contenu part sur le site et dans l'application **sans nouvelle version** (`docs/CONTENU.md`).

**2. Relecture d'Antsa avant fusion** — dès qu'une PR touche l'un de ces chemins : `templates/**` et `scripts/**`
(gabarits LaTeX et chaîne de fabrication : elles changent **tous** les PDF et le déploiement), `src/lib/**`,
`src/layouts/**`, `src/components/**`, `src/views/**`, `src/styles/**`, `tests/**`, `app/**` (hors CHANGELOG),
`supabase/**`, `.github/**`, `package.json`, `content/app/compat.json`. Demander la relecture
(`gh pr edit <n> --add-reviewer raantss18`) **une seule fois**, sur la PR qui part vers `main`.
**Ne pas demander de relecture pour une PR de la catégorie 1** : elle se fusionne seule.

**3. Réservé à Antsa** : publier une version (`app/pubspec.yaml`, `app/release.json(.sig)`, tags `app-v*`),
les clés (`release-keys/`), les comptes et le serveur Supabase.

**Ne jamais supprimer la branche d'une PR qui sert de base à d'autres** (pas de `--delete-branch` à la fusion
de la racine d'une pile) : GitHub **ferme** alors les PR empilées dessus (accident du 26 oct. : #83 à #90). Après la
fusion de la racine, d'abord `gh pr edit <n> --base main` sur chaque PR empilée, puis supprimer la branche.

**PR empilées** (série d'étapes qui dépendent les unes des autres, ex. S2) : permises. La PR **racine** vise
`main` ; les autres visent la branche de la précédente. Fusionner **de bas en haut**, une à la fois : après la
fusion de la racine, rebaser la suivante sur `main` (`gh pr edit <n> --base main`) puis la fusionner. Seule la
PR racine demande une relecture, et seulement si elle est de catégorie 2 ; les PR empilées qui ne touchent que
du contenu se fusionnent ensuite sans relecture.

**Début de session d'Antsa** : `gh pr list --search "review-requested:@me"` et `gh pr list --state open` pour voir
ce qui attend ; relire les PR de catégorie 2, signaler les blocages dans la PR plutôt que par un autre canal.
**Début de session d'ARHeritiana** : `git pull`, lire `docs/REPARTITION.md` (colonne « État ») et les
commentaires des PR ouvertes.

**Sources** : une question tirée d'un problème d'Engel garde sa source en commentaire YAML (`# Source : …`)
au-dessus de la question ; elle n'est jamais affichée à l'élève.

## Commandes utiles

```bash
npm test                         # tests du site (doivent passer avant toute PR)
node scripts/build-index.mjs     # index des exercices, sujets, cours
node scripts/build-app-packs.mjs # paquets de contenu de l'application (valide content/app/)
node scripts/build-latex.mjs     # compile les PDF (long la première fois, ensuite incrémental)
cd app/native && cargo test      # moteur de correction + banque de questions
```
