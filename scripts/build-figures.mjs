/**
 * Génère des SVG à partir des figures TikZ des énoncés, pour les afficher
 * directement sur le site (l'aperçu web ne compile pas TikZ).
 *
 * Chaque bloc \begin{tikzpicture}…\end{tikzpicture} d'un énoncé concerné est
 * compilé isolément (classe standalone) en PDF puis converti en SVG vectoriel
 * (dvisvgm). Sortie : public/figures/<id>/enonce-<N>.svg (commitée au dépôt).
 *
 * build-index.mjs remplace ensuite le N-ième tikzpicture de l'énoncé par un
 * marqueur \FIGURE{…} pointant vers le SVG (si présent) ; sinon l'aperçu
 * garde la note « voir le PDF ».
 *
 * Relancer ce script après avoir ajouté/modifié une figure d'énoncé :
 *   node scripts/build-figures.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Énoncés contenant des figures TikZ (les seules affichées sur le site).
const TARGETS = ['om-national-2025-ex1', 'om-national-2026-ex1', 'om-national-2026-ex3'];

// Compilation en DVI (latex) puis conversion vectorielle croppée (dvisvgm
// --bbox=min) : recadre automatiquement sur la figure. standalone.cls n'est
// pas nécessaire (absent de cette distribution TeX Live).
const PREAMBLE = String.raw`\documentclass{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage{amsmath,amssymb}
\usepackage{tikz}
\usepackage{tikz-3dplot}
\usetikzlibrary{shadows.blur,patterns,calc,decorations.pathmorphing}
\definecolor{comimagreen}{HTML}{1D7A33}
\definecolor{comimared}{HTML}{D6362B}
\thispagestyle{empty}
\begin{document}
`;

function extractTikz(tex) {
  // Inclut une éventuelle ligne \tdplotsetmaincoords{..}{..} juste avant le
  // tikzpicture (nécessaire aux figures 3D avec tikz-3dplot).
  return (
    tex.match(
      /(?:\\tdplotsetmaincoords\{[^}]*\}\{[^}]*\}\s*)?\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g
    ) ?? []
  );
}

let total = 0;
for (const id of TARGETS) {
  const enoncePath = path.join(ROOT, 'content', 'exercices', id, 'enonce.tex');
  if (!fs.existsSync(enoncePath)) {
    console.warn(`⚠ ${id} : enonce.tex introuvable, ignoré.`);
    continue;
  }
  const blocks = extractTikz(fs.readFileSync(enoncePath, 'utf8'));
  const outDir = path.join(ROOT, 'public', 'figures', id);
  fs.mkdirSync(outDir, { recursive: true });

  blocks.forEach((block, i) => {
    const n = i + 1;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `comima-fig-${id}-${n}-`));
    const texFile = path.join(tmp, 'fig.tex');
    fs.writeFileSync(texFile, `${PREAMBLE}${block}\n\\end{document}\n`);
    try {
      execFileSync('latex', ['-interaction=nonstopmode', '-halt-on-error', 'fig.tex'], {
        cwd: tmp,
        stdio: 'pipe',
      });
      execFileSync('dvisvgm', ['--bbox=min', '--optimize', '--no-fonts', 'fig.dvi', '-o', 'fig.svg'], {
        cwd: tmp,
        stdio: 'pipe',
      });
      const out = path.join(outDir, `enonce-${n}.svg`);
      fs.copyFileSync(path.join(tmp, 'fig.svg'), out);
      total++;
      console.log(`✔ ${id} enonce-${n}.svg`);
    } catch (err) {
      const log = err?.stdout?.toString?.() || err?.message || String(err);
      console.error(`✘ ${id} figure ${n} : échec de compilation\n${log.slice(-800)}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
}
console.log(`\n${total} figure(s) SVG générée(s).`);
