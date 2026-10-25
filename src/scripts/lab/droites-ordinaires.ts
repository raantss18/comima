import { button, el, enableDrag, fmt, group, param, toggle, type LabDef } from './core';

/**
 * Chapitre 2 — Principe extrémal.
 * Sylvester–Gallai : n points non tous alignés ; existe-t-il toujours une droite
 * qui passe par exactement deux d'entre eux ? L'argument : la plus petite
 * distance point–droite.
 */

interface Pt {
  x: number; // coordonnées normalisées [0,1]
  y: number;
}

interface Line {
  pts: number[];
  /** Deux points qui définissent la droite. */
  a: number;
  b: number;
}

const TOL = 0.0025;
/** Aimantation : à la dépose, un point proche d'une droite déjà définie par deux autres s'y colle. */
const SNAP = 0.012;

function distPointLine(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1e-9;
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

function allLines(P: Pt[]): Line[] {
  const seen = new Set<string>();
  const out: Line[] = [];
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      const pts: number[] = [];
      for (let k = 0; k < P.length; k++) if (distPointLine(P[k], P[i], P[j]) < TOL) pts.push(k);
      const key = pts.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ pts, a: i, b: j });
      }
    }
  }
  return out;
}

export const def: LabDef = {
  chapter: '02-principe-extremal',
  numero: 2,
  title: { fr: 'Des droites ordinaires', en: 'Ordinary lines' },
  statement: {
    fr: 'On place $n$ points du plan, <em>non tous alignés</em>. Une droite est dite <strong>ordinaire</strong> si elle passe par exactement deux de ces points. Peut-on toujours en trouver une ?',
    en: 'Place $n$ points in the plane, <em>not all collinear</em>. A line is called <strong>ordinary</strong> if it passes through exactly two of these points. Can we always find one?',
  },
  goal: {
    fr: 'Déplace les points pour essayer de n’avoir <em>aucune</em> droite ordinaire. Que constates-tu ? Observe aussi le plus petit écart « point–droite ».',
    en: 'Move the points to try to have <em>no</em> ordinary line. What do you notice? Also watch the smallest “point–line” gap.',
  },
  steps: {
    fr: [
      'Au départ : <strong>$n = 6$ points</strong> au hasard (déplace-les à la souris ou au doigt, ou modifie leurs coordonnées dans le tableau « Coordonnées », de 0 à 100).',
      'Chaque droite passant par au moins deux points est tracée : <strong>verte pleine</strong> si elle est <em>ordinaire</em> (exactement deux points), <strong>grise pointillée</strong> sinon.',
      'Le <strong>segment rouge</strong> montre le couple (point, droite) le plus proche : c’est l’argument extrémal. Le panneau « Comment c’est calculé » détaille la distance.',
      'Essaie d’obtenir <em>zéro</em> droite ordinaire : aligne des points (ils se collent aux droites proches) ou place-les à la main. <strong>Noter</strong> garde ta configuration.',
    ],
    en: [
      'At the start: <strong>$n = 6$ random points</strong> (drag them with mouse or finger, or edit their coordinates in the “Coordinates” table, from 0 to 100).',
      'Every line through at least two points is drawn: <strong>solid green</strong> if <em>ordinary</em> (exactly two points), <strong>dashed grey</strong> otherwise.',
      'The <strong>red segment</strong> shows the closest (point, line) pair: that is the extremal argument. The “How it is computed” panel details the distance.',
      'Try to get <em>zero</em> ordinary lines: align points (they snap onto nearby lines) or place them by hand. <strong>Record</strong> keeps your configuration.',
    ],
  },
  legend: [
    { color: '#1d7a33', fr: 'droite ordinaire (2 points)', en: 'ordinary line (2 points)' },
    { color: '#6b7280', fr: 'droite avec ≥ 3 points', en: 'line with ≥ 3 points' },
    { color: '#d6362b', fr: 'plus petit écart point–droite', en: 'smallest point–line gap' },
  ],
  hints: {
    fr: [
      'Essaie avec 3, 4, 5 points. Peux-tu supprimer toutes les droites ordinaires ? Et si tu autorises les alignements ?',
      'Parmi toutes les paires (point $P$, droite $d$ passant par au moins deux points, $P \\notin d$), regarde celle où la distance $P$–$d$ est <em>minimale</em> (segment rouge).',
      'Raisonne par l’absurde : si la droite $d$ de cette paire contenait trois points, deux d’entre eux seraient du même côté du pied de la perpendiculaire… et l’un d’eux serait plus près d’une autre droite.',
    ],
    en: [
      'Try with 3, 4, 5 points. Can you remove every ordinary line? And if you allow alignments?',
      'Among all pairs (point $P$, line $d$ through at least two points, $P \\notin d$), look at the one with the <em>smallest</em> distance $P$–$d$ (red segment).',
      'Argue by contradiction: if the line $d$ of that pair held three points, two of them would be on the same side of the foot of the perpendicular… and one of them would be closer to another line.',
    ],
  },
  general: {
    fr: '<p><strong>Théorème de Sylvester–Gallai.</strong> Si $n$ points du plan ne sont pas tous alignés, il existe une droite passant par exactement deux d’entre eux. Preuve par principe extrémal : on choisit le couple (point, droite) de distance minimale et on montre que la droite est ordinaire.</p><p>Plus fort (Kelly–Moser) : il y en a au moins $\\tfrac{3n}{7}$.</p>',
    en: '<p><strong>Sylvester–Gallai theorem.</strong> If $n$ points in the plane are not all collinear, some line passes through exactly two of them. Proof by the extremal principle: take the (point, line) pair with minimal distance and show that line is ordinary.</p><p>Stronger (Kelly–Moser): there are at least $\\tfrac{3n}{7}$ of them.</p>',
  },
  aspect: 0.62,
  logEmpty: { fr: 'Appuie sur « Noter » pour garder une configuration.', en: 'Press “Record” to keep a configuration.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let n = 6;
    let P: Pt[] = [];
    let lines: Line[] = [];
    let best: { p: number; line: Line; d: number } | null = null;
    let onlyOrdinary = false;
    let labels = true;
    log.setColumns(['n', t('droites', 'lines'), t('ordinaires', 'ordinary')]);
    const ASP = 0.62; // hauteur / largeur de la scène : distances calculées en vraie géométrie

    const randomPts = (k: number): Pt[] => {
      const out: Pt[] = [];
      while (out.length < k) {
        const q = { x: 0.08 + Math.random() * 0.84, y: 0.1 + Math.random() * 0.8 };
        if (out.every((o) => Math.hypot(o.x - q.x, (o.y - q.y) * ASP) > 0.09)) out.push(q);
      }
      return out;
    };

    // Tableau de coordonnées éditables (x, y de 0 à 100)
    const coordBox = el('div', { class: 'lab-coords' });
    const inputs: { x: HTMLInputElement; y: HTMLInputElement }[] = [];
    const buildCoords = () => {
      coordBox.replaceChildren();
      inputs.length = 0;
      P.forEach((q, i) => {
        const mk = (axis: 'x' | 'y') => {
          const inp = el('input', { type: 'number', class: 'lab-num lab-num-sm', min: '0', max: '100', step: '1', 'aria-label': `${axis}${i + 1}` }) as HTMLInputElement;
          inp.addEventListener('change', () => {
            const v = Math.min(100, Math.max(0, Number(inp.value)));
            if (!Number.isFinite(v)) return;
            const nv = axis === 'y' ? 1 - v / 100 : v / 100; // y affiché : vers le haut
            P[i] = { ...P[i], [axis]: Math.min(0.98, Math.max(0.02, nv)) } as Pt;
            analyse(false);
          });
          return inp;
        };
        const xi = mk('x');
        const yi = mk('y');
        inputs.push({ x: xi, y: yi });
        coordBox.append(el('span', { class: 'lab-coord' }, el('b', {}, String(i + 1)), xi, yi));
      });
      syncCoords();
    };
    const syncCoords = () =>
      P.forEach((q, i) => {
        if (!inputs[i]) return;
        inputs[i].x.value = String(Math.round(q.x * 100));
        inputs[i].y.value = String(Math.round((1 - q.y) * 100));
      });

    const analyse = (rebuild = true) => {
      const G = P.map((q) => ({ x: q.x, y: q.y * ASP }));
      lines = allLines(G);
      best = null;
      for (const L of lines) {
        for (let k = 0; k < P.length; k++) {
          if (L.pts.includes(k)) continue;
          const d = distPointLine(G[k], G[L.a], G[L.b]);
          if (!best || d < best.d) best = { p: k, line: L, d };
        }
      }
      const ordinary = lines.filter((L) => L.pts.length === 2).length;
      const collinear = lines.length === 1 && lines[0].pts.length === P.length;
      api.say(
        `<div class="lab-big">${t('Droites ordinaires', 'Ordinary lines')} : <strong>${ordinary}</strong></div>` +
          `<div>${t('Droites distinctes', 'Distinct lines')} : ${lines.length} · ${t('points', 'points')} : ${P.length}</div>` +
          (collinear
            ? `<div class="lab-note">${t('Tous les points sont alignés : le cas exclu par l’énoncé.', 'All points are collinear: the case excluded by the statement.')}</div>`
            : ordinary === 0
              ? `<div class="lab-bad">${t('Aucune droite ordinaire ?!', 'No ordinary line?!')}</div>`
              : `<div class="lab-ok">✔ ${t('Il en reste au moins une.', 'At least one is left.')}</div>`),
      );
      const rowsHtml = lines
        .map((L) => `<tr><td>${L.pts.map((k) => k + 1).join(', ')}</td><td>${L.pts.length}</td><td>${L.pts.length === 2 ? '✔' : ''}</td></tr>`)
        .join('');
      let extremal = '';
      if (best) {
        const A = G[best.line.a];
        const B = G[best.line.b];
        const Q = G[best.p];
        extremal =
          `<p>${t('Couple le plus proche', 'Closest pair')} : ${t('point', 'point')} ${best.p + 1} ${t('et droite', 'and line')} (${best.line.pts.map((k) => k + 1).join(',')}).</p>` +
          `<p>$d = \\dfrac{|(x_B - x_A)(y_A - y_Q) - (x_A - x_Q)(y_B - y_A)|}{AB} = ${fmt(best.d * 100, 2)}\\ \\%$ ${t('de la largeur', 'of the width')}.</p>` +
          `<p class="small muted">A = (${fmt(A.x * 100, 1)}, ${fmt(A.y * 100, 1)}), B = (${fmt(B.x * 100, 1)}, ${fmt(B.y * 100, 1)}), Q = (${fmt(Q.x * 100, 1)}, ${fmt(Q.y * 100, 1)}).</p>`;
      }
      api.calc(
        `<p>${t('Pour chaque paire de points on regroupe tous les points alignés avec elle : une droite = un ensemble de points. Droite <em>ordinaire</em> ⇔ 2 points.', 'For each pair of points we gather every point aligned with them: one line = one set of points. <em>Ordinary</em> line ⇔ 2 points.')}</p>` +
          extremal +
          `<table><tr><th>${t('points sur la droite', 'points on the line')}</th><th>#</th><th>${t('ordinaire', 'ordinary')}</th></tr>${rowsHtml}</table>`,
      );
      if (rebuild) syncCoords();
      stage.redraw();
    };

    const setN = (v: number) => {
      n = v;
      if (P.length > n) P = P.slice(0, n);
      while (P.length < n) {
        let q: Pt;
        do q = { x: 0.08 + Math.random() * 0.84, y: 0.1 + Math.random() * 0.8 };
        while (P.some((o) => Math.hypot(o.x - q.x, (o.y - q.y) * ASP) < 0.09));
        P.push(q);
      }
      buildCoords();
      analyse();
    };
    P = randomPts(n);
    const nP = param('n', 3, 12, n, 1, setN);

    controls.append(
      group(
        t('Points', 'Points'),
        nP.row,
        button(t('Aléatoire', 'Random'), () => {
          P = randomPts(n);
          analyse();
        }),
        button(t('Presque alignés', 'Almost collinear'), () => {
          P = Array.from({ length: n }, (_, i) => ({ x: 0.08 + (0.84 * i) / Math.max(1, n - 1), y: 0.5 + (Math.random() - 0.5) * 0.02 }));
          P[Math.floor(Math.random() * n)].y = 0.2 + Math.random() * 0.15;
          analyse();
        }),
        button(t('Tous alignés', 'All collinear'), () => {
          P = Array.from({ length: n }, (_, i) => ({ x: 0.08 + (0.84 * i) / Math.max(1, n - 1), y: 0.5 }));
          analyse();
        }),
      ),
      group(
        t('Affichage', 'Display'),
        toggle(t('seulement les ordinaires', 'ordinary only'), false, (v) => ((onlyOrdinary = v), stage.redraw())),
        toggle(t('numéros', 'labels'), true, (v) => ((labels = v), stage.redraw())),
      ),
      group(t('Coordonnées (x, y de 0 à 100)', 'Coordinates (x, y from 0 to 100)'), coordBox),
      group(
        t('Essais', 'Trials'),
        button(
          t('Noter', 'Record'),
          () => {
            const ord = lines.filter((L) => L.pts.length === 2).length;
            log.add([n, lines.length, ord], ord === 0 ? 'bad' : 'ok');
          },
          'primary',
        ),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    stage.setDraw((ctx, w, h, p) => {
      const X = (q: Pt) => q.x * w;
      const Y = (q: Pt) => q.y * h;
      for (const L of lines) {
        const ordinary = L.pts.length === 2;
        if (onlyOrdinary && !ordinary) continue;
        const a = P[L.a];
        const b = P[L.b];
        const dx = X(b) - X(a);
        const dy = Y(b) - Y(a);
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        ctx.strokeStyle = ordinary ? p.primary : p.muted;
        ctx.globalAlpha = ordinary ? 0.9 : 0.55;
        ctx.lineWidth = ordinary ? 2.2 : 1.3;
        ctx.setLineDash(ordinary ? [] : [5, 4]);
        ctx.beginPath();
        ctx.moveTo(X(a) - ux * 3000, Y(a) - uy * 3000);
        ctx.lineTo(X(a) + ux * 3000, Y(a) + uy * 3000);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      if (best) {
        const a = P[best.line.a];
        const b = P[best.line.b];
        const q = P[best.p];
        const dx = X(b) - X(a);
        const dy = Y(b) - Y(a);
        const l2 = dx * dx + dy * dy || 1;
        const tt = ((X(q) - X(a)) * dx + (Y(q) - Y(a)) * dy) / l2;
        const fx = X(a) + tt * dx;
        const fy = Y(a) + tt * dy;
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(X(q), Y(q));
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(X(q), Y(q), 14, 0, Math.PI * 2);
        ctx.stroke();
      }
      P.forEach((q, i) => {
        ctx.fillStyle = p.surface;
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(X(q), Y(q), 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (labels) {
          ctx.fillStyle = p.ink;
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), X(q), Y(q) + 0.5);
        }
      });
    });

    enableDrag(
      stage,
      () => P.map((q) => ({ x: q.x * stage.w, y: q.y * stage.h, r: 9 })),
      (i, x, y) => {
        P[i] = { x: Math.min(0.98, Math.max(0.02, x / stage.w)), y: Math.min(0.97, Math.max(0.03, y / stage.h)) };
        analyse();
      },
      (i) => {
        const G = P.map((q) => ({ x: q.x, y: q.y * ASP }));
        let bestSnap: { d: number; a: number; b: number } | null = null;
        for (let a = 0; a < G.length; a++)
          for (let b = a + 1; b < G.length; b++) {
            if (a === i || b === i) continue;
            const d = distPointLine(G[i], G[a], G[b]);
            if (d < SNAP && (!bestSnap || d < bestSnap.d)) bestSnap = { d, a, b };
          }
        if (bestSnap) {
          const A = G[bestSnap.a];
          const B = G[bestSnap.b];
          const dx = B.x - A.x;
          const dy = B.y - A.y;
          const tt = ((G[i].x - A.x) * dx + (G[i].y - A.y) * dy) / (dx * dx + dy * dy);
          P[i] = { x: A.x + tt * dx, y: (A.y + tt * dy) / ASP };
          analyse();
        }
      },
    );

    buildCoords();
    analyse();
  },
};
