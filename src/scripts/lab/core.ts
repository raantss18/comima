/**
 * Laboratoire de conjectures : socle commun des simulations.
 *
 * Chaque simulation (un problème par chapitre du cours) reçoit un `LabApi` :
 * une scène <canvas> adaptative (retina, thème clair/sombre), une barre de
 * commandes, un « journal d'essais » (tableau de données pour conjecturer) et
 * un message d'état. Le cadre (énoncé, conjecture de l'élève, indices
 * progressifs, généralisation) est construit par `buildLab`.
 */

export type Lang = 'fr' | 'en';

export interface Palette {
  ink: string;
  muted: string;
  line: string;
  primary: string;
  accent: string;
  surface: string;
  soft: string;
  ok: string;
  bad: string;
}

export function palette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const g = (n: string, f: string) => s.getPropertyValue(n).trim() || f;
  return {
    ink: g('--c-text', '#1b211d'),
    muted: g('--c-text-muted', '#55605a'),
    line: g('--c-border', '#dde2dc'),
    primary: g('--c-primary', '#1d7a33'),
    accent: g('--c-accent', '#d6362b'),
    surface: g('--c-surface', '#ffffff'),
    soft: g('--c-primary-soft', '#e6f3e9'),
    ok: '#1d9a45',
    bad: '#d6362b',
  };
}

/* ----------------------------------------------------------------------- */
/* Petits constructeurs d'interface                                         */
/* ----------------------------------------------------------------------- */

export function el<K extends keyof HTMLElementTagNameMap>(
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

export function button(label: string, onClick: () => void, variant: 'primary' | 'outline' = 'outline'): HTMLButtonElement {
  const b = el('button', { type: 'button', class: `lab-btn lab-btn-${variant}` }, label);
  b.addEventListener('click', onClick);
  return b;
}

export interface SliderApi {
  row: HTMLElement;
  input: HTMLInputElement;
  set(v: number): void;
  get(): number;
}

export function slider(
  label: string,
  min: number,
  max: number,
  value: number,
  step: number,
  onInput: (v: number) => void,
  fmt: (v: number) => string = String,
): SliderApi {
  const input = el('input', {
    type: 'range',
    min: String(min),
    max: String(max),
    step: String(step),
    value: String(value),
    class: 'lab-range',
    'aria-label': label,
  }) as HTMLInputElement;
  const out = el('output', { class: 'lab-readout' }, fmt(value));
  input.addEventListener('input', () => {
    out.textContent = fmt(Number(input.value));
    onInput(Number(input.value));
  });
  return {
    row: el('label', { class: 'lab-control' }, el('span', {}, label), input, out),
    input,
    set(v) {
      input.value = String(v);
      out.textContent = fmt(v);
    },
    get: () => Number(input.value),
  };
}

/** Choix exclusif sous forme de boutons segmentés. */
export function segmented<T extends string | number>(
  options: { value: T; label: string }[],
  initial: T,
  onChange: (v: T) => void,
): { row: HTMLElement; set(v: T): void } {
  const row = el('div', { class: 'lab-seg', role: 'group' });
  const btns = options.map((o) => {
    const b = el('button', { type: 'button', class: 'lab-seg-btn' }, o.label);
    b.addEventListener('click', () => {
      set(o.value);
      onChange(o.value);
    });
    row.append(b);
    return { b, v: o.value };
  });
  function set(v: T) {
    btns.forEach(({ b, v: bv }) => b.setAttribute('aria-pressed', String(bv === v)));
  }
  set(initial);
  return { row, set };
}

/* ----------------------------------------------------------------------- */
/* Scène <canvas>                                                           */
/* ----------------------------------------------------------------------- */

export interface Stage {
  cv: HTMLCanvasElement;
  w: number;
  h: number;
  /** Définit la fonction de dessin (appelée à chaque redraw, coordonnées en px CSS). */
  setDraw(fn: (ctx: CanvasRenderingContext2D, w: number, h: number, p: Palette) => void): void;
  redraw(): void;
}

export function createStage(host: HTMLElement, aspect = 0.66, label = ''): Stage {
  const cv = el('canvas', { class: 'lab-canvas', role: 'img', 'aria-label': label });
  host.append(cv);
  const ctx = cv.getContext('2d')!;
  let draw: ((c: CanvasRenderingContext2D, w: number, h: number, p: Palette) => void) | null = null;
  const stage: Stage = {
    cv,
    w: 600,
    h: 400,
    setDraw(fn) {
      draw = fn;
      stage.redraw();
    },
    redraw() {
      if (!draw) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, stage.w, stage.h);
      draw(ctx, stage.w, stage.h, palette());
    },
  };
  const resize = () => {
    const w = Math.max(240, Math.round(host.clientWidth || cv.clientWidth || 600));
    const h = Math.round(w * aspect);
    const dpr = window.devicePixelRatio || 1;
    stage.w = w;
    stage.h = h;
    cv.style.height = `${h}px`;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    stage.redraw();
  };
  new ResizeObserver(resize).observe(host);
  new MutationObserver(() => stage.redraw()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  resize();
  return stage;
}

export interface Handle {
  x: number;
  y: number;
  r: number;
}

/** Glisser-déposer de poignées sur un canvas (souris, doigt, stylet). */
export function enableDrag(
  stage: Stage,
  handles: () => Handle[],
  onMove: (i: number, x: number, y: number) => void,
  onEnd?: (i: number) => void,
): void {
  const cv = stage.cv;
  cv.style.touchAction = 'none';
  let active = -1;
  const pos = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * stage.w, y: ((e.clientY - r.top) / r.height) * stage.h };
  };
  const hit = (x: number, y: number) => {
    const hs = handles();
    let best = -1;
    let bd = Infinity;
    hs.forEach((h, i) => {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d <= h.r + 8 && d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  cv.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    active = hit(p.x, p.y);
    if (active >= 0) {
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = 'grabbing';
      onMove(active, p.x, p.y);
    }
  });
  cv.addEventListener('pointermove', (e) => {
    const p = pos(e);
    if (active >= 0) onMove(active, p.x, p.y);
    else cv.style.cursor = hit(p.x, p.y) >= 0 ? 'grab' : 'default';
  });
  const end = () => {
    if (active >= 0) onEnd?.(active);
    active = -1;
    cv.style.cursor = 'default';
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

/* ----------------------------------------------------------------------- */
/* Journal d'essais                                                         */
/* ----------------------------------------------------------------------- */

export interface Log {
  setColumns(cols: string[]): void;
  add(row: (string | number)[], flag?: 'ok' | 'bad'): void;
  clear(): void;
}

function createLog(host: HTMLElement, emptyText: string): Log {
  const table = el('table', { class: 'lab-log' });
  const thead = el('thead');
  const tbody = el('tbody');
  const empty = el('p', { class: 'lab-empty' }, emptyText);
  table.append(thead, tbody);
  host.append(table, empty);
  const MAX = 60;
  const sync = () => {
    table.hidden = tbody.children.length === 0;
    empty.hidden = tbody.children.length > 0;
  };
  sync();
  return {
    setColumns(cols) {
      thead.replaceChildren(el('tr', {}, ...cols.map((c) => el('th', { scope: 'col' }, c))));
    },
    add(row, flag) {
      const tr = el('tr', flag ? { class: `lab-row-${flag}` } : {}, ...row.map((c) => el('td', {}, String(c))));
      tbody.prepend(tr);
      while (tbody.children.length > MAX) tbody.lastElementChild?.remove();
      sync();
    },
    clear() {
      tbody.replaceChildren();
      sync();
    },
  };
}

/* ----------------------------------------------------------------------- */
/* Définition et construction d'un laboratoire                              */
/* ----------------------------------------------------------------------- */

export interface Bi {
  fr: string;
  en: string;
}

export interface LabApi {
  lang: Lang;
  t(fr: string, en: string): string;
  stage: Stage;
  controls: HTMLElement;
  /** Zone libre sous la scène (messages, légendes). */
  readout: HTMLElement;
  log: Log;
  say(html: string): void;
}

export interface LabDef {
  /** Identifiant du chapitre du cours (ex. « 03-principe-des-tiroirs »). */
  chapter: string;
  numero: number;
  title: Bi;
  /** Le problème proposé (LaTeX inline accepté : $…$). */
  statement: Bi;
  /** Ce que l'on cherche à conjecturer. */
  goal: Bi;
  /** Indices de plus en plus précis. */
  hints: { fr: string[]; en: string[] };
  /** Généralisation / théorème, révélés à la demande. */
  general: Bi;
  aspect?: number;
  logEmpty?: Bi;
  init(api: LabApi): void;
}

const renderMath = () => document.dispatchEvent(new CustomEvent('comima:render-math'));

export function buildLab(def: LabDef, host: HTMLElement, lang: Lang): void {
  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);
  const tx = (b: Bi) => b[lang];
  host.classList.add('lab');
  host.replaceChildren();

  const head = el(
    'header',
    { class: 'lab-head' },
    el('span', { class: 'badge badge-theme' }, `${t('Chapitre', 'Chapter')} ${def.numero}`),
    el('h2', {}, tx(def.title)),
  );
  const statement = el('div', { class: 'lab-statement latex-preview' });
  statement.innerHTML = `<p><strong>${t('Problème', 'Problem')}.</strong> ${tx(def.statement)}</p><p class="lab-goal">🎯 ${tx(def.goal)}</p>`;

  const stageBox = el('div', { class: 'lab-stage' });
  const controls = el('div', { class: 'lab-controls' });
  const readout = el('div', { class: 'lab-readout-box latex-preview', 'aria-live': 'polite' });
  const logBox = el('div', { class: 'lab-logbox' });
  const side = el(
    'div',
    { class: 'lab-side' },
    el('h3', {}, t('Mes essais', 'My trials')),
    logBox,
  );
  const left = el('div', { class: 'lab-main' }, controls, stageBox, readout);
  const grid = el('div', { class: 'lab-grid' }, left, side);

  // Conjecture de l'élève (sauvegardée dans le navigateur).
  const key = `comima-lab-${def.chapter}`;
  const area = el('textarea', {
    class: 'lab-textarea',
    rows: '3',
    placeholder: t('Écris ici ce que tu observes, puis ta conjecture…', 'Write what you observe, then your conjecture…'),
    'aria-label': t('Ma conjecture', 'My conjecture'),
  }) as HTMLTextAreaElement;
  try {
    area.value = localStorage.getItem(key) ?? '';
  } catch {
    /* stockage indisponible */
  }
  area.addEventListener('input', () => {
    try {
      localStorage.setItem(key, area.value);
    } catch {
      /* ignoré */
    }
  });

  const hints = def.hints[lang];
  let shown = 0;
  const hintBox = el('div', { class: 'lab-hints latex-preview', hidden: '' });
  const hintBtn = button('', () => {
    if (shown < hints.length) {
      shown += 1;
      hintBox.hidden = false;
      hintBox.innerHTML = hints
        .slice(0, shown)
        .map((h, i) => `<p><strong>${t('Indice', 'Hint')} ${i + 1}.</strong> ${h}</p>`)
        .join('');
      renderMath();
    }
    hintBtn.textContent = label();
    hintBtn.disabled = shown >= hints.length;
  });
  const label = () =>
    shown >= hints.length
      ? t('💡 Plus d’indice', '💡 No more hints')
      : `💡 ${t('Un indice', 'A hint')} (${shown}/${hints.length})`;
  hintBtn.textContent = label();

  const generalBox = el('div', { class: 'lab-general latex-preview', hidden: '' });
  generalBox.innerHTML = `<p><strong>${t('Et en général ?', 'And in general?')}</strong></p>${tx(def.general)}`;
  const generalBtn = button(t('🎯 Révéler la généralisation', '🎯 Reveal the generalisation'), () => {
    generalBox.hidden = !generalBox.hidden;
    generalBtn.textContent = generalBox.hidden
      ? t('🎯 Révéler la généralisation', '🎯 Reveal the generalisation')
      : t('🙈 Masquer la généralisation', '🙈 Hide the generalisation');
    renderMath();
  });

  const conj = el(
    'div',
    { class: 'lab-conj' },
    el('label', { class: 'lab-conj-label' }, t('✍️ Ma conjecture', '✍️ My conjecture')),
    area,
    el('div', { class: 'lab-conj-actions' }, hintBtn, generalBtn),
    hintBox,
    generalBox,
  );

  host.append(head, statement, grid, conj);

  const stage = createStage(stageBox, def.aspect ?? 0.66, tx(def.title));
  const log = createLog(logBox, def.logEmpty ? tx(def.logEmpty) : t('Aucun essai pour l’instant.', 'No trials yet.'));
  const api: LabApi = {
    lang,
    t,
    stage,
    controls,
    readout,
    log,
    say(html) {
      readout.innerHTML = html;
      renderMath();
    },
  };
  def.init(api);
  renderMath();
}

/* ----------------------------------------------------------------------- */
/* Utilitaires mathématiques partagés                                       */
/* ----------------------------------------------------------------------- */

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const fmt = (x: number, d = 3): string => {
  if (!isFinite(x)) return '∞';
  const s = x.toFixed(d);
  return s.replace(/\.?0+$/, '') || '0';
};
