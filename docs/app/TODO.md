# Application Android — liste des tâches

Conception : [`CONCEPTION.md`](CONCEPTION.md). **Répartition des tâches entre les deux machines : [`../REPARTITION.md`](../REPARTITION.md).** Cocher quand c'est fusionné dans `main`.
Responsable entre crochets quand une action humaine est nécessaire.

> ## 📌 Pour ARHeritiana (et tes sessions Claude) — à lire en premier
> **La conception de cours est ta part** (décision d'Antsa, 26 oct. 2026) : chapitres et recueil, fiches de
> notion et quiz, illustrations, simulations, jeu de constructions, choix et ordre des exercices, solutions,
> et **la compilation des PDF de tes lots** (`node scripts/build-latex.mjs` avant ta PR).
>
> 0. **Tu es autonome pour le contenu** : fusionne seul tes PR qui ne touchent que du contenu (contrôles verts) ;
>    le contenu arrive sur le site **et dans l'application sans nouvelle version**. Mode d'emploi, garde-fous
>    anti-redondance et limites : [`CONTENU.md`](../CONTENU.md).
> 1. Lis [`REPARTITION.md`](REPARTITION.md) (sections 1 bis, 3 et 5) : la liste des tâches, avec ce que
>    chacun prend. **Inscris ton nom** dans la colonne « Pris par » avant de commencer.
> 2. **Première tâche conseillée : Q1**, les quiz des étapes d'Engel (suites, polynômes, équations
>    fonctionnelles, jeux, autres stratégies) — c'est la demande n° 1 du Bureau. Ensuite : B1 (conception des
>    marque-pages), E1 à E3 (nouveaux énoncés sourcés), G1 (jeu de constructions), G2 (simulations).
> 3. **Ne touche pas** à `app/pubspec.yaml`, `app/release.json(.sig)`, aux tags de version, ni à `release-keys/` :
>    c'est Antsa qui publie. Une ligne par changement sous `## [Non publié]` du `app/CHANGELOG.md`.
> 4. Une branche et une PR par tâche ; **ne fusionne que si tous les contrôles sont verts** ; regroupe tes
>    fusions (chaque fusion sur `main` relance le déploiement).
> 5. Énoncés **à l'identique**, source complète, traduction signalée, **rien d'inventé**, aucune solution du
>    livre recopiée. Léger et confortable avant tout.
> 6. Tu as une question ou un désaccord ? Réponds dans l'issue n° 67 ou modifie `REPARTITION.md` par PR.


## Phase 0 — Préparation

- [x] Décisions (Flutter, Supabase, comptes, défis, preuves, code, contenu, cible, APK sur comima.mg, même dépôt)
- [x] Document de conception (v2 : cœur Rust, mises à jour signées)
- [x] Clé de signature Android et clé Ed25519 des mises à jour (`release-keys/`, ignoré par Git ; copie `~/.config/comima-app/`)
- [ ] [Bureau] **Sauvegarder** `release-keys/` hors de la machine (clé perdue = plus de mise à jour possible)
- [ ] [Bureau] **Exécuter le SQL dans le projet Supabase de Mahay** (offre gratuite = 2 projets, déjà pris) et exposer le schéma `comima` : guide `supabase/README.md`, ~20 min, rien à créer
- [ ] [Bureau] Me transmettre l'URL du projet + la clé `anon` (publique) ; la clé `service_role` reste dans les secrets GitHub
- [ ] [Bureau] Ajouter le fournisseur **Facebook** (Google et GitHub : ceux de Mahay) et la redirection `mg.comima.app://login-callback`
- [ ] [Plus tard] Migrer vers un projet Supabase dédié quand le budget le permet (même migration ; procédure dans `supabase/README.md`, étape comptes à tester d'abord)
- [ ] [Bureau] Mettre les clés dans les secrets GitHub (publication par la CI, voir `app/RELEASING.md`)
- [ ] Désigner les premiers admins / encadreurs (rôle attribué par le bureau)

## Version 0.2 — demandes du 25 octobre 2026

Retours après la 0.1.0. Ordre de traitement : correctifs → contenus → comptes → reste.

### Correctifs et contenus
- [x] Supprimer un profil local (avec confirmation ; impossible de supprimer le dernier) — 0.2.0
- [x] **Toutes les notions du site** dans les quiz : une notion par chapitre du cours (0 à 8), 57 questions — 0.2.0
- [ ] Passer à ≥ 3 notions par chapitre (relecture des encadreurs)
- [x] **Solutions des exercices dans l'application** (texte LaTeX, hors ligne) — 0.2.0 ; 32 exercices sur 243 ont une solution rédigée
- [ ] Rédiger les solutions manquantes (211 exercices, chapitres 1 à 7 surtout) — via les propositions des encadreurs
- [x] Inscription élève : âge (année de naissance), établissement d'origine, région / centre (profil local, envoyé au compte Supabase à la connexion)

### Site ↔ application (tout ce qui est sur l'un est sur l'autre)
- [x] Dans l'application : cours, sujets, actualités, simulations (lien vers le site) — 0.2.0
- [x] Sur le site : page « Entraînement » (notions + quiz, corrigés par le même moteur Rust compilé en WebAssembly)
- [x] Sur le site : page « Application » (téléchargement, version, nouveautés), liée depuis Entraînement
- [x] Liens notion → chapitre → simulations (site et application)
- [ ] Liens chapitre → exercices du chapitre, et depuis les pages Cours/Simulations du site vers l'entraînement

### Comptes (Supabase)
- [x] Schéma + règles RLS : profils (âge, établissement, région, centre), rôles, groupes, tentatives, propositions — testés en CI (`supabase/tests/run.sh`)
- [x] Schéma isolé `comima` : rien dans `public`, aucun déclencheur sur `auth.users` (sûr dans un projet partagé), testé avec un projet qui contient déjà des données
- [x] Application : `comima.register(...)` après connexion ; API avec le schéma `comima`
- [x] Synchro : profil et réponses, identifiants uniques (sans doublon), reprise du profil d'un compte existant sans l'écraser, jeton renouvelé, hors ligne sans perte — testé avec un faux serveur (15 tests)
- [x] Journal renvoyé en entier si le serveur est vide (migration vers un autre projet sans perte)
- [ ] Tester la connexion de bout en bout sur le vrai projet (Google, Facebook, e-mail) après activation par le Bureau
- [ ] Script de vérification du serveur dans la CI de publication (`scripts/check-supabase.mjs`)
- [x] Application : connexion e-mail + mot de passe, Google, Facebook (PKCE), mot de passe oublié, déconnexion, suppression des données en ligne ; mode hors ligne sans compte (version 0.3.0, prête, **à publier quand le serveur est prêt** : `node scripts/check-supabase.mjs`)
- [ ] Comptes gérés par l'encadreur (pseudo + PIN, Edge Function) pour les élèves sans e-mail
- [ ] Les **encadreurs** accèdent à tous les exercices et solutions (application et site)

### Encadreurs
- [ ] **Proposition d'exercices en LaTeX avec solution** (application et site) → file de relecture admin → publication sur le site (PR `content/exercices/`)
- [ ] Tableau de bord encadreur (voir phase 2)

### Motivation et suivi
- [x] **Rappels d'entraînement non intrusifs** : notification locale à l'heure choisie par l'élève, au plus 1 par jour, rien si l'élève s'est déjà entraîné, plages « études » silencieuses, désactivable
- [x] **Statistiques élève** : par thème, notion, type, difficulté ; réussite, temps, séries, 14 derniers jours — 0.2.0
- [ ] Statistiques encadreur par groupe (après Supabase)

## Version 0.3 — retours du 25 octobre (tous faits, sauf mention)

- [x] Téléchargement sur la page d'accueil : diapo « Application » avec bouton + **QR code**, section dédiée, lien en pied de page
- [x] Article sur l'application (FR/EN) avec captures et QR code
- [x] Page d'accueil de l'application épurée : niveaux dans l'ordre, une couleur par thème, « Continuer », progression
- [x] Barre d'icônes **en haut** (comme Tontolo), onglet actif en pastille ; identité visuelle COMIMa (police du site, cartes arrondies)
- [x] **Élève ou encadreur** : choix unique et définitif à la création du profil (plus de bascule)
- [x] Mise à jour proposée **automatiquement** (démarrage, retour dans l'appli, toutes les 6 h), installation qui reprend après l'autorisation Android
- [x] Page « À propos » dans l'application : QR code, site, logos des partenaires
- [x] Site : connexion + synchronisation dans **Entraînement** (Google, Facebook, e-mail), progression commune avec l'application
- [x] Comptes activés dès que le serveur est prêt, sans nouvelle version (détection à l'exécution)
- [ ] **À tester par une personne réelle** : connexion Google, Facebook et e-mail de bout en bout (application et site) — je ne crée pas de compte dans le projet partagé
- [ ] Ajouter `https://www.comima.mg/**` aux *Redirect URLs* du projet Supabase (voir `supabase/README.md`)
- [ ] Statistiques et profil du site (comme dans l'application) ; comptes gérés par l'encadreur (pseudo + PIN)

## Version 0.4 — demandes du 25 octobre 2026 (soir)

Principe : **l'application et le site restent synchrones, légers et confortables.**
Tout contenu est **sourcé** (concours officiels, Euclide, recueil COMIMa) ou **calculé** par un
programme dont la réponse est vérifiée par le moteur : rien d'inventé.

### Correctifs
- [x] Barre du haut : la dernière icône (Profil) était tronquée sur les téléphones étroits ou à grande
  police. Le nom de l'onglet ne s'affiche que s'il tient (largeur mesurée), sinon icônes seules
  (dans l'application à la prochaine version, 0.4.0)

### Progression de l'année (A. Engel, *Problem-Solving Strategies*) — à privilégier partout
| # | Notion | Engel | Quiz | Bibliothèque |
| --- | --- | --- | --- | --- |
| 1 | Exemples et contre-exemples | — | [x] (existant) | [x] recueil ch. 0 (12) ; [ ] supports COMIA (`ressource/`) |
| 2 | Inégalités | ch. 7 | [x] (existant) | [x] 100 énoncés + recueil ch. 8 |
| 3 | Suites | ch. 9 | [ ] | [x] 66 énoncés |
| 4 | Polynômes | ch. 10 | [ ] | [x] 82 énoncés |
| 5 | Équations fonctionnelles | ch. 11 | [ ] | [x] 40 énoncés |
| 6 | Jeux | ch. 13 | [ ] | [x] 36 énoncés |
| 7 | Autres stratégies | ch. 14 | [ ] | [x] 72 énoncés |

- [x] Filtre « Progression de l'année » (7 étapes) : page Exercices du site (lien direct `?progression=N`), Bibliothèque de l'application, raccourcis de l'accueil
- [ ] Quiz d'entraînement pour les étapes 3 à 7 (suites, polynômes, équations fonctionnelles, jeux, autres stratégies) — à rédiger à partir d'énoncés sourcés, relus par les encadreurs
- [ ] Ces 7 notions en tête de l'entraînement (application et site), dans cet ordre
- [ ] Les autres chapitres du recueil restent disponibles, après

### Exercices (bibliothèque et entraînement)
- [x] **Bibliothèque par paliers** (`scripts/build-index.mjs`) : lycée niveau 1, 2, 3, puis niveau
  universitaire, recherche **à la fin** — site (sections, filtre, « Afficher plus ») et application
  (titres de palier). Les problèmes d'Engel montent d'un palier à difficulté égale (livre d'olympiade)
- [x] **1 113 énoncés d'A. Engel** (534 + ch. 4, 5, 6, 8, 12), *Problem-Solving Strategies* (`content/exercices/engel-CC-NN`) :
  chapitres 1 (60), 2 (36), 3 (42), 7 (100), 9 (66), 10 (82), 11 (40), 13 (36), 14 (72). Énoncé
  original anglais **à l'identique**, traduction française signalée, source complète (chapitre,
  numéro, page, concours d'origine). Outil : `scripts/import-lot.mjs` (lots YAML). Non repris : 2.10,
  2.11 (figures complexes), 3.1 et 3.26 (renvoient à un exemple du livre). Solutions : non
  reproduites (renvoi à l'ouvrage)
- [x] **Engel terminé** (26 oct.) : ch. 4 (82), 5 (48), 6 (169), 8 (39), 12 (138) ajoutés ; il reste
  les autres documents de `ressource/`
  (manuel sud-africain, stage Animath Sophia 2006, Olympiades nationales 2019, supports COMIA :
  contre-exemples, récurrence, tiroirs, géométrie, concours juin 2025). Le dossier `ressource/`
  n'est **jamais** publié (`.gitignore`)
- [ ] Énoncés officiels des **IMO** (imo-official.org) : français 2006–2026, anglais avant 2006, avec attribution
- [ ] Annales des **Olympiades nationales de première** (APMEP / Eduscol, avec corrigés) : niveau lycée 1–3
- [ ] Solutions rédigées (COMIMa / encadreurs) pour les problèmes d'Engel les plus utilisés
- [ ] **Des milliers d'exercices d'entraînement** : séries calculées par programme (suites, polynômes,
  inégalités, équations fonctionnelles, jeux…) dont chaque réponse est vérifiée par le moteur Rust
- [ ] **Géométrie type Euclidea** : constructions à la règle et au compas (propositions d'Euclide,
  livre I, domaine public) en mini-jeu, + mini-quiz de géométrie (application et site)

### Accueil du site (mobile et ordinateur)
- [ ] Voir `docs/TODO.md`, section « Accueil » (promotion de l'application, lien vers la dernière
  release GitHub, **aucun numéro de version sur le site**)

### Git et publication (comme Tontolo et Mahay)
- [x] `app/CHANGELOG.md` au format *Keep a Changelog* avec section « Non publié » ; notes FR/EN
  par version (servent à `release.json` et à la release GitHub)
- [x] Version et changelog visibles **uniquement sur GitHub** (releases) et dans l'application ; le
  site renvoie vers `releases/latest` (fichiers sans numéro de version, ajoutés à la 0.3.0 et créés
  par `build_apk.sh`)
- [ ] Publication par la CI sur étiquette `app-vX.Y.Z` (après les secrets du Bureau)

### Retours du 26 octobre
- [ ] **Plus tard** (à la demande du Bureau) : « Continuer avec Facebook » ouvre Facebook dans le
  navigateur → connexion par l'**application Facebook** : prête sur la branche `facebook-app`
  (SDK Facebook + fonction serveur `supabase/functions/comima-facebook`, guide Bureau, test),
  à fusionner quand le Bureau l'aura configurée
- [ ] [Bureau] **Corriger le fournisseur Facebook** dans Supabase : l'identifiant vaut « mahay » au lieu
  de l'App ID numérique — la connexion Facebook échoue même par le navigateur (`supabase/README.md`, 3 bis)
- [ ] [Bureau, plus tard] Console Facebook (plateforme Android, empreinte de clé), déployer la
  fonction, me transmettre App ID + Client Token (guide sur la branche `facebook-app`)
- [x] Fiche de mise à jour lisible, sur le modèle de Tontolo (sans affiche)
- [x] Formulaire de profil : « Obligatoire » disparaît dès que le champ est rempli

### Reste des versions précédentes
- [ ] Coach : tableau de bord et proposition d'exercices (interface)
- [ ] Comptes gérés (pseudo + PIN)

## Idée du 26 octobre — marque-pages (suivi de lecture et de travail) — prévue pour la 0.6.0

Pour **chaque exercice, problème, sujet et cours** des bibliothèques (site et application), l'élève
pose un **marque-page** qui dit où il en est ; il se **synchronise avec son compte** et peut être
**consulté par ses encadreurs**. Hors ligne d'abord, comme tout le reste. **Pas dans la 0.5.0** (déjà
publiée et signée) : on ne la rouvre pas ; c'est la 0.6.0.

- **États proposés** (un seul par élément, plus une étoile) : *pas encore vu* (par défaut = « non fait »),
  *lu*, *testé* (essayé, pas réussi), *à continuer plus tard*, *fait*. L'**étoile** = « à voir ».
  Choix des mots et des icônes : conception d'ARHeritiana (voir `REPARTITION.md`, B1).
- **Où** : une pastille cliquable dans chaque liste (Bibliothèque, Cours, Sujets) et sur chaque page ;
  filtre « à continuer », « fait », « non fait » ; compteurs dans les statistiques de l'élève.
  Un exercice du quiz réussi peut passer à *fait* tout seul (proposé, jamais imposé).
- **Données** : clé `type:id` (`exo:engel-09-15`, `cours:03-principe-des-tiroirs`…), état, étoile, date
  de modification ; quelques octets par élément (léger).
- **Stockage local** : site (`localStorage`, comme la progression) et application (`progress.json`,
  nouvelle version de schéma **avec migration enchaînée et sauvegarde `.bak`**, règle de `RELEASING.md`).
- **Serveur** (Supabase, schéma `comima`) : table `marks` **ajoutée** par une migration **ré-exécutable**,
  sans toucher aux tables existantes ; règles d'accès (RLS) : chacun lit/écrit les siens, l'encadreur lit
  ceux de ses groupes (comme `attempts`) ; synchronisation « le plus récent gagne » par élément.
  Tests ajoutés à `supabase/tests/rls_test.sql`. Une application sans la table reste en local (rien ne casse).
- **Encadreurs** : vue par élève et par groupe (qui a lu / fait quoi), après le tableau de bord encadreur.
- **Précautions** : changement **additif** (anciennes versions de l'application inchangées) ; pas de nouveau
  format de paquet ; tests de migration locale et de synchronisation avec faux serveur.

- [x] B1 — Conception : états, mots, icônes, filtres (ARHeritiana)
- [x] B2 — Site : pastille + filtres + stockage local (`src/scripts/`, ARHeritiana ou Antsa)
- [x] B3 — Application : écran, `progress.json` schéma 4 + migration, tests (Antsa)
- [x] B4 — Serveur : migration `marks` + RLS + tests (`supabase/`, Antsa) ; synchronisation site et application
- [x] B5 — Vue encadreur : écran « Groupes » de l'application (code d'invitation, marque-pages des élèves). Reste : même vue sur le site, statistiques de groupe (réponses), élèves sans e-mail (pseudo + PIN)

## Phase 1 — Entraînement hors ligne (MVP)

### Contenu (côté site)
- [x] Format YAML des notions et questions (`content/app/README.md`)
- [x] Générateur de paquets + validation (`scripts/build-app-packs.mjs`) branché sur la CI
- [x] Notions d'exemple couvrant tous les types de questions
- [x] Bibliothèque hors ligne des exercices du site (`public/app/library.json`)
- [ ] Rédiger les notions des chapitres 0 à 8 (≥ 3 notions par chapitre, ≥ 15 questions par notion)
- [ ] Relecture des questions par les encadreurs (PR sur `content/app/`)

### Application
- [x] Squelette Flutter `app/` (thème COMIMa clair/sombre, FR/EN, profils partagés)
- [x] Cœur Rust `app/native` (FFI) : moteur, SHA-256, signature Ed25519 ; tests sur toute la banque
- [x] Progression locale à schéma versionné (migrations enchaînées)
- [ ] Base locale SQLite + file d'envoi (avec la synchro serveur)
- [x] Téléchargement / vérification / installation atomique des paquets (dossier `v1` par format)
- [x] Rendu Markdown + LaTeX hors ligne (`flutter_math_fork`)
- [x] Moteur de correction Rust : `qcm`, `vrai-faux`, `numeric`, `expression`, `ensemble`, `n-uplet`, `intervalle`, `ordre`, `trous`
- [x] Touches mathématiques + aperçu LaTeX de la saisie
- [ ] Vrai clavier mathématique (fractions, puissances visuelles)
- [x] Écrans : accueil / profils, thèmes et niveaux, notion (fiche), étape (questions), résultat, bibliothèque
- [x] Progression locale (maîtrise, XP, niveaux)
- [ ] Révision espacée, déblocage des notions
- [x] Tests du moteur + CI (`.github/workflows/app.yml`)
- [ ] Tests Flutter (widgets), synchro hors ligne → en ligne

### Serveur
- [ ] Migrations Supabase : `profiles`, `centres`, `groups`, `group_members`, `attempts`, `progress`, `devices` + RLS
- [ ] Auth e-mail / Google / Facebook ; Edge Function « comptes gérés » (pseudo + PIN)
- [ ] Synchronisation idempotente (`attempts`, `progress`)

### Distribution
- [x] APK signés par processeur + universel (`app/tool/build_apk.sh`), ~9 Mo
- [x] Mise à jour automatique de l'APK : `release.json` signé, sauts de versions, notes cumulées, mise à jour forcée (`minBuild`)
- [x] Release 0.1.0 (build 1) sur GitHub
- [x] Release 0.2.0 (build 2), testée en mise à jour depuis la 0.1.0 publiée (progression conservée)
- [ ] Publication des releases par la CI (après les secrets)
- [ ] Mise à jour : reprendre l'installation automatiquement au retour de l'écran « Autoriser cette source » (aujourd'hui l'élève doit relancer depuis Profil → Mettre à jour ; vérifié sur émulateur 0.1.0 → 0.2.0)
- [ ] Liste des années de naissance : commencer vers 12–15 ans (âges les plus fréquents)
- [x] Page « Application » sur le site (téléchargement, version, nouveautés) ; les APK sont servis par comima.mg (`/app/download/…`, copiés et vérifiés au déploiement), choix automatique 32/64 bits, adresse courte `comima.mg/app/`, section sur l'accueil et lien en pied de page
- [x] Vérification de mise à jour au démarrage de l'application

## Phase 2 — Défis et classements

- [ ] Moteur Rust compilé en WebAssembly pour les Edge Functions (recorrection serveur, mêmes verdicts)
- [ ] Tables `seasons`, `ratings`, `challenges`, `challenge_entries`, `challenge_answer_keys` + RLS
- [ ] Défis asynchrones (graine, jeu hors ligne, correction serveur à la synchro)
- [ ] Cotes (Glicko simplifié) par thème et globale ; ligues par centre ; classement national par saison
- [ ] Tableau de bord encadreur : groupe, progression par notion, attribution de séries
- [ ] Défis de groupe lancés par l'encadreur
- [ ] Mode « brassé » (thèmes mélangés)

## Phase 3 — Défis en direct, code, preuves

- [ ] Duels en direct (Supabase Realtime)
- [x] Questions `ordre` (preuve puzzle, graphe de dépendances) et `trous`
- [ ] Interprète de pseudo-code en français (Rust, bac à sable)
- [ ] Python : MicroPython embarqué, exécution bornée, tests cachés
- [ ] Questions `simulation` (rejeu des simulations du site)
- [ ] Preuves rédigées : texte ou photo → file de validation encadreur → retour à l'élève
- [ ] App Links (liens comima.mg qui ouvrent l'application)
- [ ] Classement public des ligues sur le site (lecture seule)
