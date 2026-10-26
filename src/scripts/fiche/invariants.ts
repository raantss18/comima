import { C, S, runner, sleep, tween, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Invariants : on pose des dominos sur un échiquier dont on a retiré deux coins opposés.
 * Chaque domino couvre une case claire ET une case sombre : l'écart « claires − sombres »
 * des cases libres ne change jamais. Au départ il vaut 2, jamais 0 : pavage impossible.
 */

const N = 8;
const CELL = 34;
const X0 = 20;
const Y0 = 14;

type Cell = { r: number; c: number };
const light = (r: number, c: number) => (r + c) % 2 === 0;

export const figure: FicheFigure = {
  size: [640, 300],
  label: {
    fr: 'Un échiquier 8 × 8 sans deux coins opposés : on pose des dominos, et l’écart entre cases sombres et claires libres reste égal à 2.',
    en: 'An 8 × 8 chessboard without two opposite corners: dominoes are placed, and the gap between free dark and light squares stays equal to 2.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();
    let corners = true;
    let owner: (number | null)[][] = []; // -1 : retirée, null : libre, k : domino k
    let nDom = 0;
    const cells: SVGRectElement[][] = [];
    const domLayer = S('g');

    for (let r = 0; r < N; r++) {
      cells.push([]);
      for (let c = 0; c < N; c++) {
        const rect = S('rect', { x: X0 + c * CELL, y: Y0 + r * CELL, width: CELL, height: CELL, fill: light(r, c) ? '#f1e4c8' : '#8a6a4a', stroke: C.line, 'stroke-width': 0.5 });
        cells[r].push(rect);
        svg.append(rect);
      }
    }
    svg.append(domLayer);

    // tableau de bord à droite
    const PX = 330;
    svg.append(
      S('text', { x: PX, y: 28, 'font-size': 14, 'font-weight': 700, fill: C.ink }, T('Cases libres', 'Free squares')),
      S('text', { x: PX, y: 64, 'font-size': 13, fill: C.muted }, T('claires', 'light')),
      S('text', { x: PX, y: 96, 'font-size': 13, fill: C.muted }, T('sombres', 'dark')),
    );
    const barL = S('rect', { x: PX + 64, y: 49, height: 20, rx: 4, fill: '#d9bf8a' });
    const barD = S('rect', { x: PX + 64, y: 81, height: 20, rx: 4, fill: '#8a6a4a' });
    const nL = S('text', { y: 64, 'font-size': 13, 'font-weight': 700, fill: C.ink });
    const nD = S('text', { y: 96, 'font-size': 13, 'font-weight': 700, fill: C.ink });
    const diff = S('text', { x: PX, y: 148, 'font-size': 20, 'font-weight': 800, fill: C.accent });
    const diffNote = S('text', { x: PX, y: 172, 'font-size': 13, fill: C.muted });
    const verdict = S('text', { x: PX, y: 218, 'font-size': 14, 'font-weight': 700, fill: C.ink });
    const verdict2 = S('text', { x: PX, y: 240, 'font-size': 13, fill: C.muted });
    svg.append(barL, barD, nL, nD, diff, diffNote, verdict, verdict2);

    const stats = () => {
      let l = 0;
      let d = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (owner[r][c] === null) (light(r, c) ? l++ : d++);
      return { l, d };
    };
    const showStats = (done = false) => {
      const { l, d } = stats();
      const wL = l * 6;
      const wD = d * 6;
      barL.setAttribute('width', String(wL));
      barD.setAttribute('width', String(wD));
      nL.setAttribute('x', String(PX + 64 + wL + 8));
      nD.setAttribute('x', String(PX + 64 + wD + 8));
      nL.textContent = String(l);
      nD.textContent = String(d);
      diff.textContent = `${T('sombres − claires', 'dark − light')} = ${d - l}`;
      diffNote.textContent = T('chaque domino retire 1 claire et 1 sombre', 'each domino removes 1 light and 1 dark');
      if (!done) {
        verdict.textContent = '';
        verdict2.textContent = '';
        return;
      }
      if (l + d === 0) {
        verdict.setAttribute('style', `fill:${C.primary}`);
        verdict.textContent = T('✓ Plateau entièrement pavé', '✓ Board fully tiled');
        verdict2.textContent = T('L’écart valait 0 au départ : rien ne l’interdisait.', 'The gap was 0 at the start: nothing forbade it.');
      } else {
        verdict.setAttribute('style', `fill:${C.accent}`);
        verdict.textContent = T(`✗ Bloqué : ${l + d} cases restent libres`, `✗ Stuck: ${l + d} squares remain`);
        verdict2.textContent = T('L’écart reste ' + (d - l) + ' : il ne peut jamais valoir 0.', 'The gap stays ' + (d - l) + ': it can never be 0.');
      }
    };

    const reset = (withCorners: boolean) => {
      run.next();
      corners = withCorners;
      nDom = 0;
      owner = Array.from({ length: N }, () => Array<number | null>(N).fill(null));
      if (corners) {
        owner[0][0] = -1;
        owner[N - 1][N - 1] = -1;
      }
      domLayer.replaceChildren();
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cells[r][c].style.setProperty('opacity', owner[r][c] === -1 ? '0.12' : '1');
      showStats();
      fig.say(
        corners
          ? T('Deux coins opposés sont retirés : ils ont la même couleur. Peut-on paver les 62 cases restantes avec 31 dominos ?', 'Two opposite corners are removed: they have the same colour. Can the 62 remaining squares be tiled with 31 dominoes?')
          : T('Échiquier complet : 32 cases claires, 32 sombres — l’écart est 0.', 'Full board: 32 light, 32 dark squares — the gap is 0.'),
      );
    };

    const free = (r: number, c: number) => r >= 0 && c >= 0 && r < N && c < N && owner[r][c] === null;
    const put = async (a: Cell, b: Cell, alive: () => boolean) => {
      owner[a.r][a.c] = owner[b.r][b.c] = nDom++;
      const x = X0 + Math.min(a.c, b.c) * CELL + 3;
      const y = Y0 + Math.min(a.r, b.r) * CELL + 3;
      const w = (Math.abs(a.c - b.c) + 1) * CELL - 6;
      const h = (Math.abs(a.r - b.r) + 1) * CELL - 6;
      const dom = S('rect', { x, y, width: w, height: h, rx: 7, fill: C.primary, stroke: C.surface, 'stroke-width': 2, opacity: 0 });
      domLayer.append(dom);
      await tween(180, (t) => alive() && dom.setAttribute('opacity', String(0.92 * t)));
      showStats();
    };
    const neighbours = (r: number, c: number): Cell[] =>
      [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dr, dc]) => ({ r: r + dr, c: c + dc })).filter((p) => free(p.r, p.c));
    const anyMove = () => {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (free(r, c) && neighbours(r, c).length) return true;
      return false;
    };

    const randomMove = async (alive: () => boolean) => {
      const options: [Cell, Cell][] = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (free(r, c)) for (const n of neighbours(r, c)) if (n.r > r || n.c > c) options.push([{ r, c }, n]);
      if (!options.length) return false;
      const [a, b] = options[Math.floor(Math.random() * options.length)];
      await put(a, b, alive);
      return true;
    };

    fig.btn(T('Poser un domino au hasard', 'Place a random domino'), async () => {
      const alive = run.token();
      await randomMove(alive);
      if (!anyMove()) showStats(true);
      else fig.say(T('Chaque domino couvre une case claire et une sombre : l’écart ne bouge pas.', 'Each domino covers one light and one dark square: the gap does not move.'));
    }, true);
    fig.btn(T('▶ Paver ligne par ligne', '▶ Tile row by row'), async () => {
      reset(corners);
      const alive = run.token();
      for (let r = 0; r < N && alive(); r++)
        for (let c = 0; c < N && alive(); c++) {
          if (!free(r, c)) continue;
          const next = free(r, c + 1) ? { r, c: c + 1 } : free(r + 1, c) ? { r: r + 1, c } : null;
          if (!next) continue;
          await put({ r, c }, next, alive);
          await sleep(40);
        }
      if (alive()) showStats(true);
    });
    fig.btn(corners ? T('Échiquier complet', 'Full board') : T('Retirer les coins', 'Remove the corners'), () => {
      const b = fig.controls.querySelectorAll('button')[2];
      reset(!corners);
      b.textContent = corners ? T('Échiquier complet', 'Full board') : T('Retirer les coins', 'Remove the corners');
    });
    fig.btn(T('Recommencer', 'Restart'), () => reset(corners));
    reset(true);
  },
};
