import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * L'application x ↦ 2x (mod 1) sur l'écriture binaire : multiplier par 2 décale la virgule,
 * on garde 2x si x < 1/2 et 2x − 1 sinon, ce qui retire le premier chiffre binaire. Pour une
 * fraction p/q, les chiffres finissent par se répéter.
 */

const W = 360;
const H = 220;
const D = 16;
const CW = 19;
const X0 = (W - D * CW) / 2;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Les seize premiers chiffres binaires d’une fraction p/q ; doubler retire le premier chiffre.',
    en: 'The first sixteen binary digits of a fraction p/q; doubling removes the first digit.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    let p = 1;
    let q = 5;
    let pas = 0; // nombre de doublements déjà faits
    const g = S('g');
    fig.svg.append(g);
    /** Chiffres binaires de p/q (0 ≤ p < q), calculés exactement avec les restes. */
    const chiffres = (num: number) => {
      const c: number[] = [];
      let r = num;
      for (let i = 0; i < D + 8; i++) {
        r *= 2;
        c.push(r >= q ? 1 : 0);
        if (r >= q) r -= q;
      }
      return c;
    };
    const render = () => {
      // Après `pas` doublements (mod 1), le numérateur est p·2^pas mod q.
      let num = p;
      for (let i = 0; i < pas; i++) num = (2 * num) % q;
      const c = chiffres(p);
      g.replaceChildren(
        S('text', { x: W / 2, y: 26, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink }, `x = ${p}/${q}`),
        S('text', { x: X0 - 22, y: 90, 'font-size': 15, 'font-weight': 700, fill: C.ink }, '0,'),
      );
      c.slice(0, D).forEach((d, i) => {
        const parti = i < pas;
        g.append(
          S('rect', { x: X0 + i * CW + 1, y: 70, width: CW - 2, height: 30, rx: 4, fill: parti ? C.surface : d ? C.primary : C.soft, opacity: parti ? 0.35 : 1 }),
          S('text', { x: X0 + i * CW + CW / 2, y: 91, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: parti ? C.muted : d ? '#fff' : C.ink }, String(d)),
        );
      });
      g.append(S('text', { x: W / 2, y: 140, 'text-anchor': 'middle', 'font-size': 14, fill: C.ink }, T(`après ${pas} doublement(s) : ${num}/${q}`, `after ${pas} doubling(s): ${num}/${q}`)));
      // Période : plus petite t > 0 avec 2^t ≡ 1 (mod q') une fois les facteurs 2 retirés.
      // On réduit p/q d'abord : 3/6 = 1/2 a une écriture finie.
      let ga = p;
      let gb = q;
      while (gb) [ga, gb] = [gb, ga % gb];
      let impair = q / ga;
      while (impair % 2 === 0) impair /= 2;
      let t = 1;
      let pw = 2 % impair;
      while (impair > 1 && pw !== 1 % impair && t < 64) {
        pw = (pw * 2) % impair;
        t++;
      }
      fig.say(
        impair === 1
          ? T(`${p}/${q} = ${p / ga}/${q / ga}, dénominateur puissance de 2 : l’écriture binaire s’arrête, puis ne contient que des 0.`, `${p}/${q} = ${p / ga}/${q / ga}, a power-of-2 denominator: the binary expansion stops, then contains only 0s.`)
          : T(`Les chiffres se répètent : le bloc qui revient a ${t} chiffre(s). Doubler (2x si x < 1/2, 2x − 1 sinon) retire le premier chiffre.`, `The digits repeat: the recurring block has ${t} digit(s). Doubling (2x if x < 1/2, 2x − 1 otherwise) removes the first digit.`),
      );
    };
    fig.range('p', 1, 15, p, 1, (v) => {
      p = Math.min(v, q - 1);
      pas = 0;
      render();
    });
    fig.range('q', 2, 16, q, 1, (v) => {
      q = v;
      if (p >= q) p = q - 1;
      pas = 0;
      render();
    });
    fig.btn(T('Doubler', 'Double'), () => {
      pas = Math.min(pas + 1, D - 1);
      render();
    }, true);
    fig.btn(T('Recommencer', 'Restart'), () => {
      pas = 0;
      render();
    });
    render();
  },
};
