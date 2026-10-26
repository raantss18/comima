# Vérification des énoncés IMO existants

Comparaison du 26 octobre 2026, sur le contenu de `main` à l'ouverture de la tâche
« Énoncés IMO : à confronter aux textes officiels ».

## Périmètre et méthode

Les 30 dossiers `content/exercices/imo-*` (six problèmes pour chacune des années
1997, 1998, 1999, 2020 et 2025), ainsi que les deux sujets complets de 2020 et
2025, ont été comparés aux PDF du site officiel : hypothèses, domaines,
quantificateurs, formules, question posée et remarques. Les changements de
variables sans effet mathématique sont indiqués ci-dessous. Les titres courts
sont des titres éditoriaux COMIMa.

Pour 1997–1999, la source consultée est anglaise : les textes français sont des
**traductions COMIMa**, signalées dans la référence affichée et dans le LaTeX.
Pour 2020 et 2025, la source est la version officielle française. La mise en
page est adaptée aux gabarits du dépôt. Cette vérification des énoncés ne vaut
pas validation des solutions et ne concerne pas les exercices `engel-*` ou
`recueil-*` qui mentionnent eux aussi les IMO. L'import de nouvelles années
(tâche E2) reste distinct.

## Sources primaires

Les liens pointent vers les PDF effectivement téléchargés, et non vers la page
générale des problèmes. Les anciennes adresses `problems/IMO…FRN.pdf` ne sont
plus celles utilisées par le site officiel lors de cette vérification.

| Année | PDF officiel | Page 1 | Page 2 |
| --- | --- | --- | --- |
| 1997 | [Anglais](https://www.imo-official.org/assets/documents/problems/1997/1997_eng.pdf) | P1–P3, 24 juillet | P4–P6, 25 juillet |
| 1998 | [Anglais](https://www.imo-official.org/assets/documents/problems/1998/1998_eng.pdf) | P1–P3, 15 juillet | P4–P6, 16 juillet |
| 1999 | [Anglais](https://www.imo-official.org/assets/documents/problems/1999/1999_eng.pdf) | P1–P3, 16 juillet | P4–P6, 17 juillet |
| 2020 | [Français](https://www.imo-official.org/assets/documents/problems/2020/2020_fre.pdf) | P1–P3, 21 septembre | P4–P6, 22 septembre |
| 2025 | [Français](https://www.imo-official.org/assets/documents/problems/2025/2025_fre.pdf) | P1–P3, 15 juillet | P4–P6, 16 juillet |

Empreintes SHA-256 des cinq PDF consultés (PDF de travail non ajoutés au dépôt) :

```text
1997_eng.pdf  e6451cceb43a784ccba2ec688d12b88916a48f434eb9eb6a80b7c7fb85ab72fe
1998_eng.pdf  5b65566d3e6874c634db5356eb6a8652ef58e7c283f3c0fad6d6c4d5b31b4db3
1999_eng.pdf  f4356fa053c2091c18b114c1fbbf8a76d8a5ba69bd54a65dc5b06e1c6f592a90
2020_fre.pdf  f47740342b68d82535734d8e3bf39a30ce766dfcd9ccf8fe0ae17c15ef8d00bb
2025_fre.pdf  1d5e55a79bc20dc78f8f93e5f90cdd12143b0da5e80fb7a80515c8787f3f8716
```

## Résultat par problème

« Conforme » signifie qu'aucun écart mathématique n'a été relevé dans cette
comparaison ; pour les traductions, cela ne signifie pas identité littérale
avec le texte anglais.

| Dossier | Résultat et intervention |
| --- | --- |
| `imo-1997-p1` | Conforme : trois questions sur les aires noires et blanches. |
| `imo-1997-p2` | Formulation rapprochée de l'original : « l'angle en A est le plus petit angle » remplace l'inégalité strictement imposée dans la traduction. Construction et égalité finale conformes. |
| `imo-1997-p3` | Conforme : valeur absolue de la somme, bornes et permutation. |
| `imo-1997-p4` | Conforme : matrice argentée, cas 1997 et infinité de valeurs de n. |
| `imo-1997-p5` | Conforme : exposant b² dans a^(b²) = b^a. |
| `imo-1997-p6` | Conforme : partitions binaires, exemple f(4) et deux bornes strictes pour n ≥ 3. |
| `imo-1998-p1` | Hypothèse explicite restaurée : côtés opposés AB et CD non parallèles ; diagonales AC et BD nommées. Le texte avait seulement imposé l'unicité de l'intersection des médiatrices. |
| `imo-1998-p2` | Conforme : b impair ≥ 3, coïncidences des notes et borne k/a. |
| `imo-1998-p3` | Conforme ; notations τ et m à la place de d et k. |
| `imo-1998-p4` | Conforme ; variables x, y à la place de a, b. |
| `imo-1998-p5` | Conforme : incercle, parallélisme et angle RIS aigu. |
| `imo-1998-p6` | **Question corrigée** : déterminer la plus petite valeur possible de f(1998), au lieu de déterminer toutes les fonctions. Équation et domaine conservés ; variables s, t de l'original rétablies. Titres FR/EN adaptés à la question. |
| `imo-1999-p1` | **Énoncé remplacé** : déterminer les ensembles finis d'au moins trois points du **plan**, avec axes de symétrie donnés par les médiatrices. Le texte précédent était une classification dans l'espace, avec tétraèdre et octaèdre, et donnait déjà la conclusion à prouver. Titres FR/EN adaptés. |
| `imo-1999-p2` | Quantificateur et structure rétablis : n ≥ 2 **fixé**, puis (a) meilleure constante C et (b) cas d'égalité pour cette constante. Le texte demandait une constante commune à tous les n. |
| `imo-1999-p3` | Conforme : n pair fixé, voisinage par un côté et couverture des cases marquées ou non. |
| `imo-1999-p4` | Conforme ; variable x à la place de n, condition x ≤ 2p et divisibilité conservées. |
| `imo-1999-p5` | Conforme ; cercles Ω à la place de G. |
| `imo-1999-p6` | Conforme : domaine réel et tous les termes de l'équation fonctionnelle. |
| `imo-2020-p1` | Conforme : deux triplets de rapports d'angles et trois droites concourantes. |
| `imo-2020-p2` | Conforme : ordre large a ≥ b ≥ c ≥ d > 0 et inégalité finale stricte. Les signes ont été contrôlés dans le PDF, l'extraction web pouvant perdre leur barre. |
| `imo-2020-p3` | Conforme : 4n cailloux, n couleurs, poids et deux conditions sur les tas. |
| `imo-2020-p4` | Conforme : n² stations, ordre des départs/arrivées et connexion par chaque compagnie. |
| `imo-2020-p5` | Conforme : n > 1 cartes, moyennes et question sur n. |
| `imo-2020-p6` | Conforme mathématiquement ; formulation française officielle « de sorte que … vaut au moins » rétablie. Définition de « sépare » et remarque sur les points conservées. Correction reportée dans le sujet complet. |
| `imo-2025-p1` | Conforme : trois directions exclues, a + b ≤ n + 1 et exactement k droites ensoleillées. |
| `imo-2025-p2` | Conforme : rayons, ordre C, M, N, D, points E/F, orthocentre et tangence. |
| `imo-2025-p3` | Conforme : fonction balaise, exposants a et f(a), plus petit réel c. |
| `imo-2025-p4` | Conforme : diviseurs stricts, suite infinie et somme des trois plus grands. |
| `imo-2025-p5` | Conforme : alternance des joueurs, deux contraintes, impossibilité de jouer et partie infinie. |
| `imo-2025-p6` | Conforme : rectangles alignés sur le quadrillage, sans chevauchement, exactement une case découverte par ligne et colonne. |

Les deux sujets complets ont également été comparés aux six exercices de leur
année : les corps sont identiques, hors titres et indications de jour/durée.
Les dates, la durée de 4 h 30 par jour et les 7 points par problème correspondent
aux PDF officiels.

## Attribution

Les 32 métadonnées renvoient désormais au PDF de l'année et de la langue
consultées. Pour 1997–1999, la mention de solutions d'Evan Chen a été retirée de
la licence : aucun de ces dossiers ne contient de solution et ces notes ne
constituent pas la source officielle de l'énoncé. Les traductions françaises
restent explicitement identifiées, sans changer le format des contenus.

## Validation technique

- `npm test` : 24 tests réussis. La comparaison de pagination des chapitres de
  cours est signalée comme ignorée par le test existant, leurs PDF étant absents
  de cet environnement ; elle est extérieure à ce lot IMO.
- Génération de l'index et des paquets de l'application réussie. Le moteur WASM
  de correction n'est pas construit dans cette session de contenu.
- 32 PDF IMO compilés avec `latexmk`, zéro échec, en utilisant une copie temporaire
  de `scripts/build-latex.mjs` dont seule la liste des cibles est filtrée sur
  `exercices/imo-*` et `sujets/imo-*`. Le script versionné n'est pas modifié.
  Le paquet `babel-french` absent de l'environnement a été extrait dans `/tmp`
  et ajouté à `TEXINPUTS` pour cette validation ; les motifs de césure français
  ne sont pas préchargés dans le format TeX local.
- Identité des 12 corps d'exercices de 2020/2025 avec les deux sujets complets
  contrôlée automatiquement ; aperçu du PDF corrigé de 1999 P1 inspecté.
- `git diff --check` sans erreur. Aucun PDF généré ni document de travail ajouté
  au dépôt.
