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
