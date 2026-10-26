import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Division euclidienne : a unités rangées par paquets de b ; q paquets pleins et un
 * reste r < b. b divise a exactement quand le reste est nul.
 */

const MAX = 60;
const CELL = 9;
const X0 = 20;

export const figure: FicheFigure = {
  size: [640, 185],
  label: {
    fr: 'a carrés rangés en paquets de b : q paquets complets et un reste r.',
    en: 'a squares grouped in packs of b: q complete packs and a remainder r.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    let a = 23;
    let b = 5;
    let shown = a;
    const layer = S('g');
    fig.svg.append(layer);

    const render = () => {
      const q = Math.floor(shown / b);
      const gap = b >= 3 ? 3 : 0; // espace entre paquets (omis pour b = 1, 2 : place)
      const r = shown % b;
      layer.replaceChildren();
      for (let i = 0; i < shown; i++) {
        const block = Math.floor(i / b);
        const rest = block === q;
        layer.append(
          S('rect', {
            x: X0 + i * CELL + block * gap,
            y: 50,
            width: CELL - 1.5,
            height: 34,
            rx: 2,
            fill: rest ? C.accent : block % 2 ? C.primary : '#5aa86a',
          }),
        );
      }
      for (let k = 0; k < q; k++) {
        const x1 = X0 + k * b * CELL + k * gap;
        const x2 = x1 + b * CELL - 1.5;
        layer.append(
          S('path', { d: `M${x1} 94 v6 H${x2} v-6`, fill: C.none, stroke: C.muted, 'stroke-width': 1.5 }),
          S('text', { x: (x1 + x2) / 2, y: 116, 'text-anchor': 'middle', 'font-size': 12, fill: C.muted }, String(b)),
        );
      }
      if (r > 0) {
        const x1 = X0 + q * b * CELL + q * gap;
        const x2 = x1 + r * CELL - 1.5;
        layer.append(
          S('path', { d: `M${x1} 94 v6 H${x2} v-6`, fill: C.none, stroke: C.accent, 'stroke-width': 2 }),
          S('text', { x: (x1 + x2) / 2, y: 116, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.accent }, `r = ${r}`),
        );
      }
      layer.append(
        S('text', { x: 20, y: 28, 'font-size': 17, 'font-weight': 700, fill: C.ink }, `${shown} = ${b} × ${q} + ${r}`),
        S('text', { x: 20, y: 150, 'font-size': 13.5, fill: C.muted }, T(`q = ${q} paquets complets de ${b}, reste r = ${r}, avec 0 ≤ ${r} < ${b}.`, `q = ${q} complete packs of ${b}, remainder r = ${r}, with 0 ≤ ${r} < ${b}.`)),
        S('text', { x: 20, y: 172, 'font-size': 14, 'font-weight': 700, fill: r === 0 ? C.primary : C.muted }, r === 0 ? T(`Le reste est nul : ${b} divise ${shown}  (${b} | ${shown})`, `The remainder is zero: ${b} divides ${shown}  (${b} | ${shown})`) : T(`Le reste n’est pas nul : ${b} ne divise pas ${shown}.`, `The remainder is not zero: ${b} does not divide ${shown}.`)),
      );
      fig.say(T('Il n’existe qu’un seul couple (q, r) : change a et b, il est toujours unique.', 'There is only one pair (q, r): change a and b, it is always unique.'));
    };

    const sa = fig.range('a', 0, MAX, a, 1, (v) => {
      run.next();
      a = shown = v;
      render();
    });
    fig.range('b', 1, 12, b, 1, (v) => {
      run.next();
      b = v;
      shown = a;
      render();
    });
    fig.btn(T('▶ Remplir', '▶ Fill'), async () => {
      const alive = run.token();
      for (shown = 0; shown <= a && alive(); shown++) {
        render();
        await sleep(55);
      }
      shown = a;
      if (alive()) render();
    }, true);
    fig.btn(T('Choisir a multiple de b', 'Make a a multiple of b'), () => {
      run.next();
      a = shown = Math.max(b, Math.floor(a / b) * b);
      sa.set(a);
      render();
    });
    render();
  },
};
