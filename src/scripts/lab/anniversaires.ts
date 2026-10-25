import { button, fmt, group, param, rng, type LabDef } from './core';

/**
 * Chapitre 3 — Principe des tiroirs.
 * n personnes, d jours possibles : quand deux personnes ont-elles le même anniversaire ?
 * Certain pour n > d (tiroirs), probable bien avant : seuil ≈ 1,18·√d.
 */

/** P(au moins une coïncidence) pour n personnes et d jours. */
function pCollision(n: number, d: number): number {
  if (n > d) return 1;
  let q = 1;
  for (let k = 0; k < n; k++) q *= 1 - k / d;
  return 1 - q;
}
/** Plus petit n tel que P ≥ 1/2. */
function halfPoint(d: number): number {
  let n = 1;
  while (n <= d && pCollision(n, d) < 0.5) n++;
  return n;
}

export const def: LabDef = {
  chapter: '03-principe-des-tiroirs',
  numero: 3,
  title: { fr: 'Le paradoxe des anniversaires', en: 'The birthday paradox' },
  statement: {
    fr: 'Dans une salle, $n$ personnes ont chacune un anniversaire parmi $d$ jours possibles ($d = 365$). Pour quelle valeur de $n$ la probabilité que <em>deux personnes au moins</em> aient le même anniversaire dépasse-t-elle $\\tfrac12$ ?',
    en: 'In a room, $n$ people each have a birthday among $d$ possible days ($d = 365$). For which $n$ does the probability that <em>at least two people</em> share a birthday exceed $\\tfrac12$?',
  },
  goal: {
    fr: 'Devine d’abord $n$, puis vérifie par simulation. Change $d$ : de quelle fonction de $d$ dépend le seuil $n_{1/2}$ ? (Compare à $\\sqrt d$.)',
    en: 'First guess $n$, then check by simulation. Change $d$: which function of $d$ does the threshold $n_{1/2}$ follow? (Compare with $\\sqrt d$.)',
  },
  steps: {
    fr: [
      'Au départ : <strong>$d = 365$ jours</strong> et <strong>$n = 23$ personnes</strong> (modifiables au curseur ou au clavier). Le calendrier du haut montre chaque jour de l’année.',
      '<strong>Tirer une classe</strong> : $n$ anniversaires au hasard. Un jour <span class="lab-ok">bleu</span> = une personne, <span class="lab-bad">rouge</span> = au moins deux personnes (coïncidence).',
      '<strong>Simuler</strong> beaucoup de classes (nombre d’essais modifiable) : la fréquence observée se compare à la probabilité exacte de la courbe du bas.',
      'Remplis le tableau pour plusieurs $d$ : compare le seuil $n_{1/2}$ avec $\\sqrt d$. Quelle constante trouves-tu ?',
    ],
    en: [
      'At the start: <strong>$d = 365$ days</strong> and <strong>$n = 23$ people</strong> (editable with slider or keyboard). The top calendar shows every day of the year.',
      '<strong>Draw a class</strong>: $n$ random birthdays. A <span class="lab-ok">blue</span> day = one person, <span class="lab-bad">red</span> = at least two people (a coincidence).',
      '<strong>Simulate</strong> many classes (the number of trials is editable): the observed frequency can be compared with the exact probability on the bottom curve.',
      'Fill the table for several $d$: compare the threshold $n_{1/2}$ with $\\sqrt d$. Which constant do you find?',
    ],
  },
  legend: [
    { color: '#2563eb', fr: 'un anniversaire ce jour-là', en: 'one birthday that day' },
    { color: '#d6362b', fr: 'au moins deux (coïncidence)', en: 'two or more (coincidence)' },
    { color: '#1d7a33', fr: 'probabilité exacte', en: 'exact probability' },
    { color: '#f59e0b', fr: 'fréquence simulée', en: 'simulated frequency' },
  ],
  hints: {
    fr: [
      'Si $n > d$, la coïncidence est <em>certaine</em> : c’est le principe des tiroirs. Que dit-il de plus ?',
      'Calcule la probabilité qu’il n’y ait <em>aucune</em> coïncidence : la 2ᵉ personne évite 1 jour, la 3ᵉ en évite 2… Écris le produit.',
      'Pour plusieurs $d$ (10, 50, 100, 365, 1000), calcule $n_{1/2} / \\sqrt d$. Cette valeur est presque constante : laquelle ?',
    ],
    en: [
      'If $n > d$, a coincidence is <em>certain</em>: that is the pigeonhole principle. What more does it say?',
      'Compute the probability of <em>no</em> coincidence: the 2nd person avoids 1 day, the 3rd avoids 2… Write the product.',
      'For several $d$ (10, 50, 100, 365, 1000), compute $n_{1/2} / \\sqrt d$. It is almost constant: which value?',
    ],
  },
  general: {
    fr: '<p><strong>Probabilité exacte.</strong> $P(n) = 1 - \\prod_{k=0}^{n-1}\\left(1 - \\dfrac{k}{d}\\right) = 1 - \\dfrac{d!}{(d-n)!\\,d^n}$. Avec $1 - x \\le e^{-x}$ : $P(n) \\approx 1 - e^{-n(n-1)/(2d)}$.</p><p>Le seuil $P = \\tfrac12$ est donc $n_{1/2} \\approx \\sqrt{2 \\ln 2}\\,\\sqrt d \\approx 1{,}18\\sqrt d$ : pour $d = 365$ on trouve $n = 23$. Le principe des tiroirs ne garantit la coïncidence qu’à partir de $n = d + 1 = 366$ ; le hasard la rend <em>probable</em> bien avant.</p>',
    en: '<p><strong>Exact probability.</strong> $P(n) = 1 - \\prod_{k=0}^{n-1}\\left(1 - \\dfrac{k}{d}\\right) = 1 - \\dfrac{d!}{(d-n)!\\,d^n}$. With $1 - x \\le e^{-x}$: $P(n) \\approx 1 - e^{-n(n-1)/(2d)}$.</p><p>The threshold $P = \\tfrac12$ is thus $n_{1/2} \\approx \\sqrt{2 \\ln 2}\\,\\sqrt d \\approx 1.18\\sqrt d$: for $d = 365$ we get $n = 23$. The pigeonhole principle only guarantees a coincidence from $n = d + 1 = 366$; chance makes it <em>likely</em> much sooner.</p>',
  },
  aspect: 0.95,
  logEmpty: { fr: 'Appuie sur « Noter » ou « Remplir le tableau ».', en: 'Press “Record” or “Fill the table”.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let d = 365;
    let n = 23;
    let trials = 2000;
    let sample: number[] = [];
    let simFreq: number | null = null;
    log.setColumns(['d', 'n', t('P exacte', 'exact P'), t('simulée', 'simulated'), t('n_½', 'n_½')]);

    const draw1 = () => {
      const r = rng(Math.floor(Math.random() * 1e9));
      sample = Array.from({ length: n }, () => Math.floor(r() * d));
      update();
    };
    const simulate = () => {
      const r = rng(Math.floor(Math.random() * 1e9));
      let hit = 0;
      for (let k = 0; k < trials; k++) {
        const seen = new Uint8Array(d);
        let col = false;
        for (let i = 0; i < n; i++) {
          const day = Math.floor(r() * d);
          if (seen[day]) {
            col = true;
            break;
          }
          seen[day] = 1;
        }
        if (col) hit++;
      }
      simFreq = hit / trials;
      update();
    };

    const update = () => {
      const p = pCollision(n, d);
      const counts = new Map<number, number>();
      sample.forEach((day) => counts.set(day, (counts.get(day) ?? 0) + 1));
      const coincidences = [...counts.values()].filter((c) => c > 1).length;
      api.say(
        `<div class="lab-big">$P(n = ${n},\\ d = ${d})$ = <strong>${fmt(p * 100, 2)} %</strong>` +
          (simFreq !== null ? ` · ${t('simulée', 'simulated')} : <strong>${fmt(simFreq * 100, 2)} %</strong> (${trials} ${t('classes', 'classes')})` : '') +
          '</div>' +
          (sample.length
            ? `<div>${t('Classe tirée', 'Drawn class')} : ${coincidences ? `<span class="lab-bad">${coincidences} ${t('jour(s) avec coïncidence', 'day(s) with a coincidence')}</span>` : `<span class="lab-ok">${t('aucune coïncidence', 'no coincidence')}</span>`}</div>`
            : ''),
      );
      const half = halfPoint(d);
      const terms = Array.from({ length: Math.min(n, 6) }, (_, k) => `(1 - \\tfrac{${k}}{${d}})`).join('\\,');
      api.calc(
        `<p>${t('Probabilité qu’il n’y ait <em>aucune</em> coïncidence', 'Probability of <em>no</em> coincidence')} : $q = \\prod_{k=0}^{n-1}(1 - \\tfrac kd) = ${terms}${n > 6 ? '\\cdots' : ''} = ${fmt(1 - p, 6)}$</p>` +
          `<p>$P = 1 - q = ${fmt(p, 6)}$ ${n > d ? t('(n > d : tiroirs, certain)', '(n > d: pigeonhole, certain)') : ''}</p>` +
          `<p>${t('Seuil', 'Threshold')} : $n_{1/2} = ${half}$ ; $\\sqrt{2\\ln 2}\\,\\sqrt d = ${fmt(1.1774 * Math.sqrt(d), 2)}$ ; ${t('rapport', 'ratio')} $n_{1/2}/\\sqrt d = ${fmt(half / Math.sqrt(d), 3)}$.</p>` +
          `<p>${t('Approximation', 'Approximation')} : $1 - e^{-n(n-1)/(2d)} = ${fmt(1 - Math.exp((-n * (n - 1)) / (2 * d)), 5)}$.</p>`,
      );
      stage.redraw();
    };

    const dP = param(t('jours d', 'days d'), 2, 1000, d, 1, (v) => {
      d = v;
      sample = [];
      simFreq = null;
      update();
    });
    const nP = param(t('personnes n', 'people n'), 2, 100, n, 1, (v) => {
      n = v;
      sample = [];
      simFreq = null;
      update();
    });
    const tP = param(t('essais', 'trials'), 100, 20000, trials, 100, (v) => ((trials = v), (simFreq = null), update()));

    controls.append(
      group(t('Paramètres', 'Parameters'), dP.row, nP.row, tP.row),
      group(
        t('Expériences', 'Experiments'),
        button(t('Tirer une classe', 'Draw a class'), draw1, 'primary'),
        button(t('Simuler', 'Simulate'), simulate),
      ),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => log.add([d, n, fmt(pCollision(n, d), 4), simFreq !== null ? fmt(simFreq, 4) : '—', halfPoint(d)], pCollision(n, d) >= 0.5 ? 'ok' : undefined)),
        button(t('Remplir (d = 10…1000)', 'Fill (d = 10…1000)'), () => {
          log.clear();
          for (const dd of [1000, 500, 365, 200, 100, 50, 20, 10]) {
            const nh = halfPoint(dd);
            log.add([dd, nh, fmt(pCollision(nh, dd), 4), '—', `${nh} (${fmt(nh / Math.sqrt(dd), 2)}√d)`]);
          }
        }),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    stage.setDraw((ctx, w, h, p) => {
      const top = h * 0.46;
      // calendrier
      const cols = Math.max(10, Math.ceil(Math.sqrt((d * w) / top)));
      const rows = Math.ceil(d / cols);
      const cw = (w - 8) / cols;
      const ch = Math.min(cw, (top - 8) / rows);
      const counts = new Map<number, number>();
      sample.forEach((day) => counts.set(day, (counts.get(day) ?? 0) + 1));
      for (let k = 0; k < d; k++) {
        const x = 4 + (k % cols) * cw;
        const y = 4 + Math.floor(k / cols) * ch;
        const c = counts.get(k) ?? 0;
        ctx.fillStyle = c >= 2 ? '#d6362b' : c === 1 ? '#2563eb' : p.line;
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(1, cw - 1.5), Math.max(1, ch - 1.5));
      }
      ctx.fillStyle = p.muted;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(t(`calendrier : ${d} jours`, `calendar: ${d} days`), 6, top + 4);
      // courbe P(n)
      const px0 = 38;
      const px1 = w - 10;
      const py0 = h - 22;
      const py1 = top + 24;
      const maxN = Math.min(d + 1, Math.max(10, Math.ceil(3.2 * Math.sqrt(d)), n + 5));
      const X = (k: number) => px0 + (k / maxN) * (px1 - px0);
      const Y = (v: number) => py0 - v * (py0 - py1);
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 1;
      [0, 0.5, 1].forEach((v) => {
        ctx.beginPath();
        ctx.moveTo(px0, Y(v));
        ctx.lineTo(px1, Y(v));
        ctx.stroke();
        ctx.fillStyle = p.muted;
        ctx.textAlign = 'right';
        ctx.fillText(`${v * 100}%`, px0 - 4, Y(v) + 4);
      });
      ctx.strokeStyle = '#1d7a33';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let k = 1; k <= maxN; k++) (k === 1 ? ctx.moveTo : ctx.lineTo).call(ctx, X(k), Y(pCollision(k, d)));
      ctx.stroke();
      // repères
      const half = halfPoint(d);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = p.muted;
      ctx.beginPath();
      ctx.moveTo(X(half), Y(0));
      ctx.lineTo(X(half), Y(0.5));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = p.muted;
      ctx.textAlign = 'center';
      ctx.fillText(`n½=${half}`, X(half), py0 + 14);
      // n courant
      const pc = pCollision(n, d);
      ctx.fillStyle = '#1d7a33';
      ctx.beginPath();
      ctx.arc(X(Math.min(n, maxN)), Y(pc), 6, 0, Math.PI * 2);
      ctx.fill();
      if (simFreq !== null) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(X(Math.min(n, maxN)), Y(simFreq), 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = p.muted;
      ctx.textAlign = 'right';
      ctx.fillText('n →', px1, py0 + 14);
    });

    update();
  },
};
