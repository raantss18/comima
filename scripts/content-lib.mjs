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

/**
 * Liste les exercices : { meta, dir, enoncePath, enoncePathEn, solutionPath|null }.
 * Corps bilingue optionnel : un exercice peut fournir soit un enonce.tex
 * unique (utilisé pour les deux langues, cas historique), soit une paire
 * enonce.fr.tex / enonce.en.tex (corps distincts, sélectionnés côté site
 * selon la langue, comme le sont déjà titre_fr / titre_en).
 */
export function loadExercices() {
  return listEntryDirs(EXOS_DIR).map((dir) => {
    const meta = readMeta(dir);
    const legacyPath = path.join(dir, 'enonce.tex');
    const frPath = path.join(dir, 'enonce.fr.tex');
    const enPath = path.join(dir, 'enonce.en.tex');
    const hasFr = fs.existsSync(frPath);
    const hasEn = fs.existsSync(enPath);

    let enoncePath;
    let enoncePathEn;
    if (hasFr || hasEn) {
      if (!hasFr) throw new Error(`enonce.fr.tex manquant dans ${dir} (enonce.en.tex présent)`);
      enoncePath = frPath;
      enoncePathEn = hasEn ? enPath : frPath;
    } else if (fs.existsSync(legacyPath)) {
      enoncePath = legacyPath;
      enoncePathEn = legacyPath;
    } else {
      throw new Error(`enonce.tex (ou enonce.fr.tex) manquant dans ${dir}`);
    }

    const solutionPath = path.join(dir, 'solution.tex');
    return {
      meta,
      dir,
      enoncePath,
      enoncePathEn,
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

/**
 * Liste les chapitres de cours. Un chapitre fournit :
 *  - soit un PDF pré-composé (`cours.pdf`, chapitres 1 à 7) copié tel quel,
 *    éventuellement accompagné de sa source (`chapitre.tex`, gabarit
 *    templates/cours) proposée en .tex et en archive compilable ;
 *  - soit un document LaTeX complet (`cours.tex`, chapitres 0 et 8) compilé
 *    par build-latex.mjs et proposé en paquet .tex. Il peut inclure des
 *    fragments d'exercices (`\exochap{<id>}`, `\exercice{<id>}`,
 *    `\probleme{<id>}`, `\input{<id>/enonce.tex}`) : les exercices cités par
 *    cours.tex sont listés dans `exercices`.
 * Renvoie { meta, dir, pdfPath|null, texPath|null, chapitreTexPath|null, exercices: [ids] }.
 */
export function loadCours() {
  const exoIds = fs.existsSync(EXOS_DIR) ? listEntryDirs(EXOS_DIR).map((d) => path.basename(d)) : [];
  return listEntryDirs(COURS_DIR).map((dir) => {
    const meta = readMeta(dir);
    const pdfPath = path.join(dir, 'cours.pdf');
    const texPath = path.join(dir, 'cours.tex');
    const hasPdf = fs.existsSync(pdfPath);
    const hasTex = fs.existsSync(texPath);
    if (!hasPdf && !hasTex) {
      throw new Error(`ni cours.pdf ni cours.tex dans ${dir}`);
    }
    let exercices = [];
    if (hasTex) {
      const src = fs.readFileSync(texPath, 'utf8');
      // \exochap{<id>}{…}, \probleme{<id>}{…} ou \input{<id>/enonce.tex}.
      exercices = exoIds.filter((id) => src.includes(`{${id}}`) || src.includes(`{${id}/`));
    }
    // Source LaTeX d'un chapitre pré-composé (optionnelle) : .tex + archive compilable.
    const chapitreTexPath = path.join(dir, 'chapitre.tex');
    return {
      meta,
      dir,
      pdfPath: hasPdf ? pdfPath : null,
      texPath: hasTex ? texPath : null,
      chapitreTexPath: hasPdf && fs.existsSync(chapitreTexPath) ? chapitreTexPath : null,
      exercices,
    };
  });
}

/** Préambule propre aux chapitres de cours compilés (complète preamble.tex). */
export const COURS_PREAMBLE_PATH = path.join(ROOT, 'templates', 'preamble-cours.tex');

export function sourceLabel(meta) {
  const s = meta.source ?? {};
  return [s.concours, s.annee, s.pays].filter(Boolean).join(' · ');
}
