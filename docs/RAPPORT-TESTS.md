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
| A2 | `https://www.comima.mg/app/release.json` annonce la version attendue ; `https://www.comima.mg/app/v1/manifest.json` a une `version` récente | **non testé** (site injoignable depuis le conteneur) |
| A3 | La page **Cours** liste les 9 chapitres ; chaque PDF s'ouvre, la **numérotation des pages est continue** (chap. 1 commence à la page 20, etc.), le numéro de page est visible | **partiel** : en local, les 9 PDF sont compilés (pages 15, 8, 4, 8, 8, 6, 27, 22, 27, égales aux `meta.yaml`) ; première page lue avec `pdftotext` : 5 (chap. 0), 20 (chap. 1), 48 (chap. 5), 103 (chap. 8), numéro visible. Page Cours en ligne : **non testé**. |
| A4 | Un chapitre : le **plan** (liens vers les sections du PDF) et la liste des **exercices dans l'ordre** avec leurs numéros fonctionnent | **partiel** : dans le HTML du build local, plan = 7 liens (chap. 1), 22 (chap. 6), 9 (chap. 8) en `#nameddest=` ; exercices listés dans l'ordre du PDF (16, 8 et 11, dont « Exercice 6.1, Exercice guidé 6.1, Exercice 6.2 » au chapitre 6). Clic des liens dans un lecteur PDF et site en ligne : **non testé**. |
| A5 | **Bibliothèque** du site : 5 exercices pris au hasard (énoncé lisible, PDF, source citée, solution si elle existe) ; filtre par thème « informatique » | **non testé** |
| A6 | **Sujets** (IMO, olympiades nationales) : énoncé et solution lisibles ; **PDF et zips régénérés** après correction des `.tex` | **partiel** : `epreuve.pdf` et `sources.zip` des Olympiades nationales 2025 et 2026 **régénérés** (PR #106, fusionnée le 27 oct.) à partir des sources corrigées (compilation LuaLaTeX, 12 pages chacun ; plus de `20416`, `4.46` ni de résidu hors sujet). Lisibilité en ligne : **non testé**. |
| A7 | **Mobile** (largeur 375 px) : accueil, un chapitre, un exercice, l'Entraînement — rien ne déborde | **non testé** |

## B. L'Entraînement (site et application)

| # | Test | Résultat |
| --- | --- | --- |
| B1 | Une notion de chaque étape fait un parcours complet : QCM, vrai/faux, réponse numérique, expression, ensemble, ordre, trous | **non testé** (interface). `build-app-packs` valide le format : 12 notions, 127 questions. |
| B2 | Les **3 notions « Suites »** (`suites-lineaires`, `suites-convergence`, `suites-periodes-sommes`) : 5 questions au hasard, formules affichées sans commande LaTeX brute | **non testé** |
| B3 | **Question de code Python** (`db-06`, pgcd) : (a) la bonne solution est **acceptée** ; (b) une solution fausse donne « Un test n'est pas réussi » avec le détail du test affiché ; (c) une erreur de syntaxe (`def pgcd(a, b:`) donne un **message sans compter faux** ; (d) `while True: pass` donne « trop de temps » sans bloquer ; (e) `import os` est refusé | **partiel** : `cargo test` (moteur) passe, y compris les tests de robustesse (programmes aléatoires, programmes mutés, JSON arbitraire, expressions pathologiques) ; comportement dans l'interface (a à e) : **non testé**. |
| B4 | Une question en **pseudo-code** ou une simulation n'apparaît **pas dans la série** mais dans « Défis au choix » à la fin | **non testé** |
| B5 | **Application hors ligne** (mode avion) : une notion, une question de code, un chapitre — tout s'ouvre | **non testé** |
| B6 | **Mise à jour des contenus sans nouvelle version** : après ta fusion, l'application reçoit le nouveau contenu au prochain lancement | **non testé** |
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
| D1 | Marque-pages sur un exercice, un cours, un sujet (site et application) : état, étoile, filtre | **non testé** |
| D2 | Écran « Groupes » (nécessite un compte : voir `supabase/README.md`) : création, code, rejoindre | **non testé** |
| D3 | Section « Contact » de « À propos » (noms cliquables), logo et icône | **non testé** |

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
- **Tests restant à faire par une personne** sur le site en ligne et dans l'application : A2, A5, A7, B1, B2, B3 (a à e), B4, B5, B6, D1 à D3,
  et le côté « en ligne » de A3 et A4.

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
