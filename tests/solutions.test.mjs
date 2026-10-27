import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Règle d'Antsa (27 oct. 2026) : un élève (et toute personne sans compte) ne voit JAMAIS une réponse ou une solution.
// Ces tests gardent la règle contre une régression future (d'un outil, d'un collaborateur).

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

test('édition publique : aucune solution dans les index, les sources et les PDF du site', () => {
  execFileSync(process.execPath, ['scripts/build-index.mjs'], { stdio: 'ignore', env: { ...process.env, COMIMA_SOLUTIONS: '' } });
  const exos = JSON.parse(fs.readFileSync('public/data/exercices-index.json', 'utf8')).exercices;
  assert.ok(exos.length > 1000);
  for (const e of exos) {
    assert.equal(e.a_solution, false, `${e.id} : a_solution`);
    assert.equal(e.pdfSolution, null, `${e.id} : pdfSolution`);
    assert.equal(e.texSolution, null, `${e.id} : texSolution`);
  }
  const sujets = JSON.parse(fs.readFileSync('public/data/sujets-index.json', 'utf8')).sujets;
  for (const s of sujets) assert.equal(s.pdfSolution, null, `${s.id} : pdfSolution`);
  const fuites = walk('public/sources').filter((f) => /solution/i.test(path.basename(f)));
  assert.deepEqual(fuites, [], 'fichiers de solution dans public/sources');
  const pdfs = walk('public/pdfs').filter((f) => /^solution(-en)?\.pdf$/.test(path.basename(f)));
  assert.deepEqual(pdfs, [], 'PDF de solution dans public/pdfs');
  // Les archives des chapitres ne contiennent pas de solution.tex.
  for (const f of walk('public/sources/cours').filter((x) => x.endsWith('.zip'))) {
    const names = execFileSync('unzip', ['-Z1', f], { encoding: 'utf8' });
    assert.doesNotMatch(names, /solution/i, `${f} contient une solution`);
  }
});

test('édition publique des chapitres : \\solutionstrue est neutralisé par le préambule', () => {
  const pre = fs.readFileSync('templates/preamble-cours.tex', 'utf8');
  assert.match(pre, /\\ifdefined\\comimasolutions\\else\\let\\solutionstrue\\solutionsfalse\\fi/);
});

test('les garde-fous « élève / encadreur » restent en place dans l\'application et sur le site', () => {
  const quiz = fs.readFileSync('app/lib/ui/quiz.dart', 'utf8');
  assert.match(quiz, /if \(ok \|\| coach\)/, 'quiz Dart : explication réservée aux bonnes réponses et aux encadreurs');
  assert.match(quiz, /final wrongText = !coach/, 'quiz Dart : détail du moteur réservé aux encadreurs');
  assert.match(quiz, /AppScope\.of\(context\)\.isCoach/, 'défis au choix : explication réservée aux encadreurs');
  const lib = fs.readFileSync('app/lib/ui/library.dart', 'utf8');
  assert.match(lib, /if \(AppScope\.of\(context\)\.isCoach\) \.\.\.\[/, 'exercice : solution réservée aux encadreurs');
  assert.doesNotMatch(lib, /solution_online/, 'plus de lien vers un PDF de solution');
  const state = fs.readFileSync('app/lib/core/app_state.dart', 'utf8');
  assert.match(state, /bool get isCoach/);
  const web = fs.readFileSync('src/scripts/training.ts', 'utf8');
  assert.match(web, /const coach = /);
  assert.match(web, /ok \|\| coach \? explanation\(\) : ''/, 'quiz du site : explication réservée aux bonnes réponses et aux encadreurs');
  assert.match(web, /!ok && coach && v\.detail/, 'quiz du site : détail du moteur réservé aux encadreurs');
});

test('l\'application ne publie plus de lien vers un PDF de solution', () => {
  execFileSync(process.execPath, ['scripts/build-index.mjs'], { stdio: 'ignore' });
  execFileSync(process.execPath, ['scripts/build-app-packs.mjs'], { stdio: 'ignore' });
  const lib = JSON.parse(fs.readFileSync('public/app/v1/library.json', 'utf8'));
  for (const e of lib.exercices) assert.equal(e.solution, null, `${e.id} : lien PDF de solution`);
  for (const s of lib.sujets) assert.equal(s.pdfSolution ?? null, null, `${s.id} : pdfSolution`);
});
