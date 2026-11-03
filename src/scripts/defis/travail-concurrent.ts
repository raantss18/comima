/**
 * Travail concurrent — adapté de la tâche « Travail concurrent » du Concours Castor 2018
 * (Arthur Charguéraud, Mathias Hiron, France-ioi), CC BY-SA 3.0. Grille 6 × 6, robots,
 * cases vertes, programmes et règles d'exécution d'origine : l'élève choisit dans quel
 * ordre les robots exécutent leur instruction. L'état est recalculé à partir de la suite
 * des instructions exécutées ; la vérification teste la collision (★, ★★) ou le blocage
 * de tous les robots (★★★), comme la correction originale.
 */
import { el } from '../lab/core';
import { S } from '../fiche/core';
import { fitGrid, type DefiModule } from './core';

// Instructions : 0 avancer, 1 tourner à gauche, 2 tourner à droite, 3 avancer si la case
// devant est libre, 4 / 5 si la case (l'une des 2 cases) devant est occupée aller à
// l'étape 3, 6 si le robot est sur une case blanche aller à l'étape 1, 7 fin.
const NIVEAUX: { depart: [number, number][]; orient: number[]; buts: [number, number][]; progs: number[][] }[] = [
  { depart: [[0, 1], [0, 3]], orient: [2, 2], buts: [], progs: [[0, 0, 1, 0, 0, 0, 0, 7], [0, 0, 0, 2, 0, 0, 0, 7]] },
  { depart: [[0, 2], [3, 0]], orient: [2, 1], buts: [[5, 2], [3, 5]], progs: [[4, 0, 6, 7]] },
  { depart: [[0, 1], [3, 0], [5, 2], [2, 5]], orient: [2, 1, 0, 3], buts: [[5, 1], [3, 5], [0, 2], [2, 0]], progs: [[5, 3, 6, 7]] },
];
const N = 6;
const PAS: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // orientation 0 haut, 1 droite, 2 bas, 3 gauche
const TEXTES: [string, string][] = [
  ['Avancer', 'Move forward'],
  ['Tourner à gauche', 'Turn left'],
  ['Tourner à droite', 'Turn right'],
  ['Si la case devant le robot est libre, avancer', 'Move forward if there is no robot in the cell ahead'],
  ['Si la case devant le robot est occupée, aller à l’étape 3', 'If a robot is in the cell ahead, go to step 3'],
  ['Si l’une des deux cases devant le robot est occupée, aller à l’étape 3', 'If a robot is in one of the 2 cells ahead, go to step 3'],
  ['Si le robot se trouve sur une case blanche, aller à l’étape 1', 'If the robot is on a white cell, go to step 1'],
  ['Fin du programme', 'End of the program'],
];

interface Etat {
  pos: [number, number][];
  or: number[];
  etape: number[];
}

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const niv = NIVEAUX[version];
    const n = niv.depart.length;
    const prog = (k: number) => niv.progs[niv.progs.length > 1 ? k : 0];
    const histoire: number[] = [];

    const estBut = (p: [number, number]) => niv.buts.some((b) => b[0] === p[0] && b[1] === p[1]);
    const libre = (e: Etat, p: [number, number]) => !e.pos.some((q) => q[0] === p[0] && q[1] === p[1]);
    /** Comme l'original : faux sur une case verte ; les cases hors de la grille comptent comme libres. */
    function devantLibre(e: Etat, k: number, combien: number): boolean {
      if (estBut(e.pos[k])) return false;
      for (let i = 1; i <= combien; i++) {
        const p: [number, number] = [e.pos[k][0] + i * PAS[e.or[k]][0], e.pos[k][1] + i * PAS[e.or[k]][1]];
        if (p[0] >= 0 && p[1] >= 0 && p[0] < N && p[1] < N && !libre(e, p)) return false;
      }
      return true;
    }
    const fin = (e: Etat, k: number) => e.etape[k] === prog(k).length - 1;
    const ecrases = (e: Etat) => e.pos[0][0] === e.pos[1][0] && e.pos[0][1] === e.pos[1][1];

    function suivante(e: Etat, k: number) {
      if (e.etape[k] < prog(k).length - 1) e.etape[k]++;
    }

    function executer(e: Etat, k: number) {
      const ins = prog(k)[e.etape[k]];
      if (ins === 0 || (ins === 3 && devantLibre(e, k, 1))) {
        const a = e.pos[k][0] + PAS[e.or[k]][0];
        const b = e.pos[k][1] + PAS[e.or[k]][1];
        if (a >= 0 && a < N && b >= 0 && b < N) e.pos[k] = [a, b];
        suivante(e, k);
      } else if (ins === 1 || ins === 2) {
        e.or[k] = (e.or[k] + (ins === 1 ? 3 : 1)) % 4;
        suivante(e, k);
      } else if (ins === 4 || ins === 5) {
        if (!devantLibre(e, k, ins - 3)) e.etape[k] = 2;
        else e.etape[k]++;
      } else if (ins === 6) {
        if (!estBut(e.pos[k])) e.etape[k] = 0;
        else e.etape[k]++;
      }
      // ins === 3 avec la case devant occupée : le robot reste à cette étape, comme l'original.
    }

    function rejouer(): Etat {
      const e: Etat = { pos: niv.depart.map((p) => [p[0], p[1]] as [number, number]), or: niv.orient.slice(), etape: niv.depart.map(() => 0) };
      for (const k of histoire) executer(e, k);
      return e;
    }

    /** Correction originale : réussite et message pour le dernier robot qui a agi. */
    function bilan(e: Etat, dernier: number): { ok: boolean; msg: string } {
      let tousFinis = true;
      for (let k = 0; k < n; k++) if (!fin(e, k)) tousFinis = false;
      if (tousFinis) {
        return version < 2
          ? { ok: false, msg: T('Tous les robots ont terminé, mais le robot 1 ne s’est pas écrasé dans le robot 2. Essayez autrement.', 'All the robots have finished, but robot 1 did not crash into robot 2. Try again.') }
          : { ok: false, msg: T('Tous les robots ont terminé, mais on voudrait qu’ils soient bloqués. Essayez autrement.', 'All the robots have finished, but we want them to be stuck. Try again.') };
      }
      if (version < 2) {
        if (!ecrases(e)) return { ok: false, msg: T('Le robot 1 ne s’est pas écrasé dans le robot 2. Essayez autrement.', 'Robot 1 did not crash into robot 2. Try a different way.') };
        if (dernier === 0) return { ok: true, msg: T('Bravo, vous avez réussi !', 'Well done, you did it!') };
        return { ok: false, msg: T('Le robot 2 s’est écrasé dans le robot 1, mais on voudrait le contraire. Essayez autrement.', 'Robot 2 crashed into robot 1, but we want the other way round. Try again.') };
      }
      for (let k = 0; k < n; k++) {
        if (devantLibre(e, k, 2)) return { ok: false, msg: T(`Le robot ${k + 1} peut encore avancer.`, `Robot ${k + 1} can still move forward.`) };
        if (estBut(e.pos[k])) return { ok: false, msg: T('Tous les robots ont terminé, mais on voudrait qu’ils soient bloqués. Essayez autrement.', 'All the robots have finished, but we want them to be stuck. Try again.') };
      }
      return { ok: true, msg: T('Bravo, vous avez réussi !', 'Well done, you did it!') };
    }

    const grille = el('div', { class: 'defi-grid defi-conc', role: 'grid', 'aria-label': T('Grille', 'Grid') });
    const programmes = el('div', { class: 'defi-progs' });
    const actions = el('div', { class: 'defi-pad' });
    ctx.root.append(grille, programmes, actions);
    fitGrid(grille, N, 44, 2);

    function fleche(o: number, num: number): SVGElement {
      const svg = S('svg', { viewBox: '0 0 40 40', class: 'defi-conc-bot', 'aria-hidden': 'true' });
      // Flèche de la tâche originale (pointe vers le haut), tournée selon l'orientation.
      svg.append(
        S('path', { d: 'M20 4 L36 17 H28 V36 H12 V17 H4 Z', fill: '#c3c3c3', stroke: '#111', 'stroke-width': 1.5, transform: `rotate(${o * 90} 20 20)` }),
        S('text', { x: 20, y: 27, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#111' }, String(num)),
      );
      return svg;
    }

    function render() {
      const e = rejouer();
      const crash = version < 2 && ecrases(e);
      grille.textContent = '';
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cell = el('div', { class: 'defi-cell defi-conc-cell', role: 'gridcell' });
          const ici: number[] = [];
          e.pos.forEach((p, k) => {
            if (p[0] === r && p[1] === c) ici.push(k);
          });
          if (estBut([r, c])) cell.classList.add('is-goal');
          if (ici.length > 1) cell.classList.add('is-crash');
          // En cas de collision, le robot qui a avancé est dessiné par-dessus.
          if (ici.length) {
            const k = ici.length > 1 ? histoire[histoire.length - 1] : ici[0];
            cell.append(fleche(e.or[k], k + 1));
          }
          const quoi = ici.length ? ici.map((k) => T(`robot ${k + 1}`, `robot ${k + 1}`)).join(', ') : estBut([r, c]) ? T('case verte', 'green cell') : T('case blanche', 'white cell');
          cell.setAttribute('aria-label', `${quoi}, ${T('ligne', 'row')} ${r + 1}, ${T('colonne', 'column')} ${c + 1}`);
          grille.append(cell);
        }
      }

      programmes.textContent = '';
      niv.progs.forEach((p, g) => {
        const liste = el('ol', { class: 'defi-prog' });
        p.forEach((ins, i) => {
          const robots: number[] = [];
          for (let k = 0; k < n; k++) if ((niv.progs.length > 1 ? k === g : true) && e.etape[k] === i) robots.push(k);
          const li = el('li', { class: `defi-prog-step${robots.length ? ' is-current' : ''}` }, el('span', { class: 'defi-prog-text' }, T(TEXTES[ins][0], TEXTES[ins][1])));
          if (niv.progs.length === 1) for (const k of robots) li.append(el('span', { class: 'defi-prog-bot', 'aria-label': T(`robot ${k + 1}`, `robot ${k + 1}`) }, String(k + 1)));
          liste.append(li);
        });
        programmes.append(niv.progs.length > 1 ? el('div', { class: 'defi-prog-box' }, el('p', { class: 'defi-legend' }, T(`Robot ${g + 1}`, `Robot ${g + 1}`)), liste) : liste);
      });

      actions.textContent = '';
      for (let k = 0; k < n; k++) {
        const b = el('button', { type: 'button', class: 'lab-btn lab-btn-outline' }, T(`▶ Robot ${k + 1}`, `▶ Robot ${k + 1}`)) as HTMLButtonElement;
        b.setAttribute('aria-label', T(`Exécuter cette instruction pour le robot ${k + 1}`, `Execute this step for robot ${k + 1}`));
        b.disabled = fini || crash || fin(e, k);
        b.addEventListener('click', () => jouer(k));
        actions.append(b);
      }
      btnAnnuler.disabled = histoire.length === 0;
    }

    let fini = false;
    function jouer(k: number) {
      const avant = rejouer();
      const de = avant.etape[k];
      histoire.push(k);
      const e = rejouer();
      const res = bilan(e, k);
      render();
      if (res.ok) {
        fini = true;
        render();
        ctx.result(true, res.msg);
      } else if (version < 2 && ecrases(e)) {
        ctx.result(false, res.msg);
      } else {
        ctx.say(T(`Robot ${k + 1} : de l’étape ${de + 1} à l’étape ${e.etape[k] + 1}.`, `Robot ${k + 1}: from step ${de + 1} to step ${e.etape[k] + 1}.`));
      }
    }

    const btnAnnuler = ctx.btn(T('Annuler', 'Undo'), () => {
      histoire.pop();
      fini = false;
      ctx.say('');
      render();
    });
    ctx.btn(T('Vérifier', 'Check'), () => {
      const res = bilan(rejouer(), histoire.length ? histoire[histoire.length - 1] : -1);
      ctx.result(res.ok, res.msg);
    }, true);
    render();
    ctx.say(T('Touchez le bouton d’un robot pour qu’il exécute l’instruction où il en est.', 'Tap a robot’s button to make it execute the step it is at.'));
  },
};
