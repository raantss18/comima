/**
 * Illustrations interactives pour l'application : chaque figure du site (fiches de
 * l'Entraînement : src/scripts/fiche/<notion>.ts ; chapitres : src/scripts/cours/<chapitre>.ts)
 * est empaquetée avec son socle dans une page HTML autonome, sans réseau, affichée par
 * l'application dans une WebView.
 *
 *   node scripts/build-app-figures.mjs [dossier-de-sortie]     (défaut : app/assets/figures)
 *
 * Fichiers produits : fiche-<notion>.html, cours-<chapitre>.html et defi-<slug>.html (défis
 * interactifs : src/scripts/defis/<slug>.ts, consignes et source lues dans src/lib/defis.ts). Deux jetons sont remplacés
 * par l'application au chargement : %%COMIMA_LANG%% (fr | en) et %%COMIMA_THEME%% (light | dark).
 * La page signale sa hauteur au canal « Resize » pour que l'application ajuste la WebView. Les pages de
 * défis ont un troisième jeton, %%COMIMA_SOLVED%% (réussites du profil, JSON échappé), et signalent chaque
 * réussite au canal « Defis ».
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'app', 'assets', 'figures'));
const ROLLDOWN = path.join(ROOT, 'node_modules', '.bin', 'rolldown');
// Anciennes WebView Android (Chrome < 86, fréquentes sur les téléphones qui ne mettent plus à jour
// « Android System WebView ») : quelques fonctions récentes, utilisées par les figures du site,
// sont ajoutées si elles manquent. Sans effet sur les navigateurs récents.
const POLYFILL = `(function(){var E=Element.prototype;if(!E.replaceChildren)E.replaceChildren=function(){while(this.firstChild)this.removeChild(this.firstChild);if(arguments.length)this.append.apply(this,arguments)};if(!Array.prototype.at)Array.prototype.at=function(i){i=Math.trunc(i)||0;if(i<0)i+=this.length;return this[i]};if(!Object.hasOwn)Object.hasOwn=function(o,k){return Object.prototype.hasOwnProperty.call(o,k)};if(!String.prototype.replaceAll)String.prototype.replaceAll=function(a,b){return typeof a==='string'?this.split(a).join(b):this.replace(a,b)}})();`;
const CSS = fs.readFileSync(path.join(ROOT, 'scripts', 'app-figures.css'), 'utf8');

const kinds = [
  { prefix: 'fiche', dir: 'fiche', skip: ['core', 'index'] },
  { prefix: 'cours', dir: 'cours', skip: ['index'] },
];

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.rmSync(path.join(OUT, f));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'comima-figures-'));
let count = 0;

for (const { prefix, dir, skip } of kinds) {
  const srcDir = path.join(ROOT, 'src', 'scripts', dir);
  for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith('.ts'))) {
    const id = file.replace(/\.ts$/, '');
    if (skip.includes(id)) continue;
    const entry = path.join(tmp, `${prefix}-${id}.ts`);
    fs.writeFileSync(
      entry,
      `import { mountFig } from ${JSON.stringify(path.join(srcDir, '..', 'fiche', 'core.ts'))};
import { figure } from ${JSON.stringify(path.join(srcDir, file))};
const lang = (window as any).__COMIMA__&&(window as any).__COMIMA__.lang === 'en' ? 'en' : 'fr';
const host = document.getElementById('fig') as HTMLElement;
figure.draw(mountFig(host, lang, figure.size[0], figure.size[1], figure.label[lang]));
const report = () => (window as any).Resize && (window as any).Resize.postMessage(String(Math.ceil(document.body.offsetHeight)));
new ResizeObserver(report).observe(document.body);
report();
`,
    );
    const js = path.join(tmp, `${prefix}-${id}.js`);
    execFileSync(ROLLDOWN, [entry, '--file', js, '--format', 'iife', '--minify', '--target', 'es2019'], { stdio: 'pipe' });
    const code = fs.readFileSync(js, 'utf8').replace(/<\/script/gi, '<\\/script');
    fs.writeFileSync(
      path.join(OUT, `${prefix}-${id}.html`),
      `<!doctype html><html lang="%%COMIMA_LANG%%" data-theme="%%COMIMA_THEME%%"><head><meta charset="utf-8">` +
        // Aucune connexion réseau possible depuis une figure, même si son contenu était altéré.
        `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:">` +
        `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head>` +
        `<body><div id="fig"></div><script>window.__COMIMA__={lang:"%%COMIMA_LANG%%"};${POLYFILL}</script><script>${code}</script></body></html>`,
    );
    count++;
  }
}
// Défis interactifs : la page porte les consignes des deux langues (la langue affichée est
// choisie par la feuille de style) et la mention de la source CC BY-SA, sans lien.
const { defis } = await import(path.join(ROOT, 'src', 'lib', 'defis.ts'));
const globalCss = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'global.css'), 'utf8');
const MARQUE = '/* ---------- Défis interactifs';
if (!globalCss.includes(MARQUE)) throw new Error('src/styles/global.css : section des défis introuvable');
const DEFI_CSS = globalCss.slice(globalCss.indexOf(MARQUE));
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const defisDir = path.join(ROOT, 'src', 'scripts', 'defis');
for (const d of defis) {
  const entry = path.join(tmp, `defi-${d.slug}.ts`);
  fs.writeFileSync(
    entry,
    `import { buildDefi } from ${JSON.stringify(path.join(defisDir, 'core.ts'))};
import { defi } from ${JSON.stringify(path.join(defisDir, `${d.slug}.ts`))};
const lang = (window as any).__COMIMA__&&(window as any).__COMIMA__.lang === 'en' ? 'en' : 'fr';
const host = document.getElementById('defi') as HTMLElement;
buildDefi(defi, host, lang, ${JSON.stringify(d.slug)}, ${d.versions.length});
const report = () => (window as any).Resize && (window as any).Resize.postMessage(String(Math.ceil(document.body.offsetHeight)));
new ResizeObserver(report).observe(document.body);
report();
`,
  );
  const js = path.join(tmp, `defi-${d.slug}.js`);
  execFileSync(ROLLDOWN, [entry, '--file', js, '--format', 'iife', '--minify', '--target', 'es2019'], { stdio: 'pipe' });
  const code = fs.readFileSync(js, 'utf8').replace(/<\/script/gi, '<\\/script');
  const consignes = d.versions
    .map((v, i) =>
      ['fr', 'en']
        .map((l) => {
          const titre = d.versions.length > 1 ? `<p class="defi-version">Version ${'★'.repeat(i + 1)}</p>` : '';
          return `<div class="defi-consigne" data-l="${l}" data-defi-consigne="${i}"${i ? ' hidden' : ''}>${titre}${v.consigne[l]}</div>`;
        })
        .join(''),
    )
    .join('');
  const credit = {
    fr: `Adapté de la tâche « ${esc(d.source.titre)} » du Concours Castor ${d.source.annee} (${esc(d.source.auteurs)}), publiée par France-ioi sous licence CC BY-SA 3.0. Cette adaptation (consigne et code) est diffusée sous la même licence.`,
    en: `Adapted from the task “${esc(d.source.titre)}” of the ${d.source.annee} Castor contest (${esc(d.source.auteurs)}), published by France-ioi under the CC BY-SA 3.0 licence. This adaptation (instructions and code) is distributed under the same licence. English text: COMIMa translation.`,
  };
  fs.writeFileSync(
    path.join(OUT, `defi-${d.slug}.html`),
    `<!doctype html><html lang="%%COMIMA_LANG%%" data-theme="%%COMIMA_THEME%%"><head><meta charset="utf-8">` +
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}${DEFI_CSS}</style></head>` +
      `<body><section class="defi-consignes">${consignes}</section><div id="defi" class="defi-host"></div>` +
      `<p class="defi-source" data-l="fr">${credit.fr}</p><p class="defi-source" data-l="en">${credit.en}</p>` +
      `<script>window.__COMIMA__={lang:"%%COMIMA_LANG%%",solved:"%%COMIMA_SOLVED%%"};${POLYFILL}</script><script>${code}</script></body></html>`,
  );
  count++;
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${count} illustration(s) pour l'application → ${path.relative(ROOT, OUT) || '.'}`);
