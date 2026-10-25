import { button, gcd, group, numField, param, toggle, type LabDef } from './core';

/**
 * Chapitre 5 — Théorie des nombres.
 * Payer avec des pièces de valeurs a et b : quelles sommes sont possibles ?
 * Plus grande somme impossible = ab − a − b (a, b premiers entre eux).
 */

export const def: LabDef = {
  chapter: '05-theorie-des-nombres',
  numero: 5,
  title: { fr: 'Payer avec deux pièces', en: 'Paying with two coins' },
  statement: {
    fr: 'Un distributeur n’a que des pièces de $a$ ariary et de $b$ ariary, en quantité illimitée. Quelles sommes peut-on payer <em>exactement</em> ? Existe-t-il une plus grande somme impossible ?',
    en: 'A machine only has coins worth $a$ and $b$, in unlimited quantity. Which amounts can be paid <em>exactly</em>? Is there a largest impossible amount?',
  },
  goal: {
    fr: 'Pour plusieurs couples $(a, b)$, relève la plus grande somme impossible et le nombre de sommes impossibles. Conjecture des formules en $a$ et $b$. Que se passe-t-il si $a$ et $b$ ont un diviseur commun ?',
    en: 'For several pairs $(a, b)$, record the largest impossible amount and the number of impossible amounts. Conjecture formulas in $a$ and $b$. What happens if $a$ and $b$ share a divisor?',
  },
  steps: {
    fr: [
      'Au départ : pièces de <strong>$a = 5$</strong> et <strong>$b = 7$</strong>, sommes de $0$ à $60$ (valeurs modifiables ; une 3ᵉ pièce $c$ est possible, $0$ = absente).',
      'Chaque case est une somme : <strong>verte</strong> = payable, <strong>rouge</strong> = impossible. Clique une case : le panneau « Comment c’est calculé » donne le paiement (ou prouve l’impossibilité).',
      'Lis la <strong>plus grande somme impossible</strong> et le <strong>nombre de sommes impossibles</strong> sous la grille ; compare-les aux formules du panneau.',
      'Change $a$ et $b$ (premiers entre eux ou non) et note les cas. Active « pièces minimales » pour voir aussi le plus petit nombre de pièces à utiliser.',
    ],
    en: [
      'At the start: coins of <strong>$a = 5$</strong> and <strong>$b = 7$</strong>, amounts from $0$ to $60$ (editable; a 3rd coin $c$ is possible, $0$ = absent).',
      'Each cell is an amount: <strong>green</strong> = payable, <strong>red</strong> = impossible. Click a cell: the “How it is computed” panel gives the payment (or proves impossibility).',
      'Read the <strong>largest impossible amount</strong> and the <strong>number of impossible amounts</strong> under the grid; compare with the formulas in the panel.',
      'Change $a$ and $b$ (coprime or not) and record cases. Switch on “minimum coins” to also see the fewest coins needed.',
    ],
  },
  legend: [
    { color: '#1d9a45', fr: 'somme payable', en: 'payable amount' },
    { color: '#d6362b', fr: 'somme impossible', en: 'impossible amount' },
    { color: '#f59e0b', fr: 'plus grande somme impossible', en: 'largest impossible amount' },
  ],
  hints: {
    fr: [
      'Essaie $(a, b) = (3, 5)$, $(4, 7)$, $(5, 7)$, $(5, 8)$ : note la plus grande somme impossible. Cherche une formule en $a$ et $b$.',
      'Compare avec $a\\,b - a - b$. Et le nombre de sommes impossibles avec $\\frac{(a-1)(b-1)}{2}$.',
      'Pour $(a, b) = (4, 6)$ ou $(6, 9)$ : que dire des sommes impossibles ? Quel rôle joue $\\gcd(a, b)$ ?',
    ],
    en: [
      'Try $(a, b) = (3, 5)$, $(4, 7)$, $(5, 7)$, $(5, 8)$: record the largest impossible amount. Look for a formula in $a$ and $b$.',
      'Compare with $a\\,b - a - b$. And the number of impossible amounts with $\\frac{(a-1)(b-1)}{2}$.',
      'For $(a, b) = (4, 6)$ or $(6, 9)$: what about impossible amounts? What role does $\\gcd(a, b)$ play?',
    ],
  },
  general: {
    fr: '<p><strong>Problème de Frobenius (deux pièces).</strong> Si $\\gcd(a, b) = 1$, la plus grande somme impossible est $g(a, b) = ab - a - b$, et il y a exactement $\\dfrac{(a-1)(b-1)}{2}$ sommes impossibles. De plus, pour tout $x$, exactement l’un de $x$ et $g - x$ est payable : les sommes impossibles se répartissent symétriquement.</p><p>Si $d = \\gcd(a, b) > 1$, seuls les multiples de $d$ sont payables : il y a une infinité de sommes impossibles. Pour 3 pièces ou plus, il n’y a plus de formule fermée simple.</p>',
    en: '<p><strong>Frobenius problem (two coins).</strong> If $\\gcd(a, b) = 1$, the largest impossible amount is $g(a, b) = ab - a - b$, and there are exactly $\\dfrac{(a-1)(b-1)}{2}$ impossible amounts. Moreover, for every $x$, exactly one of $x$ and $g - x$ is payable: impossible amounts are symmetric.</p><p>If $d = \\gcd(a, b) > 1$, only multiples of $d$ are payable: there are infinitely many impossible amounts. For 3 or more coins there is no simple closed formula.</p>',
  },
  aspect: 0.55,
  logEmpty: { fr: 'Note quelques couples de pièces.', en: 'Record a few pairs of coins.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let A = 5;
    let B = 7;
    let C = 0;
    let N = 60;
    let showMin = false;
    let sel = -1;
    log.setColumns(['(a,b,c)', 'pgcd', t('plus grande impossible', 'largest impossible'), t('nb impossibles', '# impossible'), 'ab−a−b']);

    const coins = () => [A, B, C].filter((c) => c > 0);
    const compute = () => {
      const cs = coins();
      const reach = new Array<boolean>(N + 1).fill(false);
      const minc = new Array<number>(N + 1).fill(Infinity);
      reach[0] = true;
      minc[0] = 0;
      for (let x = 1; x <= N; x++)
        for (const c of cs)
          if (x >= c && reach[x - c]) {
            reach[x] = true;
            minc[x] = Math.min(minc[x], minc[x - c] + 1);
          }
      return { reach, minc };
    };
    let state = compute();

    const analyse = () => {
      state = compute();
      const cs = coins();
      const g = cs.reduce((x, c) => gcd(x, c), 0);
      const imp: number[] = [];
      state.reach.forEach((r, x) => !r && imp.push(x));
      const largest = imp.length ? imp[imp.length - 1] : -1;
      const frob = cs.length === 2 && gcd(cs[0], cs[1]) === 1 ? cs[0] * cs[1] - cs[0] - cs[1] : null;
      const cnt = cs.length === 2 && gcd(cs[0], cs[1]) === 1 ? ((cs[0] - 1) * (cs[1] - 1)) / 2 : null;
      api.say(
        `<div class="lab-big">${t('Plus grande somme impossible', 'Largest impossible amount')} (≤ ${N}) : <strong>${largest >= 0 ? largest : '—'}</strong> · ${t('nombre de sommes impossibles', 'number of impossible amounts')} : <strong>${imp.length}</strong></div>` +
          (g > 1 ? `<div class="lab-note">${t(`Les pièces ont le diviseur commun ${g} : seuls les multiples de ${g} sont payables, donc il y a une infinité de sommes impossibles.`, `The coins share the divisor ${g}: only multiples of ${g} are payable, so infinitely many amounts are impossible.`)}</div>` : '') +
          (frob !== null && g === 1 ? `<div>$ab - a - b = ${A}\\cdot${B} - ${A} - ${B} = ${frob}$ ${largest === frob ? '<span class="lab-ok">✔ ' + t('égale la plus grande impossible', 'equals the largest impossible') + '</span>' : '<span class="lab-muted">(' + t('plage trop courte ?', 'range too short?') + ')</span>'} · $\\tfrac{(a-1)(b-1)}{2} = ${cnt}$ ${imp.length === cnt ? '<span class="lab-ok">✔</span>' : ''}</div>` : ''),
      );
      showDetail(sel >= 0 ? sel : largest >= 0 ? largest : 0);
      stage.relayout();
      return { g, largest, count: imp.length, frob };
    };

    const showDetail = (x: number) => {
      sel = x;
      const cs = coins();
      let body: string;
      if (state.reach[x]) {
        // une décomposition : a·i + b·j (+ c·k)
        let found = '';
        const [c1, c2, c3] = cs;
        const fmtSol = (i: number, j: number, k: number) =>
          `${i}\\times ${c1}` + (c2 ? ` + ${j}\\times ${c2}` : '') + (c3 ? ` + ${k}\\times ${c3}` : '');
        outer: for (let i = 0; i <= Math.floor(x / c1); i++) {
          const r1 = x - i * c1;
          if (!c2) {
            if (r1 === 0) {
              found = fmtSol(i, 0, 0);
              break;
            }
            continue;
          }
          for (let j = 0; j <= Math.floor(r1 / c2); j++) {
            const r2 = r1 - j * c2;
            if (!c3) {
              if (r2 === 0) {
                found = fmtSol(i, j, 0);
                break outer;
              }
            } else if (r2 % c3 === 0) {
              found = fmtSol(i, j, r2 / c3);
              break outer;
            }
          }
        }
        body = `<p class="lab-ok">$${x} = ${found}$ ${t('est payable', 'is payable')} (${t('minimum', 'minimum')} ${state.minc[x]} ${t('pièce(s)', 'coin(s)')}).</p>`;
      } else {
        body = `<p class="lab-bad">${x} ${t('n’est pas payable', 'cannot be paid')} : ${cs.map((c) => `${x} − ${c} = ${x - c}${x - c < 0 ? ' < 0' : x - c >= 0 && !state.reach[x - c] ? ` (${t('lui-même impossible', 'itself impossible')})` : ''}`).join(' ; ')}.</p>`;
      }
      api.calc(
        `<p>${t('Règle de calcul (programmation dynamique)', 'Computation rule (dynamic programming)')} : $x$ ${t('est payable ⇔', 'is payable ⇔')} $x = 0$ ${t('ou', 'or')} $x - a$, $x - b$ ${cs.length > 2 ? '$, x - c$ ' : ''}${t('est payable (et ≥ 0).', 'is payable (and ≥ 0).')}</p>` +
          `<p>${t('Somme choisie', 'Chosen amount')} : <strong>${x}</strong></p>` +
          body +
          `<p>$\\gcd = ${cs.reduce((g, c) => gcd(g, c), 0)}$.</p>`,
      );
      stage.redraw();
    };

    const aF = param('a', 2, 30, A, 1, (v) => ((A = v), (sel = -1), analyse()));
    const bF = param('b', 2, 30, B, 1, (v) => ((B = v), (sel = -1), analyse()));
    const cF = param(t('c (0 = aucune)', 'c (0 = none)'), 0, 30, C, 1, (v) => ((C = v), (sel = -1), analyse()));
    const nF = numField(t('somme max', 'max amount'), N, (v) => ((N = Math.round(v)), (sel = -1), analyse()), { min: 10, max: 300, width: '4.8rem' });

    controls.append(
      group(t('Pièces', 'Coins'), aF.row, bF.row, cF.row, nF.row),
      group(
        t('Affichage', 'Display'),
        toggle(t('pièces minimales', 'minimum coins'), false, (v) => ((showMin = v), stage.redraw())),
      ),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          const r = analyse();
          log.add([`(${A},${B},${C || '–'})`, r.g, r.largest >= 0 ? r.largest : '—', r.count, r.frob ?? '—'], r.frob !== null && r.frob === r.largest ? 'ok' : r.g > 1 ? 'bad' : undefined);
        }, 'primary'),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    const layout = () => {
      const size = stage.w < 440 ? 34 : 40;
      const cols = Math.max(1, Math.floor((stage.w - 8) / (size + 3)));
      const rows = Math.ceil((N + 1) / cols);
      return { size, cols, rows };
    };
    stage.heightFn = () => {
      const { size, rows } = layout();
      return rows * (size + 3) + 8;
    };
    stage.setDraw((ctx, _w, _h, p) => {
      const { size, cols } = layout();
      const imp = state.reach.map((r, x) => (!r ? x : -1)).filter((x) => x >= 0);
      const largest = imp.length ? imp[imp.length - 1] : -1;
      for (let x = 0; x <= N; x++) {
        const cx = 4 + (x % cols) * (size + 3);
        const cy = 4 + Math.floor(x / cols) * (size + 3);
        ctx.fillStyle = state.reach[x] ? '#1d9a45' : '#d6362b';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(cx, cy, size, size);
        ctx.globalAlpha = 1;
        if (x === largest) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4;
          ctx.strokeRect(cx + 1, cy + 1, size - 2, size - 2);
        }
        if (x === sel) {
          ctx.strokeStyle = p.ink;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(cx - 1, cy - 1, size + 2, size + 2);
        }
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${size > 36 ? 14 : 12}px system-ui, sans-serif`;
        ctx.fillText(String(x), cx + size / 2, cy + size / 2 - (showMin && state.reach[x] ? 5 : 0));
        if (showMin && state.reach[x]) {
          ctx.font = '600 10px system-ui, sans-serif';
          ctx.fillText(`×${state.minc[x]}`, cx + size / 2, cy + size - 9);
        }
      }
    });
    stage.cv.style.cursor = 'pointer';
    stage.cv.addEventListener('pointerdown', (e) => {
      const r = stage.cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * stage.w;
      const y = ((e.clientY - r.top) / r.height) * stage.h;
      const { size, cols } = layout();
      const col = Math.floor((x - 4) / (size + 3));
      const row = Math.floor((y - 4) / (size + 3));
      const i = row * cols + col;
      if (col >= 0 && col < cols && i >= 0 && i <= N) showDetail(i);
    });

    analyse();
  },
};
