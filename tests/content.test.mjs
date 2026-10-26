import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

// Redondances (mêmes énoncés, identifiants en double) et compatibilité des contenus avec l'application.
test('contenus : aucune redondance, compatibilité cohérente', () => {
  const out = execFileSync(process.execPath, ['scripts/check-content.mjs'], { encoding: 'utf8' });
  assert.match(out, /aucune redondance/);
});

test('manifeste de l\'application : illustrations vérifiables et build minimal', () => {
  // Le manifeste est généré (non versionné) : on le produit si besoin, comme le fait le déploiement.
  if (!fs.existsSync('public/app/v1/manifest.json')) {
    execFileSync(process.execPath, ['scripts/build-index.mjs'], { stdio: 'ignore' });
    execFileSync(process.execPath, ['scripts/build-app-packs.mjs'], { stdio: 'ignore' });
  }
  const m = JSON.parse(fs.readFileSync('public/app/v1/manifest.json', 'utf8'));
  assert.ok(Number.isInteger(m.minAppBuild) && m.minAppBuild >= 1);
  assert.ok(m.figures.length >= 18);
  for (const f of m.figures) {
    assert.match(f.path, /^figures\/[a-z0-9-]+\.html$/);
    assert.match(f.sha256, /^[0-9a-f]{64}$/);
  }
});
