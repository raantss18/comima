/**
 * Chargement des illustrations des fiches : chaque illustration est un module séparé,
 * téléchargé seulement sur la page de sa notion (src/scripts/fiche/<id>.ts).
 */
import { mountFig, type Fig, type Lang } from './core';

export interface FicheFigure {
  /** Taille du dessin (viewBox) et description pour les lecteurs d'écran. */
  size: [number, number];
  label: { fr: string; en: string };
  draw(fig: Fig): void;
}

const loaders: Record<string, () => Promise<{ figure: FicheFigure }>> = {
  'contre-exemples': () => import('./contre-exemples'),
  denombrement: () => import('./denombrement'),
  'divisibilite-bases': () => import('./divisibilite-bases'),
  'fonctionnelles-iterations': () => import('./fonctionnelles-iterations'),
  'fonctionnelles-polynomiales': () => import('./fonctionnelles-polynomiales'),
  'fonctionnelles-substitutions': () => import('./fonctionnelles-substitutions'),
  'geometrie-angles': () => import('./geometrie-angles'),
  'geometrie-vecteurs': () => import('./geometrie-vecteurs'),
  'inegalites-moyennes': () => import('./inegalites-moyennes'),
  invariants: () => import('./invariants'),
  'jeux-algebriques': () => import('./jeux-algebriques'),
  'jeux-positions': () => import('./jeux-positions'),
  'jeux-symetrie': () => import('./jeux-symetrie'),
  'polynomes-factorisations': () => import('./polynomes-factorisations'),
  'polynomes-racines': () => import('./polynomes-racines'),
  'polynomes-restes': () => import('./polynomes-restes'),
  'principe-extremal': () => import('./principe-extremal'),
  'python-algorithmes': () => import('./python-algorithmes'),
  'python-bases': () => import('./python-bases'),
  'recurrence-sommes': () => import('./recurrence-sommes'),
  'strategies-conjugues': () => import('./strategies-conjugues'),
  'strategies-descente': () => import('./strategies-descente'),
  'strategies-graphes': () => import('./strategies-graphes'),
  'suites-convergence': () => import('./suites-convergence'),
  'suites-lineaires': () => import('./suites-lineaires'),
  'suites-periodes-sommes': () => import('./suites-periodes-sommes'),
  'tiroirs-bases': () => import('./tiroirs-bases'),
};

export async function initFicheFigure(lang: Lang): Promise<void> {
  const host = document.querySelector<HTMLElement>('[data-fiche]');
  if (!host) return;
  const load = loaders[host.dataset.fiche ?? ''];
  if (!load) return;
  try {
    const { figure } = await load();
    const fig = mountFig(host, lang, figure.size[0], figure.size[1], figure.label[lang]);
    figure.draw(fig);
  } catch (err) {
    host.textContent = lang === 'fr' ? 'Cette illustration n’a pas pu être chargée.' : 'This illustration could not be loaded.';
    console.error(err);
  }
}
