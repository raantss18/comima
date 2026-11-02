import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Descente : la transformation (a, b) ↦ (2b − a, a − b) fait baisser a et b, et change
 * a² − 2b² en son opposé. Si l'on avait a² = 2b² avec a, b entiers positifs, la valeur 0 serait
 * conservée et a baisserait sans fin : impossible, donc √2 est irrationnel. On la voit agir sur
 * de très bonnes approximations a/b de √2, qui redescendent jusqu'à (1, 0).
 */

const W = 360;
const H = 345;
const DEPARTS: [number, number][] = [
  [577, 408],
  [1393, 985],
  [3363, 2378],
];

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Une suite de couples (a, b) obtenus en appliquant plusieurs fois la même transformation : les nombres diminuent et a² − 2b² vaut toujours 1 ou −1.',
    en: 'A list of pairs (a, b) obtained by applying the same map several times: the numbers decrease and a² − 2b² is always 1 or −1.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    let d = 0;
    const g = S('g');
    fig.svg.append(
      S('text', { x: W / 2, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink }, '(a, b) ↦ (2b − a, a − b)'),
      S('text', { x: 70, y: 48, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.muted }, 'a'),
      S('text', { x: 150, y: 48, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.muted }, 'b'),
      S('text', { x: 250, y: 48, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.muted }, 'a² − 2b²'),
      g,
    );
    const lancer = async (anime: boolean) => {
      const alive = run.token();
      g.replaceChildren();
      let [a, b] = DEPARTS[d];
      for (let i = 0; alive(); i++) {
        const y = 70 + i * 24;
        const v = a * a - 2 * b * b;
        g.append(
          S('text', { x: 70, y, 'text-anchor': 'middle', 'font-size': 14, 'font-family': 'ui-monospace, monospace', fill: C.ink }, String(a)),
          S('text', { x: 150, y, 'text-anchor': 'middle', 'font-size': 14, 'font-family': 'ui-monospace, monospace', fill: C.ink }, String(b)),
          S('text', { x: 250, y, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: v > 0 ? C.primary : C.accent }, v > 0 ? `+${v}` : String(v)),
        );
        if (b === 0) break;
        [a, b] = [2 * b - a, a - b];
        if (anime) await sleep(450);
      }
      if (alive()) {
        fig.say(
          T(
            'a et b baissent à chaque étape, et a² − 2b² change seulement de signe. Avec a² − 2b² = 0, la valeur 0 se conserverait et la descente ne s’arrêterait jamais : aucun couple d’entiers positifs ne vérifie a² = 2b².',
            'a and b decrease at each step, and a² − 2b² only changes sign. With a² − 2b² = 0, the value 0 would be kept and the descent would never stop: no pair of positive integers satisfies a² = 2b².',
          ),
        );
      }
    };
    DEPARTS.forEach(([a, b], i) => fig.btn(`${a}/${b}`, () => {
      d = i;
      lancer(true);
    }, i === 0));
    lancer(false);
  },
};
