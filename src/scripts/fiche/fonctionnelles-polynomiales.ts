import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Tableau des différences : sous les valeurs P(0), P(1), …, P(6), on écrit les différences
 * P(x+1) − P(x), puis les différences de ces différences… Pour un polynôme de degré m, la
 * m-ième ligne est constante et la suivante est nulle : chaque différence baisse le degré de 1.
 */

const W = 360;
const H = 240;
const N = 7;
const CW = 44;
const X0 = 58;
const Y0 = 50;
const LH = 34;

const POLYS: { nom: string; deg: number; f: (x: number) => number }[] = [
  { nom: 'x³', deg: 3, f: (x) => x * x * x },
  { nom: '2x² − x', deg: 2, f: (x) => 2 * x * x - x },
  { nom: 'x³ − 3x', deg: 3, f: (x) => x * x * x - 3 * x },
  { nom: '5x + 2', deg: 1, f: (x) => 5 * x + 2 },
];

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Tableau des différences successives des valeurs d’un polynôme : la ligne numéro m est constante pour un polynôme de degré m.',
    en: 'Table of successive differences of a polynomial’s values: row number m is constant for a degree-m polynomial.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    let p = 0;
    const g = S('g');
    fig.svg.append(g);
    const render = () => {
      const P = POLYS[p];
      g.replaceChildren(S('text', { x: W / 2, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink }, `P(x) = ${P.nom}`));
      let ligne = Array.from({ length: N }, (_, x) => P.f(x));
      for (let r = 0; r <= 4 && ligne.length; r++) {
        const y = Y0 + r * LH;
        g.append(S('text', { x: 8, y: y + 4, 'font-size': 11, 'font-weight': 700, fill: C.muted }, r === 0 ? 'P(x)' : `Δ${r === 1 ? '' : r}`));
        const constante = ligne.every((v) => v === ligne[0]);
        ligne.forEach((v, i) => {
          const x = X0 + i * CW + (r * CW) / 2;
          g.append(S('text', { x, y: y + 4, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': constante ? 700 : 500, fill: constante ? (v === 0 ? C.muted : C.accent) : C.ink }, String(v)));
        });
        ligne = ligne.slice(1).map((v, i) => v - ligne[i]);
      }
      fig.say(T(`Degré ${P.deg} : la ligne Δ${P.deg === 1 ? '' : P.deg} est constante et la suivante est nulle. Chaque différence P(x+1) − P(x) baisse le degré de 1.`, `Degree ${P.deg}: row Δ${P.deg === 1 ? '' : P.deg} is constant and the next one is zero. Each difference P(x+1) − P(x) lowers the degree by 1.`));
    };
    POLYS.forEach((P, i) => fig.btn(P.nom, () => {
      p = i;
      render();
    }, i === 0));
    render();
  },
};
