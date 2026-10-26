import { C, S, runner, sleep, tween, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';

/**
 * Chapitre 1 — Fibonacci : des carrés de côtés F₁, F₂, …, Fₙ s'assemblent en un rectangle
 * Fₙ × Fₙ₊₁. Aire : F₁² + … + Fₙ² = Fₙ·Fₙ₊₁ — et l'hérédité se lit sur la figure.
 */

const F = (k: number): number => (k <= 2 ? 1 : F(k - 1) + F(k - 2));
const COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5'];

interface Sq {
  k: number;
  x: number;
  y: number;
  s: number;
}

/** Carrés posés en spirale : droite, haut, gauche, bas… (coordonnées en unités). */
function layout(n: number): Sq[] {
  const out: Sq[] = [{ k: 1, x: 0, y: 0, s: 1 }];
  let x0 = 0;
  let y0 = 0;
  let x1 = 1;
  let y1 = 1;
  for (let k = 2; k <= n; k++) {
    const s = F(k);
    const dir = (k - 2) % 4;
    let x = 0;
    let y = 0;
    if (dir === 0) [x, y] = [x1, y0];
    else if (dir === 1) [x, y] = [x0, y0 - s];
    else if (dir === 2) [x, y] = [x0 - s, y0];
    else [x, y] = [x0, y1];
    out.push({ k, x, y, s });
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + s);
    y1 = Math.max(y1, y + s);
  }
  return out;
}

export const figure: FicheFigure = {
  size: [640, 300],
  label: {
    fr: 'Des carrés dont les côtés sont les nombres de Fibonacci s’assemblent en spirale pour former un rectangle.',
    en: 'Squares whose sides are Fibonacci numbers fit together in a spiral to form a rectangle.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let n = 7;
    const layer = S('g');
    const text = S('text', { x: 20, y: 286, 'font-size': 15, 'font-weight': 700, fill: C.ink });
    svg.append(layer, text);

    const render = (shown: number, grow = 1) => {
      const all = layout(n);
      const minX = Math.min(...all.map((q) => q.x));
      const minY = Math.min(...all.map((q) => q.y));
      const W = Math.max(...all.map((q) => q.x + q.s)) - minX;
      const H = Math.max(...all.map((q) => q.y + q.s)) - minY;
      const u = Math.min(380 / W, 235 / H);
      const ox = 20 + (380 - W * u) / 2;
      const oy = 14 + (235 - H * u) / 2;
      layer.replaceChildren();
      all.slice(0, shown).forEach((q, i) => {
        const last = i === shown - 1;
        const sc = last ? grow : 1;
        const cx = ox + (q.x - minX + q.s / 2) * u;
        const cy = oy + (q.y - minY + q.s / 2) * u;
        const side = q.s * u * sc;
        layer.append(
          S('rect', { x: cx - side / 2, y: cy - side / 2, width: side, height: side, fill: COLORS[(q.k - 1) % COLORS.length], opacity: 0.88, stroke: C.surface, 'stroke-width': 2 }),
        );
        if (side > 14) layer.append(S('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', 'font-size': Math.min(18, side / 2.2 + 6), 'font-weight': 700, fill: '#fff' }, String(q.s)));
      });
      // colonne de calcul à droite
      const rows = Array.from({ length: shown }, (_, i) => `${F(i + 1)}²`);
      const sum = Array.from({ length: shown }, (_, i) => F(i + 1) ** 2).reduce((a, b) => a + b, 0);
      layer.append(
        S('text', { x: 420, y: 40, 'font-size': 13, fill: C.muted }, T('Aire du rectangle, de deux façons', 'Area of the rectangle, two ways')),
        S('text', { x: 420, y: 74, 'font-size': 14, 'font-weight': 700, fill: C.ink }, T('Somme des carrés :', 'Sum of the squares:')),
        S('text', { x: 420, y: 98, 'font-size': 13, fill: C.ink }, shown ? `${rows.slice(0, 6).join(' + ')}${shown > 6 ? ' + …' : ''}` : ''),
        S('text', { x: 420, y: 124, 'font-size': 18, 'font-weight': 800, fill: C.primary }, shown ? `= ${sum}` : ''),
        S('text', { x: 420, y: 168, 'font-size': 14, 'font-weight': 700, fill: C.ink }, T('Largeur × hauteur :', 'Width × height:')),
        S('text', { x: 420, y: 196, 'font-size': 18, 'font-weight': 800, fill: C.accent }, shown ? `${F(shown)} × ${F(shown + 1)} = ${F(shown) * F(shown + 1)}` : ''),
      );
      text.textContent = shown === n ? `F₁² + … + F${sub(n)}² = F${sub(n)} · F${sub(n + 1)}` : '';
      fig.say(
        shown === 0
          ? T('Appuie sur « Construire » : on ajoute un carré à la fois.', 'Press “Build”: one square is added at a time.')
          : shown === 1
            ? T('Un carré de côté 1 : F₁² = 1 × 1 = F₁ · F₂.', 'A square of side 1: F₁² = 1 × 1 = F₁ · F₂.')
            : T(`On ajoute un carré de côté F${sub(shown)} = ${F(shown)} sur le côté de longueur ${F(shown)} : le rectangle ${F(shown - 1)} × ${F(shown)} devient ${F(shown)} × ${F(shown + 1)}. Aire : ${F(shown - 1)}·${F(shown)} + ${F(shown)}² = ${F(shown)}·(${F(shown - 1)} + ${F(shown)}) = ${F(shown)}·${F(shown + 1)}.`, `A square of side F${sub(shown)} = ${F(shown)} is added along the side of length ${F(shown)}: the ${F(shown - 1)} × ${F(shown)} rectangle becomes ${F(shown)} × ${F(shown + 1)}. Area: ${F(shown - 1)}·${F(shown)} + ${F(shown)}² = ${F(shown)}·(${F(shown - 1)} + ${F(shown)}) = ${F(shown)}·${F(shown + 1)}.`),
      );
    };
    const sub = (k: number) => String(k).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]).join('');

    fig.btn(T('▶ Construire', '▶ Build'), async () => {
      const alive = run.token();
      for (let k = 1; k <= n && alive(); k++) {
        await tween(450, (t) => alive() && render(k, t));
        await sleep(350);
      }
    }, true);
    fig.range('n', 2, 10, n, 1, (v) => {
      run.next();
      n = v;
      render(n);
    });
    fig.btn(T('Effacer', 'Clear'), () => {
      run.next();
      render(0);
    });
    render(n);
  },
};
