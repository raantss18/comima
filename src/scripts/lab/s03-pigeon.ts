import { button, enableDrag, fmt, rng, slider, type LabDef } from './core';

/**
 * Chapitre 3 — Principe des tiroirs.
 * n points dans un carré de côté 1 : à quel point peut-on les écarter ?
 * Pour n = 5, deux points sont toujours à distance ≤ √2/2 (quatre tiroirs).
 */

interface Pt {
  x: number;
  y: number;
}

function minDist(P: Pt[]): { d: number; i: number; j: number } {
  let d = Infinity;
  let bi = 0;
  let bj = 1;
  for (let i = 0; i < P.length; i++)
    for (let j = i + 1; j < P.length; j++) {
      const e = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
      if (e < d) {
        d = e;
        bi = i;
        bj = j;
      }
    }
  return { d, i: bi, j: bj };
}

/** Plus grand k tel que k² < n (nombre de tiroirs par côté garantissant un doublon). */
const drawerSide = (n: number) => Math.max(1, Math.ceil(Math.sqrt(n)) - 1);

/** Recherche (hill-climbing avec redémarrages) d'une configuration maximisant la distance minimale. */
function optimise(n: number, start?: Pt[], restarts = 24, iters = 3500, seed = 1): Pt[] {
  const rand = rng(seed + n * 977);
  let best: Pt[] = start ? start.map((p) => ({ ...p })) : [];
  let bestD = best.length ? minDist(best).d : -1;
  for (let r = 0; r < restarts; r++) {
    let cur: Pt[] = r === 0 && start ? start.map((p) => ({ ...p })) : Array.from({ length: n }, () => ({ x: rand(), y: rand() }));
    let d = minDist(cur).d;
    for (let it = 0; it < iters; it++) {
      const step = 0.25 * (1 - it / iters) ** 2 + 0.0015;
      const k = Math.floor(rand() * n);
      const old = cur[k];
      cur[k] = {
        x: Math.min(1, Math.max(0, old.x + (rand() - 0.5) * 2 * step)),
        y: Math.min(1, Math.max(0, old.y + (rand() - 0.5) * 2 * step)),
      };
      const nd = minDist(cur).d;
      if (nd >= d) d = nd;
      else cur[k] = old;
    }
    if (d > bestD) {
      bestD = d;
      best = cur;
    }
  }
  return best;
}

export const def: LabDef = {
  chapter: '03-principe-des-tiroirs',
  numero: 3,
  title: { fr: 'Des points dans un carré', en: 'Points in a square' },
  statement: {
    fr: 'On place $n$ points dans un carré de côté $1$. On note $d_n$ la plus grande valeur possible de la <em>plus petite distance</em> entre deux de ces points. Que vaut $d_n$ ?',
    en: 'Place $n$ points in a square of side $1$. Let $d_n$ be the largest possible value of the <em>smallest distance</em> between two of the points. What is $d_n$?',
  },
  goal: {
    fr: 'Écarte les points au maximum (ou clique sur « Optimiser »), compare avec la borne donnée par les tiroirs, et conjecture le comportement de $d_n$.',
    en: 'Spread the points as far apart as you can (or click “Optimise”), compare with the pigeonhole bound, and conjecture how $d_n$ behaves.',
  },
  hints: {
    fr: [
      'Remplis le tableau (bouton « Remplir ») : pour quelles valeurs de $n$ la configuration optimale est-elle « jolie » (symétrique) ?',
      'Découpe le carré en $k \\times k$ petits carrés (les tiroirs). Quelle est la plus grande distance entre deux points d’un même petit carré ?',
      'Si $n > k^2$, deux points tombent dans le même tiroir : leur distance est au plus $\\sqrt{2}/k$. Compare cette borne à tes valeurs : quand est-elle atteinte ?',
    ],
    en: [
      'Fill the table (“Fill” button): for which values of $n$ is the optimal configuration “nice” (symmetric)?',
      'Cut the square into $k \\times k$ small squares (the drawers). What is the largest distance between two points of the same small square?',
      'If $n > k^2$, two points share a drawer: their distance is at most $\\sqrt{2}/k$. Compare this bound with your values: when is it reached?',
    ],
  },
  general: {
    fr: '<p><strong>Borne des tiroirs.</strong> Si $n > k^2$, alors $d_n \\le \\dfrac{\\sqrt 2}{k}$. Elle est <em>exacte</em> pour $n = 2$ ($d_2 = \\sqrt2$) et $n = 5$ ($d_5 = \\tfrac{\\sqrt2}{2}$), mais pas pour $n = 10$ : $d_{10} \\approx 0{,}4213 < \\tfrac{\\sqrt2}{3} \\approx 0{,}4714$.</p><p>Le principe des tiroirs donne un <strong>majorant</strong> ; trouver la valeur exacte est un problème d’empilement beaucoup plus fin (problème de Tammes carré).</p>',
    en: '<p><strong>Pigeonhole bound.</strong> If $n > k^2$, then $d_n \\le \\dfrac{\\sqrt 2}{k}$. It is <em>exact</em> for $n = 2$ ($d_2 = \\sqrt2$) and $n = 5$ ($d_5 = \\tfrac{\\sqrt2}{2}$), but not for $n = 10$: $d_{10} \\approx 0.4213 < \\tfrac{\\sqrt2}{3} \\approx 0.4714$.</p><p>The pigeonhole principle gives an <strong>upper bound</strong>; finding the exact value is a much finer packing problem.</p>',
  },
  aspect: 0.86,
  logEmpty: { fr: 'Clique sur « Remplir » pour calculer les valeurs approchées de d_n.', en: 'Click “Fill” to compute approximate values of d_n.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let n = 5;
    let P: Pt[] = optimise(5, undefined, 6, 800, 3);
    // Départ volontairement brouillon pour que l'élève cherche.
    P = Array.from({ length: n }, (_, i) => ({ x: 0.25 + 0.1 * (i % 3), y: 0.25 + 0.12 * i }));
    let showGrid = true;
    log.setColumns(['n', t('d_n trouvé', 'd_n found'), t('borne √2/k', 'bound √2/k'), 'k']);

    const update = () => {
      const { d } = minDist(P);
      const k = drawerSide(n);
      const bound = Math.SQRT2 / k;
      api.say(
        `<div class="lab-big">${t('Plus petite distance', 'Smallest distance')} : <strong>${fmt(d, 4)}</strong></div>` +
          `<div>${t('Principe des tiroirs', 'Pigeonhole')} : $n = ${n} > ${k}^2$ ⇒ $d \\le \\sqrt2/${k} \\approx ${fmt(bound, 4)}$</div>` +
          `<div class="lab-muted">${t('Atteint', 'Reached')} : ${fmt((d / bound) * 100, 1)} %</div>`,
      );
      document.dispatchEvent(new CustomEvent('comima:render-math'));
      stage.redraw();
    };

    const setN = (v: number) => {
      n = v;
      if (P.length > n) P = P.slice(0, n);
      const r = rng(n);
      while (P.length < n) P.push({ x: r(), y: r() });
      update();
    };
    const nSlider = slider('n', 2, 12, n, 1, setN);

    const anim = { id: 0 };
    controls.append(
      nSlider.row,
      button(t('Optimiser', 'Optimise'), () => {
        cancelAnimationFrame(anim.id);
        let round = 0;
        const step = () => {
          P = optimise(n, P, 1, 600, 11 + round);
          update();
          if (++round < 8) anim.id = requestAnimationFrame(step);
        };
        step();
      }, 'primary'),
      button(t('Mélanger', 'Shuffle'), () => {
        const r = rng(Math.floor(Math.random() * 1e6));
        P = Array.from({ length: n }, () => ({ x: r(), y: r() }));
        update();
      }),
      button(t('Remplir (n = 2…12)', 'Fill (n = 2…12)'), () => {
        log.clear();
        for (let k = 12; k >= 2; k--) {
          const best = optimise(k, undefined, 40, 4000, 5);
          const d = minDist(best).d;
          const side = drawerSide(k);
          log.add([k, fmt(d, 4), fmt(Math.SQRT2 / side, 4), side], Math.abs(d - Math.SQRT2 / side) < 1e-3 ? 'ok' : undefined);
        }
      }),
      button(t('Noter', 'Record'), () => {
        const side = drawerSide(n);
        log.add([n, fmt(minDist(P).d, 4), fmt(Math.SQRT2 / side, 4), side]);
      }),
      (() => {
        const lab = document.createElement('label');
        lab.className = 'lab-check';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.addEventListener('change', () => {
          showGrid = cb.checked;
          stage.redraw();
        });
        lab.append(cb, t(' Montrer les tiroirs', ' Show the drawers'));
        return lab;
      })(),
    );

    const box = () => {
      const s = Math.min(stage.w, stage.h) - 24;
      return { s, x0: (stage.w - s) / 2, y0: (stage.h - s) / 2 };
    };

    stage.setDraw((ctx, _w, _h, p) => {
      const { s, x0, y0 } = box();
      const k = drawerSide(n);
      // tiroirs contenant au moins deux points
      if (showGrid) {
        const counts = new Map<string, number>();
        for (const q of P) {
          const cx = Math.min(k - 1, Math.floor(q.x * k));
          const cy = Math.min(k - 1, Math.floor(q.y * k));
          const key = `${cx},${cy}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        for (const [key, c] of counts) {
          if (c < 2) continue;
          const [cx, cy] = key.split(',').map(Number);
          ctx.fillStyle = 'rgba(214,54,43,0.18)';
          ctx.fillRect(x0 + (cx * s) / k, y0 + (cy * s) / k, s / k, s / k);
        }
        ctx.strokeStyle = p.line;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 4]);
        for (let i = 1; i < k; i++) {
          ctx.beginPath();
          ctx.moveTo(x0 + (i * s) / k, y0);
          ctx.lineTo(x0 + (i * s) / k, y0 + s);
          ctx.moveTo(x0, y0 + (i * s) / k);
          ctx.lineTo(x0 + s, y0 + (i * s) / k);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(x0, y0, s, s);
      const { d, i, j } = minDist(P);
      void d;
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0 + P[i].x * s, y0 + P[i].y * s);
      ctx.lineTo(x0 + P[j].x * s, y0 + P[j].y * s);
      ctx.stroke();
      P.forEach((q, idx) => {
        ctx.fillStyle = idx === i || idx === j ? p.accent : p.primary;
        ctx.beginPath();
        ctx.arc(x0 + q.x * s, y0 + q.y * s, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.surface;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    enableDrag(
      stage,
      () => {
        const { s, x0, y0 } = box();
        return P.map((q) => ({ x: x0 + q.x * s, y: y0 + q.y * s, r: 9 }));
      },
      (idx, x, y) => {
        const { s, x0, y0 } = box();
        P[idx] = { x: Math.min(1, Math.max(0, (x - x0) / s)), y: Math.min(1, Math.max(0, (y - y0) / s)) };
        update();
      },
    );

    update();
  },
};
