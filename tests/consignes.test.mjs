import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

// Claude et Codex lisent des consignes identiques : si l'un est modifié sans l'autre, les deux outils se contredisent.
test('CLAUDE.md et AGENTS.md sont identiques (sauf le titre)', () => {
  execFileSync(process.execPath, ['scripts/sync-consignes.mjs', '--check'], { stdio: 'pipe' });
});

// Une seule source pour les tâches : le tableau, et des liens qui existent.
test('docs/TACHES.md : les fichiers cités existent', () => {
  const t = fs.readFileSync('docs/TACHES.md', 'utf8');
  for (const m of t.matchAll(/\]\(([A-Za-z0-9_./-]+\.md)\)/g)) assert.ok(fs.existsSync(`docs/${m[1]}`), `lien cassé dans TACHES.md : ${m[1]}`);
});
