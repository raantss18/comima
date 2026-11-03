/**
 * Dessine un castor — adapté de la tâche « Dessine un castor » du Concours Castor 2012
 * (France-ioi), CC BY-SA 3.0. Dessin de départ et dessin à obtenir d'origine ; chaque clic
 * inverse un bloc de 2 × 2 cases (le bloc dont le coin est le plus proche du point touché).
 */
import { el } from '../lab/core';
import { fitGrid, type DefiModule } from './core';

const DEPART = [
  [1, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 1, 0, 1, 0, 0, 1],
];
const CASTOR = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [0, 1, 0, 1, 1, 0, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];
const N = 8;

export const defi: DefiModule = {
  mount(ctx) {
    const { T } = ctx;
    const dessin = DEPART.map((l) => l.slice());
    let clics = 0;
    let fini = false;

    const modele = el('div', { class: 'defi-pixels is-model', role: 'img', 'aria-label': T('Dessin à obtenir', 'Drawing to obtain') });
    const toile = el('div', { class: 'defi-pixels', role: 'grid', 'aria-label': T('Votre dessin', 'Your drawing') });
    const compteur = el('p', { class: 'defi-bilan muted' });
    ctx.root.append(
      el('p', { class: 'defi-legend' }, T('Objectif :', 'Goal:')),
      modele,
      el('p', { class: 'defi-legend' }, T('Votre dessin :', 'Your drawing:')),
      toile,
      compteur,
    );
    fitGrid(modele, N, 18, 0);
    fitGrid(toile, N, 40, 0);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) modele.append(el('span', { class: `defi-px${CASTOR[i][j] ? ' is-on' : ''}` }));

    function render() {
      toile.textContent = '';
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const b = el('button', { type: 'button', class: `defi-px${dessin[i][j] ? ' is-on' : ''}`, role: 'gridcell' }) as HTMLButtonElement;
          b.setAttribute('aria-label', `${dessin[i][j] ? T('noire', 'black') : T('blanche', 'white')}, ${T('ligne', 'row')} ${i + 1}, ${T('colonne', 'column')} ${j + 1}`);
          b.addEventListener('click', (e) => {
            const rect = b.getBoundingClientRect();
            // Bloc 2 × 2 dont le coin est le plus proche du point touché (clavier : coin en haut à gauche).
            const gauche = e.clientX ? e.clientX - rect.left < rect.width / 2 : false;
            const haut = e.clientY ? e.clientY - rect.top < rect.height / 2 : false;
            inverser(Math.min(N - 2, gauche && j > 0 ? j - 1 : j), Math.min(N - 2, haut && i > 0 ? i - 1 : i));
          });
          toile.append(b);
        }
      }
      compteur.textContent = T(`Nombre de clics : ${clics}.`, `Clicks: ${clics}.`);
    }

    function inverser(col: number, row: number) {
      if (fini) return;
      for (let i = row; i < row + 2; i++) for (let j = col; j < col + 2; j++) dessin[i][j] = 1 - dessin[i][j];
      clics++;
      render();
      fini = dessin.every((l, i) => l.every((v, j) => v === CASTOR[i][j]));
      if (fini) ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      else ctx.say('');
    }

    render();
    ctx.say(T('Chaque clic inverse un bloc de 4 cases.', 'Each click flips a block of 4 cells.'));
  },
};
