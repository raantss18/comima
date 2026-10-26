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
  'geometrie-angles': () => import('./geometrie-angles'),
  'inegalites-moyennes': () => import('./inegalites-moyennes'),
  invariants: () => import('./invariants'),
  'principe-extremal': () => import('./principe-extremal'),
  'recurrence-sommes': () => import('./recurrence-sommes'),
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
