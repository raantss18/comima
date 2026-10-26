/**
 * Illustrations animées et interactives des fiches de cours (page Entraînement).
 *
 * Une illustration = un module `src/scripts/fiche/<id-de-la-notion>.ts` qui exporte
 * `draw(fig)`. Le socle ci-dessous fournit le cadre SVG, la barre de commandes, la
 * phrase d'état (annoncée aux lecteurs d'écran) et des animations qui respectent
 * « réduire les animations » (prefers-reduced-motion).
 */
import { button, slider, el, type SliderApi } from '../lab/core';

export type Lang = 'fr' | 'en';

/** Couleurs du thème (clair/sombre) : variables CSS du site. */
export const C = {
  ink: 'var(--c-text)',
  muted: 'var(--c-text-muted)',
  line: 'var(--c-border)',
  primary: 'var(--c-primary)',
  accent: 'var(--c-accent)',
  surface: 'var(--c-surface)',
  soft: 'var(--c-primary-soft)',
  none: 'none',
};

const NS = 'http://www.w3.org/2000/svg';
type Attrs = Record<string, string | number | undefined>;

/** Crée un élément SVG ; `fill` et `stroke` passent par le style pour accepter var(--…). */
export function S<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string)[]): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  setAttrs(n, attrs);
  for (const k of kids) n.append(k);
  return n;
}

export function setAttrs(n: SVGElement, attrs: Attrs): void {
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined) continue;
    if (k === 'fill' || k === 'stroke') n.style.setProperty(k, String(v));
    else if (k === 'style') n.style.cssText += `;${v}`; // sans écraser fill/stroke déjà posés
    else n.setAttribute(k, String(v));
  }
}

export interface Fig {
  lang: Lang;
  svg: SVGSVGElement;
  controls: HTMLElement;
  /** Remplace la phrase d'état sous le dessin. */
  say(text: string): void;
  /** Choisit le texte dans la langue de la page. */
  T(fr: string, en: string): string;
  btn(label: string, onClick: () => void, primary?: boolean): HTMLButtonElement;
  range(label: string, min: number, max: number, value: number, step: number, onInput: (v: number) => void, fmt?: (v: number) => string): SliderApi;
}

export function mountFig(host: HTMLElement, lang: Lang, w: number, h: number, label: string): Fig {
  const svg = S('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label, class: 'fiche-svg' });
  const controls = el('div', { class: 'fiche-controls' });
  const say = el('p', { class: 'fiche-say', 'aria-live': 'polite' });
  // Sur téléphone le dessin garde une largeur lisible et défile horizontalement.
  host.replaceChildren(el('div', { class: 'fiche-scroll' }, svg as unknown as Node), controls, say);
  return {
    lang,
    svg,
    controls,
    say: (text) => {
      say.textContent = text;
    },
    T: (fr, en) => (lang === 'fr' ? fr : en),
    btn(lbl, onClick, primary = false) {
      const b = button(lbl, onClick, primary ? 'primary' : 'outline');
      controls.append(b);
      return b;
    },
    range(lbl, min, max, value, step, onInput, fmt) {
      const s = slider(lbl, min, max, value, step, onInput, fmt);
      controls.append(s.row);
      return s;
    },
  };
}

/* ----------------------------------------------------------------------- */
/* Animation                                                                */
/* ----------------------------------------------------------------------- */

export const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ease = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Joue `step(t)` pour t de 0 à 1 ; avec « réduire les animations », saute à l'état final. */
export function tween(ms: number, step: (t: number) => void): Promise<void> {
  if (reduced() || ms <= 0) {
    step(1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      step(t);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

export const sleep = (ms: number): Promise<void> => (reduced() ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));

/**
 * Jeton d'exécution : `const run = runner(); … if (!run.alive()) return;`
 * `run.next()` invalide les animations en cours (nouveau clic, curseur déplacé…).
 */
export function runner() {
  let id = 0;
  return {
    next: () => ++id,
    /** Retourne une fonction « cette animation est-elle toujours la plus récente ? ». */
    token() {
      const mine = ++id;
      return () => mine === id;
    },
  };
}

export const rad = (deg: number): number => (deg * Math.PI) / 180;
export const deg = (r: number): number => (r * 180) / Math.PI;

/** Fait glisser un élément SVG par transform. */
export const at = (n: SVGElement, x: number, y: number, rot = 0, scale = 1): void => {
  n.setAttribute('transform', `translate(${x} ${y}) rotate(${rot}) scale(${scale})`);
};
