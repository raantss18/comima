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
const { runSync, adoptSession, currentSession, syncMarks } = await import('../src/scripts/web-sync.ts');

const fresh = () => {
  globalThis.localStorage = mem();
  // le cache du module est vidé en relisant un stockage neuf
  store.reset();
};
const future = () => Math.floor(Date.now() / 1000) + 7200;
const session = (id = 'user-1', exp = future()) => ({ access: 'acc', refresh: 'ref', exp, userId: id, email: 'a@b.mg' });

/** Faux serveur : mémorise ce qu'on lui envoie et répond comme le vrai. */
function server() {
  const s = { profile: null, attempts: [], registers: 0, refreshes: 0, offline: false, fail: 0, refreshOk: true, marksTable: false, marks: {} };
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
    async pullMarks() {
      if (!s.marksTable) throw new CloudError(404, 'Could not find the table comima.marks', 'PGRST205');
      return Object.values(s.marks);
    },
    async pushMarks(_sess, rows) {
      if (!s.marksTable) throw new CloudError(404, 'Could not find the table comima.marks', 'PGRST205');
      for (const r of rows) {
        const old = s.marks[r.item];
        // « Le plus récent gagne » (déclencheur keep_newest_mark côté PostgreSQL).
        if (!old || Date.parse(r.updated_at) >= Date.parse(old.updated_at)) s.marks[r.item] = { item: r.item, status: r.status, starred: r.starred, updated_at: r.updated_at };
      }
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

test('illustrations des fiches : chaque module correspond à une notion et est déclaré dans le chargeur', async () => {
  const fs = await import('node:fs');
  const dir = new URL('../src/scripts/fiche/', import.meta.url);
  const modules = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && !['core.ts', 'index.ts'].includes(f)).map((f) => f.replace(/\.ts$/, ''));
  const notions = fs.readdirSync(new URL('../content/app/notions/', import.meta.url)).map((f) => f.replace(/\.yaml$/, ''));
  const loader = fs.readFileSync(new URL('index.ts', dir), 'utf8');
  assert.ok(modules.length > 0);
  for (const id of modules) {
    assert.ok(notions.includes(id), `${id}.ts ne correspond à aucune notion`);
    assert.ok(loader.includes(`import('./${id}')`), `${id} n'est pas déclaré dans fiche/index.ts`);
  }
});

test('illustrations des chapitres : chaque module correspond à un chapitre et est déclaré dans le chargeur', async () => {
  const fs = await import('node:fs');
  const dir = new URL('../src/scripts/cours/', import.meta.url);
  const modules = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts').map((f) => f.replace(/\.ts$/, ''));
  const chapitres = fs.readdirSync(new URL('../content/cours/', import.meta.url));
  const loader = fs.readFileSync(new URL('index.ts', dir), 'utf8');
  assert.ok(modules.length > 0);
  for (const id of modules) {
    assert.ok(chapitres.includes(id), `${id}.ts ne correspond à aucun chapitre de content/cours`);
    assert.ok(loader.includes(`import('./${id}')`), `${id} n'est pas déclaré dans cours/index.ts`);
  }
});

test('illustrations de l\'application : une page HTML autonome par figure du site', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'comima-figs-'));
  execFileSync(process.execPath, ['scripts/build-app-figures.mjs', out], { cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe' });
  const ids = (dir, skip) => fs.readdirSync(new URL(`../src/scripts/${dir}/`, import.meta.url)).filter((f) => f.endsWith('.ts')).map((f) => f.replace(/\.ts$/, '')).filter((i) => !skip.includes(i));
  const expected = [...ids('fiche', ['core', 'index']).map((i) => `fiche-${i}.html`), ...ids('cours', ['index']).map((i) => `cours-${i}.html`)].sort();
  assert.deepEqual(fs.readdirSync(out).sort(), expected);
  for (const f of expected) {
    const html = fs.readFileSync(path.join(out, f), 'utf8');
    assert.ok(html.includes('%%COMIMA_LANG%%') && html.includes('%%COMIMA_THEME%%'), `${f} : jetons de langue/thème absents`);
    assert.ok(!/https?:\/\//.test(html.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')), `${f} : la page ne doit charger aucune ressource distante`);
    assert.equal((html.match(/<script>/g) ?? []).length, 2, `${f} : deux scripts attendus`);
  }
  // Les noms demandés par l'application existent pour toutes les notions et tous les chapitres illustrés.
  const dart = fs.readFileSync(new URL('../app/lib/ui/notion.dart', import.meta.url), 'utf8') + fs.readFileSync(new URL('../app/lib/ui/library.dart', import.meta.url), 'utf8');
  assert.ok(dart.includes("FigureView(name: 'fiche-${notion.id}')") && dart.includes("FigureView(name: 'cours-$id')"));
  fs.rmSync(out, { recursive: true, force: true });
});

test('marque-pages : posés ici, envoyés avec la synchronisation, repris sur un autre navigateur', async () => {
  fresh();
  const { s, cloud } = server();
  s.marksTable = true;
  store.load().auth = session();
  store.load().profile = profile;
  store.save();
  store.setMark('exo:engel-09-15', 'fait', true);
  store.setMark('cours:03-principe-des-tiroirs', 'continuer', false);
  store.setMark('exo:x', 'nimporte', false); // état inconnu : refusé
  assert.equal(store.markOf('exo:x'), undefined);
  assert.equal(store.unsyncedMarks().length, 2);
  assert.equal(await runSync(cloud), 'ok');
  assert.equal(store.unsyncedMarks().length, 0);
  assert.equal(Object.keys(s.marks).length, 2);
  assert.equal(s.marks['exo:engel-09-15'].status, 'fait');
  assert.equal(s.marks['exo:engel-09-15'].starred, true);

  // Un autre navigateur, même compte : reprend les marque-pages.
  globalThis.localStorage = mem();
  store.reset();
  store.load().auth = session();
  store.save();
  assert.equal(await runSync(cloud), 'ok');
  assert.equal(store.markOf('exo:engel-09-15')?.st, 'fait');
  assert.equal(store.markOf('cours:03-principe-des-tiroirs')?.st, 'continuer');

  // Il change d'avis plus tard : le plus récent gagne, des deux côtés.
  await new Promise((r) => setTimeout(r, 5));
  store.setMark('exo:engel-09-15', 'teste', false);
  assert.equal(await syncMarks(cloud), 'ok');
  assert.equal(s.marks['exo:engel-09-15'].status, 'teste');

  // Modification plus ancienne (navigateur resté hors ligne) : n'écrase pas le serveur.
  s.marks['cours:03-principe-des-tiroirs'] = { item: 'cours:03-principe-des-tiroirs', status: 'fait', starred: false, updated_at: new Date(Date.now() + 300000).toISOString() };
  store.setMark('cours:03-principe-des-tiroirs', 'lu', false);
  assert.equal(await syncMarks(cloud), 'ok');
  assert.equal(store.markOf('cours:03-principe-des-tiroirs')?.st, 'fait');
});

test('marque-pages : serveur sans la table → la synchronisation réussit, rien ne se perd', async () => {
  fresh();
  const { s, cloud } = server(); // marksTable = false
  store.load().auth = session();
  store.load().profile = profile;
  store.save();
  answer('rs-01');
  store.setMark('exo:rs-01', 'lu', true);
  assert.equal(await runSync(cloud), 'ok');
  assert.equal(s.attempts.length, 1, 'le reste se synchronise normalement');
  assert.equal(store.unsyncedMarks().length, 1, 'gardé pour plus tard');
  s.marksTable = true; // migration faite
  assert.equal(await syncMarks(cloud), 'ok');
  assert.equal(store.unsyncedMarks().length, 0);
  assert.equal(s.marks['exo:rs-01'].starred, true);
});

test('marque-pages : pas de synchronisation légère avant la première synchronisation du profil', async () => {
  fresh();
  const { cloud } = server();
  store.load().auth = session();
  store.save();
  store.setMark('exo:rs-01', 'lu', false);
  assert.equal(await syncMarks(cloud), 'need-profile');
  assert.equal(store.unsyncedMarks().length, 1);
});

test('espace personnel : niveau (10 × difficulté à la 1re réussite) et série de jours', async () => {
  const { xpOf, levelOf, streakOf } = await import('../src/scripts/web-space.ts');
  const t = (d) => new Date(2026, 9, 27 - d, 12).toISOString();
  const log = [
    { id: '1', q: 'a', ok: false, t: t(0), d: 5 },
    { id: '2', q: 'a', ok: true, t: t(0), d: 5 }, // 50
    { id: '3', q: 'a', ok: true, t: t(0), d: 5 }, // déjà réussie : rien
    { id: '4', q: 'b', ok: true, t: t(1) }, // 10 (difficulté 1 par défaut)
    { id: '5', q: 'c', ok: true, t: t(1), d: 99 }, // plafonné à 10 → 100
  ];
  assert.equal(xpOf(log), 160);
  assert.equal(levelOf(0), 1);
  assert.equal(levelOf(99), 1);
  assert.equal(levelOf(100), 2);
  assert.equal(levelOf(400), 3);
  assert.equal(streakOf(log, new Date(2026, 9, 27, 20)), 2);
  assert.equal(streakOf(log, new Date(2026, 9, 28, 8)), 2); // la série n'est pas perdue avant la fin du jour
  assert.equal(streakOf(log, new Date(2026, 9, 29, 8)), 0);
  assert.equal(streakOf([], new Date()), 0);
});

test('garde /admin : empreintes identiques au script, accès fermé par défaut, rôle serveur exigé', async () => {
  const { hashEmail, decide } = await import('../src/scripts/admin-gate.ts');
  const { hashEmail: nodeHash } = await import('../scripts/admins.mjs');
  const salt = 'abc123';
  assert.equal(await hashEmail(salt, '  Antsa@Exemple.MG '), nodeHash(salt, 'antsa@exemple.mg')); // navigateur = script
  const list = { salt, hashes: [nodeHash(salt, 'antsa@exemple.mg')] };
  assert.equal(await decide(list, 'ANTSA@exemple.mg', 'admin'), 'open');
  assert.equal(await decide(list, 'antsa@exemple.mg', 'eleve'), 'not-admin'); // dans la liste mais pas admin sur le serveur
  assert.equal(await decide(list, 'autre@exemple.mg', 'admin'), 'not-admin'); // admin serveur mais hors liste
  assert.equal(await decide(list, undefined, undefined), 'need-login');
  assert.equal(await decide(null, 'antsa@exemple.mg', 'admin'), 'error'); // liste introuvable : fermé
  assert.equal(await decide({ salt, hashes: [] }, undefined, undefined), 'open-unconfigured');
});
