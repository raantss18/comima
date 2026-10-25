import { button, enableDrag, slider, type LabDef } from './core';

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
    log.setColumns(['n', t('droites', 'lines'), t('ordinaires', 'ordinary')]);

    const randomPts = (k: number): Pt[] => {
      const out: Pt[] = [];
      while (out.length < k) {
        const q = { x: 0.08 + Math.random() * 0.84, y: 0.1 + Math.random() * 0.8 };
        if (out.every((o) => Math.hypot(o.x - q.x, o.y - q.y) > 0.09)) out.push(q);
      }
      return out;
    };

    const ASP = 0.62; // hauteur / largeur de la scène : distances calculées en vraie géométrie
    const analyse = () => {
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
              : `<div class="lab-ok">✔ ${t('Il en reste au moins une.', 'At least one is left.')}</div>`) +
          (best ? `<div class="lab-muted">${t('Plus petit écart point–droite', 'Smallest point–line gap')} : ${(best.d * 100).toFixed(1)} %</div>` : ''),
      );
      stage.redraw();
    };

    const setN = (v: number) => {
      n = v;
      if (P.length > n) P = P.slice(0, n);
      while (P.length < n) {
        let q: Pt;
        do q = { x: 0.08 + Math.random() * 0.84, y: 0.1 + Math.random() * 0.8 };
        while (P.some((o) => Math.hypot(o.x - q.x, o.y - q.y) < 0.09));
        P.push(q);
      }
      analyse();
    };
    P = randomPts(n);
    const nSlider = slider('n', 3, 12, n, 1, setN);

    controls.append(
      nSlider.row,
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
      button(
        t('Noter', 'Record'),
        () => {
          const ord = lines.filter((L) => L.pts.length === 2).length;
          log.add([n, lines.length, ord], ord === 0 ? 'bad' : 'ok');
        },
        'primary',
      ),
    );

    stage.setDraw((ctx, w, h, p) => {
      const X = (q: Pt) => q.x * w;
      const Y = (q: Pt) => q.y * h;
      for (const L of lines) {
        const a = P[L.a];
        const b = P[L.b];
        const dx = X(b) - X(a);
        const dy = Y(b) - Y(a);
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const ordinary = L.pts.length === 2;
        ctx.strokeStyle = ordinary ? p.primary : p.muted;
        ctx.globalAlpha = ordinary ? 0.9 : 0.5;
        ctx.lineWidth = ordinary ? 2.2 : 1.2;
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
        ctx.fillStyle = p.ink;
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), X(q), Y(q) + 0.5);
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
        let best: { d: number; a: number; b: number } | null = null;
        for (let a = 0; a < G.length; a++)
          for (let b = a + 1; b < G.length; b++) {
            if (a === i || b === i) continue;
            const d = distPointLine(G[i], G[a], G[b]);
            if (d < SNAP && (!best || d < best.d)) best = { d, a, b };
          }
        if (best) {
          const A = G[best.a];
          const B = G[best.b];
          const dx = B.x - A.x;
          const dy = B.y - A.y;
          const tt = ((G[i].x - A.x) * dx + (G[i].y - A.y) * dy) / (dx * dx + dy * dy);
          P[i] = { x: A.x + tt * dx, y: (A.y + tt * dy) / ASP };
          analyse();
        }
      },
    );

    analyse();
  },
};
