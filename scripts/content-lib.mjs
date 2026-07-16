// Fonctions partagées entre build-index.mjs et build-latex.mjs :
// lecture des dossiers content/exercices et content/sujets.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
export const EXOS_DIR = path.join(ROOT, 'content', 'exercices');
export const SUJETS_DIR = path.join(ROOT, 'content', 'sujets');

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

/** Liste les sujets complets : { meta, dir, epreuvePath, solutionPath|null } */
export function loadSujets() {
  return listEntryDirs(SUJETS_DIR).map((dir) => {
    const meta = readMeta(dir);
    const epreuvePath = path.join(dir, 'epreuve.tex');
    if (!fs.existsSync(epreuvePath)) {
      throw new Error(`epreuve.tex manquant dans ${dir}`);
    }
    const solutionPath = path.join(dir, 'solution.tex');
    return {
      meta,
      dir,
      epreuvePath,
      solutionPath: fs.existsSync(solutionPath) ? solutionPath : null,
    };
  });
}

export function sourceLabel(meta) {
  const s = meta.source ?? {};
  return [s.concours, s.annee, s.pays].filter(Boolean).join(' · ');
}
