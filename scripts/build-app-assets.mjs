// Ressources de l'application tirées du site (à relancer quand les partenaires changent) :
//   app/assets/qr.png            — QR code de https://www.comima.mg/app/ (page de téléchargement)
//   app/assets/partners/*.png    — logos des partenaires (légers) + partners.json
// Les fichiers générés sont versionnés : construire l'APK n'exige pas ce script.
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { ROOT } from './content-lib.mjs';

const OUT = path.join(ROOT, 'app', 'assets');
fs.mkdirSync(path.join(OUT, 'partners'), { recursive: true });

// QR code : vert très foncé sur blanc (contraste élevé, lisible même sur un vieil écran).
await QRCode.toFile(path.join(OUT, 'qr.png'), 'https://www.comima.mg/app/', {
  width: 640,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#0f3d1b', light: '#ffffff' },
});

// Logos : lus dans src/lib/partners.ts (source unique du site).
const src = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'partners.ts'), 'utf8');
const list = [...src.matchAll(/id: '([^']+)',\s*name: '([^']+)',\s*url: '([^']*)'[^\n]*\n\s*logo: '([^']+)',\s*group: '([^']+)'/g)].map((m) => ({
  id: m[1], name: m[2], url: m[3], logo: m[4], group: m[5],
}));
const out = [];
for (const p of list.filter((x) => x.group !== 'coeur')) {
  const file = `${p.id}.png`;
  await sharp(path.join(ROOT, 'public', p.logo))
    .resize(300, 150, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png({ palette: true, quality: 80, compressionLevel: 9 })
    .toFile(path.join(OUT, 'partners', file));
  out.push({ id: p.id, name: p.name, url: p.url, file });
}
fs.writeFileSync(path.join(OUT, 'partners', 'partners.json'), JSON.stringify(out, null, 1) + '\n');
const kb = fs.readdirSync(path.join(OUT, 'partners')).reduce((s, f) => s + fs.statSync(path.join(OUT, 'partners', f)).size, 0) / 1024;
console.log(`✓ QR + ${out.length} logos de partenaires (${kb.toFixed(0)} Ko) → app/assets/`);
