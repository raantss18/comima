# TODO COMIMa — contenus du site

Mis à jour à chaque envoi de fichiers/actualités. Cocher = en ligne sur www.comima.mg.
Application Android : liste séparée, [`app/TODO.md`](app/TODO.md).
**Qui fait quoi (Antsa / ARHeritiana), choix et règles de coordination : [`REPARTITION.md`](REPARTITION.md).**

> ## 📌 Pour ARHeritiana (et tes sessions Claude) — à lire en premier
> **La conception de cours est ta part** (décision d'Antsa, 26 oct. 2026) : chapitres et recueil, fiches de
> notion et quiz, illustrations, simulations, jeu de constructions, choix et ordre des exercices, solutions,
> et **la compilation des PDF de tes lots** (`node scripts/build-latex.mjs` avant ta PR).
>
> 0. **Tu es autonome pour le contenu** : fusionne seul tes PR qui ne touchent que du contenu (contrôles verts) ;
>    le contenu arrive sur le site **et dans l'application sans nouvelle version**. Mode d'emploi, garde-fous
>    anti-redondance et limites : [`CONTENU.md`](CONTENU.md).
> **🧪 TESTS À RENDRE (26 oct.)** : tout le contenu, sa compilation **et ses tests** sont à toi. Fais la liste de
>    [`RAPPORT-TESTS.md`](RAPPORT-TESTS.md) (site en ligne + application), remplis-la et ouvre une PR « Rapport de tests » en
>    demandant la relecture de `raantss18` : c'est le signal « tests faits » pour Antsa.
>
> **⚡ PRIORITÉ ABSOLUE (26 oct.) : le chapitre « Python et algorithmes de base » (tâches PY1 à PY4 de `REPARTITION.md`, section P0 bis).**
>    L'application et le site exécutent désormais le code Python des élèves ; il faut le chapitre, puis les notions
>    d'entraînement `python-*` avec des questions `code`, puis les exercices d'algorithmique. **À faire avant le reste de Q1/E1.**
>
> 1. Lis [`REPARTITION.md`](REPARTITION.md) (sections 1 bis, 3 et 5) : la liste des tâches, avec ce que
>    chacun prend. **Inscris ton nom** dans la colonne « Pris par » avant de commencer.
> 2. **Première tâche conseillée : Q1**, les quiz des étapes d'Engel (suites, polynômes, équations
>    fonctionnelles, jeux, autres stratégies) — c'est la demande n° 1 du Bureau. Ensuite : B1 (conception des
>    marque-pages), E1 à E3 (nouveaux énoncés sourcés), G1 (jeu de constructions), G2 (simulations).
> 3. **Ne touche pas** à `app/pubspec.yaml`, `app/release.json(.sig)`, aux tags de version, ni à `release-keys/` :
>    c'est Antsa qui publie. Une ligne par changement sous `## [Non publié]` du `app/CHANGELOG.md`.
> 4. Une branche et une PR par tâche ; **ne fusionne que si tous les contrôles sont verts** ; regroupe tes
>    fusions (chaque fusion sur `main` relance le déploiement).
> 5. Énoncés **à l'identique**, source complète, traduction signalée, **rien d'inventé**, aucune solution du
>    livre recopiée. Léger et confortable avant tout.
> 6. Tu as une question ou un désaccord ? Réponds dans l'issue n° 67 ou modifie `REPARTITION.md` par PR.


## Accueil — refonte (demande du 25 oct. 2026), mobile et ordinateur

Objectif : promouvoir l'application, page **légère** et agréable. Ordre des sections :

- [x] 1. Diapos (événement en cours, application avec QR code et téléchargement…)
- [x] 2. Défilement d'images (photos des regroupements)
- [x] 3. **Missions de COMIMa** (textes repris de la page À propos)
- [x] 4. Second défilement d'images (autres photos, sens inverse)
- [x] 5. Partenaires (la bande de logos du pied de page est masquée sur l'accueil pour ne pas doublonner)
- [x] 6. Raccourcis (application, entraînement, exercices, cours, sujets, simulations, générateur),
  encart application + QR code, progression de l'année, simulation à essayer
- [x] 7. Actualités
- [x] 8. Copyright du site (pied de page)
- [x] **Nombres de ressources retirés de l'accueil** ; affichés sur la page Exercices (total, avec
  solution, dans la progression, par étape)
- [ ] Afficher aussi les nombres sur les pages Cours, Sujets et Entraînement
- [x] Lien de téléchargement : **la dernière release GitHub** (`releases/latest/download/…`)
- [x] **Aucune version de l'application sur le site** (diapo, encart, page Application) : nouveautés sur GitHub
- [x] Mobile : missions en 2 colonnes, partenaires en défilement horizontal, QR masqué (bouton suffit)

## Exercices et progression de l'année (demande du 25 oct. 2026)

Détail et cases à cocher : [`app/TODO.md`](app/TODO.md), « Version 0.4 ». Progression Engel
(exemples/contre-exemples, inégalités, suites, polynômes, équations fonctionnelles, jeux, autres
stratégies) privilégiée sur le site et dans l'application ; bibliothèque par niveaux (lycée 1→3,
universitaire à la fin) ; milliers d'exercices sourcés ou calculés, rien d'inventé ; géométrie type
Euclidea.

## Marque-pages des élèves (idée du 26 oct. 2026)
Lu / fait / testé / à continuer plus tard sur chaque exercice, problème, sujet et cours, synchronisé avec le
compte et visible des encadreurs — détail, schéma et précautions : [`app/TODO.md`](app/TODO.md), section
« Marque-pages » (tâches B1 à B5, prévues pour la **0.6.0**).

## Événement en cours (accueil)
La diapo 1 de l'accueil affiche l'actualité marquée `enCours: true` (la plus récente),
sinon la dernière actualité. Pour changer d'événement : mettre `enCours: true` (+ `photos: [...]`)
dans le nouvel article FR et EN, et retirer le drapeau de l'ancien.

- [x] Regroupements 2026-2027 : Antsiranana (9 oct. 2026) — lancement
- [x] Ambatondrazaka (17 oct. 2026) : séance d'information des enseignants
- [x] Fianarantsoa (24 oct. 2026) : premier regroupement
- [x] Ambatondrazaka (24 oct. 2026) : premier regroupement — `enCours: true`

## Articles à mettre en ligne
- [ ] Lancement des regroupements à Antananarivo (en attente d'infos + photos)
- [ ] Lancement des regroupements à Ambositra (en attente d'infos + photos)

## Articles à reprendre / remplacer
- [ ] `camp-olympiade-juillet-2026` : annonce du camp, passée — ajouter un lien vers la clôture si utile
- [ ] Antsiranana (9 oct.) : ajouter nom de l'encadrant / du lycée et le rythme des séances si fournis

## Ressources (exercices, sujets, cours)
- [x] **Énoncés IMO : à confronter aux textes officiels** — 30 exercices (1997–1999, 2020, 2025) et deux sujets vérifiés ; corrections et sources : [`VERIFICATION-IMO.md`](VERIFICATION-IMO.md).
- [ ] Aucune en attente

## Divers
- [ ] Encadrants à lister sur la page Contact : Ambatondrazaka, Fianarantsoa, Antananarivo (noms + rôle)
- [ ] Liste des centres : `src/lib/centres.ts` (ajouter une ligne à l'ouverture d'un centre)
- [x] Logos Fianarako et Campus France (accueil)
- [ ] Remplacer l'e-mail de contact placeholder dans `src/views/ContactView.astro`

## Fait : partage, sources LaTeX, sécurité (oct. 2026)
- [x] Boutons de partage (articles, ressources, cours, sujets, site)
- [x] `.tex` + `sources.zip` compilable pour chaque chapitre de cours
- [x] Astro 7, dépendances à jour (0 vulnérabilité), CSP, Dependabot
- [x] Bande de logos partenaires (Animath, Fianarako, Campus France, AEMIA) sous chaque page ; source unique `src/lib/partners.ts`
- [x] Partenaires Mahkinga (Antsiranana) et iMatematiko (Fianarantsoa) : logos, À propos, articles
- [x] Page Partenaires + section « Notre réseau » (accueil), logos régénérés plus nets et plus grands
- [ ] Logos d'origine plus nets (AEMIA, iMatematiko) si disponibles

## Recueil « Techniques de résolution de problèmes »

Format des chapitres : [`docs/STRUCTURE-COURS.md`](STRUCTURE-COURS.md) (norme), README, section « Ajouter un chapitre de cours ».

### État des chapitres

Les 9 chapitres sont au format `cours.tex` (compilé par `build-latex.mjs`, paquet .tex
exporté) ; plus aucun `cours.pdf` précompilé ni `chapitre.tex`. Pagination continue :
`page_debut` de `meta.yaml` (vérifiée par `node scripts/pagination.mjs` et `npm test`).

| Chapitre | Format | Pages | `page_debut` | Exercices du site | Solutions |
| --- | --- | --- | --- | --- | --- |
| 0 — Exemples et contre-exemples | `cours.tex` | 15 | 5 | 12 (`recueil-0-*`) | 12 / 12 |
| 1 — Récurrence | `cours.tex` | 8 | 20 | 16 | 0 |
| 2 — Principe extrémal | `cours.tex` | 4 | 28 | 10 | 0 |
| 3 — Principe des tiroirs | `cours.tex` | 8 | 32 | 30 | 0 |
| 4 — Géométrie | `cours.tex` | 8 | 40 | 17 | 0 |
| 5 — Théorie des nombres | `cours.tex` | 6 | 48 | 9 | 0 |
| 6 — Combinatoire | `cours.tex` | 27 | 54 | 8 | 0 |
| 7 — Invariants | `cours.tex` | 22 | 81 | 20 | 0 |
| 8 — Inégalités | `cours.tex` | 27 | 103 | 11 (`recueil-8-*`) | 11 / 11 |

### À faire

- [ ] **Recueil complet non à jour.** `public/recueil-techniques-resolution-problemes.pdf`
  (bouton « Télécharger le recueil complet » de la page Cours) contient encore
  l'ancien chapitre 0 (3 pages) et s'arrête au chapitre 7 : il ne contient ni le
  nouveau chapitre 0 ni le chapitre 8. Les 9 PDF de chapitres, paginés en continu
  (p. 5 à 129), peuvent être assemblés pour le reconstruire.
- [x] **Numérotation des pages qui se chevauche** : pagination continue par `page_debut`
  (`meta.yaml`), injectée à la compilation ; contrôle par `scripts/pagination.mjs`.
- [x] **Deux gabarits LaTeX pour les chapitres** : unifiés sur `templates/preamble-cours.tex`
  ; `templates/cours/` (gabarit du recueil, `exercise.sty`) supprimé.
- [ ] **Chapitres 1 à 7 sans solutions** : leurs exercices ont `a_solution: false`.
- [x] **Chapitres 1 à 7 non compilés par la CI** : tous les chapitres sont compilés depuis
  `cours.tex`.
- [x] **Ancienne source du chapitre 0** : `chapitre.tex` retiré, remplacé par `cours.tex` ;
  il reste dans l'historique git.
- [ ] **Figures d'énoncés du recueil** : `build-figures.mjs` contient maintenant les 5 énoncés
  `recueil-*` avec TikZ (p7 trominos, 3-p1, 3-p9, 6-binomes, 6-chemins) ; les SVG n'ont pas
  pu être générés (dvisvgm absent du poste), à vérifier en CI.

### Notes de rédaction

#### Chapitre 0 (refonte d'octobre 2026)

- La progression d'origine est conservée volontairement, y compris le polynôme
  « affaibli » $n^2 - n + 5$ de l'exercice 0.5 (premier contre-exemple dès $n = 5$),
  suivi de $n^2 - n + 11$, puis du polynôme d'Euler $n^2 + n + 41$ (ajouté, en lien avec
  la simulation de la page Cours), des nombres de Fermat et de Mersenne.
- Exercices 0.1 et 0.4 : énoncés restreints à $n \geqslant 1$ ($n = 0$ était un
  contre-exemple trivial aux trois inégalités de 0.1, car $0! = 1 = a^0$ ; signalé en
  remarque dans la solution).
- Exercice 0.10 (e) : l'ancien énoncé (« tout quadrilatère convexe peut se paver avec
  des triangles identiques ») a été remplacé par « un quadrilatère dont les quatre
  côtés ont la même longueur est un carré » : l'ancien n'est pas tranchable au niveau
  lycée.
- Exercice 0.11 : consignes réécrites à l'adresse de l'élève.
- Exercice 0.12 : l'ancien énoncé ne posait aucune question ; cinq questions ajoutées.

#### Chapitre 8 — errata de la source (A. Engel, *Problem-Solving Strategies*, ch. 7)

- **E10, p. 167** : l'inégalité (1) s'écrit $u^3 - 4uv + 9w \geqslant 0$ (avec
  $u = a + b + c$, $v = ab + bc + ca$, $w = abc$), et non $u^3 - 4uv + 3w \geqslant 0$
  (pour $a = b = c = 1$, la version imprimée donne $-6 < 0$). E10 n'est pas repris
  dans le chapitre.
- **E21, p. 171, seconde preuve** : lire $a^2 + c^2 - 2\sqrt3 A - \tfrac12(2ac\cos\beta)$
  au lieu de $a^2 + b^2 - \dots$. La version corrigée figure en remarque dans la
  solution de l'exercice guidé 2 (`recueil-8-e2-weitzenbock`).
- **E7, p. 163, ligne (7)** : il manque un « $=$ » en début de troisième ligne.

#### Énoncés d'Engel repris à l'identique malgré une coquille de l'ouvrage

(Signalées ici, non corrigées dans l'énoncé, pour rester fidèle à la source.)

- **7.13** : le membre de droite imprimé est $\sum 1/n$ ; il faut lire $\sum_{k=1}^n 1/k$ (IMO 1978).
- **7.65** : la dernière condition imprimée est « $a + 4b + 6c + 4d + 4 \geq 0$ » ; il faut lire $+\,e$.
- **7.70** : l'inégalité triangulaire est imprimée $d(x, y) + d(y, z) \leq d(x, z)$ ; il faut lire $\geq$.
- **9.15 (b)** : parenthèse fermante en trop dans l'original (supprimée).
- **14.24 (b)** : « $y_n = x_n + y_n$ » ; il faut lire $y_{n+1} = x_n + y_n$.
- **14.60** : « $x + n - 1/n$ » ; il faut lire $x + (n-1)/n$ (l'énoncé imprimé est faux).
- **14.7** : « joining these segments » ; il faut lire « these points ».
- **12.4.99** : « $AB \parallel DB$ » ; il faut lire $AB \parallel DE$ (IMO 1996).
- **12.4.11** : « circle with radius $O$ » ; il faut lire « center $O$ ».
- **Fautes d'orthographe de l'anglais** (inchangées) : 2.17 (`$red$`, `$blue$` en mode math),
  3.7 et 4.22 (« more then »), 3.13 (« tounament »), 4.63 (« equdistant »), 12.1.41 (« of the of the », « then »),
  12.2.21 (« bycicle »), 12.4.44, 12.4.80, 12.4.95, 12.4.100, 14.4 (« acqainted »).
- **Probables coquilles, relevées à la relecture (à confirmer avec l'ouvrage)** :
  6.129 (« $c^2$ » probablement $b^2$, IMO 1988), 8.6 (« gcd$(ab)^2$ » probablement $\gcd(a,b)^2$),
  8.17 (dernier terme « $1/(2n+1) - 1/(2n)$ » ; l'égalité n'est vraie qu'avec $1/(2n-1)$),
  8.37 (« 10117 » n'est pas divisible par 53 ; probablement 100117), 6.100 (indication : $x^2+2y^2$ au lieu de $x^2+dy^2$).
  La traduction française COMIMa applique la lecture corrigée pour 7.13, 7.65, 7.70, 14.24, 14.60, 14.7, 12.4.99,
  12.4.11, 8.17 et 8.37 ; l'anglais reste celui du livre.
- **Énoncés douteux signalés** (rien changé, à vérifier avec l'ouvrage) : 9.11 et 9.26 (la condition $n \geq 2$ ou
  $n \geq 0$ fait intervenir $a_0$ ou $a_3$ mal défini), 9.19 (récurrence absente), 9.48 (il manque $|a_1| = |a_0 + 1|$),
  4.32 (« positive integer » rend l'énoncé faux), 4.56 ($\sin n < 10^{-10}$ est trivial), 6.17 (faux pour $p = 2, 3$),
  12.4.14 (« s'il existe » ou « pour toute » isométrie).

#### Problèmes de Dujella (2026) : valeurs corrigées dans la traduction

- **c1-05** : dans la famille de Sadowski, « $x=1$ » est faux ; le calcul impose $x=t$.
- **c1-15** : le quadruplet « presque fort » porte $\frac{2223}{3046}$ ; la valeur qui convient est $\frac{2223}{30464}$.

## Simulations

- [x] 18 simulations interactives (une page chacune, ≥ 2 par chapitre et par thème), section d'accueil aléatoire, entrée de menu « Simulations »
- [ ] Ajouter au moins 2 simulations à chaque nouveau chapitre du cours (voir README, `src/lib/sims.ts`)
