# Journal des versions — application COMIMa

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnement
[SemVer](https://semver.org/lang/fr/) (comme Tontolo et Mahay). Une section
`## [X.Y.Z] - AAAA-MM-JJ` par version, avec `### fr` et `### en` : ces notes sont affichées dans
l'application lors d'une mise à jour et publiées sur la release GitHub (voir `RELEASING.md`).
Le site comima.mg n'affiche **jamais** de numéro de version : il renvoie à la dernière release.

Les changements en cours s'ajoutent sous `## [Non publié]` au fil des fusions, puis la section
est renommée `## [X.Y.Z] - date` au moment de publier.

## [Non publié]

## [0.7.0] - 2026-10-26

### fr
- Entraînement : les questions de code, de simulation et de preuve rédigée (qu'on ne peut pas corriger automatiquement) ne bloquent plus la série : elles sont proposées à la fin, au choix, sans score. Même changement sur le site.
- Les illustrations interactives se mettent à jour en ligne avec les contenus, sans nouvelle version de l'application ; une application trop ancienne pour de nouveaux contenus garde les siens.
- Vue encadreur : écran « Groupes » (dans le compte). L'encadreur crée un groupe, donne son code aux élèves et voit, pour chacun, les exercices, cours et sujets faits, à continuer ou à voir. L'élève rejoint avec le code et peut quitter à tout moment ; l'encadreur ne voit que ses marque-pages.
- Étape « Suites » (chapitre 9 d'Engel) : 3 nouvelles notions d'entraînement, 70 questions (récurrences linéaires, limites de suites récurrentes, périodes, sommes télescopiques et écriture binaire).

### en
- Practice: code, simulation and written-proof questions (which cannot be graded automatically) no longer block the series: they are offered at the end, optional and unscored. Same change on the website.
- Interactive illustrations now update online with the content, without a new app version; an app too old for new content keeps its own.
- Coach view: "Groups" screen (in the account). A coach creates a group, gives its code to students and sees, for each one, the exercises, courses and papers done, to continue or to review. A student joins with the code and can leave at any time; the coach only sees their bookmarks.
- “Sequences” stage (Engel chapter 9): 3 new practice topics, 70 questions (linear recurrences, limits of recursive sequences, periods, telescoping sums and binary expansions).

## [0.6.0] - 2026-10-26

### fr
- Marque-pages sur chaque exercice, cours et sujet : pas encore vu, lu, déjà testé, à continuer plus tard, fait, plus une étoile « à voir ». Synchronisés avec le compte, visibles par les encadreurs ; disponibles sur le site et dans l'application.
- Filtres de bibliothèque : à voir, à faire, à continuer, fait.
- Statistiques : exercices, cours et sujets faits (par palier et par étape) ; pastilles espacées, lisibles même avec de grandes polices.

### en
- Bookmarks on every exercise, course and paper: not seen yet, read, already tried, continue later, done, plus a "to review" star. Synced with the account and visible to coaches; on the site and in the app.
- Library filters: to review, to do, continue, done.
- Statistics: exercises, courses and papers done (per level and per step); tiles are spaced and readable even with large fonts.

## [0.5.0] - 2026-10-26

### fr
- Plus de 570 nouveaux problèmes d'Engel (chapitres 4, 5, 6, 8 et 12) : principe des tiroirs, combinatoire, théorie des nombres, récurrence et géométrie, toujours avec leur source.
- Illustrations animées et interactives, hors ligne, comme sur le site : sous la fiche de 9 notions et en tête de chacun des 9 chapitres du cours (Collatz, carrés de Fibonacci, emballage convexe, centroïde, algorithme d'Euclide, inclusion–exclusion, jetons et invariants, tiroirs, moyennes…).
- Les illustrations laissent la découverte à l'élève : les réponses (parité, tiroirs, borne) ne sont montrées que sur demande.
- Les illustrations s'affichent aussi sur les téléphones dont « Android System WebView » est ancien (testé sur WebView 74).
- Plus de contre-exemple servi d'avance dans la fiche « Exemples et contre-exemples » : c'est à toi de le trouver.

### en
- More than 570 new Engel problems (chapters 4, 5, 6, 8 and 12): pigeonhole principle, combinatorics, number theory, induction and geometry, each with its source.
- Animated, interactive illustrations that work offline, like on the website: under the summary of 9 topics and at the top of each of the 9 course chapters (Collatz, Fibonacci squares, convex wrapping, centroid, Euclid's algorithm, inclusion–exclusion, tokens and invariants, pigeonhole, means…).
- The illustrations leave the discovery to the student: answers (parity, drawers, bound) are only shown on request.
- The illustrations also work on phones with an old “Android System WebView” (tested on WebView 74).
- The counterexample is no longer handed over in the “Examples and counterexamples” summary: it is up to you to find it.

## [0.4.0] - 2026-10-26

### fr
- Barre du haut : la dernière icône n'est plus coupée sur les téléphones étroits ou en grande police (le nom de l'onglet ne s'affiche que s'il tient).
- Bibliothèque rangée par niveaux : lycée niveau 1, 2, 3, puis niveau universitaire, la recherche à la fin.
- Progression de l'année (d'après A. Engel, Problem-Solving Strategies) : filtre par étape — exemples et contre-exemples, inégalités, suites, polynômes, équations fonctionnelles, jeux, autres stratégies.
- Plus de 500 nouveaux problèmes, énoncés originaux avec leur source (Engel, chapitres 1, 2, 3, 7, 9, 10, 11, 13, 14) et traduction française.
- Fiche de mise à jour plus lisible : ta version, la taille, les nouveautés en puces, et « Plus tard · Détails · Installer ».
- Profil : le message « Obligatoire » disparaît dès que le champ est rempli.

### en
- Top bar: the last icon is no longer cut off on narrow phones or with large fonts (the tab name only shows when it fits).
- Library sorted by level: high school levels 1, 2, 3, then university level, research last.
- This year's progression (after A. Engel, Problem-Solving Strategies): filter by step — examples and counterexamples, inequalities, sequences, polynomials, functional equations, games, further strategies.
- More than 500 new problems, original statements with their source (Engel, chapters 1, 2, 3, 7, 9, 10, 11, 13, 14) and a French translation.
- Clearer update sheet: your version, the size, what's new as bullet points, and “Later · Details · Install”.
- Profile: the “Required” message disappears as soon as the field is filled.

## [0.3.0] - 2026-10-25

### fr
- Nouvelle interface, plus claire : barre d'icônes en haut, niveaux rangés dans l'ordre, une couleur par thème, la notion à continuer en un geste, questions en cartes avec indice.
- Élève ou encadreur : un choix à la création du profil, qui ne change plus.
- Comptes facultatifs (Google, Facebook, e-mail) : retrouve ta progression sur un autre téléphone et sur le site comima.mg ; synchronisation discrète, sans doublon.
- Mise à jour proposée automatiquement, avec les nouveautés ; l'installation reprend seule après l'autorisation d'Android.
- Page « À propos » : QR code à montrer à un camarade, le site et les partenaires.
- Police du site pour un aspect identique sur tous les téléphones ; types de question nommés dans les statistiques.

### en
- New, clearer interface: icon bar at the top, levels in order, one colour per theme, the topic to continue in one tap, question cards with a hint.
- Student or coach: one choice when creating the profile, which no longer changes.
- Optional accounts (Google, Facebook, e-mail): find your progress on another phone and on the comima.mg website; discreet sync, no duplicates.
- Update offered automatically, with the news; the installation resumes by itself after Android's permission.
- “About” page: a QR code to show a friend, the website and the partners.
- The website's font for an identical look on every phone; question types named in the statistics.

## [0.2.0] - 2026-10-25

### fr
- Toutes les notions du cours : 9 notions, une par chapitre (0 à 8), 57 questions.
- Solutions des exercices lisibles hors ligne, plus cours, sujets, actualités et simulations dans la Bibliothèque.
- Inscription : âge, établissement, région et centre ; profils modifiables et supprimables.
- Statistiques complètes : réussite par thème, notion, type et difficulté, séries de jours, temps de travail, 14 derniers jours.
- Rappels d'entraînement discrets : au plus un par jour à l'heure choisie, jamais si tu t'es déjà entraîné, pause examens.
- Les mêmes quiz sur le site comima.mg (page Entraînement).

### en
- Every topic of the course: 9 topics, one per chapter (0 to 8), 57 questions.
- Exercise solutions readable offline, plus courses, papers, news and simulations in the Library.
- Sign-up: age, school, region and centre; profiles can be edited and deleted.
- Full statistics: success by theme, topic, type and difficulty, streaks, practice time, last 14 days.
- Gentle practice reminders: at most one a day at your chosen time, never if you already practised, exam break.
- The same quizzes on the comima.mg website (Training page).

## [0.1.0] - 2026-10-25

### fr
Première version de test.
- Entraînement hors ligne par thème, niveau, notion et étape, avec fiche de cours.
- 12 types de questions ; correction exacte par le moteur Rust : nombres, expressions (toute forme équivalente acceptée), ensembles, intervalles, preuves à remettre dans l'ordre, textes à trous.
- Aperçu de la formule pendant la saisie ; une saisie mal formée n'est jamais comptée fausse.
- Bibliothèque hors ligne des 243 exercices du site.
- Plusieurs profils sur un même téléphone, XP et niveaux.
- Mises à jour automatiques et vérifiées des contenus et de l'application.

### en
First test version.
- Offline practice by theme, level, topic and step, with a summary sheet.
- 12 question types; exact grading by the Rust engine: numbers, expressions (any equivalent form accepted), sets, intervals, proofs to put back in order, fill-in-the-blanks.
- Live formula preview while typing; a malformed answer is never marked wrong.
- Offline library of the website's 243 exercises.
- Several profiles on one phone, XP and levels.
- Automatic, verified updates of content and of the app.
