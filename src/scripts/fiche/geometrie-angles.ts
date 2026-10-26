import { C, S, deg, ease, rad, runner, tween, at, type Fig } from './core';
import type { FicheFigure } from './index';

/**
 * Angles : (1) angle inscrit = moitié de l'angle au centre — le point M glisse sur le
 * cercle, l'angle AMB ne bouge pas ; (2) somme des angles d'un triangle : on « recolle »
 * les trois angles pour former un angle plat.
 */

const CX = 150;
const CY = 140;
const R = 105;

type P = [number, number];
const polar = (a: number): P => [CX + R * Math.cos(rad(a)), CY + R * Math.sin(rad(a))];
const angleAt = (v: P, p: P, q: P): number => {
  const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]);
  const a2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
  let d = Math.abs(a1 - a2);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return deg(d);
};

export const figure: FicheFigure = {
  size: [640, 290],
  label: {
    fr: 'À gauche, un cercle : l’angle inscrit AMB reste égal à la moitié de l’angle au centre AOB quand M se déplace. À droite, les trois angles d’un triangle recollés forment un angle plat.',
    en: 'Left, a circle: the inscribed angle AMB stays half the central angle AOB as M moves. Right, the three angles of a triangle put together make a straight angle.',
  },
  draw(fig: Fig) {
    const { T, svg } = fig;
    const run = runner();

    /* ------------------------------ Angle inscrit ------------------------------ */
    let arc = 100; // angle au centre AOB, en degrés
    let mAng = -90; // position de M sur le cercle (degrés écran)
    let walking = false;

    const circle = S('circle', { cx: CX, cy: CY, r: R, fill: C.none, stroke: C.line, 'stroke-width': 2 });
    const wedge = S('path', { fill: C.soft, opacity: 0.8, stroke: C.none });
    const lineOA = S('line', { stroke: C.accent, 'stroke-width': 2 });
    const lineOB = S('line', { stroke: C.accent, 'stroke-width': 2 });
    const lineMA = S('line', { stroke: C.primary, 'stroke-width': 2.5 });
    const lineMB = S('line', { stroke: C.primary, 'stroke-width': 2.5 });
    const arcCentral = S('path', { fill: C.none, stroke: C.accent, 'stroke-width': 3 });
    const arcInscribed = S('path', { fill: C.none, stroke: C.primary, 'stroke-width': 3 });
    const dot = (color: string, r = 5) => S('circle', { r, fill: color, stroke: C.surface, 'stroke-width': 1.5 });
    const dotA = dot(C.accent);
    const dotB = dot(C.accent);
    const dotO = dot(C.ink, 3.5);
    const dotM = S('circle', { r: 9, fill: C.primary, stroke: C.surface, 'stroke-width': 2, style: 'cursor:grab;touch-action:none', tabindex: 0, role: 'slider', 'aria-label': T('point M, à déplacer sur le cercle', 'point M, drag it along the circle') });
    const lbl = (t: string, color = C.ink) => S('text', { 'font-size': 14, 'font-weight': 700, fill: color, 'text-anchor': 'middle' }, t);
    const tA = lbl('A');
    const tB = lbl('B');
    const tO = lbl('O');
    const tM = lbl('M', C.primary);
    const tCentral = lbl('', C.accent);
    const tInscribed = lbl('', C.primary);
    svg.append(circle, wedge, lineOA, lineOB, lineMA, lineMB, arcCentral, arcInscribed, dotO, dotA, dotB, dotM, tA, tB, tO, tM, tCentral, tInscribed);

    const sector = (v: P, a1: number, a2: number, rr: number) => {
      // arc de rayon rr centré en v, de l'angle a1 à a2 (degrés écran, a2 > a1)
      const x1 = v[0] + rr * Math.cos(rad(a1));
      const y1 = v[1] + rr * Math.sin(rad(a1));
      const x2 = v[0] + rr * Math.cos(rad(a2));
      const y2 = v[1] + rr * Math.sin(rad(a2));
      return { x1, y1, x2, y2, large: a2 - a1 > 180 ? 1 : 0 };
    };

    const drawCircle = () => {
      // A et B symétriques autour de la verticale basse (90°) ; l'arc AB court est en bas.
      const aA = 90 - arc / 2;
      const aB = 90 + arc / 2;
      // M doit rester sur le grand arc (hors de [aA, aB])
      let m = ((mAng % 360) + 360) % 360;
      if (m > aA - 8 && m < aB + 8) m = m < 90 ? aA - 8 : aB + 8;
      mAng = m;
      const A = polar(aA);
      const B = polar(aB);
      const M = polar(m);
      const O: P = [CX, CY];
      const set = (n: SVGElement, a: Record<string, number | string>) => Object.entries(a).forEach(([k, v]) => n.setAttribute(k, String(v)));
      const seg = (n: SVGElement, p: P, q: P) => set(n, { x1: p[0], y1: p[1], x2: q[0], y2: q[1] });
      seg(lineOA, O, A);
      seg(lineOB, O, B);
      seg(lineMA, M, A);
      seg(lineMB, M, B);
      at(dotA, A[0], A[1]);
      at(dotB, B[0], B[1]);
      at(dotO, CX, CY);
      at(dotM, M[0], M[1]);
      at(tA, A[0] - 6, A[1] + 22);
      at(tB, B[0] + 6, B[1] + 22);
      at(tO, CX - 12, CY - 7);
      at(tM, M[0] + 16 * Math.cos(rad(m)), M[1] + 16 * Math.sin(rad(m)) + 5);
      // secteur de l'angle au centre
      const s = sector(O, aA, aB, 34);
      const w = sector(O, aA, aB, R);
      wedge.setAttribute('d', `M${CX} ${CY} L${w.x1} ${w.y1} A${R} ${R} 0 ${w.large} 1 ${w.x2} ${w.y2} Z`);
      arcCentral.setAttribute('d', `M${s.x1} ${s.y1} A34 34 0 ${s.large} 1 ${s.x2} ${s.y2}`);
      // petit arc de l'angle inscrit en M, entre les directions MA et MB
      const dA = deg(Math.atan2(A[1] - M[1], A[0] - M[0]));
      const dB = deg(Math.atan2(B[1] - M[1], B[0] - M[0]));
      let lo = Math.min(dA, dB);
      let hi = Math.max(dA, dB);
      if (hi - lo > 180) [lo, hi] = [hi, lo + 360];
      const i = sector(M, lo, hi, 30);
      arcInscribed.setAttribute('d', `M${i.x1} ${i.y1} A30 30 0 ${i.large} 1 ${i.x2} ${i.y2}`);
      const mid = rad((lo + hi) / 2);
      at(tInscribed, M[0] + 52 * Math.cos(mid), M[1] + 52 * Math.sin(mid) + 5);
      const central = angleAt(O, A, B);
      const inscribed = angleAt(M, A, B);
      tCentral.textContent = `${Math.round(central)}°`;
      at(tCentral, CX, CY + 62);
      tInscribed.textContent = `${Math.round(inscribed)}°`;
      fig.say(
        T(
          `Angle au centre AOB = ${Math.round(central)}°, angle inscrit AMB = ${Math.round(inscribed)}° : c’est la moitié, où que soit M sur le grand arc.`,
          `Central angle AOB = ${Math.round(central)}°, inscribed angle AMB = ${Math.round(inscribed)}°: exactly half, wherever M is on the major arc.`,
        ),
      );
    };

    const pointerToAngle = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      const k = svg.viewBox.baseVal.width / r.width;
      const x = (e.clientX - r.left) * k - CX;
      const y = (e.clientY - r.top) * k - CY;
      return deg(Math.atan2(y, x));
    };
    dotM.addEventListener('pointerdown', (e) => {
      walking = false;
      run.next();
      dotM.setPointerCapture(e.pointerId);
      dotM.style.cursor = 'grabbing';
    });
    dotM.addEventListener('pointermove', (e) => {
      if (!dotM.hasPointerCapture(e.pointerId)) return;
      mAng = pointerToAngle(e);
      drawCircle();
    });
    dotM.addEventListener('pointerup', () => (dotM.style.cursor = 'grab'));
    dotM.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      mAng += e.key === 'ArrowRight' ? 6 : -6;
      drawCircle();
    });

    /* ------------------------------ Somme des angles ------------------------------ */
    const TX = 330;
    const shapes: P[][] = [
      [[360, 190], [600, 230], [470, 60]],
      [[350, 215], [590, 205], [380, 80]],
      [[380, 225], [600, 215], [560, 70]],
    ];
    let shape = 0;
    const triPath = S('path', { fill: C.soft, opacity: 0.5, stroke: C.ink, 'stroke-width': 2, 'stroke-linejoin': 'round' });
    const slices = [C.accent, C.primary, '#d97706'].map((color) => S('path', { fill: color, opacity: 0.9, stroke: C.surface, 'stroke-width': 1.5 }));
    const flatLine = S('line', { x1: TX + 20, y1: 268, x2: 625, y2: 268, stroke: C.muted, 'stroke-width': 1.5, opacity: 0 });
    const sumText = S('text', { x: 478, y: 18, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: C.ink });
    svg.append(triPath, flatLine, ...slices, sumText);

    const geom = () => {
      const V = shapes[shape];
      return V.map((v, i) => {
        const p = V[(i + 1) % 3];
        const q = V[(i + 2) % 3];
        const aP = deg(Math.atan2(p[1] - v[1], p[0] - v[0]));
        const aQ = deg(Math.atan2(q[1] - v[1], q[0] - v[0]));
        let d = aQ - aP;
        while (d > 180) d -= 360;
        while (d <= -180) d += 360;
        return { v, start: d > 0 ? aP : aQ, sweep: Math.abs(d) };
      });
    };
    const slicePath = (sweep: number, rr: number) => {
      const x = rr * Math.cos(rad(sweep));
      const y = rr * Math.sin(rad(sweep));
      return `M0 0 L${rr} 0 A${rr} ${rr} 0 ${sweep > 180 ? 1 : 0} 1 ${x} ${y} Z`;
    };
    /** t = 0 : angles sur les sommets ; t = 1 : angles recollés en un angle plat. */
    const place = (t: number) => {
      const g = geom();
      const px = 478;
      const py = 262;
      let acc = 0;
      g.forEach((s, i) => {
        const target = { x: px, y: py, rot: 180 + acc };
        const k = ease(t);
        const rot = s.start + (target.rot - s.start) * k;
        slices[i].setAttribute('d', slicePath(s.sweep, 30));
        at(slices[i], s.v[0] + (target.x - s.v[0]) * k, s.v[1] + (target.y - s.v[1]) * k, rot);
        acc += s.sweep;
      });
      flatLine.setAttribute('opacity', String(t));
      const [a, b, c] = g.map((s) => Math.round(s.sweep));
      sumText.textContent = t > 0.98 ? `${a}° + ${b}° + ${c}° = ${a + b + c}°` : '';
    };
    const drawTri = () => {
      const V = shapes[shape];
      triPath.setAttribute('d', `M${V.map((v) => v.join(' ')).join(' L')} Z`);
      place(0);
    };
    let flat = false;
    const glue = async () => {
      const alive = run.token();
      const goFlat = !flat;
      flat = goFlat;
      fig.say(goFlat ? T('On recolle les trois angles côte à côte : ils forment un angle plat, donc 180°.', 'The three angles put side by side make a straight angle, so 180°.') : T('Les angles reviennent à leurs sommets.', 'The angles return to their vertices.'));
      await tween(1300, (t) => alive() && place(goFlat ? t : 1 - t));
    };

    fig.range(T('angle au centre AOB', 'central angle AOB'), 30, 170, arc, 1, (v) => {
      arc = v;
      drawCircle();
    }, (v) => `${v}°`);
    fig.btn(T('▶ Promener M', '▶ Walk M'), () => {
      walking = !walking;
      const alive = run.token();
      const step = (now: number, last: number) => {
        if (!walking || !alive()) return;
        mAng += ((now - last) / 1000) * 40;
        drawCircle();
        requestAnimationFrame((n) => step(n, now));
      };
      if (walking) requestAnimationFrame((n) => step(n, n));
    }, true);
    fig.btn(T('Recoller les angles du triangle', 'Glue the triangle’s angles'), glue);
    fig.btn(T('Autre triangle', 'Another triangle'), () => {
      run.next();
      shape = (shape + 1) % shapes.length;
      flat = false;
      drawTri();
    });

    svg.append(S('text', { x: 20, y: 22, 'font-size': 13, fill: C.muted }, T('Angle inscrit', 'Inscribed angle')));
    drawCircle();
    drawTri();
  },
};
