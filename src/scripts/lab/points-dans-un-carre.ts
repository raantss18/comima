import { button, el, enableDrag, fmt, group, numField, param, rng, toggle, type LabDef } from './core';

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
  steps: {
    fr: [
      'Au départ : <strong>$n = 5$ points</strong> placés au hasard dans un carré de côté $1$ (tire-les ! ou tape leurs coordonnées $x, y \\in [0, 1]$ dans le tableau).',
      'Le <strong>segment rouge</strong> relie les deux points les plus proches : sa longueur est la « plus petite distance ». Ton but : la rendre la plus grande possible.',
      'Les <strong>tiroirs</strong> (petits carrés pointillés) sont découpés en $k \\times k$ ; un tiroir contenant 2 points est coloré. Change $k$ pour voir quand le principe garantit un tiroir double.',
      'Bouton <strong>Optimiser</strong> : l’ordinateur améliore ta configuration ; <strong>Remplir</strong> calcule les valeurs approchées de $d_n$ pour $n = 2\\dots 12$ et les compare à la borne $\\sqrt2 / k$.',
    ],
    en: [
      'At the start: <strong>$n = 5$ points</strong> placed at random in a square of side $1$ (drag them! or type their coordinates $x, y \\in [0, 1]$ in the table).',
      'The <strong>red segment</strong> joins the two closest points: its length is the “smallest distance”. Your goal: make it as large as possible.',
      'The <strong>drawers</strong> (small dashed squares) form a $k \\times k$ grid; a drawer holding 2 points is coloured. Change $k$ to see when the principle guarantees a doubled drawer.',
      '<strong>Optimise</strong> button: the computer improves your configuration; <strong>Fill</strong> computes approximate values of $d_n$ for $n = 2\\dots 12$ and compares them with the bound $\\sqrt2 / k$.',
    ],
  },
  legend: [
    { color: '#1d7a33', fr: 'point', en: 'point' },
    { color: '#d6362b', fr: 'les deux points les plus proches', en: 'the two closest points' },
    { color: 'rgba(214,54,43,0.3)', fr: 'tiroir contenant ≥ 2 points', en: 'drawer holding ≥ 2 points' },
  ],
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
    let P: Pt[] = Array.from({ length: n }, (_, i) => ({ x: 0.25 + 0.1 * (i % 3), y: 0.25 + 0.12 * i }));
    let kOverride = 0; // 0 = automatique : plus grand k tel que k² < n
    let showGrid = true;
    log.setColumns(['n', t('d_n trouvé', 'd_n found'), t('borne √2/k', 'bound √2/k'), 'k']);

    const kOf = () => (kOverride > 0 ? kOverride : drawerSide(n));

    // Tableau de coordonnées éditables
    const coordBox = el('div', { class: 'lab-coords' });
    const inputs: { x: HTMLInputElement; y: HTMLInputElement }[] = [];
    const buildCoords = () => {
      coordBox.replaceChildren();
      inputs.length = 0;
      P.forEach((q, i) => {
        const mk = (axis: 'x' | 'y') => {
          const inp = el('input', { type: 'number', class: 'lab-num lab-num-sm', min: '0', max: '1', step: '0.01', 'aria-label': `${axis}${i + 1}` }) as HTMLInputElement;
          inp.addEventListener('change', () => {
            const v = Math.min(1, Math.max(0, Number(inp.value)));
            if (!Number.isFinite(v)) return;
            P[i] = { ...P[i], [axis]: v } as Pt;
            update(false);
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
        inputs[i].x.value = q.x.toFixed(2);
        inputs[i].y.value = q.y.toFixed(2);
      });

    const update = (sync = true) => {
      const { d, i, j } = minDist(P);
      const k = kOf();
      const bound = Math.SQRT2 / k;
      const guaranteed = n > k * k;
      const counts: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));
      for (const q of P) counts[Math.min(k - 1, Math.floor(q.y * k))][Math.min(k - 1, Math.floor(q.x * k))]++;
      const maxDrawer = Math.max(...counts.flat());
      api.say(
        `<div class="lab-big">${t('Plus petite distance', 'Smallest distance')} : <strong>${fmt(d, 4)}</strong></div>` +
          `<div>${t('Tiroirs', 'Drawers')} : $k = ${k}$, $k^2 = ${k * k}$ · ${guaranteed ? `<span class="lab-ok">$n = ${n} > ${k * k}$ ⇒ ${t('un tiroir contient ≥ 2 points', 'some drawer holds ≥ 2 points')}</span>` : `<span class="lab-muted">$n = ${n} \\le ${k * k}$ : ${t('rien n’est garanti', 'nothing is guaranteed')}</span>`}</div>` +
          `<div class="lab-muted">${t('Atteint', 'Reached')} : ${fmt((d / bound) * 100, 1)} % ${t('de la borne', 'of the bound')} $\\sqrt2/${k} \\approx ${fmt(bound, 4)}$</div>`,
      );
      api.calc(
        `<p>${t('Distance entre les points', 'Distance between points')} ${i + 1} ${t('et', 'and')} ${j + 1} : $\\sqrt{(${P[i].x.toFixed(3)} - ${P[j].x.toFixed(3)})^2 + (${P[i].y.toFixed(3)} - ${P[j].y.toFixed(3)})^2} = ${fmt(d, 5)}$.</p>` +
          `<p>${t('Deux points d’un même tiroir de côté', 'Two points in the same drawer of side')} $\\tfrac1${k}$ ${t('sont à distance au plus la diagonale', 'are at most the diagonal apart')} : $\\tfrac{\\sqrt2}{${k}} = ${fmt(bound, 4)}$.</p>` +
          `<p>${t('Remplissage des tiroirs (ligne par ligne)', 'Drawer contents (row by row)')} : ${counts.map((r) => `[${r.join(' ')}]`).join(' ')} — ${t('maximum', 'maximum')} ${maxDrawer}.</p>`,
      );
      if (sync) syncCoords();
      stage.redraw();
    };

    const nP = param('n', 2, 12, n, 1, (v) => {
      n = v;
      if (P.length > n) P = P.slice(0, n);
      const r = rng(n * 31 + 5);
      while (P.length < n) P.push({ x: r(), y: r() });
      buildCoords();
      update();
    });
    const kF = numField(t('k (0 = auto)', 'k (0 = auto)'), 0, (v) => {
      kOverride = Math.round(v);
      update();
    }, { min: 0, max: 6, width: '3.6rem' });

    const anim = { id: 0 };
    controls.append(
      group(t('Points', 'Points'), nP.row, kF.row),
      group(
        t('Actions', 'Actions'),
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
        toggle(t('montrer les tiroirs', 'show the drawers'), true, (v) => ((showGrid = v), stage.redraw())),
      ),
      group(t('Coordonnées (x, y de 0 à 1)', 'Coordinates (x, y from 0 to 1)'), coordBox),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          const side = kOf();
          log.add([n, fmt(minDist(P).d, 4), fmt(Math.SQRT2 / side, 4), side]);
        }),
        button(t('Remplir (n = 2…12)', 'Fill (n = 2…12)'), () => {
          log.clear();
          for (let q = 12; q >= 2; q--) {
            const best = optimise(q, undefined, 40, 4000, 5);
            const d = minDist(best).d;
            const side = drawerSide(q);
            log.add([q, fmt(d, 4), fmt(Math.SQRT2 / side, 4), side], Math.abs(d - Math.SQRT2 / side) < 1e-3 ? 'ok' : undefined);
          }
        }),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    const box = () => {
      const s = Math.min(stage.w, stage.h) - 24;
      return { s, x0: (stage.w - s) / 2, y0: (stage.h - s) / 2 };
    };

    stage.setDraw((ctx, _w, _h, p) => {
      const { s, x0, y0 } = box();
      const k = kOf();
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
          ctx.fillStyle = 'rgba(214,54,43,0.2)';
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
      const { i, j } = minDist(P);
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

    buildCoords();
    update();
  },
};
