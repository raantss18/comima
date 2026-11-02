import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Périodicité modulo m : la suite de Fibonacci réduite modulo m ne prend que m valeurs, et
 * chaque terme ne dépend que des deux précédents ; il n'y a que m² couples possibles, donc
 * la suite des restes finit par se répéter. On la suit sur une horloge à m cases.
 */

const W = 360;
const H = 330;
const CX = W / 2;
const CY = 170;
const R = 120;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Les restes de la suite de Fibonacci modulo m placés sur une horloge à m cases : le trajet finit par se refermer.',
    en: 'The remainders of the Fibonacci sequence modulo m on an m-hour clock: the path eventually closes up.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    let m = 7;
    const fond = S('g');
    const trajet = S('path', { fill: C.none, stroke: C.primary, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0.85 });
    const point = S('circle', { r: 7, fill: C.accent });
    const titre = S('text', { x: W / 2, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink });
    const liste = S('text', { x: W / 2, y: H - 12, 'text-anchor': 'middle', 'font-size': 11, fill: C.muted });
    fig.svg.append(titre, fond, trajet, point, liste);
    const pos = (k: number): [number, number] => {
      const a = -Math.PI / 2 + (2 * Math.PI * k) / m;
      return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
    };

    /** Restes F(0..) mod m jusqu'au retour du couple (0, 1) ; renvoie aussi la période. */
    const restes = () => {
      const r = [0, 1 % m];
      while (r.length < 2000) {
        const n = r.length;
        r.push((r[n - 1] + r[n - 2]) % m);
        if (r[r.length - 2] === 0 && r[r.length - 1] === 1 % m) break;
      }
      return { r, periode: r.length - 2 };
    };

    const cadran = () => {
      titre.textContent = T(`Fibonacci modulo ${m}`, `Fibonacci modulo ${m}`);
      fond.replaceChildren();
      fond.append(S('circle', { cx: CX, cy: CY, r: R, fill: C.none, stroke: C.line, 'stroke-width': 1.5 }));
      for (let k = 0; k < m; k++) {
        const [x, y] = pos(k);
        const [tx, ty] = [CX + (R + 16) * Math.cos(-Math.PI / 2 + (2 * Math.PI * k) / m), CY + (R + 16) * Math.sin(-Math.PI / 2 + (2 * Math.PI * k) / m)];
        fond.append(S('circle', { cx: x, cy: y, r: 3, fill: C.muted }));
        fond.append(S('text', { x: tx, y: ty + 4, 'text-anchor': 'middle', 'font-size': 11, fill: C.muted }, String(k)));
      }
    };

    const jouer = async (anime: boolean) => {
      const alive = run.token();
      cadran();
      const { r, periode } = restes();
      let d = '';
      for (let i = 0; i < r.length && alive(); i++) {
        const [x, y] = pos(r[i]);
        d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
        trajet.setAttribute('d', d);
        point.setAttribute('cx', String(x));
        point.setAttribute('cy', String(y));
        if (anime && i < 120) await sleep(140);
      }
      if (!alive()) return;
      const debut = r.slice(0, Math.min(r.length, 14)).join(', ');
      liste.textContent = `${debut}${r.length > 14 ? ', …' : ''}`;
      fig.say(
        T(
          `Le couple (0, 1) revient après ${periode} termes : modulo ${m}, la suite est périodique de période ${periode}. Il n’y a que ${m}² = ${m * m} couples de restes possibles, d’où la répétition.`,
          `The pair (0, 1) comes back after ${periode} terms: modulo ${m}, the sequence is periodic with period ${periode}. There are only ${m}² = ${m * m} possible pairs of remainders, hence the repetition.`,
        ),
      );
    };

    fig.range('m', 2, 12, m, 1, (v) => {
      m = v;
      jouer(false);
    });
    fig.btn(T('▶ Suivre la suite', '▶ Follow the sequence'), () => jouer(true), true);
    jouer(false);
  },
};
