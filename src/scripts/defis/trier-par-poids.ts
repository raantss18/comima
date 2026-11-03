/**
 * Trier par poids — adapté de la tâche « Trier par poids » du Concours Castor 2013
 * (France-ioi), CC BY-SA 3.0. Six frisbees de poids différents, tirés au hasard à chaque
 * partie (comme l'original) ; la balance compare deux frisbees. Aucun ordre n'est fixé
 * à l'avance : la vérification compare les poids tirés pour cette partie.
 */
import { el } from '../lab/core';
import type { DefiModule } from './core';

const NOMS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COULEURS = ['#ffff00', '#00ffff', '#ff00ff', '#4d6bff', '#ff4d4d', '#00e000'];

export const defi: DefiModule = {
  mount(ctx) {
    const { T } = ctx;
    // Poids 1 à 6 mélangés (Fisher-Yates), comme dans la tâche originale.
    const poids = [1, 2, 3, 4, 5, 6];
    for (let i = poids.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      const t = poids[i];
      poids[i] = poids[k];
      poids[k] = t;
    }
    const etagere = [0, 1, 2, 3, 4, 5]; // indices des frisbees, de gauche à droite
    let choisis: number[] = [];
    let pesees = 0;
    const journal: string[] = [];

    const balance = el('p', { class: 'defi-balance', 'aria-live': 'polite' }, '⚖');
    const rangee = el('div', { class: 'defi-shelf', role: 'list', 'aria-label': T('Étagère, du plus léger (à gauche) au plus lourd (à droite)', 'Shelf, from lightest (left) to heaviest (right)') });
    const notes = el('p', { class: 'defi-bilan muted' });
    const actions = el('div', { class: 'defi-pad' });
    ctx.root.append(balance, rangee, actions, notes);

    const btnComparer = el('button', { type: 'button', class: 'lab-btn lab-btn-outline' }, T('⚖ Comparer', '⚖ Compare')) as HTMLButtonElement;
    const btnEchanger = el('button', { type: 'button', class: 'lab-btn lab-btn-outline' }, T('⇄ Échanger', '⇄ Swap')) as HTMLButtonElement;
    actions.append(btnComparer, btnEchanger);

    btnComparer.addEventListener('click', () => {
      if (choisis.length !== 2) return;
      const [a, b] = choisis;
      const leger = poids[a] < poids[b] ? a : b;
      const lourd = leger === a ? b : a;
      pesees++;
      const msg = T(`${NOMS[leger]} est plus léger que ${NOMS[lourd]}.`, `${NOMS[leger]} is lighter than ${NOMS[lourd]}.`);
      balance.textContent = `⚖ ${NOMS[leger]} < ${NOMS[lourd]}`;
      journal.push(`${NOMS[leger]} < ${NOMS[lourd]}`);
      choisis = [];
      ctx.say(msg);
      render();
    });
    btnEchanger.addEventListener('click', () => {
      if (choisis.length !== 2) return;
      const pa = etagere.indexOf(choisis[0]);
      const pb = etagere.indexOf(choisis[1]);
      etagere[pa] = choisis[1];
      etagere[pb] = choisis[0];
      choisis = [];
      ctx.say('');
      render();
    });

    function render() {
      rangee.textContent = '';
      etagere.forEach((f, pos) => {
        const b = el('button', { type: 'button', class: 'defi-frisbee', role: 'listitem', style: `background:${COULEURS[f]}` }, NOMS[f]) as HTMLButtonElement;
        if (choisis.indexOf(f) >= 0) b.classList.add('is-selected');
        b.setAttribute('aria-label', T(`Frisbee ${NOMS[f]}, place ${pos + 1}`, `Frisbee ${NOMS[f]}, place ${pos + 1}`));
        b.addEventListener('click', () => {
          const k = choisis.indexOf(f);
          if (k >= 0) choisis.splice(k, 1);
          else choisis = choisis.length >= 2 ? [f] : choisis.concat([f]);
          render();
        });
        rangee.append(b);
      });
      btnComparer.disabled = choisis.length !== 2;
      btnEchanger.disabled = choisis.length !== 2;
      notes.textContent = journal.length ? T(`Pesées (${pesees}) : ${journal.join(' ; ')}`, `Weighings (${pesees}): ${journal.join('; ')}`) : T('Touchez deux frisbees, puis comparez-les ou échangez-les.', 'Tap two frisbees, then compare or swap them.');
    }

    ctx.btn(T('Vérifier', 'Check'), () => {
      for (let i = 0; i + 1 < etagere.length; i++) {
        if (poids[etagere[i]] > poids[etagere[i + 1]]) {
          ctx.result(false, T('Ce n’est pas la bonne réponse.', 'That is not the right answer.'));
          return;
        }
      }
      ctx.result(true, T(`Bravo, vous avez réussi ! (${pesees} pesées)`, `Well done, you did it! (${pesees} weighings)`));
    }, true);
    render();
  },
};
