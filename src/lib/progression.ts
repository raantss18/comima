// Paliers de la bibliothèque et progression de l'année (calculés par scripts/build-index.mjs ;
// mêmes libellés dans l'application, app/lib/core/i18n.dart).
import type { Lang } from '../i18n/ui';

export const paliers: Record<number, Record<Lang, string>> = {
  1: { fr: 'Lycée · niveau 1', en: 'High school · level 1' },
  2: { fr: 'Lycée · niveau 2', en: 'High school · level 2' },
  3: { fr: 'Lycée · niveau 3', en: 'High school · level 3' },
  4: { fr: 'Niveau universitaire', en: 'University level' },
  5: { fr: 'Recherche', en: 'Research' },
};

/** Progression de l'année, d'après A. Engel, Problem-Solving Strategies. */
export const progression: { n: number; fr: string; en: string; engel: string | null }[] = [
  { n: 1, fr: 'Exemples et contre-exemples', en: 'Examples and counterexamples', engel: null },
  { n: 2, fr: 'Inégalités', en: 'Inequalities', engel: 'ch. 7' },
  { n: 3, fr: 'Suites', en: 'Sequences', engel: 'ch. 9' },
  { n: 4, fr: 'Polynômes', en: 'Polynomials', engel: 'ch. 10' },
  { n: 5, fr: 'Équations fonctionnelles', en: 'Functional equations', engel: 'ch. 11' },
  { n: 6, fr: 'Jeux', en: 'Games', engel: 'ch. 13' },
  { n: 7, fr: 'Autres stratégies', en: 'Further strategies', engel: 'ch. 14' },
];
