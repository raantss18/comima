import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Principe extrémal : dans toute partie non vide de ℕ, il y a un plus petit élément.
 * On clique des nombres pour former un ensemble ; on lance une « descente » qui saute
 * toujours vers un élément plus petit — elle s'arrête forcément.
 */

const N = 24;
const COLS = 12;
const CELL = 46;
const X0 = 44;

export const figure: FicheFigure = {
  size: [640, 215],
  label: {
    fr: 'Les entiers de 1 à 24 : on en sélectionne certains, le plus petit et le plus grand sont repérés, et une descente saute vers des éléments toujours plus petits.',
    en: 'The integers from 1 to 24: select some, the least and greatest are marked, and a descent jumps to ever smaller elements.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    const chosen = new Set<number>([7, 11, 14, 19, 22]);
    let cursor: number | null = null; // position de la descente
    const trail = S('g');
    const tokens: { g: SVGGElement; c: SVGRectElement; t: SVGTextElement }[] = [];
    const flag = S('text', { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800 });
    const flag2 = S('text', { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800 });

    const pos = (v: number): [number, number] => [X0 + ((v - 1) % COLS) * CELL, 60 + Math.floor((v - 1) / COLS) * 82];

    for (let v = 1; v <= N; v++) {
      const [x, y] = pos(v);
      const c = S('rect', { x: x - 18, y: y - 18, width: 36, height: 36, rx: 8, stroke: C.line, 'stroke-width': 2, style: 'cursor:pointer' });
      const t = S('text', { x, y: y + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, 'pointer-events': 'none' }, String(v));
      const g = S('g', { tabindex: 0, role: 'checkbox', 'aria-label': String(v) }, c, t);
      const toggle = () => {
        run.next();
        cursor = null;
        if (chosen.has(v)) chosen.delete(v);
        else chosen.add(v);
        refresh();
      };
      g.addEventListener('click', toggle);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
      svg.append(g);
      tokens.push({ g, c, t });
    }
    svg.append(trail, flag, flag2);

    const refresh = () => {
      const list = [...chosen].sort((a, b) => a - b);
      tokens.forEach(({ g, c, t }, i) => {
        const v = i + 1;
        const on = chosen.has(v);
        const isMin = on && v === list[0];
        const isMax = on && v === list[list.length - 1];
        c.style.setProperty('fill', cursor === v ? '#d97706' : isMin ? C.primary : isMax ? C.accent : on ? C.soft : C.surface);
        c.style.setProperty('stroke', on ? (isMin ? C.primary : isMax ? C.accent : C.ink) : C.line);
        t.style.setProperty('fill', cursor === v || isMin || isMax ? '#fff' : on ? C.ink : C.muted);
        g.setAttribute('aria-checked', String(on));
      });
      trail.replaceChildren();
      const place = (n: SVGTextElement, v: number | undefined, label: string, color: string) => {
        if (v === undefined) return n.setAttribute('opacity', '0');
        const [x, y] = pos(v);
        n.setAttribute('opacity', '1');
        n.setAttribute('x', String(x));
        n.setAttribute('y', String(y + 38));
        n.style.setProperty('fill', color);
        n.textContent = label;
      };
      place(flag, list[0], T('plus petit', 'least'), C.primary);
      place(flag2, list.length > 1 ? list[list.length - 1] : undefined, T('plus grand', 'greatest'), C.accent);
      if (!list.length) fig.say(T('L’ensemble est vide : il n’a pas de plus petit élément. L’hypothèse « non vide » est indispensable.', 'The set is empty: it has no least element. “Non-empty” is essential.'));
      else fig.say(T(`Ensemble choisi (${list.length} éléments) : plus petit élément = ${list[0]}, plus grand = ${list[list.length - 1]}. Clique pour ajouter ou retirer des nombres.`, `Chosen set (${list.length} elements): least element = ${list[0]}, greatest = ${list[list.length - 1]}. Click to add or remove numbers.`));
    };

    fig.btn(T('▼ Descente', '▼ Descent'), async () => {
      const alive = run.token();
      const list = [...chosen].sort((a, b) => a - b);
      if (!list.length) return refresh();
      cursor = list[list.length - 1];
      refresh();
      let steps = 0;
      const arrows: SVGElement[] = [];
      for (;;) {
        await sleep(650);
        if (!alive()) return;
        const smaller = list.filter((v) => v < cursor!);
        if (!smaller.length) break;
        // saut vers un élément strictement plus petit (au hasard)
        const nxt = smaller[Math.floor(Math.random() * smaller.length)];
        const [x1, y1] = pos(cursor!);
        const [x2, y2] = pos(nxt);
        const mx = (x1 + x2) / 2;
        const my = Math.min(y1, y2) - 34 - Math.abs(x1 - x2) / 14;
        arrows.push(S('path', { d: `M${x1} ${y1 - 18} Q${mx} ${my} ${x2} ${y2 - 18}`, fill: C.none, stroke: '#d97706', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }));
        trail.replaceChildren(...arrows);
        cursor = nxt;
        steps++;
        refresh();
        trail.replaceChildren(...arrows);
        fig.say(T(`Saut n° ${steps} : on descend vers ${nxt}, strictement plus petit.`, `Jump ${steps}: down to ${nxt}, strictly smaller.`));
      }
      fig.say(T(`La descente s’arrête en ${cursor} après ${steps} saut${steps > 1 ? 's' : ''} : c’est le plus petit élément. Une suite strictement décroissante d’entiers naturels est toujours finie.`, `The descent stops at ${cursor} after ${steps} jump${steps > 1 ? 's' : ''}: it is the least element. A strictly decreasing sequence of natural numbers is always finite.`));
    }, true);
    fig.btn(T('Ensemble au hasard', 'Random set'), () => {
      run.next();
      cursor = null;
      chosen.clear();
      const k = 3 + Math.floor(Math.random() * 6);
      while (chosen.size < k) chosen.add(1 + Math.floor(Math.random() * N));
      refresh();
    });
    fig.btn(T('Vider', 'Empty'), () => {
      run.next();
      cursor = null;
      chosen.clear();
      refresh();
    });
    refresh();
  },
};
