/**
 * Catalogue des simulations interactives (une page chacune : /simulations/<slug>/).
 * Chaque simulation est liée à un chapitre du cours, à un ou plusieurs thèmes des
 * exercices (arithmétique, combinatoire, géométrie, algèbre, analyse, informatique)
 * et à un niveau conseillé. Le code de la simulation est dans src/scripts/lab/<slug>.ts.
 */
export type Level = 'collège' | 'lycée' | 'prépa';

export interface SimMeta {
  slug: string;
  /** Identifiant du chapitre du cours. */
  chapter: string;
  themes: string[];
  level: Level;
  /** Difficulté de la conjecture à trouver : 1 (facile) à 3 (difficile). */
  difficulty: 1 | 2 | 3;
  /** Durée conseillée, en minutes. */
  minutes: number;
  icon: string;
  title: { fr: string; en: string };
  summary: { fr: string; en: string };
}

export const sims: SimMeta[] = [
  {
    slug: 'regions-du-cercle',
    chapter: '00-exemples-contre-exemples',
    themes: ['combinatoire', 'géométrie'],
    level: 'lycée',
    difficulty: 2,
    minutes: 10,
    icon: '⭕',
    title: { fr: 'Les régions du cercle', en: 'Regions of the circle' },
    summary: {
      fr: 'On relie n points d’un cercle par toutes les cordes : 1, 2, 4, 8, 16… et puis ? Une conjecture tentante, un contre-exemple.',
      en: 'Join n points on a circle with every chord: 1, 2, 4, 8, 16… and then? A tempting conjecture, a counterexample.',
    },
  },
  {
    slug: 'polynome-d-euler',
    chapter: '00-exemples-contre-exemples',
    themes: ['arithmétique'],
    level: 'collège',
    difficulty: 1,
    minutes: 8,
    icon: '🔢',
    title: { fr: 'Un polynôme qui ne donne que des premiers ?', en: 'A polynomial giving only primes?' },
    summary: {
      fr: 'n² + n + 41 est premier pour n = 0, 1, 2… jusqu’où ? Teste tes propres polynômes et les nombres de Fermat.',
      en: 'n² + n + 41 is prime for n = 0, 1, 2… how far? Test your own polynomials and Fermat numbers.',
    },
  },
  {
    slug: 'pavages-en-l',
    chapter: '01-recurrence',
    themes: ['combinatoire', 'informatique'],
    level: 'lycée',
    difficulty: 3,
    minutes: 15,
    icon: '🧩',
    title: { fr: 'Pavages en L', en: 'L-tromino tilings' },
    summary: {
      fr: 'Un carré privé d’une case se pave-t-il avec des « L » ? Récurrence pour 2ⁿ, carte des cases possibles pour les autres tailles.',
      en: 'Can a square minus one cell be tiled with L-pieces? Induction for 2ⁿ, map of feasible cells for other sizes.',
    },
  },
  {
    slug: 'suites-recurrentes',
    chapter: '01-recurrence',
    themes: ['algèbre', 'analyse'],
    level: 'lycée',
    difficulty: 2,
    minutes: 12,
    icon: '🌀',
    title: { fr: 'Suites récurrentes et identités', en: 'Recurrent sequences and identities' },
    summary: {
      fr: 'Fibonacci et ses cousins : change les coefficients et les premiers termes, observe sommes, déterminants et rapports.',
      en: 'Fibonacci and its cousins: change coefficients and first terms, watch sums, determinants and ratios.',
    },
  },
  {
    slug: 'droites-ordinaires',
    chapter: '02-principe-extremal',
    themes: ['géométrie', 'combinatoire'],
    level: 'prépa',
    difficulty: 3,
    minutes: 15,
    icon: '📐',
    title: { fr: 'Des droites ordinaires', en: 'Ordinary lines' },
    summary: {
      fr: 'n points non alignés : existe-t-il toujours une droite qui en contient exactement deux ? (Sylvester–Gallai)',
      en: 'n points, not all collinear: is there always a line through exactly two of them? (Sylvester–Gallai)',
    },
  },
  {
    slug: 'principe-du-maximum',
    chapter: '02-principe-extremal',
    themes: ['analyse', 'informatique'],
    level: 'lycée',
    difficulty: 2,
    minutes: 10,
    icon: '🌡️',
    title: { fr: 'Où est le maximum ?', en: 'Where is the maximum?' },
    summary: {
      fr: 'Une plaque dont chaque case est la moyenne de ses voisines : où se cachent la plus grande et la plus petite valeur ?',
      en: 'A plate where every cell is the average of its neighbours: where do the largest and smallest values hide?',
    },
  },
  {
    slug: 'points-dans-un-carre',
    chapter: '03-principe-des-tiroirs',
    themes: ['géométrie'],
    level: 'lycée',
    difficulty: 3,
    minutes: 15,
    icon: '🟦',
    title: { fr: 'Des points dans un carré', en: 'Points in a square' },
    summary: {
      fr: 'Écarter au maximum n points dans un carré unité, et comparer avec la borne des tiroirs.',
      en: 'Spread n points as far apart as possible in a unit square, and compare with the pigeonhole bound.',
    },
  },
  {
    slug: 'anniversaires',
    chapter: '03-principe-des-tiroirs',
    themes: ['combinatoire', 'informatique'],
    level: 'collège',
    difficulty: 2,
    minutes: 10,
    icon: '🎂',
    title: { fr: 'Le paradoxe des anniversaires', en: 'The birthday paradox' },
    summary: {
      fr: 'Combien de personnes faut-il pour que deux aient le même anniversaire ? Tirages au sort, probabilité exacte et seuil en √d.',
      en: 'How many people are needed for two to share a birthday? Random draws, exact probability and the √d threshold.',
    },
  },
  {
    slug: 'polygone-des-milieux',
    chapter: '04-geometrie',
    themes: ['géométrie'],
    level: 'collège',
    difficulty: 2,
    minutes: 10,
    icon: '🔷',
    title: { fr: 'Le polygone des milieux', en: 'The midpoint polygon' },
    summary: {
      fr: 'Relie les milieux des côtés d’un polygone : parallélogramme, aire moitié, même centre de gravité (Varignon).',
      en: 'Join the midpoints of a polygon’s sides: parallelogram, half the area, same centroid (Varignon).',
    },
  },
  {
    slug: 'droite-d-euler',
    chapter: '04-geometrie',
    themes: ['géométrie'],
    level: 'lycée',
    difficulty: 2,
    minutes: 10,
    icon: '△',
    title: { fr: 'La droite d’Euler', en: 'The Euler line' },
    summary: {
      fr: 'Centre de gravité, centre du cercle circonscrit, orthocentre : trois points toujours alignés, avec un rapport constant.',
      en: 'Centroid, circumcentre, orthocentre: three points that are always collinear, with a constant ratio.',
    },
  },
  {
    slug: 'cycle-des-puissances',
    chapter: '05-theorie-des-nombres',
    themes: ['arithmétique'],
    level: 'lycée',
    difficulty: 3,
    minutes: 15,
    icon: '🔁',
    title: { fr: 'Le cycle des puissances', en: 'The cycle of powers' },
    summary: {
      fr: 'a, a², a³… modulo m : un cycle dont la longueur divise φ(m). Quand atteint-on le maximum ?',
      en: 'a, a², a³… modulo m: a cycle whose length divides φ(m). When is the maximum reached?',
    },
  },
  {
    slug: 'pieces-de-monnaie',
    chapter: '05-theorie-des-nombres',
    themes: ['arithmétique', 'informatique'],
    level: 'collège',
    difficulty: 2,
    minutes: 10,
    icon: '🪙',
    title: { fr: 'Payer avec deux pièces', en: 'Paying with two coins' },
    summary: {
      fr: 'Avec des pièces de a et b, quelles sommes peut-on payer ? Quelle est la plus grande somme impossible ? (Frobenius)',
      en: 'With coins of values a and b, which amounts can be paid? What is the largest impossible amount? (Frobenius)',
    },
  },
  {
    slug: 'chemins-de-catalan',
    chapter: '06-combinatoire',
    themes: ['combinatoire', 'informatique'],
    level: 'lycée',
    difficulty: 2,
    minutes: 12,
    icon: '🛤️',
    title: { fr: 'Chemins sous la diagonale', en: 'Paths below the diagonal' },
    summary: {
      fr: 'Compter les chemins d’une grille qui ne dépassent pas une droite : nombres de Catalan et principe de réflexion.',
      en: 'Count grid paths that never cross a line: Catalan numbers and the reflection principle.',
    },
  },
  {
    slug: 'triangle-de-pascal',
    chapter: '06-combinatoire',
    themes: ['combinatoire', 'arithmétique', 'informatique'],
    level: 'collège',
    difficulty: 1,
    minutes: 8,
    icon: '🔺',
    title: { fr: 'Le triangle de Pascal et ses motifs', en: 'Pascal’s triangle and its patterns' },
    summary: {
      fr: 'Colorie les coefficients binomiaux selon leur reste modulo m : un fractal de Sierpiński apparaît. Combien d’impairs par ligne ?',
      en: 'Colour binomial coefficients by their remainder modulo m: a Sierpiński fractal appears. How many odd entries per row?',
    },
  },
  {
    slug: 'taquin',
    chapter: '07-invariants',
    themes: ['combinatoire'],
    level: 'lycée',
    difficulty: 3,
    minutes: 15,
    icon: '🎲',
    title: { fr: 'Le taquin et son invariant', en: 'The sliding puzzle and its invariant' },
    summary: {
      fr: 'Quelles positions sont atteignables ? Une parité ne change jamais. Défi : devine avant de calculer.',
      en: 'Which positions are reachable? A parity never changes. Challenge: guess before you compute.',
    },
  },
  {
    slug: 'operations-sur-des-nombres',
    chapter: '07-invariants',
    themes: ['arithmétique', 'algèbre'],
    level: 'collège',
    difficulty: 2,
    minutes: 10,
    icon: '✂️',
    title: { fr: 'Remplacer deux nombres par un seul', en: 'Replace two numbers by one' },
    summary: {
      fr: 'On efface deux nombres et on écrit leur « combinaison » : quelle quantité reste la même, quel que soit l’ordre ?',
      en: 'Erase two numbers and write their “combination”: which quantity stays the same, whatever the order?',
    },
  },
  {
    slug: 'quatre-moyennes',
    chapter: '08-inegalites',
    themes: ['algèbre', 'analyse'],
    level: 'lycée',
    difficulty: 2,
    minutes: 12,
    icon: '📊',
    title: { fr: 'Quatre moyennes en compétition', en: 'Four means in competition' },
    summary: {
      fr: 'Harmonique, géométrique, arithmétique, quadratique : leur ordre, et la moyenne d’exposant p qui les relie toutes.',
      en: 'Harmonic, geometric, arithmetic, quadratic: their order, and the power mean of exponent p linking them all.',
    },
  },
  {
    slug: 'optimisation-et-moyennes',
    chapter: '08-inegalites',
    themes: ['algèbre', 'analyse'],
    level: 'lycée',
    difficulty: 2,
    minutes: 12,
    icon: '📦',
    title: { fr: 'Optimiser : boîte et x + a/x', en: 'Optimising: the box and x + a/x' },
    summary: {
      fr: 'Trouver la boîte de volume maximal à somme d’arêtes fixée, et le minimum de x + a/x : l’inégalité AM–GM en action.',
      en: 'Find the box of largest volume for a fixed sum of edges, and the minimum of x + a/x: AM–GM in action.',
    },
  },
];

export const simBySlug = (slug: string) => sims.find((s) => s.slug === slug);

/** Simulations d'un même chapitre (hors la simulation courante). */
export const siblings = (s: SimMeta) => sims.filter((x) => x.chapter === s.chapter && x.slug !== s.slug);

export const levelOrder: Level[] = ['collège', 'lycée', 'prépa'];
