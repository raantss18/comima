/**
 * Traverser le pont — adapté de la tâche « Traverser le pont » du Concours Castor 2014
 * (Mathias Hiron, France-ioi), CC BY-SA 3.0. Poids des bûches, charge maximale et règle
 * d'origine : deux bûches qui se suivent sont ensemble sur le pont, leur poids total ne
 * doit pas dépasser la charge maximale. On échange deux bûches en les touchant l'une après l'autre.
 */
import { el } from '../lab/core';
import type { DefiModule } from './core';

const NIVEAUX = [
  { max: 6, poids: [5, 4, 1, 2] },
  { max: 10, poids: [3, 6, 7, 4, 9, 2, 1, 8] },
  { max: 14, poids: [2, 6, 12, 1, 9, 11, 5, 3, 13, 8, 4, 10] },
];

export const defi: DefiModule = {
  mount(ctx) {
    const { T } = ctx;
    const niv = NIVEAUX[ctx.version];
    const ordre = niv.poids.slice();
    let choisi = -1;
    let fautives: number[] = [];

    const pont = el('div', { class: 'defi-bridge' }, el('span', {}, T(`Pont : ${niv.max} kg au maximum`, `Bridge: ${niv.max} kg at most`)));
    const file = el('div', { class: 'defi-logs', role: 'list', 'aria-label': T('Bûches, dans l’ordre de passage', 'Logs, in crossing order') });
    ctx.root.append(pont, file);

    function render() {
      file.textContent = '';
      ordre.forEach((p, i) => {
        const b = el('button', { type: 'button', class: 'defi-log', role: 'listitem' }, `${p}`) as HTMLButtonElement;
        if (i === choisi) b.classList.add('is-selected');
        if (fautives.indexOf(i) >= 0) b.classList.add('is-wrong');
        b.setAttribute('aria-label', T(`Bûche de ${p} kg, position ${i + 1}`, `${p} kg log, position ${i + 1}`));
        b.addEventListener('click', () => toucher(i));
        file.append(b);
      });
    }

    function toucher(i: number) {
      fautives = [];
      if (choisi < 0) choisi = i;
      else {
        const t = ordre[choisi];
        ordre[choisi] = ordre[i];
        ordre[i] = t;
        choisi = -1;
      }
      ctx.say('');
      render();
    }

    ctx.btn(T('Essayer', 'Try'), () => {
      choisi = -1;
      fautives = [];
      for (let i = 0; i + 1 < ordre.length; i++) {
        if (ordre[i] + ordre[i + 1] > niv.max) {
          fautives = [i, i + 1];
          render();
          ctx.result(false, T(`Le pont s’est écroulé ! (${ordre[i]} kg + ${ordre[i + 1]} kg)`, `The bridge collapsed! (${ordre[i]} kg + ${ordre[i + 1]} kg)`));
          return;
        }
      }
      render();
      ctx.result(true, T('Bravo, toutes les bûches ont traversé le pont !', 'Well done, every log crossed the bridge!'));
    }, true);
    render();
    ctx.say(T('Les bûches passent de gauche à droite ; le pont porte deux bûches à la fois. Touchez deux bûches pour les échanger.', 'Logs cross from left to right; the bridge holds two logs at a time. Tap two logs to swap them.'));
  },
};
