/**
 * Par quatre chemins — adapté de la tâche « Par quatre chemins » du Concours Castor 2016
 * (Arthur Charguéraud, Mathias Hiron, Nir Lavee, France-ioi), CC BY-SA 3.0.
 * Labyrinthes, nombre de répétitions, longueur maximale de la séquence et règle de
 * validation sont ceux de la tâche originale ; les flèches s'ajoutent par boutons.
 */
import { el, button } from '../lab/core';
import type { DefiModule } from './core';

interface Niveau {
  grid: string[];
  first: number;
  jump: number;
  max: number;
  cycles: number;
  markers: boolean;
}

// Une chaîne par ligne : X = mur, . = libre, S = départ, G = zone verte.
const NIVEAUX: Niveau[] = [
  {
    grid: ['XXXXXXXXXXXXXXXXXXXX', 'XSX...X...X...X..G.X', 'X.X.X.X.X.X.X.X.XG.X', 'X...X...X...X...XG.X', 'XXXXXXXXXXXXXXXXXXXX'],
    first: 1,
    jump: 4,
    max: 8,
    cycles: 4,
    markers: false,
  },
  {
    grid: [
      'XXXXXXXXXXXXXXXXXXXXXXXX',
      'XS............X......G.X',
      'X.X...X..X...........G.X',
      'XX.................X.G.X',
      'X...X...X.....X.X.X..G.X',
      'X..........X.........G.X',
      'XXXXXXXXXXXXXXXXXXXXXXXX',
    ],
    first: 1,
    jump: 5,
    max: 15,
    cycles: 4,
    markers: true,
  },
  {
    grid: [
      'XXXXXXXXXXXXXXXXXXXXXXXX',
      'XS..X.X......X.......G.X',
      'X........X........X..G.X',
      'XX....X.X.....XX....XG.X',
      'X.........X..X.......G.X',
      'X.X........X...X..X..G.X',
      'X...................XG.X',
      'XXXXXXXXXXXXXXXXXXXXXXXX',
    ],
    first: 1,
    jump: 5,
    max: 16,
    cycles: 4,
    markers: true,
  },
];

type Dir = 'right' | 'down' | 'left' | 'up';
const INC: Record<Dir, [number, number]> = { right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1] };
const FLECHE: Record<Dir, string> = { right: '→', down: '↓', left: '←', up: '↑' };

const lent = () => !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export const defi: DefiModule = {
  mount(ctx) {
    const { T } = ctx;
    const niv = NIVEAUX[ctx.version];
    const rows = niv.grid.length;
    const cols = niv.grid[0].length;
    let depart: [number, number] = [0, 0];
    niv.grid.forEach((l, r) => {
      const c = l.indexOf('S');
      if (c >= 0) depart = [r, c];
    });
    const seq: Dir[] = [];
    const marques = new Set<string>();
    let robot: [number, number] = depart;
    let actif = -1;
    let enCours = 0; // jeton d'animation : un nouvel essai annule le précédent

    const scroller = el('div', { class: 'defi-maze-wrap' });
    const maze = el('div', { class: 'defi-maze', style: `grid-template-columns: repeat(${cols}, 1fr)` });
    scroller.append(maze);
    const slots = el('div', { class: 'defi-seq', 'aria-label': T('Séquence', 'Sequence') });
    const fois = el('span', { class: 'defi-seq-times' }, `× ${niv.cycles}`);
    const seqRow = el('div', { class: 'defi-seq-row' }, slots, fois);
    const pad = el('div', { class: 'defi-pad' });
    ctx.root.append(scroller, seqRow, pad);

    /** Ligne bleue au bord gauche de la colonne c ? */
    const ligne = (c: number) => c >= niv.first && (c - niv.first) % niv.jump === 0;

    function renderMaze() {
      maze.textContent = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ch = niv.grid[r][c];
          const cell = el('div', { class: 'defi-mcell' });
          if (ch === 'X') cell.classList.add('is-wall');
          if (ch === 'G') cell.classList.add('is-goal');
          if (ligne(c)) cell.classList.add('has-line');
          if (marques.has(`${r},${c}`)) cell.classList.add('is-marked');
          if (robot[0] === r && robot[1] === c) {
            cell.classList.add('has-robot');
            cell.append(el('span', { class: 'defi-robot', 'aria-hidden': 'true' }, '🤖'));
          }
          if (niv.markers && ch !== 'X') {
            cell.addEventListener('click', () => {
              const k = `${r},${c}`;
              if (marques.has(k)) marques.delete(k);
              else marques.add(k);
              renderMaze();
            });
          }
          maze.append(cell);
        }
      }
      maze.setAttribute('role', 'img');
      maze.setAttribute('aria-label', T(`Labyrinthe de ${rows} lignes et ${cols} colonnes ; le robot est ligne ${robot[0] + 1}, colonne ${robot[1] + 1}.`, `Maze with ${rows} rows and ${cols} columns; the robot is at row ${robot[0] + 1}, column ${robot[1] + 1}.`));
    }

    function renderSeq() {
      slots.textContent = '';
      for (let i = 0; i < niv.max; i++) {
        const s = el('span', { class: 'defi-slot' }, seq[i] ? FLECHE[seq[i]] : '');
        if (i === actif) s.classList.add('is-active');
        slots.append(s);
      }
      slots.setAttribute('aria-label', T(`Séquence : ${seq.length ? seq.map((d) => FLECHE[d]).join(' ') : 'vide'}`, `Sequence: ${seq.length ? seq.map((d) => FLECHE[d]).join(' ') : 'empty'}`));
    }

    (['left', 'up', 'down', 'right'] as Dir[]).forEach((d) => {
      const nomDir = { left: T('gauche', 'left'), up: T('haut', 'up'), down: T('bas', 'down'), right: T('droite', 'right') }[d];
      const b = button(FLECHE[d], () => {
        if (seq.length >= niv.max) {
          ctx.say(T(`La séquence contient au plus ${niv.max} flèches.`, `The sequence holds at most ${niv.max} arrows.`));
          return;
        }
        enCours++;
        robot = depart;
        actif = -1;
        seq.push(d);
        renderSeq();
        renderMaze();
      });
      b.classList.add('defi-arrow');
      b.setAttribute('aria-label', T(`Ajouter une flèche vers la ${nomDir}`, `Add an arrow ${nomDir}`).replace('la haut', 'le haut').replace('la bas', 'le bas'));
      pad.append(b);
    });
    const effacer = button('⌫', () => {
      enCours++;
      seq.pop();
      robot = depart;
      actif = -1;
      renderSeq();
      renderMaze();
    });
    effacer.setAttribute('aria-label', T('Effacer la dernière flèche', 'Delete the last arrow'));
    pad.append(effacer);

    /** Exécution : mêmes règles et mêmes messages que la tâche originale. */
    async function essayer() {
      const jeton = ++enCours;
      const pause = (ms: number) => new Promise<void>((res) => setTimeout(res, lent() ? ms : 0));
      if (seq.length === 0) {
        ctx.say(T('Ajoutez des flèches à la séquence.', 'Add arrows to the sequence.'));
        return;
      }
      let [r, c] = depart;
      robot = [r, c];
      renderMaze();
      for (let cycle = 0; cycle < niv.cycles; cycle++) {
        for (let i = 0; i < seq.length; i++) {
          await pause(220);
          if (jeton !== enCours) return;
          const [dc, dr] = INC[seq[i]];
          r += dr;
          c += dc;
          actif = i;
          renderSeq();
          if (r < 0 || r >= rows || c < 0 || c >= cols) {
            ctx.result(false, T('Le robot est sorti de la grille.', 'The robot left the grid.'));
            return;
          }
          robot = [r, c];
          renderMaze();
          if (niv.grid[r][c] === 'X') {
            ctx.result(false, T('Le robot est rentré dans un mur.', 'The robot ran into a wall.'));
            return;
          }
          const fin = i === seq.length - 1;
          const zone = c === niv.first + (cycle + 1) * niv.jump;
          if (zone && !fin) {
            ctx.result(false, T('Le robot a traversé une ligne bleue avant la dernière instruction de la séquence.', 'The robot crossed a blue line before the last instruction of the sequence.'));
            return;
          }
          if (!zone && fin) {
            ctx.result(false, T('La dernière instruction de la séquence n’a pas fait traverser une ligne bleue au robot.', 'The last instruction of the sequence did not make the robot cross a blue line.'));
            return;
          }
        }
      }
      actif = -1;
      renderSeq();
      if (niv.grid[r][c] === 'G') ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      else ctx.result(false, T('Le robot n’a pas atteint la zone verte.', 'The robot did not reach the green area.'));
    }

    ctx.btn(T('▶ Essayer', '▶ Try'), () => void essayer(), true);
    renderSeq();
    renderMaze();
    ctx.say(T('Composez la séquence avec les flèches, puis appuyez sur « Essayer ».', 'Build the sequence with the arrows, then press “Try”.'));
    return () => {
      enCours++;
    };
  },
};
