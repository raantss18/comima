import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Stratégie par appariement : sur une grille 4 × 4 découpée en dominos, chacun noircit à son
 * tour une case libre ; celui qui ne peut plus jouer perd. Tu commences ; l'ordinateur répond
 * toujours sur l'autre case du domino que tu viens d'entamer : elle est forcément libre, donc
 * il a toujours un coup, et c'est toi qui seras bloqué.
 */

const W = 360;
const H = 290;
const N = 4;
const CELL = 56;
const X0 = (W - N * CELL) / 2;
const Y0 = 40;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Une grille quatre sur quatre découpée en dominos ; l’ordinateur répond toujours dans le même domino que ton coup.',
    en: 'A four-by-four grid cut into dominoes; the computer always answers in the same domino as your move.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const etat: number[] = new Array(N * N).fill(0); // 0 libre, 1 toi, 2 ordinateur
    let voirDominos = true;
    const partenaire = (i: number) => (i % 2 === 0 ? i + 1 : i - 1); // dominos horizontaux (0,1), (2,3)…
    const dominos = S('g');
    fig.svg.append(S('text', { x: W / 2, y: 24, 'text-anchor': 'middle', 'font-size': 13, fill: C.muted }, T('toi : vert · ordinateur : orange', 'you: green · computer: orange')), dominos);
    const cases = etat.map((_, i) => {
      const x = X0 + (i % N) * CELL;
      const y = Y0 + Math.floor(i / N) * CELL;
      const r = S('rect', { x: x + 4, y: y + 4, width: CELL - 8, height: CELL - 8, rx: 8, fill: C.surface, stroke: C.line, 'stroke-width': 2 });
      r.setAttribute('role', 'button');
      r.setAttribute('tabindex', '0');
      r.setAttribute('aria-label', T(`case ${i + 1}`, `cell ${i + 1}`));
      r.style.cursor = 'pointer';
      r.addEventListener('click', () => jouer(i));
      r.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          jouer(i);
        }
      });
      fig.svg.append(r);
      return r;
    });
    const render = () => {
      dominos.replaceChildren();
      if (voirDominos) {
        for (let i = 0; i < N * N; i += 2) {
          const x = X0 + (i % N) * CELL;
          const y = Y0 + Math.floor(i / N) * CELL;
          dominos.append(S('rect', { x: x + 1, y: y + 1, width: 2 * CELL - 2, height: CELL - 2, rx: 12, fill: C.none, stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }));
        }
      }
      cases.forEach((r, i) => r.style.setProperty('fill', etat[i] === 1 ? C.primary : etat[i] === 2 ? C.accent : C.surface));
    };
    const jouer = (i: number) => {
      if (etat[i] !== 0) {
        fig.say(T('Cette case est déjà prise.', 'This cell is already taken.'));
        return;
      }
      etat[i] = 1;
      const j = partenaire(i);
      etat[j] = 2; // toujours libre : les deux cases d'un domino sont prises ensemble
      render();
      const libres = etat.filter((v) => v === 0).length;
      fig.say(
        libres === 0
          ? T('Plus aucune case libre : tu ne peux plus jouer, tu as perdu. L’ordinateur a toujours eu une réponse, car tu entames toujours un domino intact.', 'No free cell left: you cannot move, you lose. The computer always had an answer, because you always start an untouched domino.')
          : T(`L’ordinateur répond dans le même domino. Il reste ${libres} cases, soit ${libres / 2} dominos intacts.`, `The computer answers in the same domino. ${libres} cells remain, that is ${libres / 2} untouched dominoes.`),
      );
    };
    fig.btn(T('Nouvelle partie', 'New game'), () => {
      etat.fill(0);
      render();
      fig.say(T('Noircis une case. Celui qui ne peut plus jouer perd.', 'Fill a cell. Whoever cannot move loses.'));
    }, true);
    fig.btn(T('Montrer / cacher les dominos', 'Show / hide dominoes'), () => {
      voirDominos = !voirDominos;
      render();
    });
    render();
    fig.say(T('Noircis une case. Celui qui ne peut plus jouer perd.', 'Fill a cell. Whoever cannot move loses.'));
  },
};
