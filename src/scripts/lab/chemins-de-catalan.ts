import { binom, button, fmt, group, param, segmented, type LabDef } from './core';

/**
 * Chapitre 6 — Combinatoire.
 * Chemins de (0,0) à (a,b) en pas → et ↑ qui ne dépassent jamais la droite y = x + s.
 * Cas a = b, s = 0 : nombres de Catalan ; principe de réflexion pour le cas général.
 */

type View = 'all' | 'good' | 'bad';

function dpTable(a: number, b: number, s: number): number[][] {
  const T: number[][] = Array.from({ length: a + 1 }, () => new Array(b + 1).fill(0));
  for (let x = 0; x <= a; x++)
    for (let y = 0; y <= b; y++) {
      if (y > x + s) {
        T[x][y] = 0;
      } else if (x === 0 && y === 0) {
        T[x][y] = 1;
      } else {
        T[x][y] = (x > 0 ? T[x - 1][y] : 0) + (y > 0 ? T[x][y - 1] : 0);
      }
    }
  return T;
}

export const def: LabDef = {
  chapter: '06-combinatoire',
  numero: 6,
  title: { fr: 'Chemins sous la diagonale', en: 'Paths below the diagonal' },
  statement: {
    fr: 'Un chemin va de $(0,0)$ à $(n,n)$ avec des pas « droite » et « haut ». Parmi les $\\binom{2n}{n}$ chemins, combien ne passent <em>jamais au-dessus</em> de la diagonale $y = x$ ?',
    en: 'A path goes from $(0,0)$ to $(n,n)$ with “right” and “up” steps. Among the $\\binom{2n}{n}$ paths, how many <em>never rise above</em> the diagonal $y = x$?',
  },
  goal: {
    fr: 'Compte pour $n = 1, 2, 3, \\dots$ : quelle suite ? Quel est le <em>rapport</em> entre le nombre total de chemins et les bons chemins ? Puis généralise : rectangle $a \\times b$, droite décalée $y = x + s$.',
    en: 'Count for $n = 1, 2, 3, \\dots$: which sequence? What is the <em>ratio</em> between the total number of paths and the good ones? Then generalise: an $a \\times b$ rectangle, a shifted line $y = x + s$.',
  },
  steps: {
    fr: [
      'Au départ : une grille <strong>$4 \\times 4$</strong> ($a = 4$, $b = 4$) et la droite $y = x + 0$. Tout se règle au curseur ou au clavier : largeur $a$, hauteur $b$ et décalage $s$.',
      'Tous les chemins sont dessinés en transparence : <span class="lab-ok">verts</span> = bons (ils restent sous la droite), <span class="lab-bad">rouges</span> = mauvais. L’épaisseur montre combien de chemins passent par une arête.',
      'Les nombres sur les nœuds sont le <strong>nombre de bons chemins</strong> qui y arrivent (règle : somme du nœud de gauche et du nœud du dessous, 0 au-dessus de la droite).',
      'Utilise <strong>Remplir</strong> pour le tableau $n = 1\\dots 10$, <strong>Un chemin au hasard</strong> pour tester un chemin, et le panneau « Comment c’est calculé » pour la formule par réflexion.',
    ],
    en: [
      'At the start: a <strong>$4 \\times 4$</strong> grid ($a = 4$, $b = 4$) and the line $y = x + 0$. Everything is set by slider or keyboard: width $a$, height $b$ and shift $s$.',
      'All paths are drawn transparently: <span class="lab-ok">green</span> = good (they stay under the line), <span class="lab-bad">red</span> = bad. Thickness shows how many paths use an edge.',
      'The numbers on the nodes are the <strong>number of good paths</strong> arriving there (rule: sum of the left node and the node below, 0 above the line).',
      'Use <strong>Fill</strong> for the table $n = 1\\dots 10$, <strong>A random path</strong> to test one path, and the “How it is computed” panel for the reflection formula.',
    ],
  },
  legend: [
    { color: '#1d9a45', fr: 'bon chemin', en: 'good path' },
    { color: '#d6362b', fr: 'mauvais chemin', en: 'bad path' },
    { color: '#111827', fr: 'chemin choisi au hasard', en: 'randomly chosen path' },
    { color: 'rgba(214,54,43,0.2)', fr: 'zone interdite (au-dessus de la droite)', en: 'forbidden area (above the line)' },
  ],
  hints: {
    fr: [
      'Remplis le tableau jusqu’à $n = 8$. Les nombres te rappellent-ils quelque chose (1, 2, 5, 14, …) ?',
      'Regarde la colonne « total ÷ bons » : une régularité apparaît-elle ?',
      'Un chemin « mauvais » touche la droite $y = x + 1$. Réfléchis-le (symétrie) à partir du premier contact : où termine-t-il alors ? Combien de chemins mènent à ce point ?',
      'Teste ta formule avec $s \\ne 0$ ou $a \\ne b$ : que devient le point d’arrivée du chemin réfléchi ?',
    ],
    en: [
      'Fill in the table up to $n = 8$. Do the numbers ring a bell (1, 2, 5, 14, …)?',
      'Look at the “total ÷ good” column: does a pattern appear?',
      'A “bad” path touches the line $y = x + 1$. Reflect it (symmetry) from the first touch: where does it end? How many paths lead to that point?',
      'Test your formula with $s \\ne 0$ or $a \\ne b$: what becomes of the endpoint of the reflected path?',
    ],
  },
  general: {
    fr: '<p><strong>Nombres de Catalan.</strong> Pour $a = b = n$, $s = 0$ : $$C_n = \\frac{1}{n+1}\\binom{2n}{n},$$ soit $1, 1, 2, 5, 14, 42, 132, 429, \\dots$ Le rapport « total ÷ bons » vaut exactement $n + 1$.</p><p><strong>Principe de réflexion.</strong> Les mauvais chemins touchent la droite $y = x + s + 1$ ; en réfléchissant la partie après le premier contact, on obtient une bijection avec les chemins de $(0,0)$ vers $(b - s - 1,\\ a + s + 1)$. Donc, si $b \\le a + s$, $$\\text{bons} = \\binom{a+b}{a} - \\binom{a+b}{b - s - 1}.$$ Les mêmes nombres comptent les parenthésages, les triangulations d’un polygone, les arbres binaires…</p>',
    en: '<p><strong>Catalan numbers.</strong> For $a = b = n$, $s = 0$: $$C_n = \\frac{1}{n+1}\\binom{2n}{n},$$ i.e. $1, 1, 2, 5, 14, 42, 132, 429, \\dots$ The “total ÷ good” ratio is exactly $n + 1$.</p><p><strong>Reflection principle.</strong> Bad paths touch the line $y = x + s + 1$; reflecting the part after the first touch gives a bijection with the paths from $(0,0)$ to $(b - s - 1,\\ a + s + 1)$. Hence, if $b \\le a + s$, $$\\text{good} = \\binom{a+b}{a} - \\binom{a+b}{b - s - 1}.$$ The same numbers count bracketings, triangulations of a polygon, binary trees…</p>',
  },
  aspect: 0.82,
  logEmpty: { fr: 'Clique sur « Remplir » ou « Noter ».', en: 'Click “Fill” or “Record”.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let a = 4;
    let b = 4;
    let s = 0;
    let view: View = 'all';
    let highlight: number[] | null = null;
    let paths: { path: number[]; good: boolean }[] = [];
    let sampled = false;
    log.setColumns(['(a,b,s)', t('total', 'total'), t('bons', 'good'), t('total ÷ bons', 'total ÷ good')]);

    const isGood = (path: number[]) => {
      let x = 0;
      let y = 0;
      for (const st of path) {
        if (st === 0) x++;
        else y++;
        if (y > x + s) return false;
      }
      return true;
    };
    const enumerate = () => {
      const total = binom(a + b, a);
      paths = [];
      sampled = total > 3500;
      if (!sampled) {
        const rec = (path: number[], r: number, u: number) => {
          if (r === a && u === b) {
            paths.push({ path: path.slice(), good: isGood(path) });
            return;
          }
          if (r < a) {
            path.push(0);
            rec(path, r + 1, u);
            path.pop();
          }
          if (u < b) {
            path.push(1);
            rec(path, r, u + 1);
            path.pop();
          }
        };
        rec([], 0, 0);
      } else {
        for (let k = 0; k < 600; k++) {
          const steps = [...Array(a).fill(0), ...Array(b).fill(1)];
          for (let i = steps.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [steps[i], steps[j]] = [steps[j], steps[i]];
          }
          paths.push({ path: steps, good: isGood(steps) });
        }
      }
    };

    const update = () => {
      enumerate();
      const T = dpTable(a, b, s);
      const total = binom(a + b, a);
      const good = T[a][b];
      const endOk = b <= a + s;
      const reflected = endOk ? binom(a + b, b - s - 1) : null;
      api.say(
        `<div class="lab-big">${t('Chemins', 'Paths')} : <strong>${total}</strong> · ${t('bons', 'good')} : <strong class="lab-ok">${good}</strong> · ${t('mauvais', 'bad')} : <strong class="lab-bad">${total - good}</strong></div>` +
          `<div>${t('Rapport total ÷ bons', 'Ratio total ÷ good')} = <strong>${good ? fmt(total / good, 4) : '—'}</strong>${a === b && s === 0 ? ` (= n + 1 = ${a + 1} ?)` : ''}</div>` +
          (sampled ? `<div class="lab-muted">${t('Trop de chemins pour tous les dessiner : 600 chemins au hasard sont tracés (les nombres sont exacts).', 'Too many paths to draw them all: 600 random paths are drawn (the numbers are exact).')}</div>` : ''),
      );
      api.calc(
        `<ul><li>${t('Tous les chemins', 'All paths')} : $\\binom{a+b}{a} = \\binom{${a + b}}{${a}} = ${total}$.</li>` +
          `<li>${t('Bons chemins par la règle des nœuds', 'Good paths by the node rule')} : $N(x,y) = N(x-1,y) + N(x,y-1)$, ${t('et $0$ si $y > x + s$', 'and $0$ if $y > x + s$')} ⇒ $N(${a},${b}) = ${good}$.</li>` +
          (reflected !== null
            ? `<li>${t('Réflexion', 'Reflection')} : $\\binom{${a + b}}{${a}} - \\binom{${a + b}}{${b - s - 1}} = ${total} - ${reflected} = ${total - reflected}$ ${total - reflected === good ? '✔' : '✘'} ${t('(mauvais chemins ↔ chemins vers', '(bad paths ↔ paths to')} $(${b - s - 1},\\ ${a + s + 1})$).</li>`
            : `<li>${t('Le point d’arrivée est au-dessus de la droite : aucun chemin ne convient.', 'The endpoint is above the line: no path works.')}</li>`) +
          (a === b && s === 0 ? `<li>${t('Catalan', 'Catalan')} : $C_${a} = \\dfrac{1}{${a + 1}}\\binom{${2 * a}}{${a}} = ${binom(2 * a, a) / (a + 1)}$.</li>` : '') +
          '</ul>',
      );
      stage.redraw();
      return { total, good };
    };

    const aP = param(t('largeur a', 'width a'), 1, 10, a, 1, (v) => ((a = v), (highlight = null), update()));
    const bP = param(t('hauteur b', 'height b'), 1, 10, b, 1, (v) => ((b = v), (highlight = null), update()));
    const sP = param(t('décalage s', 'shift s'), -3, 5, s, 1, (v) => ((s = v), (highlight = null), update()));
    const viewSeg = segmented(
      [
        { value: 'all' as View, label: t('Tous', 'All') },
        { value: 'good' as View, label: t('Bons', 'Good') },
        { value: 'bad' as View, label: t('Mauvais', 'Bad') },
      ],
      'all',
      (v) => ((view = v), stage.redraw()),
    );

    controls.append(
      group(
        t('Grille et droite y = x + s', 'Grid and line y = x + s'),
        aP.row,
        bP.row,
        sP.row,
        button(t('Carré a = b', 'Square a = b'), () => {
          b = a;
          bP.set(a);
          update();
        }),
      ),
      group(t('Affichage', 'Display'), viewSeg.row, button(t('Un chemin au hasard', 'A random path'), () => {
        const steps = [...Array(a).fill(0), ...Array(b).fill(1)];
        for (let i = steps.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [steps[i], steps[j]] = [steps[j], steps[i]];
        }
        highlight = steps;
        update();
        api.readout.insertAdjacentHTML('beforeend', `<div>${isGood(steps) ? '<span class="lab-ok">✔ ' + t('reste sous la droite', 'stays under the line') : '<span class="lab-bad">✘ ' + t('dépasse la droite', 'crosses the line')}</span></div>`);
      })),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          const { total, good } = update();
          log.add([`(${a},${b},${s})`, total, good, good ? fmt(total / good, 4) : '—']);
        }, 'primary'),
        button(t('Remplir (a = b = 1…10, s = 0)', 'Fill (a = b = 1…10, s = 0)'), () => {
          log.clear();
          for (let k = 10; k >= 1; k--) {
            const tot = binom(2 * k, k);
            const g = dpTable(k, k, 0)[k][k];
            log.add([`(${k},${k},0)`, tot, g, fmt(tot / g, 4)], 'ok');
          }
        }),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    stage.setDraw((ctx, w, h, p) => {
      const padL = 24;
      const padT = 12;
      const cell = Math.min((w - padL - 12) / a, (h - padT - 26) / b);
      const x0 = padL + (w - padL - 12 - cell * a) / 2;
      const y0 = padT;
      const X = (i: number) => x0 + i * cell;
      const Y = (j: number) => y0 + (b - j) * cell;
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 1;
      for (let i = 0; i <= a; i++) {
        ctx.beginPath();
        ctx.moveTo(X(i), Y(0));
        ctx.lineTo(X(i), Y(b));
        ctx.stroke();
      }
      for (let j = 0; j <= b; j++) {
        ctx.beginPath();
        ctx.moveTo(X(0), Y(j));
        ctx.lineTo(X(a), Y(j));
        ctx.stroke();
      }
      // zone interdite : y > x + s dans [0,a]×[0,b]
      ctx.fillStyle = 'rgba(214,54,43,0.12)';
      ctx.beginPath();
      const pts: [number, number][] = [];
      for (let xx = 0; xx <= a; xx += 0.05) {
        const yy = Math.min(b, Math.max(0, xx + s));
        pts.push([xx, yy]);
      }
      ctx.moveTo(X(0), Y(b));
      pts.forEach(([xx, yy]) => ctx.lineTo(X(xx), Y(yy)));
      ctx.lineTo(X(a), Y(b));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = p.accent;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach(([xx, yy], i) => (i ? ctx.lineTo(X(xx), Y(yy)) : ctx.moveTo(X(xx), Y(yy))));
      ctx.stroke();
      ctx.setLineDash([]);
      const alpha = Math.max(0.03, Math.min(0.4, 20 / Math.max(1, paths.length)));
      for (const pth of paths) {
        if (view === 'good' && !pth.good) continue;
        if (view === 'bad' && pth.good) continue;
        ctx.strokeStyle = pth.good ? p.ok : p.bad;
        ctx.globalAlpha = pth.good ? alpha * 1.4 : alpha;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        let x = 0;
        let y = 0;
        ctx.moveTo(X(0), Y(0));
        for (const st of pth.path) {
          if (st === 0) x++;
          else y++;
          ctx.lineTo(X(x), Y(y));
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (highlight) {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        let x = 0;
        let y = 0;
        ctx.moveTo(X(0), Y(0));
        for (const st of highlight) {
          if (st === 0) x++;
          else y++;
          ctx.lineTo(X(x), Y(y));
        }
        ctx.stroke();
      }
      // nombres de bons chemins sur les nœuds
      if (cell >= 30) {
        const T = dpTable(a, b, s);
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= a; i++)
          for (let j = 0; j <= b; j++) {
            if (j > i + s) continue;
            ctx.fillStyle = p.surface;
            const txt = String(T[i][j]);
            const tw = ctx.measureText(txt).width + 6;
            ctx.fillRect(X(i) - tw / 2, Y(j) - 8, tw, 16);
            ctx.fillStyle = p.ink;
            ctx.fillText(txt, X(i), Y(j));
          }
      }
      ctx.fillStyle = p.ink;
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('(0,0)', X(0) + 2, Y(0) + 14);
      ctx.textAlign = 'right';
      ctx.fillText(`(${a},${b})`, X(a), Y(b) - 6);
    });

    update();
  },
};
