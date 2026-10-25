// Copie les APK de la dernière version de l'application dans public/app/download/ pour qu'ils
// soient servis par comima.mg (adresses stables, pas de dépendance à GitHub pour l'utilisateur).
//   - source de vérité : app/release.json (URL + SHA-256 de chaque APK) ;
//   - chaque fichier est vérifié : une empreinte différente FAIT ÉCHOUER le build ;
//   - réseau absent ou fichier introuvable : simple avertissement (le site renvoie alors vers
//     la release GitHub, voir src/lib/app-release.ts) ;
//   - activé par FETCH_APK=1 (CI) pour ne pas télécharger ~50 Mo à chaque build local.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './content-lib.mjs';

if (process.env.FETCH_APK !== '1') process.exit(0);

const file = path.join(ROOT, 'app', 'release.json');
if (!fs.existsSync(file)) process.exit(0);
const { latest } = JSON.parse(fs.readFileSync(file, 'utf8'));
const out = path.join(ROOT, 'public', 'app', 'download');
fs.mkdirSync(out, { recursive: true });

// Les APK des anciennes versions ne sont pas conservés : seule la dernière est servie.
for (const f of fs.readdirSync(out)) fs.rmSync(path.join(out, f), { force: true });

let ok = 0;
for (const abi of ['arm64-v8a', 'armeabi-v7a', 'universal']) {
  const apk = latest.apks[abi];
  if (!apk) continue;
  try {
    const res = await fetch(apk.url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    if (sha !== apk.sha256) {
      console.error(`✗ ${abi} : empreinte ${sha} ≠ ${apk.sha256} (release.json) — APK refusé`);
      process.exit(1);
    }
    fs.writeFileSync(path.join(out, `comima-${abi}.apk`), buf);
    ok++;
  } catch (e) {
    console.warn(`⚠ ${abi} : téléchargement impossible (${e.message}) — le site renverra vers GitHub`);
  }
}
console.log(`✓ APK de la version ${latest.version} copiés pour le site : ${ok}/3 → public/app/download/`);
