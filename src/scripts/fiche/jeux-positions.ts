import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Jeu de soustraction à un tas : on retire k jetons, k pris dans un ensemble choisi (par défaut
 * {1, 3, 4}) ; prendre le dernier gagne. On classe les positions 0, 1, 2… dans l'ordre : n est
 * gagnante s'il existe un coup vers une position perdante, perdante sinon. Le jeu (et ses règles
 * modifiables) n'est pas celui des questions : la figure montre la méthode, pas les réponses.
 */

const N = 24;
const COLS = 8;
const CELL = 40;
const W = 360;
const X0 = (W - COLS * CELL) / 2;
const Y0 = 40;
const H = Y0 + (N / COLS) * (CELL + 14) + 20;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Les positions 0 à 23 d’un jeu de soustraction à un tas, classées une à une en gagnantes ou perdantes pour le joueur qui doit jouer.',
    en: 'Positions 0 to 23 of a one-pile subtraction game, classified one by one as winning or losing for the player to move.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    const coups = new Set([1, 3, 4]);
    let classe = -1; // positions classées : 0..classe
    let perdante: boolean[] = [];

    const titre = S('text', { x: W / 2, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink });
    fig.svg.append(titre);
    const cases = Array.from({ length: N }, (_, n) => {
      const x = X0 + (n % COLS) * CELL;
      const y = Y0 + Math.floor(n / COLS) * (CELL + 14);
      const r = S('rect', { x: x + 3, y, width: CELL - 6, height: CELL - 6, rx: 8, fill: C.surface, stroke: C.line, 'stroke-width': 2 });
      const t = S('text', { x: x + CELL / 2, y: y + CELL / 2 + 2, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: C.ink }, String(n));
      const lettre = S('text', { x: x + CELL / 2, y: y + CELL + 6, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: C.muted }, '');
      const g = S('g', {}, r, t, lettre);
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', String(n));
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => clic(n));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clic(n);
        }
      });
      fig.svg.append(g);
      return { r, t, lettre };
    });

    const regle = () => [...coups].sort((a, b) => a - b).join(', ');
    const peindre = (sel = -1) => {
      titre.textContent = T(`On retire ${regle()} jeton(s)`, `Remove ${regle()} token(s)`);
      cases.forEach(({ r, t, lettre }, n) => {
        const connu = n <= classe;
        const P = connu && perdante[n];
        r.style.setProperty('fill', !connu ? C.surface : P ? C.accent : C.soft);
        r.style.setProperty('stroke', n === sel ? C.primary : connu && !P ? C.primary : C.line);
        r.setAttribute('stroke-width', n === sel ? '4' : '2');
        t.style.setProperty('fill', P ? '#fff' : C.ink);
        lettre.textContent = !connu ? '' : P ? T('perd.', 'losing') : T('gagn.', 'winning');
      });
    };

    const classer = (n: number) => {
      let g = false;
      coups.forEach((k) => {
        if (n - k >= 0 && perdante[n - k]) g = true;
      });
      perdante[n] = !g;
      classe = n;
    };

    const recommencer = () => {
      run.next();
      perdante = [];
      classe = -1;
      peindre();
      fig.say(T('Classe les positions dans l’ordre : 0 n’a aucun coup, donc elle est perdante.', 'Classify positions in order: 0 has no move, so it is losing.'));
    };

    const suivant = () => {
      if (classe >= N - 1) return false;
      const n = classe + 1;
      classer(n);
      peindre(n);
      const vers: number[] = [];
      coups.forEach((k) => {
        if (n - k >= 0) vers.push(n - k);
      });
      const cible = vers.filter((m) => perdante[m]);
      fig.say(
        vers.length === 0
          ? T(`${n} : aucun coup possible, perdante.`, `${n}: no move, losing.`)
          : cible.length
            ? T(`${n} → ${cible[0]}, qui est perdante : ${n} est gagnante.`, `${n} → ${cible[0]}, which is losing: ${n} is winning.`)
            : vers.length === 1
              ? T(`${n} ne mène qu’à ${vers[0]}, qui est gagnante : ${n} est perdante.`, `${n} only leads to ${vers[0]}, which is winning: ${n} is losing.`)
              : T(`${n} ne mène qu’à ${vers.join(', ')}, toutes gagnantes : ${n} est perdante.`, `${n} only leads to ${vers.join(', ')}, all winning: ${n} is losing.`),
      );
      return true;
    };

    const clic = (n: number) => {
      run.next();
      if (n > classe) {
        fig.say(T(`Classe d’abord les positions jusqu’à ${n} : on part toujours de 0.`, `First classify the positions up to ${n}: always start from 0.`));
        return;
      }
      peindre(n);
      const c = [...coups].find((k) => n - k >= 0 && perdante[n - k]);
      fig.say(c === undefined ? T(`${n} est perdante : tout coup laisse une position gagnante à l’adversaire.`, `${n} is losing: every move leaves a winning position to the opponent.`) : T(`Depuis ${n}, retire ${c} : l’adversaire est en ${n - c}, perdante.`, `From ${n}, remove ${c}: the opponent faces ${n - c}, losing.`));
    };

    fig.btn(T('Position suivante', 'Next position'), () => {
      run.next();
      suivant();
    }, true);
    fig.btn(T('▶ Tout classer', '▶ Classify all'), async () => {
      const alive = run.token();
      while (alive() && suivant()) await sleep(250);
    });
    for (let k = 1; k <= 5; k++) {
      const b = fig.btn('', () => {
        if (coups.has(k) && coups.size > 1) coups.delete(k);
        else coups.add(k);
        maj();
        recommencer();
      });
      const maj = () => {
        b.textContent = `${coups.has(k) ? '☑' : '☐'} ${k}`;
        b.setAttribute('aria-pressed', String(coups.has(k)));
      };
      maj();
    }
    recommencer();
  },
};
