/**
 * Chargement d'une simulation : chaque simulation est un module séparé,
 * téléchargé seulement sur sa propre page.
 */
import { buildLab, type LabDef, type Lang } from './core';

const loaders: Record<string, () => Promise<{ def: LabDef }>> = {
  'regions-du-cercle': () => import('./regions-du-cercle'),
  'polynome-d-euler': () => import('./polynome-d-euler'),
  'pavages-en-l': () => import('./pavages-en-l'),
  'suites-recurrentes': () => import('./suites-recurrentes'),
  'droites-ordinaires': () => import('./droites-ordinaires'),
  'principe-du-maximum': () => import('./principe-du-maximum'),
  'points-dans-un-carre': () => import('./points-dans-un-carre'),
  'anniversaires': () => import('./anniversaires'),
  'polygone-des-milieux': () => import('./polygone-des-milieux'),
  'droite-d-euler': () => import('./droite-d-euler'),
  'cycle-des-puissances': () => import('./cycle-des-puissances'),
  'pieces-de-monnaie': () => import('./pieces-de-monnaie'),
  'chemins-de-catalan': () => import('./chemins-de-catalan'),
  'triangle-de-pascal': () => import('./triangle-de-pascal'),
  'taquin': () => import('./taquin'),
  'operations-sur-des-nombres': () => import('./operations-sur-des-nombres'),
  'quatre-moyennes': () => import('./quatre-moyennes'),
  'optimisation-et-moyennes': () => import('./optimisation-et-moyennes'),
};

export async function initSim(lang: Lang): Promise<void> {
  const host = document.querySelector<HTMLElement>('[data-sim]');
  if (!host) return;
  const slug = host.dataset.sim ?? '';
  const load = loaders[slug];
  if (!load) return;
  try {
    const { def } = await load();
    buildLab(def, host, lang, { chapterTitle: host.dataset.chapterTitle, slug });
  } catch (err) {
    host.textContent = lang === 'fr' ? 'Cette simulation n’a pas pu être chargée. Recharge la page.' : 'This simulation could not be loaded. Reload the page.';
    console.error(err);
  }
}
