# PY1 — Python et algorithmes de base, niveau lycée

Chapitre 9, rédaction COMIMa du 28 octobre 2026. L’objectif est une initiation courte : aucune connaissance universitaire n’est requise. Les exercices proviennent de sources identifiées ; les textes français sont des adaptations pédagogiques et les textes anglais des traductions/adaptations signalées dans leurs métadonnées. Aucun corrigé de site ou de livre n’est repris. Aucun exercice n’a une origine fictive attribuée à un auteur.

## Cours

- **[P1] Python Software Foundation**, documentation Python 3.14, tutoriel § 3, *An Informal Introduction to Python* : https://docs.python.org/3.14/tutorial/introduction.html — calculatrice, exemple `width`/`height`, types numériques et listes. Le `print` explicite remplace l’affichage implicite de la console.
- **[P2] Python Software Foundation**, référence § 7, *Simple statements* : https://docs.python.org/3.14/reference/simple_stmts.html — affectations, évaluation du membre droit avant les affectations simultanées, `return`.
- **[P3] Python Software Foundation**, référence § 8, *Compound statements* : https://docs.python.org/3.14/reference/compound_stmts.html — conditions, test préalable de `while`, parcours `for`, définitions de fonctions. Le conseil de quatre espaces reprend aussi le tutoriel § 4, rubrique *Coding Style*.
- **[P4] Python Software Foundation**, tutoriel § 4, *More Control Flow Tools* : https://docs.python.org/3.14/tutorial/controlflow.html — `range`, conditions et fonction de Fibonacci. L’exemple conditionnel est réduit au signe du nombre ; messages traduits. `fibonacci_avant` renomme les paramètres de l’exemple `fib2` et omet sa docstring, sans changer l’algorithme.
- **[P5] Python Software Foundation**, *Built-in Functions* : https://docs.python.org/3.14/library/functions.html — `abs`, `input`, `int`, `len`, `print`.
- **[P6] Python Software Foundation**, tutoriel § 5, *Data Structures* : https://docs.python.org/3.14/tutorial/datastructures.html — `append` et manipulation des listes.
- **[A1] Erik Demaine, Jason Ku et Justin Solomon**, MIT OpenCourseWare, *6.006 Introduction to Algorithms*, printemps 2020, lecture 1, *Algorithms and Computation*, p. 1–2 : https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/lecture-1-algorithms-and-computation/ — entrées/sorties, correction et comptage des opérations. Seules ces idées élémentaires sont utilisées ; pas de modèle machine ni de complexité universitaire.
- **[A2] Collectif CP-Algorithms**, *Euclidean algorithm for computing the greatest common divisor* : https://cp-algorithms.com/algebra/euclid-algorithm.html — propriété du reste, algorithme d’Euclide. Écriture pédagogique Python ; prise en compte du signe avec `abs`, explicitée dans le cours.
- **[A3] Python Software Foundation**, *bisect — Array bisection algorithm* : https://docs.python.org/3.14/library/bisect.html — partition définie par `bisect_left`, distinction entre insertion et présence, coût logarithmique de recherche. `position` réécrit l’algorithme sans importer de module ; l’intervalle est semi-ouvert `[gauche, droite[`.
- **[A4] Collectif CP-Algorithms**, *Sieve of Eratosthenes*, sections *Implementation* et *Sieving till root* : https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html — marquage à partir de p², borne racine, indicateurs de primalité. Traduction pédagogique de l’algorithme en Python ; cas n < 2 traité avant l’indexation.
- **Niveau et progression** : ressources lycée Éduscol, rubrique *Algorithmique et programmation* : https://eduscol.education.gouv.fr/5817/programmes-et-ressources-en-mathematiques-voie-gt ; programmation, variables, conditions, boucles et fonctions. Cette référence situe le niveau de difficulté ; le cours ne prétend pas reproduire le programme officiel malgache.

Tous ces liens ont été consultés le 28 octobre 2026. Les affirmations mathématiques sont expliquées dans le chapitre ; les programmes sont vérifiés indépendamment par CPython et le moteur COMIMa (commande et résultats dans le rapport de validation).

## Exercices

Chaque dossier `recueil-9-*` contient la source exacte dans `meta.yaml`. Les cas limites et les interdictions qui font partie de l’exercice source sont conservés. Aucune date de publication inconnue n’est inventée : le 28 octobre 2026 est la date de consultation.

1. **CodEx, Fonctions simples, fonction 0**, https://codex.forge.apps.education.fr/exercices/fonctions/ — application affine 4x + 7 conservée ; consigne adaptée au format papier.
2. **Python, tutoriel § 3.1.1**, https://docs.python.org/3.14/tutorial/introduction.html#numbers — les trois expressions sont reprises des exemples officiels ; transformation en lecture de résultats, sans nouveaux nombres.
3. **Python, tutoriel § 4.3**, https://docs.python.org/3.14/tutorial/controlflow.html#the-range-function — les trois appels de `range` proviennent des exemples officiels ; consigne de lecture et de justification de la borne.
4. **CodEx, Occurrences d’un caractère dans un mot**, https://codex.forge.apps.education.fr/exercices/cpt_occurrences/ — caractère cible de longueur 1, chaîne parcourue, méthode `count` interdite.
5. **CodEx, Somme d’une liste d’entiers**, https://codex.forge.apps.education.fr/exercices/somme_entiers/ — liste éventuellement vide, sortie 0 dans ce cas, `sum` interdit.
6. **CodEx, Maximum**, https://codex.forge.apps.education.fr/exercices/maximum_nombres/ — liste non vide, int ou float, `max`, `sort`, `sorted` interdits.
7. **CodEx, Indice du minimum**, https://codex.forge.apps.education.fr/exercices/ind_min/ — liste non vide, première occurrence en cas d’égalité, `min` et `index` interdits.
8. **CodEx, Diviseurs d’un entier positif**, https://codex.forge.apps.education.fr/exercices/diviseurs/ — entier strictement positif, ordre croissant, remarque sur l’intervalle entre n/2 et n conservée.
9. **CodEx, Nombre premier**, https://codex.forge.apps.education.fr/exercices/nombre_premier/ — entier positif ou nul, sortie booléenne, borne racine et choix de boucle conservés.
10. **CodEx, Résolution approchée d’une équation par dichotomie**, https://codex.forge.apps.education.fr/exercices/dicho_maths/ — fonction cubique conservée ; hypothèses de positivité de la précision et de changement de signe explicitées pour rendre l’énoncé autonome. Sortie d’amplitude au plus la précision, y compris le cas d’une racine exacte. Prolongement lycée, à traiter après les exercices de base.

## Crédits et réutilisation

- CodEx est rédigé et entretenu par un collectif d’enseignants contributeurs, soutenu par l’AEIF. Les crédits annoncent CC BY-SA 4.0 sauf mention contraire : https://codex.forge.apps.education.fr/credits/ . Les adaptations COMIMa de ces activités conservent cette licence et leur attribution. Les corrigés du site n’ont pas été décodés ni repris.
- La documentation Python relève des conditions PSF ; ses exemples de code sont également disponibles sous licence 0BSD, retenue ici : https://docs.python.org/3.14/license.html . Les noms des exemples et la nature des adaptations sont indiqués ci-dessus.
- Les textes de cours sont une synthèse pédagogique avec références, pas une reproduction des leçons du MIT ou des articles CP-Algorithms. La licence du dépôt de code COMIMa n’est pas modifiée.
