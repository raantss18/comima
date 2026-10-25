// Prépare les images d'un article sur l'application à partir de captures d'écran brutes.
//   node scripts/make-app-article-images.mjs <dossier-de-captures> <préfixe>
// Attend dans le dossier : s_home.png s_feedback.png s_solution.png s_stats.png s_about.png
// Écrit dans public/uploads : <préfixe>-01…05.jpg (captures à bords arrondis), <préfixe>-banniere.jpg
// (bannière 1400 × 700 pour l'aperçu de partage) et <préfixe>-qr.png.
// Les captures doivent être faites avec un profil neutre : aucun prénom dans un visuel public.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './content-lib.mjs';

const [dir, prefix = 'application-comima'] = process.argv.slice(2);
if (!dir) {
  console.error('usage : node scripts/make-app-article-images.mjs <dossier> [préfixe]');
  process.exit(1);
}
const out = path.join(ROOT, 'public', 'uploads');
const names = ['s_home', 's_feedback', 's_solution', 's_stats', 's_about'];

async function phone(file, width) {
  const img = sharp(path.join(dir, `${file}.png`));
  const meta = await img.metadata();
  const h = Math.round((width * meta.height) / meta.width);
  const r = Math.round(width * 0.075);
  const mask = Buffer.from(`<svg width="${width}" height="${h}"><rect width="${width}" height="${h}" rx="${r}" ry="${r}"/></svg>`);
  return { buf: await img.resize(width, h).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), w: width, h };
}

// Captures individuelles (fond blanc derrière les coins arrondis).
for (const [i, n] of names.entries()) {
  const p = await phone(n, 560);
  await sharp({ create: { width: p.w, height: p.h, channels: 3, background: '#ffffff' } })
    .composite([{ input: p.buf }])
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(out, `${prefix}-0${i + 1}.jpg`));
}

// Bannière : dégradé vert COMIMa, trois écrans qui débordent en bas (le titre vient par-dessus).
const W = 1400, H = 700;
const bg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f3d1b"/><stop offset="1" stop-color="#1d7a33"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1180" cy="120" r="260" fill="#ffffff" fill-opacity="0.06"/><circle cx="160" cy="620" r="220" fill="#d6362b" fill-opacity="0.18"/>
</svg>`);
// Trois écrans côte à côte, décalés en hauteur ; la partie gauche reste libre pour le titre.
const shots = [['s_stats', 300, 460, 100], ['s_home', 300, 765, 70], ['s_feedback', 300, 1070, 130]];
const layers = [];
for (const [n, w, x, y] of shots) {
  const p = await phone(n, w);
  const h = Math.min(p.h, H - y);
  const crop = await sharp(p.buf).extract({ left: 0, top: 0, width: p.w, height: h }).png().toBuffer();
  const r = Math.round(w * 0.075);
  const shadow = await sharp(
    Buffer.from(`<svg width="${w + 120}" height="${h + 120}"><rect x="60" y="70" width="${w}" height="${h + 40}" rx="${r}" fill="#000" fill-opacity="0.5"/></svg>`),
  )
    .blur(16)
    .png()
    .toBuffer();
  const sh = Math.min(h + 120, H - (y - 60));
  const sw = Math.min(w + 120, W - (x - 60));
  layers.push(
    { input: await sharp(shadow).extract({ left: 0, top: 0, width: sw, height: sh }).png().toBuffer(), left: x - 60, top: y - 60 },
    { input: crop, left: x, top: y },
  );
}
await sharp(bg).composite(layers).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(out, `${prefix}-banniere.jpg`));
await sharp(path.join(ROOT, 'app', 'assets', 'qr.png')).resize(360, 360).png({ compressionLevel: 9 }).toFile(path.join(out, `${prefix}-qr.png`));
const kb = fs.readdirSync(out).filter((f) => f.startsWith(prefix)).map((f) => `${f} ${(fs.statSync(path.join(out, f)).size / 1024).toFixed(0)} Ko`);
console.log('✓', kb.join(' · '));
