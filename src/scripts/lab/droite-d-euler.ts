import { button, el, enableDrag, fmt, group, toggle, type LabDef } from './core';

/**
 * Chapitre 4 — Géométrie (vecteurs, barycentres).
 * Centre de gravité G, centre du cercle circonscrit O, orthocentre H :
 * toujours alignés, avec OH = 3·OG (droite d'Euler).
 */

interface Pt {
  x: number;
  y: number;
}
const ASP = 0.75; // la scène est 1 × ASP ; on travaille en « unités de largeur »

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;

function circumcenter(A: Pt, B: Pt, C: Pt): Pt | null {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  if (Math.abs(d) < 1e-9) return null;
  const a2 = A.x * A.x + A.y * A.y;
  const b2 = B.x * B.x + B.y * B.y;
  const c2 = C.x * C.x + C.y * C.y;
  return {
    x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
    y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d,
  };
}

export const def: LabDef = {
  chapter: '04-geometrie',
  numero: 4,
  title: { fr: 'La droite d’Euler', en: 'The Euler line' },
  statement: {
    fr: 'Dans un triangle $ABC$, on construit le <strong>centre de gravité</strong> $G$ (intersection des médianes), le <strong>centre du cercle circonscrit</strong> $O$ (médiatrices) et l’<strong>orthocentre</strong> $H$ (hauteurs). Que peut-on dire de ces trois points ?',
    en: 'In a triangle $ABC$, build the <strong>centroid</strong> $G$ (medians), the <strong>circumcentre</strong> $O$ (perpendicular bisectors) and the <strong>orthocentre</strong> $H$ (altitudes). What can be said about these three points?',
  },
  goal: {
    fr: 'Déforme le triangle (même très aplati, rectangle, isocèle…) et mesure $OG$, $GH$ et $OH$. Quelle relation se maintient toujours ? Où est $H$ quand le triangle est obtus ?',
    en: 'Deform the triangle (even very flat, right-angled, isosceles…) and measure $OG$, $GH$ and $OH$. Which relation always holds? Where is $H$ when the triangle is obtuse?',
  },
  steps: {
    fr: [
      'Au départ : un triangle $ABC$ quelconque. <strong>Tire les sommets</strong> à la souris ou au doigt, ou tape leurs coordonnées (x de 0 à 100, y de 0 à 75).',
      'Les points sont : <strong>$G$ bleu</strong> (médianes), <strong>$O$ vert</strong> (médiatrices, cercle circonscrit), <strong>$H$ rouge</strong> (hauteurs). La droite orange passe par $O$ et $H$.',
      'Active ou masque les constructions (médianes, hauteurs, médiatrices, cercles) avec les cases à cocher, ou charge un cas particulier : équilatéral, rectangle, isocèle, obtus.',
      'Lis dans le panneau « Comment c’est calculé » les coordonnées, les longueurs $OG$, $GH$ et le rapport $GH/OG$. <strong>Noter</strong> garde le cas.',
    ],
    en: [
      'At the start: an arbitrary triangle $ABC$. <strong>Drag the vertices</strong> with mouse or finger, or type their coordinates (x from 0 to 100, y from 0 to 75).',
      'The points are: <strong>blue $G$</strong> (medians), <strong>green $O$</strong> (perpendicular bisectors, circumcircle), <strong>red $H$</strong> (altitudes). The orange line goes through $O$ and $H$.',
      'Show or hide the constructions (medians, altitudes, bisectors, circles) with the checkboxes, or load a special case: equilateral, right, isosceles, obtuse.',
      'In the “How it is computed” panel read the coordinates, the lengths $OG$, $GH$ and the ratio $GH/OG$. <strong>Record</strong> keeps the case.',
    ],
  },
  legend: [
    { color: '#2563eb', fr: 'G centre de gravité', en: 'G centroid' },
    { color: '#1d9a45', fr: 'O centre du cercle circonscrit', en: 'O circumcentre' },
    { color: '#dc2626', fr: 'H orthocentre', en: 'H orthocentre' },
    { color: '#f59e0b', fr: 'droite d’Euler', en: 'Euler line' },
    { color: '#9333ea', fr: 'N centre du cercle des 9 points', en: 'N nine-point centre' },
  ],
  hints: {
    fr: [
      'Mesure le rapport $GH / OG$ pour 5 triangles différents. Que remarques-tu ?',
      'Place $A$, $B$, $C$ pour que le triangle soit rectangle, puis équilatéral : où sont alors $O$, $G$, $H$ ?',
      'Prends l’origine en $O$ : on a $\\vec A + \\vec B + \\vec C = \\vec{OH}$. Que vaut alors $\\vec{OG}$ ?',
    ],
    en: [
      'Measure the ratio $GH / OG$ for 5 different triangles. What do you notice?',
      'Place $A$, $B$, $C$ to make the triangle right-angled, then equilateral: where are $O$, $G$, $H$ then?',
      'Take the origin at $O$: then $\\vec A + \\vec B + \\vec C = \\vec{OH}$. What is $\\vec{OG}$?',
    ],
  },
  general: {
    fr: '<p><strong>Théorème d’Euler.</strong> $O$, $G$, $H$ sont alignés et $\\overrightarrow{OH} = 3\\,\\overrightarrow{OG}$ ; autrement dit $G$ est au tiers de $[OH]$ à partir de $O$ ($GH = 2\\,OG$). Preuve vectorielle : avec $O$ pour origine, $\\vec H = \\vec A + \\vec B + \\vec C$ (on vérifie $\\vec{AH} \\cdot \\vec{BC} = 0$), et $\\vec G = \\tfrac13(\\vec A + \\vec B + \\vec C)$.</p><p>Compléments : $H$ est dans le triangle ssi il est acutangle, sur le sommet de l’angle droit s’il est rectangle ; le centre $N$ du cercle des neuf points est le milieu de $[OH]$ ; pour un triangle équilatéral $O = G = H$.</p>',
    en: '<p><strong>Euler’s theorem.</strong> $O$, $G$, $H$ are collinear and $\\overrightarrow{OH} = 3\\,\\overrightarrow{OG}$; that is, $G$ is one third of the way from $O$ to $H$ ($GH = 2\\,OG$). Vector proof: with $O$ as origin, $\\vec H = \\vec A + \\vec B + \\vec C$ (check $\\vec{AH} \\cdot \\vec{BC} = 0$), and $\\vec G = \\tfrac13(\\vec A + \\vec B + \\vec C)$.</p><p>Extras: $H$ lies inside the triangle iff it is acute, at the right-angle vertex if it is right-angled; the nine-point centre $N$ is the midpoint of $[OH]$; for an equilateral triangle $O = G = H$.</p>',
  },
  aspect: 0.75,
  logEmpty: { fr: 'Appuie sur « Noter » après avoir déformé le triangle.', en: 'Press “Record” after deforming the triangle.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let T: Pt[] = [
      { x: 0.2, y: 0.55 },
      { x: 0.78, y: 0.62 },
      { x: 0.46, y: 0.12 },
    ];
    const show = { med: true, alt: false, bis: false, circ: true, nine: false };
    log.setColumns([t('type', 'type'), 'OG', 'GH', 'GH/OG', t('alignés', 'collinear')]);

    const coordBox = el('div', { class: 'lab-coords' });
    const inputs: { x: HTMLInputElement; y: HTMLInputElement }[] = [];
    const buildCoords = () => {
      coordBox.replaceChildren();
      inputs.length = 0;
      T.forEach((_q, i) => {
        const mk = (axis: 'x' | 'y') => {
          const max = axis === 'x' ? 100 : ASP * 100;
          const inp = el('input', { type: 'number', class: 'lab-num lab-num-sm', min: '0', max: String(max), step: '1', 'aria-label': `${'ABC'[i]}${axis}` }) as HTMLInputElement;
          inp.addEventListener('change', () => {
            const v = Math.min(max, Math.max(0, Number(inp.value)));
            if (!Number.isFinite(v)) return;
            T[i] = axis === 'x' ? { ...T[i], x: v / 100 } : { ...T[i], y: ASP - v / 100 };
            analyse(false);
          });
          return inp;
        };
        const xi = mk('x');
        const yi = mk('y');
        inputs.push({ x: xi, y: yi });
        coordBox.append(el('span', { class: 'lab-coord' }, el('b', {}, 'ABC'[i]), xi, yi));
      });
      syncCoords();
    };
    const syncCoords = () =>
      T.forEach((q, i) => {
        if (!inputs[i]) return;
        inputs[i].x.value = String(Math.round(q.x * 100));
        inputs[i].y.value = String(Math.round((ASP - q.y) * 100));
      });

    interface Res {
      G: Pt;
      O: Pt | null;
      H: Pt | null;
      N: Pt | null;
    }
    let res: Res = { G: T[0], O: null, H: null, N: null };

    const analyse = (sync = true) => {
      const [A, B, C] = T;
      const G = mul(add(add(A, B), C), 1 / 3);
      const O = circumcenter(A, B, C);
      const H = O ? sub(add(add(A, B), C), mul(O, 2)) : null;
      const N = O && H ? mul(add(O, H), 0.5) : null;
      res = { G, O, H, N };
      if (!O || !H) {
        api.say(`<div class="lab-note">${t('Triangle aplati : les trois points sont alignés, O n’existe pas.', 'Flat triangle: the three vertices are collinear, O does not exist.')}</div>`);
        api.calc('');
        stage.redraw();
        return;
      }
      // type du triangle
      const ang = (P: Pt, Q: Pt, R: Pt) => {
        const u = sub(Q, P);
        const v = sub(R, P);
        return Math.acos(dot(u, v) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)));
      };
      const angs = [ang(A, B, C), ang(B, C, A), ang(C, A, B)].map((x) => (x * 180) / Math.PI);
      const mx = Math.max(...angs);
      const kind = Math.abs(mx - 90) < 0.8 ? t('rectangle', 'right') : mx > 90 ? t('obtusangle', 'obtuse') : t('acutangle', 'acute');
      const OG = dist(O, G);
      const GH = dist(G, H);
      const OH = dist(O, H);
      const cross = Math.abs((G.x - O.x) * (H.y - O.y) - (G.y - O.y) * (H.x - O.x));
      const aligned = cross < 1e-9 || OH < 1e-9;
      const ratio = OG > 1e-9 ? GH / OG : NaN;
      api.say(
        `<div class="lab-big">${t('Triangle', 'Triangle')} <strong>${kind}</strong> · $GH / OG = $ <strong>${isNaN(ratio) ? '—' : fmt(ratio, 4)}</strong> · ${t('alignés', 'collinear')} ${aligned ? '<span class="lab-ok">✔</span>' : '<span class="lab-bad">✘</span>'}</div>` +
          `<div>${t('Angles', 'Angles')} : ${angs.map((x) => `${fmt(x, 1)}°`).join(' · ')} · $H$ ${kind === t('acutangle', 'acute') ? t('à l’intérieur', 'inside') : kind === t('rectangle', 'right') ? t('au sommet de l’angle droit', 'at the right-angle vertex') : t('à l’extérieur', 'outside')}</div>`,
      );
      const c = (P: Pt) => `(${fmt(P.x * 100, 1)},\\ ${fmt((ASP - P.y) * 100, 1)})`;
      api.calc(
        `<ul><li>$A = ${c(A)}$, $B = ${c(B)}$, $C = ${c(C)}$</li>` +
          `<li>$G = \\dfrac{A + B + C}{3} = ${c(G)}$</li>` +
          `<li>$O$ = ${t('intersection des médiatrices', 'intersection of the perpendicular bisectors')} $= ${c(O)}$, ${t('rayon', 'radius')} $R = ${fmt(dist(O, A) * 100, 2)}$</li>` +
          `<li>$H = A + B + C - 2O = ${c(H)}$ ${t('(avec O pour origine : H = A + B + C)', '(with O as origin: H = A + B + C)')}</li>` +
          `<li>$OG = ${fmt(OG * 100, 3)}$, $GH = ${fmt(GH * 100, 3)}$, $OH = ${fmt(OH * 100, 3)}$ ⇒ $\\overrightarrow{OH} = 3\\,\\overrightarrow{OG}$ : $(${fmt((H.x - O.x) * 100, 2)},\\ ${fmt(-(H.y - O.y) * 100, 2)}) = 3\\times(${fmt((G.x - O.x) * 100, 2)},\\ ${fmt(-(G.y - O.y) * 100, 2)})$</li></ul>`,
      );
      if (sync) syncCoords();
      stage.redraw();
    };

    const preset = (name: string, pts: [number, number][]) =>
      button(name, () => {
        T = pts.map(([x, y]) => ({ x, y }));
        buildCoords();
        analyse();
      });
    const tg = (label: string, key: keyof typeof show, on: boolean) => toggle(label, on, (v) => ((show[key] = v), stage.redraw()));

    controls.append(
      group(
        t('Cas particuliers', 'Special cases'),
        preset(t('équilatéral', 'equilateral'), [[0.25, 0.6], [0.75, 0.6], [0.5, 0.6 - 0.5 * Math.sqrt(3) / 2]]),
        preset(t('rectangle', 'right'), [[0.25, 0.62], [0.7, 0.62], [0.25, 0.14]]),
        preset(t('isocèle', 'isosceles'), [[0.25, 0.6], [0.75, 0.6], [0.5, 0.1]]),
        preset(t('obtus', 'obtuse'), [[0.15, 0.6], [0.85, 0.6], [0.28, 0.36]]),
      ),
      group(
        t('Constructions', 'Constructions'),
        tg(t('médianes', 'medians'), 'med', true),
        tg(t('hauteurs', 'altitudes'), 'alt', false),
        tg(t('médiatrices', 'bisectors'), 'bis', false),
        tg(t('cercle circonscrit', 'circumcircle'), 'circ', true),
        tg(t('cercle des 9 points', 'nine-point circle'), 'nine', false),
      ),
      group(t('Coordonnées (x de 0 à 100, y de 0 à 75)', 'Coordinates (x 0–100, y 0–75)'), coordBox),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          if (!res.O || !res.H) return;
          const OG = dist(res.O, res.G);
          const GH = dist(res.G, res.H);
          const [A, B, C] = T;
          const ang = [A, B, C].map((_, i) => {
            const P = T[i];
            const Q = T[(i + 1) % 3];
            const R = T[(i + 2) % 3];
            return Math.acos(dot(sub(Q, P), sub(R, P)) / (dist(P, Q) * dist(P, R))) * (180 / Math.PI);
          });
          const mx = Math.max(...ang);
          const kind = Math.abs(mx - 90) < 0.8 ? t('rectangle', 'right') : mx > 90 ? t('obtus', 'obtuse') : t('aigu', 'acute');
          log.add([kind, fmt(OG * 100, 2), fmt(GH * 100, 2), OG > 1e-9 ? fmt(GH / OG, 3) : '—', '✔'], 'ok');
        }, 'primary'),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    stage.setDraw((ctx, w, h, p) => {
      const X = (q: Pt) => q.x * w;
      const Y = (q: Pt) => (q.y / ASP) * h;
      const [A, B, C] = T;
      const line = (P: Pt, Q: Pt, color: string, lw = 1.2, dash: number[] = []) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(X(P), Y(P));
        ctx.lineTo(X(Q), Y(Q));
        ctx.stroke();
        ctx.setLineDash([]);
      };
      const infinite = (P: Pt, dir: Pt, color: string, lw: number, dash: number[] = []) => {
        const L = 5;
        line({ x: P.x - dir.x * L, y: P.y - dir.y * L }, { x: P.x + dir.x * L, y: P.y + dir.y * L }, color, lw, dash);
      };
      const { G, O, H, N } = res;
      // cercles
      if (O && show.circ) {
        ctx.strokeStyle = '#1d9a45';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(X(O), Y(O), dist(O, A) * w, (dist(O, A) / ASP) * h, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (N && O && show.nine) {
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(X(N), Y(N), (dist(O, A) / 2) * w, (dist(O, A) / 2 / ASP) * h, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (show.med) {
        [[A, B, C], [B, C, A], [C, A, B]].forEach(([P, Q, R]) => line(P, mul(add(Q, R), 0.5), '#2563eb', 1.2, [4, 3]));
      }
      if (show.alt) {
        [[A, B, C], [B, C, A], [C, A, B]].forEach(([P, Q, R]) => {
          const d = sub(R, Q);
          infinite(P, { x: -d.y, y: d.x }, '#dc2626', 1, [4, 3]);
        });
      }
      if (show.bis) {
        [[A, B], [B, C], [C, A]].forEach(([P, Q]) => {
          const d = sub(Q, P);
          infinite(mul(add(P, Q), 0.5), { x: -d.y, y: d.x }, '#1d9a45', 1, [4, 3]);
        });
      }
      // triangle
      ctx.fillStyle = 'rgba(127,127,127,0.10)';
      ctx.beginPath();
      ctx.moveTo(X(A), Y(A));
      ctx.lineTo(X(B), Y(B));
      ctx.lineTo(X(C), Y(C));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      // droite d'Euler
      if (O && H && dist(O, H) > 1e-9) infinite(O, sub(H, O), '#f59e0b', 3);
      const dot2 = (P: Pt | null, color: string, name: string) => {
        if (!P) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(X(P), Y(P), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.surface;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(name, X(P) + 9, Y(P) - 8);
      };
      dot2(O, '#1d9a45', 'O');
      dot2(G, '#2563eb', 'G');
      dot2(H, '#dc2626', 'H');
      if (show.nine) dot2(N, '#9333ea', 'N');
      T.forEach((q, i) => {
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
        ctx.font = '700 12px system-ui, sans-serif';
        ctx.fillText('ABC'[i], X(q), Y(q) + 0.5);
        ctx.textBaseline = 'alphabetic';
      });
    });

    enableDrag(
      stage,
      () => T.map((q) => ({ x: q.x * stage.w, y: (q.y / ASP) * stage.h, r: 11 })),
      (i, x, y) => {
        T[i] = { x: Math.min(0.97, Math.max(0.03, x / stage.w)), y: Math.min(ASP * 0.96, Math.max(ASP * 0.04, (y / stage.h) * ASP)) };
        analyse();
      },
    );

    buildCoords();
    analyse();
  },
};
