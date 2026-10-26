import { C, S, ease, runner, sleep, tween, at, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Récurrence : les dominos tombent un à un (initialisation : le premier tombe ;
 * hérédité : si le k-ième tombe, il fait tomber le suivant). À chaque chute, une
 * marche s'ajoute à l'escalier 1 + 2 + … + n ; deux escaliers forment un rectangle n × (n+1).
 */

const DOM_W = 18;
const DOM_H = 62;
const BASE_Y = 98;

export const figure: FicheFigure = {
  size: [640, 330],
  label: {
    fr: 'Une file de dominos qui tombent l’un après l’autre, et un escalier dont chaque marche s’ajoute à la précédente : deux escaliers forment un rectangle n sur n+1.',
    en: 'A row of dominoes falling one after another, and a staircase where each step adds to the previous: two staircases make an n by n+1 rectangle.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let n = 8;
    let fallen = 0; // nombre de dominos tombés (entier) — l'escalier suit
    let flip = 0; // 0 → 1 : la copie retournée de l'escalier vient former le rectangle
    const doms = S('g');
    const stairs = S('g');
    const text = S('text', { x: 24, y: 318, 'font-size': 15, 'font-weight': 700, fill: C.ink });
    svg.append(doms, stairs, text);

    const xOf = (k: number) => 44 + (k - 1) * Math.min(56, 540 / n);

    /** Dessine les dominos ; `angle(k)` donne l'inclinaison (0 = debout, 90 = tombé) du k-ième. */
    const drawDoms = (angle: (k: number) => number, current: number) => {
      doms.replaceChildren(S('line', { x1: 14, y1: BASE_Y, x2: 626, y2: BASE_Y, stroke: C.line, 'stroke-width': 3 }));
      for (let k = 1; k <= n; k++) {
        const a = angle(k);
        const g = S('g', {}, S('rect', { x: -DOM_W / 2, y: -DOM_H, width: DOM_W, height: DOM_H, rx: 3, fill: a > 5 ? C.primary : C.surface, stroke: k === current ? C.accent : C.primary, 'stroke-width': k === current ? 3.5 : 2 }));
        const tx = S('text', { y: -DOM_H / 2 + 4, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: a > 5 ? '#fff' : C.ink }, `P${k}`);
        g.append(tx);
        // pivot sur le bord droit de la base : le domino bascule vers la droite
        at(g, xOf(k) + DOM_W / 2, BASE_Y, a);
        g.firstElementChild!.setAttribute('x', String(-DOM_W));
        tx.setAttribute('x', String(-DOM_W / 2));
        doms.append(g);
      }
    };

    /** Escalier : marches 1..m dessinées en bas à gauche ; `flip` fait apparaître la copie retournée. */
    const drawStairs = (m: number, f: number) => {
      stairs.replaceChildren();
      const cell = Math.min(20, 190 / (n + 1));
      const x0 = 24;
      const y0 = 305;
      for (let i = 1; i <= m; i++)
        for (let j = 0; j < i; j++)
          stairs.append(S('rect', { x: x0 + j * cell, y: y0 - 28 - i * cell, width: cell - 1.5, height: cell - 1.5, rx: 2, fill: C.primary, opacity: i === m && m === fallen ? 1 : 0.85 }));
      if (f > 0)
        for (let i = 1; i <= m; i++)
          for (let j = i; j < n + 1; j++) {
            stairs.append(S('rect', { x: x0 + j * cell, y: y0 - 28 - i * cell, width: cell - 1.5, height: cell - 1.5, rx: 2, fill: C.accent, opacity: f * 0.85 }));
          }
      const sum = (m * (m + 1)) / 2;
      const right = x0 + (n + 1) * cell + 26;
      stairs.append(
        S('text', { x: right, y: 150 + 62, 'font-size': 14, fill: C.muted }, T('Somme des marches', 'Sum of the steps')),
        S('text', { x: right, y: 150 + 90, 'font-size': 22, 'font-weight': 800, fill: C.primary }, m ? Array.from({ length: Math.min(m, 6) }, (_, i) => i + 1).join(' + ') + (m > 6 ? ' + … + ' + m : '') + ` = ${sum}` : '0'),
      );
      if (f > 0.99 && m === n)
        stairs.append(
          S('text', { x: right, y: 150 + 126, 'font-size': 15, fill: C.ink }, T(`Deux escaliers = rectangle ${n} × ${n + 1} = ${n * (n + 1)}`, `Two staircases = ${n} × ${n + 1} rectangle = ${n * (n + 1)}`)),
          S('text', { x: right, y: 150 + 152, 'font-size': 18, 'font-weight': 800, fill: C.accent }, `1 + … + ${n} = ${n}(${n + 1})/2 = ${(n * (n + 1)) / 2}`),
        );
    };

    const showAll = () => {
      drawDoms((k) => (k <= fallen ? 80 : 0), fallen + 1);
      drawStairs(fallen, flip);
      text.textContent = '';
    };
    const reset = () => {
      run.next();
      fallen = 0;
      flip = 0;
      showAll();
      fig.say(T('Appuie sur « Lancer » : initialisation (le premier domino tombe), puis hérédité (chaque domino fait tomber le suivant).', 'Press “Start”: base case (the first domino falls), then inductive step (each domino knocks over the next).'));
    };

    const fall = async (k: number, alive: () => boolean) => {
      await tween(k === 1 ? 520 : 380, (t) => alive() && drawDoms((i) => (i < k ? 80 : i === k ? 80 * ease(t) : 0), k));
      fallen = k;
      if (alive()) drawStairs(fallen, 0);
    };

    const start = async () => {
      reset();
      const alive = run.token();
      fig.say(T('Initialisation : P(1) est vraie — le premier domino tombe.', 'Base case: P(1) is true — the first domino falls.'));
      await fall(1, alive);
      for (let k = 2; k <= n && alive(); k++) {
        fig.say(T(`Hérédité : P(${k - 1}) vraie ⇒ P(${k}) vraie — la marche ${k} s’ajoute (+ ${k}).`, `Inductive step: P(${k - 1}) true ⇒ P(${k}) true — step ${k} is added (+ ${k}).`));
        await sleep(250);
        if (!alive()) return;
        await fall(k, alive);
      }
      if (!alive()) return;
      fig.say(T(`Les ${n} dominos sont tombés. Avec une file sans fin, l’initialisation et l’hérédité donnent P(n) pour tout n ≥ 1. Retourne l’escalier pour voir pourquoi la somme vaut n(n+1)/2.`, `All ${n} dominoes have fallen. With an endless row, the base case and the inductive step give P(n) for every n ≥ 1. Flip the staircase to see why the sum is n(n+1)/2.`));
    };

    fig.btn(T('▶ Lancer', '▶ Start'), start, true);
    fig.btn(T('Retourner l’escalier', 'Flip the staircase'), async () => {
      const alive = run.token();
      if (fallen < n) {
        fallen = n;
        drawDoms(() => 80, n + 1);
      }
      flip = 0;
      await tween(1400, (t) => {
        if (!alive()) return;
        flip = t;
        drawStairs(n, flip);
      });
      if (alive()) fig.say(T(`La copie retournée complète l’escalier en un rectangle ${n} × ${n + 1} : il y a deux fois plus de carrés que la somme, donc 1 + … + ${n} = ${n}(${n + 1})/2.`, `The flipped copy completes the staircase into an ${n} × ${n + 1} rectangle: twice as many squares as the sum, so 1 + … + ${n} = ${n}(${n + 1})/2.`));
    });
    fig.btn(T('Recommencer', 'Reset'), reset);
    fig.range('n', 2, 12, n, 1, (v) => {
      n = v;
      reset();
    });
    reset();
  },
};
