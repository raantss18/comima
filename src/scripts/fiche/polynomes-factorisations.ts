import { C, S, tween, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * a² − b² = (a − b)(a + b) en aires : un carré a × a privé d'un carré b × b ; la bande du bas,
 * découpée et tournée, se range à droite : on obtient un rectangle (a − b) × (a + b).
 */

const W = 360;
const H = 300;
const U = 20; // pixels par unité
const OX = 40;
const OY = 50;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Un grand carré dont on retire un petit carré ; la partie restante, découpée et déplacée, forme un rectangle.',
    en: 'A large square with a small square removed; the remaining part, cut and moved, forms a rectangle.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    let a = 8;
    let b = 3;
    let range = false;
    const haut = S('rect', { fill: C.soft, stroke: C.primary, 'stroke-width': 2 });
    const bas = S('rect', { fill: C.accent, opacity: 0.8, stroke: C.accent, 'stroke-width': 2 });
    const trou = S('rect', { fill: C.none, stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
    const titre = S('text', { x: W / 2, y: 26, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink });
    const cotes = S('g');
    fig.svg.append(titre, trou, haut, bas, cotes);

    // Haut : (a − b) × a en (0, 0). Bas : b × (a − b) sous le haut, à gauche ; une fois rangé, il tourne et se place à droite.
    const placer = (t: number) => {
      const L = a - b;
      haut.setAttribute('x', String(OX));
      haut.setAttribute('y', String(OY));
      haut.setAttribute('width', String(a * U));
      haut.setAttribute('height', String(L * U));
      const x0 = OX;
      const y0 = OY + L * U;
      const x1 = OX + a * U;
      const y1 = OY;
      const w0 = L * U;
      const h0 = b * U;
      // Pendant le déplacement le morceau pivote : largeur et hauteur s'échangent.
      bas.setAttribute('x', String(x0 + (x1 - x0) * t));
      bas.setAttribute('y', String(y0 + (y1 - y0) * t));
      bas.setAttribute('width', String(w0 + (h0 - w0) * t));
      bas.setAttribute('height', String(h0 + (w0 - h0) * t));
      trou.setAttribute('x', String(OX + L * U));
      trou.setAttribute('y', String(OY + L * U));
      trou.setAttribute('width', String(b * U));
      trou.setAttribute('height', String(b * U));
      trou.setAttribute('opacity', t < 0.5 ? '1' : '0');
    };

    const legendes = () => {
      cotes.replaceChildren();
      const L = a - b;
      if (!range) {
        titre.textContent = `a² − b² = ${a}² − ${b}² = ${a * a - b * b}`;
        cotes.append(
          S('text', { x: OX + (a * U) / 2, y: OY - 8, 'text-anchor': 'middle', 'font-size': 12, fill: C.muted }, `a = ${a}`),
          S('text', { x: OX + L * U + (b * U) / 2, y: OY + a * U + 16, 'text-anchor': 'middle', 'font-size': 12, fill: C.muted }, `b = ${b}`),
        );
      } else {
        titre.textContent = `(a − b)(a + b) = ${L} × ${a + b} = ${L * (a + b)}`;
        cotes.append(
          S('text', { x: OX + ((a + b) * U) / 2, y: OY - 8, 'text-anchor': 'middle', 'font-size': 12, fill: C.muted }, `a + b = ${a + b}`),
          S('text', { x: OX - 8, y: OY + (L * U) / 2 + 4, 'text-anchor': 'end', 'font-size': 12, fill: C.muted }, `${L}`),
        );
      }
    };

    const render = () => {
      placer(range ? 1 : 0);
      legendes();
      fig.say(range ? T('Le morceau orange a tourné : on lit un rectangle de côtés a − b et a + b.', 'The orange piece has turned: we read a rectangle with sides a − b and a + b.') : T('Le carré a × a privé du carré b × b (pointillés) : son aire est a² − b².', 'The a × a square minus the b × b square (dotted): its area is a² − b².'));
    };

    fig.range('a', 3, 10, a, 1, (v) => {
      a = v;
      if (b >= a) b = a - 1;
      range = false;
      render();
    });
    fig.range('b', 1, 6, b, 1, (v) => {
      b = Math.min(v, a - 1);
      range = false;
      render();
    });
    fig.btn(T('Découper et ranger', 'Cut and move'), async () => {
      const vers = !range;
      await tween(700, (t) => placer(vers ? t : 1 - t));
      range = vers;
      render();
    }, true);
    render();
  },
};
