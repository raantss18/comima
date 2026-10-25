// Synchronisation du site avec le compte (profil + réponses). Logique pure, sans interface :
// elle est testée avec un faux serveur (tests/web.test.mjs). Mêmes principes que l'application :
//  - le navigateur reste la référence tant qu'il est hors ligne : rien n'est jamais bloqué ;
//  - chaque réponse a un identifiant unique : renvoyer deux fois ne crée aucun doublon ;
//  - nouveau navigateur, même compte : on reprend d'abord le profil et les réponses du serveur,
//    pour ne pas écraser de bonnes données par un profil vide ;
//  - un navigateur ne change jamais de compte sans accord (données de deux personnes jamais mélangées).
import { CloudError, type Cloud, type Session } from './web-cloud.ts';
import * as store from './web-store.ts';

export type SyncResult = 'ok' | 'need-profile' | 'offline' | 'failed' | 'signed-out';

/** Session valide (renouvelée si besoin), ou null si l'on n'est pas / plus connecté. */
export async function currentSession(cloud: Cloud): Promise<Session | null> {
  const l = store.load();
  if (!l.auth) return null;
  let s: Session = l.auth;
  if (Date.now() / 1000 > s.exp - 60) {
    try {
      s = await cloud.refresh(s);
      l.auth = { ...l.auth, ...s };
      store.save(l);
    } catch (e) {
      if (e instanceof CloudError && (e.unauthorized || e.status === 400)) {
        delete l.auth;
        store.save(l);
        return null;
      }
      throw e;
    }
  }
  return s;
}

/**
 * Enregistre la session après une connexion. Si ce navigateur contient la progression d'un autre
 * compte, `confirmReset` décide : refus → la session est annulée (false) ; accord → progression effacée.
 */
export function adoptSession(s: Session, confirmReset: () => boolean): boolean {
  const l = store.load();
  if (l.accountId && l.accountId !== s.userId) {
    if (!confirmReset()) return false;
    store.reset();
  }
  const fresh = store.load();
  fresh.auth = { ...s };
  store.save(fresh);
  return true;
}

export async function runSync(cloud: Cloud): Promise<SyncResult> {
  try {
    const s = await currentSession(cloud);
    if (!s) return 'signed-out';
    const l = store.load();
    const remote = await cloud.myProfile(s);
    if (remote && !l.accountId) {
      l.profile = {
        name: remote.display_name,
        role: remote.role === 'eleve' ? 'eleve' : 'encadreur',
        birthYear: remote.birth_year,
        school: remote.school ?? '',
        region: remote.region ?? '',
        centre: remote.centre_id ?? 'aucun',
      };
      l.serverRole = remote.role;
      l.dirty = false;
    } else if (!remote || l.dirty) {
      if (!l.profile) return 'need-profile'; // rien à envoyer : l'interface demande le profil
      const r = await cloud.register(s, l.profile);
      l.serverRole = r.role;
      l.dirty = false;
    } else {
      l.serverRole = remote.role;
    }
    l.accountId = s.userId;
    store.save(l);

    store.mergeRemote(await cloud.pullAttempts(s));
    for (let b = store.unsynced(); b.length; b = store.unsynced()) {
      await cloud.pushAttempts(
        s,
        b.map((e) => ({
          id: e.id,
          user_id: s.userId,
          question_id: e.q,
          notion_id: e.n ?? null,
          theme: e.th ?? null,
          qtype: e.type ?? null,
          difficulty: e.d ?? null,
          ok: e.ok,
          duration_ms: e.ms ?? null,
          answered_at: e.t,
        })),
      );
      store.markSynced(b.map((e) => e.id));
    }
    const done = store.load();
    if (done.auth) done.auth.lastSync = new Date().toISOString();
    store.save(done);
    return 'ok';
  } catch (e) {
    if (e instanceof CloudError) {
      if (e.unauthorized) {
        const l = store.load();
        delete l.auth;
        store.save(l);
        return 'signed-out';
      }
      return 'failed'; // réponse inattendue : à signaler, pas à confondre avec « hors ligne »
    }
    return 'offline';
  }
}
