import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Pourquoi rationaliser : l'ordinateur calcule avec environ 16 chiffres significatifs. Pour
 * √(n + 1) − √n avec n = 10^k, la soustraction de deux nombres très proches perd tous ces
 * chiffres quand k grandit ; la forme conjuguée 1 / (√(n + 1) + √n) reste exacte.
 * (La fiche traite √(n² + 1) − n de la même façon.)
 */

const W = 360;
const H = 260;
const K = 16;
const BX = 40;
const BW = (W - BX - 12) / K;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Pour n = 10, 100, …, 10¹⁶, l’erreur commise par l’ordinateur sur √(n+1) − √n calculé directement, comparée à la forme conjuguée.',
    en: 'For n = 10, 100, …, 10¹⁶, the computer’s error on √(n+1) − √n computed directly, compared with the conjugate form.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    let k = 8;
    const barres = S('g');
    const titre = S('text', { x: W / 2, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink }, '√(n+1) − √n');
    fig.svg.append(titre, barres, S('line', { x1: BX, y1: 200, x2: W - 10, y2: 200, stroke: C.line, 'stroke-width': 1.5 }));

    /** Nombre de chiffres justes du calcul direct (0 à 16), la forme conjuguée servant de référence. */
    const justes = (e: number) => {
      const n = Math.pow(10, e);
      const direct = Math.sqrt(n + 1) - Math.sqrt(n);
      const conj = 1 / (Math.sqrt(n + 1) + Math.sqrt(n));
      const rel = Math.abs(direct - conj) / conj;
      return { direct, conj, ch: rel === 0 ? 16 : Math.max(0, Math.min(16, -Math.log10(rel))) };
    };

    const render = () => {
      barres.replaceChildren();
      for (let e = 1; e <= K; e++) {
        const { ch } = justes(e);
        const h = (ch / 16) * 150;
        const x = BX + (e - 1) * BW;
        barres.append(
          S('rect', { x: x + 2, y: 200 - h, width: BW - 4, height: Math.max(h, 1), rx: 2, fill: e === k ? C.accent : C.primary, opacity: e === k ? 1 : 0.7 }),
          S('text', { x: x + BW / 2, y: 214, 'text-anchor': 'middle', 'font-size': 9, fill: C.muted }, String(e)),
        );
      }
      barres.append(
        S('text', { x: BX - 6, y: 54, 'text-anchor': 'end', 'font-size': 10, fill: C.muted }, '16'),
        S('text', { x: BX - 6, y: 203, 'text-anchor': 'end', 'font-size': 10, fill: C.muted }, '0'),
        S('text', { x: W / 2, y: 236, 'text-anchor': 'middle', 'font-size': 11, fill: C.muted }, T('k (n = 10^k) · hauteur = chiffres justes du calcul direct', 'k (n = 10^k) · height = correct digits of the direct computation')),
      );
      const { direct, conj, ch } = justes(k);
      fig.say(
        T(
          `n = 10^${k} : direct ${direct.toPrecision(6)}, conjugué 1/(√(n+1)+√n) = ${conj.toPrecision(6)} ; le calcul direct garde environ ${Math.round(ch)} chiffre(s) juste(s) sur 16.`,
          `n = 10^${k}: direct ${direct.toPrecision(6)}, conjugate 1/(√(n+1)+√n) = ${conj.toPrecision(6)}; the direct computation keeps about ${Math.round(ch)} correct digit(s) out of 16.`,
        ),
      );
    };
    fig.range('k', 1, K, k, 1, (v) => {
      k = v;
      render();
    });
    render();
  },
};
