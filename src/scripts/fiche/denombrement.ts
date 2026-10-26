import { C, S, ease, runner, sleep, tween, at, type Fig } from './core';
import type { FicheFigure } from './index';
import { binom } from '../lab/core';

/**
 * Dénombrement : n objets distincts. On les range (n!), on en choisit k (C(n,k)),
 * on parcourt tous les sous-ensembles (2^n).
 */

const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];

export const figure: FicheFigure = {
  size: [640, 230],
  label: {
    fr: 'Des jetons colorés : on les range dans un autre ordre, on en sélectionne, on parcourt tous les sous-ensembles.',
    en: 'Coloured tokens: reorder them, select some, run through every subset.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    let n = 5;
    let sel: boolean[] = [];
    let slot: number[] = []; // slot[i] = position actuelle (fractionnaire pendant l'animation) du jeton i
    let tokens: SVGGElement[] = [];
    const layer = S('g');
    const info = S('g');
    fig.svg.append(layer, info);
    const xOf = (p: number) => 320 + (p - (n - 1) / 2) * 76;

    const refresh = (note = '') => {
      tokens.forEach((g, i) => {
        at(g, xOf(slot[i]), 70);
        g.querySelector('circle')!.setAttribute('stroke-width', sel[i] ? '5' : '2');
        g.querySelector('circle')!.style.setProperty('stroke', sel[i] ? C.ink : C.line);
        g.setAttribute('opacity', sel.some(Boolean) && !sel[i] ? '0.45' : '1');
      });
      const k = sel.filter(Boolean).length;
      const rows: [string, string][] = [
        [T('Ranger les ' + n + ' jetons', 'Arrange the ' + n + ' tokens'), Array.from({ length: n }, (_, i) => n - i).join(' × ') + ' = ' + n + '! = ' + fact(n)],
        [T(`Choisir ${k} jeton${k > 1 ? 's' : ''} parmi ${n}`, `Choose ${k} token${k > 1 ? 's' : ''} out of ${n}`), `C(${n}, ${k}) = ${n}! / (${k}! × ${n - k}!) = ${binom(n, k)}`],
        [T('Sous-ensembles possibles', 'Possible subsets'), `2 × … × 2 (${n} fois) = 2^${n} = ${2 ** n}`],
      ];
      info.replaceChildren(
        ...rows.flatMap(([a, b], i) => [
          S('text', { x: 30, y: 148 + i * 26, 'font-size': 13.5, fill: C.muted }, a),
          S('text', { x: 300, y: 148 + i * 26, 'font-size': 14, 'font-weight': 700, fill: C.ink }, b),
        ]),
      );
      fig.say(note || T('Clique sur des jetons pour les choisir : le nombre de choix possibles C(n, k) s’affiche.', 'Click tokens to choose them: the number of possible choices C(n, k) is shown.'));
    };

    const build = () => {
      run.next();
      sel = Array(n).fill(false);
      slot = Array.from({ length: n }, (_, i) => i);
      layer.replaceChildren();
      tokens = Array.from({ length: n }, (_, i) => {
        const c = S('circle', { r: 26, fill: COLORS[i], stroke: C.line, 'stroke-width': 2, style: 'cursor:pointer' });
        const t = S('text', { y: 6, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: '#fff', 'pointer-events': 'none' }, String.fromCharCode(65 + i));
        const g = S('g', { tabindex: 0, role: 'button', 'aria-label': T('jeton ', 'token ') + String.fromCharCode(65 + i) }, c, t);
        const toggle = () => {
          run.next();
          sel[i] = !sel[i];
          refresh();
        };
        g.addEventListener('click', toggle);
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });
        layer.append(g);
        return g;
      });
      refresh();
    };

    fig.range(T('objets n', 'objects n'), 2, 7, n, 1, (v) => {
      n = v;
      build();
    });
    fig.btn(T('🔀 Ranger autrement', '🔀 Rearrange'), async () => {
      const alive = run.token();
      const from = [...slot];
      const to = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
      await tween(700, (t) => {
        if (!alive()) return;
        slot = from.map((a, i) => a + (to[i] - a) * ease(t));
        refresh(T('Un nouveau rangement : ' + n + ' choix pour la 1re place, puis ' + Math.max(n - 1, 1) + ', …', 'A new arrangement: ' + n + ' choices for the 1st place, then ' + Math.max(n - 1, 1) + ', …'));
      });
    }, true);
    fig.btn(T('Parcourir les 2ⁿ sous-ensembles', 'Run through the 2ⁿ subsets'), async () => {
      const alive = run.token();
      for (let m = 0; m < 2 ** n && alive(); m++) {
        sel = Array.from({ length: n }, (_, i) => Boolean((m >> i) & 1));
        refresh(T(`Sous-ensemble n° ${m + 1} sur ${2 ** n} : chaque jeton est « dedans » ou « dehors » (2 choix), donc 2^${n}.`, `Subset ${m + 1} of ${2 ** n}: each token is “in” or “out” (2 choices), hence 2^${n}.`));
        await sleep(m < 8 ? 280 : 90);
      }
    });
    fig.btn(T('Effacer', 'Clear'), () => {
      run.next();
      sel = sel.map(() => false);
      refresh();
    });
    build();
  },
};
