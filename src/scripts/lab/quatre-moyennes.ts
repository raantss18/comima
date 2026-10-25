import { button, el, enableDrag, fmt, group, param, toggle, type LabDef } from './core';

/**
 * Chapitre 8 — Inégalités.
 * Les quatre moyennes de n nombres positifs : harmonique ≤ géométrique ≤
 * arithmétique ≤ quadratique, avec égalité si et seulement si tous les nombres
 * sont égaux. Mode « somme fixée » : le produit est maximal quand tout est égal.
 */

const MAXV = 20;
const MINV = 0.5;

const means = (v: number[]) => {
  const n = v.length;
  const A = v.reduce((s, x) => s + x, 0) / n;
  const G = Math.exp(v.reduce((s, x) => s + Math.log(x), 0) / n);
  const H = n / v.reduce((s, x) => s + 1 / x, 0);
  const Q = Math.sqrt(v.reduce((s, x) => s + x * x, 0) / n);
  return { H, G, A, Q };
};

export const def: LabDef = {
  chapter: '08-inegalites',
  numero: 8,
  title: { fr: 'Quatre moyennes en compétition', en: 'Four means in competition' },
  statement: {
    fr: 'Pour des nombres strictement positifs $x_1, \\dots, x_n$, on considère les moyennes <strong>harmonique</strong> $H$, <strong>géométrique</strong> $G$, <strong>arithmétique</strong> $A$ et <strong>quadratique</strong> $Q$. Comment se rangent-elles ?',
    en: 'For strictly positive numbers $x_1, \\dots, x_n$, consider the <strong>harmonic</strong> $H$, <strong>geometric</strong> $G$, <strong>arithmetic</strong> $A$ and <strong>quadratic</strong> $Q$ means. How are they ordered?',
  },
  goal: {
    fr: 'Tire les barres. Quel est l’ordre <em>toujours</em> respecté ? Dans quel cas deux moyennes sont-elles égales ? Active la « somme fixée » : que devient le produit ?',
    en: 'Drag the bars. Which order <em>always</em> holds? When are two means equal? Switch on “fixed sum”: what happens to the product?',
  },
  steps: {
    fr: [
      'Au départ : <strong>$n = 4$ nombres</strong> $3, 6, 9, 14$ sous forme de barres. <strong>Tire le sommet d’une barre</strong>, ou tape les nombres dans le champ « Valeurs » (de 0,5 à 20), ou change $n$ (2 à 6).',
      'Les quatre lignes pointillées sont les moyennes : $H$ (harmonique, bleu), $G$ (géométrique, vert), $A$ (arithmétique, rouge), $Q$ (quadratique, orange). Lis leur ordre.',
      'Active <strong>Somme fixée</strong> : quand tu tires une barre, les autres compensent pour garder la même somme. Regarde alors le produit $x_1 \cdots x_n$.',
      'En bas : la courbe de la <strong>moyenne d’exposant $p$</strong> $M_p$. Bouge le curseur $p$ : retrouve $H$ en $p = -1$, $G$ en $p = 0$, $A$ en $p = 1$, $Q$ en $p = 2$.',
    ],
    en: [
      'At the start: <strong>$n = 4$ numbers</strong> $3, 6, 9, 14$ as bars. <strong>Drag the top of a bar</strong>, or type the numbers in the “Values” field (0.5 to 20), or change $n$ (2 to 6).',
      'The four dotted lines are the means: $H$ (harmonic, blue), $G$ (geometric, green), $A$ (arithmetic, red), $Q$ (quadratic, orange). Read their order.',
      'Switch on <strong>Fixed sum</strong>: when you drag a bar the others compensate to keep the same sum. Then watch the product $x_1 \cdots x_n$.',
      'Bottom: the curve of the <strong>power mean of exponent $p$</strong> $M_p$. Move the $p$ slider: find $H$ at $p = -1$, $G$ at $p = 0$, $A$ at $p = 1$, $Q$ at $p = 2$.',
    ],
  },
  legend: [
    { color: '#2563eb', fr: 'H harmonique (p = −1)', en: 'H harmonic (p = −1)' },
    { color: '#1d7a33', fr: 'G géométrique (p = 0)', en: 'G geometric (p = 0)' },
    { color: '#d6362b', fr: 'A arithmétique (p = 1)', en: 'A arithmetic (p = 1)' },
    { color: '#b45309', fr: 'Q quadratique (p = 2)', en: 'Q quadratic (p = 2)' },
  ],
  hints: {
    fr: [
      'Essaie $n = 2$ avec des valeurs très différentes, puis très proches. Écris l’ordre des quatre moyennes.',
      'Que se passe-t-il quand toutes les barres ont la même hauteur ? Et dès que l’une d’elles bouge un peu ?',
      'Avec la somme fixée, le produit $x_1 \\cdots x_n$ est maximal quand… ? Relie cela à $G \\le A$. Pour $n = 2$ : $(\\sqrt a - \\sqrt b)^2 \\ge 0$.',
    ],
    en: [
      'Try $n = 2$ with very different values, then very close ones. Write down the order of the four means.',
      'What happens when all bars have the same height? And as soon as one moves a little?',
      'With the sum fixed, the product $x_1 \\cdots x_n$ is largest when… ? Link this to $G \\le A$. For $n = 2$: $(\\sqrt a - \\sqrt b)^2 \\ge 0$.',
    ],
  },
  general: {
    fr: '<p><strong>Chaîne des moyennes.</strong> Pour $x_i > 0$ : $$H \\le G \\le A \\le Q,$$ avec égalité (n’importe laquelle) <em>si et seulement si</em> $x_1 = \\dots = x_n$.</p><p><strong>Conséquence (AM–GM).</strong> À somme fixée, le produit est maximal quand tous les nombres sont égaux : $x_1 \\cdots x_n \\le \\left(\\tfrac{x_1 + \\dots + x_n}{n}\\right)^n$. Pour $n = 2$ : $\\sqrt{ab} \\le \\tfrac{a+b}{2} \\iff (\\sqrt a - \\sqrt b)^2 \\ge 0$. Pour $n$ quelconque : lissage (on rapproche deux nombres sans changer la somme : le produit augmente) ou récurrence de Cauchy.</p>',
    en: '<p><strong>Chain of means.</strong> For $x_i > 0$: $$H \\le G \\le A \\le Q,$$ with equality (any of them) <em>if and only if</em> $x_1 = \\dots = x_n$.</p><p><strong>Consequence (AM–GM).</strong> For a fixed sum, the product is largest when all numbers are equal: $x_1 \\cdots x_n \\le \\left(\\tfrac{x_1 + \\dots + x_n}{n}\\right)^n$. For $n = 2$: $\\sqrt{ab} \\le \\tfrac{a+b}{2} \\iff (\\sqrt a - \\sqrt b)^2 \\ge 0$. For general $n$: smoothing (bring two numbers closer without changing the sum: the product grows) or Cauchy’s induction.</p>',
  },
  aspect: 0.95,
  logEmpty: { fr: 'Appuie sur « Noter » pour garder une configuration.', en: 'Press “Record” to keep a configuration.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let n = 4;
    let v: number[] = [3, 6, 9, 14];
    let fixedSum = false;
    let p = 1;
    log.setColumns(['n', 'H', 'G', 'A', 'Q', t('ordre', 'order')]);

    const Mp = (vals: number[], q: number) =>
      Math.abs(q) < 1e-9 ? Math.exp(vals.reduce((s, x) => s + Math.log(x), 0) / vals.length) : Math.pow(vals.reduce((s, x) => s + Math.pow(x, q), 0) / vals.length, 1 / q);

    const listInput = el('input', { type: 'text', class: 'lab-text', value: v.join(' '), 'aria-label': t('Valeurs', 'Values') }) as HTMLInputElement;
    const syncList = () => (listInput.value = v.map((x) => fmt(x, 2)).join(' '));
    const applyList = () => {
      const nums = listInput.value.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
      if (nums.length < 2 || nums.length > 6 || nums.some((x) => !(x >= MINV && x <= MAXV))) {
        api.say(`<div class="lab-bad">${t(`Saisis de 2 à 6 nombres entre ${MINV} et ${MAXV}, séparés par des espaces.`, `Enter 2 to 6 numbers between ${MINV} and ${MAXV}, separated by spaces.`)}</div>`);
        return;
      }
      v = nums;
      n = nums.length;
      nP.set(n);
      update();
    };
    listInput.addEventListener('change', applyList);

    const update = () => {
      const m = means(v);
      const eps = 1e-6;
      const ordered = m.H <= m.G + eps && m.G <= m.A + eps && m.A <= m.Q + eps;
      const allEqual = Math.max(...v) - Math.min(...v) < 1e-6;
      const prod = v.reduce((s, x) => s * x, 1);
      api.say(
        `<div class="lab-big">$H = ${fmt(m.H, 3)}$ ≤ $G = ${fmt(m.G, 3)}$ ≤ $A = ${fmt(m.A, 3)}$ ≤ $Q = ${fmt(m.Q, 3)}$ ${ordered ? '<span class="lab-ok">✔</span>' : '<span class="lab-bad">✘</span>'}</div>` +
          `<div>${t('Produit', 'Product')} $= ${fmt(prod, 2)}$ · ${t('maximum possible à somme égale', 'maximum for the same sum')} $A^n = ${fmt(m.A ** n, 2)}$ ${allEqual ? ' · <span class="lab-ok">' + t('tous égaux : les quatre moyennes coïncident', 'all equal: the four means coincide') + '</span>' : ''}</div>`,
      );
      const mp = Mp(v, p);
      api.calc(
        `<ul><li>$H = \\dfrac{n}{\\sum 1/x_i} = \\dfrac{${n}}{${fmt(v.reduce((s, x) => s + 1 / x, 0), 4)}} = ${fmt(m.H, 4)}$</li>` +
          `<li>$G = \\sqrt[n]{\\prod x_i} = \\sqrt[${n}]{${fmt(prod, 3)}} = ${fmt(m.G, 4)}$</li>` +
          `<li>$A = \\dfrac{\\sum x_i}{n} = \\dfrac{${fmt(v.reduce((s, x) => s + x, 0), 3)}}{${n}} = ${fmt(m.A, 4)}$</li>` +
          `<li>$Q = \\sqrt{\\dfrac{\\sum x_i^2}{n}} = \\sqrt{\\dfrac{${fmt(v.reduce((s, x) => s + x * x, 0), 3)}}{${n}}} = ${fmt(m.Q, 4)}$</li>` +
          `<li>$M_{${fmt(p, 1)}} = \\left(\\dfrac{\\sum x_i^{p}}{n}\\right)^{1/p} = ${fmt(mp, 4)}$ ${t('(limites : min', '(limits: min')} $= ${fmt(Math.min(...v), 2)}$ ${t('quand', 'as')} $p \\to -\\infty$, max $= ${fmt(Math.max(...v), 2)}$ ${t('quand', 'as')} $p \\to +\\infty$)</li></ul>`,
      );
      syncList();
      stage.redraw();
    };

    const setN = (k: number) => {
      n = k;
      const r = (i: number) => 2 + ((i * 7 + 3) % 15);
      while (v.length < n) v.push(r(v.length));
      v = v.slice(0, n);
      update();
    };
    const nP = param('n', 2, 6, n, 1, setN);
    const pP = param('p', -8, 8, p, 0.5, (x) => ((p = x), update()));

    controls.append(
      group(t('Valeurs', 'Values'), nP.row, listInput, button(t('Appliquer', 'Apply'), applyList), toggle(t('Somme fixée', 'Fixed sum'), false, (x) => ((fixedSum = x), update()))),
      group(
        t('Actions', 'Actions'),
        button(t('Aléatoire', 'Random'), () => {
          v = Array.from({ length: n }, () => Math.round((MINV + Math.random() * 18) * 2) / 2);
          update();
        }),
        button(t('Égaliser', 'Equalise'), () => {
          const A = v.reduce((s, x) => s + x, 0) / n;
          v = v.map(() => A);
          update();
        }),
        button(t('Tout × 2', 'Everything × 2'), () => {
          v = v.map((x) => Math.min(MAXV, x * 2));
          update();
        }),
      ),
      group(t('Moyenne d’exposant p', 'Power mean of exponent p'), pP.row),
      group(
        t('Essais', 'Trials'),
        button(
          t('Noter', 'Record'),
          () => {
            const m = means(v);
            const ordered = m.H <= m.G + 1e-6 && m.G <= m.A + 1e-6 && m.A <= m.Q + 1e-6;
            log.add([n, fmt(m.H, 2), fmt(m.G, 2), fmt(m.A, 2), fmt(m.Q, 2), ordered ? 'H≤G≤A≤Q' : '?'], ordered ? 'ok' : 'bad');
          },
          'primary',
        ),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    const geom = () => {
      const padL = 40;
      const padR = 76;
      const top = 14;
      const bottom = stage.h * 0.56;
      return { padL, padR, top, bottom, plotW: stage.w - padL - padR, bw: (stage.w - padL - padR) / n };
    };

    stage.setDraw((ctx, w, h, pal) => {
      const g = geom();
      const Y = (val: number) => g.bottom - ((g.bottom - g.top) * val) / MAXV;
      ctx.strokeStyle = pal.line;
      ctx.fillStyle = pal.muted;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.lineWidth = 1;
      for (let k = 0; k <= MAXV; k += 5) {
        ctx.beginPath();
        ctx.moveTo(g.padL, Y(k));
        ctx.lineTo(w - g.padR, Y(k));
        ctx.stroke();
        ctx.fillText(String(k), g.padL - 6, Y(k) + 4);
      }
      v.forEach((val, i) => {
        const x = g.padL + i * g.bw + g.bw * 0.15;
        const bw = g.bw * 0.7;
        ctx.fillStyle = 'rgba(29,122,51,0.35)';
        ctx.fillRect(x, Y(val), bw, g.bottom - Y(val));
        ctx.strokeStyle = pal.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, Y(val), bw, g.bottom - Y(val));
        ctx.fillStyle = pal.surface;
        ctx.beginPath();
        ctx.arc(x + bw / 2, Y(val), 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pal.ink;
        ctx.textAlign = 'center';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText(fmt(val, 1), x + bw / 2, g.bottom + 14);
      });
      const m = means(v);
      const lines: [string, number, string][] = [
        ['Q', m.Q, '#b45309'],
        ['A', m.A, pal.accent],
        ['G', m.G, pal.primary],
        ['H', m.H, '#2563eb'],
      ];
      ctx.lineWidth = 2;
      lines.forEach(([, val, col]) => {
        ctx.strokeStyle = col;
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.moveTo(g.padL, Y(val));
        ctx.lineTo(w - g.padR + 10, Y(val));
        ctx.stroke();
        ctx.setLineDash([]);
      });
      const sorted = [...lines].sort((a, b) => b[1] - a[1]);
      let lastY = -Infinity;
      sorted.forEach(([name, val, col]) => {
        let y = Y(val);
        if (y - lastY < 13) y = lastY + 13;
        lastY = y;
        ctx.fillStyle = col;
        ctx.textAlign = 'left';
        ctx.font = '700 12px system-ui, sans-serif';
        ctx.fillText(`${name} = ${fmt(val, 2)}`, w - g.padR + 14, y + 4);
      });

      // courbe p ↦ M_p
      const top2 = g.bottom + 34;
      const bot2 = h - 18;
      const lo = Math.min(...v);
      const hi = Math.max(...v);
      const PX = (q: number) => g.padL + ((q + 8) / 16) * g.plotW;
      const PY = (val: number) => bot2 - ((val - lo) / (hi - lo || 1)) * (bot2 - top2) * 0.92 - 4;
      ctx.strokeStyle = pal.line;
      ctx.lineWidth = 1;
      [lo, hi].forEach((val) => {
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(g.padL, PY(val));
        ctx.lineTo(g.padL + g.plotW, PY(val));
        ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.fillStyle = pal.muted;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`min ${fmt(lo, 1)}`, g.padL - 4, PY(lo) + 4);
      ctx.fillText(`max ${fmt(hi, 1)}`, g.padL - 4, PY(hi) + 4);
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let q = -8; q <= 8.001; q += 0.25) {
        const val = Mp(v, q);
        q === -8 ? ctx.moveTo(PX(q), PY(val)) : ctx.lineTo(PX(q), PY(val));
      }
      ctx.stroke();
      [[-1, '#2563eb', 'H'], [0, pal.primary, 'G'], [1, pal.accent, 'A'], [2, '#b45309', 'Q']].forEach(([q, col, nm]) => {
        const val = Mp(v, q as number);
        ctx.fillStyle = col as string;
        ctx.beginPath();
        ctx.arc(PX(q as number), PY(val), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '700 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(nm as string, PX(q as number), PY(val) - 9);
      });
      // curseur p
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PX(p), top2 - 6);
      ctx.lineTo(PX(p), bot2);
      ctx.stroke();
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.arc(PX(p), PY(Mp(v, p)), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.muted;
      ctx.textAlign = 'center';
      ctx.font = '11px system-ui, sans-serif';
      for (const q of [-8, -4, 0, 4, 8]) ctx.fillText(String(q), PX(q), h - 4);
      ctx.textAlign = 'left';
      ctx.fillText(t('p ↦ M_p', 'p ↦ M_p'), g.padL, top2 - 12);
    });

    enableDrag(
      stage,
      () => {
        const g = geom();
        const Y = (val: number) => g.bottom - ((g.bottom - g.top) * val) / MAXV;
        return v.map((val, i) => ({ x: g.padL + i * g.bw + g.bw / 2, y: Y(val), r: 12 }));
      },
      (i, _x, y) => {
        const g = geom();
        let nv = ((g.bottom - y) / (g.bottom - g.top)) * MAXV;
        nv = Math.min(MAXV, Math.max(MINV, Math.round(nv * 2) / 2));
        if (fixedSum && n > 1) {
          let diff = nv - v[i];
          const others = [...v.keys()].filter((k) => k !== i);
          let guard = 0;
          while (Math.abs(diff) > 1e-9 && guard++ < 10) {
            const free = others.filter((k) => (diff > 0 ? v[k] > MINV + 1e-9 : v[k] < MAXV - 1e-9));
            if (!free.length) break;
            const share = diff / free.length;
            let used = 0;
            free.forEach((k) => {
              const target = Math.min(MAXV, Math.max(MINV, v[k] - share));
              used += v[k] - target;
              v[k] = target;
            });
            diff -= used;
          }
          nv -= diff;
        }
        v[i] = nv;
        update();
      },
    );

    update();
  },
};
