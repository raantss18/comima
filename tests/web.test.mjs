// Tests de la connexion et de la synchronisation du site (page Entraînement), avec un faux
// serveur et un faux stockage de navigateur. Lancer : node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Faux navigateur minimal (le code du site n'utilise que ceci).
const mem = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
};
globalThis.localStorage = mem();
globalThis.sessionStorage = mem();
globalThis.window = { dispatchEvent() {} };

const store = await import('../src/scripts/web-store.ts');
const { Cloud, CloudError, newPkce } = await import('../src/scripts/web-cloud.ts');
const { runSync, adoptSession, currentSession } = await import('../src/scripts/web-sync.ts');

const fresh = () => {
  globalThis.localStorage = mem();
  // le cache du module est vidé en relisant un stockage neuf
  store.reset();
};
const future = () => Math.floor(Date.now() / 1000) + 7200;
const session = (id = 'user-1', exp = future()) => ({ access: 'acc', refresh: 'ref', exp, userId: id, email: 'a@b.mg' });

/** Faux serveur : mémorise ce qu'on lui envoie et répond comme le vrai. */
function server() {
  const s = { profile: null, attempts: [], registers: 0, refreshes: 0, offline: false, fail: 0, refreshOk: true };
  const cloud = {
    async refresh(sess) {
      if (s.offline) throw new TypeError('fetch failed');
      s.refreshes++;
      if (!s.refreshOk) throw new CloudError(400, 'refresh_token_not_found', 'refresh_token_not_found');
      return { ...sess, access: 'acc2', exp: future() };
    },
    async myProfile() {
      if (s.offline) throw new TypeError('fetch failed');
      if (s.fail) throw new CloudError(s.fail, 'boom');
      return s.profile;
    },
    async register(_sess, p) {
      s.registers++;
      s.profile = { id: 'user-1', display_name: p.name, role: 'eleve', birth_year: p.birthYear, school: p.school, region: p.region, centre_id: p.centre };
      return s.profile;
    },
    async pullAttempts() {
      return s.attempts;
    },
    async pushAttempts(_sess, rows) {
      for (const r of rows) if (!s.attempts.some((a) => a.id === r.id)) s.attempts.push(r); // ignore-duplicates
    },
  };
  return { s, cloud };
}

const profile = { name: 'Rova', role: 'eleve', birthYear: 2010, school: 'Lycée', region: 'Analamanga', centre: 'antananarivo' };
const answer = (q, ok = true, extra = {}) => store.record({ q, ok, type: 'numeric', d: 1, n: 'recurrence-sommes', th: 'algèbre', ms: 1500, ...extra });

test('PKCE : empreinte SHA-256 du secret, en base64url sans remplissage', async () => {
  const { verifier, challenge } = await newPkce();
  assert.ok(verifier.length >= 43 && !verifier.includes('='));
  assert.equal(challenge, crypto.createHash('sha256').update(verifier).digest('base64url'));
});

test('ancienne progression (v1) reprise sans perte', () => {
  globalThis.localStorage = mem();
  localStorage.setItem('comima-training-v1', JSON.stringify({ 'recurrence-sommes': { 'rs-01': true, 'rs-02': false } }));
  // force la relecture du stockage
  store.save({ v: 2, log: [] });
  globalThis.localStorage = mem();
  localStorage.setItem('comima-training-v1', JSON.stringify({ 'recurrence-sommes': { 'rs-01': true, 'rs-02': false } }));
  // module déjà chargé : on teste la migration via un second import isolé
  return import('../src/scripts/web-store.ts?migration').then((m) => {
    const l = m.load();
    assert.equal(l.log.length, 2);
    assert.equal(new Set(l.log.map((e) => e.id)).size, 2);
    assert.deepEqual(m.byNotion(), { 'recurrence-sommes': { answered: 2, correct: 1 } });
  });
});

test('envoi : profil puis réponses, une seule fois (aucun doublon)', async () => {
  fresh();
  const { s, cloud } = server();
  answer('rs-01');
  answer('rs-02', false);
  const l = store.load();
  l.profile = profile;
  l.dirty = true;
  l.auth = session();
  store.save(l);
  assert.equal(await runSync(cloud), 'ok');
  assert.equal(s.registers, 1);
  assert.equal(s.attempts.length, 2);
  assert.equal(s.attempts[0].theme, 'algèbre');
  assert.equal(store.unsynced().length, 0);
  assert.equal(await runSync(cloud), 'ok');
  assert.equal(s.attempts.length, 2);
  assert.equal(s.registers, 1);
});

test('sans profil local ni serveur : le profil est demandé, rien n\'est envoyé', async () => {
  fresh();
  const { s, cloud } = server();
  answer('rs-01');
  const l = store.load();
  l.auth = session();
  store.save(l);
  assert.equal(await runSync(cloud), 'need-profile');
  assert.equal(s.attempts.length, 0);
});

test('nouveau navigateur : profil et progression du serveur repris, sans les écraser', async () => {
  fresh();
  const { s, cloud } = server();
  s.profile = { id: 'user-1', display_name: 'Rova R.', role: 'encadreur', birth_year: null, school: 'Lycée Y', region: 'Itasy', centre_id: 'fianarantsoa' };
  s.attempts.push({ id: 'a1', question_id: 'rs-01', ok: true, answered_at: '2026-10-20T10:00:00Z', notion_id: 'recurrence-sommes', difficulty: 1 });
  const l = store.load();
  l.auth = session();
  store.save(l);
  assert.equal(await runSync(cloud), 'ok');
  assert.equal(s.registers, 0, 'le profil du serveur ne doit pas être écrasé');
  assert.equal(store.load().profile.name, 'Rova R.');
  assert.equal(store.load().profile.role, 'encadreur');
  assert.equal(store.load().serverRole, 'encadreur');
  assert.deepEqual(store.byNotion(), { 'recurrence-sommes': { answered: 1, correct: 1 } });
  assert.equal(store.unsynced().length, 0);
});

test('un navigateur ne change jamais de compte sans accord', async () => {
  fresh();
  const { cloud } = server();
  const l = store.load();
  l.profile = profile;
  l.auth = session('user-1');
  store.save(l);
  answer('rs-01');
  await runSync(cloud);
  assert.equal(store.load().accountId, 'user-1');
  assert.equal(adoptSession(session('user-2'), () => false), false);
  assert.equal(store.load().log.length, 1, 'refus : la progression reste');
  assert.equal(adoptSession(session('user-1'), () => false), true);
  assert.equal(adoptSession(session('user-2'), () => true), true);
  assert.equal(store.load().log.length, 0, 'accord : la progression de l\'autre compte est effacée');
});

test('jeton expiré renouvelé ; renouvellement refusé : déconnexion propre', async () => {
  fresh();
  const { s, cloud } = server();
  let l = store.load();
  l.profile = profile;
  l.auth = session('user-1', 1);
  store.save(l);
  assert.equal(await runSync(cloud), 'ok');
  assert.equal(s.refreshes, 1);
  assert.equal(store.load().auth.access, 'acc2');

  l = store.load();
  l.auth = session('user-1', 1);
  store.save(l);
  s.refreshOk = false;
  assert.equal(await runSync(cloud), 'signed-out');
  assert.equal(store.load().auth, undefined);
  assert.equal(await currentSession(cloud), null);
});

test('hors ligne et erreur serveur : distinguées, rien n\'est perdu', async () => {
  fresh();
  const { s, cloud } = server();
  answer('rs-01');
  const l = store.load();
  l.profile = profile;
  l.dirty = true;
  l.auth = session();
  store.save(l);
  s.offline = true;
  assert.equal(await runSync(cloud), 'offline');
  s.offline = false;
  s.fail = 500;
  assert.equal(await runSync(cloud), 'failed');
  s.fail = 0;
  assert.equal(store.unsynced().length, 1);
  assert.equal(await runSync(cloud), 'ok');
  assert.equal(s.attempts.length, 1);
});

test('état du serveur : modes de connexion lus, schéma pas encore exposé / prêt', async () => {
  const realFetch = globalThis.fetch;
  const cfg = { url: 'https://x.supabase.co', key: 'anon' };
  const mk = (probeStatus, probeBody) => async (url) => {
    const u = String(url);
    if (u.includes('/auth/v1/settings')) return new Response(JSON.stringify({ external: { email: false, google: true, facebook: true } }), { status: 200 });
    return new Response(JSON.stringify(probeBody), { status: probeStatus });
  };
  try {
    globalThis.fetch = mk(406, { code: 'PGRST106', message: 'Invalid schema: comima' });
    const notReady = await new Cloud(cfg).status();
    assert.deepEqual([notReady.reachable, notReady.google, notReady.email, notReady.schemaReady, notReady.ready], [true, true, false, false, false]);
    globalThis.fetch = mk(401, { code: '42501', message: 'permission denied for schema comima' });
    const ready = await new Cloud(cfg).status();
    assert.deepEqual([ready.schemaReady, ready.ready], [true, true]);
    globalThis.fetch = async () => {
      throw new TypeError('réseau');
    };
    assert.equal((await new Cloud(cfg).status()).reachable, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('erreurs de connexion lisibles', () => {
  assert.ok(new CloudError(400, 'Invalid login credentials', 'invalid_credentials').invalidLogin);
  assert.ok(new CloudError(400, 'Email not confirmed', 'email_not_confirmed').notConfirmed);
  assert.ok(new CloudError(422, 'Email logins are disabled', 'email_provider_disabled').emailDisabled);
  assert.ok(new CloudError(422, 'User already registered', 'user_already_exists').exists);
});
