/**
 * Installation d'antennes — adapté de la tâche « Installation d'antennes » du Concours Castor
 * 2015 (Arthur Charguéraud, France-ioi), CC BY-SA 3.0. Dimensions des grilles, cases grises
 * (bords), portée des ondes et règles (pas de recouvrement, toutes les cases blanches
 * couvertes) sont ceux de la tâche originale.
 */
import { el } from '../lab/core';
import { fitGrid, type DefiModule } from './core';

/** [lignes, colonnes] des trois versions. */
const DIMENSIONS: [number, number][] = [
  [1, 17],
  [2, 15],
  [9, 12],
];
const VOISINS: [number, number][] = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const [rows, cols] = DIMENSIONS[version];
    const antenne = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const dans = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;
    const bord = (r: number, c: number) => (version === 2 ? r === 0 || r === rows - 1 || c === 0 || c === cols - 1 : c === 0 || c === cols - 1);

    const board = el('div', { class: 'defi-grid defi-antennes', role: 'grid' });
    ctx.root.append(board);
    fitGrid(board, cols, 40, 2);

    /** Nombre d'antennes dont les ondes (ou l'antenne elle-même) atteignent chaque case. */
    function couverture(): number[][] {
      const n = Array.from({ length: rows }, () => new Array(cols).fill(0));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!antenne[r][c]) continue;
          n[r][c]++;
          for (const [dr, dc] of VOISINS) if (dans(r + dr, c + dc)) n[r + dr][c + dc]++;
        }
      }
      return n;
    }

    function render() {
      const n = couverture();
      board.textContent = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const b = el('button', { type: 'button', class: 'defi-cell defi-ant', role: 'gridcell' }) as HTMLButtonElement;
          if (n[r][c] > 1) b.classList.add('is-overlap');
          else if (bord(r, c)) b.classList.add('is-border');
          else if (n[r][c] === 1) b.classList.add('is-covered');
          if (antenne[r][c]) b.append(el('span', { 'aria-hidden': 'true' }, '📡'));
          const etat = antenne[r][c] ? T('antenne', 'antenna') : n[r][c] > 1 ? T('ondes superposées', 'overlapping waves') : n[r][c] === 1 ? T('couverte', 'covered') : bord(r, c) ? T('case grise', 'grey cell') : T('case blanche', 'white cell');
          b.setAttribute('aria-label', `${etat}, ${T('ligne', 'row')} ${r + 1}, ${T('colonne', 'column')} ${c + 1}`);
          b.addEventListener('click', () => toucher(r, c));
          board.append(b);
        }
      }
      return n;
    }

    function toucher(r: number, c: number) {
      antenne[r][c] = !antenne[r][c];
      const n = render();
      let recouvrement = false;
      let trou = false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (n[i][j] > 1) recouvrement = true;
          if (!bord(i, j) && n[i][j] === 0) trou = true;
        }
      }
      if (recouvrement) ctx.result(false, T('Attention : les ondes ne doivent pas se recouvrir.', 'Careful: the waves must not overlap.'));
      else if (!trou) ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      else ctx.say(T('Il reste des cases blanches qui ne sont pas couvertes.', 'Some white cells are still not covered.'));
    }

    render();
    ctx.say(T('Une antenne couvre sa case et les cases voisines par un côté.', 'An antenna covers its own cell and the cells next to it by a side.'));
  },
};
