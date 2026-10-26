// Génère les images d'aperçu de partage (Open Graph, 1200 × 630) de chaque contenu :
//   public/og/<type>/<id>-<lang>.jpg   avec type ∈ sim, exo, cours, sujet, news, page.
// - simulation : une illustration dédiée (scripts/og-art.mjs) + titre + chapitre ;
// - exercice / chapitre de cours / sujet : la première page du PDF compilé (pdftoppm) ;
// - actualité : la photo de l'article recadrée, avec le titre ;
// - pages : photo ou composition de marque.
// Un manifeste de hash évite de régénérer ce qui n'a pas changé (public/og/ est mis en
// cache par la CI). Sans pdftoppm ou sans PDF, on retombe sur une carte de marque.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import YAML from 'yaml';
import { ROOT, loadExercices, loadSujets, loadCours, sourceLabel } from './content-lib.mjs';
import { sims } from '../src/lib/sims.ts';
import { partnerLogos } from '../src/lib/partners.ts';
import { art, fallbackArt } from './og-art.mjs';

const VERSION = 'v8'; // à incrémenter quand la mise en page change (invalide le cache)
const W = 1200;
const H = 630;
const OUT = path.join(ROOT, 'public', 'og');
const MANIFEST = path.join(OUT, 'manifest.json');
const FONT = "DejaVu Sans, Liberation Sans, Arial, sans-serif";
const LANGS = ['fr', 'en'];

const T = {
  fr: { sim: 'Simulation', exo: 'Exercice', cours: 'Cours', sujet: 'Sujet de concours', news: 'Actualité', tagline: 'Club Olympiade Maths-Info de Madagascar' },
  en: { sim: 'Simulation', exo: 'Exercise', cours: 'Course', sujet: 'Competition paper', news: 'News', tagline: 'Maths & CS Olympiad Club of Madagascar' },
};

const sha = (x) => crypto.createHash('sha1').update(x).digest('hex');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileHash = (p) => (p && fs.existsSync(p) ? sha(fs.readFileSync(p)) : 'none');

/** Coupe un texte en lignes d'au plus `max` caractères (mots entiers), `maxLines` lignes. */
function wrap(txt, max, maxLines) {
  const words = String(txt).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, '') + '…';
    return kept;
  }
  return lines;
}
const textLines = (lines, x, y, size, lh, fill, weight = 700, anchor = 'start') =>
  lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-family="${FONT}">${esc(l)}</text>`).join('');

// Badge blanc arrondi avec l'emblème : lisible sur le fond vert des cartes.
const emblem = await sharp(path.join(ROOT, 'public', 'logo-emblem.png')).resize({ width: 92, height: 56, fit: 'inside' }).png().toBuffer();
const logoBuf = await sharp({ create: { width: 112, height: 84, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite([
    { input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="112" height="84"><rect width="112" height="84" rx="18" fill="#fff"/></svg>'), blend: 'dest-in' },
    { input: emblem, gravity: 'center' },
  ])
  .png()
  .toBuffer();

/** Fond + en-tête de marque communs aux cartes à illustration. */
function bgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b2a15"/><stop offset="0.6" stop-color="#14532d"/><stop offset="1" stop-color="#1d7a33"/></linearGradient>
    <filter id="sh" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.35"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1100" cy="40" r="230" fill="#ffffff" opacity="0.04"/><circle cx="80" cy="640" r="200" fill="#ffffff" opacity="0.05"/>`;
}
const brandHeader = (lang) =>
  `<text x="160" y="92" font-size="38" font-weight="800" fill="#fff" font-family="${FONT}">COMI<tspan fill="#fca5a5">Ma</tspan></text>` +
  `<text x="160" y="120" font-size="17" fill="#d1fae5" font-family="${FONT}">${esc(T[lang].tagline.length > 52 ? T[lang].tagline.slice(0, 50) + '…' : T[lang].tagline)}</text>`;

/** Carte avec illustration à droite. `artSvg` est dessiné dans un carré blanc 480 × 500. */
async function cardWithArt({ lang, kicker, title, artSvg, raster, out }) {
  // Taille de police adaptée : le titre doit tenir dans la colonne de gauche (≈ 570 px).
  let size = 36;
  let lines = wrap(title, 24, 5);
  for (const sz of [58, 50, 44, 38, 34]) {
    const maxChars = Math.floor(570 / (sz * 0.64));
    const l = wrap(title, maxChars, 6);
    const fits = l.length <= (sz >= 50 ? 4 : 5) && !l[l.length - 1].endsWith('…');
    if (fits || sz === 34) {
      size = sz;
      lines = l;
      break;
    }
  }
  const lh = size * 1.18;
  const kick = wrap(kicker, 44, 2);
  const startY = Math.max(340 - ((lines.length - 1) * lh) / 2 + 30, 205 + kick.length * 30 + size * 0.85);
  let svg = bgSvg();
  svg += `<rect x="670" y="65" width="480" height="500" rx="30" fill="#fff" filter="url(#sh)"/>`;
  if (artSvg) svg += `<g transform="translate(680,75) scale(0.96)">${artSvg}</g>`;
  svg += brandHeader(lang);
  svg += textLines(kick, 60, 210, 22, 28, '#bbf7d0', 700);
  svg += textLines(lines, 60, startY, size, lh, '#fff', 800);
  svg += `<text x="60" y="590" font-size="26" fill="#d1fae5" font-weight="600" font-family="${FONT}">www.comima.mg</text></svg>`;
  const layers = [{ input: logoBuf, left: 60, top: 54 }];
  if (raster) layers.push(raster);
  await sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
}

/** Carte photo plein cadre avec bandeau de titre. */
async function cardWithPhoto({ lang, kicker, title, photo, out }) {
  // Corps du titre : le plus grand qui tienne en 3 lignes dans 1080 px (chiffres larges : ~0,66 em).
  let size = 56;
  let lines = wrap(title, Math.floor(1080 / (size * 0.66)), 3);
  for (const sz of [56, 50, 46, 42]) {
    size = sz;
    lines = wrap(title, Math.floor(1080 / (sz * 0.66)), 3);
    if (!lines.at(-1).endsWith('…')) break;
  }
  const lh = size * 1.15;
  const bandTop = H - 60 - lines.length * lh - 90;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.82"/></linearGradient>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
    <rect width="${W}" height="190" fill="url(#t)"/>
    <rect y="${bandTop - 60}" width="${W}" height="${H - bandTop + 60}" fill="url(#g)"/>
    <text x="160" y="92" font-size="38" font-weight="800" fill="#fff" font-family="${FONT}">COMI<tspan fill="#fca5a5">Ma</tspan></text>
    ${textLines(wrap(kicker, 62, 2), 60, bandTop + 8 - (wrap(kicker, 62, 2).length - 1) * 28, 22, 28, '#bbf7d0', 700)}
    ${textLines(lines, 60, bandTop + 78, size, lh, '#fff', 800)}
    <text x="${W - 60}" y="${H - 28}" font-size="24" fill="#e5e7eb" font-weight="600" text-anchor="end" font-family="${FONT}">www.comima.mg</text></svg>`;
  await sharp(photo)
    .rotate()
    .resize(W, H, { fit: 'cover', position: 'attention' })
    .composite([{ input: Buffer.from(svg) }, { input: logoBuf, left: 60, top: 54 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  void lang;
}

/** Première page d'un PDF → PNG (pdftoppm). Renvoie un Buffer ou null. */
function pdfFirstPage(pdf) {
  if (!fs.existsSync(pdf)) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
  try {
    const base = path.join(tmp, 'p');
    const r = spawnSync('pdftoppm', ['-png', '-r', '110', '-f', '1', '-l', '1', '-singlefile', pdf, base], { stdio: 'ignore' });
    if (r.status !== 0) return null;
    return fs.readFileSync(`${base}.png`);
  } catch {
    return null;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** Page de PDF recadrée sur son contenu, puis ajustée au cadre blanc (440 × 460) de la carte. */
async function pageLayer(png) {
  // On écarte le pied de page (numéro de page) avant de recadrer sur le contenu.
  const meta = await sharp(png).metadata();
  const body = await sharp(png).extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * 0.87) }).png().toBuffer();
  const trimmed = await sharp(body).trim({ background: '#ffffff', threshold: 24 }).extend({ top: 10, bottom: 10, left: 12, right: 12, background: '#ffffff' }).png().toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  const scale = Math.min(2.2, 440 / width);
  // Contenu trop long : on garde le haut (l'énoncé) ; sinon on agrandit un peu pour rester lisible.
  const keepH = Math.min(height, Math.round(460 / scale));
  const buf = await sharp(trimmed.data)
    .extract({ left: 0, top: 0, width, height: keepH })
    .resize({ width: Math.round(width * scale), kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const finalW = Math.round(width * scale);
  const finalH = Math.round(keepH * scale);
  return { input: buf, left: Math.round(690 + (440 - finalW) / 2), top: Math.round(85 + (460 - finalH) / 2) };
}

/** Feuille stylisée (quand le PDF n'est pas encore compilé). */
const paperArt = (heading) => {
  const bars = Array.from({ length: 9 }, (_, i) => `<rect x="${70}" y="${190 + i * 30}" width="${i % 4 === 3 ? 220 : 360}" height="10" rx="5" fill="#d1d5db"/>`).join('');
  return `<rect x="55" y="40" width="390" height="430" rx="14" fill="#fff" stroke="#1f2937" stroke-width="4"/><rect x="70" y="62" width="130" height="14" rx="7" fill="#1d7a33"/><text x="70" y="128" font-size="40" font-weight="800" fill="#1d7a33" font-family="${FONT}">${esc(heading)}</text><rect x="70" y="150" width="360" height="4" fill="#d6362b"/>${bars}`;
};

const themeArt = (themes = []) => {
  const th = themes[0] ?? '';
  const g = (inner) => `<g>${inner}</g>`;
  const glyph = {
    arithmétique: `<text x="250" y="300" font-size="150" text-anchor="middle" font-weight="800" fill="#1d7a33" font-family="${FONT}">a≡b</text><text x="250" y="380" font-size="48" text-anchor="middle" fill="#6b7280" font-family="${FONT}">(mod m)</text>`,
    géométrie: `<polygon points="90,380 410,380 250,110" fill="rgba(29,122,51,0.25)" stroke="#1d7a33" stroke-width="8"/><circle cx="250" cy="300" r="140" fill="none" stroke="#2563eb" stroke-width="6" stroke-dasharray="14 10"/>`,
    combinatoire: Array.from({ length: 25 }, (_, i) => `<circle cx="${100 + (i % 5) * 75}" cy="${100 + Math.floor(i / 5) * 75}" r="22" fill="${i % 3 === 0 ? '#d6362b' : '#1d7a33'}"/>`).join(''),
    algèbre: `<text x="250" y="270" font-size="120" text-anchor="middle" font-weight="800" fill="#1d7a33" font-family="${FONT}">x² + y²</text><text x="250" y="370" font-size="64" text-anchor="middle" fill="#6b7280" font-family="${FONT}">≥ 2xy</text>`,
    analyse: `<path d="M60 400 C 150 400, 180 100, 260 100 S 380 400, 440 150" fill="none" stroke="#1d7a33" stroke-width="10"/><line x1="40" y1="420" x2="470" y2="420" stroke="#1f2937" stroke-width="4"/>`,
    informatique: `<text x="250" y="320" font-size="170" text-anchor="middle" font-weight="800" fill="#1d7a33" font-family="${FONT}">{ }</text>`,
  };
  return g(glyph[th] ?? fallbackArt());
};

// --------------------------------------------------------------------------
// Collecte des travaux
// --------------------------------------------------------------------------
const jobs = []; // { key, out, hash, run }
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const newManifest = {};

function addJob(kind, id, lang, spec, sourceHash, run) {
  const rel = `${kind}/${id}-${lang}.jpg`;
  const out = path.join(OUT, rel);
  const hash = sha(VERSION + JSON.stringify(spec) + sourceHash);
  jobs.push({ rel, out, hash, run });
}

const coursById = new Map(loadCours().map(({ meta }) => [meta.id, meta]));
const chapterTitle = (id, lang) => {
  const m = coursById.get(id);
  return m ? (lang === 'fr' ? m.titre_fr : m.titre_en ?? m.titre_fr) : id;
};
const hasPdftoppm = spawnSync('pdftoppm', ['-v'], { stdio: 'ignore' }).status === 0 || spawnSync('pdftoppm', ['-h'], { stdio: 'ignore' }).status === 0;
if (!hasPdftoppm) console.warn('⚠ pdftoppm introuvable : aperçus de PDF remplacés par des cartes de marque.');

// Simulations
for (const s of sims) {
  const artSvg = (art[s.slug] ?? fallbackArt)();
  for (const lang of LANGS) {
    addJob('sim', s.slug, lang, { t: s.title[lang], c: chapterTitle(s.chapter, lang), a: sha(artSvg) }, '', async (out) =>
      cardWithArt({ lang, kicker: `${T[lang].sim} · ${chapterTitle(s.chapter, lang)}`, title: s.title[lang], artSvg, out }),
    );
  }
}

// Exercices (énoncé : première page du PDF)
for (const { meta } of loadExercices()) {
  for (const lang of LANGS) {
    const pdfName = lang === 'en' && fs.existsSync(path.join(ROOT, 'public/pdfs/exercices', meta.id, 'enonce-en.pdf')) ? 'enonce-en.pdf' : 'enonce.pdf';
    const pdf = path.join(ROOT, 'public/pdfs/exercices', meta.id, pdfName);
    const title = lang === 'fr' ? meta.titre_fr : meta.titre_en ?? meta.titre_fr;
    addJob('exo', meta.id, lang, { t: title, s: sourceLabel(meta), th: meta.theme }, fileHash(pdf), async (out) => {
      const png = hasPdftoppm ? pdfFirstPage(pdf) : null;
      let raster = null;
      let artSvg = null;
      if (png) {
        const l = await pageLayer(png);
        raster = { input: l.input, left: l.left, top: l.top };
      } else artSvg = themeArt(meta.theme);
      await cardWithArt({ lang, kicker: `${T[lang].exo} · ${sourceLabel(meta) || 'COMIMa'}`, title, artSvg, raster, out });
    });
  }
}

// Chapitres de cours
for (const { meta, pdfPath } of loadCours()) {
  const pdf = path.join(ROOT, 'public/pdfs/cours', meta.id, 'cours.pdf');
  for (const lang of LANGS) {
    const title = lang === 'fr' ? meta.titre_fr : meta.titre_en ?? meta.titre_fr;
    addJob('cours', meta.id, lang, { t: title }, fileHash(fs.existsSync(pdf) ? pdf : pdfPath), async (out) => {
      const src = fs.existsSync(pdf) ? pdf : pdfPath;
      const png = hasPdftoppm ? pdfFirstPage(src) : null;
      let raster = null;
      if (png) {
        const l = await pageLayer(png);
        raster = { input: l.input, left: l.left, top: l.top };
      }
      await cardWithArt({ lang, kicker: `${T[lang].cours} · COMIMa`, title, artSvg: raster ? null : paperArt(title.split('—')[0].trim().slice(0, 14)), raster, out });
    });
  }
}

// Sujets de concours
for (const { meta } of loadSujets()) {
  const pdf = path.join(ROOT, 'public/pdfs/sujets', meta.id, 'epreuve.pdf');
  for (const lang of LANGS) {
    const title = lang === 'fr' ? meta.titre_fr : meta.titre_en ?? meta.titre_fr;
    addJob('sujet', meta.id, lang, { t: title, s: sourceLabel(meta) }, fileHash(pdf), async (out) => {
      const png = hasPdftoppm ? pdfFirstPage(pdf) : null;
      let raster = null;
      if (png) {
        const l = await pageLayer(png);
        raster = { input: l.input, left: l.left, top: l.top };
      }
      await cardWithArt({ lang, kicker: `${T[lang].sujet} · ${sourceLabel(meta) || 'COMIMa'}`, title, artSvg: raster ? null : paperArt(sourceLabel(meta).split('·')[0].trim().slice(0, 14) || 'Sujet'), raster, out });
    });
  }
}

// Actualités : photo de l'article
const newsDir = path.join(ROOT, 'src', 'content', 'actualites');
for (const lang of LANGS) {
  const dir = path.join(newsDir, lang);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) continue;
    const data = YAML.parse(m[1]);
    const body = m[2];
    const inBody = body.match(/(?:!\[[^\]]*\]\(|src=")(\/uploads\/[^)\s"]+)/)?.[1];
    const img = data.image ?? (data.photos ?? [])[0] ?? inBody;
    const photo = img ? path.join(ROOT, 'public', img.replace(/^\//, '')) : null;
    const slug = file.replace(/\.mdx$/, '');
    const usable = photo && fs.existsSync(photo);
    addJob('news', slug, lang, { t: data.titre, p: img ?? '' }, usable ? fileHash(photo) : 'none', async (out) => {
      if (usable) await cardWithPhoto({ lang, kicker: `${T[lang].news} · ${new Date(data.date).toISOString().slice(0, 10)}`, title: data.titre, photo, out });
      else await cardWithArt({ lang, kicker: T[lang].news, title: data.titre, artSvg: themeArt(['combinatoire']), out });
    });
  }
}

// Pages
const PAGES = {
  home: { fr: ['COMIMa', 'Préparer les talents Malagasy aux olympiades de mathématiques et d’informatique'], en: ['COMIMa', 'Preparing Malagasy talents for mathematics and computer science olympiads'] },
  news: { fr: ['Actualités', 'Les nouvelles du club, des centres et des camps'], en: ['News', 'News from the club, its centres and camps'] },
  courses: { fr: ['Cours', 'Les chapitres du recueil « Techniques de résolution de problèmes »'], en: ['Courses', 'Chapters of the “Problem-solving techniques” booklet'] },
  resources: { fr: ['Ressources', 'Exercices corrigés d’olympiades, par thème et par niveau'], en: ['Resources', 'Olympiad exercises with solutions, by theme and level'] },
  papers: { fr: ['Sujets de concours', 'Épreuves et corrigés : IMO, olympiades nationales…'], en: ['Competition papers', 'Papers and solutions: IMO, national olympiads…'] },
  generator: { fr: ['Générateur de sujets', 'Compose ta feuille d’entraînement en PDF'], en: ['Paper generator', 'Build your own training sheet as a PDF'] },
  about: { fr: ['À propos', 'Une association nationale, cinq centres, des bénévoles passionnés'], en: ['About', 'A national association, five centres, passionate volunteers'] },
  contact: { fr: ['Contact', 'Le bureau, les encadrants et la page Facebook du club'], en: ['Contact', 'The board, the coaches and the club’s Facebook page'] },
  legal: { fr: ['Mentions légales', 'COMIMa — Madagascar'], en: ['Legal notice', 'COMIMa — Madagascar'] },
  partners: { fr: ['Partenaires et associations', 'Animath, Campus France, Fianarako, AEMIA, MahKinga, iMatematiko'], en: ['Partners and associations', 'Animath, Campus France, Fianarako, AEMIA, MahKinga, iMatematiko'] },
  simulations: { fr: ['Simulations interactives', '18 expériences pour conjecturer, une par page'], en: ['Interactive simulations', '18 experiments to conjecture, one per page'] },
  training: { fr: ['Entraînement', 'Des quiz corrigés à l’instant, notion par notion'], en: ['Training', 'Instantly graded quizzes, topic by topic'] },
  app: { fr: ['L’application COMIMa', 'S’entraîner hors ligne sur Android'], en: ['The COMIMa app', 'Practise offline on Android'] },
};
const heroPhoto = path.join(ROOT, 'public', 'uploads', 'cloture-camp-2026-01.jpg');
for (const [key, byLang] of Object.entries(PAGES)) {
  for (const lang of LANGS) {
    const [title, sub] = byLang[lang];
    const spec = { title, sub, key };
    if (key === 'partners') {
      addJob('page', key, lang, spec, sha(partnerLogos.map((p) => fileHash(path.join(ROOT, 'public', p.logo))).join()), async (out) => {
        const cells = await Promise.all(
          partnerLogos.map(async (p, i) => {
            const buf = await sharp(path.join(ROOT, 'public', p.logo)).resize(190, 110, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).png().toBuffer();
            return { input: buf, left: 690 + (i % 2) * 215, top: 105 + Math.floor(i / 2) * 150 };
          }),
        );
        await cardWithArt({ lang, kicker: 'COMIMa', title: `${title}`, artSvg: null, raster: null, out });
        const base = await sharp(out).composite(cells).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
        fs.writeFileSync(out, base);
      });
    } else if (key === 'simulations') {
      const four = ['regions-du-cercle', 'pavages-en-l', 'droite-d-euler', 'triangle-de-pascal'];
      const mosaic = four.map((slug, i) => `<g transform="translate(${(i % 2) * 235 + 5},${Math.floor(i / 2) * 245 + 5}) scale(0.46)">${art[slug]()}</g>`).join('');
      addJob('page', key, lang, spec, sha(mosaic), (out) => cardWithArt({ lang, kicker: '🧪 COMIMa', title, artSvg: mosaic, out }));
    } else if (key === 'home' || key === 'news' || key === 'about') {
      addJob('page', key, lang, spec, fileHash(heroPhoto), (out) => cardWithPhoto({ lang, kicker: sub, title, photo: heroPhoto, out }));
    } else {
      addJob('page', key, lang, spec, '', (out) => cardWithArt({ lang, kicker: sub, title, artSvg: themeArt(key === 'resources' || key === 'training' ? ['arithmétique'] : key === 'courses' || key === 'app' ? ['analyse'] : key === 'papers' ? ['géométrie'] : ['combinatoire']), out }));
    }
  }
}

// --------------------------------------------------------------------------
// Exécution (4 en parallèle), avec saut des images à jour
// --------------------------------------------------------------------------
let done = 0;
let skipped = 0;
let failed = 0;
const queue = [...jobs];
async function worker() {
  for (let job = queue.shift(); job; job = queue.shift()) {
    newManifest[job.rel] = job.hash;
    if (manifest[job.rel] === job.hash && fs.existsSync(job.out)) {
      skipped++;
      continue;
    }
    try {
      fs.mkdirSync(path.dirname(job.out), { recursive: true });
      await job.run(job.out);
      done++;
    } catch (err) {
      failed++;
      console.warn(`⚠ aperçu non généré (${job.rel}) : ${err.message}`);
      delete newManifest[job.rel];
    }
  }
}
fs.mkdirSync(OUT, { recursive: true });
await Promise.all(Array.from({ length: 4 }, worker));
// Purge des images devenues orphelines
for (const rel of Object.keys(manifest)) if (!newManifest[rel]) fs.rmSync(path.join(OUT, rel), { force: true });
fs.writeFileSync(MANIFEST, JSON.stringify(newManifest));
console.log(`✔ Aperçus de partage : ${done} générés, ${skipped} à jour${failed ? `, ${failed} en échec` : ''} (${jobs.length} au total) → public/og/`);
