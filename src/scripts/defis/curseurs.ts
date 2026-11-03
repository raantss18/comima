/**
 * Curseurs — adapté de la tâche « Curseurs » du Concours Castor 2019 (Arthur Charguéraud,
 * Mathias Hiron, France-ioi), CC BY-SA 3.0. Nombre de curseurs, nombre de crans, liste des
 * 64 symboles, objectifs et règle d'origine : chaque groupe de curseurs désigne un symbole
 * de la liste. Le résultat est recalculé à chaque déplacement ; la vérification le compare
 * à l'objectif affiché.
 */
import { el } from '../lab/core';
import type { DefiModule } from './core';

const NIVEAUX = [
  { nSliders: 2, nGraduations: 8, target: ['R'] },
  { nSliders: 6, nGraduations: 4, target: ['Z', 'h'] },
  { nSliders: 18, nGraduations: 2, target: ['H', 'w', 'b'] },
];
const SYMBOLES = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '#', '@',
];

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const { nSliders, nGraduations: g, target } = NIVEAUX[version];
    const parSymbole = nSliders / target.length;
    const horizontal = version === 0; // comme l'original : curseurs horizontaux en ★, verticaux ensuite
    const valeurs = new Array(nSliders).fill(0);
    let actif = 0; // symbole modifié en dernier, repéré dans la liste
    let fini = false;

    const curseurs = el('div', { class: `defi-sliders${horizontal ? ' is-horizontal' : ''}` });
    const lignes = el('div', { class: 'defi-sym-rows' });
    const liste = el('div', { class: 'defi-symbols', 'aria-hidden': 'true' });
    ctx.root.append(el('p', { class: 'defi-legend' }, T('Curseurs', 'Sliders')), curseurs, lignes, liste);

    function symbole(i: number): string {
      let v = 0;
      for (let s = i * parSymbole; s < (i + 1) * parSymbole; s++) v = v * g + valeurs[s];
      return SYMBOLES[v];
    }

    function render() {
      curseurs.textContent = '';
      for (let i = 0; i < target.length; i++) {
        const groupe = el('div', { class: 'defi-slider-group' });
        for (let s = i * parSymbole; s < (i + 1) * parSymbole; s++) {
          const c = el('div', { class: 'defi-slider', role: 'radiogroup', 'aria-label': T(`Curseur ${s + 1}`, `Slider ${s + 1}`) });
          // Vertical : le cran 0 est en bas ; horizontal : à gauche.
          for (let k = 0; k < g; k++) {
            const v = horizontal ? k : g - 1 - k;
            const b = el('button', { type: 'button', class: 'defi-notch', role: 'radio' }) as HTMLButtonElement;
            b.setAttribute('aria-checked', String(valeurs[s] === v));
            b.setAttribute('aria-label', T(`cran ${v + 1}`, `notch ${v + 1}`));
            b.addEventListener('click', () => {
              if (fini) return;
              valeurs[s] = v;
              actif = i;
              ctx.say('');
              render();
              if (target.every((t, j) => symbole(j) === t)) {
                fini = true;
                ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
              }
            });
            c.append(b);
          }
          groupe.append(c);
        }
        curseurs.append(groupe);
      }

      lignes.textContent = '';
      const res = el('div', { class: 'defi-sym-row' }, el('span', { class: 'defi-legend' }, T('Résultat', 'Result')));
      const obj = el('div', { class: 'defi-sym-row' }, el('span', { class: 'defi-legend' }, T('Objectif', 'Target')));
      target.forEach((t, i) => {
        const r = symbole(i);
        res.append(el('span', { class: `defi-sym-big${i === actif ? ' is-active' : ''}${r === t ? ' is-ok' : ''}` }, r));
        obj.append(el('span', { class: 'defi-sym-big' }, t));
      });
      res.setAttribute('aria-label', T(`Résultat : ${target.map((_, i) => symbole(i)).join(' ')}`, `Result: ${target.map((_, i) => symbole(i)).join(' ')}`));
      lignes.append(res, obj);

      liste.textContent = '';
      const courant = SYMBOLES.indexOf(symbole(actif));
      const vise = SYMBOLES.indexOf(target[actif]);
      SYMBOLES.forEach((s, k) => {
        liste.append(el('span', { class: `defi-sym${k === courant ? ' is-current' : ''}${k === vise ? ' is-target' : ''}` }, s));
      });
    }

    ctx.btn(T('Vérifier', 'Check'), () => {
      for (let i = 0; i < target.length; i++) {
        const r = symbole(i);
        if (r !== target[i]) {
          actif = i;
          render();
          ctx.result(
            false,
            r.toUpperCase() === target[i].toUpperCase()
              ? T(`Le symbole ${i + 1} est en majuscule d’un côté et en minuscule de l’autre.`, `Symbol ${i + 1} is uppercase on one side and lowercase on the other.`)
              : T(`Le symbole ${i + 1} est différent de l’objectif.`, `Symbol ${i + 1} differs from the target.`),
          );
          return;
        }
      }
      ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
    }, true);
    render();
    ctx.say(T('Touchez un cran pour y placer le curseur. Dans la liste, le symbole obtenu est surligné et l’objectif encadré.', 'Tap a notch to move the slider there. In the list, the symbol you get is highlighted and the target is framed.'));
  },
};
