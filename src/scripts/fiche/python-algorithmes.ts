import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Recherche dichotomique : une liste triée de 16 nombres, une valeur cherchée choisie au curseur.
 * Chaque étape compare au milieu de la zone [g ; d] et grise la moitié écartée ; le compteur
 * montre qu'il faut au plus 5 comparaisons, contre jusqu'à 16 en lisant la liste une par une.
 */

const L = [2, 5, 8, 12, 16, 23, 38, 41, 47, 56, 61, 72, 77, 85, 91, 99];
const W = 640;
const CELL = 38;
const X0 = (W - CELL * L.length) / 2;

export const figure: FicheFigure = {
  size: [W, 170],
  label: {
    fr: 'Une liste triée de seize nombres dans laquelle on cherche une valeur par dichotomie : à chaque étape, on compare au milieu et on écarte une moitié.',
    en: 'A sorted list of sixteen numbers searched by bisection: at each step, compare with the middle and discard one half.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    let cible = 61;
    let g = 0;
    let d = L.length - 1;
    let n = 0;
    let fini = false;

    const cells = L.map((v, i) => {
      const x = X0 + i * CELL;
      const r = S('rect', { x: x + 2, y: 50, width: CELL - 4, height: 40, rx: 6, fill: C.surface, stroke: C.line, 'stroke-width': 2 });
      const t = S('text', { x: x + CELL / 2, y: 75, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: C.ink }, String(v));
      const idx = S('text', { x: x + CELL / 2, y: 106, 'text-anchor': 'middle', 'font-size': 10, fill: C.muted }, String(i));
      const g0 = S('g', {}, r, t, idx);
      fig.svg.append(g0);
      return { g: g0, r, t };
    });
    const marks = S('text', { x: W / 2, y: 140, 'text-anchor': 'middle', 'font-size': 13, fill: C.muted }, '');
    const titre = S('text', { x: W / 2, y: 28, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: C.ink }, '');
    fig.svg.append(titre, marks);

    const paint = (m = -1) => {
      cells.forEach(({ g: grp, r, t }, i) => {
        const dans = i >= g && i <= d && !fini;
        grp.setAttribute('opacity', dans || i === m ? '1' : '0.3');
        const trouve = fini && L[i] === cible;
        r.style.setProperty('fill', i === m || trouve ? C.primary : dans ? C.soft : C.surface);
        r.style.setProperty('stroke', i === m || trouve ? C.primary : C.line);
        t.style.setProperty('fill', i === m || trouve ? '#fff' : C.ink);
      });
      titre.textContent = T(`On cherche ${cible}`, `Searching for ${cible}`);
      marks.textContent = fini ? '' : T(`zone : g = ${g}, d = ${d}   ·   comparaisons : ${n}`, `zone: g = ${g}, d = ${d}   ·   comparisons: ${n}`);
    };

    const reset = () => {
      run.next();
      g = 0;
      d = L.length - 1;
      n = 0;
      fini = false;
      paint();
      fig.say(T('Avance pas à pas : à chaque étape on regarde le milieu m = (g + d) // 2.', 'Step forward: at each step look at the middle m = (g + d) // 2.'));
    };

    /** Une étape ; renvoie false quand la recherche est terminée. */
    const etape = (): boolean => {
      if (fini) return false;
      if (g > d) {
        fini = true;
        paint();
        fig.say(T(`Zone vide après ${n} comparaisons : ${cible} n’est pas dans la liste.`, `Empty zone after ${n} comparisons: ${cible} is not in the list.`));
        return false;
      }
      const m = Math.floor((g + d) / 2);
      n++;
      if (L[m] === cible) {
        fini = true;
        paint(m);
        fig.say(T(`l[${m}] = ${cible} : trouvé en ${n} comparaison${n > 1 ? 's' : ''} (une par une, il en aurait fallu ${m + 1}).`, `l[${m}] = ${cible}: found in ${n} comparison${n > 1 ? 's' : ''} (one by one would take ${m + 1}).`));
        return false;
      }
      if (L[m] < cible) {
        fig.say(T(`l[${m}] = ${L[m]} < ${cible} : la cible est à droite, g = ${m + 1}.`, `l[${m}] = ${L[m]} < ${cible}: the target is on the right, g = ${m + 1}.`));
        g = m + 1;
      } else {
        fig.say(T(`l[${m}] = ${L[m]} > ${cible} : la cible est à gauche, d = ${m - 1}.`, `l[${m}] = ${L[m]} > ${cible}: the target is on the left, d = ${m - 1}.`));
        d = m - 1;
      }
      paint(m);
      return true;
    };

    fig.range(T('valeur cherchée', 'target'), 0, 100, cible, 1, (v) => {
      cible = v;
      reset();
    });
    fig.btn(T('Étape suivante', 'Next step'), () => {
      run.next();
      etape();
    }, true);
    fig.btn(T('▶ Jusqu’au bout', '▶ Run to the end'), async () => {
      const alive = run.token();
      while (alive() && etape()) await sleep(700);
    });
    fig.btn(T('Recommencer', 'Restart'), reset);
    reset();
  },
};
