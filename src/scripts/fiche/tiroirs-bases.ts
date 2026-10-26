import { C, S, ease, runner, sleep, tween, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Principe des tiroirs : kn + 1 objets dans n tiroirs. On range un objet à la fois
 * (clic sur un tiroir) : impossible d'éviter qu'un tiroir contienne k + 1 objets.
 */

const COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5', '#0d9488', '#be185d', '#a16207', '#1d4ed8', '#9333ea', '#15803d', '#b91c1c'];
const BOX_Y = 118;
const BOX_H = 150;
const PILE_Y = 34;

export const figure: FicheFigure = {
  size: [640, 290],
  label: {
    fr: 'Des objets colorés à ranger dans des tiroirs : quelle que soit la façon de faire, un tiroir finit par contenir au moins k+1 objets.',
    en: 'Coloured objects to put into drawers: however you do it, some drawer ends up with at least k+1 objects.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let n = 5;
    let k = 1;
    let placed: number[] = []; // placed[i] = tiroir de l'objet i
    let busy = false;
    const layer = S('g');
    svg.append(layer);

    const total = () => k * n + 1;
    const boxX = (d: number) => {
      const w = 600 / n;
      return 20 + d * w;
    };
    const boxW = () => 600 / n - 10;
    const loads = () => {
      const l = Array<number>(n).fill(0);
      placed.forEach((d) => l[d]++);
      return l;
    };
    /** Position (centre) de l'objet i dans son tiroir. */
    const slotPos = (d: number, rank: number): [number, number] => {
      const per = Math.max(1, Math.floor((boxW() - 8) / 24));
      const row = Math.floor(rank / per);
      const col = rank % per;
      return [boxX(d) + 16 + col * 24, BOX_Y + BOX_H - 16 - row * 24];
    };
    const pilePos = (i: number): [number, number] => [24 + (i % 26) * 23, PILE_Y + Math.floor(i / 26) * 24];

    const render = (moving?: { i: number; x: number; y: number }) => {
      const l = loads();
      const worst = Math.max(...l);
      layer.replaceChildren();
      for (let d = 0; d < n; d++) {
        const bad = l[d] >= k + 1;
        layer.append(
          S('rect', { x: boxX(d), y: BOX_Y, width: boxW(), height: BOX_H, rx: 10, fill: bad ? 'rgba(220,38,38,0.12)' : C.surface, stroke: bad ? C.accent : C.line, 'stroke-width': bad ? 4 : 2, style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': T(`tiroir ${d + 1}`, `drawer ${d + 1}`), 'data-d': d }),
          S('text', { x: boxX(d) + boxW() / 2, y: BOX_Y + BOX_H + 18, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: bad ? C.accent : C.muted }, `${l[d]}`),
        );
      }
      const rank = Array<number>(n).fill(0);
      placed.forEach((d, i) => {
        const [x, y] = slotPos(d, rank[d]++);
        layer.append(S('circle', { cx: x, cy: y, r: 10, fill: COLORS[i % COLORS.length], stroke: C.surface, 'stroke-width': 1.5, 'pointer-events': 'none' }));
      });
      for (let i = placed.length; i < total(); i++) {
        if (moving && moving.i === i) continue;
        const [x, y] = pilePos(i - placed.length);
        layer.append(S('circle', { cx: x, cy: y, r: 9, fill: COLORS[i % COLORS.length], stroke: C.surface, 'stroke-width': 1.5, opacity: i === placed.length ? 1 : 0.75, 'pointer-events': 'none' }));
      }
      if (moving) layer.append(S('circle', { cx: moving.x, cy: moving.y, r: 10, fill: COLORS[moving.i % COLORS.length], stroke: C.ink, 'stroke-width': 2, 'pointer-events': 'none' }));
      layer.append(S('text', { x: 20, y: 16, 'font-size': 13, fill: C.muted }, T(`${total()} objets = ${k}×${n} + 1, ${n} tiroirs`, `${total()} objects = ${k}×${n} + 1, ${n} drawers`)));
      // clics sur les tiroirs
      layer.querySelectorAll<SVGRectElement>('rect[data-d]').forEach((r) => {
        const go = () => void drop(Number(r.dataset.d), run.token());
        r.addEventListener('click', go);
        r.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            go();
          }
        });
      });
      const left = total() - placed.length;
      if (worst >= k + 1) fig.say(T(`Un tiroir contient ${worst} objets (≥ ${k + 1}) : inévitable, puisqu’il y a plus d’objets (${total()}) que de places à ${k} par tiroir (${k * n}).`, `A drawer holds ${worst} objects (≥ ${k + 1}): unavoidable, since there are more objects (${total()}) than places with ${k} per drawer (${k * n}).`));
      else if (placed.length === 0) fig.say(T(`Clique sur un tiroir pour y ranger l’objet suivant. Essaie d’éviter que l’un d’eux contienne ${k + 1} objets !`, `Click a drawer to put the next object in. Try to keep every drawer below ${k + 1} objects!`));
      else fig.say(T(`Aucun tiroir n’a ${k + 1} objets pour l’instant ; il reste ${left} objet${left > 1 ? 's' : ''}${left === 1 ? ` — le dernier va forcément mettre ${k + 1} objets dans un tiroir.` : '.'}`, `No drawer has ${k + 1} objects yet; ${left} object${left > 1 ? 's' : ''} left${left === 1 ? ` — the last one is bound to put ${k + 1} objects in some drawer.` : '.'}`));
    };

    /** Range l'objet suivant dans le tiroir d ; `alive` vient de l'appelant (un clic, ou une série automatique). */
    const drop = async (d: number, alive: () => boolean, fast = false) => {
      if (busy || placed.length >= total()) return false;
      busy = true;
      const i = placed.length;
      const [x0, y0] = pilePos(0);
      const [x1, y1] = slotPos(d, loads()[d]);
      await tween(fast ? 160 : 420, (t) => alive() && render({ i, x: x0 + (x1 - x0) * ease(t), y: y0 + (y1 - y0) * ease(t) - Math.sin(Math.PI * t) * 24 }));
      if (alive()) placed.push(d);
      busy = false;
      if (alive()) render();
      return true;
    };

    const reset = () => {
      run.next();
      busy = false;
      placed = [];
      render();
    };

    fig.range(T('tiroirs n', 'drawers n'), 2, 8, n, 1, (v) => {
      n = v;
      reset();
    });
    fig.range('k', 1, 3, k, 1, (v) => {
      k = v;
      reset();
    });
    fig.btn(T('▶ Ranger équitablement', '▶ Spread evenly'), async () => {
      reset();
      const alive = run.token();
      for (let i = 0; i < total() && alive(); i++) {
        await drop(i % n, alive, true);
        await sleep(120);
      }
    }, true);
    fig.btn(T('Au hasard', 'At random'), async () => {
      reset();
      const alive = run.token();
      while (placed.length < total() && alive()) {
        await drop(Math.floor(Math.random() * n), alive, true);
        await sleep(100);
      }
    });
    fig.btn(T('Recommencer', 'Reset'), reset);
    render();
  },
};
