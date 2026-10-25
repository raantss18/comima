import { button, enableDrag, fmt, rng, segmented, slider, binom, type LabDef } from './core';

/**
 * Chapitre 0 — Exemples et contre-exemples.
 * Points sur un cercle, toutes les cordes : combien de régions ?
 * 1, 2, 4, 8, 16… puis 31 : une conjecture tentante qui s'effondre.
 */

const TAU = Math.PI * 2;

function layout(n: number, mode: 'regular' | 'generic', seed = 7): number[] {
  const r = rng(seed * 101 + n);
  return Array.from({ length: n }, (_, i) => {
    const base = (TAU * i) / n + Math.PI / 2;
    return mode === 'regular' ? base : base + (r() - 0.5) * 0.85 * (TAU / n);
  });
}

interface Count {
  regions: number;
  interior: number;
  concurrent: boolean;
  pts: { x: number; y: number }[];
}

/** Régions exactes par la formule d'Euler (V − E + F = 1 dans le disque). */
function countRegions(angles: number[]): Count {
  const n = angles.length;
  const P = angles.map((a) => ({ x: Math.cos(a), y: Math.sin(a) }));
  const order = [...angles.keys()].sort((i, j) => (angles[i] % TAU + TAU) % TAU - ((angles[j] % TAU + TAU) % TAU));
  const rank = new Array(n);
  order.forEach((idx, r) => (rank[idx] = r));

  const chords: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) chords.push([i, j]);

  const key = (x: number, y: number) => `${Math.round(x * 1e6)},${Math.round(y * 1e6)}`;
  const points = new Map<string, { x: number; y: number; chords: Set<number> }>();
  const perChord: Set<string>[] = chords.map(() => new Set());

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
      perChord[a].add(kk);
      perChord[b].add(kk);
    }
  }
  const V = n + points.size;
  let E = n; // arcs du cercle
  for (const s of perChord) E += s.size + 1;
  const faces = n === 1 ? 1 : E - V + 1;
  return {
    regions: faces,
    interior: points.size,
    concurrent: [...points.values()].some((p) => p.chords.size > 1 && countThrough(p.chords) > 2),
    pts: [...points.values()],
  };
}

/** Nombre de cordes distinctes passant par un point d'intersection. */
function countThrough(set: Set<number>): number {
  return set.size;
}

export const def: LabDef = {
  chapter: '00-exemples-contre-exemples',
  numero: 0,
  title: { fr: 'Les régions du cercle', en: 'Regions of the circle' },
  statement: {
    fr: 'On place $n$ points sur un cercle et on trace <em>toutes</em> les cordes qui les relient. En combien de régions le disque est-il découpé ?',
    en: 'Place $n$ points on a circle and draw <em>all</em> the chords joining them. Into how many regions is the disc cut?',
  },
  goal: {
    fr: 'Remplis le tableau pour $n = 1, 2, 3, \\dots$, repère la suite et conjecture une formule… puis teste-la jusqu’au bout !',
    en: 'Fill the table for $n = 1, 2, 3, \\dots$, spot the pattern and conjecture a formula… then test it all the way!',
  },
  hints: {
    fr: [
      'Compte à la main pour $n = 1, \\dots, 5$ : quelle suite obtiens-tu ? Quelle formule te vient à l’esprit ?',
      'Teste ta formule pour $n = 6$ avec des points <em>quelconques</em> (bouton « positions quelconques »). Que se passe-t-il ?',
      'Compare avec des points régulièrement espacés pour $n = 6$ : trois cordes se coupent-elles au même point ? Cela change-t-il le nombre de régions ?',
    ],
    en: [
      'Count by hand for $n = 1, \\dots, 5$: which sequence do you get? Which formula comes to mind?',
      'Test your formula for $n = 6$ with <em>arbitrary</em> points (the “arbitrary positions” button). What happens?',
      'Compare with evenly spaced points for $n = 6$: do three chords meet at one point? Does it change the number of regions?',
    ],
  },
  general: {
    fr: '<p>Tant que trois cordes ne sont jamais concourantes, le nombre de régions est $$1 + \\binom{n}{2} + \\binom{n}{4}.$$ Suite : $1, 2, 4, 8, 16, 31, 57, 99, 163, 256, \\dots$ — la conjecture « $2^{n-1}$ » est <strong>fausse dès $n = 6$</strong> : un seul contre-exemple suffit à la réfuter.</p><p>Preuve : la formule d’Euler $V - E + F = 1$ avec $V = n + \\binom{n}{4}$ (chaque quadruplet de points donne un croisement).</p>',
    en: '<p>As long as no three chords are concurrent, the number of regions is $$1 + \\binom{n}{2} + \\binom{n}{4}.$$ Sequence: $1, 2, 4, 8, 16, 31, 57, 99, 163, 256, \\dots$ — the conjecture “$2^{n-1}$” is <strong>false from $n = 6$</strong>: a single counterexample is enough to refute it.</p><p>Proof: Euler’s formula $V - E + F = 1$ with $V = n + \\binom{n}{4}$ (each 4-subset of points gives one crossing).</p>',
  },
  aspect: 0.78,
  logEmpty: {
    fr: 'Appuie sur « Noter » ou « Remplir le tableau » pour collecter des données.',
    en: 'Press “Record” or “Fill the table” to collect data.',
  },
  init(api) {
    const { t, stage, controls, log } = api;
    let n = 5;
    let mode: 'regular' | 'generic' | 'free' = 'generic';
    let angles = layout(n, 'generic');
    let result = countRegions(angles);
    log.setColumns(['n', t('régions', 'regions'), '2ⁿ⁻¹', t('positions', 'positions')]);

    const modeName = () =>
      mode === 'regular' ? t('régulières', 'regular') : mode === 'generic' ? t('quelconques', 'arbitrary') : t('libres', 'free');

    const update = () => {
      result = countRegions(angles);
      const expected = 2 ** (n - 1);
      const ok = result.regions === expected;
      api.say(
        `<div class="lab-big">${t('Régions', 'Regions')} : <strong>${result.regions}</strong></div>` +
          `<div>${t('Ta conjecture', 'Your conjecture')} $2^{n-1}$ = <strong>${expected}</strong> ` +
          (ok ? '<span class="lab-ok">✔</span>' : `<span class="lab-bad">✘ ${t('contre-exemple !', 'counterexample!')}</span>`) +
          '</div>' +
          (result.concurrent
            ? `<div class="lab-note">${t('⚠️ Des cordes se coupent en un même point : on perd des régions. Déplace un point pour les séparer.', '⚠️ Some chords meet at a single point, which loses regions. Move a point to separate them.')}</div>`
            : ''),
      );
      document.dispatchEvent(new CustomEvent('comima:render-math'));
      stage.redraw();
    };

    const setN = (v: number) => {
      n = v;
      angles = layout(n, mode === 'regular' ? 'regular' : 'generic');
      if (mode === 'free') mode = 'generic';
      update();
    };

    const nSlider = slider('n', 1, 10, n, 1, setN);
    const note = () => {
      log.add([n, result.regions, 2 ** (n - 1), modeName()], result.regions === 2 ** (n - 1) ? 'ok' : 'bad');
    };
    const modeSeg = segmented(
      [
        { value: 'generic' as const, label: t('Quelconques', 'Arbitrary') },
        { value: 'regular' as const, label: t('Régulières', 'Regular') },
      ],
      'generic',
      (m) => {
        mode = m;
        angles = layout(n, m);
        update();
      },
    );
    controls.append(
      nSlider.row,
      modeSeg.row,
      button(t('Noter', 'Record'), note, 'primary'),
      button(t('Remplir le tableau (n = 1…10)', 'Fill the table (n = 1…10)'), () => {
        log.clear();
        for (let k = 10; k >= 1; k--) {
          const r = countRegions(layout(k, 'generic'));
          log.add([k, r.regions, 2 ** (k - 1), t('quelconques', 'arbitrary')], r.regions === 2 ** (k - 1) ? 'ok' : 'bad');
        }
      }),
      button(t('Vider', 'Clear'), () => log.clear()),
    );

    const geom = () => {
      const R = Math.min(stage.w, stage.h) / 2 - 26;
      return { cx: stage.w / 2, cy: stage.h / 2, R };
    };

    stage.setDraw((ctx, w, h, p) => {
      const { cx, cy, R } = geom();
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.ink;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
      const P = angles.map((a) => ({ x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) }));
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
      ctx.fillStyle = p.accent;
      for (const q of result.pts) {
        ctx.beginPath();
        ctx.arc(cx + R * q.x, cy - R * q.y, 3, 0, TAU);
        ctx.fill();
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
        ctx.fillStyle = p.ink;
        ctx.fillText(String(i + 1), q.x, q.y + 0.5);
      });
      void w;
      void h;
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
    void fmt;
    void binom;
  },
};
