// Progression d'entraînement sur le site, gardée dans ce navigateur. Même modèle que
// l'application (journal de réponses avec identifiant unique) : la synchronisation avec le
// compte envoie et reprend les mêmes réponses. Tout fonctionne sans compte.
import type { Profile, Session } from './web-cloud.ts';

export interface Entry {
  id: string;
  q: string;
  ok: boolean;
  t: string;
  type?: string;
  d?: number;
  n?: string;
  th?: string;
  ms?: number;
  /** Déjà envoyée au serveur. */
  s?: boolean;
}

/** Marque-page d'un exercice, sujet ou cours (même modèle que l'application, voir ProgressStore). */
export interface Mark {
  /** lu | teste | continuer | fait ; null = pas encore vu. */
  st: string | null;
  /** Étoile « à voir ». */
  star: boolean;
  /** Date de dernière modification (ISO, UTC) : « le plus récent gagne ». */
  t: string;
  /** Déjà envoyé au serveur. */
  s?: boolean;
}

export const MARK_STATUSES = ['lu', 'teste', 'continuer', 'fait'] as const;

export interface Local {
  v: 2;
  log: Entry[];
  profile?: Profile;
  /** Compte auquel ce navigateur est lié : jamais deux comptes sur les mêmes données. */
  accountId?: string;
  auth?: Session & { lastSync?: string };
  dirty?: boolean;
  serverRole?: string;
  /** Marque-pages, par clé `exo:<id>`, `cours:<id>` ou `sujet:<id>` (0.6.0). */
  marks?: Record<string, Mark>;
}

const KEY = 'comima-training-v2';
const OLD = 'comima-training-v1';
const MAX_LOG = 5000;

export const uuid = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16));

let cache: Local | null = null;

/** Lit la progression ; reprend l'ancien format (v1 : {notion: {question: bool}}) sans rien perdre. */
export function load(): Local {
  if (cache) return cache;
  let l: Local = { v: 2, log: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) l = JSON.parse(raw) as Local;
    else {
      const old = localStorage.getItem(OLD);
      if (old) {
        const v1 = JSON.parse(old) as Record<string, Record<string, boolean>>;
        const now = new Date().toISOString();
        for (const [n, qs] of Object.entries(v1)) for (const [q, ok] of Object.entries(qs)) l.log.push({ id: uuid(), q, ok: !!ok, t: now, n, s: false });
        save(l);
      }
    }
  } catch {
    /* stockage indisponible (navigation privée…) : la progression vit en mémoire seulement */
  }
  cache = l;
  return l;
}

export function save(l: Local = load()): void {
  cache = l;
  try {
    localStorage.setItem(KEY, JSON.stringify(l));
  } catch {
    /* quota ou navigation privée */
  }
}

export function reset(): void {
  save({ v: 2, log: [] });
}

export function record(e: Omit<Entry, 'id' | 't' | 's'>): void {
  const l = load();
  l.log.push({ ...e, id: uuid(), t: new Date().toISOString(), s: false });
  if (l.log.length > MAX_LOG) l.log.splice(0, l.log.length - MAX_LOG);
  save(l);
  window.dispatchEvent(new Event('comima:answered'));
}

/** Dernier résultat de chaque question : {question → réussie ?}. */
export function lastResults(): Map<string, boolean> {
  const m = new Map<string, boolean>();
  // Les questions générées (`g:…`) ne comptent pas dans l'avancement : il y en aurait une nouvelle à chaque visite.
  const sorted = [...load().log].filter((e) => !e.q.startsWith('g:')).sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  for (const e of sorted) m.set(e.q, e.ok);
  return m;
}

/** Par notion : questions déjà répondues et questions dont la dernière réponse est juste. */
export function byNotion(): Record<string, { answered: number; correct: number }> {
  const last = new Map<string, Entry>();
  for (const e of [...load().log].filter((x) => !x.q.startsWith('g:')).sort((a, b) => Date.parse(a.t) - Date.parse(b.t))) last.set(e.q, e);
  const out: Record<string, { answered: number; correct: number }> = {};
  for (const e of last.values()) {
    if (!e.n) continue;
    const c = (out[e.n] ??= { answered: 0, correct: 0 });
    c.answered++;
    if (e.ok) c.correct++;
  }
  return out;
}

export function totals(): { answers: number; good: number } {
  const log = load().log;
  return { answers: log.length, good: log.filter((e) => e.ok).length };
}

export const unsynced = (limit = 200): Entry[] => load().log.filter((e) => !e.s).slice(0, limit);

export function markSynced(ids: string[]): void {
  const set = new Set(ids);
  const l = load();
  for (const e of l.log) if (set.has(e.id)) e.s = true;
  save(l);
}

/** Fusionne les réponses du serveur absentes de ce navigateur. Renvoie le nombre ajouté. */
export function mergeRemote(rows: any[]): number {
  const l = load();
  const known = new Set(l.log.map((e) => e.id));
  const fresh = rows.filter((r) => !known.has(r.id));
  for (const r of fresh) {
    l.log.push({
      id: r.id,
      q: r.question_id,
      ok: r.ok === true,
      t: new Date(r.answered_at).toISOString(),
      type: r.qtype ?? undefined,
      d: r.difficulty ?? undefined,
      n: r.notion_id ?? undefined,
      th: r.theme ?? undefined,
      ms: r.duration_ms ?? undefined,
      s: true,
    });
  }
  if (fresh.length) {
    l.log.sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
    if (l.log.length > MAX_LOG) l.log.splice(0, l.log.length - MAX_LOG);
    save(l);
  }
  return fresh.length;
}

// ---------------------------------------------------------------- marque-pages (0.6.0)

export const markKey = (kind: 'exo' | 'cours' | 'sujet', id: string): string => `${kind}:${id}`;

export const markOf = (item: string): Mark | undefined => load().marks?.[item];

/** Pose un marque-page (valeurs absolues) ; signale le changement à la page et à la synchronisation. */
export function setMark(item: string, st: string | null, star: boolean): void {
  if (st !== null && !(MARK_STATUSES as readonly string[]).includes(st)) return;
  const l = load();
  (l.marks ??= {})[item] = { st, star, t: new Date().toISOString(), s: false };
  save(l);
  window.dispatchEvent(new Event('comima:marks'));
}

export const unsyncedMarks = (limit = 500): [string, Mark][] =>
  Object.entries(load().marks ?? {})
    .filter(([, m]) => m.s !== true)
    .slice(0, limit);

/** Marque comme envoyés ceux qui n'ont pas changé depuis l'envoi (même date `t`). */
export function markMarksSynced(sent: [string, Mark][]): void {
  const l = load();
  for (const [item, m] of sent) {
    const cur = l.marks?.[item];
    if (cur && cur.t === m.t) cur.s = true;
  }
  save(l);
}

/** Fusionne ceux du serveur : pour chaque élément, le plus récent gagne. Renvoie le nombre mis à jour. */
export function mergeRemoteMarks(rows: { item: string; status: string | null; starred: boolean; updated_at: string }[]): number {
  const l = load();
  const marks = (l.marks ??= {});
  let n = 0;
  for (const r of rows) {
    const when = Date.parse(r.updated_at);
    if (!r.item || Number.isNaN(when)) continue;
    const local = marks[r.item];
    if (local && Date.parse(local.t) >= when) continue; // ce navigateur est plus récent (ou égal)
    marks[r.item] = {
      st: (MARK_STATUSES as readonly string[]).includes(r.status ?? '') ? r.status : null,
      star: r.starred === true,
      t: new Date(when).toISOString(),
      s: true,
    };
    n++;
  }
  if (n) {
    save(l);
    window.dispatchEvent(new Event('comima:marks'));
  }
  return n;
}
