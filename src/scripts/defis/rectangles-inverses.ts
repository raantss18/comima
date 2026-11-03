/**
 * Rectangles inversés — adapté de la tâche « Rectangles inversés » du Concours Castor 2016
 * (Arthur Charguéraud, Mathias Hiron, Nir Lavee, France-ioi), CC BY-SA 3.0. Motifs, nombres
 * d'inversions et règle d'origine : inverser la couleur d'une zone rectangulaire. La
 * vérification compare la grille de l'élève au motif, puis le nombre d'inversions.
 */
import { el } from '../lab/core';
import { fitGrid, type DefiModule } from './core';

const NIVEAUX: { grille: number[][]; limite: number; but: number }[] = [
  {
    grille: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    limite: 4,
    but: 2,
  },
  {
    grille: [
      [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
    ],
    limite: 5,
    but: 5,
  },
  {
    grille: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      [0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    limite: 5,
    but: 4,
  },
];

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const { grille: motif, limite, but } = NIVEAUX[version];
    const H = motif.length;
    const W = motif[0].length;
    const dessin = motif.map((l) => l.map(() => 0));
    const zones: { r1: number; c1: number; r2: number; c2: number }[] = [];
    let coin: [number, number] | null = null;
    let faux: [number, number] | null = null;
    let fini = false;

    const objectif = el('div', { class: 'defi-grid defi-inv is-model', 'aria-hidden': 'true' });
    const grille = el('div', { class: 'defi-grid defi-inv', role: 'grid', 'aria-label': T('Votre dessin', 'Your drawing') });
    const etapes = el('p', { class: 'defi-bilan' });
    ctx.root.append(el('p', { class: 'defi-legend' }, T('Objectif :', 'Target:')), objectif, el('p', { class: 'defi-legend' }, T('Votre dessin :', 'Your drawing:')), grille, etapes);
    fitGrid(objectif, W, 30, 1);
    fitGrid(grille, W, 30, 1);

    function inverser(z: { r1: number; c1: number; r2: number; c2: number }) {
      for (let r = z.r1; r <= z.r2; r++) for (let c = z.c1; c <= z.c2; c++) dessin[r][c] ^= 1;
    }

    function render() {
      objectif.textContent = '';
      grille.textContent = '';
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          objectif.append(el('span', { class: `defi-px${motif[r][c] ? ' is-on' : ''}` }));
          const b = el('button', { type: 'button', class: `defi-px${dessin[r][c] ? ' is-on' : ''}`, role: 'gridcell' }) as HTMLButtonElement;
          if (coin && coin[0] === r && coin[1] === c) b.classList.add('is-corner');
          if (faux && faux[0] === r && faux[1] === c) b.classList.add('is-wrong');
          b.setAttribute('aria-label', `${dessin[r][c] ? T('noire', 'black') : T('blanche', 'white')}, ${T('ligne', 'row')} ${r + 1}, ${T('colonne', 'column')} ${c + 1}`);
          b.addEventListener('click', () => toucher(r, c));
          grille.append(b);
        }
      }
      etapes.textContent = T(`Nombre d’étapes : ${zones.length}`, `Number of steps: ${zones.length}`);
      btnAnnuler.disabled = zones.length === 0 && !coin;
    }

    function toucher(r: number, c: number) {
      if (fini) return;
      faux = null;
      if (zones.length >= limite) {
        ctx.result(false, T('Vous avez effectué trop d’étapes. Essayez autrement. Vous pouvez annuler des étapes ou bien tout recommencer.', 'You have made too many steps. Try another way. You can undo steps or start again.'));
        return;
      }
      if (!coin) {
        coin = [r, c];
        ctx.say(T('Touchez maintenant le coin opposé de la zone à inverser.', 'Now tap the opposite corner of the area to invert.'));
        render();
        return;
      }
      const z = { r1: Math.min(coin[0], r), c1: Math.min(coin[1], c), r2: Math.max(coin[0], r), c2: Math.max(coin[1], c) };
      coin = null;
      inverser(z);
      zones.push(z);
      ctx.say('');
      render();
      if (dessin.every((l, i) => l.every((v, j) => v === motif[i][j])) && zones.length <= but) {
        fini = true;
        ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      }
    }

    const btnAnnuler = ctx.btn(T('Annuler', 'Undo'), () => {
      if (coin) coin = null;
      else {
        const z = zones.pop();
        if (z) inverser(z);
      }
      faux = null;
      fini = false;
      ctx.say('');
      render();
    });
    ctx.btn(T('Vérifier', 'Check'), () => {
      coin = null;
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          if (dessin[r][c] !== motif[r][c]) {
            faux = [r, c];
            render();
            ctx.result(false, T('La case marquée en rouge n’est pas coloriée correctement.', 'The cell marked in red is not coloured correctly.'));
            return;
          }
        }
      }
      render();
      if (zones.length <= but) ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      else ctx.result(false, T('Pas mal ! Réessayez en moins d’étapes.', 'Not bad! Try again in fewer steps.'));
    }, true);
    render();
    ctx.say(T('Touchez un coin de la zone à inverser, puis le coin opposé.', 'Tap one corner of the area to invert, then the opposite corner.'));
  },
};
