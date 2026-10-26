import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Exemples et contre-exemples : n² + n + 41 est premier pour n = 0, 1, …, 39,
 * mais pas pour n = 40 (1681 = 41²). Quarante réussites ne prouvent rien.
 */

const N = 45;
const COLS = 15;

const smallestFactor = (m: number): number => {
  for (let d = 2; d * d <= m; d++) if (m % d === 0) return d;
  return m;
};
const f = (n: number) => n * n + n + 41;

export const figure: FicheFigure = {
  size: [640, 215],
  label: {
    fr: 'Les valeurs de n² + n + 41 pour n de 0 à 44 : premières jusqu’à n = 39, puis un contre-exemple en n = 40.',
    en: 'Values of n² + n + 41 for n from 0 to 44: prime up to n = 39, then a counterexample at n = 40.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    const dots: { g: SVGGElement; c: SVGCircleElement }[] = [];
    let cur = -1;

    fig.svg.append(S('text', { x: 320, y: 22, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: C.ink }, 'n² + n + 41'));
    for (let n = 0; n < N; n++) {
      const x = 28 + (n % COLS) * 41;
      const y = 62 + Math.floor(n / COLS) * 50;
      const c = S('circle', { cx: x, cy: y, r: 16, fill: C.surface, stroke: C.line, 'stroke-width': 2 });
      const t = S('text', { x, y: y + 4.5, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: C.muted }, String(n));
      const g = S('g', { opacity: 0.35 }, c, t);
      fig.svg.append(g);
      dots.push({ g, c });
    }

    const show = (k: number) => {
      cur = k;
      dots.forEach(({ g, c }, n) => {
        const seen = n <= k;
        g.setAttribute('opacity', seen ? '1' : '0.35');
        const prime = smallestFactor(f(n)) === f(n);
        c.style.setProperty('fill', !seen ? C.surface : prime ? C.soft : C.accent);
        c.style.setProperty('stroke', !seen ? C.line : prime ? C.primary : C.accent);
        g.querySelector('text')!.style.setProperty('fill', seen && !prime ? '#fff' : seen ? C.ink : C.muted);
      });
      if (k < 0) return fig.say(T('Appuie sur « Tester » ou déplace le curseur : on vérifie si n² + n + 41 est premier.', 'Press “Test” or move the slider: is n² + n + 41 prime?'));
      const v = f(k);
      const d = smallestFactor(v);
      if (d === v) {
        fig.say(
          T(`n = ${k} : ${v} est premier ✓` + (k >= 30 ? ' — déjà ' + (k + 1) + ' réussites sur ' + (k + 1) + ', et pourtant…' : ''), `n = ${k}: ${v} is prime ✓` + (k >= 30 ? ' — ' + (k + 1) + ' out of ' + (k + 1) + ' so far, and yet…' : '')),
        );
      } else {
        fig.say(T(`n = ${k} : ${v} = ${d} × ${v / d} n’est pas premier ✗ — un seul contre-exemple suffit à réfuter « pour tout n ».`, `n = ${k}: ${v} = ${d} × ${v / d} is not prime ✗ — a single counterexample refutes “for every n”.`));
      }
    };

    const s = fig.range('n', 0, N - 1, 0, 1, (v) => {
      run.next();
      show(v);
    });
    fig.btn(T('▶ Tester', '▶ Test'), async () => {
      const alive = run.token();
      s.set(0);
      show(0);
      for (let n = 1; n < N && alive(); n++) {
        await sleep(n === 40 ? 700 : 130);
        if (!alive()) return;
        s.set(n);
        show(n);
        if (n === 40) await sleep(900);
      }
    }, true);
    fig.btn(T('Aller au contre-exemple', 'Jump to the counterexample'), () => {
      run.next();
      s.set(40);
      show(40);
    });
    show(-1);
  },
};
