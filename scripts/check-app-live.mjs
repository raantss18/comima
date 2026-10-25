// Après un déploiement : vérifie que le site SERT la dernière version de l'application, pour
// chacun des trois fichiers (arm64-v8a, armeabi-v7a, universel) et pour release.json.
//   - compare l'empreinte SHA-256 de ce que sert le site à app/release.json ;
//   - réessaie pendant ~5 min (la publication GitHub Pages n'est pas instantanée) ;
//   - code de sortie 1 si le site sert une autre version (ancienne ou corrompue).
// Usage : SITE_URL=https://www.comima.mg node scripts/check-app-live.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './content-lib.mjs';

const site = (process.env.SITE_URL ?? 'https://www.comima.mg').replace(/\/$/, '');
const base = process.env.BASE_PATH && process.env.BASE_PATH !== '/' ? process.env.BASE_PATH.replace(/\/$/, '') : '';
const { latest } = JSON.parse(fs.readFileSync(path.join(ROOT, 'app', 'release.json'), 'utf8'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

async function check() {
  const problems = [];
  const rel = await fetch(`${site}${base}/app/release.json?${Date.now()}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!rel) problems.push('release.json introuvable');
  else if (rel.latest.build !== latest.build) problems.push(`release.json en ligne : build ${rel.latest.build}, attendu ${latest.build}`);
  for (const abi of ['arm64-v8a', 'armeabi-v7a', 'universal']) {
    const res = await fetch(`${site}${base}/app/download/comima-${abi}.apk?${Date.now()}`).catch(() => null);
    if (!res?.ok) problems.push(`${abi} : introuvable (${res?.status ?? 'réseau'})`);
    else if (sha(Buffer.from(await res.arrayBuffer())) !== latest.apks[abi].sha256) problems.push(`${abi} : ce n'est pas la version ${latest.version}`);
  }
  return problems;
}

let problems = [];
for (let i = 0; i < Number(process.env.TRIES ?? 10); i++) {
  problems = await check();
  if (!problems.length) break;
  console.log(`… en attente de la publication (${i + 1}/10) : ${problems.join(' ; ')}`);
  await new Promise((r) => setTimeout(r, Number(process.env.WAIT_MS ?? 30000)));
}
if (problems.length) {
  console.error(`✗ Le site ne sert pas la dernière version (${latest.version}) : ${problems.join(' ; ')}`);
  process.exit(1);
}
console.log(`✓ ${site}/app/download/ sert bien la version ${latest.version} (3 fichiers vérifiés)`);
