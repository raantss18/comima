/**
 * Simulations interactives des chapitres du cours.
 *
 * Chaque carte de la page « Cours » peut contenir un conteneur
 * `<div data-sim="clé" data-lang="fr|en">`. Ce script y injecte une petite
 * animation manipulable (jauge + visualisation sur <canvas>) illustrant le
 * phénomène du chapitre. Aucune dépendance externe : tout est en Canvas 2D.
 *
 * Objectif pédagogique avant tout : commandes simples (une ou deux jauges),
 * lecture immédiate du résultat, et un message qui explique ce qu'on observe.
 */

type Lang = 'fr' | 'en';

const GREEN = '#1d7a33';
const RED = '#d6362b';
const INK = '#1f2937';
const MUTED = '#6b7280';
const LIGHT = '#e5e7eb';

/* ----------------------------------------------------------------------- */
/* Petits utilitaires de construction d'interface                          */
/* ----------------------------------------------------------------------- */

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

/** Crée une jauge (range) étiquetée + une valeur affichée qui se met à jour. */
function slider(
  label: string,
  min: number,
  max: number,
  value: number,
  step: number,
  onInput: (v: number) => void,
): { row: HTMLElement; input: HTMLInputElement; setReadout: (s: string) => void } {
  const input = el('input', {
    type: 'range',
    min: String(min),
    max: String(max),
    value: String(value),
    step: String(step),
    class: 'sim-range',
  }) as HTMLInputElement;
  const readout = el('span', { class: 'sim-readout' }, String(value));
  const lab = el('label', { class: 'sim-control' }, el('span', {}, label), input, readout);
  const setReadout = (s: string) => (readout.textContent = s);
  input.addEventListener('input', () => onInput(Number(input.value)));
  return { row: lab, input, setReadout };
}

function makeCanvas(host: HTMLElement, height = 260): { cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const cv = el('canvas', { class: 'sim-canvas' }) as HTMLCanvasElement;
  host.append(cv);
  const ctx = cv.getContext('2d')!;
  const resize = () => {
    const w = Math.max(240, host.clientWidth);
    const dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr;
    cv.height = height * dpr;
    cv.style.width = '100%';
    cv.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (cv as any)._w = w;
    (cv as any)._h = height;
    host.dispatchEvent(new CustomEvent('sim:resize'));
  };
  window.addEventListener('resize', resize);
  // Premier dimensionnement après insertion dans le DOM.
  requestAnimationFrame(resize);
  return { cv, ctx };
}

function note(text: string): HTMLElement {
  return el('p', { class: 'sim-note' }, text);
}

const T = (lang: Lang, fr: string, en: string) => (lang === 'fr' ? fr : en);

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/* ----------------------------------------------------------------------- */
/* 00 — Exemples & contre-exemples : la conjecture d'Euler n²+n+41         */
/* ----------------------------------------------------------------------- */

function simConjecture(host: HTMLElement, lang: Lang) {
  const controls = el('div', { class: 'sim-controls' });
  const out = el('div', { class: 'sim-out' });
  const { cv, ctx } = makeCanvas(host, 210);
  const s = slider(T(lang, 'n =', 'n ='), 0, 60, 0, 1, draw);
  controls.append(s.row);
  host.append(controls, out);

  function draw(n: number) {
    s.setReadout(String(n));
    const v = n * n + n + 41;
    const prime = isPrime(v);
    const w = (cv as any)._w as number;
    const h = (cv as any)._h as number;
    ctx.clearRect(0, 0, w, h);
    // Formule
    ctx.fillStyle = INK;
    ctx.font = '600 20px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${n}² + ${n} + 41 = ${v}`, w / 2, 44);
    // Verdict
    ctx.font = '700 22px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.fillStyle = prime ? GREEN : RED;
    ctx.fillText(
      prime ? T(lang, '✔ nombre premier', '✔ prime') : T(lang, '✘ PAS premier', '✘ NOT prime'),
      w / 2,
      86,
    );
    // Bande des cas déjà testés
    const cell = Math.min(26, (w - 20) / 41);
    const y0 = 120;
    ctx.font = '10px "Hanken Grotesk Variable", system-ui, sans-serif';
    for (let k = 0; k <= 40; k++) {
      const vv = k * k + k + 41;
      const p = isPrime(vv);
      const x = 10 + k * cell;
      ctx.fillStyle = p ? '#d9f0df' : '#fbdcd9';
      ctx.fillRect(x, y0, cell - 2, cell - 2);
      if (k === n) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y0, cell - 2, cell - 2);
      }
      if (cell >= 14) {
        ctx.fillStyle = p ? GREEN : RED;
        ctx.textAlign = 'center';
        ctx.fillText(String(k), x + (cell - 2) / 2, y0 + cell / 2 + 3);
      }
    }
    if (cell < 14) {
      ctx.fillStyle = MUTED;
      ctx.font = '10px "Hanken Grotesk Variable", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(T(lang, 'cas n = 0 … 40', 'cases n = 0 … 40'), 10, y0 - 6);
    }
    out.replaceChildren(
      note(
        prime
          ? T(
              lang,
              `Pour n = ${n}, on obtient encore un nombre premier. La formule d'Euler en produit pour n = 0 à 39… mais un exemple ne prouve rien.`,
              `For n = ${n} we still get a prime. Euler's formula does so for n = 0…39 — but one example proves nothing.`,
            )
          : T(
              lang,
              `Contre-exemple ! n = ${n} donne ${v} = 41 × ${v / 41}, divisible par 41. Une seule valeur suffit à réfuter la conjecture.`,
              `Counterexample! n = ${n} gives ${v} = 41 × ${v / 41}, divisible by 41. A single value refutes the conjecture.`,
            ),
      ),
    );
  }
  host.addEventListener('sim:resize', () => draw(Number(s.input.value)));
}

/* ----------------------------------------------------------------------- */
/* 01 — Récurrence : pavages d'une bande 2×n comptés par Fibonacci         */
/* ----------------------------------------------------------------------- */

function simFibo(host: HTMLElement, lang: Lang) {
  const controls = el('div', { class: 'sim-controls' });
  const out = el('div', { class: 'sim-out' });
  const { cv, ctx } = makeCanvas(host, 200);
  const s = slider(T(lang, 'longueur n =', 'length n ='), 1, 12, 5, 1, draw);
  controls.append(s.row);
  host.append(controls, out);

  const fib: number[] = [1, 1];
  for (let i = 2; i <= 14; i++) fib[i] = fib[i - 1] + fib[i - 2];

  // Un pavage type par dominos verticaux/horizontaux (pour l'illustration).
  function sampleTiling(n: number): ('V' | 'H')[] {
    const res: ('V' | 'H')[] = [];
    let i = 0;
    while (i < n) {
      if (i + 1 < n && (i % 3 === 1)) {
        res.push('H');
        i += 2;
      } else {
        res.push('V');
        i += 1;
      }
    }
    return res;
  }

  function draw(n: number) {
    s.setReadout(String(n));
    const count = fib[n + 1];
    const w = (cv as any)._w as number;
    const h = (cv as any)._h as number;
    ctx.clearRect(0, 0, w, h);
    const cell = Math.min(34, (w - 24) / n);
    const gridW = cell * n;
    const x0 = (w - gridW) / 2;
    const y0 = 70;
    // Grille 2×n
    const tiling = sampleTiling(n);
    let x = x0;
    ctx.lineWidth = 2;
    for (const t of tiling) {
      if (t === 'V') {
        ctx.fillStyle = '#d9f0df';
        ctx.strokeStyle = GREEN;
        ctx.fillRect(x + 2, y0 + 2, cell - 4, cell * 2 - 4);
        ctx.strokeRect(x + 2, y0 + 2, cell - 4, cell * 2 - 4);
        x += cell;
      } else {
        ctx.fillStyle = '#fbe6c8';
        ctx.strokeStyle = '#b5771f';
        ctx.fillRect(x + 2, y0 + 2, cell * 2 - 4, cell - 4);
        ctx.fillRect(x + 2, y0 + cell + 2, cell * 2 - 4, cell - 4);
        ctx.strokeRect(x + 2, y0 + 2, cell * 2 - 4, cell - 4);
        ctx.strokeRect(x + 2, y0 + cell + 2, cell * 2 - 4, cell - 4);
        x += 2 * cell;
      }
    }
    ctx.fillStyle = INK;
    ctx.font = '600 18px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      T(lang, `Bande 2 × ${n}`, `2 × ${n} strip`) + `  —  F(${n + 1}) = ${count}`,
      w / 2,
      34,
    );
    out.replaceChildren(
      note(
        T(
          lang,
          `Nombre de pavages par dominos d'une bande 2×${n} : ${count}. Chaque pavage se termine par un domino vertical (2×${n - 1}) ou deux horizontaux (2×${n - 2}) : c'est la récurrence de Fibonacci pₙ = pₙ₋₁ + pₙ₋₂.`,
          `Number of domino tilings of a 2×${n} strip: ${count}. Each tiling ends with a vertical domino (2×${n - 1}) or two horizontal ones (2×${n - 2}): exactly Fibonacci's recurrence pₙ = pₙ₋₁ + pₙ₋₂.`,
        ),
      ),
    );
  }
  host.addEventListener('sim:resize', () => draw(Number(s.input.value)));
}

/* ----------------------------------------------------------------------- */
/* 02 — Principe extrémal : monovariant d'égalisation des piles            */
/* ----------------------------------------------------------------------- */

function simExtremal(host: HTMLElement, lang: Lang) {
  const controls = el('div', { class: 'sim-controls' });
  const out = el('div', { class: 'sim-out' });
  const { cv, ctx } = makeCanvas(host, 230);
  let piles: number[] = [];
  const s = slider(T(lang, 'nombre de piles =', 'number of piles ='), 3, 8, 5, 1, reset);
  const btnStep = el('button', { class: 'sim-btn' }, T(lang, 'Étape', 'Step'));
  const btnReset = el('button', { class: 'sim-btn sim-btn-outline' }, T(lang, 'Rejouer', 'Reset'));
  controls.append(s.row, btnStep, btnReset);
  host.append(controls, out);
  let steps = 0;

  function reset(k?: number) {
    const n = k ?? Number(s.input.value);
    s.setReadout(String(n));
    piles = Array.from({ length: n }, () => 2 + Math.floor(Math.random() * 8));
    steps = 0;
    draw();
  }
  function spread(): number {
    return Math.max(...piles) - Math.min(...piles);
  }
  function step() {
    if (spread() <= 1) return;
    const hi = piles.indexOf(Math.max(...piles));
    const lo = piles.indexOf(Math.min(...piles));
    piles[hi]--;
    piles[lo]++;
    steps++;
    draw();
  }
  function draw() {
    const w = (cv as any)._w as number;
    const h = (cv as any)._h as number;
    ctx.clearRect(0, 0, w, h);
    const n = piles.length;
    const bw = Math.min(48, (w - 20) / n);
    const x0 = (w - bw * n) / 2;
    const maxV = Math.max(...piles, 1);
    const unit = Math.min(16, (h - 60) / maxV);
    const hiV = Math.max(...piles);
    const loV = Math.min(...piles);
    for (let i = 0; i < n; i++) {
      const bh = piles[i] * unit;
      const x = x0 + i * bw;
      const y = h - 30 - bh;
      ctx.fillStyle =
        piles[i] === hiV ? RED : piles[i] === loV ? GREEN : '#9fb8c9';
      ctx.fillRect(x + 3, y, bw - 6, bh);
      ctx.fillStyle = INK;
      ctx.font = '600 13px "Hanken Grotesk Variable", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(piles[i]), x + bw / 2, y - 5);
    }
    ctx.fillStyle = MUTED;
    ctx.font = '13px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      T(lang, `écart max−min = ${spread()}`, `max−min gap = ${spread()}`) +
        `   ·   ${T(lang, 'étapes', 'steps')} : ${steps}`,
      12,
      18,
    );
    const done = spread() <= 1;
    out.replaceChildren(
      note(
        done
          ? T(
              lang,
              `Terminé en ${steps} étapes : l'écart ne peut plus baisser. En regardant toujours la pile extrême (la plus haute → rouge, la plus basse → verte), la quantité « max − min » décroît strictement : elle ne peut décroître indéfiniment, donc le processus s'arrête. C'est le principe extrémal.`,
              `Done in ${steps} steps: the gap can't shrink further. Always acting on the extreme pile (tallest → red, shortest → green), the quantity “max − min” strictly decreases; it cannot decrease forever, so the process halts. That is the extremal principle.`,
            )
          : T(
              lang,
              `À chaque étape on retire un jeton à la pile la plus haute (rouge) et on le donne à la plus basse (verte). Cliquez « Étape ».`,
              `Each step removes a token from the tallest pile (red) and gives it to the shortest (green). Click “Step”.`,
            ),
      ),
    );
  }
  btnStep.addEventListener('click', step);
  btnReset.addEventListener('click', () => reset());
  host.addEventListener('sim:resize', draw);
  reset();
}

/* ----------------------------------------------------------------------- */
/* 03 — Principe des tiroirs                                               */
/* ----------------------------------------------------------------------- */

function simPigeonhole(host: HTMLElement, lang: Lang) {
  const controls = el('div', { class: 'sim-controls' });
  const out = el('div', { class: 'sim-out' });
  const { cv, ctx } = makeCanvas(host, 240);
  let assign: number[] = [];
  const sN = slider(T(lang, 'pigeons =', 'pigeons ='), 2, 20, 7, 1, () => reset());
  const sM = slider(T(lang, 'tiroirs =', 'holes ='), 2, 8, 3, 1, () => reset());
  const btn = el('button', { class: 'sim-btn' }, T(lang, 'Redistribuer', 'Shuffle'));
  controls.append(sN.row, sM.row, btn);
  host.append(controls, out);

  function reset() {
    const n = Number(sN.input.value);
    const m = Number(sM.input.value);
    sN.setReadout(String(n));
    sM.setReadout(String(m));
    assign = Array.from({ length: n }, () => Math.floor(Math.random() * m));
    draw();
  }
  function draw() {
    const n = Number(sN.input.value);
    const m = Number(sM.input.value);
    const w = (cv as any)._w as number;
    const h = (cv as any)._h as number;
    ctx.clearRect(0, 0, w, h);
    const counts = Array.from({ length: m }, (_, j) => assign.filter((a) => a === j).length);
    const guaranteed = Math.ceil(n / m);
    const bw = Math.min(90, (w - 20) / m);
    const x0 = (w - bw * m) / 2;
    const fullest = counts.indexOf(Math.max(...counts));
    for (let j = 0; j < m; j++) {
      const x = x0 + j * bw;
      const boxTop = 40;
      const boxH = h - 70;
      const over = counts[j] >= guaranteed;
      ctx.strokeStyle = over ? RED : LIGHT;
      ctx.lineWidth = over ? 3 : 1.5;
      ctx.strokeRect(x + 4, boxTop, bw - 8, boxH);
      if (j === fullest) {
        ctx.fillStyle = 'rgba(214,54,43,0.06)';
        ctx.fillRect(x + 4, boxTop, bw - 8, boxH);
      }
      // pigeons empilés
      const per = Math.max(1, Math.floor((bw - 16) / 16));
      assign.forEach((a, idx) => {
        if (a !== j) return;
        const k = assign.slice(0, idx).filter((z) => z === j).length;
        const px = x + 10 + (k % per) * 16;
        const py = boxTop + boxH - 14 - Math.floor(k / per) * 16;
        ctx.font = '13px "Hanken Grotesk Variable", system-ui, sans-serif';
        ctx.fillText('🐦', px, py);
      });
      ctx.fillStyle = over ? RED : MUTED;
      ctx.font = '600 13px "Hanken Grotesk Variable", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(counts[j]), x + bw / 2, h - 12);
    }
    out.replaceChildren(
      note(
        T(
          lang,
          `${n} pigeons dans ${m} tiroirs : au moins un tiroir contient ⌈${n}/${m}⌉ = ${guaranteed} pigeon(s). Ici le plus rempli en a ${Math.max(...counts)}. Impossible de descendre en dessous de ${guaranteed} partout — c'est le principe des tiroirs.`,
          `${n} pigeons in ${m} holes: at least one hole holds ⌈${n}/${m}⌉ = ${guaranteed} pigeon(s). Here the fullest has ${Math.max(...counts)}. You can never keep every hole below ${guaranteed} — that is the pigeonhole principle.`,
        ),
      ),
    );
  }
  btn.addEventListener('click', reset);
  host.addEventListener('sim:resize', draw);
  reset();
}

/* ----------------------------------------------------------------------- */
/* 04 — Géométrie : théorème de l'angle inscrit                            */
/* ----------------------------------------------------------------------- */

function simInscribed(host: HTMLElement, lang: Lang) {
  const controls = el('div', { class: 'sim-controls' });
  const out = el('div', { class: 'sim-out' });
  const { cv, ctx } = makeCanvas(host, 260);
  // A et B fixes (angles sur le cercle) ; P mobile.
  const aAng = (-140 * Math.PI) / 180;
  const bAng = (-40 * Math.PI) / 180;
  const s = slider(T(lang, 'position de P', 'position of P'), 5, 175, 90, 1, draw);
  controls.append(s.row);
  host.append(controls, out);

  function draw(deg: number) {
    s.setReadout('');
    const w = (cv as any)._w as number;
    const h = (cv as any)._h as number;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2 + 6;
    const r = Math.min(w, h) / 2 - 34;
    const P = ((deg + 200) * Math.PI) / 180; // P se déplace sur l'arc supérieur
    const pt = (ang: number) => [cx + r * Math.cos(ang), cy + r * Math.sin(ang)] as const;
    const [ax, ay] = pt(aAng);
    const [bx, by] = pt(bAng);
    const [px, py] = pt(P);
    // cercle
    ctx.strokeStyle = LIGHT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
    // corde AB
    ctx.strokeStyle = MUTED;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    // PA, PB
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ax, ay);
    ctx.moveTo(px, py);
    ctx.lineTo(bx, by);
    ctx.stroke();
    // angle inscrit
    const v1 = Math.atan2(ay - py, ax - px);
    const v2 = Math.atan2(by - py, bx - px);
    let inscribed = Math.abs(v1 - v2);
    if (inscribed > Math.PI) inscribed = 2 * Math.PI - inscribed;
    // points
    const dot = (x: number, y: number, c: string, label: string) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = '600 13px "Hanken Grotesk Variable", system-ui, sans-serif';
      ctx.fillText(label, x + 8, y - 6);
    };
    dot(ax, ay, RED, 'A');
    dot(bx, by, RED, 'B');
    dot(px, py, GREEN, 'P');
    ctx.fillStyle = GREEN;
    ctx.font = '700 15px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`∠APB = ${Math.round((inscribed * 180) / Math.PI)}°`, cx, 22);
    out.replaceChildren(
      note(
        T(
          lang,
          `Déplacez P sur le cercle : l'angle inscrit ∠APB qui intercepte la corde AB reste constant (≈ ${Math.round((inscribed * 180) / Math.PI)}°), égal à la moitié de l'angle au centre. C'est le théorème de l'angle inscrit.`,
          `Move P around the circle: the inscribed angle ∠APB subtending chord AB stays constant (≈ ${Math.round((inscribed * 180) / Math.PI)}°), equal to half the central angle. This is the inscribed-angle theorem.`,
        ),
      ),
    );
  }
  host.addEventListener('sim:resize', () => draw(Number(s.input.value)));
}

/* ----------------------------------------------------------------------- */
/* 05 — Théorie des nombres : crible d'Ératosthène                         */
/* ----------------------------------------------------------------------- */

function simSieve(host: HTMLElement, lang: Lang) {
  const controls = el('div', { class: 'sim-controls' });
  const out = el('div', { class: 'sim-out' });
  const { cv, ctx } = makeCanvas(host, 260);
  const s = slider(T(lang, 'jusqu’à N =', 'up to N ='), 20, 120, 60, 1, draw);
  controls.append(s.row);
  host.append(controls, out);

  function draw(N: number) {
    s.setReadout(String(N));
    const w = (cv as any)._w as number;
    const h = (cv as any)._h as number;
    ctx.clearRect(0, 0, w, h);
    const cols = 10;
    const rows = Math.ceil(N / cols);
    const cell = Math.min(30, (w - 16) / cols, (h - 34) / rows);
    const x0 = (w - cell * cols) / 2;
    const y0 = 28;
    let primes = 0;
    for (let k = 1; k <= N; k++) {
      const i = k - 1;
      const cxx = x0 + (i % cols) * cell;
      const cyy = y0 + Math.floor(i / cols) * cell;
      const p = isPrime(k);
      if (p && k >= 2) primes++;
      ctx.fillStyle = k < 2 ? '#f3f4f6' : p ? '#d9f0df' : '#f3f4f6';
      ctx.fillRect(cxx + 1, cyy + 1, cell - 2, cell - 2);
      if (p && k >= 2) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cxx + 1, cyy + 1, cell - 2, cell - 2);
      }
      ctx.fillStyle = p && k >= 2 ? GREEN : '#9ca3af';
      ctx.font = `${Math.min(12, cell - 6)}px "Hanken Grotesk Variable", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(k), cxx + cell / 2, cyy + cell / 2 + 4);
    }
    ctx.fillStyle = INK;
    ctx.font = '600 14px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(T(lang, `${primes} nombres premiers ≤ ${N}`, `${primes} primes ≤ ${N}`), 8, 18);
    out.replaceChildren(
      note(
        T(
          lang,
          `On barre les multiples de chaque premier trouvé (crible d'Ératosthène). Il reste ${primes} nombres premiers jusqu'à ${N}. Ils se raréfient mais ne s'arrêtent jamais : il en existe une infinité.`,
          `Cross out the multiples of each prime found (sieve of Eratosthenes). ${primes} primes remain up to ${N}. They thin out but never stop: there are infinitely many.`,
        ),
      ),
    );
  }
  host.addEventListener('sim:resize', () => draw(Number(s.input.value)));
}

/* ----------------------------------------------------------------------- */
/* 06 — Combinatoire : triangle de Pascal                                  */
/* ----------------------------------------------------------------------- */

function simPascal(host: HTMLElement, lang: Lang) {
  const controls = el('div', { class: 'sim-controls' });
  const out = el('div', { class: 'sim-out' });
  const { cv, ctx } = makeCanvas(host, 280);
  const s = slider(T(lang, 'lignes =', 'rows ='), 3, 11, 7, 1, draw);
  controls.append(s.row);
  host.append(controls, out);

  function draw(R: number) {
    s.setReadout(String(R));
    const w = (cv as any)._w as number;
    const h = (cv as any)._h as number;
    ctx.clearRect(0, 0, w, h);
    const tri: number[][] = [];
    for (let n = 0; n < R; n++) {
      tri[n] = [];
      for (let k = 0; k <= n; k++) tri[n][k] = k === 0 || k === n ? 1 : tri[n - 1][k - 1] + tri[n - 1][k];
    }
    const cell = Math.min(46, (w - 16) / R);
    const y0 = 30;
    const rowH = Math.min(cell, (h - 40) / R);
    for (let n = 0; n < R; n++) {
      const rowW = (n + 1) * cell;
      const x0 = (w - rowW) / 2;
      for (let k = 0; k <= n; k++) {
        const x = x0 + k * cell + cell / 2;
        const y = y0 + n * rowH;
        // couleur par parité (triangle de Sierpiński)
        ctx.fillStyle = tri[n][k] % 2 === 1 ? '#d9f0df' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, Math.min(15, cell / 2 - 2), 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = LIGHT;
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.font = `${Math.min(12, cell / 3)}px "Hanken Grotesk Variable", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(String(tri[n][k]), x, y + 4);
      }
    }
    const rowSum = 2 ** (R - 1);
    out.replaceChildren(
      note(
        T(
          lang,
          `Chaque nombre est la somme des deux au-dessus : C(n,k) = C(n−1,k−1) + C(n−1,k). La somme de la ligne ${R} vaut 2^${R - 1} = ${rowSum}. En vert, les coefficients impairs dessinent le triangle de Sierpiński.`,
          `Each number is the sum of the two above it: C(n,k) = C(n−1,k−1) + C(n−1,k). Row ${R} sums to 2^${R - 1} = ${rowSum}. Odd coefficients (green) draw Sierpiński's triangle.`,
        ),
      ),
    );
  }
  host.addEventListener('sim:resize', () => draw(Number(s.input.value)));
}

/* ----------------------------------------------------------------------- */
/* 07 — Invariants : l'échiquier mutilé (coloriage)                        */
/* ----------------------------------------------------------------------- */

function simChessboard(host: HTMLElement, lang: Lang) {
  const controls = el('div', { class: 'sim-controls' });
  const out = el('div', { class: 'sim-out' });
  const { cv, ctx } = makeCanvas(host, 280);
  const s = slider(T(lang, 'taille =', 'size ='), 4, 10, 8, 2, draw);
  let cut = true; // coins opposés retirés ?
  const btn = el('button', { class: 'sim-btn' }, T(lang, 'Retirer / remettre les coins', 'Toggle corners'));
  controls.append(s.row, btn);
  host.append(controls, out);

  function draw(N?: number) {
    const n = N ?? Number(s.input.value);
    s.setReadout(`${n}×${n}`);
    const w = (cv as any)._w as number;
    const h = (cv as any)._h as number;
    ctx.clearRect(0, 0, w, h);
    const board = Math.min(w - 16, h - 44);
    const cell = board / n;
    const x0 = (w - board) / 2;
    const y0 = 34;
    let black = 0;
    let white = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const removed = cut && ((r === 0 && c === 0) || (r === n - 1 && c === n - 1));
        const isBlack = (r + c) % 2 === 0;
        const x = x0 + c * cell;
        const y = y0 + r * cell;
        if (removed) {
          ctx.fillStyle = '#fbdcd9';
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = RED;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 3, y + 3);
          ctx.lineTo(x + cell - 3, y + cell - 3);
          ctx.moveTo(x + cell - 3, y + 3);
          ctx.lineTo(x + 3, y + cell - 3);
          ctx.stroke();
        } else {
          ctx.fillStyle = isBlack ? '#2f5d3a' : '#e8efe9';
          ctx.fillRect(x, y, cell, cell);
          if (isBlack) black++;
          else white++;
        }
      }
    }
    ctx.fillStyle = INK;
    ctx.font = '600 14px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${T(lang, 'cases', 'squares')}: ● ${black}  vs  ○ ${white}`,
      w / 2,
      22,
    );
    const balanced = black === white;
    out.replaceChildren(
      note(
        cut
          ? T(
              lang,
              `Les deux coins retirés sont de la même couleur, donc il reste ${black} cases foncées et ${white} claires. Un domino couvre toujours une foncée et une claire : avec ${black} ≠ ${white}, un pavage complet est impossible. Le déséquilibre de couleur est un invariant.`,
              `The two removed corners share a colour, leaving ${black} dark and ${white} light squares. A domino always covers one dark and one light: with ${black} ≠ ${white}, a full tiling is impossible. The colour imbalance is an invariant.`,
            )
          : T(
              lang,
              `Échiquier complet : ${black} = ${white}. ${balanced ? 'Autant de cases de chaque couleur' : ''} — un pavage par dominos est envisageable. Retirez deux coins opposés pour casser l'équilibre.`,
              `Full board: ${black} = ${white}. Equal numbers of each colour — a domino tiling is possible. Remove two opposite corners to break the balance.`,
            ),
      ),
    );
  }
  btn.addEventListener('click', () => {
    cut = !cut;
    draw();
  });
  host.addEventListener('sim:resize', () => draw());
  draw();
}

/* ----------------------------------------------------------------------- */
/* Répartiteur                                                             */
/* ----------------------------------------------------------------------- */

const REGISTRY: Record<string, (host: HTMLElement, lang: Lang) => void> = {
  conjecture: simConjecture,
  fibo: simFibo,
  extremal: simExtremal,
  pigeonhole: simPigeonhole,
  inscribed: simInscribed,
  sieve: simSieve,
  pascal: simPascal,
  chessboard: simChessboard,
};

export function initSimulations() {
  document.querySelectorAll<HTMLElement>('[data-sim]').forEach((host) => {
    if (host.dataset.simReady) return;
    const key = host.dataset.sim || '';
    const fn = REGISTRY[key];
    if (!fn) return;
    const lang = (host.dataset.lang as Lang) || 'fr';
    // Initialiser seulement quand le panneau <details> est ouvert (perf).
    const details = host.closest('details');
    const boot = () => {
      if (host.dataset.simReady) return;
      host.dataset.simReady = '1';
      fn(host, lang);
    };
    if (details && !details.open) {
      details.addEventListener('toggle', () => details.open && boot(), { once: true });
    } else {
      boot();
    }
  });
}
