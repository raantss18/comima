// Vérifie, par l'API publique, que le projet Supabase est prêt pour l'application COMIMa.
// Aucun compte n'est créé, aucune donnée n'est lue : seulement des requêtes d'état.
// Usage : node scripts/check-supabase.mjs        (lit release-keys/accounts.env)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './content-lib.mjs';

const envFile = path.join(ROOT, 'release-keys', 'accounts.env');
const env = Object.fromEntries(
  (fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const url = process.env.COMIMA_SUPABASE_URL ?? env.COMIMA_SUPABASE_URL;
const key = process.env.COMIMA_SUPABASE_KEY ?? env.COMIMA_SUPABASE_KEY;

const results = [];
const check = (ok, label, fix) => {
  results.push(ok);
  console.log(`${ok ? '✓' : '✗'} ${label}${ok || !fix ? '' : `\n    → ${fix}`}`);
};
if (!url || !key) {
  console.error('✗ release-keys/accounts.env : COMIMA_SUPABASE_URL et COMIMA_SUPABASE_KEY manquants');
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const get = async (p, extra = {}) => {
  const r = await fetch(`${url}${p}`, { headers: { ...headers, ...extra } });
  return { status: r.status, body: await r.json().catch(() => null) };
};

// La clé doit être la clé publique « anon » : une clé secrète ne doit JAMAIS être dans l'application.
let role = '?';
try {
  role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role;
} catch {
  role = key.startsWith('sb_publishable_') ? 'anon' : key.startsWith('sb_secret_') ? 'service_role' : '?';
}
check(role === 'anon', `clé publique « anon » (rôle lu : ${role})`, 'utiliser la clé anon / publishable, JAMAIS service_role');

const settings = await get('/auth/v1/settings');
const ext = settings.body?.external ?? {};
check(settings.status === 200, 'projet joignable', `vérifier l'URL ${url}`);
check(ext.google === true, 'connexion Google activée', 'Authentication → Sign In / Providers → Google');
check(ext.facebook === true, 'connexion Facebook activée', 'Authentication → Sign In / Providers → Facebook');
if (ext.facebook === true) {
  // L'identifiant Facebook doit être l'App ID numérique (lu dans la redirection vers Facebook).
  const r = await fetch(`${url}/auth/v1/authorize?provider=facebook&redirect_to=mg.comima.app://login-callback`, { redirect: 'manual' });
  const fbId = new URL(r.headers.get('location') ?? 'https://x/').searchParams.get('client_id') ?? '';
  // Avertissement seulement : réglage du serveur, il n'empêche pas de publier l'application.
  console.log(/^\d{6,}$/.test(fbId)
    ? '✓ identifiant Facebook valide'
    : `⚠ identifiant Facebook invalide (lu : « ${fbId} ») : la connexion Facebook échouera\n    → Providers → Facebook : Facebook client ID = App ID NUMÉRIQUE (supabase/README.md, 3 bis)`);
}
check(ext.email === true, 'connexion par e-mail activée', 'Authentication → Sign In / Providers → Email (réglage commun au projet)');

// Le schéma doit être exposé à l'API ET créé par la migration.
const sch = await get('/rest/v1/centres', { 'Accept-Profile': 'comima' });
const exposed = sch.body?.code !== 'PGRST106';
check(exposed, 'schéma « comima » exposé à l\'API', 'Project Settings → Data API → Exposed schemas : ajouter comima (et ENREGISTRER)');
if (exposed) {
  // `anon` doit être refusé (permission denied) : le schéma existe ET il est protégé.
  const created = sch.body?.code !== 'PGRST205' && sch.body?.code !== '3F000';
  check(created, 'tables COMIMa créées', 'SQL Editor : exécuter supabase/migrations/20261025000000_comptes.sql');
  const leak = Array.isArray(sch.body) && sch.body.length > 0;
  check(!leak, 'accès refusé sans connexion (anon ne lit rien)', 'URGENT : anon peut lire le schéma comima — réexécuter la migration (révocations)');
  const reg = await fetch(`${url}/rest/v1/rpc/register`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', 'Content-Profile': 'comima' },
    body: JSON.stringify({ p_display_name: 'x', p_birth_year: null, p_school: null, p_region: null, p_centre_id: null }),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  check(reg.body?.code !== 'PGRST202', 'fonction d\'inscription comima.register présente', 'SQL Editor : exécuter la migration');
  check(reg.status >= 400, 'inscription refusée sans connexion', 'URGENT : register accepte les appels anonymes');
}

const ok = results.every(Boolean);
console.log(ok ? '\n✓ Le serveur est prêt pour l\'application COMIMa.' : '\n✗ Le serveur n\'est pas encore prêt (voir ci-dessus).');
process.exit(ok ? 0 : 1);
