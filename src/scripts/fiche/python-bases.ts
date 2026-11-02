import { C, S, runner, sleep, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Dérouler un programme à la main : la fonction somme_chiffres de la fiche, exécutée ligne
 * par ligne. La ligne en cours est surlignée et le tableau garde les valeurs de n et s après
 * chaque tour de boucle, comme on le ferait sur une feuille.
 */

const W = 360;
const H = 330;
const CODE = ['def somme_chiffres(n):', '    s = 0', '    while n > 0:', '        s = s + n % 10', '        n = n // 10', '    return s'];
const LH = 22;
const Y0 = 44;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'La fonction somme_chiffres exécutée pas à pas : la ligne en cours est surlignée et un tableau note les valeurs de n et de s.',
    en: 'The function somme_chiffres run step by step: the current line is highlighted and a table records the values of n and s.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const run = runner();
    let depart = 2026;
    const surligne = S('rect', { x: 10, y: 0, width: W - 20, height: LH, rx: 4, fill: C.soft, opacity: 0 });
    fig.svg.append(surligne);
    CODE.forEach((l, i) =>
      fig.svg.append(S('text', { x: 18, y: Y0 + i * LH + 15, 'font-size': 13, 'font-family': 'ui-monospace, monospace', fill: C.ink, style: 'white-space: pre' }, l)),
    );
    const tableau = S('g');
    fig.svg.append(tableau);
    const yT = Y0 + CODE.length * LH + 18;

    // Programme déroulé : suite d'états (ligne, n, s).
    const etats = () => {
      const e: { l: number; n: number; s: number | null }[] = [];
      let n = depart;
      let s = 0;
      e.push({ l: 0, n, s: null });
      e.push({ l: 1, n, s });
      for (;;) {
        e.push({ l: 2, n, s });
        if (!(n > 0)) break;
        s = s + (n % 10);
        e.push({ l: 3, n, s });
        n = Math.floor(n / 10);
        e.push({ l: 4, n, s });
      }
      e.push({ l: 5, n, s });
      return e;
    };
    let pas: ReturnType<typeof etats> = [];
    let k = -1;

    const montrer = () => {
      const e = pas[k];
      surligne.setAttribute('y', String(Y0 + e.l * LH + 1));
      surligne.setAttribute('opacity', '1');
      // Tableau : une ligne par passage sur `n = n // 10`, plus l'état initial.
      const lignes = pas.slice(0, k + 1).filter((x) => x.l === 1 || x.l === 4);
      tableau.replaceChildren(
        S('text', { x: 40, y: yT, 'font-size': 12, 'font-weight': 700, fill: C.muted }, 'n'),
        S('text', { x: 120, y: yT, 'font-size': 12, 'font-weight': 700, fill: C.muted }, 's'),
      );
      lignes.slice(-6).forEach((x, i) => {
        tableau.append(
          S('text', { x: 40, y: yT + 18 + i * 17, 'font-size': 13, 'font-family': 'ui-monospace, monospace', fill: C.ink }, String(x.n)),
          S('text', { x: 120, y: yT + 18 + i * 17, 'font-size': 13, 'font-family': 'ui-monospace, monospace', fill: C.ink }, String(x.s)),
        );
      });
      const msg: Record<number, [string, string]> = {
        0: [`Appel somme_chiffres(${depart}) : n vaut ${depart}.`, `Call somme_chiffres(${depart}): n is ${depart}.`],
        1: ['s = 0 : la somme part de zéro.', 's = 0: the sum starts at zero.'],
        2: e.n > 0 ? [`n = ${e.n} > 0 : on entre dans la boucle.`, `n = ${e.n} > 0: enter the loop.`] : ['n = 0 : la condition est fausse, la boucle s’arrête.', 'n = 0: the condition is false, the loop stops.'],
        3: [`Dernier chiffre ${e.n % 10} ajouté : s = ${e.s}.`, `Last digit ${e.n % 10} added: s = ${e.s}.`],
        4: [`On enlève ce chiffre : n = ${e.n}.`, `Remove that digit: n = ${e.n}.`],
        5: [`return s : la fonction renvoie ${e.s}.`, `return s: the function returns ${e.s}.`],
      };
      fig.say(T(msg[e.l][0], msg[e.l][1]));
    };

    const recommencer = () => {
      run.next();
      pas = etats();
      k = 0;
      montrer();
    };
    const suivant = () => {
      if (k >= pas.length - 1) return false;
      k++;
      montrer();
      return true;
    };

    fig.range('n', 0, 9999, depart, 1, (v) => {
      depart = v;
      recommencer();
    });
    fig.btn(T('Ligne suivante', 'Next line'), () => {
      run.next();
      suivant();
    }, true);
    fig.btn(T('▶ Exécuter', '▶ Run'), async () => {
      const alive = run.token();
      while (alive() && suivant()) await sleep(450);
    });
    fig.btn(T('Recommencer', 'Restart'), recommencer);
    recommencer();
  },
};
