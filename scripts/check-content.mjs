// Contrôle des contenus avant publication : redondances et compatibilité.
//   node scripts/check-content.mjs          (code de sortie 1 s'il y a une erreur)
// - quiz de l'application : identifiants uniques, mêmes énoncés posés deux fois ;
// - exercices : un même énoncé sous deux identifiants ;
// - compatibilité : content/app/compat.json (build minimal de l'application) cohérent avec release.json.
// Un doublon voulu se déclare dans content/doublons-acceptes.txt (une ligne : « id-a id-b »).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ROOT } from './content-lib.mjs';

const normalise = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\\(?:left|right|quad|qquad|,|;|!|ensuremath|displaystyle|textbf|textit|emph|mathrm)\b/g, '')
    .replace(/[^a-z0-9]+/g, '');

const acceptes = new Set();
const fichierAcceptes = path.join(ROOT, 'content', 'doublons-acceptes.txt');
if (fs.existsSync(fichierAcceptes)) {
  for (const l of fs.readFileSync(fichierAcceptes, 'utf8').split('\n')) {
    const t = l.replace(/#.*/, '').trim().split(/\s+/);
    if (t.length === 2) acceptes.add([...t].sort().join(' '));
  }
}
const permis = (a, b) => acceptes.has([a, b].sort().join(' '));

const erreurs = [];

// --- quiz de l'application
const dirNotions = path.join(ROOT, 'content', 'app', 'notions');
const idsNotions = new Map();
const idsQuestions = new Map();
const textes = new Map();
for (const f of fs.readdirSync(dirNotions).filter((x) => x.endsWith('.yaml')).sort()) {
  const n = YAML.parse(fs.readFileSync(path.join(dirNotions, f), 'utf8'));
  if (idsNotions.has(n.id)) erreurs.push(`notion « ${n.id} » définie dans ${idsNotions.get(n.id)} et ${f}`);
  idsNotions.set(n.id, f);
  for (const q of n.questions ?? []) {
    if (idsQuestions.has(q.id)) erreurs.push(`question « ${q.id} » : identifiant déjà pris (${idsQuestions.get(q.id)} et ${f})`);
    idsQuestions.set(q.id, f);
    const cle = normalise(q.enonce?.fr) + '|' + JSON.stringify(q.reponse ?? q.bonnes ?? '');
    if (normalise(q.enonce?.fr).length < 12) continue;
    const autre = textes.get(cle);
    if (autre && !permis(autre, q.id)) erreurs.push(`questions « ${autre} » et « ${q.id} » : même énoncé et même réponse (redondance)`);
    else textes.set(cle, q.id);
  }
}

// --- exercices de la bibliothèque
const dirExos = path.join(ROOT, 'content', 'exercices');
const vus = new Map();
for (const d of fs.readdirSync(dirExos).sort()) {
  const dir = path.join(dirExos, d);
  if (!fs.statSync(dir).isDirectory()) continue;
  const metaPath = path.join(dir, 'meta.yaml');
  if (fs.existsSync(metaPath)) {
    const meta = YAML.parse(fs.readFileSync(metaPath, 'utf8'));
    if (meta.id !== d) erreurs.push(`exercice ${d} : « id » (${meta.id}) différent du nom du dossier`);
  }
  const tex = ['enonce.fr.tex', 'enonce.tex'].map((x) => path.join(dir, x)).find((x) => fs.existsSync(x));
  if (!tex) continue;
  const cle = normalise(fs.readFileSync(tex, 'utf8'));
  if (cle.length < 40) continue; // énoncé trop court pour comparer sans faux positifs
  const autre = vus.get(cle);
  if (autre && !permis(autre, d)) erreurs.push(`exercices « ${autre} » et « ${d} » : énoncés identiques (redondance)`);
  else vus.set(cle, d);
}

// --- compatibilité
const compatPath = path.join(ROOT, 'content', 'app', 'compat.json');
if (fs.existsSync(compatPath)) {
  const compat = JSON.parse(fs.readFileSync(compatPath, 'utf8'));
  const rel = path.join(ROOT, 'app', 'release.json');
  if (!Number.isInteger(compat.minAppBuild) || compat.minAppBuild < 1) erreurs.push('content/app/compat.json : minAppBuild doit être un entier ≥ 1');
  else if (fs.existsSync(rel)) {
    const latest = JSON.parse(fs.readFileSync(rel, 'utf8')).latest?.build;
    if (Number.isInteger(latest) && compat.minAppBuild > latest)
      erreurs.push(`content/app/compat.json : minAppBuild (${compat.minAppBuild}) dépasse le build publié (${latest}) : publier l'application d'abord`);
  }
}

if (erreurs.length) {
  console.error(`✗ Contenus : ${erreurs.length} problème(s)\n` + erreurs.map((e) => '  - ' + e).join('\n'));
  console.error('\nUn doublon voulu se déclare dans content/doublons-acceptes.txt (« id-a id-b »).');
  process.exit(1);
}
console.log(`✓ Contenus : ${idsNotions.size} notions, ${idsQuestions.size} questions, ${vus.size} énoncés d'exercices comparés, aucune redondance`);
