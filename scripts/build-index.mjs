// Génère public/data/exercices-index.json et public/data/sujets-index.json
// à partir des meta.yaml + fragments .tex de content/.
// Consommé par : les pages Astro (au build) et le générateur de sujets (client).
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import {
  ROOT,
  loadExercices,
  loadSujets,
  loadCours,
  sourceLabel,
  COURS_PREAMBLE_PATH,
} from './content-lib.mjs';

const OUT_DIR = path.join(ROOT, 'public', 'data');

const THEMES_VALIDES = [
  'algèbre',
  'géométrie',
  'arithmétique',
  'combinatoire',
  'analyse',
  'informatique',
];
const NIVEAUX_VALIDES = ['collège', 'lycée', 'prépa', 'recherche'];

function stripTexComments(tex) {
  // Retire les commentaires LaTeX (% non échappé) pour alléger l'index.
  return tex
    .split('\n')
    .map((line) => {
      let out = '';
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '%' && line[i - 1] !== '\\') break;
        out += line[i];
      }
      return out.trimEnd();
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Remplace chaque figure TikZ de l'énoncé par un marqueur \FIGURE{…} pointant
// vers le SVG pré-généré (public/figures/<id>/enonce-N.svg) s'il existe. Sinon
// le bloc est laissé tel quel (l'aperçu affichera « voir le PDF »).
const FIG_RE =
  /(?:\\tdplotsetmaincoords\{[^}]*\}\{[^}]*\}\s*)?\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g;

function injectFigures(tex, id) {
  let i = 0;
  return tex.replace(FIG_RE, (block) => {
    i += 1;
    const rel = `figures/${id}/enonce-${i}.svg`;
    return fs.existsSync(path.join(ROOT, 'public', rel)) ? `\\FIGURE{${rel}}` : block;
  });
}

function validateExo(meta) {
  const errs = [];
  if (!meta.titre_fr) errs.push('titre_fr manquant');
  for (const t of meta.theme ?? []) {
    if (!THEMES_VALIDES.includes(t)) errs.push(`thème inconnu "${t}"`);
  }
  if (meta.niveau && !NIVEAUX_VALIDES.includes(meta.niveau)) {
    errs.push(`niveau inconnu "${meta.niveau}"`);
  }
  const d = Number(meta.difficulte);
  if (!(d >= 1 && d <= 5)) errs.push(`difficulte doit être entre 1 et 5 (reçu ${meta.difficulte})`);
  if (errs.length) throw new Error(`meta.yaml invalide pour "${meta.id}" : ${errs.join(', ')}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const exercices = loadExercices().map(({ meta, enoncePath, enoncePathEn, solutionPath }) => {
    validateExo(meta);
    const bilingue = enoncePathEn !== enoncePath;
    return {
      id: meta.id,
      titre_fr: meta.titre_fr,
      titre_en: meta.titre_en ?? meta.titre_fr,
      theme: meta.theme ?? [],
      niveau: meta.niveau ?? 'lycée',
      difficulte: Number(meta.difficulte),
      source: meta.source ?? {},
      sourceLabel: sourceLabel(meta),
      langue: meta.langue ?? 'fr',
      tags: meta.tags ?? [],
      a_solution: Boolean(solutionPath) && meta.a_solution !== false,
      enonceTex: injectFigures(stripTexComments(fs.readFileSync(enoncePath, 'utf8')), meta.id),
      enonceTexEn: injectFigures(
        stripTexComments(fs.readFileSync(enoncePathEn, 'utf8')),
        meta.id
      ),
      // Chemins relatifs à la racine du site (préfixer par BASE_URL côté client)
      pdf: `pdfs/exercices/${meta.id}/enonce.pdf`,
      pdfEn: bilingue ? `pdfs/exercices/${meta.id}/enonce-en.pdf` : `pdfs/exercices/${meta.id}/enonce.pdf`,
      pdfSolution: solutionPath ? `pdfs/exercices/${meta.id}/solution.pdf` : null,
      tex: `sources/exercices/${meta.id}/enonce.tex`,
      texEn: bilingue
        ? `sources/exercices/${meta.id}/enonce-en.tex`
        : `sources/exercices/${meta.id}/enonce.tex`,
      texSolution: solutionPath ? `sources/exercices/${meta.id}/solution.tex` : null,
    };
  });

  const sujets = loadSujets().map(
    ({ meta, epreuvePath, epreuvePdfPath, solutionPath, solutionPdfPath, bundlePath }) => {
      // PDF pré-fourni : copié tel quel vers public/pdfs/ (comme les cours).
      if (epreuvePdfPath) {
        const out = path.join(ROOT, 'public', 'pdfs', 'sujets', meta.id);
        fs.mkdirSync(out, { recursive: true });
        fs.copyFileSync(epreuvePdfPath, path.join(out, 'epreuve.pdf'));
        if (solutionPdfPath) fs.copyFileSync(solutionPdfPath, path.join(out, 'solution.pdf'));
      }
      return {
        id: meta.id,
        titre_fr: meta.titre_fr,
        titre_en: meta.titre_en ?? meta.titre_fr,
        source: meta.source ?? {},
        sourceLabel: sourceLabel(meta),
        langue: meta.langue ?? 'fr',
        tags: meta.tags ?? [],
        description_fr: meta.description_fr ?? '',
        description_en: meta.description_en ?? meta.description_fr ?? '',
        epreuveTex: epreuvePath ? stripTexComments(fs.readFileSync(epreuvePath, 'utf8')) : '',
        pdf: `pdfs/sujets/${meta.id}/epreuve.pdf`,
        pdfSolution:
          solutionPath || solutionPdfPath ? `pdfs/sujets/${meta.id}/solution.pdf` : null,
        // Téléchargement source : .tex si compilé, sinon paquet .zip fourni.
        tex: epreuvePath
          ? `sources/sujets/${meta.id}/epreuve.tex`
          : bundlePath
            ? `sources/sujets/${meta.id}/sources.zip`
            : null,
      };
    }
  );

  // Copie des sources .tex dans public/ pour téléchargement direct + export ZIP.
  const srcOut = path.join(ROOT, 'public', 'sources');
  fs.rmSync(srcOut, { recursive: true, force: true });
  for (const { meta, enoncePath, enoncePathEn, solutionPath } of loadExercices()) {
    const d = path.join(srcOut, 'exercices', meta.id);
    fs.mkdirSync(d, { recursive: true });
    fs.copyFileSync(enoncePath, path.join(d, 'enonce.tex'));
    if (enoncePathEn !== enoncePath) fs.copyFileSync(enoncePathEn, path.join(d, 'enonce-en.tex'));
    if (solutionPath) fs.copyFileSync(solutionPath, path.join(d, 'solution.tex'));
  }
  for (const { meta, epreuvePath, solutionPath, bundlePath } of loadSujets()) {
    const d = path.join(srcOut, 'sujets', meta.id);
    fs.mkdirSync(d, { recursive: true });
    if (epreuvePath) fs.copyFileSync(epreuvePath, path.join(d, 'epreuve.tex'));
    if (solutionPath) fs.copyFileSync(solutionPath, path.join(d, 'solution.tex'));
    if (bundlePath) fs.copyFileSync(bundlePath, path.join(d, 'sources.zip'));
  }
  // Préambule commun exposé pour l'export ZIP du générateur.
  fs.copyFileSync(
    path.join(ROOT, 'templates', 'preamble.tex'),
    path.join(srcOut, 'preamble.tex')
  );

  // Cours : les PDF pré-composés sont copiés vers public/pdfs/cours/ ; les
  // chapitres en LaTeX sont compilés par build-latex.mjs (même destination)
  // et exposés en paquet .tex prêt à compiler (sources/cours/<id>/).
  const cours = [];
  for (const { meta, pdfPath, texPath, exercices: exoIds } of loadCours()) {
    if (pdfPath) {
      const out = path.join(ROOT, 'public', 'pdfs', 'cours', meta.id);
      fs.mkdirSync(out, { recursive: true });
      fs.copyFileSync(pdfPath, path.join(out, 'cours.pdf'));
    }
    let tex = null;
    if (texPath) {
      const d = path.join(srcOut, 'cours', meta.id);
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, `${meta.id}.zip`), await coursBundle(meta, texPath, exoIds));
      tex = `sources/cours/${meta.id}/${meta.id}.zip`;
    }
    cours.push({
      id: meta.id,
      numero: meta.numero ?? 0,
      titre_fr: meta.titre_fr,
      titre_en: meta.titre_en ?? meta.titre_fr,
      description_fr: meta.description_fr ?? '',
      description_en: meta.description_en ?? meta.description_fr ?? '',
      pages: meta.pages ?? null,
      sourceLabel: sourceLabel(meta),
      tags: meta.tags ?? [],
      pdf: `pdfs/cours/${meta.id}/cours.pdf`,
      tex,
    });
  }

  const stamp = { generatedAt: new Date().toISOString() };
  fs.writeFileSync(
    path.join(OUT_DIR, 'exercices-index.json'),
    JSON.stringify({ ...stamp, exercices }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'sujets-index.json'),
    JSON.stringify({ ...stamp, sujets }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'cours-index.json'),
    JSON.stringify({ ...stamp, cours }, null, 2)
  );
  console.log(
    `✔ Index générés : ${exercices.length} exercice(s), ${sujets.length} sujet(s), ${cours.length} cours → public/data/`
  );
}

/**
 * Paquet .tex d'un chapitre compilé : cours.tex + préambules + fragments des
 * exercices inclus, à la même arborescence relative que lors du build CI
 * (où content/exercices/ est dans TEXINPUTS) — `latexmk -pdf cours.tex`.
 */
async function coursBundle(meta, texPath, exoIds) {
  const zip = new JSZip();
  // Date fixe : contenu du ZIP reproductible d'un build à l'autre.
  const date = new Date('2026-01-01T00:00:00Z');
  const add = (name, file) => zip.file(name, fs.readFileSync(file), { date });
  add('cours.tex', texPath);
  add('preamble.tex', path.join(ROOT, 'templates', 'preamble.tex'));
  add('preamble-cours.tex', COURS_PREAMBLE_PATH);
  const exos = new Map(loadExercices().map((e) => [e.meta.id, e]));
  for (const id of exoIds) {
    const e = exos.get(id);
    add(`${id}/enonce.tex`, e.enoncePath);
    if (e.solutionPath) add(`${id}/solution.tex`, e.solutionPath);
  }
  zip.file(
    'README.txt',
    [
      `${meta.titre_fr} — sources LaTeX (site COMIMa).`,
      '',
      'Compilation :',
      '  latexmk -pdf cours.tex',
      '(ou pdflatex cours.tex, deux passes)',
      '',
      'Paquets requis : TeX Live avec texlive-latex-extra (mdframed, needspace,',
      'etoolbox), texlive-lang-french, texlive-pictures.',
      '',
      'Fichiers :',
      '  cours.tex            — document maître du chapitre',
      '  preamble.tex         — préambule commun COMIMa',
      '  preamble-cours.tex   — mise en page des chapitres (A5, encadrés…)',
      '  <exercice>/enonce.tex, solution.tex — exercices inclus dans le chapitre',
      '',
      'Les solutions s\'affichent en fin de chapitre ; pour les masquer,',
      'remplacer \\solutionstrue par \\solutionsfalse en tête de cours.tex.',
      '',
    ].join('\n'),
    { date }
  );
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

await main();
