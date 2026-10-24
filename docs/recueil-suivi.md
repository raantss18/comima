# Recueil « Techniques de résolution de problèmes » — état et suivi

Ce fichier suit l'état des chapitres de cours (`content/cours/`) et le travail restant
sur le recueil. Le mettre à jour à chaque modification d'un chapitre.

Format des chapitres : voir README, section « Ajouter un chapitre de cours ».

## État des chapitres

| Chapitre | Format | Pages (numérotation) | Exercices du site | Solutions |
| --- | --- | --- | --- | --- |
| 0 — Exemples et contre-exemples | `cours.tex` (compilé, paquet .tex) | 15 (p. 5–19) | 12 (`recueil-0-*`) | 12 / 12 |
| 1 — Récurrence | `cours.pdf` pré-composé | 4 (p. 8–11) | 16 | 0 |
| 2 — Principe extrémal | `cours.pdf` pré-composé | 2 (p. 12–13) | 10 | 0 |
| 3 — Principe des tiroirs | `cours.pdf` pré-composé | 4 (p. 14–17) | 30 | 0 |
| 4 — Géométrie | `cours.pdf` pré-composé | 3 (p. 18–20) | 17 | 0 |
| 5 — Théorie des nombres | `cours.pdf` pré-composé | 3 (p. 21–23) | 9 | 0 |
| 6 — Combinatoire | `cours.pdf` pré-composé | 21 (p. 24–44) | 8 | 0 |
| 7 — Invariants | `cours.pdf` pré-composé | 15 (p. 45–59) | 20 | 0 |
| 8 — Inégalités | `cours.tex` (compilé, paquet .tex) | 26 (p. 60–85) | 11 (`recueil-8-*`) | 11 / 11 |

Les sources LaTeX des chapitres 1 à 7 ne sont pas dans le dépôt : ces chapitres n'ont
pas de paquet .tex téléchargeable.

## À faire

- [ ] **Recueil complet non à jour.** `public/recueil-techniques-resolution-problemes.pdf`
  (bouton « Télécharger le recueil complet » de la page Cours) contient encore
  l'ancien chapitre 0 (3 pages) et s'arrête au chapitre 7 : il ne contient ni le
  nouveau chapitre 0 ni le chapitre 8.
- [ ] **Numérotation des pages qui se chevauche.** Le nouveau chapitre 0 occupe les
  p. 5–19, alors que le chapitre 1 commence toujours p. 8. À régler lors de la
  reconstruction du recueil : renuméroter les chapitres 1 à 8 (les PDF pré-composés
  1 à 7 ne peuvent pas être renumérotés sans leurs sources), ou abandonner la
  pagination continue (`\setcounter{page}` en tête de chaque `cours.tex`).
- [ ] **Chapitre 8 sans simulation interactive** sur la page Cours (les chapitres 0 à 7
  en ont une : table `SIM` de `src/views/CoursView.astro`, code dans
  `src/scripts/simulations.ts`).
- [ ] **Chapitres 1 à 7 sans solutions** : leurs exercices ont `a_solution: false`.
- [ ] **Chapitres 1 à 7 sans sources LaTeX** : à convertir en `cours.tex` (modèle :
  chapitres 0 et 8) si l'on veut les corriger, les compléter ou les exporter.

## Notes de rédaction

### Chapitre 0 (refonte d'octobre 2026)

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

### Chapitre 8 — errata de la source (A. Engel, *Problem-Solving Strategies*, ch. 7)

- **E10, p. 167** : l'inégalité (1) s'écrit $u^3 - 4uv + 9w \geqslant 0$ (avec
  $u = a + b + c$, $v = ab + bc + ca$, $w = abc$), et non $u^3 - 4uv + 3w \geqslant 0$
  (pour $a = b = c = 1$, la version imprimée donne $-6 < 0$). E10 n'est pas repris
  dans le chapitre.
- **E21, p. 171, seconde preuve** : lire $a^2 + c^2 - 2\sqrt3 A - \tfrac12(2ac\cos\beta)$
  au lieu de $a^2 + b^2 - \dots$. La version corrigée figure en remarque dans la
  solution de l'exercice guidé 2 (`recueil-8-e2-weitzenbock`).
- **E7, p. 163, ligne (7)** : il manque un « $=$ » en début de troisième ligne.
