// Génère les paquets hors ligne de l'application Android à partir de content/app/notions/*.yaml :
//   public/app/manifest.json            — liste des paquets (version, empreinte, taille)
//   public/app/packs/<theme>-<niveau>.json
//   public/app/library.json             — exercices du site, consultables hors ligne
// Toute erreur de format fait échouer le build (format : content/app/README.md).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';
import { ROOT } from './content-lib.mjs';

const SRC_DIR = path.join(ROOT, 'content', 'app', 'notions');
const OUT_DIR = path.join(ROOT, 'public', 'app');
const FORMAT = 1; // à incrémenter si le format des paquets change de façon incompatible

const THEMES = ['algèbre', 'géométrie', 'arithmétique', 'combinatoire', 'analyse', 'informatique'];
const THEME_SLUG = {
  algèbre: 'algebre',
  géométrie: 'geometrie',
  arithmétique: 'arithmetique',
  combinatoire: 'combinatoire',
  analyse: 'analyse',
  informatique: 'informatique',
};
const TYPES = [
  'qcm', 'vrai-faux', 'numeric', 'expression', 'ensemble', 'n-uplet', 'intervalle',
  'ordre', 'trous', 'code', 'simulation', 'preuve',
];
const FONCTIONS = ['sqrt', 'abs'];

const chapitres = new Set(fs.readdirSync(path.join(ROOT, 'content', 'cours')));
const sims = new Set(
  [...fs.readFileSync(path.join(ROOT, 'src', 'lib', 'sims.ts'), 'utf8').matchAll(/slug: '([^']+)'/g)].map((m) => m[1]),
);

const erreurs = [];
const err = (ou, msg) => erreurs.push(`${ou} : ${msg}`);

const isBilingue = (v) => v && typeof v === 'object' && typeof v.fr === 'string' && v.fr.trim() && typeof v.en === 'string' && v.en.trim();
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

// --- Vérifications des réponses attendues (la correction elle-même est faite par l'application) ---

const NOMBRE = /^-?(\d+(\.\d+)?|\d+\/\d+)$/;

function checkNombre(v) {
  const s = String(v).trim();
  if (!NOMBRE.test(s)) return false;
  return !/\/0+$/.test(s);
}

// Analyse syntaxique minimale : + - * / ^ ( ), nombres, variables déclarées, sqrt() et abs().
function checkExpression(src, variables) {
  const toks = String(src).match(/\d+(\.\d+)?|[a-zA-Z_]\w*|[-+*/^()]|\S/g) || [];
  let i = 0;
  const peek = () => toks[i];
  const fail = (m) => { throw new Error(m); };
  function primaire() {
    const t = toks[i++];
    if (t === undefined) fail('expression incomplète');
    if (/^\d/.test(t)) return;
    if (t === '(') { somme(); if (toks[i++] !== ')') fail('parenthèse non fermée'); return; }
    if (t === '-' || t === '+') return primaire();
    if (/^[a-zA-Z_]/.test(t)) {
      if (FONCTIONS.includes(t)) {
        if (toks[i++] !== '(') fail(`« ${t} » doit être suivi de (`);
        somme();
        if (toks[i++] !== ')') fail('parenthèse non fermée');
        return;
      }
      if (!variables.includes(t)) fail(`variable « ${t} » non déclarée dans variables`);
      return;
    }
    fail(`symbole inattendu « ${t} »`);
  }
  function puissance() { primaire(); if (peek() === '^') { i++; puissance(); } }
  function produit() { puissance(); while (peek() === '*' || peek() === '/') { i++; puissance(); } }
  function somme() { produit(); while (peek() === '+' || peek() === '-') { i++; produit(); } }
  try {
    somme();
    if (i < toks.length) fail(`symbole inattendu « ${toks[i]} »`);
    return null;
  } catch (e) {
    return e.message;
  }
}

const BORNE = /^(-?(\d+(\.\d+)?|\d+\/\d+)|[-+]inf)$/;
function checkIntervalle(s) {
  const m = String(s).trim().match(/^([\[\]])\s*([^;]+?)\s*;\s*([^;]+?)\s*([\[\]])$/);
  if (!m) return 'notation attendue : [a; b], ]a; b[, [1; +inf[…';
  const [, g, a, b, d] = m;
  if (!BORNE.test(a) || !BORNE.test(b)) return 'bornes invalides';
  if (a === '+inf' || b === '-inf') return 'bornes dans le mauvais ordre';
  if ((a === '-inf' && g === '[') || (b === '+inf' && d === ']')) return 'un infini est toujours exclu';
  return null;
}

function checkListe(v) {
  return Array.isArray(v) && v.length > 0 && v.every((x) => checkNombre(x) || typeof x === 'string');
}

function checkReponse(q, ou) {
  switch (q.type) {
    case 'qcm':
      if (!Array.isArray(q.choix) || q.choix.length < 2 || !q.choix.every(isBilingue)) err(ou, 'choix : au moins 2 choix { fr, en }');
      else if (!Array.isArray(q.bonnes) || !q.bonnes.length || !q.bonnes.every((b) => isInt(b, 0, q.choix.length - 1)))
        err(ou, `bonnes : indices entre 0 et ${q.choix.length - 1}`);
      break;
    case 'vrai-faux':
      if (typeof q.reponse !== 'boolean') err(ou, 'reponse : true ou false');
      break;
    case 'numeric':
      if (q.tolerance !== undefined) {
        if (typeof q.reponse !== 'number' || typeof q.tolerance !== 'number' || q.tolerance <= 0) err(ou, 'reponse et tolerance (> 0) doivent être des nombres');
      } else if (typeof q.reponse !== 'string' || !checkNombre(q.reponse)) err(ou, 'reponse exacte entre guillemets : "55", "-3/4", "0.125"');
      break;
    case 'expression': {
      if (!Array.isArray(q.variables) || !q.variables.every((v) => /^[a-zA-Z]\w*$/.test(v) && !FONCTIONS.includes(v))) {
        err(ou, 'variables : liste de noms, par ex. [n]');
        break;
      }
      const e = typeof q.reponse === 'string' ? checkExpression(q.reponse, q.variables) : 'reponse : chaîne attendue';
      if (e) err(ou, `reponse : ${e}`);
      break;
    }
    case 'ensemble':
    case 'n-uplet':
      if (!checkListe(q.reponse)) err(ou, 'reponse : liste non vide de nombres');
      else if (q.type === 'ensemble' && new Set(q.reponse.map(String)).size !== q.reponse.length) err(ou, 'reponse : éléments en double');
      break;
    case 'intervalle': {
      const e = checkIntervalle(q.reponse);
      if (e) err(ou, `reponse : ${e}`);
      break;
    }
    case 'ordre': {
      if (!Array.isArray(q.etapes) || q.etapes.length < 2 || !q.etapes.every(isBilingue)) {
        err(ou, 'etapes : au moins 2 étapes { fr, en }');
        break;
      }
      const n = q.etapes.length;
      if (q.dependances !== undefined) {
        if (!Array.isArray(q.dependances) || !q.dependances.every((p) => Array.isArray(p) && p.length === 2 && isInt(p[0], 0, n - 1) && isInt(p[1], 0, n - 1) && p[0] !== p[1]))
          err(ou, `dependances : paires [i, j] avec 0 ≤ i, j < ${n}`);
        else if (q.dependances.some(([a, b]) => a > b)) err(ou, 'dependances : l\'ordre donné dans etapes doit lui-même être correct (i < j)');
      }
      if (q.intrus !== undefined && (!Array.isArray(q.intrus) || !q.intrus.every(isBilingue))) err(ou, 'intrus : liste de { fr, en }');
      break;
    }
    case 'trous': {
      if (!isBilingue(q.texte)) { err(ou, 'texte : { fr, en }'); break; }
      if (!Array.isArray(q.trous) || !q.trous.length) { err(ou, 'trous : liste non vide'); break; }
      for (const lang of ['fr', 'en']) {
        const nums = new Set([...q.texte[lang].matchAll(/\{\{(\d+)\}\}/g)].map((m) => +m[1]));
        const attendus = q.trous.map((_, k) => k + 1);
        if (nums.size !== attendus.length || !attendus.every((k) => nums.has(k))) err(ou, `texte.${lang} : doit contenir {{1}} à {{${attendus.length}}}`);
      }
      q.trous.forEach((t, k) => {
        if (!['numeric', 'expression', 'ensemble', 'n-uplet', 'intervalle', 'qcm'].includes(t?.type)) err(`${ou} trou ${k + 1}`, 'type non pris en charge dans un trou');
        else checkReponse(t, `${ou} trou ${k + 1}`);
      });
      break;
    }
    case 'code': {
      if (!['pseudo', 'python'].includes(q.langage)) err(ou, 'langage : pseudo ou python');
      if (typeof q.fonction !== 'string' || !/^[a-z_]\w*$/.test(q.fonction)) err(ou, 'fonction : nom de la fonction à écrire');
      if (!isBilingue(q.squelette)) err(ou, 'squelette : { fr, en }');
      for (const k of ['tests', 'tests_caches']) {
        if (!Array.isArray(q[k]) || !q[k].length || !q[k].every((t) => Array.isArray(t?.entree) && t.sortie !== undefined))
          err(ou, `${k} : liste de { entree: [...], sortie }`);
      }
      break;
    }
    case 'simulation':
      if (!sims.has(q.simulation)) err(ou, `simulation : « ${q.simulation} » n'existe pas (voir src/lib/sims.ts)`);
      if (!q.cible || typeof q.cible !== 'object') err(ou, 'cible : objet décrivant le résultat attendu');
      break;
    case 'preuve':
      if (!isBilingue(q.elements_attendus)) err(ou, 'elements_attendus : { fr, en }');
      if (!isInt(q.bareme, 1, 20)) err(ou, 'bareme : entier entre 1 et 20');
      break;
  }
}

// --- Lecture et validation ---

const fichiers = fs.existsSync(SRC_DIR) ? fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.yaml')).sort() : [];
const notions = [];
const idsQuestions = new Map();

for (const f of fichiers) {
  const ou = `content/app/notions/${f}`;
  let n;
  try {
    n = YAML.parse(fs.readFileSync(path.join(SRC_DIR, f), 'utf8'));
  } catch (e) {
    err(ou, `YAML invalide (${e.message.split('\n')[0]})`);
    continue;
  }
  if (!n || typeof n !== 'object') { err(ou, 'fichier vide'); continue; }
  if (n.id !== f.replace(/\.yaml$/, '')) err(ou, `id « ${n.id} » différent du nom du fichier`);
  if (!THEMES.includes(n.theme)) err(ou, `theme : ${THEMES.join(' | ')}`);
  if (!isInt(n.niveau, 1, 10)) err(ou, 'niveau : entier de 1 à 10');
  if (n.chapitre !== undefined && !chapitres.has(n.chapitre)) err(ou, `chapitre « ${n.chapitre} » introuvable dans content/cours`);
  if (!isBilingue(n.titre)) err(ou, 'titre : { fr, en }');
  if (!isBilingue(n.fiche)) err(ou, 'fiche : { fr, en }');
  if (!Array.isArray(n.questions) || !n.questions.length) { err(ou, 'questions : liste non vide'); continue; }

  n.questions.forEach((q, k) => {
    const lieu = `${ou} question ${q?.id ?? `n° ${k + 1}`}`;
    if (!q || typeof q !== 'object') return err(lieu, 'question vide');
    if (typeof q.id !== 'string' || !/^[a-z0-9-]+$/.test(q.id)) err(lieu, 'id : minuscules, chiffres et tirets');
    else if (idsQuestions.has(q.id)) err(lieu, `id déjà utilisé dans ${idsQuestions.get(q.id)}`);
    else idsQuestions.set(q.id, f);
    if (!TYPES.includes(q.type)) return err(lieu, `type : ${TYPES.join(' | ')}`);
    if (!isInt(q.difficulte, 1, 5)) err(lieu, 'difficulte : entier de 1 à 5');
    if (!isBilingue(q.enonce)) err(lieu, 'enonce : { fr, en }');
    if (!isBilingue(q.explication)) err(lieu, 'explication : { fr, en }');
    if (q.indice !== undefined && !isBilingue(q.indice)) err(lieu, 'indice : { fr, en }');
    if (q.temps !== undefined && !isInt(q.temps, 5, 3600)) err(lieu, 'temps : secondes entre 5 et 3600');
    checkReponse(q, lieu);
  });
  notions.push(n);
}

if (erreurs.length) {
  console.error(`\n✗ Banque de questions de l'application : ${erreurs.length} erreur(s)\n`);
  for (const e of erreurs) console.error(`  - ${e}`);
  console.error('\nFormat : content/app/README.md\n');
  process.exit(1);
}

// --- Écriture des paquets ---

// Seuls les paquets sont recréés : public/app/download/ (APK) est laissé intact.
fs.rmSync(path.join(OUT_DIR, 'packs'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT_DIR, 'packs'), { recursive: true });

const ecrire = (rel, data) => {
  const json = JSON.stringify(data);
  fs.writeFileSync(path.join(OUT_DIR, rel), json);
  return { path: rel, sha256: crypto.createHash('sha256').update(json).digest('hex'), bytes: Buffer.byteLength(json) };
};

const groupes = new Map();
for (const n of notions) {
  const id = `${THEME_SLUG[n.theme]}-${n.niveau}`;
  if (!groupes.has(id)) groupes.set(id, { id, theme: n.theme, niveau: n.niveau, notions: [] });
  n.questions.sort((a, b) => a.difficulte - b.difficulte);
  groupes.get(id).notions.push(n);
}

const packs = [...groupes.values()]
  .sort((a, b) => THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme) || a.niveau - b.niveau)
  .map((g) => ({
    id: g.id,
    theme: g.theme,
    niveau: g.niveau,
    notions: g.notions.length,
    questions: g.notions.reduce((s, n) => s + n.questions.length, 0),
    ...ecrire(`packs/${g.id}.json`, { format: FORMAT, ...g }),
  }));

// Bibliothèque : les exercices du site (énoncés LaTeX, sans les solutions, qui restent en PDF en ligne).
const exoIndex = path.join(ROOT, 'public', 'data', 'exercices-index.json');
const exercices = fs.existsSync(exoIndex) ? JSON.parse(fs.readFileSync(exoIndex, 'utf8')).exercices : [];
const library = ecrire('library.json', {
  format: FORMAT,
  exercices: exercices.map((e) => ({
    id: e.id,
    titre: { fr: e.titre_fr, en: e.titre_en },
    theme: e.theme,
    niveau: e.niveau,
    difficulte: e.difficulte,
    source: e.sourceLabel,
    tags: e.tags,
    enonce: { fr: e.enonceTex, en: e.enonceTexEn },
    solution: e.a_solution ? e.pdfSolution : null,
  })),
});

const contenu = JSON.stringify({ packs, library });
fs.writeFileSync(
  path.join(OUT_DIR, 'manifest.json'),
  JSON.stringify({
    format: FORMAT,
    // La version ne change que si le contenu change : l'application ne retélécharge rien sinon.
    version: crypto.createHash('sha256').update(contenu).digest('hex').slice(0, 12),
    packs,
    library,
  }, null, 2),
);

const total = packs.reduce((s, p) => s + p.questions, 0);
console.log(`✓ Application : ${notions.length} notion(s), ${total} question(s), ${packs.length} paquet(s), ${exercices.length} exercice(s) en bibliothèque → public/app/`);
