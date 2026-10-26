import { C, S, ease, runner, tween, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';

/**
 * Chapitre 7 — l'exemple du cours : 8 jetons blancs, on retourne exactement deux jetons à
 * chaque opération. Peut-on obtenir un seul jeton noir ? L'élève essaie (clic sur deux
 * jetons) ; la parité du nombre de noirs n'est révélée que sur demande.
 */

const N = 8;

export const figure: FicheFigure = {
  size: [640, 230],
  label: {
    fr: 'Huit jetons blancs ; à chaque opération on en retourne exactement deux. Objectif : obtenir exactement un jeton noir.',
    en: 'Eight white tokens; each move flips exactly two. Goal: get exactly one black token.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let black: boolean[] = Array(N).fill(false);
    let picked: number[] = [];
    let moves = 0;
    let history: number[] = [0];
    let showParity = false;
    const flip: number[] = Array(N).fill(0); // 0 → 1 pendant l'animation
    let busy = false;
    const layer = S('g');
    svg.append(layer);
    const x = (i: number) => 70 + i * 71;

    const render = () => {
      layer.replaceChildren();
      for (let i = 0; i < N; i++) {
        const on = black[i];
        const sx = flip[i] > 0 && flip[i] < 1 ? Math.abs(Math.cos(Math.PI * flip[i])) : 1;
        const shownBlack = on; // la couleur change à mi-retournement (voir doFlip)
        const g = S('g', { tabindex: 0, role: 'button', 'aria-label': T(`jeton ${i + 1}, ${on ? 'noir' : 'blanc'}`, `token ${i + 1}, ${on ? 'black' : 'white'}`), style: 'cursor:pointer;outline:none' });
        g.append(S('circle', { r: 28, fill: shownBlack ? '#1f2937' : '#fff', stroke: picked.includes(i) ? C.accent : C.ink, 'stroke-width': picked.includes(i) ? 6 : 2.5 }), S('text', { y: 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: shownBlack ? '#fff' : C.muted, 'pointer-events': 'none' }, String(i + 1)));
        g.setAttribute('transform', `translate(${x(i)} 70) scale(${sx} 1)`);
        const pick = () => void click(i);
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pick();
          }
        });
        layer.append(g);
      }
      const nBlack = black.filter(Boolean).length;
      layer.append(
        S('text', { x: 20, y: 148, 'font-size': 14, fill: C.muted }, T(`Opérations effectuées : ${moves}`, `Moves made: ${moves}`)),
        S('text', { x: 20, y: 172, 'font-size': 14, fill: C.ink }, T(`Jetons noirs : ${nBlack}`, `Black tokens: ${nBlack}`)),
        S('text', { x: 20, y: 196, 'font-size': 13, fill: C.muted }, T('Historique du nombre de noirs : ', 'Number of black tokens so far: ') + history.slice(-16).join(' → ')),
      );
      if (showParity) layer.append(S('text', { x: 20, y: 220, 'font-size': 14, 'font-weight': 800, fill: C.primary }, T(`Parité du nombre de noirs : ${nBlack % 2 ? 'impair' : 'pair'} — et elle n’a jamais changé.`, `Parity of the number of black tokens: ${nBlack % 2 ? 'odd' : 'even'} — and it has never changed.`)));
      fig.say(
        nBlack === 1
          ? T('Un seul jeton noir !', 'A single black token!')
          : picked.length === 1
            ? T('Choisis un second jeton : les deux seront retournés.', 'Pick a second token: both will be flipped.')
            : moves === 0
              ? T('Clique sur deux jetons pour les retourner. Peux-tu obtenir exactement un jeton noir ?', 'Click two tokens to flip them. Can you get exactly one black token?')
              : T('Continue d’essayer. Que remarques-tu dans l’historique ?', 'Keep trying. What do you notice in the history?'),
      );
    };

    const doFlip = async (a: number, b: number) => {
      busy = true;
      const alive = run.token();
      await tween(450, (t) => {
        if (!alive()) return;
        flip[a] = flip[b] = ease(t) * 0.999;
        if (t >= 1) flip[a] = flip[b] = 0;
        if (t >= 0.5 && flip[a] !== 0 && !pending) {
          pending = true;
          black[a] = !black[a];
          black[b] = !black[b];
        }
        render();
      });
      pending = false;
      flip[a] = flip[b] = 0;
      moves++;
      history.push(black.filter(Boolean).length);
      busy = false;
      render();
    };
    let pending = false;
    const click = async (i: number) => {
      if (busy) return;
      if (picked.includes(i)) {
        picked = picked.filter((k) => k !== i);
        return render();
      }
      picked.push(i);
      if (picked.length < 2) return render();
      const [a, b] = picked;
      picked = [];
      await doFlip(a, b);
    };

    fig.btn(T('Deux jetons au hasard', 'Two random tokens'), async () => {
      if (busy) return;
      picked = [];
      const a = Math.floor(Math.random() * N);
      let b = Math.floor(Math.random() * (N - 1));
      if (b >= a) b++;
      await doFlip(a, b);
    }, true);
    fig.btn(showParity ? T('Cacher la parité', 'Hide the parity') : T('Afficher la parité de N', 'Show the parity of N'), () => {
      showParity = !showParity;
      const b = fig.controls.querySelectorAll('button')[1];
      b.textContent = showParity ? T('Cacher la parité', 'Hide the parity') : T('Afficher la parité de N', 'Show the parity of N');
      render();
    });
    fig.btn(T('Recommencer', 'Restart'), () => {
      run.next();
      black = Array(N).fill(false);
      picked = [];
      moves = 0;
      history = [0];
      busy = false;
      pending = false;
      flip.fill(0);
      render();
    });
    render();
  },
};
