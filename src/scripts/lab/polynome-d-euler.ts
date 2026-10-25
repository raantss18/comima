import { button, group, numField, param, select, type LabDef } from './core';

/**
 * Chapitre 0 — Exemples et contre-exemples.
 * « Ce polynôme ne donne que des nombres premiers ? » Euler : n² + n + 41 pour n = 0…39.
 */

const SAFE = Number.MAX_SAFE_INTEGER;

function smallestFactor(n: number): number {
  if (n < 2) return n;
  if (n % 2 === 0) return 2;
  if (n % 3 === 0) return 3;
  for (let d = 5; d * d <= n; d += 6) {
    if (n % d === 0) return d;
    if (n % (d + 2) === 0) return d + 2;
  }
  return n;
}
const isPrime = (n: number) => n >= 2 && smallestFactor(n) === n;

function factorize(n: number): string {
  if (n < 2) return String(n);
  const parts: [number, number][] = [];
  let m = n;
  while (m > 1) {
    const f = smallestFactor(m);
    const last = parts[parts.length - 1];
    if (last && last[0] === f) last[1]++;
    else parts.push([f, 1]);
    m /= f;
  }
  return parts.map(([p, e]) => (e > 1 ? `${p}^{${e}}` : String(p))).join(' \\times ');
}

type Family = 'poly' | 'fermat' | 'mersenne';

export const def: LabDef = {
  chapter: '00-exemples-contre-exemples',
  numero: 0,
  title: { fr: 'Un polynôme qui ne donne que des premiers ?', en: 'A polynomial giving only primes?' },
  statement: {
    fr: 'Pour $n = 0, 1, 2, \\dots$ calculons $n^2 + n + 41$ : $41, 43, 47, 53, \\dots$ tous premiers ! Est-ce vrai pour <em>tout</em> $n$ ? Et pour d’autres formules ?',
    en: 'For $n = 0, 1, 2, \\dots$ compute $n^2 + n + 41$: $41, 43, 47, 53, \\dots$ all prime! Is it true for <em>every</em> $n$? And for other formulas?',
  },
  goal: {
    fr: 'Trouve le plus petit $n$ pour lequel la formule échoue. Puis change $a, b, c$ : peut-on fabriquer un polynôme qui ne donne <em>jamais</em> de composé ?',
    en: 'Find the smallest $n$ for which the formula fails. Then change $a, b, c$: can you build a polynomial that <em>never</em> gives a composite?',
  },
  steps: {
    fr: [
      'Au départ : la famille <strong>« polynôme $an^2 + bn + c$ »</strong> avec $a = 1,\\ b = 1,\\ c = 41$ (valeurs modifiables), pour $n$ de $0$ à $44$.',
      'Chaque case est un $n$ : <strong>verte</strong> si la valeur est première, <strong>rouge</strong> si elle est composée (avec son plus petit diviseur). Clique une case pour voir le calcul détaillé.',
      'Modifie $a, b, c$ (curseur ou clavier), le point de départ $n_0$ et le nombre de cases, puis compare avec les nombres de Fermat ou de Mersenne dans le menu « Famille ».',
      'Bouton <strong>Chercher les records</strong> : l’ordinateur teste des milliers de polynômes $n^2 + bn + c$ et classe les plus longues séries de premiers.',
    ],
    en: [
      'At the start: the family <strong>“polynomial $an^2 + bn + c$”</strong> with $a = 1,\\ b = 1,\\ c = 41$ (editable), for $n$ from $0$ to $44$.',
      'Each cell is an $n$: <strong>green</strong> if the value is prime, <strong>red</strong> if composite (with its smallest divisor). Click a cell to see the detailed computation.',
      'Change $a, b, c$ (slider or keyboard), the start $n_0$ and the number of cells, then compare with Fermat or Mersenne numbers in the “Family” menu.',
      'Button <strong>Search records</strong>: the computer tests thousands of polynomials $n^2 + bn + c$ and ranks the longest runs of primes.',
    ],
  },
  legend: [
    { color: '#1d9a45', fr: 'valeur première', en: 'prime value' },
    { color: '#d6362b', fr: 'valeur composée', en: 'composite value' },
    { color: '#9aa3a0', fr: 'valeur ≤ 1', en: 'value ≤ 1' },
    { color: '#f59e0b', fr: 'première défaillance', en: 'first failure' },
  ],
  hints: {
    fr: [
      'Calcule à la main $n^2 + n + 41$ pour $n = 40$ : tu peux factoriser en mettant 41 en facteur.',
      'Pour $n = 41$ ou $n = 40$ on a $41 \\mid n^2 + n + 41$ : pourquoi ? Que se passe-t-il pour tout polynôme $n^2 + n + c$ avec $c$ premier ?',
      'Aucun polynôme non constant ne peut donner que des nombres premiers : si $P(n_0) = p$, alors $p \\mid P(n_0 + kp)$ pour tout $k$.',
    ],
    en: [
      'Compute $n^2 + n + 41$ by hand for $n = 40$: factor out 41.',
      'For $n = 40$ or $n = 41$ we get $41 \\mid n^2 + n + 41$: why? What happens for any polynomial $n^2 + n + c$ with $c$ prime?',
      'No non-constant polynomial can give only primes: if $P(n_0) = p$ then $p \\mid P(n_0 + kp)$ for every $k$.',
    ],
  },
  general: {
    fr: '<p><strong>Théorème.</strong> Aucun polynôme non constant à coefficients entiers ne prend uniquement des valeurs premières. Si $P(n_0) = p$ est premier, alors $P(n_0 + kp) \\equiv P(n_0) \\equiv 0 \\pmod p$ pour tout $k$ : une infinité de valeurs sont divisibles par $p$ (donc composées dès qu’elles dépassent $p$).</p><p>Records : $n^2 + n + 41$ donne 40 premiers consécutifs ($n = 0 \\dots 39$) ; $n^2 - 79n + 1601$ en donne 80. Les nombres de Fermat $2^{2^n} + 1$ sont premiers pour $n \\le 4$ mais $F_5 = 641 \\times 6700417$.</p>',
    en: '<p><strong>Theorem.</strong> No non-constant integer polynomial takes only prime values. If $P(n_0) = p$ is prime, then $P(n_0 + kp) \\equiv P(n_0) \\equiv 0 \\pmod p$ for every $k$: infinitely many values are divisible by $p$ (hence composite once they exceed $p$).</p><p>Records: $n^2 + n + 41$ gives 40 consecutive primes ($n = 0 \\dots 39$); $n^2 - 79n + 1601$ gives 80. Fermat numbers $2^{2^n} + 1$ are prime for $n \\le 4$ but $F_5 = 641 \\times 6700417$.</p>',
  },
  aspect: 0.5,
  logEmpty: { fr: 'Note une formule, ou lance la recherche de records.', en: 'Record a formula, or run the record search.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let family: Family = 'poly';
    let a = 1;
    let b = 1;
    let c = 41;
    let n0 = 0;
    let count = 45;
    let selected = -1;
    log.setColumns([t('formule', 'formula'), t('1er échec', '1st failure'), t('série', 'run')]);

    const value = (n: number): number => {
      if (family === 'poly') return a * n * n + b * n + c;
      if (family === 'fermat') return n > 5 ? NaN : 2 ** (2 ** n) + 1;
      return n > 31 ? NaN : 2 ** n - 1;
    };
    const label = () => {
      if (family === 'poly') {
        const term = (k: number, s: string) => (k === 0 ? '' : `${k < 0 ? '−' : '+'} ${Math.abs(k) === 1 && s ? '' : Math.abs(k)}${s} `);
        return `${a === 1 ? '' : a}n² ${term(b, 'n')}${term(c, '')}`.replace(/^\+ /, '').trim();
      }
      return family === 'fermat' ? '2^(2^n)+1' : '2^n−1';
    };
    const maxCount = () => (family === 'fermat' ? 6 : family === 'mersenne' ? 32 : 80);
    const cells = () => Array.from({ length: Math.min(count, maxCount()) }, (_, i) => n0 + i).map((n) => ({ n, v: value(n) }));

    const analyse = () => {
      const cs = cells();
      const firstBad = cs.find((x) => Number.isFinite(x.v) && !isPrime(x.v));
      const run = firstBad ? firstBad.n - n0 : cs.filter((x) => Number.isFinite(x.v)).length;
      const primes = cs.filter((x) => Number.isFinite(x.v) && isPrime(x.v)).length;
      api.say(
        `<div class="lab-big">${t('Formule', 'Formula')} : <strong>${label()}</strong></div>` +
          `<div>${t('Premiers', 'Primes')} : <strong>${primes}</strong> / ${cs.length} · ` +
          (firstBad
            ? `${t('première défaillance', 'first failure')} : <strong class="lab-bad">n = ${firstBad.n}</strong> (${t('série de', 'run of')} ${run})`
            : `<span class="lab-ok">${t('aucune défaillance dans cette plage', 'no failure in this range')}</span>`) +
          '</div>',
      );
      showDetail(selected >= 0 ? selected : firstBad ? firstBad.n : cs[0]?.n ?? 0);
      stage.relayout();
      return { firstBad, run };
    };

    const showDetail = (n: number) => {
      selected = n;
      const v = value(n);
      if (!Number.isFinite(v)) {
        api.calc(`<p>$n = ${n}$ : ${t('hors plage pour cette famille.', 'out of range for this family.')}</p>`);
        return;
      }
      const expr =
        family === 'poly'
          ? `${a}\\cdot ${n}^2 + (${b})\\cdot ${n} + (${c}) = ${a * n * n} + ${b * n} + ${c}`
          : family === 'fermat'
            ? `2^{2^{${n}}} + 1 = 2^{${2 ** n}} + 1`
            : `2^{${n}} - 1`;
      const tooBig = Math.abs(v) > SAFE;
      api.calc(
        `<p><strong>n = ${n}</strong> : $${expr} = ${tooBig ? '\\text{très grand}' : v}$</p>` +
          (tooBig
            ? ''
            : isPrime(v)
              ? `<p class="lab-ok">${v} ${t('est premier (aucun diviseur ≤', 'is prime (no divisor ≤')} $\\lfloor\\sqrt{${v}}\\rfloor = ${Math.floor(Math.sqrt(v))}$).</p>`
              : v < 2
                ? `<p>${t('Valeur ≤ 1 : ni première ni composée.', 'Value ≤ 1: neither prime nor composite.')}</p>`
                : `<p class="lab-bad">${v} $= ${factorize(v)}$ ${t('est composé : plus petit diviseur', 'is composite: smallest divisor')} <strong>${smallestFactor(v)}</strong>.</p>`),
      );
      stage.redraw();
    };

    const reset = () => {
      selected = -1;
      analyse();
    };

    const famSel = select<Family>(
      t('Famille', 'Family'),
      [
        { value: 'poly', label: t('polynôme an² + bn + c', 'polynomial an² + bn + c') },
        { value: 'fermat', label: t('Fermat 2^(2^n) + 1', 'Fermat 2^(2^n) + 1') },
        { value: 'mersenne', label: t('Mersenne 2^n − 1', 'Mersenne 2^n − 1') },
      ],
      family,
      (f) => {
        family = f;
        if (f !== 'poly') {
          n0 = 0;
          count = Math.min(count, maxCount());
          countParam.set(count);
        }
        reset();
      },
    );
    const aP = param('a', -20, 20, a, 1, (v) => ((a = v), reset()));
    const bP = param('b', -100, 100, b, 1, (v) => ((b = v), reset()));
    const cP = param('c', -100, 2000, c, 1, (v) => ((c = v), reset()));
    const n0F = numField('n₀', n0, (v) => ((n0 = Math.round(v)), (selected = -1), reset()), { min: -100, max: 1000, width: '5rem' });
    const countParam = param(t('cases', 'cells'), 1, 80, count, 1, (v) => ((count = v), reset()));

    controls.append(
      group(t('Famille de formules', 'Formula family'), famSel.row),
      group(t('Coefficients', 'Coefficients'), aP.row, bP.row, cP.row),
      group(t('Plage', 'Range'), n0F.row, countParam.row),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          const { firstBad, run } = analyse();
          log.add([label(), firstBad ? firstBad.n : '—', run], firstBad ? 'bad' : 'ok');
        }, 'primary'),
        button(t('Chercher les records (n² + bn + c)', 'Search records (n² + bn + c)'), () => {
          const found: { b: number; c: number; run: number }[] = [];
          for (let bb = -100; bb <= 100; bb++) {
            for (let cc = 2; cc <= 1700; cc++) {
              if (!isPrime(cc)) continue;
              let k = 0;
              while (k < 90 && isPrime(k * k + bb * k + cc)) k++;
              if (k >= 30) found.push({ b: bb, c: cc, run: k });
            }
          }
          found.sort((x, y) => y.run - x.run);
          log.setColumns([t('formule', 'formula'), t('1er échec', '1st failure'), t('série', 'run')]);
          log.clear();
          found.slice(0, 6).reverse().forEach((f) =>
            log.add([`n² ${f.b < 0 ? '−' : '+'} ${Math.abs(f.b)}n + ${f.c}`, f.run, f.run], 'ok'),
          );
        }),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    // Dessin : une case par valeur de n.
    const layout = () => {
      const cs = cells();
      const size = stage.w < 440 ? 34 : 42;
      const cols = Math.max(1, Math.floor((stage.w - 8) / (size + 4)));
      const rows = Math.ceil(cs.length / cols);
      return { cs, size, cols, rows };
    };
    const needHeight = () => {
      const { size, rows } = layout();
      return rows * (size + 4) + 8;
    };
    stage.heightFn = needHeight;
    stage.setDraw((ctx, w, _h, p) => {
      const { cs, size, cols } = layout();
      const firstBad = cs.find((x) => Number.isFinite(x.v) && !isPrime(x.v))?.n;
      cs.forEach((x, i) => {
        const cx = 4 + (i % cols) * (size + 4);
        const cy = 4 + Math.floor(i / cols) * (size + 4);
        const ok = Number.isFinite(x.v) && isPrime(x.v);
        const small = !Number.isFinite(x.v) || x.v < 2;
        ctx.fillStyle = small ? '#9aa3a0' : ok ? '#1d9a45' : '#d6362b';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(cx, cy, size, size);
        ctx.globalAlpha = 1;
        if (x.n === firstBad) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4;
          ctx.strokeRect(cx + 1, cy + 1, size - 2, size - 2);
        }
        if (x.n === selected) {
          ctx.strokeStyle = p.ink;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(cx - 1, cy - 1, size + 2, size + 2);
        }
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = `700 ${size > 36 ? 14 : 12}px system-ui, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(String(x.n), cx + size / 2, cy + size / 2 - (ok || small ? 0 : 5));
        if (!ok && !small && Number.isFinite(x.v)) {
          ctx.font = '600 10px system-ui, sans-serif';
          ctx.fillText(`÷${smallestFactor(x.v)}`, cx + size / 2, cy + size - 9);
        }
      });
      void w;
    });
    stage.cv.style.cursor = 'pointer';
    stage.cv.addEventListener('pointerdown', (e) => {
      const r = stage.cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * stage.w;
      const y = ((e.clientY - r.top) / r.height) * stage.h;
      const { cs, size, cols } = layout();
      const col = Math.floor((x - 4) / (size + 4));
      const row = Math.floor((y - 4) / (size + 4));
      const i = row * cols + col;
      if (col >= 0 && col < cols && i >= 0 && i < cs.length) showDetail(cs[i].n);
    });

    analyse();
  },
};
