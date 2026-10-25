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

export interface Local {
  v: 2;
  log: Entry[];
  profile?: Profile;
  /** Compte auquel ce navigateur est lié : jamais deux comptes sur les mêmes données. */
  accountId?: string;
  auth?: Session & { lastSync?: string };
  dirty?: boolean;
  serverRole?: string;
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
  const sorted = [...load().log].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  for (const e of sorted) m.set(e.q, e.ok);
  return m;
}

/** Par notion : questions déjà répondues et questions dont la dernière réponse est juste. */
export function byNotion(): Record<string, { answered: number; correct: number }> {
  const last = new Map<string, Entry>();
  for (const e of [...load().log].sort((a, b) => Date.parse(a.t) - Date.parse(b.t))) last.set(e.q, e);
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
