// Marque-pages sur le site : où en est l'élève sur chaque exercice, sujet et cours.
// Un état (lu, testé, à continuer, fait ; aucun = pas encore vu) et une étoile « à voir ».
// Stockés dans ce navigateur (comme la progression) et, si l'élève est connecté, synchronisés avec
// son compte discrètement (même modèle que l'application, voir web-sync.ts et supabase/).
// Rien ne s'affiche sans JavaScript ; sans compte, tout reste dans le navigateur.
import { Cloud } from './web-cloud.ts';
import * as store from './web-store.ts';
import { syncMarks } from './web-sync.ts';

type Lang = 'fr' | 'en';

const TXT: Record<Lang, Record<string, string>> = {
  fr: {
    bookmark: 'Marque-page',
    none: 'Pas encore vu',
    lu: 'Lu',
    teste: 'Déjà testé',
    continuer: 'À continuer plus tard',
    fait: 'Fait',
    star: 'À voir (étoile)',
    synced: 'Synchronisé avec ton compte',
    local: 'Enregistré dans ce navigateur',
  },
  en: {
    bookmark: 'Bookmark',
    none: 'Not seen yet',
    lu: 'Read',
    teste: 'Already tried',
    continuer: 'To continue later',
    fait: 'Done',
    star: 'To check (star)',
    synced: 'Synced with your account',
    local: 'Saved in this browser',
  },
};

export const ICON: Record<string, string> = { none: '○', lu: '◉', teste: '✎', continuer: '◷', fait: '✔' };
const STATES: (string | null)[] = [null, ...store.MARK_STATUSES];

const lang = (): Lang => (document.documentElement.lang === 'en' ? 'en' : 'fr');
const label = (st: string | null) => TXT[lang()][st ?? 'none'];

let menu: HTMLElement | null = null;
let cloud: Cloud | null = null;
let timer: number | undefined;

function closeMenu() {
  menu?.remove();
  menu = null;
}

/** Fait un changement, puis laisse la page se redessiner (événement `comima:marks`). */
function apply(item: string, st: string | null, star: boolean) {
  store.setMark(item, st, star);
}

function openMenu(item: string, anchor: HTMLElement) {
  closeMenu();
  const T = TXT[lang()];
  const cur = store.markOf(item);
  const m = document.createElement('div');
  m.className = 'mark-menu';
  m.setAttribute('role', 'menu');
  m.setAttribute('aria-label', T.bookmark);
  for (const st of STATES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'menuitemradio');
    b.setAttribute('aria-checked', String((cur?.st ?? null) === st));
    b.className = `mark-opt mark-${st ?? 'none'}`;
    b.innerHTML = `<span class="mark-ic" aria-hidden="true">${ICON[st ?? 'none']}</span><span>${label(st)}</span>${(cur?.st ?? null) === st ? '<span class="mark-tick" aria-hidden="true">✓</span>' : ''}`;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      apply(item, st, cur?.star === true);
      closeMenu();
    });
    m.append(b);
  }
  const star = document.createElement('button');
  star.type = 'button';
  star.setAttribute('role', 'menuitemcheckbox');
  star.setAttribute('aria-checked', String(cur?.star === true));
  star.className = 'mark-opt mark-star-opt';
  star.innerHTML = `<span class="mark-ic" aria-hidden="true">${cur?.star ? '★' : '☆'}</span><span>${T.star}</span>`;
  star.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    apply(item, cur?.st ?? null, !(cur?.star === true));
    closeMenu();
  });
  m.append(star);
  document.body.append(m);
  menu = m;
  const r = anchor.getBoundingClientRect();
  const w = m.offsetWidth;
  const h = m.offsetHeight;
  const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
  const below = r.bottom + 6 + h <= window.innerHeight || r.top - 6 - h < 0;
  m.style.left = `${left + window.scrollX}px`;
  m.style.top = `${(below ? r.bottom + 6 : r.top - 6 - h) + window.scrollY}px`;
  (m.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus();
}

const badgeHtml = (item: string) => {
  const m = store.markOf(item);
  const st = m?.st ?? null;
  const tip = `${TXT[lang()].bookmark} : ${label(st)}${m?.star ? ` · ${TXT[lang()].star}` : ''}`;
  return { cls: `mark-badge mark-${st ?? 'none'}${m?.star ? ' is-star' : ''}`, html: `<span class="mark-ic" aria-hidden="true">${ICON[st ?? 'none']}</span>${m?.star ? '<span class="mark-sparkle" aria-hidden="true">★</span>' : ''}`, tip };
};

/** Pastille cliquable sur une carte de liste (exercice, cours, sujet). */
function renderBadge(card: HTMLElement) {
  const item = card.dataset.markItem!;
  let b = card.querySelector<HTMLElement>(':scope > .mark-badge');
  if (!b) {
    b = document.createElement('span');
    b.setAttribute('role', 'button');
    b.tabIndex = 0;
    b.setAttribute('aria-haspopup', 'menu');
    const open = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      openMenu(item, b!);
    };
    b.addEventListener('click', open);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') open(e);
    });
    card.prepend(b);
  }
  const v = badgeHtml(item);
  b.className = v.cls;
  b.title = v.tip;
  b.setAttribute('aria-label', v.tip);
  b.innerHTML = v.html;
}

/** Barre complète sur la page d'un exercice, d'un cours ou d'un sujet. */
function renderBar(bar: HTMLElement) {
  const item = bar.dataset.markBar!;
  const T = TXT[lang()];
  const cur = store.markOf(item);
  bar.replaceChildren();
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', T.bookmark);
  const title = document.createElement('span');
  title.className = 'mark-bar-title';
  title.textContent = T.bookmark;
  bar.append(title);
  for (const st of STATES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `mark-pill mark-${st ?? 'none'}`;
    b.setAttribute('aria-pressed', String((cur?.st ?? null) === st));
    b.innerHTML = `<span class="mark-ic" aria-hidden="true">${ICON[st ?? 'none']}</span> ${label(st)}`;
    b.addEventListener('click', () => apply(item, st, cur?.star === true));
    bar.append(b);
  }
  const s = document.createElement('button');
  s.type = 'button';
  s.className = 'mark-pill mark-star-pill';
  s.setAttribute('aria-pressed', String(cur?.star === true));
  s.innerHTML = `<span class="mark-ic" aria-hidden="true">${cur?.star ? '★' : '☆'}</span> ${T.star}`;
  s.addEventListener('click', () => apply(item, cur?.st ?? null, !(cur?.star === true)));
  bar.append(s);
  const note = document.createElement('span');
  note.className = 'mark-note muted small';
  note.textContent = store.load().auth ? T.synced : T.local;
  bar.append(note);
}

function renderAll() {
  document.querySelectorAll<HTMLElement>('[data-mark-item]').forEach(renderBadge);
  document.querySelectorAll<HTMLElement>('[data-mark-bar]').forEach(renderBar);
}

async function sync() {
  if (!cloud || !store.load().auth) return;
  await syncMarks(cloud);
  renderAll();
  window.dispatchEvent(new Event('comima:marks-synced'));
}

function schedule() {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void sync(), 15000);
}

export function initMarks(): void {
  const cfgEl = document.getElementById('marks-config');
  if (cfgEl) {
    try {
      cloud = new Cloud(JSON.parse(cfgEl.textContent ?? '{}'));
    } catch {
      cloud = null;
    }
  }
  renderAll();
  window.addEventListener('comima:marks', () => {
    renderAll();
    schedule();
  });
  document.addEventListener('click', (e) => {
    if (menu && !menu.contains(e.target as Node)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
  window.addEventListener('scroll', closeMenu, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void sync();
  });
  void sync();
}
