/**
 * Robot qui tourne — adapté de la tâche « Robot qui tourne » du Concours Castor 2015
 * (Arthur Charguéraud, France-ioi), CC BY-SA 3.0. Grilles, règle de déplacement et
 * détection des boucles sont ceux de la tâche originale.
 */
import { el } from '../lab/core';
import type { DefiModule } from './core';

// S = départ (le robot regarde vers la droite), F = rond vert, X = obstacle fixe.
const GRILLES: string[][] = [
  ['S.......', '....X...', '.X..FX..', '....X...', '........', '...X....'],
  ['S.......', 'XXX.XXXX', '........', '..X.X.X.', '.X..X..X', '.X.X...F'],
  ['S.X.....', '..X.....', '..X.FX..', '..XXXX..', '........', '........'],
];
type Dir = 'right' | 'down' | 'left' | 'up';
const INC: Record<Dir, [number, number]> = { right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1] };
const DROITE: Record<Dir, Dir> = { right: 'down', down: 'left', left: 'up', up: 'right' };
const FLECHE: Record<Dir, string> = { right: '▶', down: '▼', left: '◀', up: '▲' };
const MAX_PASSAGES = 3;

const lent = () => !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export const defi: DefiModule = {
  mount(ctx) {
    const { T } = ctx;
    const g = GRILLES[ctx.version];
    const rows = g.length;
    const cols = g[0].length;
    const ajout = g.map((l) => l.split('').map(() => false));
    let depart: [number, number] = [0, 0];
    let sortie: [number, number] = [0, 0];
    g.forEach((l, r) => {
      if (l.indexOf('S') >= 0) depart = [r, l.indexOf('S')];
      if (l.indexOf('F') >= 0) sortie = [r, l.indexOf('F')];
    });
    let robot: { r: number; c: number; d: Dir } = { r: depart[0], c: depart[1], d: 'right' };
    let jetonAnim = 0;

    const board = el('div', { class: 'defi-grid defi-robot-grid', role: 'grid', style: `grid-template-columns: repeat(${cols}, minmax(0, 46px))` });
    ctx.root.append(board);

    function render() {
      board.textContent = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ch = g[r][c];
          const b = el('button', { type: 'button', class: 'defi-cell', role: 'gridcell' }) as HTMLButtonElement;
          let quoi = T('case libre', 'free cell');
          if (ch === 'X') {
            b.classList.add('is-block');
            b.append(el('span', { class: 'defi-cross', 'aria-hidden': 'true' }, '✕'));
            quoi = T('obstacle fixe', 'fixed obstacle');
          } else if (ajout[r][c]) {
            b.classList.add('is-added');
            b.append(el('span', { class: 'defi-cross', 'aria-hidden': 'true' }, '✕'));
            quoi = T('obstacle ajouté', 'added obstacle');
          }
          if (ch === 'F') {
            b.append(el('span', { class: 'defi-exit', 'aria-hidden': 'true' }));
            quoi = T('rond vert', 'green circle');
          }
          if (robot.r === r && robot.c === c) {
            b.append(el('span', { class: 'defi-bot', 'aria-hidden': 'true' }, FLECHE[robot.d]));
            quoi += T(', robot', ', robot');
          }
          b.setAttribute('aria-label', `${quoi}, ${T('ligne', 'row')} ${r + 1}, ${T('colonne', 'column')} ${c + 1}`);
          b.addEventListener('click', () => toucher(r, c));
          board.append(b);
        }
      }
    }

    function toucher(r: number, c: number) {
      jetonAnim++;
      robot = { r: depart[0], c: depart[1], d: 'right' };
      if (g[r][c] === 'X') ctx.say(T('Cette case contient déjà un obstacle.', 'This cell already holds an obstacle.'));
      else if (g[r][c] !== '.') ctx.say(T('Vous ne pouvez pas ajouter d’obstacle dans cette case.', 'You cannot add an obstacle in this cell.'));
      else {
        ajout[r][c] = !ajout[r][c];
        ctx.say('');
      }
      render();
    }

    /** Même simulation que la tâche originale : avancer, sinon tourner à droite. */
    async function essayer() {
      const jeton = ++jetonAnim;
      const pause = () => new Promise<void>((res) => setTimeout(res, lent() ? 200 : 0));
      const vus: Record<string, number> = {};
      let { r, c } = { r: depart[0], c: depart[1] };
      let d: Dir = 'right';
      robot = { r, c, d };
      render();
      for (;;) {
        const k = `${r}_${c}_${d}`;
        vus[k] = (vus[k] || 0) + 1;
        if (vus[k] >= MAX_PASSAGES) {
          ctx.result(false, T('Le robot tourne en boucle. Il n’arrivera donc jamais à la sortie.', 'The robot is going round in circles. It will never reach the exit.'));
          return;
        }
        const [dc, dr] = INC[d];
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || ajout[nr][nc] || g[nr][nc] === 'X') d = DROITE[d];
        else {
          r = nr;
          c = nc;
        }
        await pause();
        if (jeton !== jetonAnim) return;
        robot = { r, c, d };
        render();
        if (r === sortie[0] && c === sortie[1]) {
          ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
          return;
        }
      }
    }

    ctx.btn(T('▶ Essayer', '▶ Try'), () => void essayer(), true);
    render();
    ctx.say(T('Cliquez sur des cases pour ajouter ou retirer des obstacles, puis appuyez sur « Essayer ».', 'Click cells to add or remove obstacles, then press “Try”.'));
    return () => {
      jetonAnim++;
    };
  },
};
