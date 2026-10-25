import { button, enableDrag, fmt, slider, type LabDef } from './core';

/**
 * Chapitre 4 — Géométrie (vecteurs, milieux, barycentres).
 * Le polygone des milieux d'un polygone à n sommets : que reste-t-il d'invariant ?
 */

interface Pt {
  x: number;
  y: number;
}

const area = (P: Pt[]) => {
  let s = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[i];
    const b = P[(i + 1) % P.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
};
const centroid = (P: Pt[]) => ({ x: P.reduce((s, q) => s + q.x, 0) / P.length, y: P.reduce((s, q) => s + q.y, 0) / P.length });
const mids = (P: Pt[]) => P.map((a, i) => ({ x: (a.x + P[(i + 1) % P.length].x) / 2, y: (a.y + P[(i + 1) % P.length].y) / 2 }));

function regular(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: 0.5 + 0.34 * Math.cos(a) * 1.3, y: 0.5 + 0.34 * Math.sin(a) };
  });
}

export const def: LabDef = {
  chapter: '04-geometrie',
  numero: 4,
  title: { fr: 'Le polygone des milieux', en: 'The midpoint polygon' },
  statement: {
    fr: 'On part d’un polygone $A_1A_2\\dots A_n$ et on relie les milieux de ses côtés consécutifs. Que peut-on dire de ce nouveau polygone et de son lien avec le premier ?',
    en: 'Start from a polygon $A_1A_2\\dots A_n$ and join the midpoints of its consecutive sides. What can be said about this new polygon and its relation to the first?',
  },
  goal: {
    fr: 'Déforme le polygone en tirant les sommets. Qu’est-ce qui <em>ne change jamais</em> ? Compare $n = 3, 4, 5, 6$, puis cherche quand le quadrilatère des milieux est un rectangle ou un losange.',
    en: 'Deform the polygon by dragging the vertices. What <em>never changes</em>? Compare $n = 3, 4, 5, 6$, then find when the midpoint quadrilateral is a rectangle or a rhombus.',
  },
  hints: {
    fr: [
      'Pour $n = 4$, observe les côtés du polygone des milieux : que remarques-tu ? Et le rapport des aires ?',
      'Regarde les deux centres de gravité $G$ et $G\'$ (sommets, milieux). Sont-ils toujours confondus, quel que soit $n$ ?',
      'Écris $M_i = \\tfrac12(\\vec{A_i} + \\vec{A_{i+1}})$ avec des vecteurs : que donne $\\overrightarrow{M_1M_2}$ ? Et pour les diagonales d’un quadrilatère, quand sont-elles perpendiculaires / égales ?',
    ],
    en: [
      'For $n = 4$, look at the sides of the midpoint polygon: what do you notice? And the area ratio?',
      'Look at the two centroids $G$ and $G\'$ (vertices, midpoints). Are they always the same, whatever $n$?',
      'Write $M_i = \\tfrac12(\\vec{A_i} + \\vec{A_{i+1}})$ with vectors: what is $\\overrightarrow{M_1M_2}$? And for a quadrilateral’s diagonals, when are they perpendicular / equal?',
    ],
  },
  general: {
    fr: '<p><strong>Théorème de Varignon.</strong> Les milieux des côtés d’un quadrilatère forment un <em>parallélogramme</em>, d’aire la moitié de celle du quadrilatère : $\\overrightarrow{M_1M_2} = \\tfrac12 \\overrightarrow{A_1A_3}$. C’est un rectangle si les diagonales sont perpendiculaires, un losange si elles sont égales.</p><p>Pour tout $n$, le polygone des milieux a <strong>le même centre de gravité</strong> que les sommets, car $\\sum M_i = \\sum A_i$. Pour $n = 3$ le rapport d’aires est $\\tfrac14$ ; pour $n \\ge 5$ il n’est plus constant.</p>',
    en: '<p><strong>Varignon’s theorem.</strong> The midpoints of the sides of a quadrilateral form a <em>parallelogram</em> with half the area: $\\overrightarrow{M_1M_2} = \\tfrac12 \\overrightarrow{A_1A_3}$. It is a rectangle when the diagonals are perpendicular, a rhombus when they are equal.</p><p>For every $n$, the midpoint polygon has <strong>the same centroid</strong> as the vertices, since $\\sum M_i = \\sum A_i$. For $n = 3$ the area ratio is $\\tfrac14$; for $n \\ge 5$ it is no longer constant.</p>',
  },
  aspect: 0.72,
  logEmpty: { fr: 'Appuie sur « Noter » après avoir déformé le polygone.', en: 'Press “Record” after deforming the polygon.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let n = 4;
    let P: Pt[] = [
      { x: 0.2, y: 0.28 },
      { x: 0.8, y: 0.22 },
      { x: 0.86, y: 0.78 },
      { x: 0.26, y: 0.7 },
    ];
    log.setColumns(['n', t('aire M / aire A', 'area M / area A'), t('G = G′ ?', 'G = G′?'), t('forme de M', 'shape of M')]);

    const analyse = () => {
      const M = mids(P);
      const a = area(P);
      const ratio = Math.abs(a) < 1e-9 ? NaN : area(M) / a;
      const G = centroid(P);
      const H = centroid(M);
      const same = Math.hypot(G.x - H.x, G.y - H.y) < 1e-9;
      let shape = '—';
      if (n === 4) {
        const ASP = 0.72; // hauteur/largeur de la scène : angles et longueurs en vraie géométrie
        const d1 = { x: P[2].x - P[0].x, y: (P[2].y - P[0].y) * ASP };
        const d2 = { x: P[3].x - P[1].x, y: (P[3].y - P[1].y) * ASP };
        const l1 = Math.hypot(d1.x, d1.y);
        const l2 = Math.hypot(d2.x, d2.y);
        const perp = Math.abs(d1.x * d2.x + d1.y * d2.y) / (l1 * l2 || 1) < 0.02;
        const eq = Math.abs(l1 - l2) / Math.max(l1, l2, 1e-9) < 0.02;
        shape = perp && eq ? t('carré', 'square') : perp ? t('rectangle', 'rectangle') : eq ? t('losange', 'rhombus') : t('parallélogramme', 'parallelogram');
        api.say(
          `<div class="lab-big">${t('Rapport des aires', 'Area ratio')} : <strong>${fmt(ratio, 4)}</strong></div>` +
            `<div>${t('Diagonales', 'Diagonals')} : ${perp ? '⟂' : '—'} ${eq ? t('égales', 'equal') : ''} → M ${t('est un', 'is a')} <strong>${shape}</strong></div>` +
            `<div>$G = G'$ : ${same ? '<span class="lab-ok">✔</span>' : '<span class="lab-bad">✘</span>'}</div>`,
        );
      } else {
        api.say(
          `<div class="lab-big">${t('Rapport des aires', 'Area ratio')} : <strong>${fmt(ratio, 4)}</strong></div>` +
            `<div>$G = G'$ : ${same ? '<span class="lab-ok">✔</span>' : '<span class="lab-bad">✘</span>'}</div>`,
        );
      }
      document.dispatchEvent(new CustomEvent('comima:render-math'));
      stage.redraw();
      return { ratio, same, shape };
    };

    const setN = (v: number) => {
      n = v;
      P = regular(n).map((q, i) => ({ x: q.x + (i % 2 ? 0.03 : -0.02), y: q.y + (i % 3 ? 0.02 : -0.03) }));
      analyse();
    };

    const quad = (pts: [number, number][]) => {
      n = 4;
      nSlider.set(4);
      P = pts.map(([x, y]) => ({ x, y }));
      analyse();
    };

    const nSlider = slider('n', 3, 8, n, 1, setN);
    controls.append(
      nSlider.row,
      button(t('Quadrilatère: diagonales ⟂', 'Quadrilateral: diagonals ⟂'), () => quad([[0.15, 0.5], [0.45, 0.15], [0.88, 0.5], [0.45, 0.88]])),
      button(t('Diagonales égales', 'Equal diagonals'), () => quad([[0.2, 0.2], [0.8, 0.2], [0.68, 0.8], [0.32, 0.8]])),
      button(t('Carré', 'Square'), () => quad([[0.28, 0.12], [0.72, 0.12], [0.72, 0.88], [0.28, 0.88]])),
      button(
        t('Noter', 'Record'),
        () => {
          const { ratio, same, shape } = analyse();
          log.add([n, fmt(ratio, 4), same ? '✔' : '✘', shape]);
        },
        'primary',
      ),
    );

    stage.setDraw((ctx, w, h, p) => {
      const X = (q: Pt) => q.x * w;
      const Y = (q: Pt) => q.y * h;
      const M = mids(P);
      const poly = (Q: Pt[]) => {
        ctx.beginPath();
        Q.forEach((q, i) => (i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q))));
        ctx.closePath();
      };
      poly(P);
      ctx.fillStyle = 'rgba(127,127,127,0.10)';
      ctx.fill();
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (n === 4) {
        ctx.strokeStyle = p.muted;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(X(P[0]), Y(P[0]));
        ctx.lineTo(X(P[2]), Y(P[2]));
        ctx.moveTo(X(P[1]), Y(P[1]));
        ctx.lineTo(X(P[3]), Y(P[3]));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      poly(M);
      ctx.fillStyle = 'rgba(29,122,51,0.22)';
      ctx.fill();
      ctx.strokeStyle = p.primary;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      M.forEach((q) => {
        ctx.fillStyle = p.primary;
        ctx.beginPath();
        ctx.arc(X(q), Y(q), 4, 0, Math.PI * 2);
        ctx.fill();
      });
      const G = centroid(P);
      const H = centroid(M);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X(G), Y(G), 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(X(H), Y(H), 3, 0, Math.PI * 2);
      ctx.fillStyle = p.accent;
      ctx.fill();
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText('G = G′', X(G) + 12, Y(G) - 8);
      P.forEach((q, i) => {
        ctx.fillStyle = p.surface;
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(X(q), Y(q), 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = p.ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String.fromCharCode(65 + i), X(q), Y(q) + 0.5);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      });
    });

    enableDrag(
      stage,
      () => P.map((q) => ({ x: q.x * stage.w, y: q.y * stage.h, r: 10 })),
      (i, x, y) => {
        P[i] = { x: Math.min(0.97, Math.max(0.03, x / stage.w)), y: Math.min(0.96, Math.max(0.04, y / stage.h)) };
        analyse();
      },
    );

    analyse();
  },
};
