import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Viète en image : la parabole y = x² − Sx + T. Ses zéros (s'ils sont réels) ont pour somme S
 * et pour produit T ; le sommet est en x = S/2 (compléter le carré) ; quand Δ = S² − 4T = 0 le
 * zéro est double (la parabole touche l'axe), quand Δ < 0 les deux racines sont complexes.
 */

const W = 360;
const H = 320;
const XMIN = -6;
const XMAX = 6;
const YMIN = -8;
const YMAX = 10;
const X = (x: number) => 20 + ((x - XMIN) / (XMAX - XMIN)) * (W - 40);
const Y = (y: number) => 40 + ((YMAX - y) / (YMAX - YMIN)) * (H - 70);

const f2 = (v: number) => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(2));

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'La parabole y = x² − Sx + T avec ses zéros : leur somme vaut S et leur produit T.',
    en: 'The parabola y = x² − Sx + T with its zeros: their sum is S and their product is T.',
  },
  draw(fig: Fig) {
    const { T: tr } = fig;
    let s = 1;
    let t = -6;
    fig.svg.append(
      S('line', { x1: X(XMIN), y1: Y(0), x2: X(XMAX), y2: Y(0), stroke: C.line, 'stroke-width': 1.5 }),
      S('line', { x1: X(0), y1: Y(YMIN), x2: X(0), y2: Y(YMAX), stroke: C.line, 'stroke-width': 1.5 }),
    );
    for (let k = -5; k <= 5; k++) if (k) fig.svg.append(S('text', { x: X(k), y: Y(0) + 14, 'text-anchor': 'middle', 'font-size': 10, fill: C.muted }, String(k)));
    const courbe = S('path', { fill: C.none, stroke: C.primary, 'stroke-width': 2.5 });
    const axe = S('line', { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '4 4' });
    const z1 = S('circle', { r: 6, fill: C.accent });
    const z2 = S('circle', { r: 6, fill: C.accent });
    const titre = S('text', { x: W / 2, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink });
    fig.svg.append(axe, courbe, z1, z2, titre);

    const render = () => {
      titre.textContent = `y = x² ${s >= 0 ? '−' : '+'} ${f2(Math.abs(s))}x ${t >= 0 ? '+' : '−'} ${f2(Math.abs(t))}`;
      let d = '';
      for (let i = 0; i <= 120; i++) {
        const x = XMIN + ((XMAX - XMIN) * i) / 120;
        const y = Math.max(YMIN - 2, Math.min(YMAX + 2, x * x - s * x + t));
        d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`;
      }
      courbe.setAttribute('d', d);
      axe.setAttribute('x1', String(X(s / 2)));
      axe.setAttribute('x2', String(X(s / 2)));
      axe.setAttribute('y1', String(Y(YMIN)));
      axe.setAttribute('y2', String(Y(YMAX)));
      const delta = s * s - 4 * t;
      if (delta < -1e-9) {
        z1.setAttribute('opacity', '0');
        z2.setAttribute('opacity', '0');
        fig.say(tr(`Δ = S² − 4T = ${f2(delta)} < 0 : pas de zéro réel ; les deux racines complexes ont quand même pour somme ${f2(s)} et pour produit ${f2(t)}.`, `Δ = S² − 4T = ${f2(delta)} < 0: no real zero; the two complex roots still have sum ${f2(s)} and product ${f2(t)}.`));
        return;
      }
      const r = Math.sqrt(Math.max(0, delta));
      const a = (s - r) / 2;
      const b = (s + r) / 2;
      for (const [c, v] of [[z1, a], [z2, b]] as [SVGCircleElement, number][]) {
        c.setAttribute('cx', String(X(v)));
        c.setAttribute('cy', String(Y(0)));
        c.setAttribute('opacity', v >= XMIN && v <= XMAX ? '1' : '0');
      }
      fig.say(
        Math.abs(delta) < 1e-9
          ? tr(`Δ = 0 : zéro double x = ${f2(a)} (la parabole touche l’axe). Somme ${f2(a)} + ${f2(b)} = ${f2(s)}, produit ${f2(a * b)} = T.`, `Δ = 0: double zero x = ${f2(a)} (the parabola touches the axis). Sum ${f2(a)} + ${f2(b)} = ${f2(s)}, product ${f2(a * b)} = T.`)
          : tr(`Zéros ${f2(a)} et ${f2(b)} : somme ${f2(a + b)} = S, produit ${f2(a * b)} = T. Le sommet est sur la droite x = S/2.`, `Zeros ${f2(a)} and ${f2(b)}: sum ${f2(a + b)} = S, product ${f2(a * b)} = T. The vertex lies on the line x = S/2.`),
      );
    };

    fig.range('S', -6, 6, s, 0.5, (v) => { s = v; render(); }, f2);
    fig.range('T', -8, 9, t, 0.5, (v) => { t = v; render(); }, f2);
    render();
  },
};
