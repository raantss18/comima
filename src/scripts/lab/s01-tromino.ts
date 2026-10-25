import { button, segmented, type LabDef } from './core';

/**
 * Chapitre 1 — Récurrence.
 * Un carré m × m privé d'une case peut-il être pavé par des « L » de 3 cases ?
 * Pour m = 2ⁿ, c'est une récurrence : on coupe en quatre quadrants.
 */

type Cell = [number, number];
interface Piece {
  cells: Cell[];
  /** Bloc en cours de découpage lorsque la pièce a été posée (pour l'étape de récurrence). */
  block?: { r: number; c: number; s: number };
}

const isPow2 = (m: number) => m >= 2 && (m & (m - 1)) === 0;

/** Pavage récursif d'un carré 2ⁿ privé d'une case : renvoie les pièces dans l'ordre de la récurrence. */
function construct(size: number, hole: Cell): Piece[] {
  const out: Piece[] = [];
  const rec = (r0: number, c0: number, s: number, h: Cell) => {
    if (s === 2) {
      const cells: Cell[] = [];
      for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) {
        const rc: Cell = [r0 + dr, c0 + dc];
        if (rc[0] !== h[0] || rc[1] !== h[1]) cells.push(rc);
      }
      out.push({ cells, block: { r: r0, c: c0, s } });
      return;
    }
    const half = s / 2;
    const quads: { r: number; c: number; center: Cell }[] = [
      { r: r0, c: c0, center: [r0 + half - 1, c0 + half - 1] },
      { r: r0, c: c0 + half, center: [r0 + half - 1, c0 + half] },
      { r: r0 + half, c: c0, center: [r0 + half, c0 + half - 1] },
      { r: r0 + half, c: c0 + half, center: [r0 + half, c0 + half] },
    ];
    const inQuad = (q: { r: number; c: number }) =>
      h[0] >= q.r && h[0] < q.r + half && h[1] >= q.c && h[1] < q.c + half;
    const withHole = quads.findIndex(inQuad);
    // Le « L » central couvre les trois cases du centre hors du quadrant contenant le trou.
    const centerCells = quads.filter((_, i) => i !== withHole).map((q) => q.center);
    out.push({ cells: centerCells, block: { r: r0, c: c0, s } });
    quads.forEach((q, i) => rec(q.r, q.c, half, i === withHole ? h : q.center));
  };
  rec(0, 0, size, hole);
  return out;
}

/** Retour sur trace pour un carré quelconque. `limit` borne le nombre de nœuds. */
function solve(m: number, hole: Cell, limit = 400000): { pieces: Piece[] | null; exhausted: boolean } {
  const g: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
  g[hole[0]][hole[1]] = -1;
  const pieces: Piece[] = [];
  let nodes = 0;
  let aborted = false;
  const free = (r: number, c: number) => r >= 0 && c >= 0 && r < m && c < m && g[r][c] === 0;
  const rec = (start: number): boolean => {
    if (++nodes > limit) {
      aborted = true;
      return false;
    }
    let idx = start;
    while (idx < m * m && g[Math.floor(idx / m)][idx % m] !== 0) idx++;
    if (idx === m * m) return true;
    const r = Math.floor(idx / m);
    const c = idx % m;
    for (let br = r - 1; br <= r; br++) {
      for (let bc = c - 1; bc <= c; bc++) {
        const corners: Cell[] = [
          [br, bc],
          [br, bc + 1],
          [br + 1, bc],
          [br + 1, bc + 1],
        ];
        for (let skip = 0; skip < 4; skip++) {
          const cells = corners.filter((_, i) => i !== skip);
          if (!cells.some(([a, b]) => a === r && b === c)) continue;
          if (!cells.every(([a, b]) => free(a, b))) continue;
          cells.forEach(([a, b]) => (g[a][b] = pieces.length + 1));
          pieces.push({ cells });
          if (rec(idx + 1)) return true;
          pieces.pop();
          cells.forEach(([a, b]) => (g[a][b] = 0));
          if (aborted) return false;
        }
      }
    }
    return false;
  };
  const ok = rec(0);
  return { pieces: ok ? pieces.slice() : null, exhausted: !aborted };
}

export const def: LabDef = {
  chapter: '01-recurrence',
  numero: 1,
  title: { fr: 'Pavages en L', en: 'L-tromino tilings' },
  statement: {
    fr: 'On retire une case d’un carré $m \\times m$. Peut-on recouvrir le reste, sans chevauchement, avec des pièces en « L » de 3 cases ?',
    en: 'Remove one cell from an $m \\times m$ square. Can the rest be covered, without overlap, with L-shaped pieces of 3 cells?',
  },
  goal: {
    fr: 'Pour quelles tailles $m$ et quelles cases retirées est-ce possible ? Clique une case pour la retirer, teste, puis lance la « carte des cases possibles ».',
    en: 'For which sizes $m$ and which removed cells is it possible? Click a cell to remove it, test, then run the “map of feasible cells”.',
  },
  hints: {
    fr: [
      'Compte les cases : combien de pièces faut-il ? Que doit vérifier $m^2 - 1$ ?',
      'Pour $m = 2, 4, 8$ essaie toutes les cases. Que remarques-tu ? Pour $m = 5$, la carte est étonnante…',
      'Pour $m = 2^n$ : coupe le carré en quatre quadrants et pose <em>un L au centre</em> pour que chaque quadrant ait « sa » case manquante. Utilise le bouton « Pas à pas ».',
    ],
    en: [
      'Count the cells: how many pieces are needed? What must $m^2 - 1$ satisfy?',
      'For $m = 2, 4, 8$ try every cell. What do you notice? For $m = 5$ the map is surprising…',
      'For $m = 2^n$: cut the square into four quadrants and place <em>one L in the centre</em> so each quadrant has “its” missing cell. Use the “Step by step” button.',
    ],
  },
  general: {
    fr: '<p><strong>Théorème.</strong> Pour tout $n \\ge 1$, un carré $2^n \\times 2^n$ privé d’une case quelconque se pave par des L. Preuve par récurrence : le cas $n=1$ est un L ; pour $n+1$, un L central ramène à quatre carrés $2^n \\times 2^n$ privés d’une case.</p><p>Condition nécessaire : $3 \\mid m^2 - 1$, c’est-à-dire $m \\not\\equiv 0 \\pmod 3$. Elle est suffisante pour toute case dès que $m \\neq 5$ (Chu–Johnsonbaugh) ; pour $m = 5$, seules 9 cases conviennent.</p>',
    en: '<p><strong>Theorem.</strong> For every $n \\ge 1$, a $2^n \\times 2^n$ square minus any one cell can be tiled by L-trominoes. Proof by induction: $n=1$ is a single L; for $n+1$, one central L reduces the problem to four $2^n \\times 2^n$ squares each missing one cell.</p><p>Necessary condition: $3 \\mid m^2 - 1$, i.e. $m \\not\\equiv 0 \\pmod 3$. It is sufficient for every cell as soon as $m \\neq 5$ (Chu–Johnsonbaugh); for $m = 5$ only 9 cells work.</p>',
  },
  aspect: 0.9,
  logEmpty: {
    fr: 'Lance une « carte des cases possibles » pour chaque taille.',
    en: 'Run a “map of feasible cells” for each size.',
  },
  init(api) {
    const { t, stage, controls, log } = api;
    let m = 4;
    let hole: Cell = [0, 0];
    let pieces: Piece[] = [];
    let shown = 0;
    let steps = false;
    let feas: ('ok' | 'no' | '?')[][] | null = null;
    let busy = false;
    log.setColumns(['m', 'm²−1', '3 | m²−1', t('cases possibles', 'feasible cells')]);

    const reset = (keepMap = false) => {
      pieces = [];
      shown = 0;
      steps = false;
      if (!keepMap) feas = null;
      info();
      stage.redraw();
    };

    const info = (extra = '') => {
      const q = (m * m - 1) / 3;
      api.say(
        `<div>${t('Pièces nécessaires', 'Pieces needed')} : <strong>${Number.isInteger(q) ? q : '—'}</strong> ` +
          `(${t('car', 'since')} $m^2 - 1 = ${m * m - 1}$${Number.isInteger(q) ? '' : t(' n’est pas multiple de 3', ' is not a multiple of 3')})</div>` +
          (extra ? `<div class="lab-note">${extra}</div>` : ''),
      );
      document.dispatchEvent(new CustomEvent('comima:render-math'));
    };

    const sizeSeg = segmented(
      [2, 3, 4, 5, 6, 7, 8].map((v) => ({ value: v, label: `${v}×${v}` })),
      m,
      (v) => {
        m = v;
        hole = [Math.min(hole[0], m - 1), Math.min(hole[1], m - 1)];
        reset();
      },
    );

    const run = () => {
      reset(true);
      if (isPow2(m)) {
        pieces = construct(m, hole);
        shown = pieces.length;
        info(t('Pavage obtenu par la récurrence (quadrants + L central).', 'Tiling obtained by the induction (quadrants + central L).'));
      } else {
        const { pieces: res, exhausted } = solve(m, hole);
        if (res) {
          pieces = res;
          shown = res.length;
          info(t('Pavage trouvé par recherche exhaustive.', 'Tiling found by exhaustive search.'));
        } else {
          info(
            exhausted
              ? t('<span class="lab-bad">Impossible</span> pour cette case (recherche exhaustive).', '<span class="lab-bad">Impossible</span> for this cell (exhaustive search).')
              : t('Recherche interrompue (trop longue).', 'Search stopped (too long).'),
          );
        }
      }
      stage.redraw();
    };

    const stepBtn = button(t('Pas à pas (récurrence)', 'Step by step (induction)'), () => {
      if (!isPow2(m)) {
        info(t('Le pas à pas est réservé aux tailles $2^n$ : la récurrence coupe en quadrants.', 'Step by step is for sizes $2^n$: the induction splits into quadrants.'));
        return;
      }
      if (!steps) {
        pieces = construct(m, hole);
        shown = 0;
        steps = true;
      }
      shown = Math.min(pieces.length, shown + 1);
      stage.redraw();
    });

    const mapBtn = button(t('Carte des cases possibles', 'Map of feasible cells'), async () => {
      if (busy) return;
      busy = true;
      reset();
      feas = Array.from({ length: m }, () => new Array(m).fill('?') as ('ok' | 'no' | '?')[]);
      const mm = m;
      let okCount = 0;
      for (let r = 0; r < mm && m === mm; r++) {
        for (let c = 0; c < mm && m === mm; c++) {
          let res: 'ok' | 'no' | '?';
          if (isPow2(mm)) res = 'ok';
          else if ((mm * mm - 1) % 3 !== 0) res = 'no';
          else {
            const s = solve(mm, [r, c], 150000);
            res = s.pieces ? 'ok' : s.exhausted ? 'no' : '?';
          }
          feas![r][c] = res;
          if (res === 'ok') okCount++;
          if (c === mm - 1 || res !== 'ok') {
            stage.redraw();
            await new Promise((ok) => setTimeout(ok, 0));
          }
        }
      }
      if (m === mm) {
        log.add([mm, mm * mm - 1, (mm * mm - 1) % 3 === 0 ? t('oui', 'yes') : t('non', 'no'), `${okCount} / ${mm * mm}`], okCount === mm * mm ? 'ok' : 'bad');
        info(t(`${okCount} case(s) sur ${mm * mm} peuvent être retirées.`, `${okCount} cell(s) out of ${mm * mm} can be removed.`));
      }
      busy = false;
    });

    controls.append(
      sizeSeg.row,
      button(t('Paver', 'Tile'), run, 'primary'),
      stepBtn,
      mapBtn,
      button(t('Effacer', 'Clear'), () => reset()),
    );

    const geom = () => {
      const s = Math.min(stage.w, stage.h) - 8;
      return { s, cell: s / m, x0: (stage.w - s) / 2, y0: 4 };
    };

    stage.setDraw((ctx, _w, _h, p) => {
      const { s, cell, x0, y0 } = geom();
      ctx.lineWidth = 1;
      ctx.strokeStyle = p.line;
      for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) {
        ctx.fillStyle = p.surface;
        ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell);
        ctx.strokeRect(x0 + c * cell, y0 + r * cell, cell, cell);
      }
      if (feas) {
        for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) {
          const v = feas[r][c];
          if (v === '?') continue;
          ctx.fillStyle = v === 'ok' ? 'rgba(29,154,69,0.35)' : 'rgba(214,54,43,0.28)';
          ctx.fillRect(x0 + c * cell + 1, y0 + r * cell + 1, cell - 2, cell - 2);
        }
      }
      pieces.slice(0, shown).forEach((pc, i) => {
        ctx.fillStyle = `hsl(${(i * 47) % 360} 65% 62%)`;
        for (const [r, c] of pc.cells) ctx.fillRect(x0 + c * cell + 1, y0 + r * cell + 1, cell - 2, cell - 2);
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const [r, c] of pc.cells) {
          const X = x0 + c * cell;
          const Y = y0 + r * cell;
          const has = (a: number, b: number) => pc.cells.some(([rr, cc]) => rr === a && cc === b);
          if (!has(r - 1, c)) { ctx.moveTo(X, Y); ctx.lineTo(X + cell, Y); }
          if (!has(r + 1, c)) { ctx.moveTo(X, Y + cell); ctx.lineTo(X + cell, Y + cell); }
          if (!has(r, c - 1)) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + cell); }
          if (!has(r, c + 1)) { ctx.moveTo(X + cell, Y); ctx.lineTo(X + cell, Y + cell); }
        }
        ctx.stroke();
      });
      if (steps && shown > 0 && shown <= pieces.length) {
        const b = pieces[shown - 1].block;
        if (b) {
          ctx.strokeStyle = p.accent;
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(x0 + b.c * cell, y0 + b.r * cell, b.s * cell, b.s * cell);
          ctx.setLineDash([]);
        }
      }
      // case retirée
      const hx = x0 + hole[1] * cell;
      const hy = y0 + hole[0] * cell;
      ctx.fillStyle = p.ink;
      ctx.fillRect(hx + 2, hy + 2, cell - 4, cell - 4);
      ctx.strokeStyle = p.surface;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx + cell * 0.3, hy + cell * 0.3);
      ctx.lineTo(hx + cell * 0.7, hy + cell * 0.7);
      ctx.moveTo(hx + cell * 0.7, hy + cell * 0.3);
      ctx.lineTo(hx + cell * 0.3, hy + cell * 0.7);
      ctx.stroke();
      void s;
    });

    stage.cv.addEventListener('pointerdown', (e) => {
      const r = stage.cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * stage.w;
      const y = ((e.clientY - r.top) / r.height) * stage.h;
      const { cell, x0, y0 } = geom();
      const c = Math.floor((x - x0) / cell);
      const rr = Math.floor((y - y0) / cell);
      if (c >= 0 && c < m && rr >= 0 && rr < m) {
        hole = [rr, c];
        reset(true);
      }
    });
    stage.cv.style.cursor = 'pointer';
    reset();
  },
};
