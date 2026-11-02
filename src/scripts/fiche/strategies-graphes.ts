import { C, S, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Double comptage : on relie des sommets en touchant deux sommets l'un après l'autre. Chaque
 * sommet affiche son degré ; la somme des degrés vaut toujours 2E, car chaque arête est
 * comptée une fois à chaque bout. Le bouton « complément » échange arêtes et non-arêtes.
 */

const W = 360;
const H = 320;
const N = 6;
const CX = W / 2;
const CY = 160;
const R = 110;

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Un graphe à six sommets que l’on modifie en touchant les sommets ; chaque sommet porte son degré et la somme des degrés reste égale à deux fois le nombre d’arêtes.',
    en: 'A six-vertex graph edited by tapping vertices; each vertex shows its degree and the degree sum always equals twice the number of edges.',
  },
  draw(fig: Fig) {
    const { T } = fig;
    const adj: boolean[][] = Array.from({ length: N }, () => new Array(N).fill(false));
    const depart: [number, number][] = [[0, 1], [1, 2], [2, 0], [3, 4]];
    for (const [a, b] of depart) adj[a][b] = adj[b][a] = true;
    let choisi = -1;
    const pos = (i: number): [number, number] => [CX + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / N), CY + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / N)];
    const aretes = S('g');
    const bilan = S('text', { x: W / 2, y: H - 10, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.ink });
    fig.svg.append(aretes, bilan);
    const sommets = Array.from({ length: N }, (_, i) => {
      const [x, y] = pos(i);
      const c = S('circle', { cx: x, cy: y, r: 20, fill: C.surface, stroke: C.primary, 'stroke-width': 2.5 });
      const t = S('text', { x, y: y + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: C.ink }, '0');
      const g = S('g', {}, c, t);
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => toucher(i));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toucher(i);
        }
      });
      fig.svg.append(g);
      return { g, c, t };
    });

    const render = () => {
      aretes.replaceChildren();
      let E = 0;
      for (let a = 0; a < N; a++) {
        for (let b = a + 1; b < N; b++) {
          if (!adj[a][b]) continue;
          E++;
          const [x1, y1] = pos(a);
          const [x2, y2] = pos(b);
          aretes.append(S('line', { x1, y1, x2, y2, stroke: C.primary, 'stroke-width': 3, 'stroke-linecap': 'round' }));
        }
      }
      const deg = adj.map((l) => l.filter(Boolean).length);
      sommets.forEach(({ g, c, t }, i) => {
        t.textContent = String(deg[i]);
        c.style.setProperty('fill', i === choisi ? C.accent : C.surface);
        g.setAttribute('aria-label', T(`sommet ${i + 1}, degré ${deg[i]}`, `vertex ${i + 1}, degree ${deg[i]}`));
      });
      const somme = deg.reduce((s, d) => s + d, 0);
      bilan.textContent = `${deg.join(' + ')} = ${somme} = 2 × ${E}`;
      return { E, somme };
    };

    const toucher = (i: number) => {
      if (choisi < 0) {
        choisi = i;
        render();
        fig.say(T('Touche un autre sommet pour ajouter ou retirer l’arête.', 'Tap another vertex to add or remove the edge.'));
        return;
      }
      if (choisi !== i) adj[choisi][i] = adj[i][choisi] = !adj[choisi][i];
      choisi = -1;
      const { E, somme } = render();
      fig.say(T(`${E} arête(s), somme des degrés ${somme} : chaque arête compte deux fois, une à chaque bout.`, `${E} edge(s), degree sum ${somme}: each edge counts twice, once at each end.`));
    };

    fig.btn(T('Complément', 'Complement'), () => {
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (a !== b) adj[a][b] = !adj[a][b];
      choisi = -1;
      const { E } = render();
      fig.say(T(`Complément : ${E} arêtes. Un sommet de degré d devient de degré ${N - 1} − d.`, `Complement: ${E} edges. A vertex of degree d gets degree ${N - 1} − d.`));
    }, true);
    fig.btn(T('Tout effacer', 'Clear'), () => {
      for (const l of adj) l.fill(false);
      choisi = -1;
      render();
      fig.say(T('Graphe vide : tous les degrés sont nuls.', 'Empty graph: all degrees are zero.'));
    });
    render();
    fig.say(T('Touche deux sommets pour les relier (ou les délier). Le nombre dans chaque sommet est son degré.', 'Tap two vertices to join (or unjoin) them. The number in each vertex is its degree.'));
  },
};
