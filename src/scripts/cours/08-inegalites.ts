import { C, S, ease, runner, tween, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';

/**
 * Chapitre 8 — x + c/x pour x > 0. On explore la courbe en déplaçant x ; la plus petite
 * valeur rencontrée est suivie, et la borne 2√c n'est montrée que sur demande.
 */

const X0 = 50;
const X1 = 610;
const Y0 = 215;
const Y1 = 18;
const XMAX = 10;
const YMAX = 14;
const px = (x: number) => X0 + (x / XMAX) * (X1 - X0);
const py = (y: number) => Y0 - (Math.min(y, YMAX) / YMAX) * (Y0 - Y1);

export const figure: FicheFigure = {
  size: [640, 270],
  label: {
    fr: 'La courbe de x + c/x pour x > 0 : en déplaçant x, on cherche la plus petite valeur.',
    en: 'The graph of x + c/x for x > 0: move x to look for the smallest value.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let c = 4;
    let x = 8;
    let best = Infinity;
    let showBound = false;
    const f = (t: number) => t + c / t;
    const grid = S('g');
    const curve = S('path', { fill: C.none, stroke: C.primary, 'stroke-width': 3 });
    const bound = S('g');
    const marker = S('g');
    svg.append(grid, bound, curve, marker);

    const render = () => {
      grid.replaceChildren(
        S('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: C.line, 'stroke-width': 2 }),
        S('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, stroke: C.line, 'stroke-width': 2 }),
        ...[2, 4, 6, 8, 10].map((t) => S('text', { x: px(t), y: Y0 + 16, 'text-anchor': 'middle', 'font-size': 11, fill: C.muted }, String(t))),
        ...[2, 6, 10, 14].map((t) => S('text', { x: X0 - 6, y: py(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: C.muted }, String(t))),
      );
      let d = '';
      for (let t = 0.25; t <= XMAX + 0.001; t += 0.05) d += `${d ? 'L' : 'M'}${px(t)} ${py(f(t))} `;
      curve.setAttribute('d', d);
      bound.replaceChildren();
      if (showBound) {
        const m = 2 * Math.sqrt(c);
        bound.append(S('line', { x1: X0, y1: py(m), x2: X1, y2: py(m), stroke: C.accent, 'stroke-width': 2, 'stroke-dasharray': '6 5' }), S('text', { x: X1, y: py(m) - 6, 'text-anchor': 'end', 'font-size': 13, 'font-weight': 800, fill: C.accent }, `2√c = ${m.toFixed(2)}`), S('circle', { cx: px(Math.sqrt(c)), cy: py(m), r: 6, fill: C.accent }));
      }
      const y = f(x);
      marker.replaceChildren(
        S('line', { x1: px(x), y1: Y0, x2: px(x), y2: py(y), stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
        S('line', { x1: X0, y1: py(y), x2: px(x), y2: py(y), stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
        S('circle', { cx: px(x), cy: py(y), r: 7, fill: '#d97706', stroke: C.surface, 'stroke-width': 2 }),
      );
      best = Math.min(best, y);
      fig.say(
        T(`c = ${c}, x = ${x.toFixed(2)} : x + c/x = ${y.toFixed(3)}. Plus petite valeur rencontrée : ${best.toFixed(3)}.`, `c = ${c}, x = ${x.toFixed(2)}: x + c/x = ${y.toFixed(3)}. Smallest value reached so far: ${best.toFixed(3)}.`) +
          (showBound ? T(`  Pour c > 0 et tout x > 0 : x + c/x ≥ 2√c (car (√x − √(c/x))² ≥ 0), avec égalité en x = √c.`, `  For c > 0 and all x > 0: x + c/x ≥ 2√c (since (√x − √(c/x))² ≥ 0), with equality at x = √c.`) : ''),
      );
    };

    const sx = fig.range('x', 0.3, XMAX, x, 0.05, (v) => {
      run.next();
      x = v;
      render();
    }, (v) => v.toFixed(2));
    fig.range('c', 1, 16, c, 1, (v) => {
      c = v;
      best = Infinity;
      render();
    });
    fig.btn(T('▶ Parcourir la courbe', '▶ Sweep the curve'), async () => {
      const alive = run.token();
      best = Infinity;
      await tween(5000, (t) => {
        if (!alive()) return;
        x = 0.3 + (XMAX - 0.3) * ease(t);
        sx.set(Math.round(x * 20) / 20);
        render();
      });
    }, true);
    fig.btn(T('Montrer la borne 2√c', 'Show the bound 2√c'), () => {
      showBound = !showBound;
      fig.controls.querySelectorAll('button')[1].textContent = showBound ? T('Cacher la borne', 'Hide the bound') : T('Montrer la borne 2√c', 'Show the bound 2√c');
      render();
    });
    render();
  },
};
