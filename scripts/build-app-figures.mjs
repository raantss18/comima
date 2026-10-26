/**
 * Illustrations interactives pour l'application : chaque figure du site (fiches de
 * l'Entraînement : src/scripts/fiche/<notion>.ts ; chapitres : src/scripts/cours/<chapitre>.ts)
 * est empaquetée avec son socle dans une page HTML autonome, sans réseau, affichée par
 * l'application dans une WebView.
 *
 *   node scripts/build-app-figures.mjs [dossier-de-sortie]     (défaut : app/assets/figures)
 *
 * Fichiers produits : fiche-<notion>.html et cours-<chapitre>.html. Deux jetons sont remplacés
 * par l'application au chargement : %%COMIMA_LANG%% (fr | en) et %%COMIMA_THEME%% (light | dark).
 * La page signale sa hauteur au canal « Resize » pour que l'application ajuste la WebView.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'app', 'assets', 'figures'));
const ROLLDOWN = path.join(ROOT, 'node_modules', '.bin', 'rolldown');
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
const lang = (window as any).__COMIMA__?.lang === 'en' ? 'en' : 'fr';
const host = document.getElementById('fig') as HTMLElement;
figure.draw(mountFig(host, lang, figure.size[0], figure.size[1], figure.label[lang]));
const report = () => (window as any).Resize?.postMessage(String(Math.ceil(document.body.offsetHeight)));
new ResizeObserver(report).observe(document.body);
report();
`,
    );
    const js = path.join(tmp, `${prefix}-${id}.js`);
    execFileSync(ROLLDOWN, [entry, '--file', js, '--format', 'iife', '--minify'], { stdio: 'pipe' });
    const code = fs.readFileSync(js, 'utf8').replace(/<\/script/gi, '<\\/script');
    fs.writeFileSync(
      path.join(OUT, `${prefix}-${id}.html`),
      `<!doctype html><html lang="%%COMIMA_LANG%%" data-theme="%%COMIMA_THEME%%"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head>` +
        `<body><div id="fig"></div><script>window.__COMIMA__={lang:"%%COMIMA_LANG%%"};</script><script>${code}</script></body></html>`,
    );
    count++;
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${count} illustration(s) pour l'application → ${path.relative(ROOT, OUT) || '.'}`);
