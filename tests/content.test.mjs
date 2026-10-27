import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadCours, loadExercices } from '../scripts/content-lib.mjs';
import { chapitres, attendues, pdfPages } from '../scripts/pagination.mjs';

// Redondances (mêmes énoncés, identifiants en double) et compatibilité des contenus avec l'application.
test('contenus : aucune redondance, compatibilité cohérente', () => {
  const out = execFileSync(process.execPath, ['scripts/check-content.mjs'], { encoding: 'utf8' });
  assert.match(out, /aucune redondance/);
});

test('manifeste de l\'application : illustrations vérifiables et build minimal', () => {
  // Le manifeste est généré (non versionné) : on le produit si besoin, comme le fait le déploiement.
  if (!fs.existsSync('public/app/v1/manifest.json')) {
    execFileSync(process.execPath, ['scripts/build-index.mjs'], { stdio: 'ignore' });
    execFileSync(process.execPath, ['scripts/build-app-packs.mjs'], { stdio: 'ignore' });
  }
  const m = JSON.parse(fs.readFileSync('public/app/v1/manifest.json', 'utf8'));
  assert.ok(Number.isInteger(m.minAppBuild) && m.minAppBuild >= 1);
  assert.ok(m.figures.length >= 18);
  for (const f of m.figures) {
    assert.match(f.path, /^figures\/[a-z0-9-]+\.html$/);
    assert.match(f.sha256, /^[0-9a-f]{64}$/);
  }
});

// ——— Chapitres de cours (norme : docs/STRUCTURE-COURS.md) ———
const cours = loadCours();
const exoMetas = new Map(loadExercices().map((e) => [e.meta.id, e.meta]));
const etiquette = { ex: 'exercice', exo: 'exercice guidé', pb: 'problème' };

test('cours : cours.tex présent, ni cours.pdf ni chapitre.tex, numéro cohérent', () => {
  assert.ok(cours.length >= 9);
  for (const { meta, dir, analyse } of cours) {
    assert.ok(fs.existsSync(path.join(dir, 'cours.tex')), `${meta.id} : cours.tex manquant`);
    assert.ok(!fs.existsSync(path.join(dir, 'cours.pdf')), `${meta.id} : cours.pdf interdit`);
    assert.ok(!fs.existsSync(path.join(dir, 'chapitre.tex')), `${meta.id} : chapitre.tex interdit`);
    assert.equal(analyse.numero, Number(meta.numero), `${meta.id} : \\chapitre{n} ≠ meta.numero`);
    assert.ok(analyse.plan.length > 0 && analyse.exercices.length > 0, `${meta.id} : plan ou exercices vides`);
  }
});

test('cours : chaque id inclus existe dans content/exercices/', () => {
  for (const { meta, analyse } of cours) {
    for (const x of analyse.exercices) {
      assert.ok(exoMetas.has(x.id), `${meta.id} : exercice inconnu « ${x.id} »`);
    }
  }
});

test('cours : chaque \\section numérotée porte \\label{sec:…} sur sa ligne', () => {
  for (const { meta, dir } of cours) {
    const lignes = fs.readFileSync(path.join(dir, 'cours.tex'), 'utf8').split('\n');
    lignes.forEach((l, i) => {
      if (/^\\(sub)?section\{/.test(l)) {
        assert.match(l, /\\label\{sec:[a-z0-9-]+\}\s*(%.*)?$/, `${meta.id}, ligne ${i + 1} : \\label{sec:…} manquant`);
      }
    });
  }
});

test("cours : le tag de numéro d'un exercice inclus est celui du PDF", () => {
  for (const { meta, analyse } of cours) {
    for (const x of analyse.exercices) {
      const attendu = `${etiquette[x.type]} ${x.numero}`;
      const tags = (exoMetas.get(x.id)?.tags ?? []).filter((t) => /^(exercice guidé|exercice|problème) \d+\.\d+$/.test(t));
      assert.deepEqual(tags, [attendu], `${meta.id} : ${x.id} devrait porter le tag « ${attendu} »`);
    }
  }
});

test('cours : tous les dossiers recueil-N-* sont inclus dans le cours N', () => {
  const inclus = new Map(cours.map((c) => [Number(c.meta.numero), new Set(c.exercices)]));
  for (const id of exoMetas.keys()) {
    const m = id.match(/^recueil-(\d+)-/);
    if (!m) continue;
    assert.ok(inclus.has(Number(m[1])), `${id} : pas de chapitre ${m[1]}`);
    assert.ok(inclus.get(Number(m[1])).has(id), `${id} n'est pas inclus dans cours.tex du chapitre ${m[1]}`);
  }
});

test('cours : pagination continue (page_debut) et pages = pages du PDF', (t) => {
  const chs = chapitres();
  const attendu = attendues(chs);
  chs.forEach((c, i) => {
    assert.ok(Number.isInteger(c.pageDebut), `${c.id} : page_debut manquant`);
    assert.equal(c.pageDebut, attendu[i], `${c.id} : page_debut ≠ page_debut(n-1) + pages(n-1)`);
  });
  const avecPdf = chs.map((c) => [c, pdfPages(path.join('public', 'pdfs', 'cours', c.id, 'cours.pdf'))]);
  if (avecPdf.every(([, n]) => n == null)) {
    t.diagnostic('PDF absents ou pdfinfo introuvable : comparaison de `pages` ignorée');
    return;
  }
  for (const [c, n] of avecPdf) {
    if (n != null) assert.equal(c.pages, n, `${c.id} : pages = ${c.pages}, le PDF en compte ${n}`);
  }
});

// Ce que l'application affiche tel quel (articles, énoncés) ne doit contenir ni HTML, ni lien Markdown brut, ni LaTeX de mise en page.
test('articles de l\'application : du texte lisible, pas de balisage brut', () => {
  const lib = JSON.parse(fs.readFileSync('public/app/v1/library.json', 'utf8'));
  const problemes = [];
  for (const a of lib.actualites) {
    const t = String(a.corps ?? '');
    if (/<\/?[A-Za-z][^>]*>/.test(t)) problemes.push(`${a.slug} (${a.lang}) : balise HTML`);
    if (/^\s*(import|export)\s/m.test(t)) problemes.push(`${a.slug} (${a.lang}) : import/export MDX`);
    if (/\{\/\*|\*\/\}/.test(t)) problemes.push(`${a.slug} (${a.lang}) : commentaire MDX`);
  }
  assert.deepEqual(problemes, []);
});
