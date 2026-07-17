// Fonctions partagées entre build-index.mjs et build-latex.mjs :
// lecture des dossiers content/exercices et content/sujets.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
export const EXOS_DIR = path.join(ROOT, 'content', 'exercices');
export const SUJETS_DIR = path.join(ROOT, 'content', 'sujets');
export const COURS_DIR = path.join(ROOT, 'content', 'cours');

function listEntryDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(dir, d.name))
    .sort();
}

function readMeta(entryDir) {
  const metaPath = path.join(entryDir, 'meta.yaml');
  if (!fs.existsSync(metaPath)) {
    throw new Error(`meta.yaml manquant dans ${entryDir}`);
  }
  const meta = YAML.parse(fs.readFileSync(metaPath, 'utf8'));
  if (!meta.id) meta.id = path.basename(entryDir);
  if (meta.id !== path.basename(entryDir)) {
    throw new Error(
      `Incohérence dans ${entryDir} : id "${meta.id}" ≠ nom du dossier "${path.basename(entryDir)}"`
    );
  }
  return meta;
}

/** Liste les exercices : { meta, dir, enoncePath, solutionPath|null } */
export function loadExercices() {
  return listEntryDirs(EXOS_DIR).map((dir) => {
    const meta = readMeta(dir);
    const enoncePath = path.join(dir, 'enonce.tex');
    if (!fs.existsSync(enoncePath)) {
      throw new Error(`enonce.tex manquant dans ${dir}`);
    }
    const solutionPath = path.join(dir, 'solution.tex');
    return {
      meta,
      dir,
      enoncePath,
      solutionPath: fs.existsSync(solutionPath) ? solutionPath : null,
    };
  });
}

/**
 * Liste les sujets complets. Deux modes :
 *  - énoncé LaTeX (`epreuve.tex`) compilé par le pipeline (ex. IMO) ;
 *  - PDF pré-fourni (`epreuve.pdf`) utilisé tel quel (ex. archives fournies
 *    avec figures/solutions dans un template propre). Dans ce cas, un
 *    `sources.zip` optionnel est proposé au téléchargement.
 * Renvoie { meta, dir, epreuvePath|null, epreuvePdfPath|null,
 *           solutionPath|null, solutionPdfPath|null, bundlePath|null }.
 */
export function loadSujets() {
  return listEntryDirs(SUJETS_DIR).map((dir) => {
    const meta = readMeta(dir);
    const epreuvePath = path.join(dir, 'epreuve.tex');
    const epreuvePdfPath = path.join(dir, 'epreuve.pdf');
    const hasTex = fs.existsSync(epreuvePath);
    const hasPdf = fs.existsSync(epreuvePdfPath);
    if (!hasTex && !hasPdf) {
      throw new Error(`ni epreuve.tex ni epreuve.pdf dans ${dir}`);
    }
    const solutionPath = path.join(dir, 'solution.tex');
    const solutionPdfPath = path.join(dir, 'solution.pdf');
    const bundlePath = path.join(dir, 'sources.zip');
    return {
      meta,
      dir,
      epreuvePath: hasTex ? epreuvePath : null,
      epreuvePdfPath: hasPdf ? epreuvePdfPath : null,
      solutionPath: fs.existsSync(solutionPath) ? solutionPath : null,
      solutionPdfPath: fs.existsSync(solutionPdfPath) ? solutionPdfPath : null,
      bundlePath: fs.existsSync(bundlePath) ? bundlePath : null,
    };
  });
}

/** Liste les chapitres de cours : { meta, dir, pdfPath } (PDF pré-compilé fourni). */
export function loadCours() {
  return listEntryDirs(COURS_DIR).map((dir) => {
    const meta = readMeta(dir);
    const pdfPath = path.join(dir, 'cours.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`cours.pdf manquant dans ${dir}`);
    }
    return { meta, dir, pdfPath };
  });
}

export function sourceLabel(meta) {
  const s = meta.source ?? {};
  return [s.concours, s.annee, s.pays].filter(Boolean).join(' · ');
}
