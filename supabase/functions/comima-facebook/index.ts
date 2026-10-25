// Connexion avec l'application Facebook (Android) : l'application COMIMa obtient un jeton d'accès
// grâce au SDK Facebook (l'application Facebook s'ouvre, sans navigateur), puis l'envoie ici.
// Supabase n'accepte pas ce jeton directement sur Android (il n'accepte qu'un jeton OpenID, que
// Facebook ne donne que par la connexion web). Cette fonction :
//   1. vérifie auprès de Facebook que le jeton est valide ET émis pour l'application COMIMa
//      (sinon n'importe quel jeton d'une autre application serait accepté) ;
//   2. lit l'adresse e-mail du compte Facebook (vérifiée par Facebook) ;
//   3. crée un lien de connexion à usage unique pour cette adresse (comme « Continuer avec
//      Facebook » dans le navigateur, qui rattache aussi le compte par l'e-mail) et renvoie
//      seulement son empreinte : l'application l'échange contre une session (/auth/v1/verify).
// Aucune donnée n'est enregistrée par la fonction. GET → {"ok": true} : l'application vérifie
// ainsi que la fonction est déployée avant de proposer la connexion par l'application Facebook.
//
// Déploiement (Bureau) : supabase/README.md, section « Connexion avec l'application Facebook ».
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GRAPH = 'https://graph.facebook.com/v19.0';
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'GET') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const appId = Deno.env.get('FACEBOOK_APP_ID');
  const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
  if (!appId || !appSecret) return json({ error: 'not_configured' }, 503);

  let token: string | undefined;
  try {
    token = (await req.json())?.access_token;
  } catch {
    /* corps illisible */
  }
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) return json({ error: 'bad_request' }, 400);

  // 1. Jeton valide et émis pour NOTRE application Facebook.
  const debug = await fetch(
    `${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
  ).then((r) => r.json()).catch(() => null);
  const d = debug?.data;
  if (!d?.is_valid || String(d.app_id) !== appId) return json({ error: 'invalid_token' }, 401);

  // 2. Adresse e-mail du compte Facebook.
  const me = await fetch(`${GRAPH}/me?fields=id,name,email&access_token=${encodeURIComponent(token)}`)
    .then((r) => r.json())
    .catch(() => null);
  if (!me?.email || String(me.id) !== String(d.user_id)) return json({ error: 'no_email' }, 422);

  // 3. Lien de connexion à usage unique (crée le compte s'il n'existe pas encore).
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const meta = { display_name: me.name ?? undefined, app: 'comima', provider_hint: 'facebook' };
  const link = () => admin.auth.admin.generateLink({ type: 'magiclink', email: me.email, options: { data: meta } });
  let { data, error } = await link();
  if (error) {
    // Selon la version du serveur, un lien « magiclink » peut exiger un compte existant.
    await admin.auth.admin.createUser({ email: me.email, email_confirm: true, user_metadata: meta });
    ({ data, error } = await link());
  }
  const hash = data?.properties?.hashed_token;
  if (error || !hash) return json({ error: 'link_failed' }, 500);
  return json({ token_hash: hash, type: 'magiclink' });
});
