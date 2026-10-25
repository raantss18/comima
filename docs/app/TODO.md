# Application Android — liste des tâches

Conception : [`CONCEPTION.md`](CONCEPTION.md). Cocher quand c'est fusionné dans `main`.
Responsable entre crochets quand une action humaine est nécessaire.

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
- [ ] Application : appeler `comima.register(...)` après connexion ; API avec `.schema('comima')`
- [ ] Synchro : renvoyer tout le journal d'entraînement si le profil serveur est vide (identifiants uniques → sans doublon), pour rendre la migration vers un autre projet sans perte
- [ ] Connexion e-mail + mot de passe, Google, Facebook ; comptes gérés (pseudo + PIN) ; mode hors ligne sans compte
- [ ] Les **encadreurs** accèdent à tous les exercices et solutions (application et site)

### Encadreurs
- [ ] **Proposition d'exercices en LaTeX avec solution** (application et site) → file de relecture admin → publication sur le site (PR `content/exercices/`)
- [ ] Tableau de bord encadreur (voir phase 2)

### Motivation et suivi
- [x] **Rappels d'entraînement non intrusifs** : notification locale à l'heure choisie par l'élève, au plus 1 par jour, rien si l'élève s'est déjà entraîné, plages « études » silencieuses, désactivable
- [x] **Statistiques élève** : par thème, notion, type, difficulté ; réussite, temps, séries, 14 derniers jours — 0.2.0
- [ ] Statistiques encadreur par groupe (après Supabase)

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
- [x] Page « Application » sur le site (téléchargement, version, nouveautés)
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
