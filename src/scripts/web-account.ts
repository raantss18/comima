// Panneau « compte » (page Espace personnel, et rappel discret sur les pages Entraînement) : connexion (Google, Facebook, e-mail),
// profil, synchronisation avec l'application. Facultatif : sans compte, tout reste dans ce
// navigateur. Les modes de connexion affichés sont ceux réellement activés sur le serveur.
import { Cloud, CloudError, newPkce, type Profile, type Session, type Status } from './web-cloud.ts';
import * as store from './web-store.ts';
import { adoptSession, currentSession, runSync } from './web-sync.ts';

const TXT = {
  fr: {
    summary: (a: number, g: number) => `${a} réponse${a > 1 ? 's' : ''} · ${a ? Math.round((100 * g) / a) : 0} % de réussite`,
    none: 'Pas encore de réponse : choisis une notion pour commencer.',
    sync: 'Synchroniser avec l’application',
    space: 'Espace personnel : ma progression et mon compte',
    signin: 'Se connecter',
    signup: 'Créer un compte',
    why: 'Un compte est facultatif. Il relie ce site à l’application COMIMa : ta progression te suit d’un appareil à l’autre, et ton encadreur peut t’accompagner.',
    google: 'Continuer avec Google',
    facebook: 'Continuer avec Facebook',
    email: 'Adresse e-mail',
    password: 'Mot de passe (6 caractères au moins)',
    forgot: 'Mot de passe oublié ?',
    soon: 'Les comptes ouvrent très bientôt. En attendant, ta progression reste dans ce navigateur.',
    privacy: 'Envoyé au serveur : ton profil (prénom, année de naissance, établissement, région, centre) et tes réponses. Jamais publié.',
    connected: 'Connecté',
    lastSync: 'Dernière synchronisation',
    never: 'pas encore synchronisé',
    toSend: 'réponses à envoyer',
    syncNow: 'Synchroniser maintenant',
    syncing: 'Synchronisation…',
    signout: 'Se déconnecter',
    deleteOnline: 'Supprimer mes données en ligne',
    deleteConfirm: 'Ton profil et tes réponses seront effacés du serveur. Ta progression dans ce navigateur est conservée. Continuer ?',
    confirmLink: (email: string) => `Un lien de connexion vient d’être ouvert pour le compte « ${email} ». Si tu n’as pas demandé ce lien, annule : ta progression ne sera pas envoyée à ce compte. Se connecter à ce compte ?`,
    otherAccount: 'Ce navigateur contient la progression d’un autre compte. Pour continuer avec celui-ci, elle sera effacée de ce navigateur. Continuer ?',
    profileTitle: 'Ton profil',
    youAre: 'Tu es…',
    student: 'Élève',
    coach: 'Encadreur',
    roleFixed: 'Ce choix ne se change pas : on est élève ou encadreur. Le rôle d’encadreur est validé par le bureau.',
    name: 'Prénom ou pseudo',
    birth: 'Année de naissance',
    school: 'Établissement d’origine',
    region: 'Région',
    centre: 'Centre COMIMa',
    noCentre: 'Pas encore de centre',
    save: 'Enregistrer et synchroniser',
    cancel: 'Annuler',
    required: 'Remplis les champs obligatoires.',
    ok: 'Synchronisé.',
    msg: {
      bad_input: 'Entre une adresse e-mail valide et un mot de passe d’au moins 6 caractères.',
      bad_login: 'E-mail ou mot de passe incorrect.',
      not_confirmed: 'Confirme d’abord ton adresse e-mail (lien reçu par e-mail).',
      check_mail: 'Regarde tes e-mails (et les courriers indésirables), clique le lien, puis reviens te connecter.',
      exists: 'Cette adresse a déjà un compte : connecte-toi.',
      email_disabled: 'La connexion par e-mail n’est pas encore activée. Utilise Google ou Facebook.',
      login_failed: 'Connexion impossible. Réessaie dans un moment.',
      offline: 'Pas de connexion : réessaie quand tu auras du réseau.',
      sync_failed: 'La synchronisation a échoué. Tes données restent dans ce navigateur.',
      signed_out: 'Session expirée : reconnecte-toi.',
      deleted: 'Données en ligne supprimées.',
      cancelled: 'Connexion annulée.',
    } as Record<string, string>,
  },
  en: {
    summary: (a: number, g: number) => `${a} answer${a === 1 ? '' : 's'} · ${a ? Math.round((100 * g) / a) : 0} % success`,
    none: 'No answers yet: pick a topic to start.',
    sync: 'Sync with the app',
    space: 'Personal space: my progress and account',
    signin: 'Sign in',
    signup: 'Create account',
    why: 'An account is optional. It links this site to the COMIMa app: your progress follows you from one device to another, and your coach can follow you.',
    google: 'Continue with Google',
    facebook: 'Continue with Facebook',
    email: 'E-mail address',
    password: 'Password (at least 6 characters)',
    forgot: 'Forgot password?',
    soon: 'Accounts open very soon. Meanwhile your progress stays in this browser.',
    privacy: 'Sent to the server: your profile (name, year of birth, school, region, centre) and your answers. Never published.',
    connected: 'Signed in',
    lastSync: 'Last sync',
    never: 'not synced yet',
    toSend: 'answers to send',
    syncNow: 'Sync now',
    syncing: 'Syncing…',
    signout: 'Sign out',
    deleteOnline: 'Delete my online data',
    deleteConfirm: 'Your profile and answers will be erased from the server. Your progress in this browser is kept. Continue?',
    confirmLink: (email: string) => `A sign-in link was just opened for the account “${email}”. If you did not ask for this link, cancel: your progress will not be sent to that account. Sign in to this account?`,
    otherAccount: 'This browser holds another account’s progress. To continue with this one, it will be erased from this browser. Continue?',
    profileTitle: 'Your profile',
    youAre: 'You are…',
    student: 'Student',
    coach: 'Coach',
    roleFixed: 'This choice cannot be changed: you are a student or a coach. The coach role is approved by the board.',
    name: 'First name or nickname',
    birth: 'Year of birth',
    school: 'School',
    region: 'Region',
    centre: 'COMIMa centre',
    noCentre: 'No centre yet',
    save: 'Save and sync',
    cancel: 'Cancel',
    required: 'Fill in the required fields.',
    ok: 'Synced.',
    msg: {
      bad_input: 'Enter a valid e-mail and a password of at least 6 characters.',
      bad_login: 'Wrong e-mail or password.',
      not_confirmed: 'Confirm your e-mail address first (link sent by e-mail).',
      check_mail: 'Check your e-mail (and spam), click the link, then come back and sign in.',
      exists: 'This address already has an account: sign in.',
      email_disabled: 'E-mail sign-in is not enabled yet. Use Google or Facebook.',
      login_failed: 'Could not sign in. Try again in a moment.',
      offline: 'No connection: try again when you have network.',
      sync_failed: 'Sync failed. Your data stays in this browser.',
      signed_out: 'Session expired: sign in again.',
      deleted: 'Online data deleted.',
      cancelled: 'Sign-in cancelled.',
    } as Record<string, string>,
  },
};

const PKCE_KEY = 'comima-pkce';
/** Fin (ms) de la fenêtre où un lien de confirmation par e-mail est attendu : ouverte par une inscription ou une réinitialisation. */
const LINK_KEY = 'comima-link-until';
const expectLink = () => {
  try {
    localStorage.setItem(LINK_KEY, String(Date.now() + 48 * 3600 * 1000));
  } catch {
    /* stockage indisponible : le lien demandera alors une confirmation */
  }
};
const linkExpected = () => {
  try {
    return Number(localStorage.getItem(LINK_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
};
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function initAccount(): Promise<void> {
  const root = document.getElementById('acct');
  const cfgEl = document.getElementById('cloud-config');
  if (!root || !cfgEl) return;
  const cfg = JSON.parse(cfgEl.textContent ?? '{}') as { url: string; key: string; regions: string[]; centres: { id: string; nom: string }[] };
  const lang = (root.dataset.lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const T = TXT[lang];
  const cloud = new Cloud(cfg);
  let status: Status | null = null;
  let message = '';
  let busy = false;
  // Page Espace personnel : la connexion est tout de suite proposée. Ailleurs (mode compact) : un simple lien vers l'espace.
  const compact = root.dataset.compact === '1';
  const spaceHref = root.dataset.space ?? '';
  let open = root.dataset.open === '1';
  let mode: 'in' | 'up' = 'in';
  let askProfile = false;
  let timer: number | undefined;

  const here = () => location.origin + location.pathname;

  // ---------------------------------------------------------------- session et synchronisation

  const session = () => currentSession(cloud);
  const adopt = (s: Session) => {
    const ok = adoptSession(s, () => confirm(T.otherAccount));
    if (!ok) void cloud.signOut(s); // refus : la session ouverte est refermée
    return ok;
  };
  const run = () => runSync(cloud);

  async function syncNow(quiet = false) {
    if (busy) return;
    busy = true;
    if (!quiet) render();
    const r = await run();
    busy = false;
    if (r === 'need-profile') askProfile = true;
    else if (!quiet || r !== 'ok') message = r === 'ok' ? 'ok' : r === 'signed-out' ? 'signed_out' : r === 'failed' ? 'sync_failed' : 'offline';
    render();
    window.dispatchEvent(new Event('comima:synced'));
  }

  // ---------------------------------------------------------------- retour de connexion

  async function handleReturn() {
    const q = new URLSearchParams(location.search);
    const frag = new URLSearchParams(location.hash.replace(/^#/, ''));
    let s: Session | null = null;
    try {
      if (q.get('code') && sessionStorage.getItem(PKCE_KEY)) {
        s = await cloud.exchangeCode(q.get('code')!, sessionStorage.getItem(PKCE_KEY)!);
      } else if (frag.get('access_token') && frag.get('refresh_token')) {
        s = await cloud.sessionFromTokens(frag.get('access_token')!, frag.get('refresh_token')!);
        // Lien reçu sans inscription ni réinitialisation demandée depuis ce navigateur (ouvert sur un autre
        // appareil, ou lien piégé) : on montre le compte et on demande confirmation avant de s'y connecter.
        if (s && !linkExpected() && !confirm(T.confirmLink(s.email ?? '?'))) s = null;
      } else if (q.get('error_description') || frag.get('error_description')) {
        message = 'cancelled';
      } else return;
    } catch {
      message = 'login_failed';
    }
    try {
      sessionStorage.removeItem(PKCE_KEY);
    } catch {
      /* stockage indisponible */
    }
    history.replaceState(null, '', location.pathname);
    if (s && adopt(s)) {
      open = true;
      await syncNow(true);
    }
  }

  // ---------------------------------------------------------------- interface

  function render() {
    const l = store.load();
    const { answers, good } = store.totals();
    const line = answers ? T.summary(answers, good) : T.none;
    let body = '';
    if (!status || !status.ready) {
      body = status ? `<p class="muted small">${T.soon}</p>` : '';
    } else if (l.auth) {
      const last = l.auth.lastSync ? new Date(l.auth.lastSync).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) : T.never;
      const unsent = store.unsynced(100000).length;
      body = `<p><strong>☁ ${T.connected}</strong> · ${esc(l.auth.email ?? '')}<br><span class="muted small">${T.lastSync} : ${esc(last)}${unsent ? ` · ${unsent} ${T.toSend}` : ''}</span></p>
        <div class="acct-actions"><button class="btn btn-primary btn-sm" data-act="sync" ${busy ? 'disabled' : ''}>${busy ? T.syncing : T.syncNow}</button>
        <button class="btn btn-outline btn-sm" data-act="out">${T.signout}</button>
        <button class="btn btn-outline btn-sm acct-danger" data-act="del">${T.deleteOnline}</button></div>`;
    } else if (compact) {
      body = `<a class="btn btn-outline btn-sm" href="${esc(spaceHref)}">☁ ${T.space}</a>`;
    } else if (!open) {
      body = `<button class="btn btn-outline btn-sm" data-act="open">☁ ${T.sync}</button>`;
    } else {
      body = `<p class="muted small">${T.why}</p><div class="acct-actions">
        ${status.google ? `<button class="btn btn-outline" data-act="oauth" data-p="google">${T.google}</button>` : ''}
        ${status.facebook ? `<button class="btn btn-outline" data-act="oauth" data-p="facebook">${T.facebook}</button>` : ''}</div>
        ${
          status.email
            ? `<div class="acct-tabs" role="tablist"><button class="btn btn-sm ${mode === 'in' ? 'btn-primary' : 'btn-outline'}" data-act="mode" data-m="in">${T.signin}</button>
        <button class="btn btn-sm ${mode === 'up' ? 'btn-primary' : 'btn-outline'}" data-act="mode" data-m="up">${T.signup}</button></div>
        <form class="acct-form" data-form="auth"><input type="email" name="email" autocomplete="email" placeholder="${T.email}" required>
        <input type="password" name="password" autocomplete="${mode === 'up' ? 'new-password' : 'current-password'}" placeholder="${T.password}" minlength="6" required>
        <button class="btn btn-primary" ${busy ? 'disabled' : ''}>${mode === 'up' ? T.signup : T.signin}</button>
        ${mode === 'in' ? `<button type="button" class="btn-link" data-act="forgot">${T.forgot}</button>` : ''}</form>`
            : ''
        }<p class="muted small">${T.privacy}</p>`;
    }
    if (askProfile && l.auth) body = profileForm();
    const msg = message ? `<p class="acct-msg ${message === 'ok' || message === 'check_mail' || message === 'deleted' ? 'ok' : 'ko'}" role="status">${message === 'ok' ? T.ok : T.msg[message] ?? esc(message)}</p>` : '';
    root!.innerHTML = `${compact ? `<p class="acct-line">${line}</p>` : ''}${body}${msg}`;
  }

  function profileForm(): string {
    const p = store.load().profile;
    const year = new Date().getFullYear();
    const years = Array.from({ length: 18 }, (_, i) => year - 8 - i).map((y) => `<option value="${y}" ${p?.birthYear === y ? 'selected' : ''}>${y}</option>`).join('');
    const regions = cfg.regions.map((r) => `<option ${p?.region === r ? 'selected' : ''}>${esc(r)}</option>`).join('');
    const centres = cfg.centres.map((c) => `<option value="${c.id}" ${p?.centre === c.id ? 'selected' : ''}>${esc(c.nom)}</option>`).join('');
    return `<form class="acct-form" data-form="profile"><h3>${T.profileTitle}</h3>
      <fieldset class="acct-roles"><legend>${T.youAre}</legend>
        <label><input type="radio" name="role" value="eleve" ${p?.role !== 'encadreur' ? 'checked' : ''}> ${T.student}</label>
        <label><input type="radio" name="role" value="encadreur" ${p?.role === 'encadreur' ? 'checked' : ''}> ${T.coach}</label></fieldset>
      <p class="muted small">${T.roleFixed}</p>
      <input name="name" maxlength="30" placeholder="${T.name}" value="${esc(p?.name)}" required>
      <select name="birth"><option value="">${T.birth}</option>${years}</select>
      <input name="school" maxlength="80" placeholder="${T.school}" value="${esc(p?.school)}">
      <select name="region" required><option value="">${T.region}</option>${regions}</select>
      <select name="centre" required><option value="">${T.centre}</option>${centres}<option value="aucun" ${p?.centre === 'aucun' ? 'selected' : ''}>${T.noCentre}</option></select>
      <div class="acct-actions"><button class="btn btn-primary">${T.save}</button><button type="button" class="btn btn-outline" data-act="cancel-profile">${T.cancel}</button></div></form>`;
  }

  // ---------------------------------------------------------------- actions

  root.addEventListener('click', async (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    message = '';
    switch (el.dataset.act) {
      case 'open':
        open = true;
        return render();
      case 'mode':
        mode = el.dataset.m === 'up' ? 'up' : 'in';
        return render();
      case 'oauth': {
        const pk = await newPkce();
        try {
          sessionStorage.setItem(PKCE_KEY, pk.verifier);
        } catch {
          // Sans stockage de session, le retour de la connexion ne pourrait pas être vérifié.
          message = 'login_failed';
          return render();
        }
        location.href = cloud.oauthUrl(el.dataset.p!, here(), pk.challenge);
        return;
      }
      case 'sync':
        return void syncNow();
      case 'out': {
        const s = await session().catch(() => null);
        if (s) await cloud.signOut(s);
        const l = store.load();
        delete l.auth;
        store.save(l);
        open = false;
        return render();
      }
      case 'del': {
        if (!confirm(T.deleteConfirm)) return;
        try {
          const s = await session();
          if (s) await cloud.deleteMyProfile(s);
          const l = store.load();
          delete l.auth;
          delete l.accountId;
          for (const e of l.log) e.s = false;
          store.save(l);
          message = 'deleted';
        } catch {
          message = 'offline';
        }
        return render();
      }
      case 'forgot': {
        const email = (root.querySelector<HTMLInputElement>('input[name=email]')?.value ?? '').trim();
        if (!email.includes('@')) message = 'bad_input';
        else
          try {
            await cloud.recover(email, here());
            expectLink();
            message = 'check_mail';
          } catch {
            message = 'offline';
          }
        return render();
      }
      case 'cancel-profile':
        askProfile = false;
        return render();
    }
  });

  root.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const f = new FormData(form);
    message = '';
    if (form.dataset.form === 'profile') {
      const name = String(f.get('name') ?? '').trim();
      const role = f.get('role') === 'encadreur' ? 'encadreur' : 'eleve';
      if (!name || !f.get('region') || !f.get('centre') || (role === 'eleve' && !f.get('birth'))) {
        message = T.required;
        return render();
      }
      const l = store.load();
      l.profile = { name, role, birthYear: role === 'eleve' ? Number(f.get('birth')) : null, school: String(f.get('school') ?? ''), region: String(f.get('region')), centre: String(f.get('centre')) } as Profile;
      l.dirty = true;
      store.save(l);
      askProfile = false;
      return void syncNow();
    }
    // Connexion / inscription par e-mail
    const email = String(f.get('email') ?? '').trim();
    const password = String(f.get('password') ?? '');
    if (!email.includes('@') || password.length < 6) {
      message = 'bad_input';
      return render();
    }
    busy = true;
    render();
    try {
      const s = mode === 'up' ? await cloud.signUp(email, password, here(), store.load().profile?.name) : await cloud.signIn(email, password);
      busy = false;
      if (!s) {
        expectLink();
        message = 'check_mail';
        return render();
      }
      if (adopt(s)) return void syncNow(true);
      render();
    } catch (e) {
      busy = false;
      const c = e instanceof CloudError ? e : null;
      message = !c ? 'offline' : c.emailDisabled ? 'email_disabled' : c.notConfirmed ? 'not_confirmed' : c.invalidLogin ? 'bad_login' : c.exists ? 'exists' : 'login_failed';
      render();
    }
  });

  // Envoi discret après une série de réponses (regroupe les appels rapprochés).
  window.addEventListener('comima:answered', () => {
    if (!store.load().auth) return;
    clearTimeout(timer);
    timer = window.setTimeout(() => void syncNow(true), 20000);
  });

  render();
  status = await cloud.status();
  render();
  await handleReturn();
  if (store.load().auth) void syncNow(true);
}
