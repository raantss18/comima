// Client minimal de l'API Supabase pour le site (équivalent de app/lib/core/cloud.dart) :
// quelques requêtes `fetch`, pas de bibliothèque. L'URL et la clé « anon » (publiques) viennent
// de la page (voir AccountPanel.astro). Schéma COMIMa : `comima` (supabase/README.md).

export interface CloudCfg {
  url: string;
  key: string;
}

export interface Session {
  access: string;
  refresh: string;
  /** Expiration de l'accès, en secondes depuis 1970. */
  exp: number;
  userId: string;
  email?: string;
}

export interface Status {
  reachable: boolean;
  email: boolean;
  google: boolean;
  facebook: boolean;
  schemaReady: boolean;
  ready: boolean;
}

export class CloudError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
  get unauthorized() {
    return this.status === 401 || this.status === 403;
  }
  get invalidLogin() {
    return this.code === 'invalid_credentials' || /invalid login/i.test(this.message);
  }
  get notConfirmed() {
    return this.code === 'email_not_confirmed' || /not confirmed/i.test(this.message);
  }
  get emailDisabled() {
    return this.code === 'email_provider_disabled' || /email logins are disabled/i.test(this.message);
  }
  get exists() {
    return this.code === 'user_already_exists' || /already registered/i.test(this.message);
  }
}

const SCHEMA = 'comima';
const b64url = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Connexion PKCE : le secret reste dans ce navigateur, seule son empreinte part au serveur. */
export async function newPkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  return { verifier, challenge };
}

export class Cloud {
  private cfg: CloudCfg;
  constructor(cfg: CloudCfg) {
    this.cfg = cfg;
  }

  private headers(token?: string, schema = false, extra: Record<string, string> = {}): Record<string, string> {
    return {
      apikey: this.cfg.key,
      Authorization: `Bearer ${token ?? this.cfg.key}`,
      'Content-Type': 'application/json',
      ...(schema ? { 'Content-Profile': SCHEMA, 'Accept-Profile': SCHEMA } : {}),
      ...extra,
    };
  }

  private async call(path: string, init: RequestInit & { query?: Record<string, string> } = {}): Promise<any> {
    const u = new URL(this.cfg.url + path);
    for (const [k, v] of Object.entries(init.query ?? {})) u.searchParams.set(k, v);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 25000); // jamais bloqué sur une connexion qui s'arrête
    try {
      const r = await fetch(u, { ...init, signal: ctl.signal });
      const text = await r.text();
      const body = text ? JSON.parse(text) : null;
      if (r.ok) return body;
      throw new CloudError(r.status, String(body?.error_description ?? body?.msg ?? body?.message ?? `Erreur ${r.status}`), body?.error_code ?? body?.code);
    } finally {
      clearTimeout(timer);
    }
  }

  static session(t: any): Session {
    const now = Math.floor(Date.now() / 1000);
    const sub = (jwt: string) => JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub as string;
    return {
      access: t.access_token,
      refresh: t.refresh_token,
      exp: t.expires_at ?? now + (t.expires_in ?? 3600),
      userId: t.user?.id ?? sub(t.access_token),
      email: t.user?.email,
    };
  }

  // ---------------------------------------------------------------- état du serveur

  async status(): Promise<Status> {
    const none: Status = { reachable: false, email: false, google: false, facebook: false, schemaReady: false, ready: false };
    try {
      const s = await this.call('/auth/v1/settings', { headers: this.headers() });
      const ext = s?.external ?? {};
      let code: string | undefined;
      try {
        await this.call('/rest/v1/centres', { headers: this.headers(undefined, true), query: { limit: '1' } });
      } catch (e) {
        code = e instanceof CloudError ? e.code : undefined;
      }
      const schemaReady = !['PGRST106', 'PGRST205', '3F000'].includes(code ?? '');
      const st = { reachable: true, email: ext.email === true, google: ext.google === true, facebook: ext.facebook === true, schemaReady };
      return { ...st, ready: schemaReady && (st.email || st.google || st.facebook) };
    } catch {
      return none;
    }
  }

  // ---------------------------------------------------------------- connexion

  async signUp(email: string, password: string, redirect: string, displayName?: string): Promise<Session | null> {
    const b = await this.call('/auth/v1/signup', {
      method: 'POST',
      headers: this.headers(),
      query: { redirect_to: redirect },
      body: JSON.stringify({ email, password, data: { ...(displayName ? { display_name: displayName } : {}), app: 'comima' } }),
    });
    return b?.access_token ? Cloud.session(b) : null;
  }

  async signIn(email: string, password: string): Promise<Session> {
    return Cloud.session(
      await this.call('/auth/v1/token', { method: 'POST', headers: this.headers(), query: { grant_type: 'password' }, body: JSON.stringify({ email, password }) }),
    );
  }

  async recover(email: string, redirect: string): Promise<void> {
    await this.call('/auth/v1/recover', { method: 'POST', headers: this.headers(), query: { redirect_to: redirect }, body: JSON.stringify({ email }) });
  }

  oauthUrl(provider: string, redirect: string, challenge: string): string {
    const u = new URL(this.cfg.url + '/auth/v1/authorize');
    u.searchParams.set('provider', provider);
    u.searchParams.set('redirect_to', redirect);
    u.searchParams.set('code_challenge', challenge);
    u.searchParams.set('code_challenge_method', 's256');
    return u.toString();
  }

  async exchangeCode(code: string, verifier: string): Promise<Session> {
    return Cloud.session(
      await this.call('/auth/v1/token', { method: 'POST', headers: this.headers(), query: { grant_type: 'pkce' }, body: JSON.stringify({ auth_code: code, code_verifier: verifier }) }),
    );
  }

  /** Lien de confirmation d'e-mail : les jetons arrivent dans le fragment de l'adresse. */
  async sessionFromTokens(access: string, refresh: string): Promise<Session> {
    const user = await this.call('/auth/v1/user', { headers: this.headers(access) });
    return Cloud.session({ access_token: access, refresh_token: refresh, user });
  }

  async refresh(s: Session): Promise<Session> {
    return Cloud.session(
      await this.call('/auth/v1/token', { method: 'POST', headers: this.headers(), query: { grant_type: 'refresh_token' }, body: JSON.stringify({ refresh_token: s.refresh }) }),
    );
  }

  async signOut(s: Session): Promise<void> {
    try {
      await this.call('/auth/v1/logout', { method: 'POST', headers: this.headers(s.access), query: { scope: 'local' } });
    } catch {
      /* hors ligne : la déconnexion locale suffit */
    }
  }

  // ---------------------------------------------------------------- données (schéma comima)

  async myProfile(s: Session): Promise<any | null> {
    const rows = await this.call('/rest/v1/profiles', { headers: this.headers(s.access, true), query: { id: `eq.${s.userId}`, select: '*' } });
    return rows?.[0] ?? null;
  }

  async register(s: Session, p: Profile): Promise<any> {
    return this.call('/rest/v1/rpc/register', {
      method: 'POST',
      headers: this.headers(s.access, true),
      body: JSON.stringify({
        p_display_name: p.name,
        p_birth_year: p.birthYear ?? null,
        p_school: p.school ?? null,
        p_region: p.region ?? null,
        p_centre_id: p.centre && p.centre !== 'aucun' ? p.centre : null,
        p_requested_role: p.role === 'encadreur' ? 'encadreur' : 'eleve',
      }),
    });
  }

  async pushAttempts(s: Session, rows: unknown[]): Promise<void> {
    if (!rows.length) return;
    await this.call('/rest/v1/attempts', {
      method: 'POST',
      headers: this.headers(s.access, true, { Prefer: 'resolution=ignore-duplicates,return=minimal' }),
      query: { on_conflict: 'id' },
      body: JSON.stringify(rows),
    });
  }

  async pullAttempts(s: Session, page = 1000): Promise<any[]> {
    const out: any[] = [];
    for (let from = 0; ; from += page) {
      const rows: any[] = await this.call('/rest/v1/attempts', {
        headers: this.headers(s.access, true, { 'Range-Unit': 'items', Range: `${from}-${from + page - 1}` }),
        query: { user_id: `eq.${s.userId}`, select: 'id,question_id,notion_id,theme,qtype,difficulty,ok,duration_ms,answered_at', order: 'answered_at.asc' },
      });
      out.push(...rows);
      if (rows.length < page) return out;
    }
  }

  async deleteMyProfile(s: Session): Promise<void> {
    await this.call('/rest/v1/profiles', { method: 'DELETE', headers: this.headers(s.access, true), query: { id: `eq.${s.userId}` } });
  }
}

export interface Profile {
  name: string;
  role: 'eleve' | 'encadreur';
  birthYear?: number | null;
  school?: string;
  region?: string;
  centre?: string;
}
