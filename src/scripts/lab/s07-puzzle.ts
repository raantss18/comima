import { button, segmented, type LabDef } from './core';

/**
 * Chapitre 7 — Invariants.
 * Taquin : quelles positions peut-on atteindre ? Une quantité reste constante
 * (modulo 2) pendant tous les coups légaux.
 */

const inversions = (tiles: number[]) => {
  const t = tiles.filter((v) => v !== 0);
  let c = 0;
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[i] > t[j]) c++;
  return c;
};

/** Quantité invariante : I mod 2 (N impair) ou (I + ligne du vide) mod 2 (N pair). */
const invariant = (tiles: number[], N: number) => {
  const I = inversions(tiles);
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
    fr: 'Joue, mélange avec des coups légaux, et surveille les nombres affichés (inversions, ligne du vide). Puis relève le défi : devine si une position est atteignable, et cherche la règle.',
    en: 'Play, scramble with legal moves, and watch the displayed numbers (inversions, empty row). Then take the challenge: guess whether a position is reachable, and find the rule.',
  },
  hints: {
    fr: [
      'Une <em>inversion</em> est un couple de tuiles $(a, b)$ avec $a > b$ mais $a$ avant $b$ en lisant ligne par ligne. Compte-les après chaque coup.',
      'Pour le $3 \\times 3$ : un coup horizontal ne change pas la lecture des tuiles ; un coup vertical déplace une tuile au-dessus de deux autres. Comment varie le nombre d’inversions ?',
      'Pour le $4 \\times 4$, la ligne du vide entre en jeu : cherche la quantité $I + r \\pmod 2$ où $r$ est la ligne du vide (en partant du haut, la première ligne est $0$).',
    ],
    en: [
      'An <em>inversion</em> is a pair of tiles $(a, b)$ with $a > b$ but $a$ before $b$ reading row by row. Count them after each move.',
      'For the $3 \\times 3$: a horizontal move does not change the reading order; a vertical move jumps a tile over two others. How does the number of inversions change?',
      'For the $4 \\times 4$ the empty row matters: look for the quantity $I + r \\pmod 2$ where $r$ is the empty square’s row (counting from the top, the first row is $0$).',
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
    let challenge: { reachable: boolean } | null = null;
    let streak = 0;
    let moves = 0;
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
      const I = inversions(tiles);
      const row = Math.floor(tiles.indexOf(0) / N);
      const Q = invariant(tiles, N);
      const sorted = tiles.every((v, i) => v === (i + 1) % (N * N));
      api.say(
        `<div class="lab-big">${t('Inversions', 'Inversions')} $I$ = <strong>${I}</strong> · ${t('ligne du vide', 'blank row')} $r$ = <strong>${row}</strong> · ${t('coups', 'moves')} : ${moves}</div>` +
          (showInv
            ? `<div>${N % 2 ? `$I \\bmod 2$` : `$(I + r) \\bmod 2$`} = <strong>${Q}</strong> · ${t('valeur pour la position rangée', 'value for the solved position')} : <strong>${invariant(solved(), N)}</strong></div>`
            : `<div class="lab-muted">${t('Quantité invariante cachée : cherche-la !', 'Invariant hidden: find it!')}</div>`) +
          (sorted ? `<div class="lab-ok">✔ ${t('Position rangée', 'Solved position')}</div>` : ''),
      );
      document.dispatchEvent(new CustomEvent('comima:render-math'));
      stage.redraw();
    };

    const reset = (size = N) => {
      N = size;
      tiles = solved();
      moves = 0;
      challenge = null;
      update();
    };

    const sizeSeg = segmented(
      [
        { value: 3, label: '3×3' },
        { value: 4, label: '4×4' },
      ],
      N,
      (v) => reset(v),
    );

    // Défi : position atteignable ou non ?
    const makeChallenge = () => {
      tiles = solved();
      moves = 0;
      scramble(150);
      const reachable = Math.random() < 0.5;
      if (!reachable) {
        const flat = tiles.map((v, i) => [v, i]).filter(([v]) => v !== 0);
        const a = flat[Math.floor(Math.random() * flat.length)][1];
        let b = a;
        while (b === a || tiles[b] === 0) b = flat[Math.floor(Math.random() * flat.length)][1];
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
      const I = inversions(tiles);
      const row = Math.floor(tiles.indexOf(0) / N);
      log.add([`${N}×${N}`, I, row, invariant(tiles, N), `${guess ? t('oui', 'yes') : t('non', 'no')} ${ok ? '✔' : '✘'}`], ok ? 'ok' : 'bad');
      update();
      api.readout.insertAdjacentHTML(
        'beforeend',
        `<div class="${ok ? 'lab-ok' : 'lab-bad'}">${ok ? '✔' : '✘'} ${t('En réalité', 'In fact')} : ${challenge.reachable ? t('atteignable', 'reachable') : t('inatteignable', 'unreachable')} · ${t('série', 'streak')} ${streak}</div>`,
      );
      challenge = null;
    };

    controls.append(
      sizeSeg.row,
      button(t('Mélanger (coups légaux)', 'Scramble (legal moves)'), () => {
        scramble();
        moves = 0;
        challenge = null;
        update();
      }, 'primary'),
      button(t('Remettre en ordre', 'Reset'), () => reset()),
      button(t('Échanger 2 tuiles', 'Swap 2 tiles'), () => {
        const idx = tiles.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
        const a = idx[Math.floor(Math.random() * idx.length)];
        let b = a;
        while (b === a) b = idx[Math.floor(Math.random() * idx.length)];
        [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
        challenge = null;
        update();
      }),
      button(t('Défi : atteignable ?', 'Challenge: reachable?'), makeChallenge),
      button(t('Oui', 'Yes'), () => answer(true)),
      button(t('Non', 'No'), () => answer(false)),
      button(t('Montrer / cacher la quantité invariante', 'Show / hide the invariant'), () => {
        showInv = !showInv;
        update();
      }),
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
          ctx.fillStyle = 'rgba(127,127,127,0.12)';
          ctx.fillRect(x + 4, y + 4, cell - 8, cell - 8);
          return;
        }
        const home = (v - 1) % (N * N) === i;
        ctx.fillStyle = home ? p.soft : p.surface;
        ctx.strokeStyle = home ? p.primary : p.ink;
        ctx.lineWidth = 2;
        const r = 10;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, cell - 8, cell - 8, r);
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
      if (move(rr * N + c)) {
        challenge = null;
        update();
      }
    });

    reset(3);
  },
};
