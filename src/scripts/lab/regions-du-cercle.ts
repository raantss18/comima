import { binom, button, enableDrag, group, numField, param, rng, segmented, select, toggle, type LabDef } from './core';

/**
 * Chapitre 0 — Exemples et contre-exemples.
 * Points sur un cercle, toutes les cordes : combien de régions ?
 * 1, 2, 4, 8, 16… puis 31 : une conjecture tentante qui s'effondre.
 */

const TAU = Math.PI * 2;

function layout(n: number, mode: 'regular' | 'generic', seed: number): number[] {
  const r = rng(seed * 101 + n);
  return Array.from({ length: n }, (_, i) => {
    const base = (TAU * i) / n + Math.PI / 2;
    return mode === 'regular' ? base : base + (r() - 0.5) * 0.85 * (TAU / n);
  });
}

interface Count {
  regions: number;
  chords: number;
  /** Points d'intersection distincts à l'intérieur du disque. */
  interior: number;
  /** Somme, sur les points d'intersection, du nombre de cordes qui y passent. */
  sumK: number;
  /** Plus grand nombre de cordes passant par un même point intérieur. */
  maxThrough: number;
  edges: number;
  vertices: number;
  pts: { x: number; y: number }[];
}

/** Régions exactes par la formule d'Euler (V − E + F = 1 dans le disque). */
function countRegions(angles: number[]): Count {
  const n = angles.length;
  const P = angles.map((a) => ({ x: Math.cos(a), y: Math.sin(a) }));
  const norm = (a: number) => ((a % TAU) + TAU) % TAU;
  const order = [...angles.keys()].sort((i, j) => norm(angles[i]) - norm(angles[j]));
  const rank = new Array<number>(n);
  order.forEach((idx, r) => (rank[idx] = r));

  const chords: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) chords.push([i, j]);

  const key = (x: number, y: number) => `${Math.round(x * 1e6)},${Math.round(y * 1e6)}`;
  const points = new Map<string, { x: number; y: number; chords: Set<number> }>();
  for (let a = 0; a < chords.length; a++) {
    for (let b = a + 1; b < chords.length; b++) {
      const [i, j] = chords[a];
      const [k, l] = chords[b];
      if (i === k || i === l || j === k || j === l) continue;
      const lo = Math.min(rank[i], rank[j]);
      const hi = Math.max(rank[i], rank[j]);
      const inK = rank[k] > lo && rank[k] < hi;
      const inL = rank[l] > lo && rank[l] < hi;
      if (inK === inL) continue; // les cordes ne se croisent pas
      const d1x = P[j].x - P[i].x;
      const d1y = P[j].y - P[i].y;
      const d2x = P[l].x - P[k].x;
      const d2y = P[l].y - P[k].y;
      const den = d1x * d2y - d1y * d2x;
      if (Math.abs(den) < 1e-12) continue;
      const t = ((P[k].x - P[i].x) * d2y - (P[k].y - P[i].y) * d2x) / den;
      const x = P[i].x + t * d1x;
      const y = P[i].y + t * d1y;
      const kk = key(x, y);
      let pt = points.get(kk);
      if (!pt) {
        pt = { x, y, chords: new Set() };
        points.set(kk, pt);
      }
      pt.chords.add(a);
      pt.chords.add(b);
    }
  }
  let sumK = 0;
  let maxThrough = 2;
  for (const p of points.values()) {
    sumK += p.chords.size;
    maxThrough = Math.max(maxThrough, p.chords.size);
  }
  const V = n + points.size;
  const E = n + chords.length + sumK; // n arcs + Σ (k_c + 1) = n + (#cordes) + Σ k_c
  return {
    regions: n === 1 ? 1 : E - V + 1,
    chords: chords.length,
    interior: points.size,
    sumK,
    maxThrough,
    edges: E,
    vertices: V,
    pts: [...points.values()],
  };
}

type FormulaKey = 'pow' | 'euler' | 'lines';
const formulas: Record<FormulaKey, { label: string; f: (n: number) => number; tex: string }> = {
  pow: { label: '2ⁿ⁻¹', f: (n) => 2 ** (n - 1), tex: '2^{n-1}' },
  euler: { label: '1 + C(n,2) + C(n,4)', f: (n) => 1 + binom(n, 2) + binom(n, 4), tex: '1 + \\binom{n}{2} + \\binom{n}{4}' },
  lines: { label: '1 + C(n,2)', f: (n) => 1 + binom(n, 2), tex: '1 + \\binom{n}{2}' },
};

export const def: LabDef = {
  chapter: '00-exemples-contre-exemples',
  numero: 0,
  title: { fr: 'Les régions du cercle', en: 'Regions of the circle' },
  statement: {
    fr: 'On place $n$ points sur un cercle et on trace <em>toutes</em> les cordes qui les relient. En combien de régions le disque est-il découpé ?',
    en: 'Place $n$ points on a circle and draw <em>all</em> the chords joining them. Into how many regions is the disc cut?',
  },
  goal: {
    fr: 'Remplis le tableau pour $n = 1, 2, 3, \\dots$, repère la suite, propose une formule, teste-la… jusqu’au bout !',
    en: 'Fill the table for $n = 1, 2, 3, \\dots$, spot the pattern, propose a formula, test it… all the way!',
  },
  steps: {
    fr: [
      'Au départ, <strong>$n = 5$</strong> points « quelconques » sont placés. Change $n$ avec le curseur <em>ou en tapant</em> une valeur (1 à 12).',
      'Lis le nombre de <strong>régions</strong> sous le dessin, et compare-le à la formule testée (menu « Formule à tester »).',
      'Appuie sur <strong>Noter</strong> pour garder le cas dans « Mes essais », ou sur <strong>Remplir</strong> pour calculer $n = 1\\dots 12$ d’un coup.',
      'Tire un point sur le cercle ; passe en positions <strong>régulières</strong> pour $n = 6$ : que se passe-t-il quand trois cordes se coupent au même point ?',
    ],
    en: [
      'At the start, <strong>$n = 5$</strong> “arbitrary” points are placed. Change $n$ with the slider <em>or by typing</em> a value (1 to 12).',
      'Read the number of <strong>regions</strong> under the drawing and compare it with the tested formula (“Formula to test” menu).',
      'Press <strong>Record</strong> to keep the case in “My trials”, or <strong>Fill</strong> to compute $n = 1\\dots 12$ at once.',
      'Drag a point along the circle; switch to <strong>regular</strong> positions for $n = 6$: what happens when three chords meet at one point?',
    ],
  },
  legend: [
    { color: '#1d7a33', fr: 'corde', en: 'chord' },
    { color: '#d6362b', fr: 'point d’intersection intérieur', en: 'interior crossing point' },
    { color: '#ffffff', fr: 'point mobile (à tirer)', en: 'movable point (drag it)' },
  ],
  hints: {
    fr: [
      'Compte à la main pour $n = 1, \\dots, 5$ : quelle suite obtiens-tu ? Quelle formule te vient à l’esprit ?',
      'Teste ta formule pour $n = 6$ avec des points <em>quelconques</em>. Que se passe-t-il ?',
      'Compare avec des points régulièrement espacés pour $n = 6$ : trois cordes se coupent-elles au même point ? Cela change-t-il le nombre de régions ?',
      'Regarde le détail du calcul : $F = E - V + 1$. Combien vaut $V$ (points + croisements) ? Combien de croisements pour $n$ points ? (choisis 4 points parmi $n$)',
    ],
    en: [
      'Count by hand for $n = 1, \\dots, 5$: which sequence do you get? Which formula comes to mind?',
      'Test your formula for $n = 6$ with <em>arbitrary</em> points. What happens?',
      'Compare with evenly spaced points for $n = 6$: do three chords meet at one point? Does it change the number of regions?',
      'Look at the computation panel: $F = E - V + 1$. What is $V$ (points + crossings)? How many crossings for $n$ points? (choose 4 points out of $n$)',
    ],
  },
  general: {
    fr: '<p>Tant que trois cordes ne sont jamais concourantes, le nombre de régions est $$1 + \\binom{n}{2} + \\binom{n}{4}.$$ Suite : $1, 2, 4, 8, 16, 31, 57, 99, 163, 256, \\dots$ — la conjecture « $2^{n-1}$ » est <strong>fausse dès $n = 6$</strong> : un seul contre-exemple suffit à la réfuter.</p><p>Preuve : la formule d’Euler $V - E + F = 1$ avec $V = n + \\binom{n}{4}$ (chaque quadruplet de points donne un croisement) et $E = n + \\binom n2 + 2\\binom n4$.</p>',
    en: '<p>As long as no three chords are concurrent, the number of regions is $$1 + \\binom{n}{2} + \\binom{n}{4}.$$ Sequence: $1, 2, 4, 8, 16, 31, 57, 99, 163, 256, \\dots$ — the conjecture “$2^{n-1}$” is <strong>false from $n = 6$</strong>: a single counterexample is enough to refute it.</p><p>Proof: Euler’s formula $V - E + F = 1$ with $V = n + \\binom{n}{4}$ (each 4-subset of points gives one crossing) and $E = n + \\binom n2 + 2\\binom n4$.</p>',
  },
  aspect: 0.8,
  logEmpty: {
    fr: 'Appuie sur « Noter » ou « Remplir » pour collecter des données.',
    en: 'Press “Record” or “Fill” to collect data.',
  },
  init(api) {
    const { t, stage, controls, log } = api;
    let n = 5;
    let seed = 7;
    let mode: 'regular' | 'generic' | 'free' = 'generic';
    let formula: FormulaKey = 'pow';
    let showChords = true;
    let showPts = true;
    let showNums = true;
    let angles = layout(n, 'generic', seed);
    let result = countRegions(angles);
    const setCols = () => log.setColumns(['n', t('régions', 'regions'), formulas[formula].label, t('positions', 'positions')]);
    setCols();

    const modeName = () =>
      mode === 'regular' ? t('régulières', 'regular') : mode === 'generic' ? t('quelconques', 'arbitrary') : t('libres', 'free');

    const update = () => {
      result = countRegions(angles);
      const expected = formulas[formula].f(n);
      const ok = result.regions === expected;
      api.say(
        `<div class="lab-big">${t('Régions', 'Regions')} : <strong>${result.regions}</strong></div>` +
          `<div>${t('Formule testée', 'Tested formula')} $${formulas[formula].tex}$ = <strong>${expected}</strong> ` +
          (ok ? '<span class="lab-ok">✔</span>' : `<span class="lab-bad">✘ ${t('contre-exemple !', 'counterexample!')}</span>`) +
          '</div>' +
          (result.maxThrough > 2
            ? `<div class="lab-note">${t(`⚠️ ${result.maxThrough} cordes se coupent en un même point : on perd des régions. Déplace un point pour les séparer.`, `⚠️ ${result.maxThrough} chords meet at one point: regions are lost. Move a point to separate them.`)}</div>`
            : ''),
      );
      api.calc(
        `<p>${t('Les cordes et leurs croisements forment un graphe plan dans le disque.', 'Chords and their crossings form a planar graph in the disc.')}</p>` +
          `<ul>` +
          `<li>${t('cordes', 'chords')} : $\\binom{${n}}{2} = ${result.chords}$</li>` +
          `<li>${t('points de croisement distincts', 'distinct crossing points')} : $I = ${result.interior}$ ${result.maxThrough > 2 ? t('(des cordes concourent)', '(some chords concur)') : `$= \\binom{${n}}{4} = ${binom(n, 4)}$`}</li>` +
          `<li>$V = n + I = ${n} + ${result.interior} = ${result.vertices}$</li>` +
          `<li>$E = n + \\#${t('cordes', 'chords')} + \\sum k = ${n} + ${result.chords} + ${result.sumK} = ${result.edges}$ ` +
          `<small>(${t('chaque corde est coupée en $k+1$ segments', 'each chord is cut into $k+1$ segments')})</small></li>` +
          `<li>$F = E - V + 1 = ${result.edges} - ${result.vertices} + 1 = ${result.regions}$</li></ul>`,
      );
      stage.redraw();
    };

    const relayout = () => {
      angles = layout(n, mode === 'regular' ? 'regular' : 'generic', seed);
      if (mode === 'free') mode = 'generic';
      update();
    };

    const nParam = param('n', 1, 12, n, 1, (v) => {
      n = v;
      relayout();
    });
    const modeSeg = segmented(
      [
        { value: 'generic' as const, label: t('Quelconques', 'Arbitrary') },
        { value: 'regular' as const, label: t('Régulières', 'Regular') },
      ],
      'generic',
      (m) => {
        mode = m;
        relayout();
      },
    );
    const seedField = numField(t('Graine', 'Seed'), seed, (v) => {
      seed = Math.round(v);
      mode = 'generic';
      modeSeg.set('generic');
      relayout();
    }, { min: 1, max: 999, width: '4.5rem' });
    const formulaSel = select<FormulaKey>(
      t('Formule à tester', 'Formula to test'),
      (Object.keys(formulas) as FormulaKey[]).map((k) => ({ value: k, label: formulas[k].label })),
      formula,
      (k) => {
        formula = k;
        setCols();
        log.clear();
        update();
      },
    );

    const record = () => log.add([n, result.regions, formulas[formula].f(n), modeName()], result.regions === formulas[formula].f(n) ? 'ok' : 'bad');
    controls.append(
      group(t('Paramètres', 'Parameters'), nParam.row, modeSeg.row, seedField.row, formulaSel.row),
      group(
        t('Affichage', 'Display'),
        toggle(t('cordes', 'chords'), true, (v) => ((showChords = v), stage.redraw())),
        toggle(t('croisements', 'crossings'), true, (v) => ((showPts = v), stage.redraw())),
        toggle(t('numéros', 'labels'), true, (v) => ((showNums = v), stage.redraw())),
      ),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), record, 'primary'),
        button(t('Remplir (n = 1…12)', 'Fill (n = 1…12)'), () => {
          log.clear();
          for (let k = 12; k >= 1; k--) {
            const r = countRegions(layout(k, 'generic', seed));
            log.add([k, r.regions, formulas[formula].f(k), t('quelconques', 'arbitrary')], r.regions === formulas[formula].f(k) ? 'ok' : 'bad');
          }
        }),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    const geom = () => {
      const R = Math.min(stage.w, stage.h) / 2 - 26;
      return { cx: stage.w / 2, cy: stage.h / 2, R };
    };

    stage.setDraw((ctx, _w, _h, p) => {
      const { cx, cy, R } = geom();
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.ink;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
      const P = angles.map((a) => ({ x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) }));
      if (showChords) {
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = p.primary;
        ctx.globalAlpha = 0.85;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            ctx.beginPath();
            ctx.moveTo(P[i].x, P[i].y);
            ctx.lineTo(P[j].x, P[j].y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }
      if (showPts) {
        ctx.fillStyle = p.accent;
        for (const q of result.pts) {
          ctx.beginPath();
          ctx.arc(cx + R * q.x, cy - R * q.y, 3, 0, TAU);
          ctx.fill();
        }
      }
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      P.forEach((q, i) => {
        ctx.fillStyle = p.surface;
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 10, 0, TAU);
        ctx.fill();
        ctx.stroke();
        if (showNums) {
          ctx.fillStyle = p.ink;
          ctx.fillText(String(i + 1), q.x, q.y + 0.5);
        }
      });
    });

    enableDrag(
      stage,
      () => {
        const { cx, cy, R } = geom();
        return angles.slice(0, n).map((a) => ({ x: cx + R * Math.cos(a), y: cy - R * Math.sin(a), r: 10 }));
      },
      (i, x, y) => {
        const { cx, cy } = geom();
        angles[i] = Math.atan2(cy - y, x - cx);
        mode = 'free';
        modeSeg.set(null as never);
        update();
      },
    );

    update();
  },
};
