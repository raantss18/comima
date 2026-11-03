/**
 * Jeu de parité — adapté de la tâche « Jeu de parité » du Concours Castor 2013
 * (Françoise Tort, Mahdi Miled, France-ioi), CC BY-SA 3.0. Plateau et règles d'origine.
 */
import { el } from '../lab/core';
import { fitGrid, type DefiModule } from './core';

// Plateau d'origine : 0 = case vide, 1 = pion rond, 2 = pion carré.
const FORMES = [
  [1, 1, 1, 2, 2, 1, 1, 2],
  [2, 2, 0, 1, 0, 0, 0, 2],
  [1, 2, 1, 2, 1, 0, 0, 0],
  [2, 1, 0, 2, 1, 0, 1, 1],
  [1, 1, 2, 0, 1, 0, 2, 1],
  [0, 1, 2, 0, 2, 2, 2, 0],
  [0, 0, 0, 2, 1, 1, 1, 0],
  [2, 1, 1, 2, 0, 1, 1, 2],
];
// Couleurs d'origine : 1 = blanc, 2 = noir (0 = case vide).
const COULEURS = [
  [1, 2, 2, 1, 1, 1, 2, 2],
  [1, 1, 0, 1, 0, 0, 0, 1],
  [2, 2, 2, 1, 2, 0, 0, 0],
  [2, 2, 0, 1, 2, 0, 1, 2],
  [1, 2, 1, 0, 2, 0, 1, 1],
  [0, 2, 2, 0, 1, 2, 1, 0],
  [0, 0, 0, 1, 2, 1, 2, 0],
  [1, 1, 2, 1, 0, 2, 1, 1],
];
/** Pion encadré de rouge dans l'énoncé (ligne 6, colonne 2). */
const ROUGE: [number, number] = [5, 1];
const N = 8;

export const defi: DefiModule = {
  mount(ctx) {
    const { T } = ctx;
    const coul = COULEURS.map((l) => l.slice());
    const board = el('div', { class: 'defi-grid defi-parite', role: 'grid' });
    const bilan = el('p', { class: 'defi-bilan' });
    ctx.root.append(board, bilan);
    fitGrid(board, N, 40);

    const impairs = () => {
      let lignes = 0;
      let colonnes = 0;
      for (let i = 0; i < N; i++) {
        let l = 0;
        let c = 0;
        for (let j = 0; j < N; j++) {
          if (coul[i][j] === 2) l++;
          if (coul[j][i] === 2) c++;
        }
        if (l % 2) lignes++;
        if (c % 2) colonnes++;
      }
      return { lignes, colonnes };
    };

    function render() {
      board.textContent = '';
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const f = FORMES[i][j];
          const b = el('button', { type: 'button', class: 'defi-cell', role: 'gridcell' }) as HTMLButtonElement;
          if (i === ROUGE[0] && j === ROUGE[1]) b.classList.add('is-framed');
          if (f) {
            const pion = el('span', { class: `defi-pion ${f === 1 ? 'is-round' : 'is-square'} ${coul[i][j] === 2 ? 'is-black' : 'is-white'}`, 'aria-hidden': 'true' });
            b.append(pion);
            const quoi = f === 1 ? T('pion rond', 'round token') : T('pion carré', 'square token');
            const c = coul[i][j] === 2 ? T('noir', 'black') : T('blanc', 'white');
            b.setAttribute('aria-label', `${quoi} ${c}, ${T('ligne', 'row')} ${i + 1}, ${T('colonne', 'column')} ${j + 1}`);
          } else {
            b.setAttribute('aria-label', `${T('case vide', 'empty cell')}, ${T('ligne', 'row')} ${i + 1}, ${T('colonne', 'column')} ${j + 1}`);
            b.disabled = true;
          }
          b.addEventListener('click', () => toucher(i, j));
          board.append(b);
        }
      }
      const { lignes, colonnes } = impairs();
      bilan.textContent = T(
        `Il reste ${lignes} ligne(s) et ${colonnes} colonne(s) avec un nombre impair de pions noirs.`,
        `${lignes} row(s) and ${colonnes} column(s) still have an odd number of black tokens.`,
      );
    }

    function toucher(i: number, j: number) {
      if (FORMES[i][j] !== 2) {
        ctx.result(false, T('Vous ne pouvez retourner que les pions carrés !', 'You can only flip square tokens!'));
        return;
      }
      coul[i][j] = coul[i][j] === 2 ? 1 : 2;
      render();
      const { lignes, colonnes } = impairs();
      if (!lignes && !colonnes) ctx.result(true, T('Bravo ! Toutes les lignes et colonnes ont un nombre pair de pions noirs.', 'Well done! Every row and every column has an even number of black tokens.'));
      else ctx.say('');
    }

    render();
  },
};
