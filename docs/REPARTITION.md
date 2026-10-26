# Répartition des tâches — COMIMa (site + application)

Fichier **commun** aux deux machines : celle d'**Antsa** (machine « clés ») et celle d'**ARHeritiana**
(sessions Claude dans le cloud). Chacun le lit avant de commencer et **y inscrit ce qu'il prend** ;
les cases à cocher détaillées restent dans [`TODO.md`](TODO.md) (site) et
[`app/TODO.md`](app/TODO.md) (application). Dernière mise à jour : 26 octobre 2026.

> Ce fichier est un point de départ : on l'adapte au fil de l'eau (ajouter, déplacer, rayer).
> **Règle d'or : une tâche = une personne.** Avant de commencer, mettre son nom dans « Pris par »
> (petit commit sur `main` ou dans la PR), pour que l'autre machine ne refasse pas le même travail.

## 1. Qui peut faire quoi (constat)

Le retour d'ARHeritiana (capture du 26 oct., publication de l'application 0.5.0) est clair :
sa session peut **écrire du code et du contenu**, mais **pas publier une version**. Il manque :

| Il faut… | Antsa (machine « clés ») | ARHeritiana (cloud) |
| --- | --- | --- |
| Clé de signature Android (`release-keys/comima-release.jks`) et clé Ed25519 des mises à jour | ✅ ici, jamais dans Git | ❌ (et il ne faut **pas** la lui envoyer) |
| Construire l'APK (Flutter, Android SDK, `cargo-ndk`) et le tester sur émulateur | ✅ | ❌ |
| Publier la release GitHub `app-vX.Y.Z` (avant de fusionner `release.json`) | ✅ | ❌ |
| Tableaux de bord Supabase / console Facebook / DNS | ✅ (ou le Bureau) | ❌ |
| Contenu : exercices, LaTeX, notions de quiz, articles, pages du site | ✅ | ✅ |
| Tests `npm test`, build du site, vérifications de contenu | ✅ | ✅ |
| LaTeX (`latexmk`) pour compiler des chapitres | ✅ | ✅ (CI sinon) |

**Conséquence** : tout ce qui touche au code ou au contenu peut se faire des deux côtés ; tout ce qui
**signe, construit l'APK, publie ou configure un compte externe** se fait sur la machine d'Antsa.
Le travail d'ARHeritiana s'arrête donc à « **prêt à publier** » (code fusionné, `CHANGELOG`, tests
verts) et Antsa publie.

## 1 bis. Décision du 26 oct. : la conception de cours est la part d'ARHeritiana

**ARHeritiana est responsable de la conception pédagogique** : tout ce que l'élève *lit, manipule et
s'entraîne à faire* sur le site et dans l'application. Concrètement, il décide et rédige :

- les **chapitres du cours** et le **recueil** (LaTeX, plan, progression, gabarits) ;
- les **fiches de notion** et leurs **quiz** (`content/app/notions/`), dont les 5 étapes d'Engel ;
- les **illustrations interactives**, les **simulations** et le **jeu de constructions** (idée, scénario,
  textes, niveaux de difficulté) ;
- le **choix et l'ordre des exercices** (palier, difficulté, étape de la progression) et les **solutions**.

**Antsa garde la partie technique et la publication** : construire, signer et publier l'application,
Supabase/Facebook/CI, intégration dans l'application (WebView, écrans), performances, et la relation avec le
Bureau. Antsa **ne change pas** le fond pédagogique d'ARHeritiana sans en discuter ; ARHeritiana **ne
change pas** le code de l'application ni les clés sans passer par une PR relue.

Quand une tâche mêle les deux (ex. nouvelle figure : idée et texte = ARHeritiana, intégration dans
l'application = Antsa), elle est coupée en deux lignes dans le tableau.

## 2. Choix à faire (avec recommandation)

| # | Question | Options | Recommandation |
| --- | --- | --- | --- |
| C1 | Qui publie les versions de l'application ? | **A.** Seulement la machine d'Antsa (clés locales) · **B.** La CI GitHub, avec les clés en *secrets* du dépôt (`RELEASING.md`) · **C.** Les deux machines | **A maintenant**, **B ensuite** : une fois la CI configurée, tout collaborateur déclenche une publication sans clé sur sa machine. Jamais C (clés à deux endroits). |
| C2 | Numéro de version | **A.** Chacun l'augmente dans sa PR · **B.** Seul celui qui publie le change | **B.** Les PR de contenu/fonctions n'écrivent que sous `## [Non publié]` du `CHANGELOG` ; **seul le publieur** change `pubspec.yaml`, `release.json` et date la section. Évite les conflits (cf. 0.5.0 déjà dans `pubspec` mais pas publiée). |
| C3 | Branches et fusion | **A.** Tout le monde pousse sur `main` · **B.** Une branche + une PR par tâche, fusion par Antsa | **B.** Branches `nom/sujet` (ex. `arh/quiz-suites`), PR petites, fusion après `npm test`. Toujours `git pull` avant de brancher. |
| C4 | Jeu de constructions « type Euclidea » | **A.** D'abord sur le **site** (JavaScript, partagé avec l'application dans une WebView, comme les 18 figures de la 0.5.0) · **B.** Flutter natif seulement | **A.** Une seule implémentation, léger, testable sans téléphone ; l'app l'affiche comme les figures. |
| C5 | Solutions des exercices d'Engel | **A.** Recopier celles du livre · **B.** Les rédiger nous-mêmes (encadreurs) · **C.** Renvoyer au livre | **B** pour les problèmes les plus utilisés, **C** pour le reste. **Jamais A** (droits d'auteur). |
| C6 | Poids de l'application (bibliothèque 1,4 Mo, 260 Ko compressée, avec 1 356 exercices) | **A.** Laisser · **B.** Découper la bibliothèque par palier et télécharger à la demande | **B** quand on dépasse ~3 Mo. Pas urgent ; garder « léger et confortable » comme règle. |
| C7 | Comptes gérés (élèves sans e-mail) : pseudo + code | **A.** Fonction serveur Supabase · **B.** Reporter | **B** tant que Google/e-mail ne sont pas testés avec de vrais élèves ; puis **A**. |
| C8 | Connexion Facebook par l'application Facebook | **A.** Maintenant · **B.** Plus tard | **B** (décidé le 26 oct.) ; code prêt sur la branche `facebook-app`. |

## 3. Liste des tâches

Légende **Besoin** : 🔑 clés/appareil d'Antsa · 🖥 aucune ressource spéciale (n'importe quelle machine) ·
🧪 Rust/Cargo pour tester le moteur (`cargo test`) · 📐 LaTeX. **Reco** : A = Antsa, R = ARHeritiana,
**A/R** = au choix. « Pris par » : à remplir.

### P0 — à faire tout de suite

| ID | Tâche | Besoin | Reco | Pris par | État |
| --- | --- | --- | --- | --- | --- |
| R1 | **Publier l'application 0.5.0** (illustrations hors ligne) : construire les 4 APK, tester la mise à jour 0.4.0 → 0.5.0 sur émulateur, `python3 app/tool/release.py`, release GitHub *Latest*, fusion de `release.json`. Le code est déjà sur `main` (`pubspec` 0.5.0+5). Inclure les 1 113 énoncés d'Engel (branche `engel-suite`, PR à venir). | 🔑 | **A** | Antsa | en cours (26 oct.) |
| R2 | Ajouter `https://www.comima.mg/**` aux *Redirect URLs* Supabase et **corriger l'identifiant Facebook** du fournisseur (vaut `mahay`, doit être l'App ID numérique) — `supabase/README.md`, 3 et 3 bis | 🔑 (tableau de bord) | **A** / Bureau | Antsa | à faire |
| R3 | **Sauvegarder `release-keys/`** hors de la machine (clé perdue = plus de mise à jour possible) | 🔑 | **A** | Antsa | à faire |

### P1 — contenu pédagogique (le gros du travail partageable)

| ID | Tâche | Besoin | Reco | Pris par | État |
| --- | --- | --- | --- | --- | --- |
| Q1 | **Quiz d'entraînement des 5 étapes d'Engel** : suites (ch. 9), polynômes (10), équations fonctionnelles (11), jeux (13), autres stratégies (14). ≥ 3 notions par chapitre, ≥ 15 questions par notion, format `content/app/README.md`. Une notion = un fichier `content/app/notions/<id>.yaml`. Réponses vérifiées par `cargo test` (test de banque). **Aucune invention** : questions tirées des énoncés sourcés ou de calculs exacts. **Conception : ARHeritiana.** | 🖥 🧪 | **R** (conception de cours : toutes les étapes, une notion = un fichier) | ARHeritiana | en cours : suites (ch. 9) fait — 3 notions, 70 questions ; restent polynômes (10), équations fonctionnelles (11), jeux (13), autres stratégies (14) |
| Q2 | Mettre les 7 étapes de la progression **en tête de l'entraînement** (site `training.ts` et app `practice.dart`), dans l'ordre, avec le badge « Progression de l'année » | 🖥 (site) + 🔑 (app) | **R** (ordre et textes), **A** (écran de l'app) | | à faire |
| Q3 | **Séries d'exercices calculés** (réponse exacte, vérifiée par le moteur) pour des milliers de questions d'entraînement : générateur de lots YAML à partir de formules (sommes, récurrences, divisibilité, dénombrements) | 🖥 🧪 | **R** (formules et lots), **A** (outil si besoin) | | à faire |
| E1 | **Extraire les autres documents de `ressource/`** : *South African Mathematics Olympiads training manual* (230 p.), stage Animath Sophia 2006 (65 p.), Olympiades nationales 2019 (30 p.), supports COMIA (zips LaTeX : contre-exemples, récurrence, tiroirs, géométrie, concours juin 2025). Outil : `scripts/import-lot.mjs` (énoncé **à l'identique**, source complète, traduction signalée). Le dossier `ressource/` n'est **jamais** publié. | 🖥 | **R** (ce qu'il possède) et **A** (les PDF de ma machine) | | à faire |
| E2 | **Énoncés officiels des IMO** (imo-official.org) : français 2006–2026, anglais avant, avec attribution | 🖥 | **R** | | à faire |
| E3 | **Olympiades nationales de première** (APMEP / Eduscol, avec corrigés) : niveau lycée 1–3 | 🖥 | **R** | | à faire |
| E4 | **Solutions rédigées** (par des encadreurs) des problèmes d'Engel les plus utilisés (choix C5-B) ; format `solution.tex` | 📐 | **R** + encadreurs | | à faire |
| E5 | Relecture : traductions françaises des 1 113 énoncés d'Engel (traduction COMIMa, à relire par un encadreur) ; coquilles du livre listées dans `TODO.md` | 🖥 | **R** + encadreurs | | à faire |
| G1 | **Géométrie type Euclidea** : constructions à la règle et au compas (propositions d'Euclide, livre I, domaine public) en mini-jeu + mini-quiz de géométrie (choix C4-A) | 🖥 | **R** (jeu web) puis **A** (WebView dans l'app) | | à faire |
| G2 | Simulations : ≥ 2 par nouveau chapitre/étape (suites, polynômes, équations fonctionnelles, jeux) — `src/lib/sims.ts` | 🖥 | **R** | | à faire |

### P2 — site

| ID | Tâche | Besoin | Reco | Pris par | État |
| --- | --- | --- | --- | --- | --- |
| S1 | Afficher les **nombres de ressources** dans les sections associées (Cours, Sujets, Entraînement) | 🖥 | **R** | | à faire |
| S2 | **Recueil complet** à jour : renuméroter les pages, unifier les deux gabarits LaTeX, recompiler (`TODO.md`, section Recueil) | 📐 | **R** | | à faire |
| S3 | Chapitres 1 à 7 : écrire les **solutions** des exercices (`a_solution: false` aujourd'hui) | 📐 | **R** + encadreurs | | à faire |
| S4 | Articles : lancement des regroupements d'Antananarivo et d'Ambositra (en attente d'infos et de photos) ; page Contact : encadrants à lister | 🖥 | **A** (contact avec le Bureau) | | en attente |
| S5 | Statistiques et profil sur le site (comme dans l'application) | 🖥 | **R** | | à faire |

### P1 bis — marque-pages (idée du 26 oct., version 0.6.0)

| ID | Tâche | Besoin | Reco | Pris par | État |
| --- | --- | --- | --- | --- | --- |
| B1 | **Conception** des marque-pages : états (pas vu, lu, testé, à continuer, fait), étoile « à voir », mots, icônes, filtres, compteurs | 🖥 | **R** (conception de cours) | | fait (0.6.0, à publier) |
| B2 | Site : pastille, filtres, stockage local `localStorage` | 🖥 | **R** | | fait (0.6.0, à publier) |
| B3 | Application : écran + `progress.json` (schéma 4, migration enchaînée, `.bak`) + tests | 🔑 | **A** | | fait (0.6.0, à publier) |
| B4 | Serveur : table `marks` (migration additive ré-exécutable, RLS, tests) + synchronisation site et application | 🔑 | **A** | | fait (0.6.0, à publier) |
| B5 | Vue encadreur (qui a lu / fait quoi), avec A1 | 🔑 | **A** | | fait (0.7.0, à publier ; migration `groupes_codes`) |

Détail : [`app/TODO.md`](app/TODO.md), section « Marque-pages ».

### P3 — application et serveur

| ID | Tâche | Besoin | Reco | Pris par | État |
| --- | --- | --- | --- | --- | --- |
| A1 | **Tableau de bord encadreur** + **proposition d'exercices en LaTeX** avec solution (application et site) → file de relecture → PR `content/exercices/` | 🔑 (app) / 🖥 (site) | **A** (app), **R** (site) | | à faire |
| A2 | Statistiques par groupe pour l'encadreur | 🔑 | **A** | | à faire |
| A3 | Comptes gérés (pseudo + code) — Edge Function (choix C7) | 🔑 | **A** | | reporté |
| A4 | Connexion par l'application Facebook (branche `facebook-app`) | 🔑 | **A** | | reporté |
| A5 | **Tester de bout en bout** Google, Facebook, e-mail (application et site) avec de vraies personnes | 🔑 | **A** + Bureau | | à faire |
| A6 | Publication par la CI (secrets GitHub : keystore, mots de passe, clé Ed25519, URL/clé Supabase) — choix C1-B | 🔑 | **A** | | à faire |
| A7 | Révision espacée, déblocage des notions, vrai clavier mathématique | 🔑 (test appareil) | **A** | | plus tard |
| A8 | Découpage de la bibliothèque par palier (choix C6-B) | 🔑 | **A** | | plus tard |
| A9 | Phase 2 : défis, cotes, ligues (`app/TODO.md`) | 🔑 | **A** | | plus tard |
| A10 | Déploiement : enregistrer le cache des PDF même si le déploiement échoue ou est annulé (`actions/cache/restore` + `save`, clé « partielle »), pour qu'une fusion rapprochée ne force plus la recompilation complète | 🔑 | **A** | Antsa | fait (26 oct.), à vérifier au prochain déploiement |

## 4. Recommandations par collaborateur

**Antsa (machine « clés »)** — tout ce qui **signe, construit, publie ou configure un compte** :
R1 → R2 → R3 d'abord (dans cet ordre) ; puis la CI de publication (A6), qui libère tout le monde ;
puis les fonctions serveur (A3, A4) et l'intégration des figures/jeux dans l'application (G1, Q2-app).
Garde aussi la relation avec le Bureau (contenus, photos, articles). **Ne publie qu'une version à
la fois** et uniquement depuis `main` à jour.

**ARHeritiana (et ses sessions Claude)** — **conception de cours** (décision du 26 oct.) et tout ce qui
est **contenu et site** : Q1 (quiz des étapes d'Engel) en premier — c'est la demande n° 1 du Bureau —, puis E1–E3 (nouveaux énoncés), G1
(jeu de constructions sur le site), G2 (simulations), S1–S3. Termine chaque lot par « **prêt à
publier** » (PR fusionnée, `CHANGELOG` sous `## [Non publié]`, `npm test` vert) et le signale ici ;
**ne touche pas** à `pubspec.yaml`, `app/release.json(.sig)` ni aux tags de version (choix C2-B).

**Les deux** — se répartir Q1 par étape (une étape = un fichier = une personne) et E1 par
document ; ne jamais modifier le même fichier `content/app/notions/*.yaml` en même temps ;
utiliser l'outil d'import (`scripts/import-lot.mjs`) plutôt que des énoncés écrits à la main.

## 5. Règles de coordination (pour éviter les conflits)

1. **`git pull` avant de brancher**, une branche + une PR par tâche, PR petites. Titre en français,
   message de commit à l'impératif ou au passé, mention de l'ID de tâche (ex. « Q1a : notion Suites »).
   **Une tâche terminée et poussée = une PR ouverte tout de suite** (sans attendre qu'on la demande),
   vers `main`, avec `npm test` vert ; pour les sessions Claude, la PR est ouverte automatiquement.
   Une PR de pur contenu se fusionne soi-même quand les contrôles sont verts (règle 11).
2. **Fichiers « chauds »** (conflits fréquents) : `app/CHANGELOG.md` (section `## [Non publié]`
   seulement, **une ligne par changement**), `docs/TODO.md`, `docs/app/TODO.md`, ce fichier.
   Les modifier par petits commits, jamais les réécrire en entier.
3. **Contenu sourcé, rien d'inventé** : chaque énoncé garde sa source (livre, chapitre, numéro,
   page, concours d'origine) ; les traductions sont signalées ; **aucune solution du livre recopiée**.
4. **Léger et confortable** : vérifier le poids (`public/app/v1/library.json`), pas d'image
   inutile, pas de dépendance nouvelle sans raison. Tester le site sur mobile.
5. **Secrets** : jamais de clé, mot de passe ni `service_role` dans Git, dans une PR, un journal
   ou une discussion. `release-keys/` et `ressource/` sont ignorés par Git.
6. **Publication** (rappel, `app/RELEASING.md`) : release GitHub **avant** de fusionner
   `release.json` ; marquée *Latest* ; fichiers aussi sans numéro de version
   (`comima-universal.apk`…) ; le site n'affiche jamais le numéro de version.
7. **Compilation des PDF : c'est ARHeritiana qui s'en charge** (décision du 26 oct.) : après un lot
   d'énoncés ou de chapitres, `node scripts/build-latex.mjs` en local, corriger les erreurs LaTeX *avant* la
   PR. Antsa ne compile plus les lots d'ARHeritiana.
8. **Ne pas empiler les fusions sur `main`** : chaque fusion relance le déploiement et **annule celui en
   cours** ; or la compilation des PDF n'enregistre son cache qu'à la fin d'un déploiement réussi. Regrouper
   les fusions, et attendre la fin du déploiement (onglet Actions) avant la suivante. Tâche A10 : enregistrer
   le cache même en cas d'annulation.
9. **Une PR ne se fusionne que lorsque tous ses contrôles sont verts.**
10. **Mettre à jour ce fichier** en fin de tâche : colonne « État » (`fait`, `en cours`,
   `bloqué : …`) et, si besoin, une ligne dans `TODO.md`.
11. **Contenu : ARHeritiana est autonome, y compris tout l'entraînement (notions, fiches, questions).** Il fusionne seul ses PR qui ne touchent que du contenu, quand les
   contrôles sont verts ; le contenu arrive dans l'application **sans nouvelle version** (voir `CONTENU.md`,
   liste « Autonomie » et garde-fous contre les redondances).

## 6. Journal des décisions

| Date | Décision |
| --- | --- |
| 26 oct. 2026 | Facebook par l'application Facebook : reporté (branche `facebook-app`). |
| 26 oct. 2026 | Les compilations de PDF des lots de contenu sont faites par ARHeritiana (règle 7). |
| 26 oct. 2026 | **Contenu autonome** : ARHeritiana fusionne seul le contenu (sans version d'application) ; mises à jour en ligne des quiz, de la bibliothèque et des illustrations ; contrôle anti-redondance (`CONTENU.md`). |
| 26 oct. 2026 | Marque-pages des élèves : idée acceptée, **0.6.0** (la 0.5.0 est déjà publiée), tâches B1 à B5. |
| 26 oct. 2026 | Publier = machine d'Antsa ; contenu et site = les deux machines. |
| 26 oct. 2026 | **La conception de cours (chapitres, fiches, quiz, illustrations, jeu, recueil, solutions) est la part d'ARHeritiana** ; Antsa garde la technique et la publication. |
| 26 oct. 2026 | Extraction des livres : Engel terminé (ch. 1 à 14, 1 113 énoncés) ; autres documents à suivre. |
