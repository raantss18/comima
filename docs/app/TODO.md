# Application Android — liste des tâches

Conception : [`CONCEPTION.md`](CONCEPTION.md). Cocher quand c'est fusionné dans `main`.
Responsable entre crochets quand une action humaine est nécessaire.

## Phase 0 — Préparation

- [x] Décisions (Flutter, Supabase, comptes, défis, preuves, code, contenu, cible, APK sur comima.mg, même dépôt)
- [x] Document de conception (v2 : cœur Rust, mises à jour signées)
- [x] Clé de signature Android et clé Ed25519 des mises à jour (`~/.config/comima-app/`, hors dépôt)
- [ ] [Bureau] **Sauvegarder** `~/.config/comima-app/` hors de la machine (clé perdue = plus de mise à jour possible)
- [ ] [Bureau] Créer le projet Supabase (compte COMIMa) et me transmettre l'URL + la clé `anon` ; garder la clé `service_role` dans les secrets GitHub
- [ ] [Bureau] Activer les fournisseurs Google et Facebook dans Supabase Auth (identifiants d'application)
- [ ] [Bureau] Mettre les clés dans les secrets GitHub (publication par la CI, voir `app/RELEASING.md`)
- [ ] Désigner les premiers admins / encadreurs (rôle attribué par le bureau)

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
- [ ] Publication des releases par la CI (après les secrets)
- [ ] Page « Application » sur le site (téléchargement, version, nouveautés) + lien dans le menu
- [x] Vérification de mise à jour au démarrage de l'application

## Phase 2 — Défis et classements

- [ ] Moteur de correction TypeScript (Edge Function) + jeu de tests partagé avec Dart (mêmes verdicts en CI)
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
