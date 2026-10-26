import { C, S, runner, sleep, tween, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';

/**
 * Chapitre 5 — algorithme d'Euclide : on découpe un rectangle a × b en carrés, toujours les
 * plus grands possibles. Le dernier carré a pour côté pgcd(a, b) ; chaque découpe est une
 * division euclidienne.
 */

const COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];

interface Step {
  q: number;
  big: number;
  small: number;
  rem: number;
  squares: { x: number; y: number; s: number }[];
}

function steps(a: number, b: number): Step[] {
  const out: Step[] = [];
  let x = 0;
  let y = 0;
  let w = Math.max(a, b);
  let h = Math.min(a, b);
  while (h > 0 && w > 0) {
    const horizontal = w >= h;
    const big = horizontal ? w : h;
    const small = horizontal ? h : w;
    const q = Math.floor(big / small);
    const squares = Array.from({ length: q }, (_, i) => ({ x: horizontal ? x + i * small : x, y: horizontal ? y : y + i * small, s: small }));
    out.push({ q, big, small, rem: big - q * small, squares });
    if (horizontal) {
      x += q * small;
      w -= q * small;
    } else {
      y += q * small;
      h -= q * small;
    }
    if (big === q * small) break;
  }
  return out;
}

export const figure: FicheFigure = {
  size: [640, 290],
  label: {
    fr: 'Un rectangle a sur b découpé en carrés de plus en plus petits : le dernier carré a pour côté le pgcd.',
    en: 'An a by b rectangle cut into ever smaller squares: the last square has side gcd.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let a = 48;
    let b = 18;
    const layer = S('g');
    svg.append(layer);

    const render = (shown: number, grow = 1) => {
      const st = steps(a, b);
      const W = Math.max(a, b);
      const H = Math.min(a, b);
      const u = Math.min(380 / W, 250 / H);
      const ox = 20;
      const oy = 20;
      layer.replaceChildren(S('rect', { x: ox, y: oy, width: W * u, height: H * u, fill: C.none, stroke: C.ink, 'stroke-width': 2 }));
      st.forEach((s, i) => {
        if (i > shown) return;
        const sc = i === shown ? grow : 1;
        s.squares.forEach((q) => {
          const side = q.s * u;
          const last = i === st.length - 1;
          layer.append(S('rect', { x: ox + q.x * u + (side * (1 - sc)) / 2, y: oy + q.y * u + (side * (1 - sc)) / 2, width: side * sc, height: side * sc, fill: last ? C.accent : COLORS[i % COLORS.length], opacity: last ? 0.95 : 0.78, stroke: C.surface, 'stroke-width': 1.5 }));
          if (side * sc > 18) layer.append(S('text', { x: ox + q.x * u + side / 2, y: oy + q.y * u + side / 2 + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#fff', opacity: sc }, String(q.s)));
        });
      });
      const rx = 430;
      layer.append(S('text', { x: rx, y: 34, 'font-size': 13, fill: C.muted }, T('Divisions euclidiennes', 'Euclidean divisions')));
      st.forEach((s, i) => {
        if (i > shown) return;
        layer.append(S('text', { x: rx, y: 64 + i * 26, 'font-size': 14, 'font-weight': 700, fill: i === st.length - 1 ? C.accent : C.ink }, `${s.big} = ${s.small} × ${s.q} + ${s.rem}`));
      });
      if (shown >= st.length - 1) {
        const g = st[st.length - 1].small;
        layer.append(S('text', { x: rx, y: 64 + st.length * 26 + 14, 'font-size': 18, 'font-weight': 800, fill: C.accent }, `pgcd(${a}, ${b}) = ${g}`));
      }
    };

    const play = async () => {
      const alive = run.token();
      const st = steps(a, b);
      for (let i = 0; i < st.length && alive(); i++) {
        await tween(700, (t) => alive() && render(i, t));
        fig.say(T(`On retire ${st[i].q} carré${st[i].q > 1 ? 's' : ''} de côté ${st[i].small}` + (st[i].rem ? ` ; il reste une bande de largeur ${st[i].rem}.` : ' : il ne reste rien.'), `We remove ${st[i].q} square${st[i].q > 1 ? 's' : ''} of side ${st[i].small}` + (st[i].rem ? `; a strip of width ${st[i].rem} remains.` : ': nothing remains.')));
        await sleep(450);
      }
      if (alive()) {
        const g = st[st.length - 1].small;
        fig.say(T(`Le rectangle est entièrement pavé par des carrés de côté ${g} : ${g} divise ${a} et ${b}, et c’est le plus grand à le faire. pgcd(${a}, ${b}) = ${g}.`, `The rectangle is fully tiled with squares of side ${g}: ${g} divides ${a} and ${b}, and is the largest to do so. gcd(${a}, ${b}) = ${g}.`));
      }
    };
    const reset = () => {
      run.next();
      render(steps(a, b).length - 1);
      fig.say(T('Choisis a et b, puis lance le découpage : à chaque étape, on retire le plus de carrés possible.', 'Pick a and b, then start cutting: at each step, remove as many squares as possible.'));
    };
    fig.range('a', 2, 60, a, 1, (v) => {
      a = v;
      reset();
    });
    fig.range('b', 2, 60, b, 1, (v) => {
      b = v;
      reset();
    });
    fig.btn(T('▶ Découper en carrés', '▶ Cut into squares'), play, true);
    reset();
  },
};
