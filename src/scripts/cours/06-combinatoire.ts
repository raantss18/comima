import { C, S, runner, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';
import { rng } from '../lab/core';

/**
 * Chapitre 6 — inclusion–exclusion : chaque point est une personne qui appartient à
 * certains des trois ensembles. Un badge indique combien de fois elle est comptée dans la
 * somme en cours : |A|+|B|+|C| la compte m fois, on retranche les doubles, on rajoute les
 * triples — et chacune finit comptée exactement une fois.
 */

const R = 78;
const CIRC = [
  { cx: 150, cy: 105, name: 'A', color: '#2563eb' },
  { cx: 235, cy: 105, name: 'B', color: '#d97706' },
  { cx: 192, cy: 178, name: 'C', color: '#16a34a' },
];
const inside = (i: number, x: number, y: number) => Math.hypot(x - CIRC[i].cx, y - CIRC[i].cy) < R - 9;
const binom = (m: number, k: number) => (k > m ? 0 : k === 0 ? 1 : k === 1 ? m : m === 2 ? 1 : m === 3 && k === 2 ? 3 : 1);

interface Person {
  x: number;
  y: number;
  m: number; // nombre d'ensembles contenant la personne
  mask: number;
}

export const figure: FicheFigure = {
  size: [640, 285],
  label: {
    fr: 'Trois ensembles qui se recoupent, remplis de personnes : on compte la réunion en ajoutant les ensembles, retranchant les doubles intersections, ajoutant la triple.',
    en: 'Three overlapping sets filled with people: the union is counted by adding the sets, subtracting the double intersections, adding the triple one.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let seed = 3;
    let people: Person[] = [];
    let stage = 0; // 0 : rien ; 1 : somme des ensembles ; 2 : − doubles ; 3 : + triple
    const layer = S('g');
    svg.append(layer);

    const populate = () => {
      const r = rng(seed);
      people = [];
      for (let mask = 1; mask < 8; mask++) {
        const k = mask === 7 ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3);
        for (let c = 0, tries = 0; c < k && tries < 400; tries++) {
          const x = 70 + r() * 250;
          const y = 30 + r() * 220;
          const ok = [0, 1, 2].every((i) => inside(i, x, y) === Boolean(mask & (1 << i)));
          if (!ok || people.some((p) => Math.hypot(p.x - x, p.y - y) < 17)) continue;
          people.push({ x, y, m: [0, 1, 2].filter((i) => mask & (1 << i)).length, mask });
          c++;
        }
      }
    };
    const counted = (m: number, st: number) => (st === 0 ? 0 : st === 1 ? m : st === 2 ? m - binom(m, 2) : m - binom(m, 2) + (m === 3 ? 1 : 0));

    const render = () => {
      layer.replaceChildren();
      CIRC.forEach((c) => {
        layer.append(S('circle', { cx: c.cx, cy: c.cy, r: R, fill: c.color, opacity: 0.1, stroke: c.color, 'stroke-width': 2.5 }), S('text', { x: c.cx + (c.name === 'A' ? -R + 4 : c.name === 'B' ? R - 4 : 0), y: c.cy + (c.name === 'C' ? R + 18 : -R + 14), 'text-anchor': c.name === 'C' ? 'middle' : c.name === 'A' ? 'start' : 'end', 'font-size': 16, 'font-weight': 800, fill: c.color }, c.name));
      });
      people.forEach((p) => {
        const k = counted(p.m, stage);
        layer.append(S('circle', { cx: p.x, cy: p.y, r: 7, fill: stage === 3 ? C.primary : C.ink, opacity: stage === 0 ? 0.85 : 1 }));
        if (stage > 0) layer.append(S('text', { x: p.x + 11, y: p.y - 7, 'font-size': 12, 'font-weight': 800, fill: k === 1 ? C.primary : k === 0 ? C.accent : '#d97706' }, `×${k}`));
      });
      const size = (i: number) => people.filter((p) => p.mask & (1 << i)).length;
      const pair = (i: number, j: number) => people.filter((p) => p.mask & (1 << i) && p.mask & (1 << j)).length;
      const tri = people.filter((p) => p.mask === 7).length;
      const union = people.length;
      const s1 = size(0) + size(1) + size(2);
      const s2 = s1 - pair(0, 1) - pair(0, 2) - pair(1, 2);
      const s3 = s2 + tri;
      const rx = 360;
      const line = (y: number, txt: string, on: boolean, color = C.ink) => layer.append(S('text', { x: rx, y, 'font-size': 14, 'font-weight': on ? 800 : 500, fill: on ? color : C.muted, opacity: on ? 1 : 0.55 }, txt));
      line(40, T('Étape 1 : on additionne', 'Step 1: add up'), stage >= 1);
      line(62, `|A| + |B| + |C| = ${size(0)} + ${size(1)} + ${size(2)} = ${s1}`, stage >= 1, '#2563eb');
      line(104, T('Étape 2 : on retranche les doubles', 'Step 2: subtract the doubles'), stage >= 2);
      line(126, `− |A∩B| − |A∩C| − |B∩C| = −${pair(0, 1)} −${pair(0, 2)} −${pair(1, 2)} → ${s2}`, stage >= 2, '#d97706');
      line(168, T('Étape 3 : on rajoute le triple', 'Step 3: add the triple'), stage >= 3);
      line(190, `+ |A∩B∩C| = +${tri} → ${s3}`, stage >= 3, '#16a34a');
      layer.append(S('text', { x: rx, y: 244, 'font-size': 16, 'font-weight': 800, fill: stage === 3 ? C.primary : C.muted }, T(`|A∪B∪C| = ${union} personnes`, `|A∪B∪C| = ${union} people`) + (stage === 3 ? (s3 === union ? ' ✓' : '') : '')));
      fig.say(
        [
          T('Chaque point est une personne. Compte la réunion A∪B∪C : combien de personnes, sans compter personne deux fois ?', 'Each dot is a person. Count the union A∪B∪C: how many people, without counting anyone twice?'),
          T('Les personnes situées dans plusieurs ensembles sont comptées plusieurs fois (×2, ×3) : la somme est trop grande.', 'People in several sets are counted several times (×2, ×3): the sum is too big.'),
          T('On retranche chaque double intersection : les ×2 deviennent ×1, mais ceux de l’intersection triple tombent à ×0 : trop retranché.', 'Each double intersection is subtracted: ×2 becomes ×1, but those in the triple intersection fall to ×0: too much was removed.'),
          T('On rajoute la triple intersection : chaque personne est maintenant comptée exactement une fois (×1).', 'The triple intersection is added back: everyone is now counted exactly once (×1).'),
        ][stage],
      );
    };

    fig.btn(T('Étape suivante', 'Next step'), () => {
      run.next();
      stage = (stage + 1) % 4;
      render();
    }, true);
    fig.btn(T('Autre population', 'Another population'), () => {
      seed = (seed * 17 + 5) % 9973;
      stage = 0;
      populate();
      render();
    });
    populate();
    render();
  },
};
