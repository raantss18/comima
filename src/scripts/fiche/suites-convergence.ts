import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Diagramme en toile d'araignée de u_{n+1} = √(a + u_n) : on monte à la courbe, on revient
 * sur la diagonale, et l'escalier converge vers le point fixe ℓ = (1 + √(1 + 4a)) / 2.
 * Les curseurs changent a et u_0 ; le point fixe est toujours le même quel que soit u_0 ≥ 0.
 */

const W = 360;
const H = 330;
const M = 40; // marge
const MAX = 4.5; // fenêtre [0 ; MAX] × [0 ; MAX]
const P = (W - 2 * M) / MAX;
const X = (x: number) => M + x * P;
const Y = (y: number) => H - M - y * P;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Diagramme en escalier de la suite u(n+1) = racine de (a + u(n)) : les marches se rapprochent du point où la courbe coupe la diagonale.',
    en: 'Cobweb diagram of u(n+1) = square root of (a + u(n)): the steps approach the point where the curve meets the diagonal.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    let a = 2;
    let u0 = 0.2;
    const f = (x: number) => Math.sqrt(a + x);
    const ell = () => (1 + Math.sqrt(1 + 4 * a)) / 2;

    fig.svg.append(
      S('line', { x1: X(0), y1: Y(0), x2: X(MAX), y2: Y(0), stroke: C.line, 'stroke-width': 1.5 }),
      S('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(MAX), stroke: C.line, 'stroke-width': 1.5 }),
      S('line', { x1: X(0), y1: Y(0), x2: X(MAX), y2: Y(MAX), stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }),
      S('text', { x: X(MAX) - 4, y: Y(MAX) + 16, 'text-anchor': 'end', 'font-size': 12, fill: C.muted }, 'y = x'),
    );
    for (let k = 1; k <= 4; k++) {
      fig.svg.append(S('text', { x: X(k), y: Y(0) + 16, 'text-anchor': 'middle', 'font-size': 11, fill: C.muted }, String(k)));
      fig.svg.append(S('text', { x: X(0) - 8, y: Y(k) + 4, 'text-anchor': 'end', 'font-size': 11, fill: C.muted }, String(k)));
    }
    const courbe = S('path', { fill: C.none, stroke: C.primary, 'stroke-width': 2.5 });
    const escalier = S('path', { fill: C.none, stroke: C.accent, 'stroke-width': 2 });
    const fixe = S('circle', { r: 5, fill: C.primary });
    const fixeTxt = S('text', { 'font-size': 12, 'font-weight': 700, fill: C.primary }, 'ℓ');
    const titre = S('text', { x: W / 2, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink }, '');
    fig.svg.append(courbe, escalier, fixe, fixeTxt, titre);

    const dessinerCourbe = () => {
      let d = '';
      for (let i = 0; i <= 90; i++) {
        const x = (MAX * i) / 90;
        const y = Math.min(f(x), MAX);
        d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`;
      }
      courbe.setAttribute('d', d);
      const l = ell();
      fixe.setAttribute('cx', String(X(l)));
      fixe.setAttribute('cy', String(Y(l)));
      fixeTxt.setAttribute('x', String(X(l) + 8));
      fixeTxt.setAttribute('y', String(Y(l) + 18));
      titre.textContent = `u(n+1) = √(${a} + u(n))`;
    };

    const trace = async (anime: boolean) => {
      const alive = run.token();
      dessinerCourbe();
      let u = u0;
      let d = `M${X(u)} ${Y(0)}`;
      escalier.setAttribute('d', d);
      for (let n = 0; n < 12 && alive(); n++) {
        const v = f(u);
        d += `L${X(u)} ${Y(v)}L${X(v)} ${Y(v)}`;
        escalier.setAttribute('d', d);
        fig.say(T(`u(${n + 1}) ≈ ${v.toFixed(4)}   ·   point fixe ℓ ≈ ${ell().toFixed(4)}`, `u(${n + 1}) ≈ ${v.toFixed(4)}   ·   fixed point ℓ ≈ ${ell().toFixed(4)}`));
        u = v;
        if (anime) await sleep(380);
      }
      if (alive()) {
        fig.say(
          T(
            `Après 12 étapes u ≈ ${u.toFixed(6)} : la suite est monotone et bornée, donc converge, et sa limite vérifie ℓ = √(${a} + ℓ), soit ℓ = (1 + √(1 + 4·${a}))/2 ≈ ${ell().toFixed(6)}.`,
            `After 12 steps u ≈ ${u.toFixed(6)}: the sequence is monotone and bounded, hence converges, and its limit satisfies ℓ = √(${a} + ℓ), i.e. ℓ = (1 + √(1 + 4·${a}))/2 ≈ ${ell().toFixed(6)}.`,
          ),
        );
      }
    };

    fig.range('a', 0.5, 6, a, 0.5, (v) => {
      a = v;
      trace(false);
    });
    fig.range('u(0)', 0, 4, u0, 0.1, (v) => {
      u0 = v;
      trace(false);
    }, (v) => v.toFixed(1));
    fig.btn(T('▶ Construire pas à pas', '▶ Build step by step'), () => trace(true), true);
    trace(false);
  },
};
