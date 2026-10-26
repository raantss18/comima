import { C, S, drag, ease, runner, tween, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';

/**
 * Chapitre 4 — centroïde : S est le point moyen de A₁, …, Aₙ, caractérisé par
 * Σ SAᵢ = 0. Les vecteurs SAᵢ, mis bout à bout, referment toujours un polygone.
 */

type P = { x: number; y: number };
const COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626', '#7c3aed', '#0891b2'];
const LW = 330; // largeur de la zone de gauche (points déplaçables)
const CX = 480; // centre de la zone de droite (chaîne de vecteurs)
const CY = 135;

export const figure: FicheFigure = {
  size: [640, 270],
  label: {
    fr: 'À gauche, des points déplaçables et leur centroïde S ; à droite, les vecteurs SAᵢ mis bout à bout, qui reviennent toujours à leur point de départ.',
    en: 'Left, draggable points and their centroid S; right, the vectors SAᵢ placed end to end, always returning to their starting point.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let n = 4;
    let pts: P[] = [
      { x: 70, y: 70 },
      { x: 250, y: 50 },
      { x: 280, y: 190 },
      { x: 110, y: 220 },
      { x: 180, y: 130 },
      { x: 60, y: 150 },
    ];
    let progress = 1; // 0 → 1 : avancement de la mise bout à bout
    const left = S('g');
    const right = S('g');
    const dotLayer = S('g');
    svg.append(S('line', { x1: LW + 10, y1: 14, x2: LW + 10, y2: 256, stroke: C.line, 'stroke-width': 1.5 }), left, right, dotLayer);

    const centroid = (): P => ({ x: pts.slice(0, n).reduce((a, p) => a + p.x, 0) / n, y: pts.slice(0, n).reduce((a, p) => a + p.y, 0) / n });

    const render = () => {
      const G = centroid();
      left.replaceChildren();
      right.replaceChildren();
      pts.slice(0, n).forEach((p, i) => left.append(S('line', { x1: G.x, y1: G.y, x2: p.x, y2: p.y, stroke: COLORS[i], 'stroke-width': 2.5, opacity: 0.85 })));
      left.append(S('circle', { cx: G.x, cy: G.y, r: 7, fill: C.ink }), S('text', { x: G.x + 11, y: G.y - 8, 'font-size': 15, 'font-weight': 800, fill: C.ink }, 'S'));
      pts.slice(0, n).forEach((p, i) => left.append(S('text', { x: p.x + (p.x > G.x ? 14 : -14), y: p.y + (p.y > G.y ? 20 : -12), 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: COLORS[i] }, `A${i + 1}`)));
      // chaîne bout à bout, centrée sur son point de départ
      const vs = pts.slice(0, n).map((p) => ({ x: p.x - G.x, y: p.y - G.y }));
      const steps = vs.length * progress;
      // la chaîne complète est calculée d'abord pour être réduite et centrée dans la zone de droite
      const full: P[] = [{ x: 0, y: 0 }];
      vs.forEach((v) => full.push({ x: full[full.length - 1].x + v.x, y: full[full.length - 1].y + v.y }));
      const xs = full.map((p) => p.x);
      const ys = full.map((p) => p.y);
      const bw = Math.max(...xs) - Math.min(...xs) || 1;
      const bh = Math.max(...ys) - Math.min(...ys) || 1;
      const k = Math.min(1, 250 / bw, 190 / bh);
      const origin = { x: CX - ((Math.max(...xs) + Math.min(...xs)) / 2) * k, y: 125 - ((Math.max(...ys) + Math.min(...ys)) / 2) * k };
      let cur = { ...origin };
      right.append(S('circle', { cx: cur.x, cy: cur.y, r: 5, fill: C.ink }));
      vs.forEach((v, i) => {
        const f = Math.max(0, Math.min(1, steps - i));
        if (f <= 0) return;
        const nxt = { x: cur.x + v.x * k * f, y: cur.y + v.y * k * f };
        right.append(S('line', { x1: cur.x, y1: cur.y, x2: nxt.x, y2: nxt.y, stroke: COLORS[i], 'stroke-width': 3.5, 'stroke-linecap': 'round' }), S('circle', { cx: nxt.x, cy: nxt.y, r: 4, fill: COLORS[i] }));
        cur = { x: cur.x + v.x * k, y: cur.y + v.y * k };
      });
      right.append(S('text', { x: CX, y: 248, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: progress >= 1 ? C.primary : C.muted }, progress >= 1 ? T('La chaîne se referme : Σ SAᵢ = 0', 'The chain closes: Σ SAᵢ = 0') : T('mise bout à bout…', 'placing end to end…')));
      dotLayer.replaceChildren(...pts.slice(0, n).map((p, i) => {
        const c = S('circle', { cx: p.x, cy: p.y, r: 9, fill: COLORS[i], stroke: C.surface, 'stroke-width': 2, tabindex: 0, 'aria-label': `A${i + 1}` });
        drag(svg, c, (x, y) => {
          run.next();
          progress = 1;
          pts[i] = { x: Math.max(14, Math.min(LW - 4, x)), y: Math.max(14, Math.min(256, y)) };
          render();
        });
        return c;
      }));
      const sum = vs.reduce((a, v) => ({ x: a.x + v.x, y: a.y + v.y }), { x: 0, y: 0 });
      fig.say(T(`Σ SAᵢ = (${sum.x.toFixed(1)} ; ${sum.y.toFixed(1)}) ≈ (0 ; 0). Déplace un point : S bouge, et la somme reste nulle.`, `Σ SAᵢ = (${sum.x.toFixed(1)} ; ${sum.y.toFixed(1)}) ≈ (0 ; 0). Drag a point: S moves, and the sum stays zero.`));
    };

    fig.range(T('points n', 'points n'), 3, 6, n, 1, (v) => {
      run.next();
      n = v;
      progress = 1;
      render();
    });
    fig.btn(T('▶ Mettre bout à bout', '▶ Place end to end'), async () => {
      const alive = run.token();
      progress = 0;
      await tween(500 + n * 600, (t) => {
        if (!alive()) return;
        progress = ease(t);
        render();
      });
    }, true);
    render();
  },
};
