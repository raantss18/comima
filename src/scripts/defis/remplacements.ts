/**
 * Remplacements — adapté de la tâche « Remplacements » du Concours Castor 2018 (Arthur
 * Charguéraud, Mathias Hiron, France-ioi), CC BY-SA 3.0. Formes, couleurs, dessins de
 * départ et objectifs d'origine ; règle : remplacer une forme par une autre change toutes
 * ses apparitions dans le dessin courant. La vérification compare le dessin à l'objectif.
 */
import { el } from '../lab/core';
import { S } from '../fiche/core';
import type { DefiModule } from './core';

type Forme = 'triangle' | 'rectangle' | 'circle' | 'star' | 'reverseTriangle' | 'diamond' | 'squareStar';

const NIVEAUX: { all: Forme[]; origin: Forme[]; target: Forme[] }[] = [
  {
    all: ['triangle', 'rectangle', 'circle', 'star', 'reverseTriangle', 'diamond'],
    origin: ['circle', 'rectangle', 'diamond', 'circle'],
    target: ['star', 'reverseTriangle', 'triangle', 'star'],
  },
  {
    all: ['triangle', 'rectangle', 'circle', 'star', 'reverseTriangle', 'diamond'],
    origin: ['circle', 'star', 'rectangle', 'triangle'],
    target: ['rectangle', 'triangle', 'reverseTriangle', 'star'],
  },
  {
    all: ['triangle', 'rectangle', 'circle', 'star', 'reverseTriangle', 'diamond', 'squareStar'],
    origin: ['triangle', 'star', 'circle', 'diamond', 'reverseTriangle', 'rectangle'],
    target: ['reverseTriangle', 'rectangle', 'triangle', 'star', 'circle', 'diamond'],
  },
];
const COULEUR: Record<Forme, string> = {
  triangle: 'blue',
  diamond: 'red',
  rectangle: 'lime',
  circle: 'grey',
  star: 'yellow',
  reverseTriangle: 'pink',
  squareStar: 'olive',
};
const NOM: Record<Forme, [string, string]> = {
  triangle: ['triangle bleu', 'blue triangle'],
  diamond: ['losange rouge', 'red diamond'],
  rectangle: ['carré vert', 'green square'],
  circle: ['disque gris', 'grey disc'],
  star: ['étoile jaune', 'yellow star'],
  reverseTriangle: ['triangle rose pointe en bas', 'pink upside-down triangle'],
  squareStar: ['étoile à quatre branches', 'four-pointed star'],
};

/** Tracés de la tâche originale (shape-paths.js), centre (x, y), rayon r. */
function trace(f: Forme, x: number, y: number, r: number): string {
  const p = (pts: number[][]) => 'M' + pts.map((q) => `${x + q[0] * r} ${y + q[1] * r}`).join(' L') + ' Z';
  switch (f) {
    case 'diamond': return p([[0, -1], [1, 0], [0, 1], [-1, 0]]);
    case 'star': return p([[0, -1], [0.27, -0.3], [1, -0.3], [0.4, 0.2], [0.6, 0.8], [0, 0.4], [-0.6, 0.8], [-0.4, 0.2], [-1, -0.3], [-0.27, -0.3]]);
    case 'triangle': return p([[-1, 1], [1, 1], [0, -1]]);
    case 'rectangle': return p([[-1, -1], [1, -1], [1, 1], [-1, 1]]);
    case 'reverseTriangle': return p([[-1, -1], [1, -1], [0, 1]]);
    case 'squareStar': return p([[0, -1], [0.25, -0.25], [1, 0], [0.25, 0.25], [0, 1], [-0.25, 0.25], [-1, 0], [-0.25, -0.25]]);
    default: return '';
  }
}

function dessin(f: Forme): SVGElement {
  const svg = S('svg', { viewBox: '0 0 44 44', class: 'defi-shape', 'aria-hidden': 'true' });
  const attrs = { fill: COULEUR[f], stroke: '#111', 'stroke-width': 1 };
  svg.append(f === 'circle' ? S('circle', { cx: 22, cy: 22, r: 18, ...attrs }) : S('path', { d: trace(f, 22, 22, 19), ...attrs }));
  return svg;
}

export const defi: DefiModule = {
  mount(ctx) {
    const { T, version } = ctx;
    const niv = NIVEAUX[version];
    const etapes: [Forme, Forme][] = [];
    let premiere: Forme | null = null;
    let fini = false;
    const nom = (f: Forme) => T(NOM[f][0], NOM[f][1]);

    const boutons = el('div', { class: 'defi-pad defi-shape-pad', role: 'group', 'aria-label': T('Formes', 'Shapes') });
    const paire = el('p', { class: 'defi-bilan' });
    const courant = el('div', { class: 'defi-shape-row is-current' });
    const objectif = el('div', { class: 'defi-shape-row is-target' });
    ctx.root.append(
      el('p', { class: 'defi-legend' }, T('Choisissez deux formes ci-dessous :', 'Choose two shapes below:')),
      boutons,
      paire,
      el('p', { class: 'defi-legend' }, T('Dessin courant :', 'Current drawing:')),
      courant,
      el('p', { class: 'defi-legend' }, T('Objectif :', 'Target:')),
      objectif,
    );

    function resultat(): Forme[] {
      const r = niv.origin.slice();
      for (const [a, b] of etapes) for (let i = 0; i < r.length; i++) if (r[i] === a) r[i] = b;
      return r;
    }

    function rangee(zone: HTMLElement, formes: Forme[]) {
      zone.textContent = '';
      zone.setAttribute('aria-label', formes.map(nom).join(', '));
      for (const f of formes) zone.append(el('span', { class: 'defi-shape-slot' }, dessin(f)));
    }

    function render() {
      boutons.textContent = '';
      for (const f of niv.all) {
        const b = el('button', { type: 'button', class: 'defi-shape-btn', 'aria-label': nom(f) }, dessin(f)) as HTMLButtonElement;
        b.setAttribute('aria-pressed', String(f === premiere));
        b.disabled = fini;
        b.addEventListener('click', () => choisir(f));
        boutons.append(b);
      }
      paire.textContent = premiere ? T(`Remplacer ${nom(premiere)} par… ?`, `Replace ${nom(premiere)} with… ?`) : '';
      rangee(courant, resultat());
      rangee(objectif, niv.target);
      btnAnnuler.disabled = fini || (!premiere && etapes.length === 0);
    }

    function choisir(f: Forme) {
      if (fini) return;
      if (!premiere) {
        premiere = f;
        ctx.say('');
        render();
        return;
      }
      const a = premiere;
      premiere = null;
      const n = resultat().filter((x) => x === a).length;
      etapes.push([a, f]);
      render();
      if (a === f) ctx.say(T('Remplacer une forme par la même forme ne change pas le dessin courant.', 'Replacing a shape with the same shape does not change the current drawing.'));
      else if (n === 0) ctx.say(T('Le dessin ne change pas car la première forme sélectionnée n’y apparaît pas.', 'The drawing does not change because the first shape you selected does not appear in it.'));
      else if (n === 1) ctx.say(T(`${nom(a)} → ${nom(f)} : un remplacement a été effectué.`, `${nom(a)} → ${nom(f)}: one replacement was made.`));
      else ctx.say(T(`${nom(a)} → ${nom(f)} : ${n} remplacements ont été effectués.`, `${nom(a)} → ${nom(f)}: ${n} replacements were made.`));
      if (resultat().every((x, i) => x === niv.target[i])) {
        fini = true;
        render();
        ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      }
    }

    const btnAnnuler = ctx.btn(T('Annuler une étape', 'Undo one step'), () => {
      if (premiere) premiere = null;
      else etapes.pop();
      ctx.say('');
      render();
    });
    ctx.btn(T('Vérifier', 'Check'), () => {
      if (resultat().every((x, i) => x === niv.target[i])) ctx.result(true, T('Bravo, vous avez réussi !', 'Well done, you did it!'));
      else ctx.result(false, T('Le dessin courant ne correspond pas exactement à l’objectif.', 'The current drawing does not exactly match the target.'));
    }, true);
    render();
    ctx.say(T('Touchez la forme à remplacer, puis la forme qui la remplace.', 'Tap the shape to replace, then the shape that replaces it.'));
  },
};
