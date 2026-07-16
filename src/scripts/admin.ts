/**
 * Panneau admin sans backend : commits directs sur la branche configurée via
 * l'API GitHub (Octokit). Le token n'est stocké qu'en localStorage et n'est
 * envoyé qu'à api.github.com.
 *
 * Choix documenté (README) : commit direct sur `main` — chaque publication
 * déclenche le pipeline (LaTeX + build + déploiement). Pour un flux avec
 * relecture, remplacer `branch` par une branche de travail et ouvrir une PR.
 */
import { Octokit } from 'octokit';

const CFG_KEY = 'comima-admin-cfg';

interface Cfg {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

function $(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function status(id: string, msg: string, ok = true) {
  const elt = document.getElementById(id)!;
  elt.textContent = msg;
  (elt as HTMLElement).style.color = ok ? 'var(--c-primary)' : 'var(--c-accent)';
}

function loadCfg(): Cfg | null {
  try {
    return JSON.parse(localStorage.getItem(CFG_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function currentCfg(): Cfg {
  return {
    owner: $('adm-owner').value.trim(),
    repo: $('adm-repo').value.trim(),
    branch: $('adm-branch').value.trim() || 'main',
    token: $('adm-token').value.trim(),
  };
}

function octo(cfg: Cfg): Octokit {
  return new Octokit({ auth: cfg.token });
}

/** Crée ou met à jour un fichier (base64) via l'API Contents. */
async function putFile(
  cfg: Cfg,
  path: string,
  contentB64: string,
  message: string
): Promise<void> {
  const kit = octo(cfg);
  let sha: string | undefined;
  try {
    const { data } = await kit.rest.repos.getContent({
      owner: cfg.owner,
      repo: cfg.repo,
      path,
      ref: cfg.branch,
    });
    if (!Array.isArray(data) && data.type === 'file') sha = data.sha;
  } catch {
    // 404 → nouveau fichier.
  }
  await kit.rest.repos.createOrUpdateFileContents({
    owner: cfg.owner,
    repo: cfg.repo,
    path,
    message,
    content: contentB64,
    branch: cfg.branch,
    sha,
  });
}

function b64(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function yamlStr(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function initAdmin(): void {
  // — Restauration de la config —
  const saved = loadCfg();
  if (saved) {
    $('adm-owner').value = saved.owner;
    $('adm-repo').value = saved.repo;
    $('adm-branch').value = saved.branch;
    $('adm-token').value = saved.token;
    status('adm-status', 'Configuration restaurée (jeton en localStorage).');
  }

  $('art-date').value = new Date().toISOString().slice(0, 10);

  // — Connexion —
  document.getElementById('adm-connect')!.addEventListener('click', async () => {
    const cfg = currentCfg();
    if (!cfg.token) return status('adm-status', 'Collez un token.', false);
    status('adm-status', 'Vérification…');
    try {
      const kit = octo(cfg);
      const { data: me } = await kit.rest.users.getAuthenticated();
      await kit.rest.repos.get({ owner: cfg.owner, repo: cfg.repo });
      localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
      status('adm-status', `Connecté en tant que ${me.login} ✓ — jeton mémorisé.`);
    } catch (e) {
      status('adm-status', `Échec : ${(e as Error).message}`, false);
    }
  });

  document.getElementById('adm-forget')!.addEventListener('click', () => {
    localStorage.removeItem(CFG_KEY);
    $('adm-token').value = '';
    status('adm-status', 'Jeton oublié.');
  });

  // — Slug automatique —
  $('art-titre').addEventListener('input', () => {
    $('art-slug').value = slugify($('art-titre').value);
  });

  // — Publication article/événement —
  document.getElementById('art-publish')!.addEventListener('click', async () => {
    const cfg = currentCfg();
    const titre = $('art-titre').value.trim();
    const slug = slugify($('art-slug').value.trim() || titre);
    const lang = $('art-lang').value;
    const type = $('art-type').value;
    if (!titre || !slug) return status('art-status', 'Titre et slug requis.', false);
    if (!cfg.token) return status('art-status', 'Configurez le jeton (section 1).', false);

    const lines = [
      '---',
      `titre: ${yamlStr(titre)}`,
      `type: ${type}`,
      `date: ${$('art-date').value}`,
    ];
    if ($('art-datefin').value) lines.push(`dateFin: ${$('art-datefin').value}`);
    if ($('art-lieu').value.trim()) lines.push(`lieu: ${yamlStr($('art-lieu').value.trim())}`);
    if ($('art-delegation').value.trim())
      lines.push(`delegation: ${yamlStr($('art-delegation').value.trim())}`);
    lines.push(`lang: ${lang}`, `resume: ${yamlStr($('art-resume').value.trim())}`);
    const tags = $('art-tags')
      .value.split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length) lines.push(`tags: [${tags.join(', ')}]`);
    lines.push('---', '', $('art-corps').value.trim(), '');

    status('art-status', 'Commit en cours…');
    try {
      await putFile(
        cfg,
        `src/content/actualites/${lang}/${slug}.mdx`,
        b64(lines.join('\n')),
        `contenu: ${type} « ${titre} » (${lang}) via admin`
      );
      status('art-status', 'Publié ✓ — le site se redéploie (2-5 min).');
    } catch (e) {
      status('art-status', `Échec : ${(e as Error).message}`, false);
    }
  });

  // — Publication exercice —
  document.getElementById('exo-publish')!.addEventListener('click', async () => {
    const cfg = currentCfg();
    const id = slugify($('exo-id').value.trim());
    const titreFr = $('exo-titre-fr').value.trim();
    const enonce = ($('exo-enonce') as unknown as HTMLTextAreaElement).value.trim();
    if (!id || !titreFr || !enonce)
      return status('exo-status', 'Identifiant, titre FR et énoncé requis.', false);
    if (!cfg.token) return status('exo-status', 'Configurez le jeton (section 1).', false);

    const themes = $('exo-themes')
      .value.split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const tags = $('exo-tags')
      .value.split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const solution = ($('exo-solution') as unknown as HTMLTextAreaElement).value.trim();

    const meta = [
      `id: ${id}`,
      `titre_fr: ${yamlStr(titreFr)}`,
      `titre_en: ${yamlStr($('exo-titre-en').value.trim() || titreFr)}`,
      'theme:',
      ...themes.map((t) => `  - ${t}`),
      `niveau: ${$('exo-niveau').value}`,
      `difficulte: ${$('exo-difficulte').value}`,
      'source:',
      `  concours: ${yamlStr($('exo-concours').value.trim() || 'COMIMa')}`,
      ...($('exo-annee').value ? [`  annee: ${$('exo-annee').value}`] : []),
      ...($('exo-pays').value.trim() ? [`  pays: ${yamlStr($('exo-pays').value.trim())}`] : []),
      'langue: fr',
      ...(tags.length ? ['tags:', ...tags.map((t) => `  - ${t}`)] : ['tags: []']),
      `a_solution: ${solution ? 'true' : 'false'}`,
      '',
    ].join('\n');

    status('exo-status', 'Commits en cours…');
    try {
      const msg = `exercice: ${id} via admin`;
      await putFile(cfg, `content/exercices/${id}/meta.yaml`, b64(meta), msg);
      await putFile(cfg, `content/exercices/${id}/enonce.tex`, b64(enonce + '\n'), msg);
      if (solution) {
        await putFile(cfg, `content/exercices/${id}/solution.tex`, b64(solution + '\n'), msg);
      }
      status('exo-status', 'Publié ✓ — compilation LaTeX + déploiement en cours (CI).');
    } catch (e) {
      status('exo-status', `Échec : ${(e as Error).message}`, false);
    }
  });

  // — Upload média —
  document.getElementById('up-publish')!.addEventListener('click', async () => {
    const cfg = currentCfg();
    const input = $('up-file') as unknown as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return status('up-status', 'Choisissez un fichier.', false);
    if (!cfg.token) return status('up-status', 'Configurez le jeton (section 1).', false);
    if (file.size > 20 * 1024 * 1024)
      return status('up-status', 'Fichier > 20 Mo : trop gros pour l’API GitHub.', false);

    status('up-status', 'Téléversement…');
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = '';
      const chunk = 0x8000;
      for (let i = 0; i < buf.length; i += chunk) {
        bin += String.fromCharCode(...buf.subarray(i, i + chunk));
      }
      const name = slugify(file.name.replace(/\.[^.]+$/, '')) + file.name.match(/\.[^.]+$/)?.[0];
      await putFile(cfg, `public/uploads/${name}`, btoa(bin), `média: ${name} via admin`);
      status('up-status', `Téléversé ✓ — sera servi sous uploads/${name}`);
    } catch (e) {
      status('up-status', `Échec : ${(e as Error).message}`, false);
    }
  });
}
