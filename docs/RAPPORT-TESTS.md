# Rapport de tests (à remplir par ARHeritiana, à renvoyer à Antsa)

> **Mode d'emploi.** Fais les tests de la liste, **sur le site en ligne (www.comima.mg) et dans l'application installée**
> (téléphone ou émulateur, mise à jour des contenus faite : écran *Profil → Vérifier les mises à jour*, ou relancer).
> Remplace chaque `…` par **OK**, **KO** ou **non testé**, avec une remarque courte (capture, texte de l'erreur, ID de la
> question). Puis ouvre une PR **« Rapport de tests — AAAA-MM-JJ »** contenant ce fichier rempli, et demande la relecture
> de `raantss18` : c'est le signal « tests faits ». Un test KO qui vient du **code** (application, moteur, scripts) :
> décris-le ici, ne le corrige pas toi-même (c'est à Antsa) ; un test KO qui vient du **contenu** : corrige-le (c'est à toi).
>
> Date : 2026-10-27   Testé par : session Claude d'ARHeritiana (conteneur de développement : **sans accès** à www.comima.mg ni à l'application)   Version de l'application : 0.8.1+12 (`app/pubspec.yaml`)   Dernier déploiement vert (n° du run) : **94** (`e3356d91`) ; le run 95 (`1306c8c7`, version 0.8.1) était en cours à l'écriture
>
> **Rapport partiel.** La section C (commandes) est faite ; A et B ne sont faites que dans la mesure où le **build local** les
> permet ; tout ce qui demande le site en ligne ou l'application est marqué **non testé** et reste à faire sur un téléphone
> ou un ordinateur.

## A. Le déploiement et le site

| # | Test | Résultat |
| --- | --- | --- |
| A1 | Le dernier déploiement « Build & Deploy » est **vert** (onglet Actions) ; l'étape « Compiler les PDF » dit **0 échec(s)** | **OK** : run 94 vert, étape « Compiler les PDF (latexmk) » = succès. Je n'ai pas lu la ligne « 0 échec(s) » du journal ; en local, `build-latex` : 2576 compilés, 0 échec (voir C3). Run 95 (0.8.1) en cours. |
| A2 | `https://www.comima.mg/app/release.json` annonce la version attendue ; `https://www.comima.mg/app/v1/manifest.json` a une `version` récente | **OK (3 nov.)** : `release.json` annonce 1.7.0 (build 25), égale à `app/pubspec.yaml` ; manifeste `ea38785f3bca` (3 nov.). |
| A3 | La page **Cours** liste les 9 chapitres ; chaque PDF s'ouvre, la **numérotation des pages est continue** (chap. 1 commence à la page 20, etc.), le numéro de page est visible | **partiel** : en local, les 9 PDF sont compilés (pages 15, 8, 4, 8, 8, 6, 27, 22, 27, égales aux `meta.yaml`) ; première page lue avec `pdftotext` : 5 (chap. 0), 20 (chap. 1), 48 (chap. 5), 103 (chap. 8), numéro visible. Page Cours en ligne : **non testé**. |
| A4 | Un chapitre : le **plan** (liens vers les sections du PDF) et la liste des **exercices dans l'ordre** avec leurs numéros fonctionnent | **partiel** : dans le HTML du build local, plan = 7 liens (chap. 1), 22 (chap. 6), 9 (chap. 8) en `#nameddest=` ; exercices listés dans l'ordre du PDF (16, 8 et 11, dont « Exercice 6.1, Exercice guidé 6.1, Exercice 6.2 » au chapitre 6). Clic des liens dans un lecteur PDF et site en ligne : **non testé**. |
| A5 | **Bibliothèque** du site : 5 exercices pris au hasard (énoncé lisible, PDF, source citée, solution si elle existe) ; filtre par thème « informatique » | **OK (3 nov.)** : 5 exercices tirés au hasard (sophia-2006-tpe-08 et -100, deux dujella-2026, algo-04) : énoncé lisible, PDF, source citée, aucun LaTeX brut, **aucune solution affichée** (règle du coffre) ; filtre « informatique » : 22 exercices. |
| A6 | **Sujets** (IMO, olympiades nationales) : énoncé et solution lisibles ; **PDF et zips régénérés** après correction des `.tex` | **partiel** : `epreuve.pdf` et `sources.zip` des Olympiades nationales 2025 et 2026 **régénérés** (PR #106, fusionnée le 27 oct.) à partir des sources corrigées (compilation LuaLaTeX, 12 pages chacun ; plus de `20416`, `4.46` ni de résidu hors sujet). Lisibilité en ligne : **non testé**. |
| A7 | **Mobile** (largeur 375 px) : accueil, un chapitre, un exercice, l'Entraînement — rien ne déborde | **OK (3 nov.)** : à 375 px, accueil, chapitre 4, un exercice, Entraînement (FR et EN) : largeur de page 375, aucun débordement. |

## B. L'Entraînement (site et application)

| # | Test | Résultat |
| --- | --- | --- |
| B1 | Une notion de chaque étape fait un parcours complet : QCM, vrai/faux, réponse numérique, expression, ensemble, ordre, trous | **OK (3 nov.)** : formats vus en jouant sur le site : réponse numérique, expression (touches n, (, )), ensemble/liste (touche ;), vrai/faux, QCM (cases à cocher), trous (2 champs), code Python. Ordre non rencontré dans les séries jouées. Une erreur de contenu trouvée et corrigée : voir le complément du 3 nov. |
| B2 | Les **3 notions « Suites »** (`suites-lineaires`, `suites-convergence`, `suites-periodes-sommes`) : 5 questions au hasard, formules affichées sans commande LaTeX brute | **OK (3 nov.)** : 5 questions de `suites-lineaires`, `suites-convergence` et `suites-periodes-sommes` (10 pour cette dernière) : formules rendues, aucune commande LaTeX brute ; après une erreur, la réponse n'est pas montrée. |
| B3 | **Question de code Python** (`db-06`, pgcd) : (a) la bonne solution est **acceptée** ; (b) une solution fausse donne « Un test n'est pas réussi » avec le détail du test affiché ; (c) une erreur de syntaxe (`def pgcd(a, b:`) donne un **message sans compter faux** ; (d) `while True: pass` donne « trop de temps » sans bloquer ; (e) `import os` est refusé | **OK, avec remarques (3 nov.)** (question de code de `python-bases`, db-06 non atteint) : (a) bonne solution `est_pair` acceptée ; (b) solution fausse comptée fausse, message générique sans détail du test (cohérent avec « réponses jamais visibles ») ; (c) erreur de syntaxe : « ligne 1 : « ) » attendu », non comptée fausse ; (d) `while True: pass` : la page ne bloque pas, mais c'est compté faux avec le message générique, sans « trop de temps » ; (e) `import os` : « « import » n'est pas disponible ici », non compté faux. |
| B4 | Une question en **pseudo-code** ou une simulation n'apparaît **pas dans la série** mais dans « Défis au choix » à la fin | **OK (3 nov.)** : série complète de `tiroirs-bases` sur le site : la simulation (tb-05) et la preuve (tb-06) ne sont pas dans la série, mais dans « Défis au choix (2) » au bilan, avec « Les réponses et les solutions sont réservées aux encadreurs ». Texte d'introduction corrigé (PR #175). |
| B5 | **Application hors ligne** (mode avion) : une notion, une question de code, un chapitre — tout s'ouvre | **OK (3 nov.)** : émulateur Android 10 en mode avion : Entraînement et une notion, interpréteur Python (exemple PGCD exécuté), chapitre 0 avec son illustration et son PDF : tout s'ouvre. |
| B6 | **Mise à jour des contenus sans nouvelle version** : après ta fusion, l'application reçoit le nouveau contenu au prochain lancement | **OK (3 nov.)** : lots de défis 6 et 7 fusionnés le 3 nov. : après relance, l'application 1.7.0 les affiche sans nouvelle version (contenu `ea38785f3bca`). |
| B7 | Aucune **solution de référence** (`reference`) n'est visible dans le code source de la page d'entraînement ni dans l'application | **OK** pour `reference` : absent des paquets `public/app/v1/` (0 fichier) ; le texte de la solution n'apparaît que dans le champ `explication`, affiché après la réponse (par exemple « `while b: a, b = b, a % b` puis `return a` », `db-06`). Remarque : `tests_caches` (tests cachés) est présent dans les paquets et dans la page d'entraînement (3 fichiers), car les tests s'exécutent côté client ; ils sont donc lisibles par un élève qui regarde le code. |

## C. Les commandes (sur ta machine, depuis un `git pull` à jour)

| # | Commande | Résultat |
| --- | --- | --- |
| C1 | `npm test` | **OK** : 27 tests sur 27 (commit `1306c8c7`). Un premier passage donnait 26 sur 27 à cause d'un `public/app/v1/library.json` périmé sur mon poste (test « articles de l'application : pas de balisage brut ») ; après `build-index` et `build-app-packs`, 27 sur 27. Aucun lien avec `main`. |
| C2 | `node scripts/check-content.mjs` (aucune redondance) | **OK** : 12 notions, 127 questions, 1356 énoncés comparés, aucune redondance. |
| C3 | `node scripts/build-latex.mjs` (0 échec) et `node scripts/pagination.mjs` (cohérente) | **OK** : 2576 compilés, 0 échec ; pagination continue cohérente sur 9 chapitres. |
| C4 | `cd app/native && cargo test` (inclut les solutions de référence Python) | **OK** : 22 tests (14 + 3 + 5), 0 échec. |
| C5 | `npm run build` | **partiel** : `npx astro build` réussit (**2858 pages**) avec Node 22.23.4. Node 22.22.0 est refusé par Astro (« >=22.23.4 requis »). `npm run build` complet **non fait** : son `prebuild` lance `fetch-app-apk` et `build-og` (réseau et outils absents du conteneur). |

## D. Les nouveautés à vérifier (version courante, voir `app/CHANGELOG.md`)

| # | Nouveauté | Résultat |
| --- | --- | --- |
| D1 | Marque-pages sur un exercice, un cours, un sujet (site et application) : état, étoile, filtre | **OK pour un exercice (3 nov.)** : ouvrir l'exercice le marque « Lu » ; étoile posée depuis le menu « Marque-page » ; le filtre « À vérifier (étoile) » ne montre que lui. Cours et sujet : non testés. Site : non testé. |
| D2 | Écran « Groupes » (nécessite un compte : voir `supabase/README.md`) : création, code, rejoindre | **non testé** : il faut un compte, et aucun compte n'est créé dans le Supabase partagé. |
| D3 | Section « Contact » de « À propos » (noms cliquables), logo et icône | **OK (3 nov.)** : site, page Contact : 3 noms cliquables sur 5 (Christalin, Antsa, Heritiana ; Lova et Vlady sans lien) ; application, « À propos » : Facebook, comima.mg et les 3 mêmes noms avec leur e-mail ; logo et partenaires affichés. |

## Tester l'application sur un émulateur (recommandé à ARHeritiana)

Un **émulateur Android** sur ta machine permet de tester l'application toi-même (lots de contenu, Défi, Python, mise à jour)
sans téléphone ; c'est ainsi qu'Antsa vérifie chaque version.

1. Installer **Android Studio** (ou seulement les « command-line tools » + `platform-tools` + `emulator`), puis créer un
   appareil virtuel : *Device Manager → Create device* → « Pixel 6 » (ou plus petit), image système **x86_64**, API **34**
   (et, une fois, une image **API 29** pour vérifier les anciennes WebView).
2. Lancer l'appareil, puis installer l'APK `x86_64` de la dernière release GitHub (`comima-x86_64.apk`) :
   `adb install -r comima-x86_64.apk` (ou le glisser-déposer sur la fenêtre de l'émulateur).
3. Dans l'application : *Profil → Vérifier les mises à jour*, puis suivre la liste ci-dessus (sections A à D).
4. Tester aussi en **grande police** (*Réglages Android → Affichage → Taille de police*) : rien ne doit être coupé ou superposé.
5. Pas d'émulateur possible (machine trop modeste, conteneur) ? Le dire dans le rapport : Antsa teste alors cette partie.

## Remarques libres

- **Lien `node_modules`** : réglé. Le lien n'est plus suivi sur `main` (supprimé par un commit d'Antsa) et la PR #95 a corrigé le `.gitignore`
  (`node_modules` sans barre finale, qui couvre aussi un lien) ; fusionnée le 27 oct.
- **Olympiades nationales** : PDF et zips régénérés (voir A6) ; à relire une fois en ligne.
- **Recueil complet** (`public/recueil-techniques-resolution-problemes.pdf`) : encore l'ancien (ancien chapitre 0, s'arrête au 7).
  À reconstruire (`cours.tex` pour les 9 chapitres et `page_debut` sont prêts).
- **Tests restant à faire** (après le 3 nov.) : D2 (groupes, il faut un compte), D1 sur un cours, un sujet et le site, B1 pour le format « ordre ».

## Complément du 28 octobre 2026 — lots P1 sourcés (session Codex)

Périmètre : PR #127 (sp-31, sp-32) et #128 (sl-26 à sl-29). Le rapport initial ci-dessus est conservé ; les tests ci-dessous ne remplacent pas les tests non effectués de ce rapport. Code Flutter du checkout : 1.3.1+20 ; aucune version publiée par cette session.

- **Sources — OK** : Arthur Engel, *Problem-Solving Strategies*, Springer, 1998, chapitre 9 : 35(c), p. 227 ; 44, p. 228 ; exemples E1, E5 et E6, p. 222–224. Texte extrait et pages originales du PDF local inspectées. Les sous-questions, adaptations de format et traductions sont signalées dans les commentaires YAML ; corrections rédigées indépendamment. Le livre n’est pas ajouté au dépôt.
- **Mathématiques — OK** : `python3 docs/verification/p1-periodes-sources.py` et `python3 docs/verification/p1-lineaires-etape1.py` ; identités binaires, non-périodicité, deux arguments indépendants sur les séries, coefficients, racines, condition des permutations et comptage des symboles contrôlés. Ces calculs soutiennent les preuves rédigées ; les vérifications finies seules ne constituent pas les preuves générales.
- **Formats et redondances — OK** : paquets générés, aucun identifiant dupliqué ni ancien énoncé modifié ; périodes : 32 questions, dont 4 à l’étape 5 ; suites linéaires : 29 questions, dont 7 à l’étape 1, sur 5 formats.
- **C1, tests du site — OK** : 38 réussis, 0 échec, 1 ignoré (cible WebAssembly non compilée dans ce checkout de vérification).
- **C4, moteur Rust — OK** : 35 réussis, 0 échec, 1 ignoré ; réponses des questions de la banque acceptées par le moteur.
- **C5, compilation du site — OK** : `BASE_PATH=/ node_modules/.bin/astro build`, 2 860 pages ; pas de nouveau PDF dans ces deux lots de quiz, donc pas de compilation LaTeX requise pour ce périmètre.
- **Application, protections et bibliothèque — OK** : `flutter test test/math_text_test.dart test/reponses_test.dart`, 10 tests réussis ; contrôles du rendu et du masquage des corrections pour un élève.
- **Application, textes réels des nouveaux paquets — OK** : depuis `app`, `flutter test ../docs/verification/p1-periodes-sources-ui.dart` (8 cas) et `flutter test ../docs/verification/p1-lineaires-etape1-ui.dart` (16 cas) : FR/EN, largeur 320 px, police ×1 et ×2, aucune erreur de rendu des nouveaux énoncés et des étapes de la preuve. Ce sont des tests Flutter des composants, pas un parcours manuel Android complet.
- **Application, en-tête à cinq étoiles — KO préexistant** : dans `QuizPage`, débordement de la ligne numéro/stars à 320 px : 23 px en police ×1, 261 px en police ×2. Reproduit avec l’ancienne question `sp-07` comme avec le nouvel énoncé `sp-32`, en FR et EN. La ligne `Row` du cartouche dans `app/lib/ui/quiz.dart` est à rendre adaptable par Antsa. Aucun changement au code de l’application dans les lots P1 ; la réserve n’est pas masquée par les tests de texte.
- **Site, lot #127 en ligne — OK** : déploiement 40649734148 vert ; page `suites-periodes-sommes` : 32 questions dans les données publiques et présence de `sp-31`/`sp-32`. FR/EN à 320 px : largeur de document 305 px pour une fenêtre de 320 px, aucune erreur KaTeX.
- **Site, réponse fausse sans compte — OK** : sur le site en ligne, une réponse fausse à `sp-01` affiche « Pas tout à fait. Tu pourras la retenter plus tard. » ; aucune explication dans le retour et aucune valeur attendue affichée. Aucun compte créé ni utilisé.
- **Site, lot #128 en ligne — OK** : déploiement 40650748449 vert ; page `suites-lineaires` : 29 questions, présence de `sl-26`, `sl-27`, `sl-28` et `sl-29`. FR/EN à 320 px : largeur de document 305 px pour une fenêtre de 320 px, aucune erreur KaTeX.
- **Paquets en ligne, intégrité — OK après stabilisation** : manifeste public `2a047acc7d7b` ; paquets `arithmetique-4` et `algebre-4` téléchargés aux URL ordinaires de l’application, SHA-256 identiques au manifeste. Les six nouveaux identifiants sont présents, avec 32 et 29 questions dans les deux notions. Un premier contrôle pendant le renouvellement du cache avait échoué pour `algebre-4` ; contrôle avec manifeste rafraîchi, puis nouveau contrôle sans paramètre de cache : tous réussis. Cela vérifie la distribution publique, pas son installation effective sur un téléphone.
- **Site, défis facultatifs — signalement local à reproduire** : lors du prototype de la question de preuve, les formules des défis facultatifs restaient en LaTeX brut au bilan ; dans `src/scripts/training.ts`, cette branche revient avant `renderMath()`. La version livrée utilise le format ordre et suit le rendu normal ; aucune correction du script du site dans les lots P1. Ce signalement ne constitue pas un test de tous les défis déjà en ligne.
- **Android, disponibilité de l’émulateur — PARTIEL** : SDK et image API 29 déjà installés ; session temporaire `mahay_phone_api29`, en lecture seule et sans sauvegarde, démarrée avec KVM. Le chemin SDK a dû être fourni à la commande ; aucune configuration d’AVD modifiée. Aucun APK installé dans cette session et aucun parcours Android complet effectué.
- **B5/B6, application hors ligne et réception effective des nouveaux contenus — NON TESTÉ** : les tests Flutter et le téléchargement des paquets ne prouvent pas à eux seuls l’installation dans l’application sur téléphone.
- **P1 global — EN COURS** : ces deux lots ne terminent pas P1. Restent notamment l’étape 5 des suites linéaires, celle des suites de convergence et les autres notions listées dans `CHATGPT.md`. Contrainte d’Antsa pour la suite : références vérifiables, aucun nouveau problème inventé.

## Complément du 28 octobre 2026 — PY1, cours Python au lycée (session Codex)

Périmètre : PR #130, fusionnée en `6d1a285e8cea93053afc508d96a533a2b396860e`. Chapitre 9 et dix exercices bilingues ; aucune version de l’application publiée.

- **Sources — OK** : documentation officielle Python 3.14, CodEx (collectif d’enseignants, AEIF, CC BY-SA 4.0), références élémentaires MIT et CP-Algorithms. Bibliographie cliquable dans le PDF et références complètes dans `docs/sources/PY1.md` et les métadonnées. Adaptations/traductions signalées ; aucun corrigé de site ou de livre repris.
- **Programmes imprimés — OK** : `python3 docs/verification/py1-cours.py` extrait les sept programmes du chapitre ; 1 435 exécutions identiques sous CPython et dans le moteur COMIMa, avec contrôles mathématiques indépendants.
- **C3, PDF et pagination — OK** : chapitre de neuf pages A5, numérotées 114 à 122, vingt PDF d’exercices FR/EN ; tous rendus et relus visuellement, aucun débordement dans les journaux finaux. Sources ZIP extraites et recompilées avec succès. Sur le déploiement : **21 compilés, 2 544 en cache, 0 échec**.
- **C1/C4/C5, contrôles locaux — OK** : tests du site : 38 réussis, un ignoré (WebAssembly absent localement) ; moteur : 35 réussis, un ignoré ; site : 2 882 pages construites. Détails et commandes dans `docs/verification/py1-cours.md`.
- **Application, rendu et protection — OK** : 50 tests Flutter réussis, dont les dix nouveaux énoncés FR/EN à 320 px, police ×1 et ×2 ; tests existants du rendu mathématique et des réponses réservées aux encadreurs. Vérification reproductible : `docs/verification/py1-cours-ui.dart` (copie temporaire sous `app/test/`, retirée ensuite). Aucun code de l’application modifié.
- **A1, déploiement — OK** : Build & Deploy **40655755805** vert ; publication Pages **40656261235** verte. Les trois contrôles de la PR #130 étaient verts avant sa fusion.
- **A3/A4/A5, contenu en ligne — OK** : chapitre, PDF de neuf pages, dix pages d’exercices, leurs sources liées et vingt PDF FR/EN accessibles. Le PDF servi contient les précisions finales sur le pas de `range` et la suite de Fibonacci. Contrôle HTTP reproductible : `python3 docs/verification/py1-en-ligne.py`.
- **A7, mobile — OK pour ce périmètre** : chapitre en ligne à 375 px, document de 360 px (aucun défilement horizontal), neuf liens du plan et dix liens d’exercices. En local, exercice final FR et exercice `range` EN vérifiés à la même largeur, formules et crédits lisibles. Ce contrôle ne remplace pas un parcours de toutes les pages du site.
- **Paquet de l’application — OK** : manifeste public **48f20a475941** ; bibliothèque de **1 459 859 octets**, SHA-256 **ba500c7a69791ebe2c9801a876f22dcf9f4b7383163209cbe14f0c8b0d3c72ef**, identique au manifeste. Chapitre et dix exercices FR/EN présents ; aucune solution associée aux nouveaux exercices. PDF public SHA-256 **d0d17c66342752f9a7f4a9a29f565874cf4f848615a342efaff6efdbbf2b9df1**.
- **Propagation — OK après attente** : premier contrôle du nouveau lien : HTTP 404 avant la disponibilité effective de Pages ; contrôle ultérieur aux URL ordinaires, sans paramètre de cache : tous les fichiers et l’intégrité de la bibliothèque réussis. Aucun résultat transitoire n’a été présenté comme un succès.
- **B5/B6, Android — NON TESTÉ de bout en bout** : ouverture manuelle du chapitre dans une application Android installée, lecture hors ligne et réception effective de la mise à jour sur téléphone restent à faire. Les tests de rendu Flutter et le téléchargement du paquet vérifient seulement leurs périmètres respectifs.

La demande de relecture de cette PR de rapport a déjà été tentée une fois auprès de `raantss18` ; GitHub refuse l’auto-relecture (même compte que l’auteur). La PR reste ouverte pour Antsa et n’est pas fusionnée automatiquement.

## Complément P1 / Q1 — 28 octobre 2026 (ARHeritiana, session Codex)

Périmètre : PR #131 (10 questions P1), #132 (12 notions et 180 questions Q1), #133 (précision rédactionnelle de la transition de dénombrement dans `sl-30`). Ce complément s’ajoute au rapport historique ; il ne transforme pas les lignes anciennes « non testé » en parcours manuels réalisés. La PR #129 reste distincte.

| Contrôle | Résultat et périmètre |
| --- | --- |
| P1 : couverture | **OK** — chacune des 3 notions Suites a au moins 5 questions à chacune des 5 difficultés. Comptages publiés : convergence 5/9/7/5/5, linéaires 7/7/9/5/5, périodes-sommes 6/7/10/5/5. |
| P1 : réponses | **OK** — `python3 docs/verification/p1-completion.py` : calcul exact, identité symbolique, bornes et deux dénombrements indépendants des pavages/permutations. Les preuves générales restent distinctes des tests finis. |
| Q1 : périmètre et sources | **OK** — 12 notions, 3 par chapitre 10/11/13/14 ; 15 questions FR/EN par notion et 3 par difficulté. Les 180 références de `docs/verification/q1/sources.json` correspondent aux métadonnées et énoncés anglais du dépôt. PDF privé d’Engel indisponible dans cet environnement : pas de nouvelle confrontation directe au livre revendiquée. |
| Q1 : réponses et relecture | **OK** — `python3 docs/verification/q1/check.py` : 158 contrôles de clés/réponses/modèles ; 22 éléments supplémentaires nécessitent une relecture de preuve. Relecture interne dans `REVIEW.md`, sans statut « relu humainement » ni revue aveugle indépendante. Les vérifications finies ne constituent pas une preuve universelle. |
| Formules Q1 | **OK** — `node docs/verification/q1/render.mjs` : 2 076 formules acceptées par KaTeX strict, 1 334 champs parcourus, aucun délimiteur isolé. |
| Paquets | **OK** — `npm run app-packs` : 24 notions, 516 questions, 9 paquets. Bibliothèque : 1 366 exercices et 10 cours. Aucun format nouveau. |
| Site : tests automatisés | **OK** — `npm test` : 38 réussis, aucun échec ; 1 test WASM ignoré localement, moteur non compilé dans le checkout. Le CI Rust contrôle les vraies réponses attendues. |
| Site : production | **OK** — `npm run build` : 2 906 pages compilées. Aucun énoncé ni chapitre PDF modifié dans les lots de quiz, donc pas de PDF à recompiler. |
| CI avant fusion | **OK** — `check`, `web`, `supabase` verts sur #131, #132 et #133. Runs Application : 40683941996, 40687278506, 40687983931. Aucun changement du code Flutter/Rust, du serveur, des workflows ou des versions. |
| Flutter : textes mobiles | **OK** — 60 tests supplémentaires : 15 notions (12 Q1 et 3 P1) × FR/EN × police 1/2 à 320 px. Titres, fiches, énoncés, explications, choix, étapes et textes à trous mis en page sans exception. Commande depuis `app/` : copier temporairement `../docs/verification/q1-mobile.dart` vers `test/q1_mobile_test.dart`, puis `flutter test test/q1_mobile_test.dart`, puis retirer la copie. Ce test ne couvre pas l’en-tête de l’écran complet ni l’installation Android. |
| P1 : publication | **OK** — build/déploiement 40685072298 ; manifeste public `b389e863fa72` contrôlé avec empreintes SHA-256 de tous les paquets et comptages des 3 notions. |
| Q1 : publication | **OK** — build/déploiement 40687642735 et Pages 40688001695 réussis ; manifeste `6f5f1a85929a`. `python3 docs/verification/q1/live.py` : 24 pages FR/EN, HTTP 200, 15 questions par page, 24 notions et 516 questions au total ; SHA-256 et tailles de tous les paquets vérifiés aux URL ordinaires, sans paramètre de contournement du cache. |
| Clarification #133 | **OK** pour la fusion et les 3 contrôles CI ; build 40688303176 et publication Pages 40688685616 réussis. Le nombre et les réponses des questions restent inchangés. |
| Parcours navigateur interactif complet | **NON TESTÉ** dans cette session — les contrôles HTTP et des données intégrées aux pages ne sont pas des clics dans le navigateur. |
| Téléphone Android / mise à jour / hors ligne | **NON TESTÉ** — aucun parcours complet sur appareil, installation effective de mise à jour ou essai de lecture hors ligne n’est annoncé. Reste dans la tâche distincte de rapport de tests Android. |

La précision française de `sl-30` dit explicitement d’ajouter **D(S)** au compteur **D(S ∪ {j})**, pour chaque valeur admissible j. La correction anglaise et le script de dénombrement exprimaient déjà cette transition ; réponse inchangée : 172.

Actualisation après fusion de #134 : le manifeste `a89af401993c` est en ligne. Les 24 pages, les 516 questions, les empreintes et tailles des paquets, le moteur WASM et les données publiques des 15 notions P1/Q1 ont été vérifiés ; les explications retirées des paquets publics par le coffre ne sont pas comparées à ces paquets.

## Vérification du 29 octobre 2026 — signalement de régression après PY1

Antsa signale qu’une casse aurait été constatée par Claude, sans symptôme ni message précis fourni à ce stade. **Aucune régression reproduite dans le périmètre ci-dessous ; cela ne permet pas de conclure que tout fonctionne.** Une précision du signalement a été demandée. Aucun correctif fonctionnel ni nouvelle version n’a été publié pendant cette vérification.

- **État de départ — OK** : vérifications sur `main` à `70381b0d4fdab155e01d0d377146d3f35ca97e5c`, branche isolée `codex/py1-verification-regressions`, travail de l’autre checkout conservé. Les PR #129 et #130 ne portent aucun commentaire décrivant le problème.
- **Déploiement — OK** : Build & Deploy `40828584454`, Application `40828584445` et publication Pages `40828870197` terminés avec succès lors du contrôle.
- **Index et paquets — OK** : `node scripts/build-index.mjs` et `node scripts/build-app-packs.mjs` réussis sur la version actuelle.
- **Tests du site — OK** : 43 réussis, zéro échec, un ignoré (moteur WebAssembly absent localement).
- **Programmes du chapitre — OK** : moteur natif recompilé ; `python3 docs/verification/py1-cours.py`, 1 435 exécutions CPython/COMIMa identiques, calculs indépendants réussis.
- **Moteur — OK** : 35 tests réussis, zéro échec, un ignoré par défaut. Un avertissement Rust `unused_mut` préexistant est affiché ; aucun changement au moteur.
- **Application, rendu et coffre — OK** : 55 tests Flutter réussis (`math_text_test`, `reponses_test`, `coffre_test`, copie temporaire de `docs/verification/py1-cours-ui.dart`). Les dix exercices sont contrôlés en FR/EN à 320 px et police ×1/×2. La copie temporaire a été supprimée ; aucun fichier de l’application modifié.
- **PDF et pagination — OK dans le cache valide** : contrôles ciblés du chapitre et des vingt PDF FR/EN, 21 cibles en cache, zéro échec, aucun `Overfull` dans leurs journaux ; pagination continue de dix chapitres. Ce passage n’est pas présenté comme une nouvelle compilation des 21 fichiers.
- **Distribution actuelle — OK** : manifeste `a89af401993c`, bibliothèque SHA-256 `ec1672f3ef0da203267636684cf3eab463ddc76edf14ad7e8d2f46a1a477c408`, identique au manifeste. Chapitre de neuf pages et dix exercices FR/EN présents ; aucun champ de solution renseigné pour ces exercices. PDF du site téléchargé et reconnu par `pdfinfo` (A5, neuf pages).
- **Cours dans l’APK publiée — OK pour la présence et le contenu** : APK x86_64 de `app-v1.5.0` téléchargée sans installation ; SHA-256 `e7d955c79f999407617e7116d5a6923d891f437873bbde9aa6f134aba68b26d5`, conforme au fichier `SHA256SUMS` de la publication. Le PDF `assets/flutter_assets/assets/content/cours/09-python-algorithmes.pdf` est inclus (neuf pages A5) et son texte extrait est identique à celui du PDF public. La bibliothèque embarquée contient les dix exercices sans leurs solutions.
- **Android interactif — NON TESTÉ** : présence du PDF dans l’APK et tests Flutter ne prouvent pas son ouverture sur un téléphone. Aucun parcours manuel Android, aucune installation ni modification d’AVD pendant ce contrôle.
- **Signalement de Claude — À PRÉCISER** : écran, action, message d’erreur ou commentaire de PR nécessaires pour reproduire le problème exact. Aucun fichier de cours ni de code n’a été modifié sur la base d’une supposition.

## Tests du 3 novembre 2026 — site en ligne et application (session Claude d'Antsa)

> Site www.comima.mg (navigateur, largeur 375 px) et application 1.7.0 (25) sur l'émulateur Android 10 (API 29), contenu `ea38785f3bca`.
> Les cases A2, A5, A7, B1 à B6 et D1 à D3 ci-dessus sont remplies ; compléments ci-dessous.

- **A3 en ligne — OK** : la page Cours liste 10 chapitres (0 à 9). Les 10 PDF en ligne ont une numérotation continue (5–12, 13–20, 21–24, 25–32, 33–40, 41–46, 47–73, 74–95, 96–113, 114–122), et leur nombre de pages est égal aux `meta.yaml`. Le test local « 08-inegalites : 18 pages, le PDF en compte 17 » venait d'un PDF périmé sur le poste : le PDF en ligne a bien 18 pages.
- **A4 en ligne — OK** : chapitre 6, plan de 22 liens `#nameddest=`, 8 exercices dans l'ordre du PDF (6.1, guidé 6.1, 6.2, 6.3, guidés 6.2 à 6.5), liens vers la bibliothèque.
- **A6 en ligne — OK** : sujets OM nationales 2025 et 2026 et IMO 2025 : énoncés lisibles, aucun LaTeX brut, aucun corrigé. Les PDF des OM nationales ont 6 pages (sans corrigés), sans les résidus `20416` ni `4.46`.
- **Défauts trouvés et corrigés :**
  - **Contenu, PR #176** : la question `sp-30` disait « Choisis une seule réponse » alors qu'elle est à choix multiple (cases à cocher) ; consigne retirée. Gras autour d'une formule (`**au moins $k+1$**` dans la fiche `tiroirs-bases`, `**modulo $m$**`, `**modulo $3$**`) : les `**` restaient visibles dans l'application ; formules sorties du gras.
  - **Application, PR #175 (relecture d'Antsa)** : « Indication » effacée au début des indications en italique qui contiennent une formule (`\emph{Indication : … $n!$ …}`, 19 exercices, ex. `recueil-0-01-factorielle-puissances`). Introduction des « Défis au choix » qui renvoyait à l'explication, réservée aux encadreurs (site et application).
- **Remarques sans correctif :**
  - B3 (d) : une boucle infinie est comptée fausse avec le message générique ; l'élève ne sait pas que son programme a dépassé le temps. À trancher par Antsa : un message « trop de temps » ne révèle pas la réponse.
  - Le contrôle du CI « pas de balisage brut » n'a pas détecté les `**` autour d'une formule : à compléter (code, Antsa).
