import { button, el, group, param, toggle, type LabDef } from './core';

/**
 * Chapitre 7 — Invariants.
 * Taquin N×N : quelles positions sont atteignables ? La parité de Q = I (N impair)
 * ou I + r (N pair) ne change jamais pendant un coup légal.
 */

const inversionPairs = (tiles: number[]) => {
  const t = tiles.filter((v) => v !== 0);
  const out: [number, number][] = [];
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[i] > t[j]) out.push([t[i], t[j]]);
  return out;
};
const invariant = (tiles: number[], N: number) => {
  const I = inversionPairs(tiles).length;
  const row = Math.floor(tiles.indexOf(0) / N);
  return N % 2 === 1 ? I % 2 : (I + row) % 2;
};

export const def: LabDef = {
  chapter: '07-invariants',
  numero: 7,
  title: { fr: 'Le taquin et sa quantité invariante', en: 'The sliding puzzle and its invariant' },
  statement: {
    fr: 'Dans un taquin, on glisse une tuile voisine dans la case vide. À partir de la position « rangée », quelles positions peut-on atteindre ? Y a-t-il une propriété qui ne change <em>jamais</em> ?',
    en: 'In a sliding puzzle you slide a neighbouring tile into the empty square. Starting from the “solved” position, which positions can be reached? Is there a property that <em>never</em> changes?',
  },
  goal: {
    fr: 'Joue, mélange avec des coups légaux, et surveille les nombres affichés (inversions, ligne du vide). Relève le défi « atteignable ? » et cherche la règle qui décide à coup sûr.',
    en: 'Play, scramble with legal moves, and watch the displayed numbers (inversions, blank row). Take the “reachable?” challenge and look for the rule that always decides.',
  },
  steps: {
    fr: [
      'Au départ : un taquin <strong>$3 \\times 3$</strong> rangé. <strong>Clique une tuile</strong> voisine de la case vide pour la glisser ; tu peux aussi changer la taille $N$ (2 à 5).',
      'Sous le plateau : le nombre d’<strong>inversions</strong> $I$ (paires de tuiles dans le « mauvais » ordre de lecture), la <strong>ligne du vide</strong> $r$ et le nombre de coups. Regarde la bande des valeurs de $Q$ après chaque coup.',
      '<strong>Défi</strong> : le plateau est tiré au hasard (atteignable ou non, 1 chance sur 2). Réponds <em>Oui</em> ou <em>Non</em> ; le panneau « Comment c’est calculé » donne les inversions et la règle.',
      'Tu peux aussi <strong>saisir ta propre position</strong> (champ « position », tuiles séparées par des espaces, 0 = vide) ou <em>échanger deux tuiles</em> pour fabriquer une position impossible.',
    ],
    en: [
      'At the start: a solved <strong>$3 \\times 3$</strong> puzzle. <strong>Click a tile</strong> next to the blank to slide it; you can also change the size $N$ (2 to 5).',
      'Under the board: the number of <strong>inversions</strong> $I$ (pairs of tiles in the “wrong” reading order), the <strong>blank row</strong> $r$ and the number of moves. Watch the strip of $Q$ values after each move.',
      '<strong>Challenge</strong>: the board is drawn at random (reachable or not, 1 chance in 2). Answer <em>Yes</em> or <em>No</em>; the “How it is computed” panel gives the inversions and the rule.',
      'You can also <strong>type your own position</strong> (“position” field, tiles separated by spaces, 0 = blank) or <em>swap two tiles</em> to build an impossible position.',
    ],
  },
  legend: [
    { color: '#e6f3e9', fr: 'tuile à sa place', en: 'tile in place' },
    { color: '#ffffff', fr: 'tuile ailleurs', en: 'tile elsewhere' },
    { color: '#9ca3af', fr: 'case vide', en: 'blank square' },
  ],
  hints: {
    fr: [
      'Une <em>inversion</em> est un couple de tuiles $(a, b)$ avec $a > b$ mais $a$ avant $b$ en lisant ligne par ligne. Compte-les après chaque coup.',
      'Pour le $3 \\times 3$ : un coup horizontal ne change pas l’ordre de lecture ; un coup vertical déplace une tuile au-dessus de deux autres. Comment varie $I$ ?',
      'Pour le $4 \\times 4$, la ligne du vide entre en jeu : cherche la quantité $I + r \\pmod 2$ où $r$ est la ligne du vide (la première ligne est $0$).',
    ],
    en: [
      'An <em>inversion</em> is a pair of tiles $(a, b)$ with $a > b$ but $a$ before $b$ reading row by row. Count them after each move.',
      'For the $3 \\times 3$: a horizontal move does not change the reading order; a vertical move jumps a tile over two others. How does $I$ change?',
      'For the $4 \\times 4$ the blank row matters: look for the quantity $I + r \\pmod 2$ where $r$ is the blank’s row (the first row is $0$).',
    ],
  },
  general: {
    fr: '<p><strong>Invariant du taquin.</strong> Soit $I$ le nombre d’inversions (sans compter le vide). Pour un taquin $N \\times N$ avec $N$ impair, $I \\bmod 2$ ne change jamais ; avec $N$ pair, c’est $(I + r) \\bmod 2$, $r$ étant la ligne du vide. Donc <em>exactement la moitié</em> des $(N^2)!$ positions sont atteignables.</p><p>Échanger deux tuiles change la parité de $I$ : la position obtenue est <strong>inatteignable</strong>. C’est la preuve classique que le célèbre « 14-15 » de Sam Loyd est impossible.</p>',
    en: '<p><strong>Sliding-puzzle invariant.</strong> Let $I$ be the number of inversions (not counting the blank). For an $N \\times N$ puzzle with $N$ odd, $I \\bmod 2$ never changes; for $N$ even it is $(I + r) \\bmod 2$, with $r$ the blank’s row. Hence <em>exactly half</em> of the $(N^2)!$ positions are reachable.</p><p>Swapping two tiles flips the parity of $I$: the resulting position is <strong>unreachable</strong>. This is the classical proof that Sam Loyd’s famous “14-15” puzzle is impossible.</p>',
  },
  aspect: 0.86,
  logEmpty: { fr: 'Joue au défi « atteignable ? » : chaque réponse est notée ici.', en: 'Play the “reachable?” challenge: each answer is recorded here.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let N = 3;
    let tiles: number[] = [];
    let showInv = false;
    let swapMode = false;
    let swapFirst = -1;
    let challenge: { reachable: boolean } | null = null;
    let streak = 0;
    let moves = 0;
    let qHistory: number[] = [];
    log.setColumns([t('N', 'N'), 'I', t('ligne vide', 'blank row'), 'Q', t('réponse', 'answer')]);

    const solved = () => Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N));
    const neighbours = (z: number) => {
      const r = Math.floor(z / N);
      const c = z % N;
      const out: number[] = [];
      if (r > 0) out.push(z - N);
      if (r < N - 1) out.push(z + N);
      if (c > 0) out.push(z - 1);
      if (c < N - 1) out.push(z + 1);
      return out;
    };
    const move = (idx: number) => {
      const z = tiles.indexOf(0);
      if (!neighbours(z).includes(idx)) return false;
      [tiles[z], tiles[idx]] = [tiles[idx], tiles[z]];
      moves++;
      qHistory.push(invariant(tiles, N));
      return true;
    };
    const scramble = (k = 120) => {
      let last = -1;
      for (let i = 0; i < k; i++) {
        const z = tiles.indexOf(0);
        const opts = neighbours(z).filter((x) => x !== last);
        const pick = opts[Math.floor(Math.random() * opts.length)];
        last = z;
        move(pick);
      }
    };

    const update = () => {
      const pairs = inversionPairs(tiles);
      const I = pairs.length;
      const row = Math.floor(tiles.indexOf(0) / N);
      const Q = invariant(tiles, N);
      const Q0 = invariant(solved(), N);
      const sorted = tiles.every((v, i) => v === (i + 1) % (N * N));
      api.say(
        `<div class="lab-big">${t('Inversions', 'Inversions')} $I$ = <strong>${I}</strong> · ${t('ligne du vide', 'blank row')} $r$ = <strong>${row}</strong> · ${t('coups', 'moves')} : ${moves}</div>` +
          (showInv
            ? `<div>${N % 2 ? `$I \\bmod 2$` : `$(I + r) \\bmod 2$`} = <strong>${Q}</strong> · ${t('valeur pour la position rangée', 'value for the solved position')} : <strong>${Q0}</strong> ${Q === Q0 ? '<span class="lab-ok">⇒ ' + t('atteignable', 'reachable') + '</span>' : '<span class="lab-bad">⇒ ' + t('inatteignable', 'unreachable') + '</span>'}</div>` +
              (qHistory.length ? `<div class="lab-muted">Q : ${qHistory.slice(-40).join(' ')}</div>` : '')
            : `<div class="lab-muted">${t('Quantité invariante cachée : cherche-la ! (bouton « Montrer la quantité »)', 'Invariant hidden: find it! (button “Show the quantity”)')}</div>`) +
          (sorted ? `<div class="lab-ok">✔ ${t('Position rangée', 'Solved position')}</div>` : ''),
      );
      api.calc(
        `<p>${t('Liste de lecture (ligne par ligne, sans le vide)', 'Reading list (row by row, blank excluded)')} : ${tiles.filter((v) => v).join(' ')}</p>` +
          `<p>${t('Inversions', 'Inversions')} ($a$ ${t('avant', 'before')} $b$ ${t('mais', 'but')} $a > b$) : ${pairs.slice(0, 24).map(([a, b]) => `(${a},${b})`).join(' ') || t('aucune', 'none')}${pairs.length > 24 ? ' …' : ''} ⇒ $I = ${I}$.</p>` +
          `<p>${N % 2 ? `$N = ${N}$ ${t('impair', 'odd')} : $Q = I \\bmod 2 = ${I % 2}$.` : `$N = ${N}$ ${t('pair', 'even')} : $Q = (I + r) \\bmod 2 = (${I} + ${row}) \\bmod 2 = ${(I + row) % 2}$.`}</p>` +
          `<p>${t('Un coup légal ne change pas', 'A legal move never changes')} $Q$ ; ${t('la position rangée a', 'the solved position has')} $Q = ${Q0}$.</p>`,
      );
      stage.redraw();
    };

    const reset = (size = N) => {
      N = size;
      tiles = solved();
      moves = 0;
      challenge = null;
      swapFirst = -1;
      qHistory = [];
      update();
    };

    const nP = param('N', 2, 5, N, 1, (v) => reset(v));
    const posInput = el('input', { type: 'text', class: 'lab-text', placeholder: t('ex. 1 2 3 4 5 6 8 7 0', 'e.g. 1 2 3 4 5 6 8 7 0'), 'aria-label': t('position', 'position') }) as HTMLInputElement;
    const applyPos = () => {
      const nums = posInput.value.trim().split(/[\s,;]+/).map(Number);
      const ok = nums.length === N * N && [...nums].sort((a, b) => a - b).every((v, i) => v === i) && nums.every(Number.isInteger);
      if (!ok) {
        api.say(`<div class="lab-bad">${t(`Saisis les nombres 0 à ${N * N - 1} une seule fois chacun (0 = case vide).`, `Enter the numbers 0 to ${N * N - 1} exactly once each (0 = blank).`)}</div>`);
        return;
      }
      tiles = nums;
      moves = 0;
      challenge = null;
      qHistory = [];
      update();
    };

    const makeChallenge = () => {
      tiles = solved();
      moves = 0;
      qHistory = [];
      scramble(150);
      moves = 0;
      qHistory = [];
      const reachable = Math.random() < 0.5;
      if (!reachable) {
        const idx = tiles.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
        const a = idx[Math.floor(Math.random() * idx.length)];
        let b = a;
        while (b === a) b = idx[Math.floor(Math.random() * idx.length)];
        [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
      }
      challenge = { reachable };
      update();
      api.readout.insertAdjacentHTML('beforeend', `<div class="lab-note">${t('Cette position peut-elle être obtenue depuis la position rangée par des coups légaux ?', 'Can this position be obtained from the solved one by legal moves?')}</div>`);
    };
    const answer = (guess: boolean) => {
      if (!challenge) return;
      const ok = guess === challenge.reachable;
      streak = ok ? streak + 1 : 0;
      const I = inversionPairs(tiles).length;
      const row = Math.floor(tiles.indexOf(0) / N);
      log.add([`${N}×${N}`, I, row, invariant(tiles, N), `${guess ? t('oui', 'yes') : t('non', 'no')} ${ok ? '✔' : '✘'}`], ok ? 'ok' : 'bad');
      const was = challenge.reachable;
      update();
      api.readout.insertAdjacentHTML(
        'beforeend',
        `<div class="${ok ? 'lab-ok' : 'lab-bad'}">${ok ? '✔' : '✘'} ${t('En réalité', 'In fact')} : ${was ? t('atteignable', 'reachable') : t('inatteignable', 'unreachable')} · ${t('série', 'streak')} ${streak}</div>`,
      );
      challenge = null;
    };

    controls.append(
      group(
        t('Plateau', 'Board'),
        nP.row,
        button(t('Mélanger (coups légaux)', 'Scramble (legal moves)'), () => {
          scramble();
          moves = 0;
          challenge = null;
          update();
        }, 'primary'),
        button(t('Remettre en ordre', 'Reset'), () => reset()),
        toggle(t('échanger 2 tuiles au clic', 'swap 2 tiles on click'), false, (v) => ((swapMode = v), (swapFirst = -1), stage.redraw())),
      ),
      group(t('Ma position', 'My position'), posInput, button(t('Appliquer', 'Apply'), applyPos)),
      group(
        t('Défi : atteignable ?', 'Challenge: reachable?'),
        button(t('Nouveau défi', 'New challenge'), makeChallenge, 'primary'),
        button(t('Oui', 'Yes'), () => answer(true)),
        button(t('Non', 'No'), () => answer(false)),
        button(t('Montrer / cacher la quantité', 'Show / hide the quantity'), () => ((showInv = !showInv), update())),
      ),
    );

    const geom = () => {
      const s = Math.min(stage.w, stage.h) - 16;
      return { s, x0: (stage.w - s) / 2, y0: (stage.h - s) / 2, cell: s / N };
    };

    stage.setDraw((ctx, _w, _h, p) => {
      const { x0, y0, cell } = geom();
      ctx.font = `700 ${Math.round(cell * 0.4)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      tiles.forEach((v, i) => {
        const x = x0 + (i % N) * cell;
        const y = y0 + Math.floor(i / N) * cell;
        if (!v) {
          ctx.fillStyle = 'rgba(127,127,127,0.18)';
          ctx.fillRect(x + 4, y + 4, cell - 8, cell - 8);
          return;
        }
        const home = (v - 1) % (N * N) === i;
        ctx.fillStyle = home ? p.soft : p.surface;
        ctx.strokeStyle = swapMode && swapFirst === i ? p.accent : home ? p.primary : p.ink;
        ctx.lineWidth = swapMode && swapFirst === i ? 4 : 2;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, cell - 8, cell - 8, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = p.ink;
        ctx.fillText(String(v), x + cell / 2, y + cell / 2 + 1);
      });
    });

    stage.cv.style.cursor = 'pointer';
    stage.cv.addEventListener('pointerdown', (e) => {
      const r = stage.cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * stage.w;
      const y = ((e.clientY - r.top) / r.height) * stage.h;
      const { x0, y0, cell } = geom();
      const c = Math.floor((x - x0) / cell);
      const rr = Math.floor((y - y0) / cell);
      if (c < 0 || c >= N || rr < 0 || rr >= N) return;
      const idx = rr * N + c;
      if (swapMode) {
        if (tiles[idx] === 0) return;
        if (swapFirst < 0) swapFirst = idx;
        else {
          [tiles[swapFirst], tiles[idx]] = [tiles[idx], tiles[swapFirst]];
          swapFirst = -1;
          qHistory = [];
          challenge = null;
        }
        update();
        return;
      }
      if (move(idx)) {
        challenge = null;
        update();
      }
    });

    reset(3);
  },
};
