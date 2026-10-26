import { C, S, ease, runner, tween, at, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Inégalités et moyennes : sur un demi-cercle de diamètre a + b, la hauteur √(ab)
 * (moyenne géométrique) ne dépasse jamais le rayon (a + b)/2 (moyenne arithmétique),
 * avec égalité si et seulement si a = b. Quatre barres comparent QM ≥ AM ≥ GM ≥ HM (a, b > 0).
 */

const U = 16; // pixels par unité du demi-cercle
const OX = 185;
const BASE = 205;
const BAR_U = 14;

export const figure: FicheFigure = {
  size: [640, 250],
  label: {
    fr: 'Un demi-cercle de diamètre a + b : la hauteur √(ab) est au plus égale au rayon (a + b)/2. À droite, les quatre moyennes rangées par ordre décroissant (quadratique, arithmétique, géométrique, harmonique).',
    en: 'A semicircle of diameter a + b: the height √(ab) never exceeds the radius (a + b)/2. On the right, the four means in decreasing order (quadratic, arithmetic, geometric, harmonic).',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let a = 2;
    let b = 8;

    const half = S('path', { fill: C.soft, stroke: C.line, 'stroke-width': 2, opacity: 0.8 });
    const diam = S('line', { y1: BASE, y2: BASE, stroke: C.ink, 'stroke-width': 3 });
    const radius = S('line', { stroke: C.primary, 'stroke-width': 3 });
    const height = S('line', { stroke: C.accent, 'stroke-width': 3.5 });
    const link = S('line', { stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
    const dP = S('circle', { r: 5, fill: C.accent, stroke: C.surface, 'stroke-width': 1.5 });
    const dO = S('circle', { r: 4, fill: C.primary, stroke: C.surface, 'stroke-width': 1.5 });
    const dT = S('circle', { r: 5, fill: C.accent, stroke: C.surface, 'stroke-width': 1.5 });
    const t = (txt: string, color: string, anchor = 'middle', size = 13) => S('text', { 'font-size': size, 'font-weight': 700, fill: color, 'text-anchor': anchor }, txt);
    const lAM = t('', C.primary);
    const lGM = t('', C.accent, 'end');
    const lA = t('a', C.ink);
    const lB = t('b', C.ink);
    svg.append(half, diam, link, radius, height, dP, dO, dT, lAM, lGM, lA, lB);

    // barres des quatre moyennes (à droite)
    const names = ['QM', 'AM', 'GM', 'HM'];
    const full = [
      T('quadratique', 'quadratic'),
      T('arithmétique', 'arithmetic'),
      T('géométrique', 'geometric'),
      T('harmonique', 'harmonic'),
    ];
    const colors = ['#7c3aed', C.primary, C.accent, '#d97706'];
    const bars = names.map((n, i) => {
      const y = 62 + i * 46;
      const rect = S('rect', { x: 440, y, width: 0, height: 26, rx: 4, fill: colors[i] });
      const val = S('text', { x: 0, y: y + 18, 'font-size': 13, 'font-weight': 700, fill: C.ink });
      svg.append(
        S('text', { x: 432, y: y + 12, 'text-anchor': 'end', 'font-size': 13, 'font-weight': 700, fill: C.ink }, n),
        S('text', { x: 432, y: y + 25, 'text-anchor': 'end', 'font-size': 10.5, fill: C.muted }, full[i]),
        rect,
        val,
      );
      return { rect, val };
    });
    svg.append(S('text', { x: 440, y: 36, 'font-size': 13, fill: C.muted }, T('Les quatre moyennes de a et b', 'The four means of a and b')));

    const draw = () => {
      const L = a + b;
      const R = L / 2;
      const x0 = OX - R * U;
      const xp = x0 + a * U;
      const h = Math.sqrt(a * b);
      const set = (n: SVGElement, o: Record<string, number | string>) => Object.entries(o).forEach(([k, v]) => n.setAttribute(k, String(v)));
      half.setAttribute('d', `M${x0} ${BASE} A${R * U} ${R * U} 0 0 1 ${x0 + L * U} ${BASE} Z`);
      set(diam, { x1: x0, x2: x0 + L * U });
      set(radius, { x1: OX, y1: BASE, x2: OX, y2: BASE - R * U });
      set(height, { x1: xp, y1: BASE, x2: xp, y2: BASE - h * U });
      set(link, { x1: xp, y1: BASE - h * U, x2: OX, y2: BASE - h * U });
      at(dP, xp, BASE);
      at(dO, OX, BASE);
      at(dT, xp, BASE - h * U);
      lAM.textContent = `(a+b)/2 = ${R.toFixed(2)}`;
      at(lAM, OX + 6, BASE - R * U - 8, 0);
      lAM.setAttribute('text-anchor', 'start');
      lGM.textContent = `√(ab) = ${h.toFixed(2)}`;
      at(lGM, xp - 8, BASE - h * U / 2, 0);
      at(lA, x0 + (a * U) / 2, BASE + 20);
      at(lB, xp + (b * U) / 2, BASE + 20);
      lAM.setAttribute('opacity', Math.abs(R - h) < 0.05 ? '0' : '1');
      const qm = Math.sqrt((a * a + b * b) / 2);
      const hm = (2 * a * b) / (a + b);
      const vals = [qm, R, h, hm];
      vals.forEach((v, i) => {
        bars[i].rect.setAttribute('width', String(v * BAR_U));
        bars[i].val.setAttribute('x', String(440 + v * BAR_U + 8));
        bars[i].val.textContent = v.toFixed(2);
      });
      const eq = a === b;
      fig.say(
        eq
          ? T(`a = b = ${a} : le point P est le centre du cercle, la hauteur égale le rayon — les quatre moyennes sont égales.`, `a = b = ${a}: P is the centre, the height equals the radius — all four means are equal.`)
          : T(`√(ab) = ${h.toFixed(2)} < (a+b)/2 = ${R.toFixed(2)} : plus a et b s’écartent, plus l’écart entre les moyennes grandit. Égalité seulement si a = b.`, `√(ab) = ${h.toFixed(2)} < (a+b)/2 = ${R.toFixed(2)}: the further apart a and b are, the larger the gap. Equality only when a = b.`),
      );
    };

    const sa = fig.range('a', 1, 10, a, 0.5, (v) => {
      run.next();
      a = v;
      draw();
    });
    const sb = fig.range('b', 1, 10, b, 0.5, (v) => {
      run.next();
      b = v;
      draw();
    });
    fig.btn(T('▶ Rapprocher a et b', '▶ Bring a and b together'), async () => {
      const alive = run.token();
      const a0 = a;
      const b0 = b;
      const m = (a0 + b0) / 2;
      await tween(2200, (k) => {
        if (!alive()) return;
        a = a0 + (m - a0) * ease(k);
        b = b0 + (m - b0) * ease(k);
        sa.set(Math.round(a * 2) / 2);
        sb.set(Math.round(b * 2) / 2);
        draw();
      });
    }, true);
    fig.btn(T('Écarter', 'Spread apart'), () => {
      run.next();
      a = 1;
      b = 10;
      sa.set(a);
      sb.set(b);
      draw();
    });
    draw();
  },
};
