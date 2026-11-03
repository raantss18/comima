/**
 * Chargement d'un défi : chaque défi est un module séparé, téléchargé seulement sur sa page.
 */
import { buildDefi, type DefiModule, type Lang } from './core';

const loaders: Record<string, () => Promise<{ defi: DefiModule }>> = {
  'bons-voisins': () => import('./bons-voisins'),
  'jeu-de-parite': () => import('./jeu-de-parite'),
  'par-quatre-chemins': () => import('./par-quatre-chemins'),
  'choix-des-invites': () => import('./choix-des-invites'),
  'robot-qui-tourne': () => import('./robot-qui-tourne'),
  'code-du-cadenas': () => import('./code-du-cadenas'),
  'installation-d-antennes': () => import('./installation-d-antennes'),
  'traverser-le-pont': () => import('./traverser-le-pont'),
  'trier-par-poids': () => import('./trier-par-poids'),
  'dessine-un-castor': () => import('./dessine-un-castor'),
  'marquage-d-oiseaux': () => import('./marquage-d-oiseaux'),
  curseurs: () => import('./curseurs'),
  'attaques-croisees': () => import('./attaques-croisees'),
  'territoire-castor': () => import('./territoire-castor'),
  remplacements: () => import('./remplacements'),
  'travail-concurrent': () => import('./travail-concurrent'),
  'vitrail-colore': () => import('./vitrail-colore'),
  'rectangles-inverses': () => import('./rectangles-inverses'),
  rectangles: () => import('./rectangles'),
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
