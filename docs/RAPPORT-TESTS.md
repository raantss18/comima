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
| A6 | **Sujets** (IMO, olympiades nationales) : énoncé et solution lisibles ; **PDF et zips régénérés** après correction des `.tex` | **KO connu** (contenu) : `content/sujets/om-national-2025/` et `…-2026/` : `epreuve.pdf` et `sources.zip` contiennent encore les erreurs corrigées dans les `.tex` des solutions (par exemple 20416 au lieu de 20706). À régénérer. Lisibilité en ligne : **non testé**. |
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

## Remarques libres

- **Lien `node_modules`** : la PR #95 (retrait d'un lien `node_modules` commité par la PR #91) reste ouverte. Le lien n'est plus suivi sur `main`
  (supprimé par un commit d'Antsa), mais le `.gitignore` contient encore `node_modules/` (avec barre), qui ne couvre pas un lien :
  #95 corrige cela.
- **Recueil complet** (`public/recueil-techniques-resolution-problemes.pdf`) : encore l'ancien (ancien chapitre 0, s'arrête au 7).
  À reconstruire (`cours.tex` pour les 9 chapitres et `page_debut` sont prêts).
- **Tests restant à faire par une personne** sur le site en ligne et dans l'application : A2, A5, A7, B1, B2, B3 (a à e), B4, B5, B6, D1 à D3,
  et le côté « en ligne » de A3 et A4.
