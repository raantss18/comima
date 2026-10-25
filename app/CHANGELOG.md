# Journal des versions — application COMIMa

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnement
[SemVer](https://semver.org/lang/fr/) (comme Tontolo et Mahay). Une section
`## [X.Y.Z] - AAAA-MM-JJ` par version, avec `### fr` et `### en` : ces notes sont affichées dans
l'application lors d'une mise à jour et publiées sur la release GitHub (voir `RELEASING.md`).
Le site comima.mg n'affiche **jamais** de numéro de version : il renvoie à la dernière release.

Les changements en cours s'ajoutent sous `## [Non publié]` au fil des fusions, puis la section
est renommée `## [X.Y.Z] - date` au moment de publier.

## [Non publié]

### fr
- Barre du haut : la dernière icône n'est plus coupée sur les téléphones étroits ou en grande police (le nom de l'onglet ne s'affiche que s'il tient).
- Bibliothèque rangée par niveaux : lycée niveau 1, 2, 3, puis niveau universitaire, la recherche à la fin.
- Progression de l'année (d'après A. Engel, Problem-Solving Strategies) : filtre par étape — exemples et contre-exemples, inégalités, suites, polynômes, équations fonctionnelles, jeux, autres stratégies.
- Plus de 500 nouveaux problèmes, énoncés originaux avec leur source (Engel, chapitres 1, 2, 3, 7, 9, 10, 11, 13, 14) et traduction française.
- « Continuer avec Facebook » ouvre l'application Facebook du téléphone, sans passer par le navigateur (dès que le serveur est prêt ; sinon, le navigateur comme avant).
- Fiche de mise à jour plus lisible : ta version, la taille, les nouveautés en puces, et « Plus tard · Détails · Installer ».
- Profil : le message « Obligatoire » disparaît dès que le champ est rempli.

### en
- Top bar: the last icon is no longer cut off on narrow phones or with large fonts (the tab name only shows when it fits).
- Library sorted by level: high school levels 1, 2, 3, then university level, research last.
- This year's progression (after A. Engel, Problem-Solving Strategies): filter by step — examples and counterexamples, inequalities, sequences, polynomials, functional equations, games, further strategies.
- More than 500 new problems, original statements with their source (Engel, chapters 1, 2, 3, 7, 9, 10, 11, 13, 14) and a French translation.
- “Continue with Facebook” opens the Facebook app on the phone, without the browser (once the server is ready; otherwise the browser, as before).
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
