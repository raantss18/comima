/**
 * Bons voisins — adapté de la tâche « Bons voisins » du Concours Castor 2016
 * (Arthur Charguéraud, Mathias Hiron, Nir Lavee, France-ioi), CC BY-SA 3.0.
 * Les objets et les règles sont ceux de la tâche originale ; on échange deux objets en
 * les touchant l'un après l'autre (au lieu de les glisser).
 */
import { el } from '../lab/core';
import { S } from '../fiche/core';
import type { DefiModule } from './core';

type Forme = 'circle' | 'square' | 'triangle' | 'hexagon';
interface Type {
  forme: Forme;
  /** Couleur (motif) : liée à la forme dans la tâche originale. */
  couleur: 'orange' | 'bleu' | 'rouge';
  taille: 'gros' | 'petit' | '';
}

const TYPES: Record<string, Type> = {
  circle: { forme: 'circle', couleur: 'orange', taille: '' },
  square: { forme: 'square', couleur: 'bleu', taille: '' },
  triangle: { forme: 'triangle', couleur: 'rouge', taille: '' },
  bigCircle: { forme: 'circle', couleur: 'orange', taille: 'gros' },
  smallCircle: { forme: 'circle', couleur: 'orange', taille: 'petit' },
  bigSquare: { forme: 'square', couleur: 'bleu', taille: 'gros' },
  smallSquare: { forme: 'square', couleur: 'bleu', taille: 'petit' },
  bigHexagon: { forme: 'hexagon', couleur: 'rouge', taille: 'gros' },
};

/** Données des trois versions (tâche originale). */
const DATA: string[][][] = [
  [['circle', 'circle', 'square', 'square', 'square', 'square', 'triangle', 'triangle']],
  [['bigCircle', 'bigCircle', 'smallCircle', 'smallCircle', 'bigSquare', 'bigSquare', 'smallSquare', 'smallSquare', 'bigHexagon']],
  [
    ['bigSquare', 'bigSquare', 'smallCircle', 'smallCircle'],
    ['bigSquare', 'bigSquare', 'smallCircle', 'smallCircle'],
    ['bigCircle', 'bigCircle', 'smallSquare', 'smallSquare'],
    ['bigCircle', 'bigCircle', 'smallSquare', 'smallSquare'],
  ],
];

const COUL = {
  orange: { stroke: '#e08a00', fill: '#ffe4af' },
  bleu: { stroke: '#2a5bd7', fill: '#95b0f4' },
  rouge: { stroke: '#d6362b', fill: '#f4c0c0' },
};

function dessin(t: Type): SVGSVGElement {
  const svg = S('svg', { viewBox: '0 0 40 40', width: 40, height: 40, 'aria-hidden': 'true' });
  const r = t.taille === 'petit' ? 9 : 15;
  const c = COUL[t.couleur];
  const st = { fill: c.fill, stroke: c.stroke, 'stroke-width': 3 };
  if (t.forme === 'circle') svg.append(S('circle', { cx: 20, cy: 20, r, ...st }));
  else if (t.forme === 'square') svg.append(S('rect', { x: 20 - r, y: 20 - r, width: 2 * r, height: 2 * r, ...st }));
  else if (t.forme === 'triangle') svg.append(S('polygon', { points: `20,${20 - r} ${20 + r},${20 + r * 0.8} ${20 - r},${20 + r * 0.8}`, ...st }));
  else {
    const pts = Array.from({ length: 6 }, (_, k) => {
      const a = (Math.PI / 3) * k;
      return `${(20 + r * Math.cos(a)).toFixed(1)},${(20 + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    svg.append(S('polygon', { points: pts, ...st }));
  }
  return svg;
}

function nom(t: Type, fr: boolean): string {
  const f = { circle: ['rond', 'circle'], square: ['carré', 'square'], triangle: ['triangle', 'triangle'], hexagon: ['hexagone', 'hexagon'] }[t.forme];
  const base = fr ? f[0] : f[1];
  if (!t.taille) return base;
  return fr ? `${t.taille === 'gros' ? 'grand' : 'petit'} ${base}` : `${t.taille === 'gros' ? 'big' : 'small'} ${base}`;
}

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const grille = DATA[version].map((l) => l.slice());
    const rows = grille.length;
    const cols = grille[0].length;
    let choisi: [number, number] | null = null;
    let encadres: [number, number][] = [];

    const board = el('div', { class: 'defi-grid', role: 'grid', style: `grid-template-columns: repeat(${cols}, minmax(0, 46px))` });
    ctx.root.append(board);
    ctx.say(T('Touchez un objet, puis un autre : ils échangent leurs places.', 'Tap an object, then another one: they swap places.'));

    /** Première règle non respectée, ou null. Attributs comparés : ceux de la tâche originale. */
    function verifier(): { cells: [number, number][]; msg: string } | null {
      const base = T('Les deux objets encadrés se touchent ', 'The two framed objects touch ');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = TYPES[grille[r][c]];
          // Côté à côté : à droite et en dessous.
          for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const r2 = r + dr;
            const c2 = c + dc;
            if (r2 >= rows || c2 >= cols) continue;
            const b = TYPES[grille[r2][c2]];
            if (a.forme === b.forme) return { cells: [[r, c], [r2, c2]], msg: base + T('alors qu’ils ont la même forme.', 'while they have the same shape.') };
            if (a.couleur === b.couleur) return { cells: [[r, c], [r2, c2]], msg: base + T('alors qu’ils ont la même couleur.', 'while they have the same colour.') };
            if (version === 1 && a.taille === b.taille) return { cells: [[r, c], [r2, c2]], msg: base + T('alors qu’ils ont la même taille.', 'while they have the same size.') };
          }
          // Par un coin (version 3) : diagonales vers le bas.
          if (version === 2) {
            for (const dc of [-1, 1]) {
              const r2 = r + 1;
              const c2 = c + dc;
              if (r2 >= rows || c2 < 0 || c2 >= cols) continue;
              const b = TYPES[grille[r2][c2]];
              if (a.taille === b.taille) return { cells: [[r, c], [r2, c2]], msg: base + T('par un coin alors qu’ils ont la même taille.', 'by a corner while they have the same size.') };
            }
          }
        }
      }
      return null;
    }

    function render() {
      board.textContent = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = TYPES[grille[r][c]];
          const b = el('button', { type: 'button', class: 'defi-cell', role: 'gridcell' }) as HTMLButtonElement;
          b.append(dessin(t));
          b.setAttribute('aria-label', `${nom(t, ctx.lang === 'fr')}, ${T('ligne', 'row')} ${r + 1}, ${T('colonne', 'column')} ${c + 1}`);
          if (choisi && choisi[0] === r && choisi[1] === c) b.classList.add('is-selected');
          if (encadres.some(([er, ec]) => er === r && ec === c)) b.classList.add('is-wrong');
          b.addEventListener('click', () => toucher(r, c));
          board.append(b);
        }
      }
    }

    function toucher(r: number, c: number) {
      encadres = [];
      if (!choisi) {
        choisi = [r, c];
      } else {
        const [r0, c0] = choisi;
        choisi = null;
        if (r0 !== r || c0 !== c) {
          const tmp = grille[r0][c0];
          grille[r0][c0] = grille[r][c];
          grille[r][c] = tmp;
          if (!verifier()) ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
          else ctx.say('');
        }
      }
      render();
    }

    ctx.btn(T('Vérifier', 'Check'), () => {
      const v = verifier();
      if (!v) ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      else {
        encadres = v.cells;
        ctx.result(false, v.msg);
      }
      render();
    }, true);
    render();
  },
};
