import { button, enableDrag, fmt, group, param, segmented, select, type LabDef } from './core';

/**
 * Chapitre 8 — Inégalités.
 * Optimiser avec AM–GM : (1) la boîte a×b×c, somme fixée → volume max / volume fixé → somme min ;
 * (2) la fonction x + a/xᵖ : où est son minimum ?
 */

type Mode = 'box' | 'curve';
type Constraint = 'sum' | 'vol';

export const def: LabDef = {
  chapter: '08-inegalites',
  numero: 8,
  title: { fr: 'Optimiser : la boîte et x + a/x', en: 'Optimising: the box and x + a/x' },
  statement: {
    fr: '<strong>(1)</strong> Une boîte $a \\times b \\times c$ a ses arêtes de somme $a + b + c = S$ fixée. Quelle forme donne le plus grand volume ? Et si on fixe le volume, quelle forme minimise la somme $a + b + c$ ? <strong>(2)</strong> Pour $x > 0$, où la fonction $f(x) = x + \\dfrac{a}{x}$ est-elle minimale ?',
    en: '<strong>(1)</strong> A box $a \\times b \\times c$ has fixed sum of edges $a + b + c = S$. Which shape gives the largest volume? And if the volume is fixed, which shape minimises the sum $a + b + c$? <strong>(2)</strong> For $x > 0$, where is $f(x) = x + \\dfrac{a}{x}$ smallest?',
  },
  goal: {
    fr: 'Déplace le point dans la carte de couleurs ($a$, $b$ ; $c$ est déduit) et repère où est le meilleur. Conjecture la forme optimale, puis compare avec $\\sqrt[3]{abc} \\le \\frac{a+b+c}{3}$. En mode « courbe », change $a$ et l’exposant $p$.',
    en: 'Move the point on the colour map ($a$, $b$; $c$ follows) and spot the best place. Conjecture the optimal shape, then compare with $\\sqrt[3]{abc} \\le \\frac{a+b+c}{3}$. In “curve” mode, change $a$ and the exponent $p$.',
  },
  steps: {
    fr: [
      'Au départ : mode <strong>Boîte</strong>, contrainte <strong>somme fixée $S = 12$</strong> ; le point (a, b) de la carte donne la boîte à droite, avec $c = S - a - b$. Tire le point, ou tape $a$ et $b$ (valeurs modifiables).',
      'La <strong>couleur</strong> de la carte indique le volume $abc$ (clair = grand). Le <strong>cercle jaune</strong> marque le meilleur point. Lis $V$, $V$ maximal et le rapport.',
      'Change la <strong>contrainte</strong> (« volume fixé ») : la carte montre alors la somme $a+b+c$ ; cherche son minimum. Bouton <strong>Optimiser</strong> : un algorithme grimpe vers le meilleur point.',
      'Passe en mode <strong>Courbe $x + a/x^p$</strong> : déplace $x$, change $a$ et $p$ ; compare le minimum observé à la formule du panneau « Comment c’est calculé ».',
    ],
    en: [
      'At the start: <strong>Box</strong> mode, <strong>fixed sum $S = 12$</strong>; the (a, b) point of the map gives the box on the right, with $c = S - a - b$. Drag the point, or type $a$ and $b$ (editable values).',
      'The map <strong>colour</strong> shows the volume $abc$ (light = large). The <strong>yellow circle</strong> marks the best point. Read $V$, maximal $V$ and the ratio.',
      'Change the <strong>constraint</strong> (“fixed volume”): the map then shows the sum $a+b+c$; look for its minimum. <strong>Optimise</strong> button: an algorithm climbs to the best point.',
      'Switch to <strong>Curve $x + a/x^p$</strong> mode: move $x$, change $a$ and $p$; compare the observed minimum with the formula in the “How it is computed” panel.',
    ],
  },
  legend: [
    { color: '#fde68a', fr: 'valeur plus favorable (volume grand / somme petite)', en: 'more favourable value (large volume / small sum)' },
    { color: '#1e3a8a', fr: 'valeur défavorable', en: 'unfavourable value' },
    { color: '#facc15', fr: 'meilleur point (cube)', en: 'best point (cube)' },
    { color: '#d6362b', fr: 'point choisi', en: 'chosen point' },
  ],
  hints: {
    fr: [
      'Place $a$, $b$, $c$ de plus en plus proches. Que devient le volume ? Que se passe-t-il quand l’une des arêtes devient très petite ?',
      'Pour $S = 12$, compare le volume maximal observé à $(S/3)^3 = 64$. Pour la contrainte « volume fixé », compare $a + b + c$ à $3\\sqrt[3]{V}$.',
      'En mode courbe avec $p = 1$ : montre que $x + \\frac{a}{x} \\ge 2\\sqrt{a}$ avec AM–GM sur deux nombres. Avec $p = 2$ : écris $x = \\frac x2 + \\frac x2$ et applique AM–GM à trois nombres.',
    ],
    en: [
      'Put $a$, $b$, $c$ closer and closer. What happens to the volume? What happens when one edge becomes very small?',
      'For $S = 12$, compare the largest observed volume with $(S/3)^3 = 64$. For the “fixed volume” constraint, compare $a + b + c$ with $3\\sqrt[3]{V}$.',
      'In curve mode with $p = 1$: show $x + \\frac{a}{x} \\ge 2\\sqrt{a}$ with AM–GM on two numbers. With $p = 2$: write $x = \\frac x2 + \\frac x2$ and apply AM–GM to three numbers.',
    ],
  },
  general: {
    fr: '<p><strong>AM–GM.</strong> Pour $a, b, c > 0$ : $\\sqrt[3]{abc} \\le \\dfrac{a+b+c}{3}$, avec égalité ssi $a = b = c$. Donc : à somme fixée $S$, le volume est au plus $(S/3)^3$ (cube) ; à volume fixé $V$, la somme est au moins $3\\sqrt[3]{V}$ (cube).</p><p><strong>Courbe.</strong> $x + \\dfrac{a}{x} \\ge 2\\sqrt{a}$ avec égalité en $x = \\sqrt a$. Plus généralement, $x + \\dfrac{a}{x^p} = \\underbrace{\\tfrac xp + \\dots + \\tfrac xp}_{p\\ \\text{fois}} + \\dfrac a{x^p} \\ge (p+1)\\sqrt[p+1]{a/p^p}$, égalité en $x = (p\\,a)^{1/(p+1)}$.</p>',
    en: '<p><strong>AM–GM.</strong> For $a, b, c > 0$: $\\sqrt[3]{abc} \\le \\dfrac{a+b+c}{3}$, with equality iff $a = b = c$. So: for a fixed sum $S$, the volume is at most $(S/3)^3$ (cube); for a fixed volume $V$, the sum is at least $3\\sqrt[3]{V}$ (cube).</p><p><strong>Curve.</strong> $x + \\dfrac{a}{x} \\ge 2\\sqrt{a}$ with equality at $x = \\sqrt a$. More generally, $x + \\dfrac{a}{x^p} = \\underbrace{\\tfrac xp + \\dots + \\tfrac xp}_{p\\ \\text{times}} + \\dfrac a{x^p} \\ge (p+1)\\sqrt[p+1]{a/p^p}$, with equality at $x = (p\\,a)^{1/(p+1)}$.</p>',
  },
  aspect: 0.62,
  logEmpty: { fr: 'Déplace le point puis « Noter ».', en: 'Move the point then “Record”.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let mode: Mode = 'box';
    let cons: Constraint = 'sum';
    let S = 12;
    let V0 = 27;
    let A = 4; // paramètre a de x + a/x^p
    let pe = 1;
    let X = 1.2; // position de x sur la courbe
    let pa = 5; // côtés de la boîte
    let pb = 3;
    log.setColumns([t('cas', 'case'), t('valeurs', 'values'), t('résultat', 'result'), t('optimum', 'optimum')]);

    const sideC = () => (cons === 'sum' ? S - pa - pb : V0 / (pa * pb));
    const bounds = () => {
      // domaine de la carte (a, b) pour chaque contrainte
      if (cons === 'sum') return { aMax: S, bMax: S };
      const r = Math.cbrt(V0);
      return { aMax: 3 * r, bMax: 3 * r };
    };
    const value = (a: number, b: number) => {
      const c = cons === 'sum' ? S - a - b : V0 / (a * b);
      if (cons === 'sum') return c > 0 ? a * b * c : NaN;
      return a + b + c;
    };
    const best = () => (cons === 'sum' ? (S / 3) ** 3 : 3 * Math.cbrt(V0));

    const update = () => {
      if (mode === 'box') {
        pa = Math.max(0.05, pa);
        pb = Math.max(0.05, pb);
        if (cons === 'sum' && pa + pb >= S - 0.05) {
          const k = (S - 0.05) / (pa + pb);
          pa *= k;
          pb *= k;
        }
        const c = sideC();
        const v = value(pa, pb);
        const opt = best();
        api.say(
          cons === 'sum'
            ? `<div class="lab-big">$a = ${fmt(pa, 2)},\\ b = ${fmt(pb, 2)},\\ c = ${fmt(c, 2)}$ · ${t('volume', 'volume')} $abc = $ <strong>${fmt(v, 3)}</strong></div><div>${t('Maximum possible', 'Largest possible')} $(S/3)^3 = ${fmt(opt, 3)}$ · ${t('atteint', 'reached')} <strong>${fmt((v / opt) * 100, 1)} %</strong> ${v / opt > 0.9999 ? '<span class="lab-ok">★ ' + t('cube !', 'cube!') + '</span>' : ''}</div>`
            : `<div class="lab-big">$a = ${fmt(pa, 2)},\\ b = ${fmt(pb, 2)},\\ c = ${fmt(c, 2)}$ · ${t('somme', 'sum')} $a+b+c = $ <strong>${fmt(v, 3)}</strong></div><div>${t('Minimum possible', 'Smallest possible')} $3\\sqrt[3]{V} = ${fmt(opt, 3)}$ · ${t('écart', 'excess')} <strong>${fmt((v / opt - 1) * 100, 2)} %</strong> ${v / opt < 1.0001 ? '<span class="lab-ok">★ ' + t('cube !', 'cube!') + '</span>' : ''}</div>`,
        );
        const am = (pa + pb + c) / 3;
        const gm = Math.cbrt(pa * pb * c);
        api.calc(
          `<ul><li>${cons === 'sum' ? t('Contrainte', 'Constraint') + ` : $a + b + c = S = ${S}$ ⇒ $c = S - a - b = ${fmt(c, 3)}$.` : t('Contrainte', 'Constraint') + ` : $abc = V = ${V0}$ ⇒ $c = V/(ab) = ${fmt(c, 3)}$.`}</li>` +
            `<li>${t('Moyenne arithmétique', 'Arithmetic mean')} $A = \\frac{a+b+c}{3} = ${fmt(am, 4)}$ ; ${t('géométrique', 'geometric')} $G = \\sqrt[3]{abc} = ${fmt(gm, 4)}$.</li>` +
            `<li>$G \\le A$ : $${fmt(gm, 4)} \\le ${fmt(am, 4)}$ ${gm <= am + 1e-9 ? '✔' : '✘'} ; ${t('égalité ssi', 'equality iff')} $a = b = c$ ${Math.abs(pa - pb) < 0.02 && Math.abs(pb - c) < 0.02 ? '(' + t('ici presque', 'here almost') + ' ✔)' : ''}.</li>` +
            `<li>${cons === 'sum' ? `$abc = G^3 \\le A^3 = (S/3)^3 = ${fmt(opt, 3)}$` : `$a + b + c = 3A \\ge 3G = 3\\sqrt[3]{V} = ${fmt(opt, 3)}$`}.</li></ul>`,
        );
      } else {
        const f = (x: number) => x + A / Math.pow(x, pe);
        const xm = Math.pow(pe * A, 1 / (pe + 1));
        const fm = f(xm);
        api.say(
          `<div class="lab-big">$f(x) = x + \\dfrac{${fmt(A, 2)}}{x^{${pe}}}$ · $x = ${fmt(X, 3)}$ ⇒ $f(x) = $ <strong>${fmt(f(X), 4)}</strong></div>` +
            `<div>${t('Minimum', 'Minimum')} $f(x^*) = ${fmt(fm, 4)}$ ${t('en', 'at')} $x^* = ${fmt(xm, 4)}$ · ${t('écart', 'excess')} <strong>${fmt(f(X) - fm, 4)}</strong></div>`,
        );
        api.calc(
          `<ul><li>$f'(x) = 1 - \\dfrac{${pe}\\,a}{x^{${pe + 1}}} = 0 \\iff x^{${pe + 1}} = ${pe}\\cdot ${fmt(A, 2)} \\iff x^* = ${fmt(xm, 4)}$.</li>` +
            `<li>AM–GM (${pe + 1} ${t('termes', 'terms')}) : $x = ${Array(pe).fill(`\\tfrac{x}{${pe}}`).join(' + ')}$, ${t('donc', 'so')} $f(x) \\ge (p+1)\\sqrt[p+1]{a/p^p} = ${pe + 1}\\sqrt[${pe + 1}]{${fmt(A / pe ** pe, 4)}} = ${fmt(fm, 4)}$ ✔.</li>` +
            (pe === 1 ? `<li>$p = 1$ : $x + \\frac ax - 2\\sqrt a = \\frac{(x - \\sqrt a)^2}{x} \\ge 0$.</li>` : '') +
            `</ul>`,
        );
      }
      stage.relayout();
    };

    // --- commandes ---
    const modeSeg = segmented(
      [
        { value: 'box' as Mode, label: t('Boîte', 'Box') },
        { value: 'curve' as Mode, label: t('Courbe x + a/xᵖ', 'Curve x + a/xᵖ') },
      ],
      mode,
      (m) => {
        mode = m;
        boxGroup.hidden = m !== 'box';
        curveGroup.hidden = m !== 'curve';
        update();
      },
    );
    const consSel = select<Constraint>(
      t('Contrainte', 'Constraint'),
      [
        { value: 'sum', label: t('somme fixée → volume max', 'fixed sum → max volume') },
        { value: 'vol', label: t('volume fixé → somme min', 'fixed volume → min sum') },
      ],
      cons,
      (c) => {
        cons = c;
        if (c === 'vol') (pa = Math.cbrt(V0) * 1.4), (pb = Math.cbrt(V0) * 0.8);
        else (pa = S * 0.45), (pb = S * 0.3);
        syncAB();
        update();
      },
    );
    const SP = param('S', 3, 30, S, 1, (v) => {
      S = v;
      if (cons === 'sum') (pa = Math.min(pa, S * 0.6)), (pb = Math.min(pb, S * 0.35));
      syncAB();
      update();
    });
    const VP = param('V', 1, 200, V0, 1, (v) => ((V0 = v), update()));
    const aP = param('a', 0.2, 30, pa, 0.1, (v) => ((pa = v), update()));
    const bP = param('b', 0.2, 30, pb, 0.1, (v) => ((pb = v), update()));
    const syncAB = () => {
      aP.set(Math.round(pa * 10) / 10);
      bP.set(Math.round(pb * 10) / 10);
    };
    const AP = param('a', 0.5, 30, A, 0.5, (v) => ((A = v), update()));
    const PP = param('p', 1, 3, pe, 1, (v) => ((pe = v), update()));
    const XP = param('x', 0.1, 8, X, 0.05, (v) => ((X = v), update()));

    const boxGroup = group(t('Boîte', 'Box'), consSel.row, SP.row, VP.row, aP.row, bP.row, button(t('Cube', 'Cube'), () => {
      const c = cons === 'sum' ? S / 3 : Math.cbrt(V0);
      pa = c;
      pb = c;
      syncAB();
      update();
    }), button(t('Optimiser', 'Optimise'), () => {
      let step = 1;
      let id = 0;
      const tick = () => {
        const cur = value(pa, pb);
        const better = (v: number) => (cons === 'sum' ? v > cur : v < cur);
        let moved = false;
        for (const [da, db] of [[step, 0], [-step, 0], [0, step], [0, -step]] as [number, number][]) {
          const na = pa + da;
          const nb = pb + db;
          if (na <= 0.1 || nb <= 0.1 || (cons === 'sum' && na + nb >= S - 0.1)) continue;
          if (better(value(na, nb))) {
            pa = na;
            pb = nb;
            moved = true;
            break;
          }
        }
        if (!moved) step /= 2;
        syncAB();
        update();
        if (step > 0.002) id = requestAnimationFrame(tick);
      };
      cancelAnimationFrame(id);
      tick();
    }, 'primary'));
    const curveGroup = group(t('Courbe', 'Curve'), AP.row, PP.row, XP.row, button(t('Au minimum', 'To the minimum'), () => {
      X = Math.pow(pe * A, 1 / (pe + 1));
      XP.set(Math.round(X * 100) / 100);
      update();
    }, 'primary'));
    curveGroup.hidden = true;

    controls.append(
      group(t('Mode', 'Mode'), modeSeg.row),
      boxGroup,
      curveGroup,
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          if (mode === 'box') {
            const v = value(pa, pb);
            const opt = best();
            log.add([cons === 'sum' ? `S=${S}` : `V=${V0}`, `${fmt(pa, 1)}·${fmt(pb, 1)}·${fmt(sideC(), 1)}`, fmt(v, 3), fmt(opt, 3)], Math.abs(v / opt - 1) < 0.001 ? 'ok' : undefined);
          } else {
            const xm = Math.pow(pe * A, 1 / (pe + 1));
            log.add([`a=${A}, p=${pe}`, `x=${fmt(X, 2)}`, fmt(X + A / Math.pow(X, pe), 3), `x*=${fmt(xm, 2)}`], Math.abs(X - xm) < 0.03 ? 'ok' : undefined);
          }
        }, 'primary'),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    // --- géométrie de la scène ---
    const narrow = () => stage.w < 560;
    stage.heightFn = () => (mode === 'curve' ? Math.min(460, stage.w * 0.62) : narrow() ? stage.w * 1.45 : Math.min(500, stage.w * 0.58));
    const mapRect = () => {
      const side = narrow() ? stage.w - 24 : Math.min(stage.w * 0.5 - 16, stage.h - 24);
      return { x0: 12, y0: 12, s: side };
    };
    const toMap = (a: number, b: number) => {
      const { x0, y0, s } = mapRect();
      const { aMax, bMax } = bounds();
      return { x: x0 + (a / aMax) * s, y: y0 + s - (b / bMax) * s };
    };
    const fromMap = (x: number, y: number) => {
      const { x0, y0, s } = mapRect();
      const { aMax, bMax } = bounds();
      return { a: ((x - x0) / s) * aMax, b: ((y0 + s - y) / s) * bMax };
    };
    const colorOf = (u: number) => {
      // u ∈ [0,1] : 0 = défavorable (bleu foncé) → 1 = favorable (jaune clair)
      const c0 = [30, 58, 138];
      const c1 = [253, 230, 138];
      const k = Math.max(0, Math.min(1, u));
      return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * k)},${Math.round(c0[1] + (c1[1] - c0[1]) * k)},${Math.round(c0[2] + (c1[2] - c0[2]) * k)})`;
    };

    stage.setDraw((ctx, w, h, p) => {
      if (mode === 'curve') {
        // --- courbe x + a/x^p ---
        const f = (x: number) => x + A / Math.pow(x, pe);
        const xm = Math.pow(pe * A, 1 / (pe + 1));
        const X1 = Math.max(6, xm * 2.4);
        const ymax = Math.min(f(0.35) , 3 * f(xm) + 4);
        const PX = (x: number) => 40 + (x / X1) * (w - 52);
        const PY = (y: number) => h - 30 - (y / ymax) * (h - 52);
        ctx.strokeStyle = p.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, h - 30);
        ctx.lineTo(w - 10, h - 30);
        ctx.moveTo(40, 10);
        ctx.lineTo(40, h - 30);
        ctx.stroke();
        ctx.strokeStyle = p.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let started = false;
        for (let x = 0.3; x <= X1; x += X1 / 300) {
          const y = f(x);
          if (y > ymax * 1.2) continue;
          started ? ctx.lineTo(PX(x), PY(y)) : ctx.moveTo(PX(x), PY(y));
          started = true;
        }
        ctx.stroke();
        // minimum
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PX(xm), h - 30);
        ctx.lineTo(PX(xm), PY(f(xm)));
        ctx.lineTo(40, PY(f(xm)));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(PX(xm), PY(f(xm)), 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.accent;
        ctx.strokeStyle = p.surface;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(PX(X), PY(f(X)), 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = p.muted;
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`x* = ${fmt(xm, 2)}`, PX(xm), h - 14);
        ctx.textAlign = 'right';
        ctx.fillText(`${fmt(f(xm), 2)}`, 36, PY(f(xm)) + 4);
        return;
      }
      // --- carte (a, b) ---
      const { x0, y0, s } = mapRect();
      const { aMax, bMax } = bounds();
      const N = 64;
      const opt = best();
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) {
          const a = ((i + 0.5) / N) * aMax;
          const b = ((j + 0.5) / N) * bMax;
          const v = value(a, b);
          let u = 0;
          let ok = true;
          if (cons === 'sum') {
            ok = Number.isFinite(v);
            u = ok ? v / opt : 0;
          } else {
            u = opt / v; // somme minimale = 1
            ok = Number.isFinite(v) && v < opt * 5;
          }
          if (!ok) continue;
          ctx.fillStyle = colorOf(Math.pow(u, 1.6));
          ctx.fillRect(x0 + (i / N) * s, y0 + s - ((j + 1) / N) * s, s / N + 0.6, s / N + 0.6);
        }
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0, y0, s, s);
      ctx.fillStyle = p.muted;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('a →', x0 + s / 2, y0 + s + 11);
      ctx.save();
      ctx.translate(x0 - 2, y0 + s / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('b →', 0, -2);
      ctx.restore();
      // meilleur point
      const c0 = cons === 'sum' ? S / 3 : Math.cbrt(V0);
      const bp = toMap(c0, c0);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 11, 0, Math.PI * 2);
      ctx.stroke();
      // point choisi
      const cp = toMap(pa, pb);
      ctx.fillStyle = p.accent;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // boîte en perspective cavalière
      const bx = narrow() ? 20 : x0 + s + 24;
      const by = narrow() ? y0 + s + 28 : y0 + 10;
      const bw = narrow() ? w - 40 : w - bx - 16;
      const bh = narrow() ? h - by - 12 : h - 24;
      const c = sideC();
      const mx = Math.max(pa, pb, c, 0.01);
      const sc = Math.min((bw * 0.62) / (pa + c * 0.5), (bh * 0.85) / (pb + c * 0.5), (Math.min(bw, bh) * 0.8) / mx);
      const W = pa * sc;
      const Hh = pb * sc;
      const D = c * sc * 0.5;
      const ox = bx + 10;
      const oy = by + bh - 8;
      const face = (pts: [number, number][], fill: string) => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };
      face([[ox, oy], [ox + W, oy], [ox + W, oy - Hh], [ox, oy - Hh]], 'rgba(37,99,235,0.35)');
      face([[ox, oy - Hh], [ox + W, oy - Hh], [ox + W + D, oy - Hh - D], [ox + D, oy - Hh - D]], 'rgba(253,230,138,0.6)');
      face([[ox + W, oy], [ox + W + D, oy - D], [ox + W + D, oy - Hh - D], [ox + W, oy - Hh]], 'rgba(29,122,51,0.35)');
      ctx.fillStyle = p.ink;
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`a = ${fmt(pa, 2)}`, ox + W / 2, oy + 14);
      ctx.textAlign = 'right';
      ctx.fillText(`b = ${fmt(pb, 2)}`, ox - 4, oy - Hh / 2);
      ctx.textAlign = 'left';
      ctx.fillText(`c = ${fmt(c, 2)}`, ox + W + D + 4, oy - D - Hh / 2);
      void h;
    });

    enableDrag(
      stage,
      () => (mode === 'box' ? [{ x: toMap(pa, pb).x, y: toMap(pa, pb).y, r: 12 }] : []),
      (_i, x, y) => {
        if (mode === 'box') {
          const m = fromMap(x, y);
          pa = Math.max(0.1, Math.min(bounds().aMax * 0.99, m.a));
          pb = Math.max(0.1, Math.min(bounds().bMax * 0.99, m.b));
          syncAB();
          update();
        }
      },
    );
    // en mode courbe, on déplace x en cliquant/glissant sur l'axe
    const dragCurve = (e: PointerEvent) => {
      if (mode !== 'curve' || e.buttons !== 1) return;
      const r = stage.cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * stage.w;
      const X1 = Math.max(6, Math.pow(pe * A, 1 / (pe + 1)) * 2.4);
      X = Math.min(8, Math.max(0.1, ((x - 40) / (stage.w - 52)) * X1));
      XP.set(Math.round(X * 100) / 100);
      update();
    };
    stage.cv.addEventListener('pointerdown', dragCurve);
    stage.cv.addEventListener('pointermove', dragCurve);

    syncAB();
    update();
  },
};
