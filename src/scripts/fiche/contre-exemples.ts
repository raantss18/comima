import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Exemples et contre-exemples : l'élève teste la conjecture « n² + n + 41 est premier »
 * valeur par valeur et doit trouver lui-même le contre-exemple (n = 40, 1681 = 41²).
 * Rien dans l'interface n'indique où ni même s'il y a un échec : ni raccourci, ni pause,
 * ni commentaire avant qu'un échec n'apparaisse.
 */

const N = 60;
const COLS = 15;

const smallestFactor = (m: number): number => {
  for (let d = 2; d * d <= m; d++) if (m % d === 0) return d;
  return m;
};
const f = (n: number) => n * n + n + 41;

export const figure: FicheFigure = {
  size: [640, 265],
  label: {
    fr: 'Un tableau de nombres n, que l’on teste un à un pour savoir si n² + n + 41 est premier.',
    en: 'A grid of numbers n, tested one by one to see whether n² + n + 41 is prime.',
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
      if (k < 0) return fig.say(T('Conjecture : « n² + n + 41 est premier pour tout entier n ≥ 0 ». À toi de la tester : avance n pas à pas, ou fais défiler.', 'Conjecture: “n² + n + 41 is prime for every integer n ≥ 0”. Test it yourself: step n forward, or let it run.'));
      const v = f(k);
      const d = smallestFactor(v);
      const run0 = (() => {
        let c = 0;
        for (let n = k; n >= 0 && smallestFactor(f(n)) === f(n); n--) c++;
        return c;
      })();
      fig.say(
        d === v
          ? T(`n = ${k} : ${v} est premier ✓  (${run0} valeur${run0 > 1 ? 's' : ''} premières d’affilée jusqu’ici)`, `n = ${k}: ${v} is prime ✓  (${run0} prime value${run0 > 1 ? 's' : ''} in a row so far)`)
          : T(`n = ${k} : ${v} = ${d} × ${v / d} n’est pas premier ✗. La conjecture « pour tout n » est donc fausse : un seul contre-exemple suffit.`, `n = ${k}: ${v} = ${d} × ${v / d} is not prime ✗. So “for every n” is false: a single counterexample is enough.`),
      );
    };

    const s = fig.range('n', 0, N - 1, 0, 1, (v) => {
      run.next();
      show(v);
    });
    fig.btn(T('n suivant', 'Next n'), () => {
      run.next();
      const v = Math.min(N - 1, cur + 1);
      s.set(v);
      show(v);
    }, true);
    fig.btn(T('▶ Faire défiler', '▶ Run'), async () => {
      const alive = run.token();
      for (let n = Math.max(cur + 1, 0); n < N && alive(); n++) {
        s.set(n);
        show(n);
        await sleep(160);
      }
    });
    fig.btn(T('Recommencer', 'Restart'), () => {
      run.next();
      s.set(0);
      show(-1);
    });
    show(-1);
  },
};
