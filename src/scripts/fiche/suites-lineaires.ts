import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * a(n+2) = p·a(n+1) + q·a(n) : les premiers termes en barres et le quotient a(n+1)/a(n),
 * qui se rapproche de la plus grande racine r₁ de r² = p·r + q (le nombre d'or pour Fibonacci),
 * quels que soient les deux termes de départ (positifs).
 */

const W = 360;
const H = 330;
const N = 12;
const BX = 34;
const BW = (W - BX - 14) / N;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Les douze premiers termes d’une suite récurrente linéaire en barres, et le quotient de deux termes consécutifs qui se rapproche de la racine de l’équation caractéristique.',
    en: 'The first twelve terms of a linear recurrence as bars, and the ratio of consecutive terms approaching the root of the characteristic equation.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    let p = 1;
    let q = 1;
    let a0 = 1;
    let a1 = 1;
    const barres = S('g');
    const ratio = S('path', { fill: C.none, stroke: C.accent, 'stroke-width': 2.5 });
    const cible = S('line', { stroke: C.primary, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
    const cibleTxt = S('text', { 'font-size': 12, 'font-weight': 700, fill: C.primary });
    const titre = S('text', { x: W / 2, y: 20, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink });
    const sous = S('text', { x: BX, y: 196, 'font-size': 12, fill: C.muted });
    fig.svg.append(
      titre,
      barres,
      S('line', { x1: BX, y1: 170, x2: W - 10, y2: 170, stroke: C.line, 'stroke-width': 1.5 }),
      sous,
      S('line', { x1: BX, y1: 310, x2: W - 10, y2: 310, stroke: C.line, 'stroke-width': 1.5 }),
      cible,
      cibleTxt,
      ratio,
    );

    const render = () => {
      const a = [a0, a1];
      for (let n = 2; n < N; n++) a.push(p * a[n - 1] + q * a[n - 2]);
      const r1 = (p + Math.sqrt(p * p + 4 * q)) / 2;
      titre.textContent = `a(n+2) = ${p}·a(n+1) + ${q}·a(n)`;
      const top = Math.max(...a);
      barres.replaceChildren();
      a.forEach((v, i) => {
        const h = (v / top) * 130;
        const x = BX + i * BW;
        barres.append(S('rect', { x: x + 2, y: 170 - h, width: BW - 4, height: h, rx: 3, fill: i < 2 ? C.accent : C.primary }));
        if (i < 2 || i === N - 1) barres.append(S('text', { x: x + BW / 2, y: 165 - h, 'text-anchor': 'middle', 'font-size': 10, fill: C.ink }, String(v)));
      });
      // Quotients a(n+1)/a(n) entre 1 et 4 (y de 310 à 210).
      const Yr = (r: number) => 310 - ((Math.min(Math.max(r, 1), 4) - 1) / 3) * 100;
      let d = '';
      for (let n = 0; n < N - 1; n++) d += `${n ? 'L' : 'M'}${(BX + (n + 1) * BW).toFixed(1)} ${Yr(a[n + 1] / a[n]).toFixed(1)}`;
      ratio.setAttribute('d', d);
      setLine(cible, BX, Yr(r1), W - 10, Yr(r1));
      cibleTxt.setAttribute('x', String(BX + 2));
      cibleTxt.setAttribute('y', String(Yr(r1) - 5));
      cibleTxt.textContent = `r₁ ≈ ${r1.toFixed(4)}`;
      sous.textContent = T('quotient a(n+1) / a(n)', 'ratio a(n+1) / a(n)');
      const last = a[N - 1] / a[N - 2];
      fig.say(
        T(
          `Équation caractéristique r² = ${p}r + ${q} ; sa plus grande racine est r₁ = (${p} + √${p * p + 4 * q})/2 ≈ ${r1.toFixed(6)}. Ici a(11)/a(10) ≈ ${last.toFixed(6)}.`,
          `Characteristic equation r² = ${p}r + ${q}; its largest root is r₁ = (${p} + √${p * p + 4 * q})/2 ≈ ${r1.toFixed(6)}. Here a(11)/a(10) ≈ ${last.toFixed(6)}.`,
        ),
      );
    };
    const setLine = (l: SVGLineElement, x1: number, y1: number, x2: number, y2: number) => {
      l.setAttribute('x1', String(x1));
      l.setAttribute('y1', String(y1));
      l.setAttribute('x2', String(x2));
      l.setAttribute('y2', String(y2));
    };

    fig.range('p', 1, 3, p, 1, (v) => { p = v; render(); });
    fig.range('q', 1, 3, q, 1, (v) => { q = v; render(); });
    fig.range('a(0)', 1, 9, a0, 1, (v) => { a0 = v; render(); });
    fig.range('a(1)', 1, 9, a1, 1, (v) => { a1 = v; render(); });
    render();
  },
};
