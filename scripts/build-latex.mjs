// Compile chaque fragment .tex (enonce/solution/epreuve) en PDF individuel
// via latexmk, avec cache incrémental par hash de contenu : seuls les
// fichiers modifiés depuis le dernier build (manifest) sont recompilés.
// Les chapitres de cours (content/cours/<id>/cours.tex, document complet,
// norme docs/STRUCTURE-COURS.md) sont compilés vers public/pdfs/cours/<id>/ ;
// la pagination continue du recueil est injectée par -usepretex
// (\def\comimapage{<page_debut de meta.yaml>}, lu par preamble-cours.tex).
// Sorties : public/pdfs/{exercices,sujets,cours}/<id>/*.pdf + manifest.json.
// Si latexmk est absent (poste local sans TeX), le script avertit et sort
// avec succès : le site reste buildable, seuls les PDF manqueront.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  ROOT,
  loadExercices,
  loadSujets,
  loadCours,
  sourceLabel,
  COURS_PREAMBLE_PATH,
  PUBLISH_SOLUTIONS,
} from './content-lib.mjs';

const BUILD_DIR = path.join(ROOT, '.latex-build');
const OUT_DIR = path.join(ROOT, 'public', 'pdfs');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');

const TEMPLATE = fs.readFileSync(path.join(ROOT, 'templates', 'exercice.tex'), 'utf8');
const PREAMBLE = fs.readFileSync(path.join(ROOT, 'templates', 'preamble.tex'), 'utf8');

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function hasLatexmk() {
  return spawnSync('latexmk', ['--version'], { stdio: 'ignore' }).status === 0;
}

function escapeLatex(s) {
  return String(s)
    .replace(/([%$#&_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/** Construit la liste des cibles de compilation. */
function collectTargets() {
  const targets = [];
  for (const { meta, enoncePath, enoncePathEn, solutionPath } of loadExercices()) {
    const sub = sourceLabel(meta) || 'COMIMa';
    targets.push({
      key: `exercices/${meta.id}/enonce`,
      fragment: enoncePath,
      title: meta.titre_fr,
      subtitle: sub,
      out: path.join(OUT_DIR, 'exercices', meta.id, 'enonce.pdf'),
    });
    if (enoncePathEn !== enoncePath) {
      targets.push({
        key: `exercices/${meta.id}/enonce-en`,
        fragment: enoncePathEn,
        title: meta.titre_en ?? meta.titre_fr,
        subtitle: sub,
        out: path.join(OUT_DIR, 'exercices', meta.id, 'enonce-en.pdf'),
      });
    }
    if (PUBLISH_SOLUTIONS && solutionPath) {
      targets.push({
        key: `exercices/${meta.id}/solution`,
        fragment: solutionPath,
        title: meta.titre_fr,
        subtitle: `${sub} — Solution`,
        out: path.join(OUT_DIR, 'exercices', meta.id, 'solution.pdf'),
      });
    }
  }
  for (const { meta, epreuvePath, solutionPath } of loadSujets()) {
    const sub = sourceLabel(meta) || 'COMIMa';
    // Sujets à PDF pré-fourni (epreuvePath null) : rien à compiler.
    if (!epreuvePath) continue;
    targets.push({
      key: `sujets/${meta.id}/epreuve`,
      fragment: epreuvePath,
      title: meta.titre_fr,
      subtitle: sub,
      out: path.join(OUT_DIR, 'sujets', meta.id, 'epreuve.pdf'),
    });
    if (PUBLISH_SOLUTIONS && solutionPath) {
      targets.push({
        key: `sujets/${meta.id}/solution`,
        fragment: solutionPath,
        title: meta.titre_fr,
        subtitle: `${sub} — Solutions`,
        out: path.join(OUT_DIR, 'sujets', meta.id, 'solution.pdf'),
      });
    }
  }
  const exos = new Map(loadExercices().map((e) => [e.meta.id, e]));
  for (const { meta, texPath, exercices } of loadCours()) {
    // Le hash couvre aussi le préambule des cours et les fragments inclus.
    const deps = [COURS_PREAMBLE_PATH];
    for (const id of exercices) {
      const e = exos.get(id);
      deps.push(e.enoncePath);
      if (e.solutionPath) deps.push(e.solutionPath);
    }
    targets.push({
      key: `cours/${meta.id}/cours`,
      document: texPath,
      pageDebut: Number(meta.page_debut ?? 1),
      deps,
      title: meta.titre_fr,
      subtitle: '',
      out: path.join(OUT_DIR, 'cours', meta.id, 'cours.pdf'),
    });
  }
  return targets;
}

/**
 * Document complet (chapitre de cours) : compilé depuis la racine avec
 * templates/ et content/exercices/ dans TEXINPUTS, de sorte que
 * \input{preamble.tex} et \input{<id>/enonce.tex} se résolvent comme dans
 * le paquet .tex exporté (où ces fichiers sont à côté de cours.tex).
 */
function compileDocument(target, jobDir) {
  fs.mkdirSync(jobDir, { recursive: true });
  const texinputs = [
    path.join(ROOT, 'templates'),
    path.join(ROOT, 'content', 'exercices'),
    '',
  ].join(path.delimiter);
  execFileSync(
    'latexmk',
    [
      '-pdf',
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-jobname=main',
      // Pagination continue : \comimapage = première page du chapitre dans le recueil.
      `-usepretex=\\def\\comimapage{${target.pageDebut}}${PUBLISH_SOLUTIONS ? '\\def\\comimasolutions{1}' : ''}`,
      `-output-directory=${jobDir}`,
      target.document,
    ],
    { cwd: ROOT, stdio: 'pipe', env: { ...process.env, TEXINPUTS: texinputs } }
  );
  fs.mkdirSync(path.dirname(target.out), { recursive: true });
  fs.copyFileSync(path.join(jobDir, 'main.pdf'), target.out);
}

function compile(target, jobDir) {
  if (target.document) return compileDocument(target, jobDir);
  fs.mkdirSync(jobDir, { recursive: true });
  const fragmentRel = path.relative(ROOT, target.fragment).split(path.sep).join('/');
  const wrapper = TEMPLATE.replaceAll('%%TITLE%%', () => escapeLatex(target.title))
    .replaceAll('%%SUBTITLE%%', () => escapeLatex(target.subtitle))
    .replaceAll('%%BODY%%', () => fragmentRel);
  const wrapperPath = path.join(jobDir, 'main.tex');
  fs.writeFileSync(wrapperPath, wrapper);
  // latexmk lancé depuis la racine du repo : \input{templates/...} et
  // \input{content/...} sont résolus relativement au cwd.
  execFileSync(
    'latexmk',
    [
      '-pdf',
      '-interaction=nonstopmode',
      '-halt-on-error',
      `-output-directory=${jobDir}`,
      wrapperPath,
    ],
    { cwd: ROOT, stdio: 'pipe' }
  );
  fs.mkdirSync(path.dirname(target.out), { recursive: true });
  fs.copyFileSync(path.join(jobDir, 'main.pdf'), target.out);
}

function main() {
  if (!hasLatexmk()) {
    console.warn(
      '⚠ latexmk introuvable : compilation LaTeX ignorée. ' +
        'Les PDF seront générés par GitHub Actions (voir README).'
    );
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let manifest = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    } catch {
      manifest = {};
    }
  }

  const targets = collectTargets();
  const newManifest = {};
  let compiled = 0;
  let skipped = 0;
  let failed = 0;

  // COMIMA_ONLY=cours/ : ne compile que les cibles dont la clé commence ainsi (poste local ; rien n'est purgé).
  const ONLY = process.env.COMIMA_ONLY || '';
  for (const target of targets) {
    if (ONLY && !target.key.startsWith(ONLY)) {
      if (manifest[target.key]) newManifest[target.key] = manifest[target.key];
      continue;
    }
    const fragment = target.document
      ? [target.document, ...target.deps].map((f) => fs.readFileSync(f, 'utf8')).join('\0')
      : fs.readFileSync(target.fragment, 'utf8');
    // page_debut change la numérotation du PDF : il fait partie du hash.
    const parts = [TEMPLATE, PREAMBLE, target.title, target.subtitle, fragment];
    if (target.pageDebut != null) parts.push(`page_debut=${target.pageDebut}`);
    if (target.document) parts.push(`solutions=${PUBLISH_SOLUTIONS}`); // l'édition (élèves / encadreurs) change le PDF
    const hash = sha256(parts.join(' ')); // même séparateur qu'avant : le cache des exercices reste valide
    if (manifest[target.key] === hash && fs.existsSync(target.out)) {
      newManifest[target.key] = hash;
      skipped++;
      continue;
    }
    const jobDir = path.join(BUILD_DIR, target.key.replace(/\//g, '__'));
    try {
      console.log(`⇒ Compilation de ${target.key}…`);
      compile(target, jobDir);
      newManifest[target.key] = hash;
      compiled++;
    } catch (err) {
      failed++;
      console.error(`✘ Échec de compilation pour ${target.key}`);
      const log = path.join(jobDir, 'main.log');
      if (fs.existsSync(log)) {
        const lines = fs.readFileSync(log, 'utf8').split('\n');
        const errIdx = lines.findIndex((l) => l.startsWith('!'));
        if (errIdx >= 0) console.error(lines.slice(errIdx, errIdx + 12).join('\n'));
      }
    }
  }

  // Purge les PDF orphelins (exercices ou chapitres supprimés du dépôt). Les
  // sujets à PDF pré-fourni sont préservés (leurs dossiers ne doivent pas
  // être purgés) ; les sorties valides des cours sont des cibles compilées.
  const validOuts = new Set(targets.map((t) => t.out));
  for (const { meta, epreuvePdfPath, solutionPdfPath } of loadSujets()) {
    if (epreuvePdfPath) validOuts.add(path.join(OUT_DIR, 'sujets', meta.id, 'epreuve.pdf'));
    if (PUBLISH_SOLUTIONS && solutionPdfPath) validOuts.add(path.join(OUT_DIR, 'sujets', meta.id, 'solution.pdf'));
  }
  const walk = (dir) => {
    if (ONLY || !fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith('.pdf') && !validOuts.has(p)) fs.rmSync(p);
    }
  };
  walk(path.join(OUT_DIR, 'exercices'));
  walk(path.join(OUT_DIR, 'sujets'));
  walk(path.join(OUT_DIR, 'cours'));

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(newManifest, null, 2));
  console.log(`✔ LaTeX : ${compiled} compilé(s), ${skipped} en cache, ${failed} échec(s).`);
  if (failed > 0) process.exit(1);
}

main();
