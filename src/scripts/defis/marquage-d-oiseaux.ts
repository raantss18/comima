/**
 * Marquage d'oiseaux — adapté de la tâche « Marquage d'oiseaux » du Concours Castor 2015
 * (Arthur Charguéraud, France-ioi), CC BY-SA 3.0. Nombre d'oiseaux, nombre de marques par
 * patte, mélanges et règles d'origine : les marques doivent toutes être différentes, puis
 * les oiseaux mélangés doivent retrouver leur place. La vérification compare seulement la
 * place de chaque oiseau à sa place de départ.
 */
import { el } from '../lab/core';
import type { DefiModule } from './core';

const NIVEAUX = [
  { birds: 5, marks: 5 },
  { birds: 8, marks: 4 },
  { birds: 8, marks: 3 },
];
/** Mélanges de la tâche originale : l'oiseau de la place i part en bas à la place p[i]. */
const MELANGES = [
  [
    [3, 2, 4, 0, 1],
    [4, 1, 2, 3, 0],
  ],
  [[6, 1, 3, 5, 0, 2, 7, 4]],
  [[6, 1, 3, 5, 0, 2, 7, 4]],
];
const LETTRES = 'ABCDEFGH';

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const { birds: n, marks: m } = NIVEAUX[version];
    const choix = MELANGES[version];
    const melange = choix[Math.floor(Math.random() * choix.length)];
    const marques = Array.from({ length: n }, () => new Array(m).fill(false));
    let phase: 'marquer' | 'replacer' = 'marquer';
    // Phase « replacer » : haut[k] et bas[k] = oiseau posé à la place k (ou -1).
    let haut: number[] = [];
    let bas: number[] = [];
    let choisi: { zone: 'haut' | 'bas'; k: number } | null = null;
    let doublons: number[] = [];

    const zone = el('div', { class: 'defi-birds-wrap' });
    ctx.root.append(zone);

    const btnEnvol = ctx.btn(T('Laisser les oiseaux s’envoler', 'Let the birds fly away'), envol, true);
    const btnEffacer = ctx.btn(T('Effacer les marques', 'Clear marks'), () => {
      for (const l of marques) l.fill(false);
      doublons = [];
      ctx.say('');
      render();
    });
    const btnValider = ctx.btn(T('Valider la réponse', 'Check my answer'), valider, true);
    const btnRetour = ctx.btn(T('Revenir à l’étape précédente', 'Back to the previous step'), () => {
      phase = 'marquer';
      choisi = null;
      ctx.say('');
      render();
    });

    function largeur(): number {
      const dispo = (zone.clientWidth || 320) - 8;
      return Math.max(30, Math.min(56, Math.floor((dispo - 4 * (n - 1)) / n)));
    }

    /** Un oiseau (patte et marques) ; les marques ne se cliquent qu'à l'étape du marquage. */
    function oiseau(b: number, w: number, cliquable: boolean): HTMLElement {
      const o = el('div', { class: 'defi-bird' });
      o.style.width = `${w}px`;
      o.append(el('span', { class: 'defi-bird-head', 'aria-hidden': 'true' }, '🐦'));
      const patte = el('div', { class: 'defi-leg' });
      for (let j = 0; j < m; j++) {
        const s = Math.min(26, w - 12);
        const c = el(cliquable ? 'button' : 'span', { class: `defi-mark${marques[b][j] ? ' is-on' : ''}` });
        c.style.width = `${s}px`;
        c.style.height = `${s}px`;
        if (cliquable) {
          c.setAttribute('type', 'button');
          c.setAttribute('aria-pressed', String(marques[b][j]));
          c.setAttribute('aria-label', T(`Oiseau ${LETTRES[b]}, marque ${j + 1}`, `Bird ${LETTRES[b]}, mark ${j + 1}`));
          c.addEventListener('click', () => {
            marques[b][j] = !marques[b][j];
            doublons = [];
            ctx.say('');
            render();
          });
        }
        patte.append(c);
      }
      o.append(patte);
      return o;
    }

    function rangee(cases: number[], z: 'haut' | 'bas', w: number, lettres: boolean): HTMLElement {
      const r = el('div', { class: 'defi-birds', role: 'list' });
      cases.forEach((b, k) => {
        const place = el('button', { type: 'button', class: 'defi-perch', role: 'listitem' }) as HTMLButtonElement;
        place.style.width = `${w}px`;
        if (lettres) place.append(el('span', { class: 'defi-perch-letter' }, LETTRES[k]));
        if (b >= 0) place.append(oiseau(b, w, false));
        if (choisi && choisi.zone === z && choisi.k === k) place.classList.add('is-selected');
        const ou = z === 'haut' ? T(`place ${LETTRES[k]}`, `place ${LETTRES[k]}`) : T(`en bas, place ${k + 1}`, `bottom, place ${k + 1}`);
        place.setAttribute('aria-label', b >= 0 ? T(`Oiseau, ${ou}`, `Bird, ${ou}`) : T(`Place vide, ${ou}`, `Empty, ${ou}`));
        place.addEventListener('click', () => toucher(z, k));
        r.append(place);
      });
      return r;
    }

    function render() {
      zone.textContent = '';
      const w = largeur();
      // style.display plutôt que hidden : .lab-btn impose son propre display.
      btnEnvol.style.display = btnEffacer.style.display = phase === 'marquer' ? '' : 'none';
      btnValider.style.display = btnRetour.style.display = phase === 'replacer' ? '' : 'none';
      if (phase === 'marquer') {
        const r = el('div', { class: 'defi-birds' });
        for (let b = 0; b < n; b++) {
          const p = el('div', { class: `defi-perch${doublons.indexOf(b) >= 0 ? ' is-wrong' : ''}` });
          p.style.width = `${w}px`;
          p.append(el('span', { class: 'defi-perch-letter' }, LETTRES[b]), oiseau(b, w, true));
          r.append(p);
        }
        zone.append(r);
      } else {
        zone.append(rangee(haut, 'haut', w, true), el('p', { class: 'defi-legend' }, T('Oiseaux mélangés :', 'Shuffled birds:')), rangee(bas, 'bas', w, false));
      }
    }

    function envol() {
      doublons = [];
      for (let a = 0; a < n; a++) {
        for (let b = a + 1; b < n; b++) {
          if (marques[a].every((v, j) => v === marques[b][j])) doublons.push(a, b);
        }
      }
      if (doublons.length) {
        render();
        ctx.result(false, T('Les oiseaux doivent tous avoir des marques différentes.', 'The birds must all have different marks.'));
        return;
      }
      phase = 'replacer';
      haut = new Array(n).fill(-1);
      bas = new Array(n).fill(-1);
      for (let i = 0; i < n; i++) bas[melange[i]] = i;
      choisi = null;
      render();
      ctx.say(T('Remettez tous les oiseaux à leur place d’origine : touchez un oiseau, puis la place où le poser.', 'Return every bird to its original place: tap a bird, then the place to put it.'));
    }

    function toucher(z: 'haut' | 'bas', k: number) {
      const cible = z === 'haut' ? haut : bas;
      if (!choisi) {
        if (cible[k] >= 0) choisi = { zone: z, k };
      } else {
        const src = choisi.zone === 'haut' ? haut : bas;
        const t = cible[k];
        cible[k] = src[choisi.k];
        src[choisi.k] = t;
        choisi = null;
      }
      ctx.say('');
      render();
    }

    function valider() {
      choisi = null;
      render();
      if (bas.some((b) => b >= 0)) {
        ctx.result(false, T('Il reste des oiseaux dans la zone du bas.', 'There are still birds in the bottom area.'));
      } else if (haut.some((b, k) => b !== k)) {
        ctx.result(false, T('Vous n’avez pas remis tous les oiseaux à leur place d’origine. Si vous n’y arrivez pas, revenez à l’étape précédente.', 'You have not returned every bird to its original place. If you cannot manage, go back to the previous step.'));
      } else {
        ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      }
    }

    const onResize = () => render();
    window.addEventListener('resize', onResize);
    render();
    ctx.say(T('Touchez les cases sous les oiseaux pour les noircir ou les blanchir.', 'Tap the boxes under the birds to make them black or white.'));
    return () => window.removeEventListener('resize', onResize);
  },
};
