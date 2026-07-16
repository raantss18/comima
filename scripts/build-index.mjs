// Génère public/data/exercices-index.json et public/data/sujets-index.json
// à partir des meta.yaml + fragments .tex de content/.
// Consommé par : les pages Astro (au build) et le générateur de sujets (client).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadExercices, loadSujets, sourceLabel } from './content-lib.mjs';

const OUT_DIR = path.join(ROOT, 'public', 'data');

const THEMES_VALIDES = [
  'algèbre',
  'géométrie',
  'arithmétique',
  'combinatoire',
  'analyse',
  'informatique',
];
const NIVEAUX_VALIDES = ['collège', 'lycée', 'prépa'];

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

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const exercices = loadExercices().map(({ meta, enoncePath, solutionPath }) => {
    validateExo(meta);
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
      enonceTex: stripTexComments(fs.readFileSync(enoncePath, 'utf8')),
      // Chemins relatifs à la racine du site (préfixer par BASE_URL côté client)
      pdf: `pdfs/exercices/${meta.id}/enonce.pdf`,
      pdfSolution: solutionPath ? `pdfs/exercices/${meta.id}/solution.pdf` : null,
      tex: `sources/exercices/${meta.id}/enonce.tex`,
      texSolution: solutionPath ? `sources/exercices/${meta.id}/solution.tex` : null,
    };
  });

  const sujets = loadSujets().map(({ meta, epreuvePath, solutionPath }) => ({
    id: meta.id,
    titre_fr: meta.titre_fr,
    titre_en: meta.titre_en ?? meta.titre_fr,
    source: meta.source ?? {},
    sourceLabel: sourceLabel(meta),
    langue: meta.langue ?? 'fr',
    tags: meta.tags ?? [],
    description_fr: meta.description_fr ?? '',
    description_en: meta.description_en ?? meta.description_fr ?? '',
    epreuveTex: stripTexComments(fs.readFileSync(epreuvePath, 'utf8')),
    pdf: `pdfs/sujets/${meta.id}/epreuve.pdf`,
    pdfSolution: solutionPath ? `pdfs/sujets/${meta.id}/solution.pdf` : null,
    tex: `sources/sujets/${meta.id}/epreuve.tex`,
  }));

  // Copie des sources .tex dans public/ pour téléchargement direct + export ZIP.
  const srcOut = path.join(ROOT, 'public', 'sources');
  fs.rmSync(srcOut, { recursive: true, force: true });
  for (const { meta, enoncePath, solutionPath } of loadExercices()) {
    const d = path.join(srcOut, 'exercices', meta.id);
    fs.mkdirSync(d, { recursive: true });
    fs.copyFileSync(enoncePath, path.join(d, 'enonce.tex'));
    if (solutionPath) fs.copyFileSync(solutionPath, path.join(d, 'solution.tex'));
  }
  for (const { meta, epreuvePath, solutionPath } of loadSujets()) {
    const d = path.join(srcOut, 'sujets', meta.id);
    fs.mkdirSync(d, { recursive: true });
    fs.copyFileSync(epreuvePath, path.join(d, 'epreuve.tex'));
    if (solutionPath) fs.copyFileSync(solutionPath, path.join(d, 'solution.tex'));
  }
  // Préambule commun exposé pour l'export ZIP du générateur.
  fs.copyFileSync(
    path.join(ROOT, 'templates', 'preamble.tex'),
    path.join(srcOut, 'preamble.tex')
  );

  const stamp = { generatedAt: new Date().toISOString() };
  fs.writeFileSync(
    path.join(OUT_DIR, 'exercices-index.json'),
    JSON.stringify({ ...stamp, exercices }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'sujets-index.json'),
    JSON.stringify({ ...stamp, sujets }, null, 2)
  );
  console.log(
    `✔ Index générés : ${exercices.length} exercice(s), ${sujets.length} sujet(s) → public/data/`
  );
}

main();
