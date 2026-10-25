import { button, enableDrag, fmt, slider, type LabDef } from './core';

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
  aspect: 0.7,
  logEmpty: { fr: 'Appuie sur « Noter » pour garder une configuration.', en: 'Press “Record” to keep a configuration.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let n = 4;
    let v: number[] = [3, 6, 9, 14];
    let fixedSum = false;
    log.setColumns(['n', 'H', 'G', 'A', 'Q', t('ordre', 'order')]);

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
      document.dispatchEvent(new CustomEvent('comima:render-math'));
      stage.redraw();
    };

    const setN = (k: number) => {
      n = k;
      const r = (i: number) => 2 + ((i * 7 + 3) % 15);
      while (v.length < n) v.push(r(v.length));
      v = v.slice(0, n);
      update();
    };
    const nSlider = slider('n', 2, 6, n, 1, setN);
    const sumToggle = (() => {
      const lab = document.createElement('label');
      lab.className = 'lab-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.addEventListener('change', () => {
        fixedSum = cb.checked;
        update();
      });
      lab.append(cb, t(' Somme fixée', ' Fixed sum'));
      return lab;
    })();

    controls.append(
      nSlider.row,
      sumToggle,
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
      button(
        t('Noter', 'Record'),
        () => {
          const m = means(v);
          const ordered = m.H <= m.G + 1e-6 && m.G <= m.A + 1e-6 && m.A <= m.Q + 1e-6;
          log.add([n, fmt(m.H, 2), fmt(m.G, 2), fmt(m.A, 2), fmt(m.Q, 2), ordered ? 'H≤G≤A≤Q' : '?'], ordered ? 'ok' : 'bad');
        },
        'primary',
      ),
    );

    const geom = () => {
      const padL = 40;
      const padR = 76;
      const top = 16;
      const bottom = stage.h - 30;
      return { padL, padR, top, bottom, plotW: stage.w - padL - padR, bw: (stage.w - padL - padR) / n };
    };

    stage.setDraw((ctx, w, h, p) => {
      const g = geom();
      const Y = (val: number) => g.bottom - ((g.bottom - g.top) * val) / MAXV;
      // axe
      ctx.strokeStyle = p.line;
      ctx.fillStyle = p.muted;
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
      // barres
      v.forEach((val, i) => {
        const x = g.padL + i * g.bw + g.bw * 0.15;
        const bw = g.bw * 0.7;
        ctx.fillStyle = 'rgba(29,122,51,0.35)';
        ctx.fillRect(x, Y(val), bw, g.bottom - Y(val));
        ctx.strokeStyle = p.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, Y(val), bw, g.bottom - Y(val));
        ctx.fillStyle = p.surface;
        ctx.beginPath();
        ctx.arc(x + bw / 2, Y(val), 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = p.ink;
        ctx.textAlign = 'center';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText(fmt(val, 1), x + bw / 2, g.bottom + 16);
      });
      // moyennes
      const m = means(v);
      const lines: [string, number, string][] = [
        ['Q', m.Q, '#b45309'],
        ['A', m.A, p.accent],
        ['G', m.G, p.primary],
        ['H', m.H, '#2563eb'],
      ];
      ctx.lineWidth = 2;
      lines.forEach(([name, val, col]) => {
        ctx.strokeStyle = col;
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.moveTo(g.padL, Y(val));
        ctx.lineTo(w - g.padR + 10, Y(val));
        ctx.stroke();
        ctx.setLineDash([]);
      });
      // étiquettes, décalées pour rester lisibles
      const sorted = [...lines].sort((a, b) => b[1] - a[1]);
      let lastY = -Infinity;
      sorted.forEach(([name, val, col]) => {
        let y = Y(val);
        if (y - lastY < 14) y = lastY + 14;
        lastY = y;
        ctx.fillStyle = col;
        ctx.textAlign = 'left';
        ctx.font = '700 12px system-ui, sans-serif';
        ctx.fillText(`${name} = ${fmt(val, 2)}`, w - g.padR + 14, y + 4);
      });
      void h;
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
          // répartit la variation sur les autres barres, sans sortir de [MINV, MAXV]
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
          nv = v[i] + (nv - v[i]) - diff;
        }
        v[i] = nv;
        update();
      },
    );

    update();
  },
};
