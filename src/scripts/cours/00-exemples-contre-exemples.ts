import { C, S, ease, runner, tween, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';

/**
 * Chapitre 0 — la conjecture de Collatz : n → n/2 (n pair), 3n + 1 (n impair).
 * Tous les départs essayés atteignent 1, mais aucune preuve n'existe : beaucoup
 * d'exemples ne démontrent rien. L'élève regarde des trajectoires, sans conclusion imposée.
 */

const X0 = 46;
const X1 = 620;
const Y0 = 215;
const Y1 = 22;

const orbit = (n: number): number[] => {
  const o = [n];
  while (n !== 1 && o.length < 500) {
    n = n % 2 === 0 ? n / 2 : 3 * n + 1;
    o.push(n);
  }
  return o;
};

export const figure: FicheFigure = {
  size: [640, 300],
  label: {
    fr: 'La trajectoire de Collatz d’un entier n : on divise par 2 s’il est pair, on calcule 3n + 1 sinon, jusqu’à atteindre 1.',
    en: 'The Collatz trajectory of an integer n: halve it if even, compute 3n + 1 otherwise, until reaching 1.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let n = 27;
    const axes = S('g');
    const line = S('polyline', { fill: C.none, stroke: C.primary, 'stroke-width': 2, 'stroke-linejoin': 'round' });
    const dots = S('g');
    const peak = S('text', { 'font-size': 12, 'font-weight': 700, fill: C.accent, 'text-anchor': 'middle' });
    svg.append(axes, line, dots, peak);

    const draw = (upTo: number) => {
      const o = orbit(n);
      const max = Math.max(...o);
      const k = Math.min(o.length - 1, Math.floor(upTo));
      const xs = (i: number) => X0 + (i / Math.max(1, o.length - 1)) * (X1 - X0);
      const ys = (v: number) => Y0 - (v / max) * (Y0 - Y1);
      axes.replaceChildren(
        S('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: C.line, 'stroke-width': 2 }),
        S('line', { x1: X0, y1: Y0, x2: X0, y2: Y1 - 6, stroke: C.line, 'stroke-width': 2 }),
        S('text', { x: X0 - 6, y: Y1 + 4, 'text-anchor': 'end', 'font-size': 11, fill: C.muted }, String(max)),
        S('text', { x: X0 - 6, y: Y0 + 4, 'text-anchor': 'end', 'font-size': 11, fill: C.muted }, '1'),
        S('text', { x: X1, y: Y0 + 18, 'text-anchor': 'end', 'font-size': 11, fill: C.muted }, T(`étape ${o.length - 1}`, `step ${o.length - 1}`)),
      );
      line.setAttribute('points', o.slice(0, k + 1).map((v, i) => `${xs(i)},${ys(v)}`).join(' '));
      dots.replaceChildren();
      if (o.length <= 130) o.slice(0, k + 1).forEach((v, i) => dots.append(S('circle', { cx: xs(i), cy: ys(v), r: 3.2, fill: v % 2 ? C.accent : C.primary })));
      const mi = o.indexOf(max);
      if (mi <= k && max > n) {
        peak.setAttribute('x', String(Math.min(X1 - 30, Math.max(X0 + 20, xs(mi)))));
        peak.setAttribute('y', String(ys(max) - 8));
        peak.textContent = String(max);
      } else peak.textContent = '';
      const done = k === o.length - 1;
      fig.say(
        done
          ? T(`n = ${n} : on atteint 1 après ${o.length - 1} étapes, en passant par un maximum de ${max}.`, `n = ${n}: we reach 1 after ${o.length - 1} steps, with a maximum of ${max}.`)
          : T(`n = ${n} : étape ${k}, valeur ${o[k]} (${o[k] % 2 ? 'impair → 3n+1' : 'pair → n/2'}).`, `n = ${n}: step ${k}, value ${o[k]} (${o[k] % 2 ? 'odd → 3n+1' : 'even → n/2'}).`),
      );
    };

    const play = async () => {
      const alive = run.token();
      const len = orbit(n).length - 1;
      await tween(Math.min(7000, 250 + len * 55), (t) => alive() && draw(ease(t) * len));
    };
    const s = fig.range('n', 1, 200, n, 1, (v) => {
      run.next();
      n = v;
      draw(Infinity);
    });
    fig.btn(T('▶ Suivre la trajectoire', '▶ Follow the trajectory'), play, true);
    fig.btn(T('Un autre départ', 'Another start'), () => {
      run.next();
      n = 1 + Math.floor(Math.random() * 200);
      s.set(n);
      void play();
    });
    draw(Infinity);
  },
};
