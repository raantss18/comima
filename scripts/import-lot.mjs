// Importe un lot d'énoncés recopiés d'un livre ou d'un sujet (fichier YAML) dans
// content/exercices/<id>/ : meta.yaml, enonce.fr.tex, enonce.en.tex.
//   node scripts/import-lot.mjs lot.yaml [--force]
// Les énoncés sont recopiés à l'identique de la source (langue d'origine) ; l'autre langue est une
// traduction fidèle, signalée comme telle. La source est toujours citée (livre, chapitre, numéro,
// page, concours d'origine quand le livre le donne). Sans --force, un exercice existant n'est
// pas remplacé.
//
// Format du lot :
//   prefixe: engel-09            # id = <prefixe>-<numéro sur 2 chiffres>
//   source: { concours, annee, auteur, ouvrage, editeur, licence }
//   langue: en                   # langue de l'énoncé original
//   chapitre: { numero: 9, fr: Suites, en: Sequences }
//   defauts: { theme: [algèbre], niveau: prépa, difficulte: 3, tags: [...] }
//   problemes:
//     - { n: 1, page: 225, origine: "IMO 1995", nom: {fr, en}, theme, niveau, difficulte, tags, en: …, fr: … }
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { EXOS_DIR } from './content-lib.mjs';

const [fichier, ...opts] = process.argv.slice(2);
if (!fichier) {
  console.error('Usage : node scripts/import-lot.mjs lot.yaml [--force]');
  process.exit(1);
}
const force = opts.includes('--force');
const lot = YAML.parse(fs.readFileSync(fichier, 'utf8'));
const d = lot.defauts ?? {};
const ch = lot.chapitre;
const traduit = { en: 'fr', fr: 'en' }[lot.langue];
const NOTE_TRAD = {
  fr: '% Traduction française COMIMa de l\'énoncé original (anglais).',
  en: '% English translation (COMIMa) of the original (French) statement.',
};

let crees = 0;
let ignores = 0;
for (const p of lot.problemes) {
  const num = String(p.n).padStart(2, '0') + (p.suffixe ?? '');
  const id = `${lot.prefixe}-${num}`;
  const dir = path.join(EXOS_DIR, id);
  if (fs.existsSync(dir) && !force) {
    ignores++;
    continue;
  }
  for (const l of ['fr', 'en']) if (!p[l]?.trim()) throw new Error(`${id} : énoncé ${l} manquant`);
  const numero = ch ? `${ch.numero}.${p.n}` : String(p.n);
  const ref = [
    lot.source.ouvrage ? `${lot.source.auteur}, ${lot.source.ouvrage}` : lot.source.concours,
    ch ? `chapitre ${ch.numero} (${ch[lot.langue]})` : null,
    `problème ${p.n}`,
    p.page ? `p. ${p.page}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const titre = (l) =>
    p.nom?.[l] ? `${p.nom[l]} (${numero})` : ch ? `${ch[l]} — ${l === 'fr' ? 'problème' : 'problem'} ${numero}` : p.titre[l];
  const meta = {
    id,
    titre_fr: titre('fr'),
    titre_en: titre('en'),
    theme: p.theme ?? d.theme,
    niveau: p.niveau ?? d.niveau,
    difficulte: p.difficulte ?? d.difficulte,
    source: {
      concours: lot.source.concours,
      annee: lot.source.annee,
      ...(lot.source.pays ? { pays: lot.source.pays } : {}),
      reference: p.origine ? `${ref} — d'après ${p.origine}` : ref,
      ...(lot.source.url ? { url: lot.source.url } : {}),
      licence: lot.source.licence,
    },
    langue: lot.langue,
    tags: [...new Set([...(d.tags ?? []), ...(p.tags ?? []), ...(p.origine ? [p.origine.split(' ')[0]] : [])])],
    a_solution: false,
  };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'meta.yaml'), YAML.stringify(meta, { lineWidth: 0 }));
  for (const l of ['fr', 'en']) {
    const corps = p[l].trim() + '\n';
    fs.writeFileSync(path.join(dir, `enonce.${l}.tex`), l === traduit ? `${NOTE_TRAD[l]}\n${corps}` : corps);
  }
  crees++;
}
console.log(`✓ ${lot.prefixe} : ${crees} exercice(s) écrit(s), ${ignores} déjà présent(s) (--force pour remplacer)`);
