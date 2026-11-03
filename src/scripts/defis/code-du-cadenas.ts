/**
 * Code du cadenas — adapté de la tâche « Code du cadenas » du Concours Castor 2015
 * (Arthur Charguéraud, France-ioi), CC BY-SA 3.0.
 * Les codes à essayer ne sont pas stockés : ils sont reconnus par les règles de la
 * consigne. Le cadenas s'ouvre quand tous les codes qui respectent ces règles ont été
 * essayés ; le nombre d'étapes (version 3) compte chaque chiffre changé.
 */
import { el } from '../lab/core';
import type { DefiModule } from './core';

const nb = (code: string, ch: string) => code.split(ch).length - 1;

/** Règles des trois versions (consignes d'origine). */
const REGLES: ((code: string) => boolean)[] = [
  (c) => c[0] === '8' && nb(c, '5') === 2 && nb(c, '3') === 1,
  (c) => c[0] === '8' && nb(c, '5') === 2 && (nb(c, '1') + nb(c, '2') === 1),
  (c) => nb(c, '3') === 2 && nb(c, '5') === 2,
];
/** Nombre d'étapes visé en version 3 (tâche originale). */
const MEILLEUR = 14;

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const regle = REGLES[version];
    let total = 0;
    for (let n = 0; n < 10000; n++) if (regle(String(n).padStart(4, '0'))) total++;
    const etat = [0, 0, 0, 0];
    const trouves: string[] = [];
    let etapes = 0;

    const cadenas = el('div', { class: 'defi-lock' });
    const anse = el('div', { class: 'defi-lock-ring', 'aria-hidden': 'true' });
    const corps = el('div', { class: 'defi-lock-body' });
    cadenas.append(anse, corps);
    const compteur = el('p', { class: 'defi-bilan' });
    const liste = el('p', { class: 'defi-bilan muted' });
    ctx.root.append(cadenas, compteur, liste);

    const code = () => etat.join('');

    function render() {
      corps.textContent = '';
      for (let d = 0; d < 4; d++) {
        const ligne = el('div', { class: 'defi-lock-row', role: 'radiogroup', 'aria-label': T(`Chiffre ${d + 1}`, `Digit ${d + 1}`) });
        for (let v = 0; v < 10; v++) {
          const b = el('button', { type: 'button', class: 'defi-lock-digit', role: 'radio', 'aria-checked': String(etat[d] === v) }, String(v)) as HTMLButtonElement;
          b.addEventListener('click', () => choisir(d, v));
          ligne.append(b);
        }
        ligne.append(el('span', { class: 'defi-lock-shown', 'aria-hidden': 'true' }, String(etat[d])));
        corps.append(ligne);
      }
      cadenas.classList.toggle('is-open', trouves.length === total);
      compteur.textContent = version === 2 ? T(`Nombre d’étapes effectuées : ${etapes}.`, `Steps taken: ${etapes}.`) : '';
      liste.textContent = trouves.length ? T(`Codes trouvés : ${trouves.join(', ')}.`, `Codes found: ${trouves.join(', ')}.`) : '';
    }

    function choisir(d: number, v: number) {
      if (trouves.length === total || etat[d] === v) return;
      etat[d] = v;
      etapes++;
      const c = code();
      let msg = '';
      if (regle(c)) {
        if (trouves.indexOf(c) < 0) {
          trouves.push(c);
          msg = T('Vous avez trouvé un nouveau code.', 'You found a new code.');
        } else msg = T('Vous aviez déjà trouvé ce code.', 'You had already found this code.');
      }
      render();
      if (trouves.length === total) {
        if (version === 2 && etapes > MEILLEUR) {
          ctx.result(false, T(`Le cadenas est ouvert : vous avez testé toutes les possibilités en ${etapes} étapes. Recommencez pour essayer en ${MEILLEUR} étapes.`, `The lock is open: you tried every possibility in ${etapes} steps. Start again and try in ${MEILLEUR} steps.`));
        } else ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      } else ctx.say(msg);
    }

    render();
    ctx.say(T('Cliquez dans les cases pour modifier le code.', 'Click the boxes to change the code.'));
  },
};
