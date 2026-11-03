/**
 * Territoire castor — adapté de la tâche « Territoire castor » du Concours Castor 2012
 * (France-ioi), CC BY-SA 3.0. Carte d'origine (8 × 12, cases noires, maison) et règle :
 * colorier les cases atteignables en 5 pas ou moins, sans diagonale ni case noire. La
 * vérification calcule ces cases à partir de la règle (parcours en largeur) ; comme dans
 * l'original, chaque case en trop ou en moins compte comme une erreur.
 */
import { el } from '../lab/core';
import { fitGrid, type DefiModule } from './core';

/** 0 : case libre, 1 : case noire, 2 : maison de Castor. */
const CARTE = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const PAS = 5;
const H = CARTE.length;
const W = CARTE[0].length;

/** Distance de chaque case à la maison en pas (−1 : hors de portée), d'après la règle. */
function distances(): number[][] {
  const d = CARTE.map((l) => l.map(() => -1));
  const file: [number, number][] = [];
  CARTE.forEach((l, r) => l.forEach((v, c) => {
    if (v === 2) {
      d[r][c] = 0;
      file.push([r, c]);
    }
  }));
  for (let i = 0; i < file.length; i++) {
    const [r, c] = file[i];
    if (d[r][c] === PAS) continue;
    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const a = r + dr;
      const b = c + dc;
      if (a >= 0 && a < H && b >= 0 && b < W && CARTE[a][b] !== 1 && d[a][b] < 0) {
        d[a][b] = d[r][c] + 1;
        file.push([a, b]);
      }
    }
  }
  return d;
}

export const defi: DefiModule = {
  mount(ctx) {
    const { T } = ctx;
    const marque = CARTE.map((l) => l.map(() => 0)); // 0 : vide, 1 à 5 : coloriée avec ce nombre
    let crayon = 1;

    const palette = el('div', { class: 'defi-pad', role: 'radiogroup', 'aria-label': T('Nombre à inscrire', 'Number to write') });
    const carte = el('div', { class: 'defi-grid defi-territoire', role: 'grid' });
    const bilan = el('p', { class: 'defi-bilan muted' });
    ctx.root.append(palette, carte, bilan);
    fitGrid(carte, W, 36, 2);

    function render() {
      palette.textContent = '';
      for (let k = 1; k <= PAS; k++) {
        const b = el('button', { type: 'button', class: 'defi-pen', role: 'radio' }, String(k)) as HTMLButtonElement;
        b.setAttribute('aria-checked', String(k === crayon));
        b.addEventListener('click', () => {
          crayon = k;
          render();
        });
        palette.append(b);
      }
      carte.textContent = '';
      let n = 0;
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          const v = CARTE[r][c];
          const b = el('button', { type: 'button', class: 'defi-cell defi-terr', role: 'gridcell' }) as HTMLButtonElement;
          if (v === 1) {
            b.classList.add('is-block');
            b.disabled = true;
          } else if (v === 2) {
            b.append(el('span', { class: 'defi-cross' }, '✕'));
            b.disabled = true;
          } else if (marque[r][c]) {
            b.classList.add('is-blue');
            b.textContent = String(marque[r][c]);
            n++;
          }
          const etat = v === 1 ? T('case noire', 'black cell') : v === 2 ? T('maison de Castor', 'Castor’s home') : marque[r][c] ? T(`coloriée (${marque[r][c]})`, `coloured (${marque[r][c]})`) : T('case vide', 'empty cell');
          b.setAttribute('aria-label', `${etat}, ${T('ligne', 'row')} ${r + 1}, ${T('colonne', 'column')} ${c + 1}`);
          b.addEventListener('click', () => {
            marque[r][c] = marque[r][c] ? 0 : crayon;
            ctx.say('');
            render();
          });
          carte.append(b);
        }
      }
      bilan.textContent = T(`Cases coloriées : ${n}.`, `Coloured cells: ${n}.`);
    }

    ctx.btn(T('Vérifier', 'Check'), () => {
      const d = distances();
      let erreurs = 0;
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          if (CARTE[r][c] !== 0) continue;
          if ((marque[r][c] > 0) !== (d[r][c] > 0)) erreurs++;
        }
      }
      if (erreurs === 0) ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      else ctx.result(false, erreurs === 1 ? T('Il y a 1 case coloriée en trop ou en moins.', 'There is 1 cell coloured wrongly or missing.') : T(`Il y a ${erreurs} cases coloriées en trop ou en moins.`, `There are ${erreurs} cells coloured wrongly or missing.`));
    }, true);
    render();
    ctx.say(T('Choisissez un nombre, puis touchez les cases à colorier ; touchez à nouveau une case pour la vider.', 'Choose a number, then tap the cells to colour; tap a cell again to clear it.'));
  },
};
