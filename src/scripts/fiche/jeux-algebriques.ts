import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Le dernier coefficient décide : on joue P(x) = x³ + a·x² + b·x + c. Tu choisis a et b ;
 * l'adversaire, qui joue en dernier, choisit c pour que −1 soit racine. En x = −1, chaque
 * coefficient pèse ±1 : P(−1) = −1 + a − b + c, donc c = 1 − a + b suffit toujours.
 */

const W = 360;
const H = 210;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Un polynôme du troisième degré dont tu choisis deux coefficients ; le dernier coefficient, choisi par l’adversaire, fait de −1 une racine.',
    en: 'A cubic polynomial where you choose two coefficients; the last coefficient, chosen by the opponent, makes −1 a root.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    let a = 2;
    let b = -3;
    const ligne = S('text', { x: W / 2, y: 60, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: C.ink });
    const eval1 = S('text', { x: W / 2, y: 110, 'text-anchor': 'middle', 'font-size': 14, fill: C.muted });
    const eval2 = S('text', { x: W / 2, y: 140, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: C.primary });
    const poids = S('text', { x: W / 2, y: 182, 'text-anchor': 'middle', 'font-size': 12, fill: C.muted });
    fig.svg.append(S('text', { x: W / 2, y: 24, 'text-anchor': 'middle', 'font-size': 13, fill: C.muted }, T('toi : a et b · l’adversaire : c', 'you: a and b · opponent: c')), ligne, eval1, eval2, poids);
    const sg = (v: number) => (v < 0 ? `− ${-v}` : `+ ${v}`);

    const render = () => {
      const c = 1 - a + b;
      ligne.textContent = `x³ ${sg(a)}x² ${sg(b)}x ${sg(c)}`;
      eval1.textContent = `P(−1) = −1 ${sg(a)} ${b <= 0 ? `+ ${-b}` : `− ${b}`} ${sg(c)}`;
      eval2.textContent = `P(−1) = ${-1 + a - b + c}`;
      poids.textContent = T('en x = −1, les poids des coefficients sont −1, +1, −1, +1', 'at x = −1 the coefficient weights are −1, +1, −1, +1');
      fig.say(T(`L’adversaire joue c = 1 − a + b = ${c} : −1 est racine, quels que soient a et b.`, `The opponent plays c = 1 − a + b = ${c}: −1 is a root, whatever a and b are.`));
    };
    fig.range('a', -5, 5, a, 1, (v) => {
      a = v;
      render();
    });
    fig.range('b', -5, 5, b, 1, (v) => {
      b = v;
      render();
    });
    render();
  },
};
