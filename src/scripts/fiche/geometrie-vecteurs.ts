import { C, S, drag, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Vecteurs : on déplace A, B, C sur un quadrillage. (1) Parallélogramme : D = A + C − B,
 * les flèches AB et DC sont égales et les diagonales ont le même milieu. (2) Centre de
 * gravité : les trois médianes passent par G = (A + B + C) / 3. Coordonnées entières, pour
 * que l'élève refasse les calculs de tête.
 */

type P = [number, number];
const U = 32; // pixels par unité
const OX = 28; // origine du repère (pixels)
const OY = 300;
const XMAX = 10;
const YMAX = 8;
const px = (p: P): P => [OX + p[0] * U, OY - p[1] * U];
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '').replace('.', ','));
const pt = (p: P) => `(${fmt(p[0])} ; ${fmt(p[1])})`;

export const figure: FicheFigure = {
  size: [360, 340],
  label: {
    fr: 'Un repère quadrillé : on déplace A, B et C. Le point D = A + C − B complète le parallélogramme ABCD, ou bien les médianes du triangle ABC se coupent au centre de gravité G.',
    en: 'A grid: move A, B and C. The point D = A + C − B completes the parallelogram ABCD, or the medians of triangle ABC meet at the centroid G.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const pts: P[] = [
      [1, 1],
      [6, 2],
      [8, 6],
    ];
    let mode: 'para' | 'grav' = 'para';

    // Quadrillage et axes.
    const grid = S('g', { stroke: C.line, 'stroke-width': 1, opacity: 0.6 });
    for (let x = 0; x <= XMAX; x++) grid.append(S('line', { x1: OX + x * U, y1: OY, x2: OX + x * U, y2: OY - YMAX * U }));
    for (let y = 0; y <= YMAX; y++) grid.append(S('line', { x1: OX, y1: OY - y * U, x2: OX + XMAX * U, y2: OY - y * U }));
    const axes = S('g', { stroke: C.muted, 'stroke-width': 1.5 });
    axes.append(S('line', { x1: OX, y1: OY, x2: OX + XMAX * U, y2: OY }), S('line', { x1: OX, y1: OY, x2: OX, y2: OY - YMAX * U }));
    const zero = S('text', { x: OX - 12, y: OY + 14, 'font-size': 11, fill: C.muted }, '0');
    svg.append(grid, axes, zero);

    // Flèches (marqueurs SVG).
    const defs = S('defs');
    const mk = (id: string, color: string) => {
      const m = S('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
      m.append(S('path', { d: 'M0 0 L10 5 L0 10 Z', fill: color }));
      return m;
    };
    const uid = Math.random().toString(36).slice(2, 7);
    defs.append(mk(`gv-a-${uid}`, 'var(--c-primary)'));
    svg.append(defs);

    const poly = S('path', { fill: C.soft, opacity: 0.55, stroke: C.ink, 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
    const diag1 = S('line', { stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
    const diag2 = S('line', { stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
    const vecAB = S('line', { stroke: C.primary, 'stroke-width': 3, 'marker-end': `url(#gv-a-${uid})` });
    const vecDC = S('line', { stroke: C.primary, 'stroke-width': 3, 'marker-end': `url(#gv-a-${uid})` });
    const medians = [0, 1, 2].map(() => S('line', { stroke: C.accent, 'stroke-width': 1.8 }));
    const mid = S('circle', { r: 5, fill: C.ink });
    const g = S('circle', { r: 6, fill: C.accent, stroke: C.surface, 'stroke-width': 1.5 });
    const dPoint = S('circle', { r: 7, fill: C.surface, stroke: C.ink, 'stroke-width': 2 });
    const lbl = (t: string, color = C.ink) => S('text', { 'font-size': 14, 'font-weight': 700, fill: color, 'text-anchor': 'middle' }, t);
    const tD = lbl('D');
    const tM = lbl('M', C.muted);
    const tG = lbl('G', C.accent);
    svg.append(poly, diag1, diag2, ...medians, vecAB, vecDC, mid, tM, g, tG, dPoint, tD);

    const names = ['A', 'B', 'C'];
    const handles = pts.map((_, i) => {
      const c = S('circle', { r: 10, fill: C.primary, stroke: C.surface, 'stroke-width': 2, tabindex: 0, role: 'slider', 'aria-label': T(`point ${names[i]}, à déplacer (flèches du clavier)`, `point ${names[i]}, drag it (arrow keys)`) });
      return c;
    });
    const tags = names.map((n) => lbl(n, C.primary));
    svg.append(...handles, ...tags);

    const line = (n: SVGElement, p: P, q: P, shorten = 0) => {
      const [x1, y1] = px(p);
      let [x2, y2] = px(q);
      if (shorten) {
        const d = Math.hypot(x2 - x1, y2 - y1) || 1;
        x2 -= ((x2 - x1) / d) * shorten;
        y2 -= ((y2 - y1) / d) * shorten;
      }
      n.setAttribute('x1', String(x1));
      n.setAttribute('y1', String(y1));
      n.setAttribute('x2', String(x2));
      n.setAttribute('y2', String(y2));
    };
    const place = (n: SVGElement, p: P, dx = 0, dy = 0) => {
      const [x, y] = px(p);
      if (n.tagName === 'circle') {
        n.setAttribute('cx', String(x));
        n.setAttribute('cy', String(y));
      } else {
        n.setAttribute('x', String(x + dx));
        n.setAttribute('y', String(y + dy));
      }
    };
    const show = (n: SVGElement, on: boolean) => n.setAttribute('visibility', on ? 'visible' : 'hidden');

    const render = () => {
      const [A, B, Cc] = pts;
      const D: P = [A[0] + Cc[0] - B[0], A[1] + Cc[1] - B[1]];
      const para = mode === 'para';
      const inside = D[0] >= 0 && D[0] <= XMAX && D[1] >= 0 && D[1] <= YMAX;
      handles.forEach((h, i) => place(h, pts[i]));
      tags.forEach((t, i) => place(t, pts[i], 0, -15));
      if (para) {
        const corners = [A, B, Cc, D].map(px);
        poly.setAttribute('d', `M${corners.map((c) => c.join(' ')).join(' L')} Z`);
        line(diag1, A, Cc);
        line(diag2, B, D);
        line(vecAB, A, B, 9);
        line(vecDC, D, Cc, 9);
        const M: P = [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2];
        place(mid, M);
        place(tM, M, 14, 5);
        place(dPoint, D);
        place(tD, D, 0, 24);
        fig.say(
          inside
            ? T(
                `D = A + C − B = ${pt(D)}. Les flèches AB et DC sont égales : ${pt([B[0] - A[0], B[1] - A[1]])}. Les diagonales [AC] et [BD] ont le même milieu M ${pt(M)}.`,
                `D = A + C − B = ${pt(D)}. The arrows AB and DC are equal: ${pt([B[0] - A[0], B[1] - A[1]])}. The diagonals [AC] and [BD] share the midpoint M ${pt(M)}.`,
              )
            : T(`D = A + C − B = ${pt(D)} sort du quadrillage : rapproche A et C de B.`, `D = A + C − B = ${pt(D)} is off the grid: move A and C closer to B.`),
        );
      } else {
        poly.setAttribute('d', `M${[A, B, Cc].map(px).map((c) => c.join(' ')).join(' L')} Z`);
        const Gp: P = [(A[0] + B[0] + Cc[0]) / 3, (A[1] + B[1] + Cc[1]) / 3];
        const mids: P[] = [
          [(B[0] + Cc[0]) / 2, (B[1] + Cc[1]) / 2],
          [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2],
          [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2],
        ];
        medians.forEach((m, i) => line(m, pts[i], mids[i]));
        place(g, Gp);
        place(tG, Gp, 15, -8);
        fig.say(
          T(
            `G = (A + B + C) / 3 = ${pt(Gp)} : les trois médianes passent par G, aux deux tiers de chacune à partir du sommet.`,
            `G = (A + B + C) / 3 = ${pt(Gp)}: the three medians go through G, two thirds of the way from each vertex.`,
          ),
        );
      }
      [diag1, diag2, vecAB, vecDC, mid, tM, tD].forEach((n) => show(n, para));
      show(dPoint, para && inside);
      medians.forEach((m) => show(m, !para));
      [g, tG].forEach((n) => show(n, !para));
    };

    const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v));
    handles.forEach((h, i) => {
      drag(svg, h, (x, y) => {
        const p: P = [clamp(Math.round((x - OX) / U), XMAX), clamp(Math.round((OY - y) / U), YMAX)];
        if (p[0] === pts[i][0] && p[1] === pts[i][1]) return;
        pts[i] = p;
        render();
      });
      h.addEventListener('keydown', (e) => {
        const k = (e as KeyboardEvent).key;
        const d: Record<string, P> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
        if (!d[k]) return;
        e.preventDefault();
        pts[i] = [clamp(pts[i][0] + d[k][0], XMAX), clamp(pts[i][1] + d[k][1], YMAX)];
        render();
      });
    });

    const bPara = fig.btn(T('Parallélogramme', 'Parallelogram'), () => {
      mode = 'para';
      bPara.setAttribute('aria-pressed', 'true');
      bGrav.setAttribute('aria-pressed', 'false');
      render();
    }, true);
    const bGrav = fig.btn(T('Centre de gravité', 'Centroid'), () => {
      mode = 'grav';
      bPara.setAttribute('aria-pressed', 'false');
      bGrav.setAttribute('aria-pressed', 'true');
      render();
    });
    bPara.setAttribute('aria-pressed', 'true');
    bGrav.setAttribute('aria-pressed', 'false');
    render();
  },
};
