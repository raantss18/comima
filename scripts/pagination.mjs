// Pagination continue du recueil (docs/STRUCTURE-COURS.md § 9) : chaque chapitre
// porte `page_debut` dans meta.yaml ; page_debut(n+1) = page_debut(n) + pages(n).
//   node scripts/pagination.mjs           vérifie (code 1 si incohérent)
//   node scripts/pagination.mjs --write   recalcule page_debut à partir de `pages`
//                                         (le chapitre 0 garde son page_debut : 5,
//                                         après les pages de garde)
// `pages` doit être le nombre de pages du PDF compilé : si le PDF existe et que
// pdfinfo est disponible, la vérification le contrôle aussi.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, loadCours } from './content-lib.mjs';

/** Nombre de pages d'un PDF, ou null (PDF absent ou pdfinfo introuvable). */
export function pdfPages(pdf) {
  if (!fs.existsSync(pdf)) return null;
  const r = spawnSync('pdfinfo', [pdf], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const m = r.stdout.match(/^Pages:\s+(\d+)/m);
  return m ? Number(m[1]) : null;
}

/** Chapitres triés par numéro : [{ id, dir, numero, pages, pageDebut }]. */
export function chapitres() {
  return loadCours()
    .map(({ meta, dir }) => ({
      id: meta.id,
      dir,
      numero: Number(meta.numero ?? 0),
      pages: Number(meta.pages),
      pageDebut: Number(meta.page_debut),
    }))
    .sort((a, b) => a.numero - b.numero);
}

/** Pagination attendue : le premier chapitre garde sa page, les suivants s'enchaînent. */
export function attendues(chs) {
  const out = [];
  let next = chs.length ? chs[0].pageDebut : 5;
  for (const c of chs) {
    out.push(next);
    next += c.pages;
  }
  return out;
}

function main() {
  const write = process.argv.includes('--write');
  const chs = chapitres();
  const expected = attendues(chs);
  let bad = 0;
  chs.forEach((c, i) => {
    if (!Number.isInteger(c.pages) || c.pages < 1) {
      console.error(`✘ ${c.id} : pages invalide`);
      bad++;
      return;
    }
    const reel = pdfPages(path.join(ROOT, 'public', 'pdfs', 'cours', c.id, 'cours.pdf'));
    if (reel != null && reel !== c.pages) {
      console.error(`✘ ${c.id} : pages = ${c.pages} mais le PDF compte ${reel} pages`);
      bad++;
    }
    if (c.pageDebut !== expected[i]) {
      if (write) {
        const f = path.join(c.dir, 'meta.yaml');
        const src = fs.readFileSync(f, 'utf8');
        const line = `page_debut: ${expected[i]}`;
        const out = /^page_debut:.*$/m.test(src)
          ? src.replace(/^page_debut:.*$/m, line)
          : src.replace(/^(pages:.*)$/m, `$1\n${line}`);
        fs.writeFileSync(f, out);
        console.log(`✎ ${c.id} : page_debut ${c.pageDebut} → ${expected[i]}`);
      } else {
        console.error(`✘ ${c.id} : page_debut = ${c.pageDebut}, attendu ${expected[i]}`);
        bad++;
      }
    }
  });
  if (bad) process.exit(1);
  console.log(`✔ Pagination continue cohérente (${chs.length} chapitres).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
