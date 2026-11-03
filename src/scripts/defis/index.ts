/**
 * Chargement d'un défi : chaque défi est un module séparé, téléchargé seulement sur sa page.
 */
import { buildDefi, type DefiModule, type Lang } from './core';

const loaders: Record<string, () => Promise<{ defi: DefiModule }>> = {
  'bons-voisins': () => import('./bons-voisins'),
  'jeu-de-parite': () => import('./jeu-de-parite'),
  'par-quatre-chemins': () => import('./par-quatre-chemins'),
};

export async function initDefi(lang: Lang): Promise<void> {
  const host = document.querySelector<HTMLElement>('[data-defi]');
  if (!host) return;
  const slug = host.dataset.defi ?? '';
  const load = loaders[slug];
  if (!load) return;
  try {
    const { defi } = await load();
    buildDefi(defi, host, lang, slug, Number(host.dataset.versions) || 1);
  } catch (err) {
    host.textContent = lang === 'fr' ? 'Ce défi n’a pas pu être chargé. Recharge la page.' : 'This challenge could not be loaded. Reload the page.';
    console.error(err);
  }
}
