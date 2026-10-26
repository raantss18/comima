/**
 * Illustrations des pages de chapitres du cours (/cours/<chapitre>/) : même socle que les
 * fiches de l'Entraînement (src/scripts/fiche/core.ts), un module par chapitre
 * (src/scripts/cours/<id-du-chapitre>.ts), téléchargé seulement sur la page concernée.
 */
import { mountFig, type Lang } from '../fiche/core';
import type { FicheFigure } from '../fiche';

const loaders: Record<string, () => Promise<{ figure: FicheFigure }>> = {
  '00-exemples-contre-exemples': () => import('./00-exemples-contre-exemples'),
  '01-recurrence': () => import('./01-recurrence'),
  '02-principe-extremal': () => import('./02-principe-extremal'),
  '03-principe-des-tiroirs': () => import('./03-principe-des-tiroirs'),
  '04-geometrie': () => import('./04-geometrie'),
  '05-theorie-des-nombres': () => import('./05-theorie-des-nombres'),
  '06-combinatoire': () => import('./06-combinatoire'),
  '07-invariants': () => import('./07-invariants'),
  '08-inegalites': () => import('./08-inegalites'),
};

export async function initCoursFigure(lang: Lang): Promise<void> {
  const host = document.querySelector<HTMLElement>('[data-cours-figure]');
  if (!host) return;
  const load = loaders[host.dataset.coursFigure ?? ''];
  if (!load) return;
  try {
    const { figure } = await load();
    figure.draw(mountFig(host, lang, figure.size[0], figure.size[1], figure.label[lang]));
  } catch (err) {
    host.textContent = lang === 'fr' ? 'Cette illustration n’a pas pu être chargée.' : 'This illustration could not be loaded.';
    console.error(err);
  }
}
