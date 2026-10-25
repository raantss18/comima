import { binom, button, fmt, segmented, slider, type LabDef } from './core';

/**
 * Chapitre 6 — Combinatoire.
 * Chemins de (0,0) à (n,n) en pas → et ↑ : combien restent sous la diagonale ?
 */

/** Nombre de chemins qui ne passent jamais au-dessus de la diagonale (DP). */
function dyck(n: number): number {
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  dp[0][0] = 1;
  for (let x = 0; x <= n; x++)
    for (let y = 0; y <= x; y++) {
      if (x === 0 && y === 0) continue;
      dp[x][y] = (x > 0 ? dp[x - 1][y] : 0) + (y > 0 && y <= x ? dp[x][y - 1] : 0);
    }
  return dp[n][n];
}

export const def: LabDef = {
  chapter: '06-combinatoire',
  numero: 6,
  title: { fr: 'Chemins sous la diagonale', en: 'Paths below the diagonal' },
  statement: {
    fr: 'Un chemin va de $(0,0)$ à $(n,n)$ avec des pas « droite » et « haut ». Parmi les $\\binom{2n}{n}$ chemins, combien ne passent <em>jamais au-dessus</em> de la diagonale $y = x$ ?',
    en: 'A path goes from $(0,0)$ to $(n,n)$ with “right” and “up” steps. Among the $\\binom{2n}{n}$ paths, how many <em>never rise above</em> the diagonal $y = x$?',
  },
  goal: {
    fr: 'Compte pour $n = 1, 2, 3, 4, \\dots$ : quelle suite ? Quel est le <em>rapport</em> entre le nombre total de chemins et les bons chemins ?',
    en: 'Count for $n = 1, 2, 3, 4, \\dots$: which sequence? What is the <em>ratio</em> between the total number of paths and the good ones?',
  },
  hints: {
    fr: [
      'Remplis le tableau jusqu’à $n = 8$. Les nombres te rappellent-ils quelque chose (1, 2, 5, 14, …) ?',
      'Regarde la colonne « total ÷ bons » : une régularité apparaît-elle ?',
      'Un chemin « mauvais » touche la droite $y = x + 1$. Réfléchis-le (symétrie) à partir du premier contact : où termine-t-il alors ? Combien de chemins mènent à ce point ?',
    ],
    en: [
      'Fill in the table up to $n = 8$. Do the numbers ring a bell (1, 2, 5, 14, …)?',
      'Look at the “total ÷ good” column: does a pattern appear?',
      'A “bad” path touches the line $y = x + 1$. Reflect it (symmetry) from the first touch: where does it end? How many paths lead to that point?',
    ],
  },
  general: {
    fr: '<p><strong>Nombres de Catalan.</strong> Le nombre de bons chemins est $$C_n = \\frac{1}{n+1}\\binom{2n}{n},$$ soit $1, 1, 2, 5, 14, 42, 132, 429, \\dots$ Le rapport « total ÷ bons » vaut donc exactement $n + 1$.</p><p><strong>Principe de réflexion</strong> : les mauvais chemins sont en bijection avec les chemins de $(0,0)$ à $(n-1, n+1)$, d’où $\\binom{2n}{n} - \\binom{2n}{n+1} = C_n$. Les mêmes nombres comptent les parenthésages, les triangulations d’un polygone, les arbres binaires…</p>',
    en: '<p><strong>Catalan numbers.</strong> The number of good paths is $$C_n = \\frac{1}{n+1}\\binom{2n}{n},$$ i.e. $1, 1, 2, 5, 14, 42, 132, 429, \\dots$ So the “total ÷ good” ratio is exactly $n + 1$.</p><p><strong>Reflection principle</strong>: bad paths are in bijection with paths from $(0,0)$ to $(n-1, n+1)$, hence $\\binom{2n}{n} - \\binom{2n}{n+1} = C_n$. The same numbers count bracketings, triangulations of a polygon, binary trees…</p>',
  },
  aspect: 0.82,
  logEmpty: { fr: 'Clique sur « Remplir » ou « Noter ».', en: 'Click “Fill” or “Record”.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let n = 4;
    let view: 'all' | 'good' | 'bad' = 'all';
    let highlight: number[] | null = null; // un chemin choisi : suite de 0 (droite) / 1 (haut)
    log.setColumns(['n', t('total', 'total'), t('bons', 'good'), t('total ÷ bons', 'total ÷ good')]);

    // Énumération (n ≤ 8) : chemins sous forme de masques.
    let all: { path: number[]; good: boolean }[] = [];
    const enumerate = () => {
      all = [];
      const len = 2 * n;
      const rec = (path: number[], r: number, u: number, good: boolean) => {
        if (path.length === len) {
          all.push({ path: path.slice(), good });
          return;
        }
        if (r < n) {
          path.push(0);
          rec(path, r + 1, u, good);
          path.pop();
        }
        if (u < n) {
          path.push(1);
          rec(path, r, u + 1, good && u + 1 <= r);
          path.pop();
        }
      };
      rec([], 0, 0, true);
    };

    const update = () => {
      enumerate();
      const good = all.filter((p) => p.good).length;
      const total = all.length;
      api.say(
        `<div class="lab-big">${t('Chemins', 'Paths')} : <strong>${total}</strong> · ${t('bons', 'good')} : <strong class="lab-ok">${good}</strong> · ${t('mauvais', 'bad')} : <strong class="lab-bad">${total - good}</strong></div>` +
          `<div>${t('Rapport total ÷ bons', 'Ratio total ÷ good')} = <strong>${fmt(total / good, 4)}</strong></div>`,
      );
      stage.redraw();
    };

    const nSlider = slider('n', 1, 8, n, 1, (v) => {
      n = v;
      highlight = null;
      update();
    });
    const viewSeg = segmented(
      [
        { value: 'all' as const, label: t('Tous', 'All') },
        { value: 'good' as const, label: t('Bons', 'Good') },
        { value: 'bad' as const, label: t('Mauvais', 'Bad') },
      ],
      'all',
      (v) => {
        view = v;
        stage.redraw();
      },
    );
    controls.append(
      nSlider.row,
      viewSeg.row,
      button(t('Un chemin au hasard', 'A random path'), () => {
        highlight = all[Math.floor(Math.random() * all.length)].path;
        const g = all.find((p) => p.path === highlight)!.good;
        update();
        api.readout.insertAdjacentHTML('beforeend', `<div>${g ? '<span class="lab-ok">✔ ' + t('reste sous la diagonale', 'stays below the diagonal') : '<span class="lab-bad">✘ ' + t('dépasse la diagonale', 'crosses the diagonal')}</span></div>`);
      }),
      button(t('Noter', 'Record'), () => {
        const good = all.filter((p) => p.good).length;
        log.add([n, all.length, good, fmt(all.length / good, 4)]);
      }, 'primary'),
      button(t('Remplir (n = 1…10)', 'Fill (n = 1…10)'), () => {
        log.clear();
        for (let k = 10; k >= 1; k--) {
          const tot = binom(2 * k, k);
          const g = dyck(k);
          log.add([k, tot, g, fmt(tot / g, 4)], 'ok');
        }
      }),
    );

    stage.setDraw((ctx, w, h, p) => {
      const s = Math.min(w, h) - 36;
      const x0 = (w - s) / 2;
      const y0 = 12;
      const X = (i: number) => x0 + (i * s) / n;
      const Y = (j: number) => y0 + s - (j * s) / n;
      // grille
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 1;
      for (let i = 0; i <= n; i++) {
        ctx.beginPath();
        ctx.moveTo(X(i), Y(0));
        ctx.lineTo(X(i), Y(n));
        ctx.moveTo(X(0), Y(i));
        ctx.lineTo(X(n), Y(i));
        ctx.stroke();
      }
      // zone interdite (au-dessus de la diagonale)
      ctx.fillStyle = 'rgba(214,54,43,0.07)';
      ctx.beginPath();
      ctx.moveTo(X(0), Y(0));
      ctx.lineTo(X(0), Y(n));
      ctx.lineTo(X(n), Y(n));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = p.accent;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(0));
      ctx.lineTo(X(n), Y(n));
      ctx.stroke();
      ctx.setLineDash([]);
      // tous les chemins, très transparents
      const draw = (path: number[], color: string, lw: number, alpha: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        let x = 0;
        let y = 0;
        ctx.moveTo(X(0), Y(0));
        for (const st of path) {
          if (st === 0) x++;
          else y++;
          ctx.lineTo(X(x), Y(y));
        }
        ctx.stroke();
      };
      const alpha = Math.max(0.025, Math.min(0.35, 18 / all.length));
      for (const pth of all.filter((q) => view === 'all' || (view === 'good') === q.good)) draw(pth.path, pth.good ? p.ok : p.bad, 1.6, pth.good ? alpha * 1.4 : alpha);
      ctx.globalAlpha = 1;
      if (highlight) {
        draw(highlight, p.ink, 3.4, 1);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = p.ink;
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('(0,0)', X(0), Y(0) + 15);
      ctx.fillText(`(${n},${n})`, X(n), Y(n) - 6);
    });

    update();
  },
};
