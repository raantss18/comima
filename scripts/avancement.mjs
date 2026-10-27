#!/usr/bin/env node
// Avancement chiffré des todos : compte les cases des fichiers de tâches.
//   [x] fait = 1    [~] en partie = 0,5    [ ] à faire = 0
// Le pourcentage = points obtenus / nombre de cases. Une case est une tâche de taille variable : c'est un indicateur de
// suivi, pas une promesse de calendrier ; la ventilation par fichier et par section montre où se trouve le reste.
//
//   node scripts/avancement.mjs            affiche le tableau
//   node scripts/avancement.mjs --write    met à jour docs/AVANCEMENT.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FILES = [
  ['docs/TACHES.md', 'Tableau des tâches (jalons, Antsa, Heritiana)'],
  ['docs/TODO.md', 'Site : carnet détaillé'],
  ['docs/app/TODO.md', 'Application : carnet détaillé'],
];

/** Compte les cases d'un texte markdown, par section de niveau 2 (« ## »). */
export function count(text) {
  const sections = [];
  let cur = { titre: '(début)', fait: 0, partiel: 0, afaire: 0 };
  for (const line of text.split('\n')) {
    const h = line.match(/^##\s+(.*)/);
    if (h) {
      sections.push(cur);
      cur = { titre: h[1].replace(/[`*]/g, '').trim(), fait: 0, partiel: 0, afaire: 0 };
      continue;
    }
    const m = line.match(/^\s*[-*]\s+\[( |x|X|~)\]\s/);
    if (!m) continue;
    if (m[1] === ' ') cur.afaire++;
    else if (m[1] === '~') cur.partiel++;
    else cur.fait++;
  }
  sections.push(cur);
  return sections.filter((s) => s.fait + s.partiel + s.afaire > 0);
}

export const total = (s) => s.fait + s.partiel + s.afaire;
export const points = (s) => s.fait + 0.5 * s.partiel;
export const pct = (p, t) => (t ? Math.round((100 * p) / t) : 0);

/** Sections lointaines (défis, classements, duels, preuves) : comptées à part pour ne pas masquer l'avancement du plan en cours. */
export const lointaine = (titre) => /^Phase [23]\b/.test(titre);

export function rapport(read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8')) {
  const out = [];
  let P = 0;
  let T = 0;
  let P2 = 0;
  let T2 = 0;
  for (const [f, titre] of FILES) {
    const secs = count(read(f));
    const p = secs.reduce((a, s) => a + points(s), 0);
    const t = secs.reduce((a, s) => a + total(s), 0);
    P += p;
    T += t;
    for (const sec of secs) {
      if (lointaine(sec.titre)) continue;
      P2 += points(sec);
      T2 += total(sec);
    }
    out.push({ f, titre, secs, p, t });
  }
  return { fichiers: out, p: P, t: T, p2: P2, t2: T2 };
}

export function markdown(r, date = new Date().toISOString().slice(0, 10)) {
  const L = [];
  L.push('# Avancement chiffré', '');
  L.push(`> Généré le ${date} par \`node scripts/avancement.mjs --write\` (ne pas modifier à la main).`);
  L.push('> Méthode : chaque case `[x]` des fichiers de tâches vaut 1, `[~]` (en partie) 0,5, `[ ]` 0. Pourcentage = points / cases.');
  L.push('> Les cases sont de tailles inégales : c\'est un indicateur de suivi, pas un calendrier.', '');
  L.push(`## Au total : **${pct(r.p, r.t)} %** fait (${r.p.toFixed(1).replace('.0', '')} sur ${r.t} cases)`, '');
  L.push(`Sans les phases lointaines (défis, classements, duels en direct, preuves : « Phase 2 » et « Phase 3 » de l'application) : **${pct(r.p2, r.t2)} %** (${r.p2.toFixed(1).replace('.0', '')} sur ${r.t2} cases).`, '');
  L.push('| Fichier | Fait | Cases | % |', '| --- | ---: | ---: | ---: |');
  for (const x of r.fichiers) L.push(`| [\`${x.f.replace('docs/', '')}\`](${x.f.replace('docs/', '')}) — ${x.titre} | ${x.p.toFixed(1).replace('.0', '')} | ${x.t} | ${pct(x.p, x.t)} % |`);
  L.push('', '## Où se trouve le reste (sections les plus ouvertes)', '', '| Section | Fichier | Reste | Cases |', '| --- | --- | ---: | ---: |');
  const rest = [];
  for (const x of r.fichiers) for (const s of x.secs) rest.push([s.titre, x.f.replace('docs/', ''), total(s) - points(s), total(s)]);
  rest.sort((a, b) => b[2] - a[2]);
  for (const [t, f, reste, n] of rest.slice(0, 8)) L.push(`| ${t.slice(0, 70)} | \`${f}\` | ${reste.toFixed(1).replace('.0', '')} | ${n} |`);
  return L.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = rapport();
  const md = markdown(r);
  if (process.argv.includes('--write')) {
    fs.writeFileSync(path.join(ROOT, 'docs', 'AVANCEMENT.md'), md);
    console.log('✓ docs/AVANCEMENT.md');
  }
  console.log(md);
}
