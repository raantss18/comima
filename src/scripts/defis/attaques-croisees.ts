/**
 * Attaques croisées — adapté de la tâche « Attaques croisées » du Concours Castor 2018
 * (France-ioi), CC BY-SA 3.0. Grille 7 × 7, positions de départ des jetons, diagrammes
 * objectifs et règle d'origine : deux jetons sont reliés s'ils sont sur la même rangée ou
 * sur la même colonne. Le diagramme de l'élève est recalculé à chaque déplacement et
 * comparé trait par trait à l'objectif affiché.
 */
import { el } from '../lab/core';
import { S, C } from '../fiche/core';
import { fitGrid, type DefiModule } from './core';

const N = 7;
const NIVEAUX: { jetons: [number, number][]; graphe: [number, number][]; objectif: string[] }[] = [
  {
    // [colonne, rangée] de départ ; positions du diagramme (repère 200 × 200).
    jetons: [[1, 1], [4, 2], [1, 5], [5, 4]],
    graphe: [[20, 30], [120, 50], [40, 130], [140, 150]],
    objectif: ['AB', 'BC', 'CD'],
  },
  {
    jetons: [[1, 1], [6, 0], [5, 4], [1, 5], [4, 2]],
    graphe: [[55, 30], [145, 30], [30, 115], [170, 115], [100, 160]],
    objectif: ['AB', 'AC', 'BC', 'BD', 'CE', 'DE'],
  },
  {
    jetons: [[5, 1], [3, 3], [4, 6], [1, 5], [6, 2], [1, 1], [3, 0], [5, 5]],
    graphe: [[20, 60], [20, 120], [140, 170], [70, 20], [70, 170], [180, 120], [180, 60], [140, 20]],
    objectif: ['AD', 'AG', 'DG', 'DF', 'CD', 'CF', 'CH', 'EH', 'CE', 'BE', 'BF'],
  },
];
const LETTRES = 'ABCDEFGH';
const cle = (i: number, j: number) => LETTRES[Math.min(i, j)] + LETTRES[Math.max(i, j)];

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const niv = NIVEAUX[version];
    const n = niv.jetons.length;
    const pos = niv.jetons.map(([c, r]) => ({ c, r }));
    // Objectif normalisé (lettres dans l'ordre : « EB » devient « BE »).
    const objectif = niv.objectif.map((e) => cle(LETTRES.indexOf(e[0]), LETTRES.indexOf(e[1])));
    let choisi = -1;
    let fini = false;
    let rouge = '';

    const grille = el('div', { class: 'defi-grid defi-checkers', role: 'grid', 'aria-label': T('Grille', 'Grid') });
    const vues = el('div', { class: 'defi-graphs' });
    ctx.root.append(grille, vues);
    fitGrid(grille, N, 44, 2);

    function traits(): string[] {
      const t: string[] = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (pos[i].c === pos[j].c || pos[i].r === pos[j].r) t.push(cle(i, j));
      return t;
    }

    function dessin(titre: string, aretes: string[]): HTMLElement {
      const svg = S('svg', { viewBox: '0 0 200 190', class: 'defi-graph', role: 'img', 'aria-label': `${titre} ${aretes.join(', ') || '—'}` });
      for (const a of aretes) {
        const [p, q] = [niv.graphe[LETTRES.indexOf(a[0])], niv.graphe[LETTRES.indexOf(a[1])]];
        svg.append(S('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: a === rouge ? '#d6362b' : C.ink, 'stroke-width': a === rouge ? 5 : 2.5 }));
      }
      niv.graphe.forEach(([x, y], i) => {
        svg.append(S('circle', { cx: x, cy: y, r: 13, fill: '#ffd54f', stroke: '#111', 'stroke-width': 2 }));
        svg.append(S('text', { x, y: y + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#111' }, LETTRES[i]));
      });
      return el('figure', { class: 'defi-graph-fig' }, el('figcaption', { class: 'defi-legend' }, titre), svg);
    }

    function render() {
      grille.textContent = '';
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const k = pos.findIndex((p) => p.c === c && p.r === r);
          const b = el('button', { type: 'button', class: 'defi-cell', role: 'gridcell' }) as HTMLButtonElement;
          if (k >= 0) b.append(el('span', { class: 'defi-token' }, LETTRES[k]));
          if (k >= 0 && k === choisi) b.classList.add('is-selected');
          else if (choisi >= 0 && (pos[choisi].c === c || pos[choisi].r === r)) b.classList.add('is-line');
          b.setAttribute('aria-label', `${k >= 0 ? T(`jeton ${LETTRES[k]}`, `token ${LETTRES[k]}`) : T('case vide', 'empty cell')}, ${T('rangée', 'row')} ${r + 1}, ${T('colonne', 'column')} ${c + 1}`);
          b.addEventListener('click', () => toucher(c, r, k));
          grille.append(b);
        }
      }
      vues.textContent = '';
      vues.append(dessin(T('Objectif :', 'Target:'), objectif), dessin(T('Votre diagramme :', 'Your diagram:'), traits()));
    }

    function toucher(c: number, r: number, k: number) {
      if (fini) return;
      rouge = '';
      if (k >= 0) choisi = k === choisi ? -1 : k;
      else if (choisi >= 0) {
        pos[choisi] = { c, r };
        choisi = -1;
      }
      ctx.say('');
      render();
      const t = traits();
      if (t.length === objectif.length && t.every((a) => objectif.indexOf(a) >= 0)) {
        fini = true;
        ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      }
    }

    ctx.btn(T('Vérifier', 'Check'), () => {
      const t = traits();
      const enTrop = t.find((a) => objectif.indexOf(a) < 0);
      const manque = objectif.find((a) => t.indexOf(a) < 0);
      choisi = -1;
      rouge = enTrop || manque || '';
      render();
      if (enTrop) ctx.result(false, T('Le trait marqué en rouge n’est pas présent dans l’objectif.', 'The line marked in red is not in the target.'));
      else if (manque) ctx.result(false, T('Le trait marqué en rouge manque dans la situation actuelle.', 'The line marked in red is missing from the current situation.'));
      else ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
    }, true);
    render();
    ctx.say(T('Touchez un jeton, puis la case où le déplacer.', 'Tap a token, then the cell to move it to.'));
  },
};
