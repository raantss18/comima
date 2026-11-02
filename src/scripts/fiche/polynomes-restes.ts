import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Pour P à coefficients entiers, u − v divise P(u) − P(v) : les restes de P(n) modulo m ne
 * dépendent que du reste de n modulo m. On colore P(n) mod m pour n = 0…23 ; les bandes de
 * m colonnes se répètent à l'identique.
 */

const W = 360;
const N = 24;
const COLS = 8;
const CELL = 40;
const X0 = (W - COLS * CELL) / 2;
const Y0 = 46;
const H = Y0 + (N / COLS) * (CELL + 16) + 14;

const POLYS: { nom: string; f: (n: number) => number }[] = [
  { nom: 'n² + 1', f: (n) => n * n + 1 },
  { nom: 'n³ − n', f: (n) => n * n * n - n },
  { nom: 'n² + n + 1', f: (n) => n * n + n + 1 },
];

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Les restes de P(n) modulo m pour n de 0 à 23 : ils se répètent avec une période m.',
    en: 'The remainders of P(n) modulo m for n from 0 to 23: they repeat with period m.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    let m = 5;
    let p = 0;
    const titre = S('text', { x: W / 2, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink });
    const grille = S('g');
    fig.svg.append(titre, grille);

    const render = () => {
      const P = POLYS[p];
      titre.textContent = T(`P(n) = ${P.nom}, reste modulo ${m}`, `P(n) = ${P.nom}, remainder modulo ${m}`);
      grille.replaceChildren();
      const vus = new Set<number>();
      for (let n = 0; n < N; n++) {
        const x = X0 + (n % COLS) * CELL;
        const y = Y0 + Math.floor(n / COLS) * (CELL + 16);
        const r = ((P.f(n) % m) + m) % m;
        vus.add(r);
        const teinte = (r * 360) / m;
        grille.append(
          S('rect', { x: x + 3, y, width: CELL - 6, height: CELL - 6, rx: 7, fill: `hsl(${teinte}, 55%, 42%)`, opacity: Math.floor(n / m) % 2 ? 0.75 : 1 }),
          S('text', { x: x + CELL / 2, y: y + CELL / 2 + 2, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#fff' }, String(r)),
          S('text', { x: x + CELL / 2, y: y + CELL + 7, 'text-anchor': 'middle', 'font-size': 9, fill: C.muted }, `n=${n}`),
        );
      }
      const liste = [...vus].sort((a, b) => a - b).join(', ');
      fig.say(
        T(
          `Les restes se répètent tous les ${m} rangs, car n ≡ n' (mod ${m}) entraîne P(n) ≡ P(n') (mod ${m}). Restes atteints : {${liste}}${vus.has(0) ? '' : ` — jamais 0 : ${m} ne divise aucun P(n)`}.`,
          `The remainders repeat every ${m} places, because n ≡ n' (mod ${m}) implies P(n) ≡ P(n') (mod ${m}). Remainders reached: {${liste}}${vus.has(0) ? '' : ` — never 0: ${m} divides no P(n)`}.`,
        ),
      );
    };

    fig.range('m', 2, 9, m, 1, (v) => {
      m = v;
      render();
    });
    POLYS.forEach((P, i) => fig.btn(P.nom, () => {
      p = i;
      render();
    }, i === 0));
    render();
  },
};
