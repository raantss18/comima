# Journal des versions — application COMIMa

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnement
[SemVer](https://semver.org/lang/fr/) (comme Tontolo et Mahay). Une section
`## [X.Y.Z] - AAAA-MM-JJ` par version, avec `### fr` et `### en` (le journal technique) et, **pour publier**,
`### Message fr` et `### Message en` : 2 à 4 lignes très simples sur **ce que la mise à jour permet de faire**
(« Mise à jour de sécurité », « Une nouvelle façon de s'entraîner », « Tu peux maintenant travailler sur les
fonctions »), sans jargon ni détail technique. Seul ce message est affiché dans l'application lors d'une mise à
jour et publié sur la release GitHub (voir `RELEASING.md`).
Le site comima.mg n'affiche **jamais** de numéro de version : il renvoie à la dernière release.

Les changements en cours s'ajoutent sous `## [Non publié]` au fil des fusions, puis la section
est renommée `## [X.Y.Z] - date` au moment de publier.

## [Non publié]

## [1.3.0] - 2026-10-27

### fr
- **Des séries différentes à chaque fois** : 31 modèles de questions (pgcd, restes, nombres premiers, dénombrement, suites, limites, dérivées, angles, tiroirs…) tirent leurs nombres au hasard à chaque série et **calculent** la réponse (donc toujours exacte), sur 5 niveaux. Ils complètent les questions rédigées dans chaque étape d'une notion, dans « Questions au hasard » et dans le Défi (environ 60 % de questions nouvelles). Même moteur sur le site.
- Les questions générées comptent dans les statistiques et rapportent des points, plafonnés à 60 par jour ; elles n'entrent pas dans l'avancement des notions (qui reste celui des questions rédigées).
- Le choix « Tous les cours / Ce que j'ai lu » annonce d'où viennent les questions ; chaque série est tirée au hasard.

### en
- **A different series every time**: 31 question templates (GCD, remainders, primes, counting, sequences, limits, derivatives, angles, pigeonhole…) draw their numbers at random for each series and **compute** the answer (so it is always exact), on 5 levels. They complete the written questions in each step of a topic, in "Random questions" and in the Challenge (about 60 % new questions). Same engine on the website.
- Generated questions count in the statistics and earn points, capped at 60 per day; they do not count in topic progress (which stays that of the written questions).
- The "All courses / What I've read" choice announces where the questions come from; each series is drawn at random.

### Message fr
- Chaque série de questions est nouvelle : les nombres changent à chaque fois.
- Entraîne-toi aussi dans « Questions au hasard » et dans le Défi.
- Tu progresses sans pouvoir apprendre les réponses par cœur.

### Message en
- Every series of questions is new: the numbers change each time.
- Practise in "Random questions" and in the Challenge too.
- You progress without being able to memorise the answers.

## [1.2.0] - 2026-10-27

### fr
- **Réponses et solutions réservées aux encadreurs** : un élève (ou toute personne sans compte de synchronisation) ne voit plus la solution d'un exercice, ni la réponse, l'explication ou le détail du moteur après une erreur ; un seul essai, puis la question suivante (elle reste à retenter plus tard). Une bonne réponse garde son explication. Les encadreurs gardent tout. Les défis au choix ne montrent plus l'explication aux élèves.
- Plus de lien vers des PDF de solutions ; les solutions ne sont plus publiées sur le site.

### en
- **Answers and solutions are for coaches only**: a student (or anyone without a sync account) no longer sees an exercise solution, nor the answer, the explanation or the engine detail after a mistake; one attempt, then the next question (it can be retried later). A correct answer keeps its explanation. Coaches keep everything. Optional challenges no longer show the explanation to students.
- No more links to solution PDFs; solutions are no longer published on the site.

### Message fr
- Tu cherches seul : les réponses et les solutions ne s'affichent plus.
- Une erreur ? Un seul essai, puis la question suivante, à retenter plus tard.
- Les encadreurs voient toujours les réponses.

### Message en
- You work it out yourself: answers and solutions are no longer shown.
- A mistake? One attempt, then the next question, to retry later.
- Coaches still see the answers.

## [1.1.1] - 2026-10-27

### fr
- **« Recommencer » ne fait plus reculer la progression** : les questions déjà réussies restent comptées (étapes, notions, niveau) même si une série recommencée par erreur est ratée ; la dernière réponse reste gardée pour savoir quoi revoir. L'écran de fin de série dit que les réponses sont enregistrées, et le score de la série précédente reste affiché après « Recommencer ».

### en
- **"Start again" no longer sets progress back**: questions already solved stay counted (steps, topics, level) even if a series restarted by mistake goes wrong; the last answer is still kept to know what to review. The end-of-series screen says answers are saved, and the previous series score stays visible after "Start again".

### Message fr
- Recommencer une série par erreur n'efface plus ta progression.
- Ton score de la série précédente reste affiché.

### Message en
- Starting a series again by mistake no longer erases your progress.
- Your previous series score stays visible.

## [1.1.0] - 2026-10-27

### fr
- **Entraînement et Défi liés à ce que tu as lu** : un choix « Tous les cours / Ce que j'ai lu » annonce d'où viennent les questions (cours lus et exercices vus) ; la liste reste toujours tirée au hasard. Carte « Questions au hasard » (10 questions) dans l'Entraînement ; les notions d'un cours lu portent la mention « cours lu ».
- **Suivi automatique** : ouvrir un cours, un exercice ou un sujet le marque « lu » (sans toucher à un état déjà posé), dans l'application et sur le site.
- **Statistiques d'usage** : la version de l'application et la date de dernière activité sont envoyées à la synchronisation (aucune position, aucun identifiant d'appareil) ; les lectures (marque-pages) alimentent les statistiques de cours, d'exercices et de sujets. Migration `20261027000000_usage_version.sql`.

### en
- **Practice and Challenge linked to what you have read**: an "All courses / What I've read" choice announces where the questions come from (courses read and exercises seen); the list is always drawn at random. "Random questions" card (10 questions) in Practice; topics of a course you read show "course read".
- **Automatic tracking**: opening a course, an exercise or a paper marks it "read" (an existing state is never changed), in the app and on the site.
- **Usage statistics**: the app version and last-activity date are sent at sync (no location, no device identifier); reading marks feed the course, exercise and paper statistics. Migration `20261027000000_usage_version.sql`.

### Message fr
- Ton entraînement suit maintenant ce que tu lis : choisis « Ce que j'ai lu » dans l'Entraînement ou le Défi.
- Un cours ou un exercice que tu ouvres est marqué « lu » tout seul.
- Des questions au hasard, en un clic.

### Message en
- Your practice now follows what you read: pick "What I've read" in Practice or Challenge.
- A course or exercise you open is marked "read" automatically.
- Random questions in one tap.

## [1.0.0] - 2026-10-27

### fr
- **Version 1.0** : l'application est complète : accueil, entraînement, défi chronométré, bibliothèque, actualités, interpréteur Python, profil et compte.
- Un profil jamais synchronisé peut encore passer d'élève à encadreur (le rôle est fixé à la première synchronisation avec un compte).
- Année de naissance : de 1950 à aujourd'hui (facultative pour un encadreur).
- Les actualités s'ouvrent dans la bibliothèque sans changer le titre de l'écran quand on passe d'un onglet à l'autre.

### en
- **Version 1.0**: the app is complete: home, practice, timed challenge, library, news, Python interpreter, profile and account.
- A profile that was never synced can still switch from student to coach (the role is fixed at the first sync with an account).
- Year of birth: from 1950 onwards (optional for a coach).
- News opens inside the library without the screen title changing when you switch tabs.

### Message fr
- Version 1.0 : COMIMa est prête, avec tout au même endroit.
- Entraîne-toi, relève le défi chrono, écris du Python, lis les actualités du club.
- Ta progression te suit d'un appareil à l'autre avec ton compte.
- Tu es encadreur ? Tu peux le choisir avant de te connecter, même avec un ancien profil.

### Message en
- Version 1.0: COMIMa is ready, with everything in one place.
- Practise, take the timed challenge, write Python, read the club news.
- Your progress follows you across devices with your account.
- A coach? You can pick that before signing in, even with an older profile.

## [0.9.1] - 2026-10-27

### fr
- **Cours et actualités plus visuels** : chaque cours a son bandeau coloré avec son numéro ; chaque actualité a sa photo de couverture (chargée quand il y a du réseau), sa pastille Article/Événement et un résumé court.

### en
- **More visual courses and news**: each course has its own coloured banner with its number; each news item has its cover photo (loaded when online), an Article/Event tag and a short summary.

### Message fr
- Les cours et les actualités sont plus beaux et plus faciles à parcourir.
- Chaque actualité s'ouvre avec sa photo.

### Message en
- Courses and news are nicer and easier to browse.
- Each news item opens with its photo.

## [0.9.0] - 2026-10-27

### fr
- **Nouvel accueil** : un mot de bienvenue avec ton prénom, six grandes tuiles (S'entraîner, Défi, Bibliothèque, Actualités, Python, Profil et réglages) et « Reprendre » (tes derniers cours, exercices, sujets et articles). La barre d'icônes du haut a disparu.
- **Le logo COMIMa**, en haut de chaque écran, ouvre une liste déroulante : toutes les sections et les dernières pages consultées.
- **Interpréteur Python** : écris, exécute, vois les affichages, réponds aux `input()`, dessine (`point`, `ligne`, `courbe`, `cercle`, `texte`), exemples prêts à lancer, touches rapides, erreurs expliquées. Chaînes f, arguments nommés (`print(..., end="")`).
- **Défi chronométré** : un maximum de bonnes réponses en 3 minutes, meilleur score gardé, score à copier.
- Les enregistrements de la progression ne se bousculent plus (un changement de langue suivi d'une réponse pouvait en perdre un).

### en
- **New home screen**: a welcome with your first name, six big tiles (Practice, Challenge, Library, News, Python, Profile and settings) and "Continue" (your latest courses, exercises, papers and articles). The icon bar at the top is gone.
- **The COMIMa logo**, at the top of every screen, opens a drop-down list: all sections and the latest pages you visited.
- **Python interpreter**: write, run, see the output, answer `input()`, draw (`point`, `ligne`, `courbe`, `cercle`, `texte`), ready-to-run examples, quick keys, explained errors. f-strings, named arguments (`print(..., end="")`).
- **Timed challenge**: as many correct answers as possible in 3 minutes, best score kept, score you can copy.
- Progress saves no longer collide (a language change followed by an answer could lose one).

## [0.8.1] - 2026-10-27

### fr
- Sécurité : un lien de connexion reçu sans demande de ta part (inscription, mot de passe oublié) est refusé ; les données de l'application ne sont plus incluses dans les sauvegardes Android ; les illustrations ne peuvent plus ouvrir de connexion réseau ; les données reçues du serveur sont vérifiées avant d'être reprises.
- Affichage : les formules plus larges que l'écran sont réduites pour tenir (plus jamais coupées), les accolades de groupe LaTeX ne s'affichent plus, les articles n'affichent plus de balises ni de liens bruts (vrais boutons et liens), et les pages d'entraînement partagées sur Facebook ont leur propre image.
- Robustesse : l'interpréteur Python ne peut plus faire planter l'application (structures sans fin, listes géantes, récursion) et s'arrête quand un programme travaille trop ; un fichier de progression abîmé est mis de côté (copie `.corrupt`) et la dernière bonne copie est reprise au démarrage.

### en
- Security: a sign-in link received without you asking for one (sign-up, forgotten password) is refused; app data is no longer included in Android backups; illustrations can no longer open network connections; data received from the server is checked before it is used.
- Display: formulas wider than the screen are shrunk to fit (never cut off), LaTeX group braces are no longer shown, articles no longer show tags or raw links (real buttons and links), and shared practice pages have their own preview image.
- Robustness: the Python interpreter can no longer crash the app (endless structures, huge lists, recursion) and stops programs that work too much; a damaged progress file is set aside (`.corrupt` copy) and the last good copy is restored at startup.

### fr
- Énoncés IMO : comparaison des 30 exercices existants aux PDF officiels, correction des questions 1998 P6 et 1999 P1, hypothèses et quantificateurs précisés, sources directes et traductions françaises signalées.

### en
- IMO statements: checked all 30 existing exercises against official PDFs, corrected the questions in 1998 P6 and 1999 P1, clarified assumptions and quantifiers, and added direct sources and French translation attribution.

## [0.8.0] - 2026-10-26

### fr
- Questions de code : le code Python de l'élève est maintenant **exécuté et corrigé** (petit interpréteur intégré, borné et sans danger : pas d'import, pas de fichiers, boucles infinies arrêtées), sur des exemples affichés et des tests cachés, avec le détail du premier échec. Erreurs de syntaxe jamais comptées fausses. Même moteur sur le site (page Entraînement).
- Les questions qu'on ne peut pas corriger (pseudo-code, simulation, preuve rédigée) sont des défis facultatifs, sans score.
- « Informatique et algorithmique » : nom du thème dans la bibliothèque.

### en
- Code questions: the student's Python code is now **run and graded** (built-in small interpreter, bounded and harmless: no imports, no files, infinite loops stopped), on shown examples and hidden tests, with the details of the first failure. Syntax errors are never counted wrong. Same engine on the website (Practice page).
- Questions that cannot be graded (pseudo-code, simulation, written proof) are optional challenges, without score.
- "Computer science and algorithms": theme name in the library.

## [0.7.3] - 2026-10-26

### fr
- Sujets, exercices et solutions : les commandes LaTeX de mise en page (titres de problèmes, « premier jour », listes, espaces…) ne s'affichent plus telles quelles ; elles sont converties en vrai texte et seules les formules restent en mathématiques.

### en
- Papers, exercises and solutions: LaTeX layout commands (problem headings, "first day", lists, spacing…) are no longer shown as raw text; they are converted to real text and only formulas stay as math.

## [0.7.2] - 2026-10-26

### fr
- « À propos » : contacts du bureau (président, secrétaire général, trésorier) avec un nom cliquable pour écrire un e-mail, la page Facebook officielle et le site comima.mg. Même chose sur la page Contact du site.

### en
- "About": board contacts (president, general secretary, treasurer) with a clickable name to send an e-mail, the official Facebook page and the comima.mg website. Same on the website's Contact page.

## [0.7.1] - 2026-10-26

### fr
- Nouvelle identité visuelle COMIMa : un sigma vert et rouge et un livre ouvert (apprendre, calculer, s'entraîner). Nouvelle icône de l'application (icône adaptative d'Android), nouveau logo dans l'application et sur le site, nouvelle icône d'onglet et images de partage.

### en
- New COMIMa visual identity: a green and red sigma with an open book (learn, compute, practise). New app icon (Android adaptive icon), new logo in the app and on the website, new tab icon and sharing images.

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
