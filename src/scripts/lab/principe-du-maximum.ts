import { button, group, numField, param, select, toggle, type LabDef } from './core';

/**
 * Chapitre 2 — Principe extrémal.
 * Une plaque dont chaque case intérieure est la moyenne de ses 4 voisines :
 * le maximum (et le minimum) sont-ils à l'intérieur ou au bord ?
 */

type Init = 'zero' | 'random' | 'hot' | 'mean';

export const def: LabDef = {
  chapter: '02-principe-extremal',
  numero: 2,
  title: { fr: 'Où est le maximum ?', en: 'Where is the maximum?' },
  statement: {
    fr: 'Une grille $N \\times N$ porte un nombre dans chaque case. Les cases du <strong>bord</strong> sont fixées ; chaque case <strong>intérieure</strong> doit finir par égaler la <em>moyenne</em> de ses quatre voisines. Où se trouvent la plus grande et la plus petite valeur ?',
    en: 'An $N \\times N$ grid has a number in each cell. The <strong>border</strong> cells are fixed; every <strong>interior</strong> cell must end up equal to the <em>average</em> of its four neighbours. Where are the largest and smallest values?',
  },
  goal: {
    fr: 'Lance l’itération « chaque case devient la moyenne de ses voisines » depuis différents états de départ. Que deviennent le maximum et le minimum ? Y a-t-il toujours un extremum à l’intérieur ?',
    en: 'Run the iteration “each cell becomes the average of its neighbours” from different starting states. What happens to the maximum and minimum? Is there ever an extremum inside?',
  },
  steps: {
    fr: [
      'Au départ : grille <strong>$8 \\times 8$</strong>, bords à $0$ (gauche, bas), $100$ (haut), $50$ (droite) et intérieur à $0$. Tout est modifiable : taille, quatre côtés, ou <em>clique une case du bord</em> pour fixer sa valeur.',
      'Choisis l’<strong>intérieur de départ</strong> (zéro, aléatoire, point chaud de 100, moyenne) puis appuie sur <strong>▶ Itérer</strong> (ou « +1 », « +10 »).',
      'Les couleurs vont du <strong>bleu</strong> (petit) au <strong>rouge</strong> (grand). Les cases entourées de noir sont le maximum ★ et le minimum ◆ de la grille.',
      'Observe le panneau « Comment c’est calculé » : la moyenne exacte d’une case choisie, et l’écart maximal à la moyenne (le « résidu »). Quand il tend vers 0, la plaque est stable.',
    ],
    en: [
      'At the start: an <strong>$8 \\times 8$</strong> grid, border $0$ (left, bottom), $100$ (top), $50$ (right) and interior $0$. Everything is editable: size, four sides, or <em>click a border cell</em> to set its value.',
      'Pick the <strong>starting interior</strong> (zero, random, hot spot of 100, mean) then press <strong>▶ Iterate</strong> (or “+1”, “+10”).',
      'Colours go from <strong>blue</strong> (small) to <strong>red</strong> (large). Cells outlined in black are the grid’s maximum ★ and minimum ◆.',
      'Read the “How it is computed” panel: the exact average for a chosen cell and the largest gap to the average (the “residual”). When it tends to 0 the plate is stable.',
    ],
  },
  legend: [
    { color: '#2563eb', fr: 'petite valeur', en: 'small value' },
    { color: '#fbbf24', fr: 'valeur moyenne', en: 'medium value' },
    { color: '#dc2626', fr: 'grande valeur', en: 'large value' },
    { color: '#111827', fr: 'contour noir : maximum ★ / minimum ◆', en: 'black outline: maximum ★ / minimum ◆' },
  ],
  hints: {
    fr: [
      'Démarre avec un intérieur « point chaud » à 100 : la valeur la plus grande est d’abord à l’intérieur. Que devient-elle après quelques itérations ?',
      'Au bout d’un grand nombre d’itérations (résidu ≈ 0), cherche où sont ★ et ◆. Change les valeurs du bord et recommence.',
      'Si une case intérieure était strictement plus grande que tous ses voisins, pourrait-elle être leur moyenne ? Raisonne avec la <em>plus grande</em> valeur de la grille.',
    ],
    en: [
      'Start with a “hot spot” interior of 100: the largest value is first inside. What becomes of it after a few iterations?',
      'After many iterations (residual ≈ 0), find where ★ and ◆ are. Change the border values and start again.',
      'If an interior cell were strictly larger than all its neighbours, could it be their average? Reason with the <em>largest</em> value of the grid.',
    ],
  },
  general: {
    fr: '<p><strong>Principe du maximum.</strong> Si chaque case intérieure est la moyenne de ses voisines, alors le maximum et le minimum de la grille sont atteints <em>sur le bord</em>. Preuve extrémale : prends une case où le maximum $M$ est atteint à l’intérieur ; sa valeur est la moyenne de 4 nombres $\\le M$, donc ils valent tous $M$ ; de proche en proche on arrive au bord.</p><p>C’est la version discrète du principe du maximum pour les fonctions harmoniques ($\\Delta u = 0$). Conséquence : le problème « bord donné, intérieur moyenne des voisines » a <strong>une seule</strong> solution.</p>',
    en: '<p><strong>Maximum principle.</strong> If every interior cell is the average of its neighbours, then the maximum and the minimum of the grid are reached <em>on the border</em>. Extremal proof: take a cell where the maximum $M$ is reached inside; its value is the average of 4 numbers $\\le M$, so all equal $M$; step by step we reach the border.</p><p>This is the discrete maximum principle for harmonic functions ($\\Delta u = 0$). Consequence: the problem “given border, interior = average of neighbours” has <strong>exactly one</strong> solution.</p>',
  },
  aspect: 0.9,
  logEmpty: { fr: 'Itère puis appuie sur « Noter ».', en: 'Iterate then press “Record”.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let N = 8;
    let sides = { top: 100, right: 50, bottom: 0, left: 0 };
    let init: Init = 'zero';
    let U: number[][] = [];
    let border: boolean[][] = [];
    let iter = 0;
    let sel: [number, number] | null = null;
    let running = false;
    let showNums = true;
    let timer = 0;
    log.setColumns([t('N', 'N'), t('itér.', 'iter.'), 'max', t('où ?', 'where?'), 'min', t('où ?', 'where?')]);

    const isBorder = (i: number, j: number) => i === 0 || j === 0 || i === N - 1 || j === N - 1;
    const setBorderFromSides = () => {
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) {
          if (!isBorder(i, j)) continue;
          const vals: number[] = [];
          if (i === 0) vals.push(sides.top);
          if (i === N - 1) vals.push(sides.bottom);
          if (j === 0) vals.push(sides.left);
          if (j === N - 1) vals.push(sides.right);
          U[i][j] = vals.reduce((s, v) => s + v, 0) / vals.length;
        }
    };
    const meanBorder = () => {
      let s = 0;
      let c = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (isBorder(i, j)) (s += U[i][j]), c++;
      return s / c;
    };
    const build = (keepBorder = false) => {
      const old = U;
      U = Array.from({ length: N }, () => new Array(N).fill(0));
      border = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => isBorder(i, j)));
      if (keepBorder && old.length === N) {
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (isBorder(i, j)) U[i][j] = old[i][j];
      } else {
        setBorderFromSides();
      }
      const m = meanBorder();
      for (let i = 1; i < N - 1; i++)
        for (let j = 1; j < N - 1; j++)
          U[i][j] = init === 'zero' ? 0 : init === 'random' ? Math.round(Math.random() * 100) : init === 'hot' ? (Math.abs(i - (N - 1) / 2) < 1 && Math.abs(j - (N - 1) / 2) < 1 ? 100 : 0) : m;
      iter = 0;
      sel = null;
      analyse();
    };
    const step = (k = 1) => {
      for (let r = 0; r < k; r++) {
        const V = U.map((row) => row.slice());
        for (let i = 1; i < N - 1; i++) for (let j = 1; j < N - 1; j++) V[i][j] = (U[i - 1][j] + U[i + 1][j] + U[i][j - 1] + U[i][j + 1]) / 4;
        U = V;
        iter++;
      }
      analyse();
    };
    const residual = () => {
      let m = 0;
      for (let i = 1; i < N - 1; i++)
        for (let j = 1; j < N - 1; j++) m = Math.max(m, Math.abs(U[i][j] - (U[i - 1][j] + U[i + 1][j] + U[i][j - 1] + U[i][j + 1]) / 4));
      return m;
    };
    const extrema = () => {
      let mx = -Infinity;
      let mn = Infinity;
      for (const row of U) for (const v of row) (mx = Math.max(mx, v)), (mn = Math.min(mn, v));
      const at = (val: number) => {
        const out: [number, number][] = [];
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (Math.abs(U[i][j] - val) < 1e-9) out.push([i, j]);
        return out;
      };
      return { mx, mn, mxAt: at(mx), mnAt: at(mn) };
    };
    const where = (cells: [number, number][]) => (cells.some(([i, j]) => !isBorder(i, j)) ? t('intérieur', 'interior') : t('bord', 'border'));

    function analyse() {
      const e = extrema();
      const r = residual();
      api.say(
        `<div class="lab-big">${t('Itération', 'Iteration')} <strong>${iter}</strong> · max = <strong>${e.mx.toFixed(2)}</strong> (${where(e.mxAt)}) · min = <strong>${e.mn.toFixed(2)}</strong> (${where(e.mnAt)})</div>` +
          `<div>${t('Résidu (écart max à la moyenne)', 'Residual (max gap to the average)')} : <strong>${r < 1e-6 ? '< 10⁻⁶' : r.toFixed(4)}</strong> ${r < 1e-3 ? '<span class="lab-ok">✔ ' + t('plaque stable', 'stable plate') + '</span>' : ''}</div>`,
      );
      let detail = '';
      if (sel && !isBorder(sel[0], sel[1])) {
        const [i, j] = sel;
        const a = U[i - 1][j];
        const b = U[i + 1][j];
        const c = U[i][j - 1];
        const d = U[i][j + 1];
        detail = `<p>${t('Case sélectionnée', 'Selected cell')} (${i + 1},${j + 1}) : $\\dfrac{${a.toFixed(1)} + ${b.toFixed(1)} + ${c.toFixed(1)} + ${d.toFixed(1)}}{4} = ${((a + b + c + d) / 4).toFixed(3)}$ ${t('contre sa valeur', 'versus its value')} $${U[i][j].toFixed(3)}$.</p>`;
      } else if (sel) {
        detail = `<p>${t('Case du bord (fixée) :', 'Border cell (fixed):')} (${sel[0] + 1},${sel[1] + 1}) = ${U[sel[0]][sel[1]].toFixed(2)}.</p>`;
      } else {
        detail = `<p class="muted">${t('Clique une case pour voir son calcul.', 'Click a cell to see its computation.')}</p>`;
      }
      api.calc(
        `<p>${t('Itération', 'Iteration')} : $u_{i,j} \\leftarrow \\dfrac{u_{i-1,j} + u_{i+1,j} + u_{i,j-1} + u_{i,j+1}}{4}$ ${t('pour chaque case intérieure ; le bord ne bouge pas.', 'for each interior cell; the border does not move.')}</p>` +
          detail +
          `<p>${t('Résidu', 'Residual')} $= \\max_{i,j} \\left|u_{i,j} - \\tfrac14(\\dots)\\right| = ${r.toFixed(5)}$.</p>`,
      );
      stage.redraw();
    }

    // Commandes
    const NP = param(t('Taille N', 'Size N'), 3, 14, N, 1, (v) => {
      N = v;
      build();
    });
    const sideCtl = (key: keyof typeof sides, label: string) =>
      param(label, 0, 100, sides[key], 1, (v) => {
        sides[key] = v;
        build();
      });
    const initSel = select<Init>(
      t('Intérieur de départ', 'Starting interior'),
      [
        { value: 'zero', label: t('tout à 0', 'all 0') },
        { value: 'random', label: t('aléatoire', 'random') },
        { value: 'hot', label: t('point chaud (100)', 'hot spot (100)') },
        { value: 'mean', label: t('moyenne du bord', 'border mean') },
      ],
      init,
      (v) => {
        init = v;
        build(true);
      },
    );
    const cellF = numField(t('valeur de la case sélectionnée (bord)', 'selected cell value (border)'), 0, (v) => {
      if (sel && isBorder(sel[0], sel[1])) {
        U[sel[0]][sel[1]] = Math.min(100, Math.max(0, v));
        analyse();
      }
    }, { min: 0, max: 100, width: '4.5rem' });
    const playBtn = button(t('▶ Itérer', '▶ Iterate'), () => {
      running = !running;
      playBtn.textContent = running ? t('⏸ Pause', '⏸ Pause') : t('▶ Itérer', '▶ Iterate');
      cancelAnimationFrame(timer);
      const loop = () => {
        if (!running) return;
        step(1);
        if (residual() < 1e-6) {
          running = false;
          playBtn.textContent = t('▶ Itérer', '▶ Iterate');
          return;
        }
        timer = requestAnimationFrame(loop);
      };
      loop();
    }, 'primary');

    controls.append(
      group(t('Grille', 'Grid'), NP.row, initSel.row),
      group(
        t('Valeurs du bord', 'Border values'),
        sideCtl('top', t('haut', 'top')).row,
        sideCtl('right', t('droite', 'right')).row,
        sideCtl('bottom', t('bas', 'bottom')).row,
        sideCtl('left', t('gauche', 'left')).row,
        cellF.row,
      ),
      group(
        t('Itération', 'Iteration'),
        playBtn,
        button('+1', () => step(1)),
        button('+10', () => step(10)),
        button('+100', () => step(100)),
        toggle(t('nombres', 'numbers'), true, (v) => ((showNums = v), stage.redraw())),
      ),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          const e = extrema();
          log.add([N, iter, e.mx.toFixed(1), where(e.mxAt), e.mn.toFixed(1), where(e.mnAt)], where(e.mxAt) === t('bord', 'border') && where(e.mnAt) === t('bord', 'border') ? 'ok' : 'bad');
        }),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    const geom = () => {
      const s = Math.min(stage.w, stage.h) - 8;
      return { s, cell: s / N, x0: (stage.w - s) / 2, y0: 4 };
    };
    const color = (v: number, lo: number, hi: number) => {
      const x = hi - lo < 1e-9 ? 0.5 : (v - lo) / (hi - lo);
      // bleu → jaune → rouge
      const stops = [
        [37, 99, 235],
        [251, 191, 36],
        [220, 38, 38],
      ];
      const k = x < 0.5 ? 0 : 1;
      const f = x < 0.5 ? x * 2 : (x - 0.5) * 2;
      const c = stops[k].map((a, idx) => Math.round(a + (stops[k + 1][idx] - a) * f));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    };

    stage.setDraw((ctx, _w, _h, p) => {
      if (!U.length) return;
      const { cell, x0, y0 } = geom();
      const e = extrema();
      ctx.font = `600 ${Math.max(9, Math.min(14, cell * 0.32))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) {
          const x = x0 + j * cell;
          const y = y0 + i * cell;
          ctx.fillStyle = color(U[i][j], e.mn, e.mx);
          ctx.fillRect(x, y, cell, cell);
          if (isBorder(i, j)) {
            ctx.strokeStyle = 'rgba(0,0,0,0.55)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
            ctx.setLineDash([]);
          }
          if (showNums && cell >= 24) {
            ctx.fillStyle = '#111827';
            ctx.fillText(String(Math.round(U[i][j])), x + cell / 2, y + cell / 2);
          }
        }
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#111827';
      for (const [i, j] of e.mxAt) ctx.strokeRect(x0 + j * cell + 2, y0 + i * cell + 2, cell - 4, cell - 4);
      for (const [i, j] of e.mnAt) ctx.strokeRect(x0 + j * cell + 2, y0 + i * cell + 2, cell - 4, cell - 4);
      ctx.fillStyle = '#111827';
      ctx.font = `700 ${Math.max(10, cell * 0.3)}px system-ui, sans-serif`;
      for (const [i, j] of e.mxAt.slice(0, 6)) ctx.fillText('★', x0 + j * cell + cell * 0.78, y0 + i * cell + cell * 0.2);
      for (const [i, j] of e.mnAt.slice(0, 6)) ctx.fillText('◆', x0 + j * cell + cell * 0.78, y0 + i * cell + cell * 0.2);
      if (sel) {
        ctx.strokeStyle = p.surface;
        ctx.lineWidth = 2;
        ctx.strokeRect(x0 + sel[1] * cell + 4, y0 + sel[0] * cell + 4, cell - 8, cell - 8);
      }
    });
    stage.cv.style.cursor = 'pointer';
    stage.cv.addEventListener('pointerdown', (e) => {
      const r = stage.cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * stage.w;
      const y = ((e.clientY - r.top) / r.height) * stage.h;
      const { cell, x0, y0 } = geom();
      const j = Math.floor((x - x0) / cell);
      const i = Math.floor((y - y0) / cell);
      if (i >= 0 && j >= 0 && i < N && j < N) {
        sel = [i, j];
        if (isBorder(i, j)) cellF.set(Math.round(U[i][j]));
        analyse();
      }
    });

    build();
  },
};
