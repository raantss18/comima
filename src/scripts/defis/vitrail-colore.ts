/**
 * Vitrail coloré — adapté de la tâche « Vitrail coloré » du Concours Castor 2013 (Arthur
 * Charguéraud, France-ioi), CC BY-SA 3.0. Tracés des morceaux, voisinages, quatre couleurs
 * et règle d'origine : aucun morceau blanc, et deux morceaux qui se touchent n'ont pas la
 * même couleur. La vérification contrôle seulement ces deux règles.
 */
import { el } from '../lab/core';
import { S } from '../fiche/core';
import type { DefiModule } from './core';
import { VITRAUX } from './donnees/vitrail';

const COULEURS = ['#ffffff', 'yellow', '#FF6060', '#60FF60', '#6060FF'];
/** Morceaux dessinés dans un repère décalé dans l'original (contour, cercles du bas). */
const DECALES = [[0, 10], [0, 8, 19], [0]];
const DECALAGE = 'translate(-121.85521 -238.18085)';

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const v = VITRAUX[version];
    const n = v.voisins.length;
    const lettres = ['', T('J', 'Y'), 'R', T('V', 'G'), 'B'];
    const noms = ['', T('jaune', 'yellow'), T('rouge', 'red'), T('vert', 'green'), T('bleu', 'blue')];
    const couleur = new Array(n).fill(0);
    let crayon = 1;
    let fini = false;

    const palette = el('div', { class: 'defi-pad', role: 'radiogroup', 'aria-label': T('Choisissez une couleur', 'Choose a colour') });
    const svg = S('svg', { viewBox: '0 0 410 410', class: 'defi-vitrail', role: 'group', 'aria-label': T('Vitrail', 'Stained-glass window') });
    const reste = el('p', { class: 'defi-bilan' });
    ctx.root.append(palette, svg, reste);

    function conflit(): boolean {
      for (let a = 0; a < n; a++) for (const b of v.voisins[a]) if (couleur[a] && couleur[a] === couleur[b]) return true;
      return false;
    }

    function render() {
      palette.textContent = '';
      for (let k = 1; k <= 4; k++) {
        const b = el('button', { type: 'button', class: 'defi-swatch', role: 'radio', 'aria-label': noms[k] }, lettres[k]) as HTMLButtonElement;
        b.style.background = COULEURS[k];
        b.setAttribute('aria-checked', String(k === crayon));
        b.addEventListener('click', () => {
          crayon = k;
          render();
        });
        palette.append(b);
      }

      svg.textContent = '';
      // Fond noir et morceaux : repères de la tâche originale (échelle 0,8).
      svg.append(S('circle', { cx: 203.2, cy: 200, r: 192, fill: '#000' }));
      const g = S('g', { transform: 'scale(0.8)' });
      v.traces.forEach((d, i) => {
        const decale = DECALES[version].indexOf(i) >= 0;
        const p = S('path', { d, fill: COULEURS[couleur[i]], stroke: '#000', 'stroke-width': 2.86, class: 'defi-piece', tabindex: 0, role: 'button', transform: decale ? DECALAGE : undefined });
        p.setAttribute('aria-label', T(`Morceau ${i + 1}${i === 0 ? ' (contour)' : ''} : ${couleur[i] ? noms[couleur[i]] : 'blanc'}`, `Piece ${i + 1}${i === 0 ? ' (border)' : ''}: ${couleur[i] ? noms[couleur[i]] : 'white'}`));
        p.addEventListener('click', () => colorier(i));
        p.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            colorier(i);
          }
        });
        g.append(p);
      });
      v.lettres.forEach(([x, y], i) => {
        if (!couleur[i]) return;
        const t = S('text', { x, y, 'font-size': 30, fill: '#000', 'pointer-events': 'none', transform: `translate(12.5 -8.75) ${DECALAGE}` }, lettres[couleur[i]]);
        g.append(t);
      });
      svg.append(g);
      const blancs = couleur.filter((c) => !c).length;
      reste.textContent = blancs === 1 ? T('Il vous reste 1 morceau à colorier.', 'You have 1 piece left to colour.') : T(`Il vous reste ${blancs} morceaux à colorier.`, `You have ${blancs} pieces left to colour.`);
    }

    function colorier(i: number) {
      if (fini) return;
      couleur[i] = couleur[i] === crayon ? 0 : crayon;
      render();
      const blancs = couleur.filter((c) => !c).length;
      if (conflit()) ctx.result(false, T('Attention : des morceaux qui se touchent ont la même couleur !', 'Careful: pieces that touch have the same colour!'));
      else if (blancs === 0) {
        fini = true;
        ctx.result(true, T('Bravo ! Vous avez tout colorié correctement.', 'Well done! You coloured everything correctly.'));
      } else if (blancs === 1 && !couleur[0]) ctx.say(T('N’oubliez pas de colorier le contour du vitrail !', 'Do not forget to colour the border of the window!'));
      else ctx.say('');
    }

    ctx.btn(T('Vérifier', 'Check'), () => {
      if (couleur.some((c) => !c)) ctx.result(false, T('Vous n’avez pas colorié tous les morceaux.', 'You have not coloured all the pieces.'));
      else if (conflit()) ctx.result(false, T('Des morceaux qui se touchent ont la même couleur !', 'Pieces that touch have the same colour!'));
      else ctx.result(true, T('Bravo ! Vous avez tout colorié correctement.', 'Well done! You coloured everything correctly.'));
    }, true);
    render();
    ctx.say(T('Choisissez une couleur, puis touchez les morceaux à colorier ; touchez à nouveau un morceau pour l’effacer.', 'Choose a colour, then tap the pieces to colour; tap a piece again to clear it.'));
  },
};
