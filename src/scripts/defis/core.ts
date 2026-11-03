/**
 * Défis interactifs : socle commun.
 *
 * La page (DefiView) affiche les consignes de chaque version ; ce module construit les
 * onglets de version (★, ★★, ★★★), la zone de travail, la phrase de retour (annoncée
 * aux lecteurs d'écran) et le bouton « Recommencer ». Chaque défi est un module
 * `src/scripts/defis/<slug>.ts` qui exporte `defi: DefiModule`.
 *
 * Un défi ne contient jamais la solution : il vérifie que la configuration de l'élève
 * respecte les règles de la consigne et appelle `ctx.result(true, …)` quand c'est le cas.
 * Les versions réussies sont retenues dans ce navigateur (localStorage, facultatif).
 */
import { el, button } from '../lab/core';

export type Lang = 'fr' | 'en';

export interface DefiCtx {
  lang: Lang;
  T(fr: string, en: string): string;
  /** Indice de la version (0, 1 ou 2). */
  version: number;
  /** Zone de travail, vidée à chaque (re)démarrage. */
  root: HTMLElement;
  /** Barre de commandes propre au défi (sous la zone de travail). */
  controls: HTMLElement;
  /** Message neutre (aide, état). */
  say(text: string): void;
  /** Résultat d'une vérification : réussite ou règle non respectée. */
  result(ok: boolean, text: string): void;
  btn(label: string, onClick: () => void, primary?: boolean): HTMLButtonElement;
}

export interface DefiModule {
  /** Monte la version demandée ; peut renvoyer une fonction de nettoyage. */
  mount(ctx: DefiCtx): void | (() => void);
}

const STORE = 'comima.defis.v1';

/**
 * Cases carrées de taille fixe (en px), recalculée selon la largeur disponible. Remplace
 * aspect-ratio et clamp(), absents des anciennes WebView Android (application).
 */
export function fitGrid(grid: HTMLElement, cols: number, max: number, gap = 4): void {
  const apply = () => {
    const avail = (grid.parentElement ? grid.parentElement.clientWidth : 320) - 12;
    const size = Math.max(10, Math.min(max, Math.floor((avail - gap * (cols - 1)) / cols)));
    grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    grid.style.gridAutoRows = `${size}px`;
    grid.style.fontSize = `${Math.max(8, Math.round(size * 0.55))}px`;
  };
  apply();
  window.addEventListener('resize', apply);
}

/** Réussites fournies par l'application (profil de l'élève), quand la page y est affichée. */
function appSolved(): Record<string, number[]> {
  try {
    const c = (window as unknown as { __COMIMA__?: { solved?: string } }).__COMIMA__;
    const v = c && c.solved ? JSON.parse(c.solved) : {};
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {}; // jeton non remplacé ou illisible
  }
}

function readSolved(): Record<string, number[]> {
  let v: Record<string, number[]> = {};
  try {
    const raw = window.localStorage.getItem(STORE);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') v = parsed;
  } catch {
    /* stockage indisponible (WebView de l'application) */
  }
  const app = appSolved();
  for (const k of Object.keys(app)) {
    const list = Array.isArray(v[k]) ? v[k].slice() : [];
    for (const n of Array.isArray(app[k]) ? app[k] : []) if (list.indexOf(n) < 0) list.push(n);
    v[k] = list;
  }
  return v;
}

function markSolved(slug: string, version: number): void {
  // Dans l'application : la réussite est enregistrée dans le profil de l'élève (canal « Defis »).
  const canal = (window as unknown as { Defis?: { postMessage(m: string): void } }).Defis;
  if (canal) canal.postMessage(JSON.stringify({ slug, version }));
  const c = (window as unknown as { __COMIMA__?: { solved?: string } }).__COMIMA__;
  if (c) {
    const app = appSolved();
    const list = Array.isArray(app[slug]) ? app[slug] : [];
    if (list.indexOf(version) < 0) list.push(version);
    app[slug] = list;
    c.solved = JSON.stringify(app);
  }
  try {
    const all = readSolved();
    const list = Array.isArray(all[slug]) ? all[slug] : [];
    if (list.indexOf(version) < 0) list.push(version);
    all[slug] = list;
    window.localStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    /* stockage indisponible : la réussite n'est simplement pas retenue */
  }
}

export function solvedVersions(slug: string): number[] {
  const v = readSolved()[slug];
  return Array.isArray(v) ? v : [];
}

export function buildDefi(def: DefiModule, host: HTMLElement, lang: Lang, slug: string, nVersions: number): void {
  const T = (fr: string, en: string) => (lang === 'fr' ? fr : en);
  host.textContent = '';
  const tabs = el('div', { class: 'defi-tabs', role: 'tablist', 'aria-label': T('Versions du défi', 'Challenge versions') });
  const work = el('div', { class: 'defi-work' });
  const controls = el('div', { class: 'defi-controls' });
  const feedback = el('p', { class: 'defi-feedback', role: 'status', 'aria-live': 'polite' });
  host.append(tabs, work, controls, feedback);

  const consignes = Array.from(document.querySelectorAll<HTMLElement>('[data-defi-consigne]'));
  // Les onglets de version se placent au-dessus des consignes, qui changent avec eux.
  const blocConsignes = document.querySelector('.defi-consignes');
  if (blocConsignes && blocConsignes.parentNode) blocConsignes.parentNode.insertBefore(tabs, blocConsignes);
  let current = 0;
  let cleanup: void | (() => void);
  const tabBtns: HTMLButtonElement[] = [];

  function refreshTabs() {
    const solved = solvedVersions(slug);
    tabBtns.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === current));
      b.classList.toggle('is-solved', solved.indexOf(i) >= 0);
      const stars = '★'.repeat(i + 1);
      b.textContent = solved.indexOf(i) >= 0 ? `${stars} ✓` : stars;
      b.setAttribute('aria-label', T(`Version ${i + 1}${solved.indexOf(i) >= 0 ? ', réussie' : ''}`, `Version ${i + 1}${solved.indexOf(i) >= 0 ? ', solved' : ''}`));
    });
  }

  function start(version: number) {
    if (typeof cleanup === 'function') cleanup();
    current = version;
    work.textContent = '';
    controls.textContent = '';
    feedback.textContent = '';
    feedback.className = 'defi-feedback';
    consignes.forEach((c) => (c.hidden = Number(c.dataset.defiConsigne) !== version));
    refreshTabs();
    const ctx: DefiCtx = {
      lang,
      T,
      version,
      root: work,
      controls,
      say(text) {
        feedback.className = 'defi-feedback';
        feedback.textContent = text;
      },
      result(ok, text) {
        feedback.className = `defi-feedback ${ok ? 'is-ok' : 'is-bad'}`;
        feedback.textContent = text;
        if (ok) {
          markSolved(slug, version);
          refreshTabs();
        }
      },
      btn(label, onClick, primary = false) {
        const b = button(label, onClick, primary ? 'primary' : 'outline');
        controls.append(b);
        return b;
      },
    };
    cleanup = def.mount(ctx);
    const again = button(T('Recommencer', 'Start again'), () => start(current));
    controls.append(again);
  }

  if (nVersions > 1) {
    for (let i = 0; i < nVersions; i++) {
      const b = el('button', { type: 'button', role: 'tab', class: 'defi-tab' }) as HTMLButtonElement;
      b.addEventListener('click', () => start(i));
      tabs.append(b);
      tabBtns.push(b);
    }
  } else {
    tabs.hidden = true;
  }
  start(0);
}
