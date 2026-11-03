/**
 * Rectangles — adapté de la tâche « Rectangles » du Concours Castor 2020 (Arthur Charguéraud,
 * Mathias Hiron, Nir Lavee), CC BY-SA 3.0. Motifs, nombres de rectangles et règles d'origine :
 * un rectangle colorie les cases de son contour ; toutes les cases à points doivent être
 * coloriées et les autres rester vides. Comme l'original, le motif est retourné au hasard
 * (symétries) ; la vérification compare la grille au motif, puis le nombre de rectangles.
 */
import { el } from '../lab/core';
import type { DefiModule } from './core';

const NIVEAUX: { motif: string[]; limite: number }[] = [
  {
    motif: [
      '............',
      '....####....',
      '....#..#....',
      '....#..#....',
      '.##########.',
      '.#..#..#..#.',
      '.#..#..#..#.',
      '.##########.',
      '....#..#....',
      '....#..#....',
      '....####....',
      '............',
    ],
    limite: 2,
  },
  {
    motif: [
      '..................',
      '.################.',
      '.#....#...#.....#.',
      '.#....#...#.....#.',
      '.################.',
      '.#..#........#..#.',
      '.#..#........#..#.',
      '.################.',
      '.#.#.....#......#.',
      '.#.#.....#......#.',
      '.################.',
      '..................',
    ],
    limite: 5,
  },
  {
    motif: [
      '.........................',
      '.#######################.',
      '.#...#....#...#......#.#.',
      '.#######################.',
      '.#...#....#...#......#.#.',
      '.#######################.',
      '.#.#....#.#......#.....#.',
      '.#######################.',
      '.#.#....#.#......#.....#.',
      '.#######################.',
      '.#.#....#.....#.....#..#.',
      '.#######################.',
      '.#.#.#..#...#.#.....#..#.',
      '.#######################.',
      '.#...#......#..........#.',
      '.#######################.',
      '.........................',
    ],
    limite: 10,
  },
];

type Rect = { r1: number; c1: number; r2: number; c2: number };

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const { limite } = NIVEAUX[version];
    // Symétries tirées au hasard, comme la tâche originale.
    let motif = NIVEAUX[version].motif.map((l) => l.split('').map((ch) => (ch === '#' ? 1 : 0)));
    if (Math.random() < 0.5) motif = motif.slice().reverse();
    if (Math.random() < 0.5) motif = motif.map((l) => l.slice().reverse());
    const H = motif.length;
    const W = motif[0].length;
    const maxi = version === 0 ? limite : limite + 2;
    const rects: Rect[] = [];
    let coin: [number, number] | null = null;
    let faux: [number, number] | null = null;
    let fini = false;

    const wrap = el('div', { class: 'defi-maze-wrap' });
    const grille = el('div', { class: 'defi-grid defi-rects', role: 'grid', 'aria-label': T('Grille', 'Grid') });
    const compteur = el('p', { class: 'defi-bilan' });
    wrap.append(grille);
    ctx.root.append(wrap, compteur);

    // Cases d'au moins 20 px pour rester touchables ; la grille défile si besoin.
    const taille = () => {
      const dispo = (ctx.root.clientWidth || 320) - 8;
      const s = Math.max(20, Math.min(28, Math.floor(dispo / W)));
      grille.style.gridTemplateColumns = `repeat(${W}, ${s}px)`;
      grille.style.gridAutoRows = `${s}px`;
    };
    taille();
    window.addEventListener('resize', taille);

    function bleu(): number[][] {
      const g = motif.map((l) => l.map(() => 0));
      for (const z of rects) {
        for (let r = z.r1; r <= z.r2; r++) {
          for (let c = z.c1; c <= z.c2; c++) if (r === z.r1 || r === z.r2 || c === z.c1 || c === z.c2) g[r][c] = 1;
        }
      }
      return g;
    }

    function render() {
      const g = bleu();
      grille.textContent = '';
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          const b = el('button', { type: 'button', class: 'defi-rcell', role: 'gridcell' }) as HTMLButtonElement;
          if (g[r][c]) b.classList.add('is-blue');
          if (motif[r][c]) b.append(el('span', { class: 'defi-dot' }));
          if (g[r][c] && !motif[r][c]) b.append(el('span', { class: 'defi-cross' }, '✕'));
          if (coin && coin[0] === r && coin[1] === c) b.classList.add('is-corner');
          if (faux && faux[0] === r && faux[1] === c) b.classList.add('is-wrong');
          const etat = `${motif[r][c] ? T('point', 'dot') : T('vide', 'empty')}${g[r][c] ? T(', coloriée', ', coloured') : ''}`;
          b.setAttribute('aria-label', `${etat}, ${T('ligne', 'row')} ${r + 1}, ${T('colonne', 'column')} ${c + 1}`);
          b.addEventListener('click', () => toucher(r, c));
          grille.append(b);
        }
      }
      compteur.textContent = T(`Nombre de rectangles utilisés : ${rects.length} / ${limite}`, `Rectangles used: ${rects.length} / ${limite}`);
      btnAnnuler.disabled = rects.length === 0 && !coin;
    }

    function verifier(): { ok: boolean; msg: string; case?: [number, number] } {
      const g = bleu();
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          if (g[r][c] !== motif[r][c]) {
            return motif[r][c]
              ? { ok: false, msg: T('La case encadrée en rouge devrait être coloriée en bleu.', 'The cell framed in red should be coloured blue.'), case: [r, c] }
              : { ok: false, msg: T('Les cases avec les croix rouges ne devraient pas être coloriées en bleu.', 'The cells with red crosses should not be coloured blue.') };
          }
        }
      }
      if (rects.length > limite) return { ok: false, msg: T(`Vous avez utilisé plus de ${limite} rectangles. Essayez autrement. Vous pouvez annuler des étapes ou bien tout recommencer.`, `You used more than ${limite} rectangles. Try another way. You can undo steps or start again.`) };
      return { ok: true, msg: T('Bravo, vous avez réussi !', 'Well done, you did it!') };
    }

    function toucher(r: number, c: number) {
      if (fini) return;
      faux = null;
      if (rects.length >= maxi) {
        ctx.result(false, T('Vous ne pouvez pas dessiner davantage de rectangles. Essayez autrement. Vous pouvez annuler des étapes ou bien tout recommencer.', 'You cannot draw any more rectangles. Try another way. You can undo steps or start again.'));
        return;
      }
      if (!coin) {
        coin = [r, c];
        ctx.say(T('Touchez maintenant le coin opposé du rectangle.', 'Now tap the opposite corner of the rectangle.'));
        render();
        return;
      }
      const z = { r1: Math.min(coin[0], r), c1: Math.min(coin[1], c), r2: Math.max(coin[0], r), c2: Math.max(coin[1], c) };
      coin = null;
      // Comme l'original : un rectangle dont tout le contour est déjà bleu n'est pas compté.
      const g = bleu();
      let utile = false;
      for (let i = z.r1; i <= z.r2; i++) for (let j = z.c1; j <= z.c2; j++) if ((i === z.r1 || i === z.r2 || j === z.c1 || j === z.c2) && !g[i][j]) utile = true;
      if (utile) rects.push(z);
      render();
      const res = verifier();
      if (res.ok) {
        fini = true;
        ctx.result(true, res.msg);
      } else if (bleu().some((l, i) => l.some((v, j) => v && !motif[i][j]))) ctx.result(false, T('Les cases avec une croix rouge devraient rester vides.', 'The cells with a red cross should stay empty.'));
      else ctx.say('');
    }

    const btnAnnuler = ctx.btn(T('Annuler', 'Undo'), () => {
      if (coin) coin = null;
      else rects.pop();
      faux = null;
      fini = false;
      ctx.say('');
      render();
    });
    ctx.btn(T('Vérifier', 'Check'), () => {
      coin = null;
      const res = verifier();
      faux = res.case || null;
      render();
      ctx.result(res.ok, res.msg);
    }, true);
    render();
    ctx.say(T('Touchez un coin du rectangle, puis le coin opposé.', 'Tap one corner of the rectangle, then the opposite corner.'));
    return () => window.removeEventListener('resize', taille);
  },
};
