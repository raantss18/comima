// Garde de la page /admin : il faut être connecté (même compte que l'application), figurer dans la liste des
// administrateurs (empreintes salées de public/admins.json, aucun e-mail publié) ET avoir le rôle « admin » sur le
// serveur. Sans cela, le panneau reste caché. La vraie clé d'écriture reste le jeton GitHub : cette garde réserve
// l'accès à l'écran, elle ne remplace pas la protection du dépôt.
import * as store from './web-store.ts';

export interface AdminList {
  salt: string;
  hashes: string[];
}

export async function hashEmail(salt: string, email: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${email.trim().toLowerCase()}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type Gate = 'open' | 'open-unconfigured' | 'need-login' | 'not-admin' | 'error';

/** Décide de l'accès. `list` null = liste introuvable : fermé (jamais ouvert par défaut). */
export async function decide(list: AdminList | null, email: string | undefined, role: string | undefined): Promise<Gate> {
  if (!list || !Array.isArray(list.hashes)) return 'error';
  // Liste vide : l'administration n'est pas encore configurée (aucun nom dans release-keys/admins.txt).
  if (list.hashes.length === 0) return 'open-unconfigured';
  if (!email) return 'need-login';
  const h = await hashEmail(list.salt, email);
  return list.hashes.includes(h) && role === 'admin' ? 'open' : 'not-admin';
}

export function initGate(listUrl: string, show: (g: Gate) => void): void {
  let list: AdminList | null = null;
  let loaded = false;
  const run = async () => {
    if (!loaded) {
      try {
        const r = await fetch(listUrl, { cache: 'no-store' });
        list = r.ok ? ((await r.json()) as AdminList) : null;
      } catch {
        list = null;
      }
      loaded = true;
    }
    const l = store.load();
    show(await decide(list, l.auth?.email, l.serverRole));
  };
  void run();
  window.addEventListener('comima:synced', () => void run());
}
