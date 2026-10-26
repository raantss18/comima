import { C, S, drag, runner, sleep, type Fig } from '../fiche/core';
import type { FicheFigure } from '../fiche';
import { rng } from '../lab/core';

/**
 * Chapitre 2 — Principe extrémal : le point le plus à gauche d'un nuage est forcément un
 * sommet de l'enveloppe convexe. À partir de lui, l'« emballage cadeau » choisit à chaque
 * étape le point le plus extrême dans une direction. Les points se déplacent à la main.
 */

type P = { x: number; y: number };
const W = 640;
const H = 270;
const cross = (o: P, a: P, b: P) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

export const figure: FicheFigure = {
  size: [W, H],
  label: {
    fr: 'Un nuage de points déplaçables : on part du point le plus à gauche et on enroule une ficelle autour du nuage, en choisissant à chaque fois le point le plus extrême.',
    en: 'A cloud of draggable points: starting from the leftmost point, a string is wrapped around the cloud, each time picking the most extreme point.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let seed = 7;
    let pts: P[] = [];
    const hull = S('polygon', { fill: C.soft, opacity: 0.55, stroke: C.none });
    const edges = S('g');
    const cand = S('line', { stroke: '#d97706', 'stroke-width': 2, 'stroke-dasharray': '5 4', opacity: 0 });
    const dots = S('g');
    const tag = S('text', { 'font-size': 12, 'font-weight': 800, fill: C.primary, 'text-anchor': 'middle' });
    svg.append(hull, edges, cand, dots, tag);
    let circles: SVGCircleElement[] = [];

    const left = () => pts.reduce((m, p, i) => (p.x < pts[m].x ? i : m), 0);
    const markLeft = () => {
      const i = left();
      tag.setAttribute('x', String(Math.max(52, Math.min(W - 52, pts[i].x))));
      tag.setAttribute('y', String(pts[i].y - 14));
      tag.textContent = T('le plus à gauche', 'leftmost');
      circles.forEach((c, k) => c.style.setProperty('fill', k === i ? C.primary : C.surface));
    };
    const place = () => {
      circles.forEach((c, i) => {
        c.setAttribute('cx', String(pts[i].x));
        c.setAttribute('cy', String(pts[i].y));
      });
      markLeft();
    };
    const fresh = () => {
      run.next();
      const r = rng(seed);
      pts = Array.from({ length: 10 }, () => ({ x: 40 + r() * (W - 80), y: 30 + r() * (H - 60) }));
      dots.replaceChildren();
      circles = pts.map((_, i) => {
        const c = S('circle', { r: 9, fill: C.surface, stroke: C.ink, 'stroke-width': 2.5, tabindex: 0, 'aria-label': T(`point ${i + 1}`, `point ${i + 1}`) });
        drag(svg, c, (x, y) => {
          run.next();
          pts[i] = { x: Math.max(12, Math.min(W - 12, x)), y: Math.max(12, Math.min(H - 12, y)) };
          clearHull();
          place();
        });
        dots.append(c);
        return c;
      });
      clearHull();
      place();
      fig.say(T('L’enveloppe convexe est le plus petit polygone convexe qui contient tous les points (un élastique tendu autour du nuage). Déplace les points : le point le plus à gauche en est-il toujours un sommet ? Lance l’emballage pour le vérifier.', 'The convex hull is the smallest convex polygon containing all the points (a rubber band stretched around the cloud). Drag the points: is the leftmost point always one of its vertices? Run the wrapping to check.'));
    };
    const clearHull = () => {
      hull.setAttribute('points', '');
      edges.replaceChildren();
      cand.setAttribute('opacity', '0');
    };

    fig.btn(T('▶ Emballer le nuage', '▶ Wrap the cloud'), async () => {
      const alive = run.token();
      clearHull();
      const start = left();
      const chain = [start];
      let cur = start;
      fig.say(T('On part du point le plus à gauche : aucun point n’est plus à gauche, il est extrême.', 'We start from the leftmost point: nothing lies further left, so it is extreme.'));
      for (let guard = 0; guard < pts.length + 1 && alive(); guard++) {
        let next = cur === 0 ? 1 : 0;
        for (let q = 0; q < pts.length && alive(); q++) {
          if (q === cur) continue;
          cand.setAttribute('x1', String(pts[cur].x));
          cand.setAttribute('y1', String(pts[cur].y));
          cand.setAttribute('x2', String(pts[q].x));
          cand.setAttribute('y2', String(pts[q].y));
          cand.setAttribute('opacity', '1');
          if (cross(pts[cur], pts[next], pts[q]) > 0) next = q;
          await sleep(55);
        }
        if (!alive()) return;
        cand.setAttribute('opacity', '0');
        edges.append(S('line', { x1: pts[cur].x, y1: pts[cur].y, x2: pts[next].x, y2: pts[next].y, stroke: C.primary, 'stroke-width': 3.5 }));
        cur = next;
        if (cur === start) break;
        chain.push(cur);
        circles[cur].style.setProperty('fill', C.accent);
        fig.say(T(`Sommet n° ${chain.length} : parmi tous les points, celui qui laisse tous les autres du même côté de la ficelle.`, `Vertex ${chain.length}: of all points, the one that leaves all the others on the same side of the string.`));
        await sleep(250);
      }
      if (!alive()) return;
      hull.setAttribute('points', chain.map((i) => `${pts[i].x},${pts[i].y}`).join(' '));
      fig.say(T(`Enveloppe convexe : ${chain.length} sommets. Chaque côté est trouvé par un choix extrême : depuis le sommet atteint, le point qui laisse tous les autres du même côté.`, `Convex hull: ${chain.length} vertices. Each side comes from an extremal choice: from the current vertex, the point that leaves all the others on the same side.`));
    }, true);
    fig.btn(T('Nouveaux points', 'New points'), () => {
      seed = (seed * 31 + 11) % 9973;
      fresh();
    });
    fresh();
  },
};
