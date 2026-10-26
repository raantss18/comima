# Publier du contenu sans publier l'application

> Pour **ARHeritiana** et ses sessions Claude : tu peux publier du contenu **seul, sans demander
> l'accord d'Antsa**, tant que tu respectes la liste « Autonomie » ci-dessous.

## Les contenus d'entraînement sont ta part, en accès total

Notions, fiches, **toutes les questions** et leurs explications (`content/app/notions/*.yaml`), illustrations
et ordre des étapes : **c'est ARHeritiana qui décide et qui publie**, sans l'accord d'Antsa, **sans attendre une
version de l'application** (décision d'Antsa, 26 oct. 2026). Seule limite technique : un **nouveau type** de question
(au-delà des 12 existants : qcm, vrai-faux, numeric, expression, ensemble, n-uplet, intervalle, ordre, trous, code,
simulation, preuve) exige le moteur de correction de l'application ; on en parle à Antsa avant de l'utiliser.
Les questions de type `code`, `simulation` et `preuve` ne peuvent pas être corrigées automatiquement : l'application
et le site les proposent **à la fin de la série, au choix, sans score**.

## Ce qui part en ligne tout seul (aucune nouvelle version de l'application)

Fusionner une PR sur `main` déclenche le déploiement : le site **et** les paquets de l'application
(`https://www.comima.mg/app/v1/`) sont reconstruits. L'application installée les récupère au
lancement (et en tirant l'écran *Entraînement* vers le bas), **sans changer de version** :

| Contenu | Où l'écrire | Visible dans l'application |
| --- | --- | --- |
| Quiz et fiches d'entraînement | `content/app/notions/*.yaml` | au prochain lancement |
| Exercices, énoncés, solutions (bibliothèque) | `content/exercices/…` (outil `scripts/import-lot.mjs`) | au prochain lancement |
| Chapitres du cours, sujets, actualités, simulations (liste) | `content/cours`, `content/sujets`, `src/content/actualites` | au prochain lancement |
| Illustrations interactives des fiches et chapitres | `src/scripts/fiche/*.ts`, `src/scripts/cours/*.ts` | au prochain lancement |
| PDF (cours, sujets, exercices) | compilés par `node scripts/build-latex.mjs` | sur le site (l'application ouvre le PDF du site) |

## Pourquoi l'application ne casse jamais (robustesse hors ligne)

- Les contenus **fournis avec l'APK** restent toujours là : sans réseau, tout marche.
- Les mises à jour sont **vérifiées** (empreinte SHA-256 de chaque fichier, vérifiée par le moteur Rust)
  puis **installées d'un bloc** : un téléchargement interrompu ou altéré est ignoré, l'élève garde ses
  contenus actuels. Au démarrage, si les contenus téléchargés sont illisibles, l'application retombe sur ceux
  de l'APK.
- L'application garde toujours le contenu **le plus récent** entre celui de l'APK et celui téléchargé.
- `content/app/compat.json` : `minAppBuild` = numéro de build minimal de l'application pour lire les
  contenus. Une application plus ancienne **n'installe pas** des contenus qui l'exigent et garde les siens.
  **Ne le modifie pas** (c'est le travail d'Antsa, quand un vrai changement de l'application est nécessaire).
- Format des quiz : types de questions limités à la liste de `scripts/build-app-packs.mjs` ; une erreur
  de format fait échouer le build **dans la PR** (pas sur `main`).

## Éviter les redondances

`npm test` lance `scripts/check-content.mjs` et **échoue** si :

- deux notions ou deux questions ont le même identifiant ;
- deux questions ont le même énoncé et la même réponse ;
- deux exercices ont des énoncés identiques (comparaison indépendante de la casse, des accents, de
  l'espacement et de la mise en forme LaTeX) ;
- un `meta.yaml` a un `id` différent de son dossier.

Un doublon **voulu** (même énoncé pour deux usages) se déclare dans `content/doublons-acceptes.txt`
(une ligne « id-a id-b », avec un commentaire après `#`). Avant d'écrire un lot, cherche le sujet dans
`content/exercices/` et `content/app/notions/` : mieux vaut enrichir l'existant que doubler.

## Autonomie : ce que tu peux fusionner seul

**Oui, sans permission** — une PR qui ne touche que :
`content/**`, `src/content/**`, `src/scripts/fiche/**`, `src/scripts/cours/**`, `docs/**`,
`app/CHANGELOG.md` (section `## [Non publié]`) — **quand les trois contrôles sont verts** (`check`, `web`,
`supabase`) et après avoir regroupé tes fusions (voir `REPARTITION.md`, règle 8).

**Non, demander à Antsa** (la PR doit attendre) : `app/lib/**`, `app/native/**`, `app/pubspec.yaml`,
`app/release.json(.sig)`, `content/app/compat.json`, `supabase/**`, `.github/**`, `scripts/**`,
`src/lib/**`, les tags de version, tout nouveau **type de question** ou nouveau format.

## Avant de fusionner (liste de 1 minute)

1. `git pull`, puis `npm test` (redondances, format, site) et `npm run app-packs`.
2. Énoncés repris à l'identique, **source** renseignée, aucune solution de livre recopiée.
3. PDF compilés si tu as ajouté des énoncés/chapitres (`node scripts/build-latex.mjs`).
4. Une ligne FR + une ligne EN sous `## [Non publié]` de `app/CHANGELOG.md`.
5. Contrôles verts → **fusionner** → attendre la fin du déploiement (onglet *Actions*) → vérifier
   `https://www.comima.mg/app/v1/manifest.json` (nouvelle `version`).
