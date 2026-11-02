import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Orbites : pour S(x) = −1/(1 + x), on a S(S(S(x))) = x. Les trois points x, S(x), S²(x)
 * forment un cycle sur la droite ; écrire une équation fonctionnelle en ces trois points donne
 * un système de trois équations. (La fiche traite T(x) = 1/(1 − x), qui se comporte de même.)
 */

const W = 360;
const H = 220;
const MIN = -5;
const MAX = 5;
const X = (x: number) => 20 + ((Math.max(MIN, Math.min(MAX, x)) - MIN) / (MAX - MIN)) * (W - 40);
const Sx = (x: number) => -1 / (1 + x);
const f2 = (v: number) => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(3));

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Trois points x, S(x), S(S(x)) reliés par des flèches sur une droite graduée : la troisième flèche revient à x.',
    en: 'Three points x, S(x), S(S(x)) joined by arrows on a number line: the third arrow comes back to x.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    let x = 1;
    fig.svg.append(
      S('text', { x: W / 2, y: 24, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink }, 'S(x) = −1 / (1 + x)'),
      S('line', { x1: X(MIN), y1: 120, x2: X(MAX), y2: 120, stroke: C.line, 'stroke-width': 2 }),
    );
    for (let k = MIN; k <= MAX; k++) {
      fig.svg.append(S('line', { x1: X(k), y1: 115, x2: X(k), y2: 125, stroke: C.line, 'stroke-width': 1.5 }));
      fig.svg.append(S('text', { x: X(k), y: 142, 'text-anchor': 'middle', 'font-size': 10, fill: C.muted }, String(k)));
    }
    fig.svg.append(S('defs', {}, S('marker', { id: 'fs-fl', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, S('path', { d: 'M0 0L10 5L0 10z', fill: C.accent }))));
    const arcs = [0, 1, 2].map(() => S('path', { fill: C.none, stroke: C.accent, 'stroke-width': 2, 'marker-end': 'url(#fs-fl)' }));
    const pts = [0, 1, 2].map((i) => S('circle', { r: 6, fill: i ? C.primary : C.accent, cy: 120 }));
    const noms = ['x', 'S(x)', 'S²(x)'].map((t) => S('text', { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.ink }, t));
    fig.svg.append(...arcs, ...pts, ...noms);

    const render = () => {
      const o = [x, Sx(x), Sx(Sx(x))];
      o.forEach((v, i) => {
        pts[i].setAttribute('cx', String(X(v)));
        noms[i].setAttribute('x', String(X(v)));
        noms[i].setAttribute('y', String(i % 2 ? 168 : 102));
        const a = X(v);
        const b = X(o[(i + 1) % 3]);
        const up = i % 2 ? 1 : -1;
        const h = Math.max(24, Math.abs(b - a) / 3);
        arcs[i].setAttribute('d', `M${a} 120 C ${a} ${120 + up * h * 1.3}, ${b} ${120 + up * h * 1.3}, ${b} ${120 + up * 4}`);
      });
      const hors = o.some((v) => v < MIN || v > MAX);
      fig.say(
        T(
          `x = ${f2(o[0])} → S(x) = ${f2(o[1])} → S²(x) = ${f2(o[2])} → S³(x) = ${f2(Sx(o[2]))} = x.${hors ? ' (Un point sort du dessin : il est placé au bord.)' : ''}`,
          `x = ${f2(o[0])} → S(x) = ${f2(o[1])} → S²(x) = ${f2(o[2])} → S³(x) = ${f2(Sx(o[2]))} = x.${hors ? ' (A point is off the picture: it is drawn at the edge.)' : ''}`,
        ),
      );
    };
    fig.range('x', -4.5, 4.5, x, 0.25, (v) => {
      // x = −1 et x = 0 sont hors du domaine de l'orbite (division par zéro).
      x = v === -1 || v === 0 ? v + 0.25 : v;
      render();
    }, f2);
    render();
  },
};
