import { button, group, numField, param, select, toggle, type LabDef } from './core';

/**
 * Chapitre 6 — Combinatoire.
 * Le triangle de Pascal modulo m : motifs de Sierpiński, nombre d'entrées impaires par ligne.
 */

type Mode = 'residue' | 'nonzero' | 'zero';

const popcount = (n: number) => n.toString(2).split('').filter((c) => c === '1').length;

export const def: LabDef = {
  chapter: '06-combinatoire',
  numero: 6,
  title: { fr: 'Le triangle de Pascal et ses motifs', en: 'Pascal’s triangle and its patterns' },
  statement: {
    fr: 'Dans le triangle de Pascal, chaque nombre est la somme des deux au-dessus de lui : $\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}$. Colorions chaque nombre selon son <em>reste modulo $m$</em>. Quels motifs apparaissent ? Combien de nombres <em>impairs</em> y a-t-il dans la ligne $n$ ?',
    en: 'In Pascal’s triangle each number is the sum of the two above it: $\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}$. Colour each number by its <em>remainder modulo $m$</em>. Which patterns appear? How many <em>odd</em> numbers are in row $n$?',
  },
  goal: {
    fr: 'Pour $m = 2$, compte les entiers impairs de chaque ligne et compare-les aux puissances de 2. Quelles lignes sont <em>entièrement</em> impaires ? Essaie ensuite $m = 3, 5$ et un $m$ non premier.',
    en: 'For $m = 2$, count the odd integers in each row and compare with powers of 2. Which rows are <em>entirely</em> odd? Then try $m = 3, 5$ and a non-prime $m$.',
  },
  steps: {
    fr: [
      'Au départ : <strong>32 lignes</strong> du triangle, colorées <strong>modulo $m = 2$</strong> (case colorée = impair). Change le nombre de lignes (jusqu’à 64) et le module $m$ (2 à 12).',
      'Choisis le <strong>mode de coloration</strong> : un reste = une couleur, ou seulement les restes non nuls, ou seulement les multiples de $m$.',
      'Clique une case : le panneau « Comment c’est calculé » donne $\\binom nk$, son reste et la règle d’addition (et le théorème de Lucas si $m$ est premier).',
      'Le tableau compte les entrées non multiples de $m$ dans chaque ligne ; pour $m = 2$ il les compare à $2^{s(n)}$ ($s$ = nombre de 1 en binaire). Bouton <strong>Remplir</strong> pour $n = 0\\dots 31$.',
    ],
    en: [
      'At the start: <strong>32 rows</strong> of the triangle, coloured <strong>modulo $m = 2$</strong> (coloured cell = odd). Change the number of rows (up to 64) and the modulus $m$ (2 to 12).',
      'Choose the <strong>colouring mode</strong>: one remainder = one colour, or only non-zero remainders, or only multiples of $m$.',
      'Click a cell: the “How it is computed” panel gives $\\binom nk$, its remainder and the addition rule (and Lucas’s theorem when $m$ is prime).',
      'The table counts entries not divisible by $m$ in each row; for $m = 2$ it compares them with $2^{s(n)}$ ($s$ = number of 1s in binary). <strong>Fill</strong> button for $n = 0\\dots 31$.',
    ],
  },
  legend: [
    { color: '#1d7a33', fr: 'reste 1', en: 'remainder 1' },
    { color: '#2563eb', fr: 'reste 2', en: 'remainder 2' },
    { color: '#f59e0b', fr: 'reste 3', en: 'remainder 3' },
    { color: '#e5e7eb', fr: 'reste 0 (multiple de m)', en: 'remainder 0 (multiple of m)' },
  ],
  hints: {
    fr: [
      'Pour $m = 2$, repère les lignes $n = 1, 3, 7, 15, 31$ : que peux-tu dire de leur écriture en binaire ?',
      'Compare le nombre d’entrées impaires de la ligne $n$ avec $2^{s}$ où $s$ est le nombre de chiffres 1 de $n$ en binaire.',
      'Théorème de Lucas : $\\binom nk \\equiv \\prod \\binom{n_i}{k_i} \\pmod p$ où $n_i, k_i$ sont les chiffres en base $p$. Pourquoi cela donne-t-il un fractal ?',
    ],
    en: [
      'For $m = 2$, spot rows $n = 1, 3, 7, 15, 31$: what do you notice about their binary writing?',
      'Compare the number of odd entries of row $n$ with $2^{s}$ where $s$ is the number of 1-digits of $n$ in binary.',
      'Lucas’s theorem: $\\binom nk \\equiv \\prod \\binom{n_i}{k_i} \\pmod p$ where $n_i, k_i$ are the base-$p$ digits. Why does this give a fractal?',
    ],
  },
  general: {
    fr: '<p><strong>Parité.</strong> Le nombre d’entiers impairs de la ligne $n$ est $2^{s_2(n)}$ où $s_2(n)$ est le nombre de 1 dans l’écriture binaire de $n$ ; la ligne est entièrement impaire ssi $n = 2^k - 1$. Le motif obtenu est le <em>triangle de Sierpiński</em>.</p><p><strong>Lucas.</strong> Pour $p$ premier, $\\binom{n}{k} \\equiv \\prod_i \\binom{n_i}{k_i} \\pmod p$ (chiffres en base $p$) ; le nombre d’entrées non divisibles par $p$ est $\\prod_i (n_i + 1)$. Pour $m$ composé le motif est plus compliqué mais reste auto-similaire.</p>',
    en: '<p><strong>Parity.</strong> The number of odd integers in row $n$ is $2^{s_2(n)}$ where $s_2(n)$ is the number of 1s in the binary writing of $n$; the row is entirely odd iff $n = 2^k - 1$. The pattern is the <em>Sierpiński triangle</em>.</p><p><strong>Lucas.</strong> For $p$ prime, $\\binom{n}{k} \\equiv \\prod_i \\binom{n_i}{k_i} \\pmod p$ (base-$p$ digits); the number of entries not divisible by $p$ is $\\prod_i (n_i + 1)$. For composite $m$ the pattern is more complicated but still self-similar.</p>',
  },
  aspect: 0.9,
  logEmpty: { fr: 'Appuie sur « Remplir » ou « Noter ».', en: 'Press “Fill” or “Record”.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let R = 32;
    let m = 2;
    let mode: Mode = 'nonzero';
    let showNums = false;
    let sel: [number, number] | null = null;
    let big: bigint[][] = [];
    let mod: number[][] = [];
    log.setColumns(['m', 'n', t('non multiples de m', 'not multiples of m'), m === 2 ? '2^s(n)' : '∏(nᵢ+1)', t('égal ?', 'equal?')]);

    const build = () => {
      big = [];
      mod = [];
      for (let n = 0; n < R; n++) {
        big.push([]);
        mod.push([]);
        for (let k = 0; k <= n; k++) {
          const v = k === 0 || k === n ? 1n : big[n - 1][k - 1] + big[n - 1][k];
          big[n].push(v);
          mod[n].push(Number(v % BigInt(m)));
        }
      }
    };
    const isPrime = (x: number) => x > 1 && Array.from({ length: x - 2 }, (_, i) => i + 2).every((d) => x % d !== 0);
    const digits = (x: number) => {
      const out: number[] = [];
      while (x > 0) {
        out.push(x % m);
        x = Math.floor(x / m);
      }
      return out.length ? out : [0];
    };
    const nonzeroCount = (n: number) => mod[n].filter((v) => v !== 0).length;
    const lucasProd = (n: number) => digits(n).reduce((p, d) => p * (d + 1), 1);

    const update = () => {
      build();
      sel = sel && sel[0] < R ? sel : null;
      const lastRow = R - 1;
      api.say(
        `<div class="lab-big">${t('Ligne', 'Row')} $n = ${lastRow}$ : <strong>${nonzeroCount(lastRow)}</strong> ${t('entrées non multiples de', 'entries not divisible by')} $${m}$ ${t('sur', 'out of')} ${lastRow + 1}${m === 2 ? ` · $2^{s(${lastRow})} = 2^{${popcount(lastRow)}} = ${2 ** popcount(lastRow)}$ ${nonzeroCount(lastRow) === 2 ** popcount(lastRow) ? '<span class="lab-ok">✔</span>' : ''}` : isPrime(m) ? ` · $\\prod(n_i + 1) = ${lucasProd(lastRow)}$ ${nonzeroCount(lastRow) === lucasProd(lastRow) ? '<span class="lab-ok">✔</span>' : '<span class="lab-bad">✘</span>'}` : ''}</div>`,
      );
      const [n, k] = sel ?? [Math.min(R - 1, 10), 3];
      if (!sel) sel = [n, Math.min(k, n)];
      const [sn, sk] = sel;
      const val = big[sn][sk];
      let detail = `<p>$\\binom{${sn}}{${sk}} = ${val}$ ⇒ ${t('reste modulo', 'remainder modulo')} ${m} : <strong>${mod[sn][sk]}</strong>.</p>`;
      if (sn > 0 && sk > 0 && sk < sn)
        detail += `<p>${t('Somme des deux cases au-dessus', 'Sum of the two cells above')} : $\\binom{${sn - 1}}{${sk - 1}} + \\binom{${sn - 1}}{${sk}} = ${big[sn - 1][sk - 1]} + ${big[sn - 1][sk]} = ${val}$ ; ${t('modulo', 'mod')} ${m} : $${mod[sn - 1][sk - 1]} + ${mod[sn - 1][sk]} \\equiv ${mod[sn][sk]}$.</p>`;
      if (isPrime(m)) {
        const dn = digits(sn);
        const dk = digits(sk);
        while (dk.length < dn.length) dk.push(0);
        const factors = dn.map((d, i) => `\\binom{${d}}{${dk[i]}}`).reverse().join('\\cdot ');
        detail += `<p>Lucas (${t('base', 'base')} ${m}) : $${sn} = (${[...dn].reverse().join('\\,')})_${m}$, $${sk} = (${[...dk].reverse().join('\\,')})_${m}$ ⇒ $\\binom{${sn}}{${sk}} \\equiv ${factors} \\pmod ${m}$.</p>`;
      }
      api.calc(detail + `<p>${t('Entrées non multiples de', 'Entries not divisible by')} ${m} ${t('dans la ligne', 'in row')} ${sn} : <strong>${nonzeroCount(sn)}</strong>.</p>`);
      stage.relayout();
    };

    const colors = ['#e5e7eb', '#1d7a33', '#2563eb', '#f59e0b', '#9333ea', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#475569', '#7c3aed', '#0d9488'];

    const RP = param(t('lignes', 'rows'), 4, 64, R, 1, (v) => ((R = v), (sel = null), update()));
    const mP = param('m', 2, 12, m, 1, (v) => {
      m = v;
      sel = null;
      log.setColumns(['m', 'n', t('non multiples de m', 'not multiples of m'), m === 2 ? '2^s(n)' : '∏(nᵢ+1)', t('égal ?', 'equal?')]);
      update();
    });
    const modeSel = select<Mode>(
      t('Coloration', 'Colouring'),
      [
        { value: 'nonzero', label: t('restes non nuls', 'non-zero remainders') },
        { value: 'residue', label: t('un reste = une couleur', 'one remainder = one colour') },
        { value: 'zero', label: t('multiples de m seulement', 'multiples of m only') },
      ],
      mode,
      (v) => ((mode = v), stage.redraw()),
    );
    const nF = numField(t('ligne n choisie', 'chosen row n'), 10, (v) => {
      sel = [Math.min(R - 1, Math.max(0, Math.round(v))), 0];
      sel[1] = Math.min(sel[1], sel[0]);
      update();
    }, { min: 0, max: 63, width: '4rem' });

    controls.append(
      group(t('Triangle', 'Triangle'), RP.row, mP.row, modeSel.row, toggle(t('nombres', 'numbers'), false, (v) => ((showNums = v), stage.redraw()))),
      group(
        t('Essais', 'Trials'),
        nF.row,
        button(t('Noter la ligne choisie', 'Record chosen row'), () => {
          const n = sel ? sel[0] : R - 1;
          const ref = m === 2 ? 2 ** popcount(n) : isPrime(m) ? lucasProd(n) : NaN;
          log.add([m, n, nonzeroCount(n), isNaN(ref) ? '—' : ref, isNaN(ref) ? '' : nonzeroCount(n) === ref ? '✔' : '✘'], !isNaN(ref) && nonzeroCount(n) === ref ? 'ok' : undefined);
        }, 'primary'),
        button(t('Remplir (n = 0…31)', 'Fill (n = 0…31)'), () => {
          log.clear();
          const rows = Math.min(R, 32);
          for (let n = rows - 1; n >= 0; n--) {
            const ref = m === 2 ? 2 ** popcount(n) : isPrime(m) ? lucasProd(n) : NaN;
            log.add([m, n, nonzeroCount(n), isNaN(ref) ? '—' : ref, isNaN(ref) ? '' : nonzeroCount(n) === ref ? '✔' : '✘'], !isNaN(ref) && nonzeroCount(n) === ref ? 'ok' : undefined);
          }
        }),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    const cellSize = () => Math.max(6, Math.min(26, (stage.w - 8) / (R + 1)));
    stage.heightFn = () => R * cellSize() * 0.92 + 14;
    stage.setDraw((ctx, w, _h, p) => {
      if (!mod.length) return;
      const c = cellSize();
      const cx = w / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let n = 0; n < R; n++)
        for (let k = 0; k <= n; k++) {
          const v = mod[n][k];
          const x = cx + (k - n / 2) * c - c / 2;
          const y = 6 + n * c * 0.92;
          const colored = mode === 'residue' ? true : mode === 'nonzero' ? v !== 0 : v === 0;
          ctx.fillStyle = colored ? (mode === 'nonzero' ? colors[1] : mode === 'zero' ? colors[3] : colors[v]) : 'transparent';
          if (mode === 'residue' && v === 0) ctx.fillStyle = colors[0];
          if (colored) ctx.fillRect(x + 0.5, y + 0.5, c - 1, c * 0.92 - 1);
          else {
            ctx.fillStyle = p.line;
            ctx.globalAlpha = 0.35;
            ctx.fillRect(x + 0.5, y + 0.5, c - 1, c * 0.92 - 1);
            ctx.globalAlpha = 1;
          }
          if (showNums && c >= 18) {
            ctx.fillStyle = colored && v !== 0 ? '#fff' : p.ink;
            ctx.font = `600 ${Math.min(11, c * 0.45)}px system-ui, sans-serif`;
            ctx.fillText(String(v), x + c / 2, y + c * 0.46);
          }
          if (sel && sel[0] === n && sel[1] === k) {
            ctx.strokeStyle = p.accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, c, c * 0.92);
          }
        }
    });
    stage.cv.style.cursor = 'pointer';
    stage.cv.addEventListener('pointerdown', (e) => {
      const r = stage.cv.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * stage.w;
      const py = ((e.clientY - r.top) / r.height) * stage.h;
      const c = cellSize();
      const n = Math.floor((py - 6) / (c * 0.92));
      if (n < 0 || n >= R) return;
      const k = Math.floor((px - stage.w / 2) / c + n / 2 + 0.5);
      if (k >= 0 && k <= n) {
        sel = [n, k];
        nF.set(n);
        update();
      }
    });

    update();
  },
};
