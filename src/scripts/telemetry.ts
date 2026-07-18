/**
 * Fonctions « données » côté client : compteur de visites et bouton
 * « utile 👍 » sur les exercices. Tout passe par un Google Apps Script
 * (GET simples, pas de préflight CORS). Désactivé si DATA_API_URL est vide.
 */
import { DATA_API_URL } from '../lib/config';

const enabled = () => typeof DATA_API_URL === 'string' && DATA_API_URL.length > 0;

/** GET JSON vers l'Apps Script, avec anti-cache. Ne lève jamais. */
async function call<T = any>(params: Record<string, string>): Promise<T | null> {
  if (!enabled()) return null;
  try {
    const url = new URL(DATA_API_URL);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set('_', String(Date.now()));
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Enregistre une visite (une fois par onglet/session pour éviter les doublons). */
export function recordVisit(): void {
  if (!enabled()) return;
  try {
    const key = 'comima-visit-logged';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* sessionStorage indisponible : on compte quand même */
  }
  void call({ action: 'hit', page: location.pathname });
}

/**
 * Initialise le bouton « utile 👍 » d'un exercice.
 * `host` doit contenir un <button data-vote> et un <span data-vote-count>.
 */
export function initVote(host: HTMLElement, exoId: string): void {
  const btn = host.querySelector<HTMLButtonElement>('[data-vote]');
  const countEl = host.querySelector<HTMLElement>('[data-vote-count]');
  if (!btn || !countEl) return;

  if (!enabled()) {
    host.hidden = true; // Fonction non configurée : on masque le bloc.
    return;
  }
  host.hidden = false;

  const votedKey = `comima-voted-${exoId}`;
  const already = () => {
    try {
      return localStorage.getItem(votedKey) === '1';
    } catch {
      return false;
    }
  };
  const markVoted = () => {
    try {
      localStorage.setItem(votedKey, '1');
    } catch {
      /* ignore */
    }
  };

  const setCount = (n: number | null | undefined) => {
    if (typeof n === 'number') countEl.textContent = String(n);
  };
  if (already()) {
    btn.disabled = true;
    btn.classList.add('voted');
  }

  // Compte actuel.
  void call<{ count: number }>({ action: 'votes', exo: exoId }).then((r) => setCount(r?.count));

  btn.addEventListener('click', async () => {
    if (already() || btn.disabled) return;
    btn.disabled = true;
    btn.classList.add('voted');
    markVoted();
    const r = await call<{ count: number }>({ action: 'vote', exo: exoId });
    setCount(r?.count);
  });
}

/** Récupère les statistiques agrégées (pour l'admin). */
export function fetchStats() {
  return call<{ total: number; pages: [string, number][]; votes: [string, number][] }>({
    action: 'stats',
  });
}

export const dataEnabled = enabled;
