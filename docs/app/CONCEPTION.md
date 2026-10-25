# Application Android COMIMa — document de conception

Version 2 — 25 octobre 2026 (cœur Rust, mises à jour signées). Tâches : [`TODO.md`](TODO.md).

## 1. Objectif et décisions

Une application **légère, robuste et hors ligne** pour s'entraîner aux olympiades : exercices
du site, notions, étapes et niveaux par thème, défis entre élèves, classements par centre.
Synchronisée avec le site **dans le même dépôt**.

| Sujet | Décision |
| --- | --- |
| Technologie | Interface **Flutter** + **cœur Rust** (`app/native`) : moteur de correction, empreintes, signatures. Le même code Rust sera compilé en WebAssembly pour le serveur : un seul moteur, mêmes verdicts partout |
| Serveur | **Supabase** (Auth, Postgres + RLS, Realtime, Storage, Edge Functions). Tout COMIMa vit dans le schéma `comima` : hébergé **temporairement dans le projet Supabase de Mahay** (offre gratuite limitée à 2 projets), puis dans un projet dédié sans changer le code (voir `supabase/README.md`) |
| Comptes | E-mail / Google / Facebook ; **comptes gérés par l'encadreur** (pseudo + PIN) pour les élèves sans e-mail ou de moins de 13 ans |
| Rôles | **Élève** (participant), **Encadreur** (attribué par le bureau), **Admin** (bureau COMIMa) |
| Défis | **Asynchrones**, **en direct**, **ligues par centre** (+ classement national par saison) |
| Preuves | **Puzzle / à trous** corrigés automatiquement **et** preuves rédigées validées par un encadreur |
| Code | **Pseudo-code en français** (interprète Rust) **et Python** (MicroPython embarqué) |
| Contenu | **Banque de questions dans le dépôt** (`content/app/`), publiée en paquets par la CI |
| Langues | Français + anglais |
| Appareils | Android 7+, 2 Go de RAM, téléphones **partagés** (plusieurs profils) |
| Distribution | **APK** en release GitHub (`app-vX.Y.Z`), annoncé par `comima.mg/app/release.json` **signé** ; mise à jour automatique dans l'appli, même en sautant des versions (voir `app/RELEASING.md`) |
| Dépôt | **Même dépôt que le site** : dossier `app/` (Flutter + `app/native` en Rust) et `supabase/` |

## 2. Architecture

```
comima/
├── content/app/                 ← banque de questions (YAML, relue comme les exercices)
│   ├── notions/<notion>.yaml    ← fiche de notion + ses questions
│   └── README.md                ← format (résumé de la section 4)
├── scripts/build-app-packs.mjs  ← valide la banque, produit public/app/ (paquets JSON)
├── public/app/                  ← GÉNÉRÉ (gitignoré) puis servi par GitHub Pages
│   ├── v1/manifest.json         ← version des contenus, paquets (hash, taille) — un dossier par format
│   ├── v1/packs/<theme>-<niveau>.json
│   ├── v1/library.json          ← index léger des exercices du site (lecture hors ligne)
│   └── release.json(.sig)       ← dernière version de l'APK, signée Ed25519
├── app/                         ← application Flutter (+ native/ : cœur Rust, tool/ : build et publication)
│   └── lib/
│       ├── core/        (thème, routeur, i18n, base locale, synchro, réseau)
│       ├── content/     (paquets : téléchargement, vérification, stockage)
│       ├── engine/      (moteur de correction : nombres, expressions, ensembles, preuves, code)
│       ├── features/    (auth, profils, notions, entraînement, défis, classement, encadreur)
│       └── interpreters/(pseudo-code, pont MicroPython)
└── supabase/
    ├── migrations/      ← schéma SQL + règles RLS (versionnés)
    ├── functions/       ← Edge Functions (Deno/TS) : comptes gérés, correction serveur, cotes
    └── tests/           ← cas de correction (le moteur Rust y est compilé en WebAssembly)
```

**Hors ligne d'abord.** Paquets fournis dans l'APK puis mis à jour ; progression et profils
dans un fichier local à schéma versionné (base SQLite quand la file d'envoi arrivera) :
paquets, progression, profils, **file d'envoi**. Chaque action (réponse, défi, preuve) est
écrite localement avec un identifiant UUID généré sur le téléphone, puis envoyée quand le
réseau revient ; l'envoi est **idempotent** (rejouer une file ne crée pas de doublon).

**Synchronisation des contenus.** Au démarrage (si réseau), l'application lit
`https://www.comima.mg/app/v1/manifest.json`, compare les hash des paquets et ne télécharge
que ceux qui ont changé (quelques dizaines de Ko chacun), vérifie leur hash, puis les
installe dans une transaction : un paquet incomplet n'est jamais utilisé.

**Budgets.** APK ≤ 15 Mo par architecture (`--split-per-abi`), démarrage à froid ≤ 2 s sur
un téléphone d'entrée de gamme, paquets ≤ 200 Ko, aucune image lourde embarquée ; formules
rendues localement (`flutter_math_fork`), figures en SVG.

## 3. Comptes, rôles, profils

- **Élève autonome** : e-mail, Google ou Facebook ; rejoint un groupe par **code de groupe**
  (ce qui fixe son centre).
- **Élève géré** (sans e-mail ou < 13 ans) : créé par son encadreur (pseudo + PIN à
  6 chiffres) via une Edge Function ; techniquement un compte Supabase à e-mail synthétique
  (`<uuid>@eleves.comima.mg`) et mot de passe dérivé du PIN. L'encadreur peut réinitialiser
  le PIN. Aucune donnée personnelle obligatoire au-delà du pseudo.
- **Encadreur** : compte e-mail/Google/Facebook ; le rôle est **attribué par un admin**
  (jamais auto-déclaré).
- **Téléphone partagé** : plusieurs profils restent connectés ; l'écran d'accueil liste les
  profils, on change en tapant son PIN local. Les données de chaque profil sont séparées.

## 4. Banque de questions (format YAML)

Une **notion** = une fiche courte + ses questions. Les **étapes** sont formées
automatiquement (5 à 8 questions par difficulté croissante) ; les **niveaux** regroupent les
notions d'un thème.

```yaml
id: recurrence-somme           # = nom du fichier
theme: algèbre                 # algèbre | géométrie | arithmétique | combinatoire | analyse | informatique
niveau: 2                      # 1 (débutant) → 10 (olympique)
chapitre: 01-recurrence        # lien vers le cours du site (optionnel)
titre: { fr: Sommes et récurrence, en: Sums and induction }
fiche:                         # Markdown + LaTeX ($…$)
  fr: |
    Pour prouver $P(n)$ pour tout $n \ge 1$ : **initialisation** $P(1)$, puis **hérédité** $P(n) \Rightarrow P(n+1)$.
  en: |
    …
questions:
  - id: rs-01
    type: numeric              # voir le tableau des types
    difficulte: 1              # 1 → 5
    enonce: { fr: "Combien vaut $1 + 2 + \\dots + 10$ ?", en: "What is $1 + 2 + \\dots + 10$?" }
    reponse: "55"
    explication: { fr: "$\\frac{10 \\cdot 11}{2} = 55$.", en: "…" }
```

| `type` | Champs de réponse | Correction |
| --- | --- | --- |
| `qcm` | `choix: [{fr,en}…]`, `bonnes: [indices]` | ensemble exact des bonnes cases |
| `vrai-faux` | `reponse: true/false` | égalité |
| `numeric` | `reponse: "3/4"` (exact) ou `reponse: 3.1416` + `tolerance` | rationnels exacts ; sinon écart ≤ tolérance |
| `expression` | `reponse: "2*(n+1)"`, `variables: [n]` | équivalence (§5) |
| `ensemble` | `reponse: [1, 2, 3]` | ordre et doublons ignorés, éléments comparés comme `numeric`/`expression` |
| `n-uplet` | `reponse: [3, 4, 5]` | ordre respecté |
| `intervalle` | `reponse: "[1; 3["` | bornes et ouvertures |
| `ordre` (preuve puzzle) | `etapes: [{fr,en}…]` dans l'ordre, `dependances` optionnelles, `intrus` optionnels | tout ordre compatible avec les dépendances, sans intrus |
| `trous` (preuve à trous) | `texte` avec `{{1}}`, `trous: [{type, reponse, choix?}]` | chaque trou selon son type |
| `code` | `langage: pseudo | python`, `fonction`, `tests` (visibles), `tests_caches`, `squelette` | exécution locale des tests, temps et mémoire bornés |
| `simulation` | `simulation: <slug>`, `cible` | la simulation rejoue la réponse et vérifie la cible |
| `preuve` (rédigée) | `bareme`, `elements_attendus` | **encadreur** (file de validation) |

## 5. Moteur de correction (« infaillible »)

Un seul moteur, écrit en **Rust** (`app/native`) : dans le téléphone (bibliothèque native,
hors ligne) et sur le serveur (WebAssembly dans une Edge Function, recorrection des défis
classés). La CI vérifie que **chaque réponse attendue de la banque** est acceptée par le moteur.

- **Saisie** : clavier mathématique (fractions, puissances, racines, π) ; la saisie est
  analysée en arbre ; une réponse mal formée n'est **jamais** comptée fausse, elle est refusée
  avec un message (« expression incomplète »).
- **Nombres** : rationnels exacts (BigInt), décimaux convertis exactement ; tolérance relative
  ou absolue seulement si la question la déclare.
- **Expressions** : (1) simplification légère ; (2) **évaluation en 12 points aléatoires**
  en arithmétique **modulo deux grands nombres premiers** (et en rationnels pour les petites
  valeurs). Deux polynômes / fractions rationnelles différents ne coïncident en 12 points
  aléatoires qu'avec une probabilité < 10⁻³⁰ (lemme de Schwartz–Zippel) : en pratique,
  infaillible. Les fonctions non polynomiales (racines, exp…) sont évaluées en flottants
  haute précision avec tolérance.
- **Ensembles, n-uplets, intervalles** : normalisés puis comparés élément par élément.
- **Preuves puzzle** : les étapes forment un graphe de dépendances ; toute **sortie
  topologique** valide est acceptée (plusieurs ordres corrects possibles), les intrus doivent
  être écartés.
- **Code** : pseudo-code interprété en Rust (bac à sable, nombre d'instructions borné) ;
  Python via **MicroPython** embarqué (~1–2 Mo, sans accès fichiers/réseau, temps et mémoire
  bornés) ; tests visibles + tests cachés.
- **Preuves rédigées** : jamais corrigées par la machine ; l'encadreur valide (accepté / à
  reprendre + commentaire), l'élève reçoit la réponse à la synchro.

## 6. Progression, niveaux, classement

- **Maîtrise d'une notion** : ≥ 80 % de bonnes réponses sur les dernières tentatives de
  chaque étape ; débloque les notions suivantes.
- **Niveau d'un thème** (1 → 10) : toutes les notions du niveau maîtrisées.
- **Brassé** : échelle qui mélange les thèmes déjà débloqués (révision espacée : les
  questions ratées reviennent plus souvent).
- **Cote** (type Glicko simplifié) par thème + globale, mise à jour par les défis ; **XP**
  pour l'entraînement (motivation, sans effet sur la cote).
- **Ligues** : classement par centre et national, par **saison** (année scolaire, remise à
  zéro partielle).

## 7. Défis

- **Asynchrone** : le serveur tire une série (graine) ; chacun la joue quand il veut, même
  hors ligne ; scores et temps comparés à la synchronisation.
- **En direct** : duel chronométré (Supabase Realtime) ; mêmes questions, même ordre.
- **De groupe** : lancé par l'encadreur en séance.
- **Anti-triche** : pour les défis **classés**, les questions viennent d'une réserve dont les
  réponses ne sont **pas** dans les paquets (seulement côté serveur) ; la note est calculée
  par l'Edge Function à la synchronisation (l'élève voit « en attente de correction » hors
  ligne). L'entraînement libre, lui, est corrigé immédiatement sur le téléphone.

## 8. Encadreurs

Tableau de bord du groupe (progression par notion, points faibles), attribution de séries,
défis de groupe, **file de validation des preuves**, création et réinitialisation des comptes
gérés.

## 9. Données Supabase (schéma résumé)

`profiles` (rôle, pseudo, centre, géré, langue) · `centres` · `groups` (code, centre,
encadreur) · `group_members` · `attempts` (append-only, UUID client) · `progress` (par notion,
fusion « max » idempotente) · `seasons` · `ratings` (par thème/saison) · `challenges` (type,
graine, questions, fenêtre) · `challenge_entries` · `challenge_answer_keys` (**invisible des
clients**) · `proof_submissions` (+ Storage pour les photos) · `devices` (version de l'appli).

**RLS** : un élève lit/écrit ses lignes ; un encadreur lit celles des membres de ses groupes
et écrit les validations de preuves ; les clés de correction ne sont lisibles que par les
Edge Functions (rôle service).

## 10. Lien avec le site

- Le site publie les paquets et la **bibliothèque** des exercices (`public/app/`).
- Un lien `comima.mg/fr/ressources/<id>/` ou `…/simulations/<slug>/` ouvre l'application
  (App Links) si elle est installée.
- Page **Application** sur le site : téléchargement de l'APK, version, nouveautés.
- (Plus tard) classement public des ligues affiché sur le site, en lecture seule.

## 11. Distribution

APK signé construit par la CI quand `app/` change (clé de signature dans les secrets
GitHub), publié dans `public/app/download/`, version annoncée dans `manifest.json`.
L'application propose la mise à jour au démarrage. Pas de Google Play pour l'instant.
