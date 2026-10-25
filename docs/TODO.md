# TODO COMIMa — contenus du site

Mis à jour à chaque envoi de fichiers/actualités. Cocher = en ligne sur www.comima.mg.

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

Format des chapitres : README, section « Ajouter un chapitre de cours ».

### État des chapitres

| Chapitre | Format | Pages (numérotation) | Exercices du site | Solutions |
| --- | --- | --- | --- | --- |
| 0 — Exemples et contre-exemples | `cours.tex` (compilé, paquet .tex) | 15 (p. 5–19) | 12 (`recueil-0-*`) | 12 / 12 |
| 1 — Récurrence | `cours.pdf` pré-composé + `chapitre.tex` | 4 (p. 8–11) | 16 | 0 |
| 2 — Principe extrémal | `cours.pdf` pré-composé + `chapitre.tex` | 2 (p. 12–13) | 10 | 0 |
| 3 — Principe des tiroirs | `cours.pdf` pré-composé + `chapitre.tex` | 4 (p. 14–17) | 30 | 0 |
| 4 — Géométrie | `cours.pdf` pré-composé + `chapitre.tex` | 3 (p. 18–20) | 17 | 0 |
| 5 — Théorie des nombres | `cours.pdf` pré-composé + `chapitre.tex` | 3 (p. 21–23) | 9 | 0 |
| 6 — Combinatoire | `cours.pdf` pré-composé + `chapitre.tex` | 21 (p. 24–44) | 8 | 0 |
| 7 — Invariants | `cours.pdf` pré-composé + `chapitre.tex` | 15 (p. 45–59) | 20 | 0 |
| 8 — Inégalités | `cours.tex` (compilé, paquet .tex) | 26 (p. 60–85) | 11 (`recueil-8-*`) | 11 / 11 |

Chapitres 1 à 7 : PDF pré-composé, avec leur source `chapitre.tex` téléchargeable
(gabarit `templates/cours/`). Chapitres 0 et 8 : compilés depuis `cours.tex`, exercices
inclus depuis `content/exercices/`.

### À faire

- [ ] **Recueil complet non à jour.** `public/recueil-techniques-resolution-problemes.pdf`
  (bouton « Télécharger le recueil complet » de la page Cours) contient encore
  l'ancien chapitre 0 (3 pages) et s'arrête au chapitre 7 : il ne contient ni le
  nouveau chapitre 0 ni le chapitre 8.
- [ ] **Numérotation des pages qui se chevauche.** Le nouveau chapitre 0 occupe les
  p. 5–19, alors que le chapitre 1 commence toujours p. 8. À régler lors de la
  reconstruction du recueil : renuméroter les chapitres 1 à 8 (les sources
  `chapitre.tex` des chapitres 1 à 7 le permettent désormais), ou abandonner la
  pagination continue (`\setcounter{page}` en tête de chaque `cours.tex`).
- [ ] **Deux gabarits LaTeX pour les chapitres.** Les chapitres 1 à 7 utilisent le
  gabarit du recueil (`templates/cours/`, `exercise.sty`) ; les chapitres 0 et 8,
  `templates/preamble-cours.tex` (format A5 imitant le recueil). À unifier avant de
  reconstruire le recueil complet.
- [ ] **Chapitre 8 sans simulation interactive** sur la page Cours (les chapitres 0 à 7
  en ont une : table `SIM` de `src/views/CoursView.astro`, code dans
  `src/scripts/simulations.ts`).
- [ ] **Chapitres 1 à 7 sans solutions** : leurs exercices ont `a_solution: false`.
- [ ] **Chapitres 1 à 7 non compilés par la CI** : leur PDF reste celui fourni ; une
  correction dans `chapitre.tex` ne change pas le PDF publié tant que le chapitre n'est
  pas recompilé (ou converti en `cours.tex`).
- [ ] **Ancienne source du chapitre 0** : `chapitre.tex` (version d'origine, 3 pages) a
  été retiré, remplacé par `cours.tex` ; il reste dans l'historique git.

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
- [x] Laboratoire de conjectures : 9 simulations (chapitres 0 à 8), remplace les anciennes mini-simulations de la page Cours
- [ ] Ajouter un laboratoire à chaque nouveau chapitre du cours (voir README)
