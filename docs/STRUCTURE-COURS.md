# Structure d'un chapitre de cours COMIMa (norme)

> Statut : **norme** pour tous les chapitres de `content/cours/`. Gabarits : `templates/preamble.tex` +
> `templates/preamble-cours.tex` ; modèle commenté : `templates/cours-modele.tex`. Conception : ARHeritiana ;
> scripts du site : Antsa (voir `CONTENU.md`). Rédigé le 26 oct. 2026.

## 1. Principe

Un chapitre = **un dossier** `content/cours/<NN>-<slug>/` contenant **exactement** :

| Fichier | Rôle |
| --- | --- |
| `meta.yaml` | `id` (= nom du dossier), `numero`, `titre_fr`, `titre_en`, `description_fr`, `description_en`, `pages` (= nombre de pages du PDF compilé), `source`, `tags`, `langue` |
| `cours.tex` | document LaTeX **complet** (`\documentclass` … `\end{document}`), compilé par `scripts/build-latex.mjs` vers `public/pdfs/cours/<id>/cours.pdf` |

Interdits (format retiré) : `cours.pdf` précompilé, `chapitre.tex`, `templates/cours/` (gabarit du recueil, `exercise.sty`).

**Une seule source de vérité par énoncé.** Tout exercice ou problème du chapitre est un dossier
`content/exercices/<id>/` (`meta.yaml`, `enonce.tex`, `solution.tex` facultatif) créé avec
`scripts/import-lot.mjs`, et il est **inclus par son id** (`\exochap`, `\exercice`, `\probleme`). Le texte d'un
énoncé n'apparaît jamais dans `cours.tex`. Une correction d'énoncé se fait dans `enonce.tex` : elle change à la fois
la page de l'exercice, la bibliothèque de l'application et le PDF du chapitre.

## 2. Squelette de `cours.tex` (ordre imposé)

```
\documentclass[11pt]{article}
\input{preamble.tex}
\input{preamble-cours.tex}
\solutionstrue
\begin{document}
\chapitre{<numero>}{<Titre>}                 % 0. titre (numero = meta.yaml)
<introduction, sans titre>                   % 1. introduction (obligatoire)
\sourcecours{<D'après …>}                    %    facultatif
\section{Exemple introductif : …}\label{sec:…}   % 2. facultatif
\section{<Notion 1>}\label{sec:…}            % 3. notions : une \section par notion,
  definition / theoreme / proposition / lemme / corollaire + proof,
  methode, exemple + solution|proof, remarque, figures,
  retenir (bilan local), \exercice / \exochap d'application
\section{<Notion 2>}\label{sec:…}  …
\section{À retenir}\label{sec:retenir}       % 4. obligatoire, une seule fois, un bloc retenir
\section{Exercices}\label{sec:exercices}     % 5. si le chapitre a des \exochap non placés plus haut
  \subsection*{Exercices faciles} …          %    paliers facultatifs
\section{Problèmes}\label{sec:problemes}     % 6. si le chapitre a des \probleme
\ifsolutions \clearpage
\section{Solutions}\label{sec:solutions}     % 7. un \solutionde par exercice/problème inclus
\fi
\end{document}
```

Aucune autre ligne avant `\begin{document}` (pas de `\usepackage`, `\newcommand`, `\def`, `\setcounter{page}`).
Les chapitres 00 et 08 gardent provisoirement leur `\setcounter{page}` (pagination du recueil complet, tâche S2) ;
les nouveaux chapitres commencent page 1.

## 3. Liste fermée des macros et environnements

Tout ce qui n'est pas ici (ni du LaTeX/amsmath/TikZ courant : listes, `center`, `tabular`, maths) est **interdit**
dans `cours.tex`. Un besoin nouveau = une PR sur `templates/preamble-cours.tex` (technique, relue par Antsa).

| Élément | Sens | Rendu | Numéro |
| --- | --- | --- | --- |
| `\chapitre{n}{titre}` | début du chapitre | « CHAPITRE n » + grand titre, en-tête courant, signet PDF | n |
| `\section{…}\label{sec:<slug>}` | partie du plan (notion, À retenir, Exercices…) | titre « n.k » | n.k |
| `\subsection{…}\label{sec:<slug>}` | sous-notion, dans le plan | « n.k.m » | n.k.m |
| `\subsection*{…}`, `\subsubsection*{…}`, `\paragraph{…}` | intertitre local, **hors plan** | gras, non numéroté | — |
| `definition` `[nom]` | définition (terme en `\emph`) | filet vert | n.k |
| `theoreme` `[nom]` | résultat majeur (un « principe » nommé est un théorème) | filet vert, italique | n.k |
| `proposition`, `lemme`, `corollaire` `[nom]` | résultat secondaire / auxiliaire / conséquence | filet vert, italique | n.k |
| `exemple` | situation concrète ou énoncé illustratif | « Exemple n.k. » | n.k |
| `proof` | démonstration d'un résultat ou d'un exemple-énoncé | « Démonstration. » … ∎ | — |
| `solution` | résolution rédigée d'un **exemple du cours** | « Solution. » … ∎ | — |
| `remarque` | mise en garde, cas limite, prolongement | « Remarque. » | — |
| `methode` `[intitulé]` | démarche en étapes | filet vert clair, titre sur sa ligne | — |
| `retenir` | bilan (local dans une notion ; global dans « À retenir ») | filet rouge | — |
| `\exochap{id}{titre}` | exercice d'entraînement | « Exercice n.k — titre » + `enonce.tex` | n.k |
| `\exercice{id}{titre}` | exercice **guidé** (questions intermédiaires, placé après sa notion) | « Exercice guidé n.k — titre » | n.k |
| `\probleme{id}{titre}` | problème (plus long, compétition) | « Problème n.k — titre » | n.k |
| `\solutionde{id}{titre}{ex\|exo\|pb}` | solution en fin de chapitre | titre vert + `solution.tex` ; **rien** si absent | — |
| `\sourcecours{texte}` | source du chapitre | petit italique | — |
| `tikzpicture` dans `center`, `\fitfig{…}` | figure (TikZ **seul**, pas d'image) | réduite à la largeur si elle dépasse | — |
| `\N \Z \Q \R \vect{AB} \pgcd \ppcm` | notations | ℕ… , $\overrightarrow{AB}$, PGCD, PPCM | — |

Compteurs : un compteur commun par chapitre pour `definition`, `theoreme`, `proposition`, `lemme`, `corollaire`,
`exemple` ; trois compteurs indépendants pour `\exochap`, `\exercice`, `\probleme` (tous préfixés par n).
`\boxed`, `\fbox{minipage}` restent permis pour un **schéma** dans un `center`, pas pour remplacer `retenir`.

### Correspondance ancien gabarit (recueil, ch. 1–7) → norme

| Ancien (`chapitre.tex`, `exercise.sty`, `templates/cours/main.tex`) | Nouveau |
| --- | --- |
| `\chapter{Titre}` | `\chapitre{n}{Titre}` |
| `\section*{…}` / `\section{…}` | `\section{…}\label{sec:…}` (toujours numérotée) |
| `\subsection*{…}` / `\subsection{…}` | `\subsection{…}\label{sec:…}` si c'est une notion du plan, sinon `\subsection*{…}` |
| `\subsubsection{…}` | `\subsubsection*{…}` (hors plan) |
| `\begin{exercise}[titre] … \end{exercise}` | `\exochap{<id>}{titre}` (ou `\exercice` si guidé) ; texte dans `enonce.tex` |
| `\begin{problem}[titre] … \end{problem}` | `\probleme{<id>}{titre}` |
| `\paragraph{Exercice k --- titre.}` + texte | `\exochap{<id>}{titre}` (ou `\exercice`) |
| `\paragraph{Problème k --- titre.}` + texte | `\probleme{<id>}{titre}` |
| `\paragraph{Exemple…}` + texte | `exemple` (+ `solution`) |
| `\begin{thm}[…]` | `theoreme` |
| `\begin{defi}` / `\textbf{Terme} : …` | `definition` |
| `\begin{fact}` | `proposition` ; `theoreme[nom]` si l'intitulé est « Théorème … » |
| `highlightbox` (énoncé d'un principe) | `theoreme[Nom du principe]` ; bilan → `retenir` |
| `\subsection*{À retenir}` (au milieu) | `retenir` dans la section ; synthèse finale dans `\section{À retenir}` |
| liste « méthode / étapes » | `methode` |
| `\begin{solution}` dans un exercice (masquée) | `content/exercices/<id>/solution.tex` (voir § 8, Q2) + `\solutionde` |
| note d'option `[E9]`, `[12]`, `% Problème 15` | supprimée du titre ; référence d'origine dans `meta.yaml > source.reference` si vérifiée |
| `multicols` + figure dans un énoncé | figure dans `enonce.tex`, centrée **après** le texte (pas de `multicols`) |
| `\def\depth…` dans une figure | renommer (`\depth`, `\width`, `\height` sont des commandes LaTeX) ; `\pgfmathsetmacro`/`\def` locaux au `tikzpicture` |
| `\fitfig`, `\vect`, `\pgcd`, `\ppcm` | inchangés (fournis par `preamble-cours.tex`) |
| `\setcounter{chapter}{%%CHAPITRE_PRECEDENT%%}` | supprimé (`\chapitre{n}` fixe tout) |

## 4. Fragments d'exercices (`enonce.tex`, `solution.tex`)

Ils sont compilés **seuls** (`templates/exercice.tex` + `preamble.tex`, PDF de l'exercice), affichés sur le site
(KaTeX) et inclus dans le cours. Donc : corps de texte uniquement ; ni `\section`, ni `\label`, ni macro de
`preamble-cours.tex` (`\vect`, `\pgcd`, `\fitfig`, environnements de cours) ; pas de `multicols` ; TikZ avec les
seules bibliothèques de `preamble.tex`. Un énoncé avec figure doit être ajouté à `TARGETS` de
`scripts/build-figures.mjs` (SVG pour le site, PR technique).

## 5. Nommage

- Dossier de chapitre : `<NN>-<slug>` (`NN` = `numero` sur deux chiffres, slug ASCII minuscule à tirets).
- Exercices du chapitre n : `recueil-<n>-<kk>-<slug>` (exercices, `kk` sur deux chiffres),
  `recueil-<n>-e<k>-<slug>` (exercices guidés), `recueil-<n>-p<k>-<slug>` (problèmes). Les ids existants ne
  changent pas (marques des élèves, liens) ; l'ordre est celui de `cours.tex`, pas celui de `ls`.
- Étiquettes : `sec:` (sections), `def:`, `thm:`, `prop:`, `lem:`, `cor:`, `exm:` (exemples) + slug ASCII.
  `ex:`, `exo:`, `pb:` sont **réservés** (posés par les macros). Le chapitre 08 utilise encore `ex:E5`… pour des
  exemples : toléré, à renommer `exm:` à l'occasion.
- Tags des exercices : `chapitre n` et le numéro affiché : `exercice n.k`, `exercice guidé n.k`, `problème n.k`.

## 6. Ce que le site extrait (grammaire stricte, une construction par ligne)

| Donnée | Motif (sur `cours.tex`) | Usage |
| --- | --- | --- |
| numéro, titre | `^\\chapitre\{(\d+)\}\{(.+)\}` | contrôle avec `meta.yaml` |
| plan | `^\\(sub)?section\{(.+)\}\\label\{sec:([a-z0-9-]+)\}` | plan du chapitre ; N-ième `\section` → destination PDF `section.N` (`subsection.N.M`) : lien `cours.pdf#nameddest=section.N` |
| exercices | `^\\(exochap\|exercice\|probleme)\{([a-z0-9-]+)\}\{(.+)\}` | liste ordonnée des exercices du chapitre, avec type et numéro `n.k` calculé |
| fiche ↔ section | `content/app/notions/*.yaml` : `chapitre: <id>` (existe) + `section: <slug>` (à créer, § 7 B4) | lien fiche → section du PDF |

Conséquences : le `\label{sec:…}` est **sur la même ligne** que `\section`/`\subsection` numérotée ; les titres
contenant des maths utilisent `\texorpdfstring{$…$}{…}` ; les sections étoilées n'entrent pas dans le plan.

## 7. Compatibilité

pdfLaTeX seul (TeX Live Debian : `texlive-latex-extra`, `-lang-french`, `-pictures` ; aucun nouveau paquet sans PR
technique) ; A5 (fixé par `preamble-cours.tex`) ; UTF-8 ; `#` → `\#`, `%` → `\%`, `&` hors tableau → `\&` ;
symboles Unicode limités à ceux déclarés dans `preamble.tex` ; aucune image externe ; 0 erreur, 0 `Overfull`
de plus de 1 pt dans `main.log` ; vérifier le rendu des pages à largeur de téléphone (PDF A5 lisible en zoom).

---

## 8. Plan de migration des chapitres 01 à 07

### Phase A — scripts : `cours.tex` prioritaire (PR technique, Antsa)

Objectif : un chapitre qui a `cours.tex` est compilé même s'il garde `cours.pdf`/`chapitre.tex`, pour migrer
chapitre par chapitre.

1. `scripts/content-lib.mjs`, `loadCours()` : si `cours.tex` existe, `pdfPath = null` et `chapitreTexPath = null`
   (avertissement console si `cours.pdf`/`chapitre.tex` subsistent).
2. `scripts/build-index.mjs`, `main()` : ne copier `cours.pdf` que si `!texPath` (déjà vrai après l'étape 1).
3. `scripts/build-og.mjs` (chapitres) : rien à changer en phase A.

Acceptation : `node scripts/build-index.mjs && npm test` verts ; `public/data/cours-index.json` inchangé.

### Phase B — contenu : un chapitre par PR (ARHeritiana, fusion autonome)

Pour chaque chapitre `n` (ordre conseillé : 02, 05, 01, 04, 03, 07, 06 — du plus court au plus long) :

1. **Inventaire** : lister les `exercise`/`problem`/`\paragraph{Exercice…}` de `chapitre.tex` et les associer aux
   dossiers `content/exercices/recueil-<n>-*` (tags `exercice n.k`/`problème n.k`, sinon ordre et texte).
   Critère : nombre d'énoncés de `chapitre.tex` = `ls -d content/exercices/recueil-<n>-* | wc -l`.
2. **Réconcilier les doublons** (les deux versions ont divergé) : pour chaque paire, comparer le texte ; garder la
   version la plus complète et fidèle (conditions comme « avec $n \ge 4$ », indications, figures) dans
   `enonce.tex`, sans inventer. Figures : déplacer le TikZ dans `enonce.tex` (§ 4) et signaler l'id pour
   `build-figures.mjs`.
3. **Écrire `cours.tex`** depuis `templates/cours-modele.tex` en appliquant la correspondance (§ 3). Le texte du
   cours (hors énoncés) est repris à l'identique ; seules les structures changent. Ajouter `\section{À retenir}`
   (bilan des notions déjà présentes) si absent.
4. **Solutions** : `\solutionde` pour chaque inclusion ; n'écrire un `solution.tex` (et `a_solution: true`) que pour
   une solution rédigée par COMIMa (question Q2).
5. **Métadonnées** : tags `exercice n.k` / `exercice guidé n.k` / `problème n.k` alignés sur le PDF ; `pages` =
   `pdfinfo public/pdfs/cours/<id>/cours.pdf`.
6. **Supprimer** `content/cours/<id>/chapitre.tex` et `cours.pdf`.
7. **Vérifier** (critères, tous obligatoires) :
   - `node scripts/build-latex.mjs` → `0 échec(s)` ; `grep -c Overfull .latex-build/cours__<id>__cours/main.log` → 0 ;
   - `grep -nE '\\(usepackage|newcommand|chapter|begin\{(exercise|problem|fact|thm|defi|highlightbox|solutionbox|multicols)\})' content/cours/<id>/cours.tex` → vide ;
   - `grep -cE '^\\(exochap|exercice|probleme)\{' content/cours/<id>/cours.tex` = nombre de dossiers `recueil-<n>-*` ;
   - `npm test` et `npm run app-packs` verts ; `node scripts/build-index.mjs` sans erreur ;
   - comparaison visuelle : `pdftoppm -r 60 -png` de l'ancien et du nouveau PDF, page à page (rien de perdu :
     figures, encadrés, listes) ;
   - une ligne FR + EN sous `## [Non publié]` de `app/CHANGELOG.md`.

Pièges par chapitre (constatés dans les sources) :

| Ch. | Pièges |
| --- | --- |
| 01 Récurrence | `\section*` partout ; « principe de récurrence » → `theoreme` + `methode` ; Fibonacci, coefficients binomiaux → `definition` ; deux groupes d'exercices → `\subsection*` dans « Exercices » ; commentaires `% Problème 15/16` (origine à vérifier) ; problème 1.7 (trominos) : `multicols`, `\subsection*` et figure TikZ **dans l'énoncé**, figure absente de `recueil-1-p7-pavage-trominos/enonce.tex`. |
| 02 Principe extrémal | 9 notes `[E9]`, `[12]`… (numéros d'Engel probables : ne pas les perdre, Q3) ; liste de « faits » → `proposition` + `definition` (majorant/minorant) + `remarque` (descente infinie) ; pas d'« À retenir ». |
| 03 Tiroirs | `highlightbox` → `theoreme[Principe des tiroirs]` ; « Forme générale » → `proposition`, « Méthode » → `methode` ; figure des tiroirs : `\def\depth` (masque la commande LaTeX `\depth`, à renommer) et `\definecolor` dans la figure ; **7 solutions masquées** dans `chapitre.tex` (Q2) ; 2 énoncés à `multicols` + TikZ (`p1` grille, un autre problème) dont les figures manquent aux `enonce.tex` ; 16 titres en option `[…]` ; 4 groupes (exercices simples / exercices / problèmes simples / problèmes) → `\subsection*` ; ids `p10`–`p12` triés avant `p2` par `ls` ; squelette commenté en tête à supprimer. |
| 04 Géométrie | « Notions utiles » = paragraphes `\textbf{Terme} :` → `definition`s ; « Orthocentre » contient une démonstration → `proposition` + `proof` ; 35 `\vect` (fourni) ; problèmes intitulés « Théorème … » (titres seulement) ; 3 problèmes sans titre → `titre_fr` du `meta.yaml` ; pas d'« À retenir ». |
| 05 Théorie des nombres | `thm`/`defi`/`fact` (9 faits, dont Bézout, Fermat, théorème fondamental → `theoreme[…]`) ; exercices intercalés après chaque notion → `\exochap` dans la section ; `\subsection*{Nombres premiers}` → `\section` ; `\item[$\bullet$]` dans les énoncés (garder ou `itemize`) ; `\pgcd`, `\ppcm` (fournis) ; notes `[8]`, `[17]`, `[97]`, `[118]`. |
| 06 Combinatoire | 1 408 lignes, 23 p. ; `\paragraph{Principe additif.}`… → `theoreme`/`definition` ; `\subsubsection` ; 3 « À retenir » de section → `retenir` + synthèse finale ; 8 exercices **intercalés** (`\paragraph{Exercice 1.}`, `\subsection{Exercice +}`, `\subsubsection{Un premier exercice simple}`…) → `\exercice{id}` à leur place ; figures dans deux énoncés (chemins, binômes) à déplacer ; 9 schémas `\fbox{minipage}` ; énoncés divergents (ex. « avec $n \ge 4$ » absent de `recueil-6-fete-communale`) ; pas de tag `exercice 6.k`. |
| 07 Invariants | 15 `\paragraph{Exercice k.}` en 4 paliers → `\exochap` + `\subsection*` ; 5 `\paragraph{Problème k}` → `\probleme` ; ids incohérents (`p2` mais `pc1`, `pc3`–`pc5`) : ne pas renommer, ordonner selon le texte ; tags `problème 1`… et aucun tag `exercice 7.k` → à aligner ; `\paragraph{Exemple.}` → `exemple` + `solution` ; « Méthode de recherche » → `methode` ; « Une précaution importante » → `remarque` ; schémas `\fbox`. |
| 00 et 08 (déjà au format) | ajouter `\label{sec:…}` sur la ligne de chaque `\section` (requis par le test de la phase C) ; 08 : numérotation changée par le gabarit, « Problème k » → « Problème 8.k », « Exercice guidé k » → « Exercice guidé 8.k » : mettre à jour les tags `problème k` et `exercice guidé k` ; étiquettes `ex:E…` → `exm:` (facultatif). |

### Phase C — scripts : retrait du format précompilé (PR technique, Antsa, après les 7 chapitres)

1. `scripts/content-lib.mjs`
   - `loadCours()` : exiger `cours.tex` ; lever une erreur si `cours.pdf` ou `chapitre.tex` existe ; retirer
     `pdfPath`, `chapitreTexPath` du retour.
   - nouvelle fonction exportée `parseCoursTex(src)` → `{ numero, titre, plan: [{ niveau, numero, titre, slug, dest }],
     exercices: [{ id, type: 'ex'|'exo'|'pb', numero, titre }] }` selon les motifs du § 6 ; `exercices` (ids) de
     `loadCours()` en est tiré, **dans l'ordre**, au lieu du test `src.includes(...)`.
2. `scripts/build-latex.mjs` : mettre à jour le commentaire d'en-tête ; purger aussi les PDF orphelins de
   `public/pdfs/cours/` (ajouter `walk(path.join(OUT_DIR, 'cours'))`, les sorties valides étant les cibles).
3. `scripts/build-index.mjs` : supprimer `buildCoursZip()` et la copie de `cours.pdf` ; toujours appeler
   `coursBundle()` ; ajouter `plan` et `exercices` (objets de `parseCoursTex`) à chaque entrée de
   `cours-index.json` ; retirer le champ `tex` ; contrôler `meta.numero === numero` de `\chapitre`.
4. `scripts/build-og.mjs` : chapitres : utiliser seulement `public/pdfs/cours/<id>/cours.pdf` (supprimer le repli
   `pdfPath`).
5. `scripts/build-app-packs.mjs` : rien d'obligatoire (n'utilise que `pdf`). Facultatif (B4) : valider un champ
   `section` des notions contre le `plan` du chapitre — nouveau champ de format, à décider avec Antsa (Q4).
6. `src/lib/data.ts` : `CoursEntry` sans `tex` ; ajouter `plan` et `exercices` typés.
7. `src/views/CoursChapterView.astro` : liste des exercices tirée de `c.exercices` (ordre et numéros du PDF), le
   filtre par tag `chapitre N` restant en repli ; afficher le plan (liens `withBase(c.pdf) + '#nameddest=' + dest`) ;
   retirer le bouton `c.tex`. `src/views/CoursView.astro` : retirer le bouton `c.tex`.
8. Supprimer `templates/cours/` (`main.tex`, `styles/exercise.sty`, `images/`).
9. Tests (`tests/content.test.mjs`) : chaque chapitre a `cours.tex` et ni `cours.pdf` ni `chapitre.tex` ; chaque id
   inclus existe dans `content/exercices/` ; chaque `\section` numérotée porte `\label{sec:…}` ; le tag de numéro
   d'un exercice inclus correspond au numéro calculé.
10. Documentation : `README.md` (« Ajouter un chapitre de cours » → renvoi à ce document), `docs/TODO.md`
    (tableau « État des chapitres »), commentaires de `content-lib.mjs`.

Acceptation : `ls content/cours/*/cours.pdf content/cours/*/chapitre.tex 2>/dev/null | wc -l` → 0 ;
`node scripts/build-latex.mjs` → 9 chapitres compilés, `0 échec(s)` ; `ls public/pdfs/cours/*/cours.pdf | wc -l` → 9 ;
`node -e "const c=require('./public/data/cours-index.json').cours; if(c.some(x=>!x.texZip||!x.plan.length||!x.exercices.length)) process.exit(1)"`
→ code 0 ; `npm test`, `npm run app-packs`, `npm run build` verts ; `.github/**` inchangé (la clé de cache
`templates/**/*.tex` couvre déjà le préambule).

## 9. Questions ouvertes

- **Q1. Rendu** : 01–07 prennent l'apparence de 00/08 (titres noirs, filets verts) et non celle de l'ancien recueil
  (titre vert souligné, en-têtes rouges, `tcolorbox`). Équivalent ou meilleur ? À valider sur un premier chapitre.
- **Q2. Solutions du ch. 3** (7, masquées dans le PDF actuel) : rédigées par COMIMa ou reprises d'Engel ?
  Dans le doute, ne pas les publier (elles restent dans l'historique Git).
- **Q3. Notes `[E9]`, `[12]`…** (ch. 2, 3, 4, 5) : références au livre d'Engel ? Si c'est confirmé, les inscrire dans
  `source.reference` ; sinon, je ne sais pas les interpréter.
- **Q4. Lien fiche → section** : ajouter `section: <slug>` aux notions demande un changement de format validé par
  `build-app-packs.mjs` ; l'application ignore-t-elle un champ inconnu ? Je ne sais pas (à vérifier par Antsa).
- **Q5. Pagination du recueil complet** (S2) : pages continues calculées par script, ou chaque chapitre à partir
  de 1 (et retrait de `\setcounter{page}` de 00 et 08) ?
