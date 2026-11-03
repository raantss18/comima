/**
 * Choix des invités — adapté de la tâche « Choix des invités » (version 2013-FR-12b) du
 * Concours Castor 2013 (Arthur Charguéraud, Luc Baille, Mahdi Miled, France-ioi),
 * CC BY-SA 3.0. Graphe d'origine (17 personnes, 30 liens) et objectif de 8 invités.
 */
import { el } from '../lab/core';
import { S, C } from '../fiche/core';
import type { DefiModule } from './core';

const NOEUDS: [number, number][] = [
  [252, 18], [133, 24], [80, 73], [28, 132], [48, 207],
  [210, 259], [162, 204], [102, 172], [170, 115], [206, 63],
  [258, 108], [351, 73], [325, 145], [405, 160], [350, 210],
  [293, 259], [233, 170],
];
const LIENS: [number, number][] = [
  [0, 1], [0, 10], [1, 2], [1, 9], [2, 3], [2, 7], [2, 8], [3, 7], [3, 4], [3, 8],
  [4, 5], [5, 6], [5, 16], [6, 7], [6, 16], [7, 8], [8, 9], [8, 16], [9, 10], [10, 11],
  [10, 12], [10, 16], [11, 12], [12, 13], [12, 14], [12, 16], [13, 14], [14, 15], [14, 16], [15, 16],
];
const OBJECTIF = 8;

export const defi: DefiModule = {
  mount(ctx) {
    const { T } = ctx;
    const choisis = NOEUDS.map(() => false);
    const svg = S('svg', { viewBox: '0 0 450 290', class: 'defi-svg', role: 'group', 'aria-label': T('Diagramme des personnes', 'Diagram of the people') });
    const traits = LIENS.map(([a, b]) => {
      const l = S('line', { x1: NOEUDS[a][0] + 15, y1: NOEUDS[a][1] + 8, x2: NOEUDS[b][0] + 15, y2: NOEUDS[b][1] + 8, stroke: C.ink, 'stroke-width': 2 });
      svg.append(l);
      return l;
    });
    const ronds = NOEUDS.map(([x, y], i) => {
      const c = S('circle', { cx: x + 15, cy: y + 8, r: 19, fill: C.surface, stroke: C.ink, 'stroke-width': 2, tabindex: 0, role: 'checkbox', 'aria-checked': 'false', 'aria-label': T(`Personne ${i + 1}`, `Person ${i + 1}`), class: 'defi-node' });
      c.addEventListener('click', () => basculer(i));
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          basculer(i);
        }
      });
      svg.append(c);
      return c;
    });
    const info = el('p', { class: 'defi-bilan' });
    ctx.root.append(svg, info);

    function basculer(i: number) {
      choisis[i] = !choisis[i];
      maj();
    }

    function maj() {
      let n = 0;
      choisis.forEach((s, i) => {
        if (s) n++;
        ronds[i].style.setProperty('fill', s ? '#aaaaff' : C.surface);
        ronds[i].setAttribute('aria-checked', String(s));
      });
      let conflit = false;
      LIENS.forEach(([a, b], k) => {
        const mauvais = choisis[a] && choisis[b];
        if (mauvais) conflit = true;
        traits[k].style.setProperty('stroke', mauvais ? C.accent : C.ink);
        traits[k].setAttribute('stroke-width', mauvais ? '4' : '2');
      });
      info.textContent = T(`Nombre d’invités sélectionnés : ${n}.`, `Number of guests selected: ${n}.`);
      if (conflit) ctx.result(false, T('Attention : certains invités se connaissent.', 'Careful: some guests know each other.'));
      else if (n === OBJECTIF) ctx.result(true, T('Félicitations, vous avez réussi !', 'Congratulations, you did it!'));
      else ctx.say('');
    }

    maj();
    ctx.say(T('Cliquez sur les ronds pour sélectionner ou désélectionner une personne.', 'Click the circles to select or deselect a person.'));
  },
};
