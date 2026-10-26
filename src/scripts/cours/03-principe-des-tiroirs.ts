import { C, S, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';

/**
 * Chapitre 3 — « La difficulté est de choisir les tiroirs. » On choisit n + 1 nombres parmi
 * 1, …, 2n : deux sont-ils toujours consécutifs ? L'élève essaie ; les tiroirs ne sont
 * montrés que s'il le demande.
 */

const CELL = 46;

export const figure: FicheFigure = {
  size: [640, 190],
  label: {
    fr: 'Les nombres de 1 à 2n : on en choisit n + 1 en cliquant, et on cherche deux nombres consécutifs.',
    en: 'The numbers from 1 to 2n: choose n + 1 by clicking, looking for two consecutive numbers.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    let n = 6;
    let chosen = new Set<number>();
    let showDrawers = false;
    const layer = S('g');
    svg.append(layer);

    const x = (v: number) => (640 - 2 * n * CELL) / 2 + (v - 1) * CELL + CELL / 2;
    const consecutive = (): [number, number] | null => {
      const l = [...chosen].sort((a, b) => a - b);
      for (let i = 0; i + 1 < l.length; i++) if (l[i + 1] === l[i] + 1) return [l[i], l[i + 1]];
      return null;
    };

    const render = () => {
      layer.replaceChildren();
      const pair = consecutive();
      if (showDrawers) {
        for (let k = 1; k <= n; k++) {
          const full = chosen.has(2 * k - 1) && chosen.has(2 * k);
          layer.append(S('rect', { x: x(2 * k - 1) - CELL / 2 + 2, y: 40, width: 2 * CELL - 4, height: 76, rx: 12, fill: full ? 'rgba(220,38,38,0.12)' : C.none, stroke: full ? C.accent : C.muted, 'stroke-width': full ? 3.5 : 2, 'stroke-dasharray': full ? '0' : '6 4' }));
        }
      }
      for (let v = 1; v <= 2 * n; v++) {
        const on = chosen.has(v);
        const g = S('g', { tabindex: 0, role: 'checkbox', 'aria-checked': String(on), 'aria-label': String(v), style: 'cursor:pointer;outline:none' });
        g.append(
          S('circle', { cx: x(v), cy: 78, r: 17, fill: on ? C.primary : C.surface, stroke: on ? C.primary : C.line, 'stroke-width': 2.5 }),
          S('text', { x: x(v), y: 83, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: on ? '#fff' : C.ink, 'pointer-events': 'none' }, String(v)),
        );
        const toggle = () => {
          if (on) chosen.delete(v);
          else chosen.add(v);
          render();
        };
        g.addEventListener('click', toggle);
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });
        layer.append(g);
      }
      layer.append(S('text', { x: 320, y: 24, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink }, T(`${chosen.size} nombre${chosen.size > 1 ? 's' : ''} choisi${chosen.size > 1 ? 's' : ''} sur ${n + 1} demandés`, `${chosen.size} number${chosen.size > 1 ? 's' : ''} chosen out of ${n + 1} requested`)));
      if (pair) layer.append(S('path', { d: `M${x(pair[0])} 104 q${(x(pair[1]) - x(pair[0])) / 2} 22 ${x(pair[1]) - x(pair[0])} 0`, fill: C.none, stroke: C.accent, 'stroke-width': 3 }));
      fig.say(
        pair
          ? T(`${pair[0]} et ${pair[1]} sont consécutifs !` + (chosen.size >= n + 1 ? ' Et ce sera toujours le cas dès que l’on choisit n + 1 nombres. Pourquoi ? Montre les tiroirs.' : ' Peux-tu en choisir n + 1 sans que cela arrive ?'), `${pair[0]} and ${pair[1]} are consecutive!` + (chosen.size >= n + 1 ? ' And it will always happen once n + 1 numbers are chosen. Why? Show the drawers.' : ' Can you choose n + 1 without this happening?'))
          : chosen.size === 0
            ? T(`Choisis ${n + 1} nombres parmi 1, …, ${2 * n} en évitant deux nombres consécutifs, si tu y arrives.`, `Choose ${n + 1} numbers among 1, …, ${2 * n} while avoiding two consecutive ones, if you can.`)
            : T(`Aucun couple consécutif pour l’instant (${chosen.size} choisis, il en faut ${n + 1}).`, `No consecutive pair yet (${chosen.size} chosen, ${n + 1} needed).`),
      );
    };

    fig.range('n', 3, 10, n, 1, (v) => {
      n = v;
      chosen = new Set();
      showDrawers = false;
      render();
    });
    fig.btn(T('Montrer les tiroirs', 'Show the drawers'), () => {
      showDrawers = !showDrawers;
      render();
    }, true);
    fig.btn(T('Choisir au hasard', 'Pick at random'), () => {
      chosen = new Set();
      while (chosen.size < n + 1) chosen.add(1 + Math.floor(Math.random() * 2 * n));
      render();
    });
    fig.btn(T('Effacer', 'Clear'), () => {
      chosen = new Set();
      render();
    });
    render();
  },
};
