/**
 * Registre des laboratoires : un problème par chapitre du cours.
 * Chaque laboratoire est construit à la demande (quand il approche de l'écran).
 */
import { buildLab, type LabDef, type Lang } from './core';
import { def as s00 } from './s00-regions';
import { def as s01 } from './s01-tromino';
import { def as s02 } from './s02-sylvester';
import { def as s03 } from './s03-pigeon';
import { def as s04 } from './s04-varignon';
import { def as s05 } from './s05-modular';
import { def as s06 } from './s06-catalan';
import { def as s07 } from './s07-puzzle';
import { def as s08 } from './s08-means';

export const labs: LabDef[] = [s00, s01, s02, s03, s04, s05, s06, s07, s08];

export function initLabs(lang: Lang): void {
  const hosts = document.querySelectorAll<HTMLElement>('[data-lab]');
  const byChapter = new Map(labs.map((d) => [d.chapter, d]));
  const build = (host: HTMLElement) => {
    if (host.dataset.ready) return;
    const def = byChapter.get(host.dataset.lab ?? '');
    if (!def) return;
    host.dataset.ready = '1';
    buildLab(def, host, lang);
  };
  // Les laboratoires proches de l'écran se construisent en priorité ; tous les autres
  // suivent peu après, un par un (la page reste fluide, et rien ne dépend de
  // l'IntersectionObserver, absent ou suspendu dans certains contextes).
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            build(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '400px 0px' },
    );
    hosts.forEach((h) => io.observe(h));
  }
  // Arrivée par ancre (#03-…) : on construit tout de suite le laboratoire visé.
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) document.querySelectorAll<HTMLElement>(`[data-lab="${CSS.escape(hash)}"]`).forEach(build);
  hosts.forEach((h, i) => window.setTimeout(() => build(h), 250 + i * 180));
}
