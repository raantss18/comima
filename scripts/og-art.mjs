// Illustrations vectorielles (500 × 500) des simulations, pour les aperçus de partage
// (Open Graph). Chaque fonction renvoie des éléments SVG ; elles sont volontairement
// simples : ce sont des vignettes reconnaissables, pas des captures d'écran.

const GREEN = '#1d7a33';
const RED = '#d6362b';
const BLUE = '#2563eb';
const ORANGE = '#f59e0b';
const INK = '#1f2937';
const LIGHT = '#e5e7eb';

const f = (n) => Number(n.toFixed(1));
const line = (x1, y1, x2, y2, stroke, w = 2, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const circle = (x, y, r, fill, stroke = 'none', sw = 0) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const rect = (x, y, w, h, fill, stroke = 'none', sw = 0, rx = 0) =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="${rx}"/>`;
const text = (x, y, s, size, fill = INK, anchor = 'middle', weight = 700) =>
  `<text x="${f(x)}" y="${f(y)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif">${s}</text>`;
const poly = (pts, fill, stroke = 'none', sw = 0) =>
  `<polygon points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;

/** Pavage récursif d'un carré 2ⁿ privé d'une case. */
function tile(size, hole) {
  const out = [];
  const rec = (r0, c0, s, h) => {
    if (s === 2) {
      const cells = [];
      for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) if (r0 + dr !== h[0] || c0 + dc !== h[1]) cells.push([r0 + dr, c0 + dc]);
      out.push(cells);
      return;
    }
    const half = s / 2;
    const quads = [
      [r0, c0, [r0 + half - 1, c0 + half - 1]],
      [r0, c0 + half, [r0 + half - 1, c0 + half]],
      [r0 + half, c0, [r0 + half, c0 + half - 1]],
      [r0 + half, c0 + half, [r0 + half, c0 + half]],
    ];
    const q = quads.findIndex(([r, c]) => h[0] >= r && h[0] < r + half && h[1] >= c && h[1] < c + half);
    out.push(quads.filter((_, i) => i !== q).map((x) => x[2]));
    quads.forEach(([r, c, ctr], i) => rec(r, c, half, i === q ? h : ctr));
  };
  rec(0, 0, size, hole);
  return out;
}

const isPrime = (n) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

export const art = {
  'regions-du-cercle'() {
    const n = 7;
    const P = Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2 + (i % 2 ? 0.07 : -0.05);
      return [250 + 205 * Math.cos(a), 250 + 205 * Math.sin(a)];
    });
    let s = circle(250, 250, 205, 'none', INK, 5);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) s += line(...P[i], ...P[j], GREEN, 2.5, 'opacity="0.85"');
    P.forEach((p) => (s += circle(p[0], p[1], 11, '#fff', INK, 4)));
    return s;
  },

  'polynome-d-euler'() {
    let s = '';
    const cols = 8;
    for (let n = 0; n < 48; n++) {
      const x = 22 + (n % cols) * 58;
      const y = 40 + Math.floor(n / cols) * 66;
      const v = n * n + n + 41;
      const col = n === 40 ? ORANGE : isPrime(v) ? GREEN : RED;
      s += rect(x, y, 52, 58, col, 'none', 0, 8);
    }
    s += text(250, 462, 'n² + n + 41', 40, INK);
    return s;
  },

  'pavages-en-l'() {
    const size = 4;
    const cell = 100;
    const x0 = 50;
    const y0 = 50;
    let s = rect(x0, y0, 400, 400, '#fff', INK, 4);
    tile(size, [0, 0]).forEach((cells, i) => {
      const col = `hsl(${(i * 53 + 10) % 360} 70% 62%)`;
      cells.forEach(([r, c]) => (s += rect(x0 + c * cell + 2, y0 + r * cell + 2, cell - 4, cell - 4, col, INK, 2, 6)));
    });
    s += rect(x0 + 4, y0 + 4, cell - 8, cell - 8, '#111827', 'none', 0, 6);
    s += line(x0 + 30, y0 + 30, x0 + 70, y0 + 70, '#fff', 6) + line(x0 + 70, y0 + 30, x0 + 30, y0 + 70, '#fff', 6);
    return s;
  },

  'suites-recurrentes'() {
    const v = [1, 1, 2, 3, 5, 8, 13, 21, 34];
    const bw = 44;
    let s = line(30, 440, 480, 440, INK, 3);
    v.forEach((x, i) => {
      const h = (x / 34) * 360;
      s += rect(34 + i * 50, 440 - h, bw, h, i % 2 ? BLUE : '#60a5fa', 'none', 0, 6);
    });
    s += `<path d="M34 430 C 140 420, 250 330, 480 70" fill="none" stroke="${ORANGE}" stroke-width="5" stroke-dasharray="10 8"/>`;
    s += text(250, 480, 'u(n+2) = u(n+1) + u(n)', 24, INK);
    return s;
  },

  'droites-ordinaires'() {
    const P = [
      [90, 380],
      [200, 110],
      [340, 300],
      [420, 140],
      [150, 250],
      [300, 430],
    ];
    let s = '<clipPath id="c"><rect x="20" y="20" width="460" height="460" rx="12"/></clipPath><g clip-path="url(#c)">';
    for (let i = 0; i < P.length; i++)
      for (let j = i + 1; j < P.length; j++) {
        const [a, b] = [P[i], P[j]];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const L = Math.hypot(dx, dy);
        s += line(a[0] - (dx / L) * 700, a[1] - (dy / L) * 700, a[0] + (dx / L) * 700, a[1] + (dy / L) * 700, GREEN, 2.4, 'opacity="0.7"');
      }
    s += '</g>';
    P.forEach((p) => (s += circle(p[0], p[1], 12, '#fff', INK, 4)));
    return s;
  },

  'principe-du-maximum'() {
    let s = '';
    const n = 10;
    const cell = 46;
    const x0 = 20;
    const y0 = 20;
    const color = (u) => {
      const c0 = [37, 99, 235];
      const c1 = [251, 191, 36];
      const c2 = [220, 38, 38];
      const k = u < 0.5 ? [c0, c1] : [c1, c2];
      const t = u < 0.5 ? u * 2 : (u - 0.5) * 2;
      return `rgb(${k[0].map((a, i) => Math.round(a + (k[1][i] - a) * t)).join(',')})`;
    };
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        // plaque : haut chaud (100), bas froid (0), côtés intermédiaires
        const u = Math.max(0, Math.min(1, 1 - i / (n - 1) - 0.1 * Math.sin((Math.PI * j) / (n - 1)) * (i / (n - 1)) + 0.05));
        s += rect(x0 + j * cell, y0 + i * cell, cell, cell, color(u));
      }
    s += rect(x0, y0, n * cell, n * cell, 'none', INK, 4);
    s += rect(x0 + 4 * cell + 3, y0 + 3, cell - 6, cell - 6, 'none', INK, 5);
    s += text(x0 + 4.5 * cell, y0 + 34, '★', 32, INK);
    return s;
  },

  'points-dans-un-carre'() {
    let s = rect(50, 50, 400, 400, '#fff', INK, 5);
    s += line(250, 50, 250, 450, GREEN, 3, 'stroke-dasharray="12 9"') + line(50, 250, 450, 250, GREEN, 3, 'stroke-dasharray="12 9"');
    const P = [[50, 50], [450, 50], [250, 250], [50, 450], [450, 450]];
    [[50, 50], [450, 50], [50, 450], [450, 450]].forEach((c) => (s += line(250, 250, c[0], c[1], RED, 5)));
    P.forEach((p, i) => (s += circle(Math.min(430, Math.max(70, p[0])), Math.min(430, Math.max(70, p[1])), 14, i === 2 ? RED : GREEN, '#fff', 4)));
    return s;
  },

  anniversaires() {
    let s = '';
    const cols = 25;
    for (let k = 0; k < 350; k++) {
      const x = 28 + (k % cols) * 18.2;
      const y = 40 + Math.floor(k / cols) * 18.2;
      s += rect(x, y, 15, 15, k === 123 || k === 301 ? RED : k % 31 === 7 ? BLUE : LIGHT, 'none', 0, 3);
    }
    s += `<path d="M40 440 C 130 436, 190 420, 250 330 S 400 220, 470 205" fill="none" stroke="${GREEN}" stroke-width="7"/>`;
    s += line(40, 450, 470, 450, INK, 3);
    s += circle(250, 330, 11, ORANGE, '#fff', 3);
    return s;
  },

  'polygone-des-milieux'() {
    const A = [[70, 130], [430, 70], [450, 400], [90, 440]];
    const M = A.map((p, i) => [(p[0] + A[(i + 1) % 4][0]) / 2, (p[1] + A[(i + 1) % 4][1]) / 2]);
    let s = poly(A, 'rgba(120,120,120,0.12)', INK, 5);
    s += line(...A[0], ...A[2], '#9ca3af', 2, 'stroke-dasharray="8 6"') + line(...A[1], ...A[3], '#9ca3af', 2, 'stroke-dasharray="8 6"');
    s += poly(M, 'rgba(29,122,51,0.3)', GREEN, 6);
    A.forEach((p) => (s += circle(p[0], p[1], 12, '#fff', INK, 4)));
    M.forEach((p) => (s += circle(p[0], p[1], 8, GREEN)));
    const g = [A.reduce((a, p) => a + p[0], 0) / 4, A.reduce((a, p) => a + p[1], 0) / 4];
    s += circle(g[0], g[1], 14, 'none', RED, 5);
    return s;
  },

  'droite-d-euler'() {
    const A = [70, 390];
    const B = [440, 420];
    const C = [210, 70];
    const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
    const sq = (p) => p[0] * p[0] + p[1] * p[1];
    const O = [
      (sq(A) * (B[1] - C[1]) + sq(B) * (C[1] - A[1]) + sq(C) * (A[1] - B[1])) / d,
      (sq(A) * (C[0] - B[0]) + sq(B) * (A[0] - C[0]) + sq(C) * (B[0] - A[0])) / d,
    ];
    const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    const H = [A[0] + B[0] + C[0] - 2 * O[0], A[1] + B[1] + C[1] - 2 * O[1]];
    const R = Math.hypot(O[0] - A[0], O[1] - A[1]);
    let s = '<clipPath id="e"><rect x="10" y="10" width="480" height="480" rx="14"/></clipPath><g clip-path="url(#e)">';
    s += circle(O[0], O[1], R, 'none', GREEN, 3).replace('/>', ' stroke-dasharray="10 8"/>');
    const dx = H[0] - O[0];
    const dy = H[1] - O[1];
    const L = Math.hypot(dx, dy);
    s += line(O[0] - (dx / L) * 700, O[1] - (dy / L) * 700, O[0] + (dx / L) * 700, O[1] + (dy / L) * 700, ORANGE, 6);
    s += poly([A, B, C], 'rgba(120,120,120,0.12)', INK, 5);
    s += '</g>';
    [[A, '#fff'], [B, '#fff'], [C, '#fff']].forEach(([p]) => (s += circle(p[0], p[1], 11, '#fff', INK, 4)));
    s += circle(O[0], O[1], 11, GREEN, '#fff', 3) + circle(G[0], G[1], 11, BLUE, '#fff', 3) + circle(H[0], H[1], 11, RED, '#fff', 3);
    s += text(O[0] - 20, O[1] - 14, 'O', 26, GREEN) + text(G[0] + 4, G[1] + 36, 'G', 26, BLUE) + text(H[0] + 22, H[1] - 12, 'H', 26, RED);
    return s;
  },

  'cycle-des-puissances'() {
    const m = 13;
    const pos = (v) => [250 + 190 * Math.cos(-Math.PI / 2 + (2 * Math.PI * v) / m), 250 + 190 * Math.sin(-Math.PI / 2 + (2 * Math.PI * v) / m)];
    let s = circle(250, 250, 190, 'none', LIGHT, 3);
    let x = 1;
    for (let k = 0; k < 12; k++) {
      const nx = (x * 2) % m;
      const [a, b] = [pos(x), pos(nx)];
      s += line(a[0], a[1], b[0], b[1], GREEN, 4, 'opacity="0.75"');
      x = nx;
    }
    for (let v = 0; v < m; v++) {
      const [px, py] = pos(v);
      s += circle(px, py, 21, v === 1 ? RED : v === 0 ? '#fff' : GREEN, INK, 3) + text(px, py + 7, String(v), 20, v === 0 ? INK : '#fff');
    }
    s += text(250, 262, '2ᵏ mod 13', 26, INK);
    return s;
  },

  'pieces-de-monnaie'() {
    const reach = [true];
    for (let x = 1; x < 56; x++) reach.push((x >= 5 && reach[x - 5]) || (x >= 7 && reach[x - 7]));
    let s = '';
    for (let x = 0; x < 56; x++) {
      const px = 30 + (x % 8) * 56;
      const py = 30 + Math.floor(x / 8) * 56;
      s += rect(px, py, 50, 50, x === 23 ? ORANGE : reach[x] ? GREEN : RED, 'none', 0, 7);
      s += text(px + 25, py + 33, String(x), 20, '#fff');
    }
    s += circle(120, 450, 30, ORANGE, '#b45309', 4) + text(120, 460, '5', 30, '#78350f');
    s += circle(220, 450, 30, ORANGE, '#b45309', 4) + text(220, 460, '7', 30, '#78350f');
    s += text(380, 460, '5·7−5−7 = 23', 24, INK);
    return s;
  },

  'chemins-de-catalan'() {
    const n = 5;
    const c = 80;
    const x0 = 50;
    const y0 = 50;
    const X = (i) => x0 + i * c;
    const Y = (j) => y0 + (n - j) * c;
    let s = `<polygon points="${X(0)},${Y(0)} ${X(0)},${Y(n)} ${X(n)},${Y(n)}" fill="rgba(214,54,43,0.14)"/>`;
    for (let i = 0; i <= n; i++) s += line(X(i), Y(0), X(i), Y(n), LIGHT, 2) + line(X(0), Y(i), X(n), Y(i), LIGHT, 2);
    s += line(X(0), Y(0), X(n), Y(n), RED, 4, 'stroke-dasharray="12 8"');
    const path = (steps, col, w) => {
      let x = 0;
      let y = 0;
      let d = `M${X(0)} ${Y(0)}`;
      for (const st of steps) {
        if (st === 'R') x++;
        else y++;
        d += ` L${X(x)} ${Y(y)}`;
      }
      return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    };
    s += path('RRURUURUUR'.split(''), GREEN, 8) + path('RURRURUURU'.split(''), GREEN, 8).replace(GREEN, '#34d399');
    s += path('UURRRURUUR'.split('').slice(0, 10), RED, 6);
    s += circle(X(0), Y(0), 10, INK) + circle(X(n), Y(n), 10, INK);
    return s;
  },

  'triangle-de-pascal'() {
    const R = 32;
    const cs = 13;
    let s = '';
    const row = [[1]];
    for (let n = 1; n < R; n++) {
      row.push([]);
      for (let k = 0; k <= n; k++) row[n].push(((k > 0 ? row[n - 1][k - 1] : 0) + (k < n ? row[n - 1][k] : 0)) % 2);
    }
    for (let n = 0; n < R; n++)
      for (let k = 0; k <= n; k++) {
        const x = 250 + (k - n / 2) * cs - cs / 2;
        const y = 24 + n * (cs + 1.2);
        s += rect(x, y, cs - 1, cs, row[n][k] ? GREEN : LIGHT, 'none', 0, 2);
      }
    return s;
  },

  taquin() {
    const t = [1, 2, 3, 4, 0, 6, 7, 5, 8];
    let s = rect(40, 40, 420, 420, '#374151', 'none', 0, 18);
    t.forEach((v, i) => {
      const x = 52 + (i % 3) * 132;
      const y = 52 + Math.floor(i / 3) * 132;
      if (!v) return;
      const home = v === i + 1;
      s += rect(x, y, 122, 122, home ? '#d1fae5' : '#fff', home ? GREEN : INK, 4, 14);
      s += text(x + 61, y + 82, String(v), 64, INK);
    });
    return s;
  },

  'operations-sur-des-nombres'() {
    const top = [1, 2, 3, 4, 5, 6, 7];
    let s = '';
    const tx = (i) => 55 + i * 65;
    top.forEach((v, i) => (s += circle(tx(i), 90, 26, BLUE, '#fff', 3) + text(tx(i), 99, String(v), 26, '#fff')));
    const mid = [[0, 1, 1, 1], [2, 3, 1, 3], [4, 5, 1, 5]];
    mid.forEach(([a, b, v, c]) => {
      const mx = (tx(a) + tx(b)) / 2;
      s += line(tx(a), 116, mx, 214, '#9ca3af', 3) + line(tx(b), 116, mx, 214, '#9ca3af', 3);
      s += circle(mx, 240, 26, ORANGE, '#fff', 3) + text(mx, 249, String(v), 26, '#fff');
      void c;
    });
    s += line(tx(6), 116, tx(6), 214, '#9ca3af', 3) + circle(tx(6), 240, 26, BLUE, '#fff', 3) + text(tx(6), 249, '7', 26, '#fff');
    s += line(85, 266, 250, 380, '#9ca3af', 3) + line(250, 266, 250, 380, '#9ca3af', 3) + line(380, 266, 250, 380, '#9ca3af', 3);
    s += circle(250, 410, 36, GREEN, '#fff', 4) + text(250, 424, '?', 40, '#fff');
    s += text(250, 480, '|a − b|', 28, INK);
    return s;
  },

  'quatre-moyennes'() {
    const v = [3, 6, 9, 14];
    const H = 4 / v.reduce((s, x) => s + 1 / x, 0);
    const G = Math.exp(v.reduce((s, x) => s + Math.log(x), 0) / 4);
    const A = v.reduce((s, x) => s + x, 0) / 4;
    const Q = Math.sqrt(v.reduce((s, x) => s + x * x, 0) / 4);
    const Y = (x) => 450 - (x / 16) * 400;
    let s = line(30, 450, 470, 450, INK, 3);
    v.forEach((x, i) => (s += rect(50 + i * 100, Y(x), 70, 450 - Y(x), 'rgba(29,122,51,0.4)', GREEN, 4, 6)));
    [[Q, '#b45309', 'Q'], [A, RED, 'A'], [G, GREEN, 'G'], [H, BLUE, 'H']].forEach(([x, col, name]) => {
      s += line(30, Y(x), 450, Y(x), col, 4, 'stroke-dasharray="14 8"') + text(470, Y(x) + 8, name, 24, col, 'end');
    });
    return s;
  },

  'optimisation-et-moyennes'() {
    const W = 180;
    const Hh = 150;
    const D = 90;
    const ox = 70;
    const oy = 330;
    let s = poly([[ox, oy], [ox + W, oy], [ox + W, oy - Hh], [ox, oy - Hh]], 'rgba(37,99,235,0.45)', INK, 4);
    s += poly([[ox, oy - Hh], [ox + W, oy - Hh], [ox + W + D, oy - Hh - D], [ox + D, oy - Hh - D]], 'rgba(253,230,138,0.85)', INK, 4);
    s += poly([[ox + W, oy], [ox + W + D, oy - D], [ox + W + D, oy - Hh - D], [ox + W, oy - Hh]], 'rgba(29,122,51,0.45)', INK, 4);
    let d = '';
    for (let x = 0.55; x <= 7; x += 0.1) {
      const y = x + 4 / x;
      const px = 280 + (x / 7) * 200;
      const py = 470 - (y / 12) * 150;
      d += `${d ? 'L' : 'M'}${f(px)} ${f(py)} `;
    }
    s += `<path d="${d}" fill="none" stroke="${GREEN}" stroke-width="6"/>`;
    s += circle(280 + (2 / 7) * 200, 470 - (4 / 12) * 150, 11, ORANGE, '#fff', 3);
    s += line(260, 470, 490, 470, INK, 3);
    return s;
  },
};

/** Vignette neutre pour une simulation sans illustration dédiée. */
export const fallbackArt = () => circle(250, 250, 180, GREEN) + text(250, 275, '∑', 160, '#fff');
