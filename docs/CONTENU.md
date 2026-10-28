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

## Questions de code (Python), corrigées automatiquement

Une question `type: code` avec `langage: python` est **exécutée** par le moteur (même code Rust dans l'application et
sur le site, en WebAssembly). Champs : `fonction` (nom de la fonction à écrire), `squelette` (`{fr,en}`, ce que l'élève
voit au départ), `tests` (affichés comme exemples, et détaillés en cas d'échec), `tests_caches` (jamais détaillés),
**`reference`** (ta solution complète, **jamais publiée** : `cargo test` la passe contre tous les tests, ce qui attrape
les tests faux ; la commande est `cd app/native && cargo test`).

- **Sous-ensemble Python** : `def`, `return`, affectations (dont `a, b = b, a % b` et `l[i] = x`), `+= -= *= //= %= **=`,
  `if/elif/else`, `while`, `for … in`, `break`, `continue`, entiers (64 bits : un dépassement est une erreur), flottants,
  booléens, `None`, chaînes, listes, tuples, listes en compréhension, `x if c else y`, `and or not in is`, comparaisons
  chaînées, découpage `l[a:b:c]` ; fonctions `range len abs min max sum int float str bool list tuple sorted reversed
  enumerate zip any all pow divmod round chr ord print` ; méthodes de listes (`append pop extend insert remove sort
  reverse count index copy`) et de chaînes (`upper lower strip split join replace find count startswith endswith isdigit
  isalpha`). **Pas** de `import`, de dictionnaires, d'ensembles, de classes, de `lambda`, d'`input` ni de fichiers.
- **Bornes** : 2 millions d'opérations, récursion à 120 niveaux, listes et chaînes à 200 000 éléments : une boucle
  infinie donne « ton code met trop de temps », jamais un blocage.
- **Jamais comptée fausse** : erreur de syntaxe, fonction absente, réponse vide.
- **Écrire de bons tests** : 2 ou 3 exemples affichés (cas simple, cas limite), 3 à 6 tests cachés (cas limites : 0, 1,
  grands nombres, listes vides ou à un élément, valeurs égales). Les sorties sont comparées en JSON (un tuple vaut une
  liste, un nombre à 1e-9 près).
- `langage: pseudo` n'est pas encore corrigé automatiquement : la question est proposée en **défi facultatif**.

## Visuel : cours et articles « peu de texte, beaucoup d'image » (0.9.2)

- **Article** : une photo en tête (`image:`), un **titre court**, un `resume:` de **2 lignes**, des intertitres courts, des
  paragraphes de 3 lignes au plus, une photo ou un schéma tous les 2 à 3 paragraphes. Un bouton d'action s'écrit en Markdown :
  `[[Télécharger l'application]](https://…)` (bouton plein dans l'application, lien sur le site). Pas de HTML : l'application
  retire tout balisage brut (un test échoue sinon).
- **Chapitre de cours** : une image ou un schéma d'en-tête, **3 à 5 « points clés »** d'une ligne (encadré `retenir`), une
  illustration interactive, puis le texte. Un schéma vaut mieux qu'un paragraphe.
- **Ce que l'application garantit** : aucun LaTeX, HTML ou Markdown brut affiché ; une formule trop large est réduite pour tenir
  sur l'écran. Si tu vois autre chose dans l'application, c'est un défaut à signaler dans `RAPPORT-TESTS.md`.


## Réponses et solutions : réservées aux encadreurs validés (décision d'Antsa, 27 oct. 2026)

- Un **élève** (toute personne dont le profil n'est pas « encadreur », y compris sans compte) ne voit **jamais** une solution d'exercice, ni la réponse ou l'explication
  d'une question (un seul essai, puis la suivante). Seul un **encadreur validé par le Bureau** les lit, dans l'application, depuis le **coffre** Supabase.
- **Ce qui est public** : énoncés, fiches, indices, cours (édition sans solutions), PDF d'épreuves (sans corrigés). **Ce qui est dans le coffre** : `solution.tex` des
  exercices et `explication` des questions. Les paquets de l'application et les pages du site n'en contiennent plus rien.
- **Tu continues à écrire** `solution.tex` et les `explication` comme avant, dans les mêmes fichiers. Après chaque fusion qui en change, Antsa (ou Claude Code) régénère
  le coffre : `COMIMA_COFFRE_SQL=1 node scripts/build-app-packs.mjs`, puis colle `release-keys/coffre.sql` dans le SQL Editor de Supabase (une seule requête, ré-exécutable).
- **Limite connue** : tant que le dépôt GitHub est public, `solution.tex` et les `explication` y restent lisibles (et dans l'historique). Étape suivante : les sortir du dépôt public
  (dépôt privé ou fichiers chiffrés) ; en attendant, ne confie ces textes à aucun outil externe sans nécessité.
- **Corrigés des sujets de concours** : les PDF publics ne contiennent que l'épreuve ; la version avec corrigés est gardée par Antsa (`release-keys/coffre/sujets/`).
- Une question doit **tenir sans son explication** : mets le raisonnement général dans la **fiche** de la notion (publique, pédagogique) ; garde dans `explication` la correction détaillée.

## Questions générées (1.3.0)

Chaque série d'entraînement et le Défi mélangent tes questions rédigées et des **questions générées** par le moteur (`app/native/src/gen.rs`, 31 modèles,
5 niveaux) : les nombres sont tirés au hasard et la réponse est **calculée**, donc toujours exacte. Elles sont rattachées aux notions par `notions: […]`
dans la table `KINDS` ; une notion sans modèle n'a que ses questions rédigées.

- **Ce qui reste à toi** : les questions « de concours » (raisonnement, preuves, problèmes à trouvaille) ne se génèrent pas : écris-les en YAML comme avant.
  Plus ta banque est grande, moins deux séries se ressemblent.
- **Ajouter un modèle** : une fonction `k_xxx(rng, niveau) -> Out` + une ligne dans `KINDS`. Les tests (`cargo test`) exigent : bonne réponse acceptée,
  mauvaise refusée, énoncé FR et EN, au moins 18 énoncés différents sur 200 graines, aucun « 1x ». Donne toujours une `explication` : elle n'est vue que des
  encadreurs, et d'un élève après une bonne réponse.
- Les questions générées comptent dans les statistiques mais **pas** dans l'avancement d'une notion (qui suit tes questions rédigées).
