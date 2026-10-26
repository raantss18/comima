// Fonctions partagées entre build-index.mjs et build-latex.mjs :
// lecture des dossiers content/exercices, content/sujets et content/cours.
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
 * Analyse un cours.tex selon la grammaire stricte de docs/STRUCTURE-COURS.md § 6
 * (une construction par ligne, en début de ligne). Renvoie
 *  { numero, titre,
 *    plan: [{ niveau: 1|2, numero: 'n.k'|'n.k.m', titre, slug, dest }],
 *    exercices: [{ id, type: 'ex'|'exo'|'pb', numero: 'n.k', titre }] }.
 * `dest` est la destination PDF de hyperref (`section.N`, `subsection.N.M`) :
 * lien `cours.pdf#nameddest=<dest>`. `exercices` suit l'ordre du document ;
 * `type` est celui des étiquettes posées par les macros (ex : \exochap,
 * exo : \exercice, pb : \probleme).
 */
const typo = (t) => t.replace(/---/g, '—').replace(/--/g, '–'); // tirets LaTeX → typographie

export function parseCoursTex(src) {
  let numero = null;
  let titre = null;
  const plan = [];
  const exercices = [];
  let s = 0; // compteur de \section numérotées
  let ss = 0; // compteur de \subsection dans la section courante
  const cnt = { ex: 0, exo: 0, pb: 0 };
  const types = { exochap: 'ex', exercice: 'exo', probleme: 'pb' };
  for (const line of src.split('\n')) {
    let m = line.match(/^\\chapitre\{(\d+)\}\{(.+)\}/);
    if (m) {
      numero = Number(m[1]);
      titre = m[2];
      continue;
    }
    m = line.match(/^\\(sub)?section\{(.+)\}\\label\{sec:([a-z0-9-]+)\}/);
    if (m) {
      if (m[1]) {
        ss += 1;
        plan.push({
          niveau: 2,
          numero: `${numero}.${s}.${ss}`,
          titre: typo(m[2]),
          slug: m[3],
          dest: `subsection.${s}.${ss}`,
        });
      } else {
        s += 1;
        ss = 0;
        plan.push({ niveau: 1, numero: `${numero}.${s}`, titre: typo(m[2]), slug: m[3], dest: `section.${s}` });
      }
      continue;
    }
    m = line.match(/^\\(exochap|exercice|probleme)\{([a-z0-9-]+)\}\{(.+)\}/);
    if (m) {
      const type = types[m[1]];
      cnt[type] += 1;
      exercices.push({ id: m[2], type, numero: `${numero}.${cnt[type]}`, titre: m[3] });
    }
  }
  return { numero, titre, plan, exercices };
}

/**
 * Liste les chapitres de cours. Chaque chapitre est un document LaTeX complet
 * (`cours.tex`, norme : docs/STRUCTURE-COURS.md) compilé par build-latex.mjs
 * vers public/pdfs/cours/<id>/cours.pdf et proposé en paquet .tex. Il inclut
 * des fragments d'exercices (`\exochap{<id>}`, `\exercice{<id>}`,
 * `\probleme{<id>}`) : `exercices` en donne les ids, dans l'ordre du document.
 * Un `cours.pdf` précompilé ou un `chapitre.tex` (ancien format) est une erreur.
 * Renvoie { meta, dir, texPath, exercices: [ids], analyse: parseCoursTex(…) }.
 */
export function loadCours() {
  return listEntryDirs(COURS_DIR).map((dir) => {
    const meta = readMeta(dir);
    const texPath = path.join(dir, 'cours.tex');
    if (!fs.existsSync(texPath)) throw new Error(`cours.tex manquant dans ${dir}`);
    for (const old of ['cours.pdf', 'chapitre.tex']) {
      if (fs.existsSync(path.join(dir, old))) {
        throw new Error(`${old} interdit dans ${dir} (format retiré : voir docs/STRUCTURE-COURS.md)`);
      }
    }
    const analyse = parseCoursTex(fs.readFileSync(texPath, 'utf8'));
    return { meta, dir, texPath, exercices: analyse.exercices.map((e) => e.id), analyse };
  });
}

/** Préambule propre aux chapitres de cours compilés (complète preamble.tex). */
export const COURS_PREAMBLE_PATH = path.join(ROOT, 'templates', 'preamble-cours.tex');

export function sourceLabel(meta) {
  const s = meta.source ?? {};
  return [s.concours, s.annee, s.pays].filter(Boolean).join(' · ');
}
