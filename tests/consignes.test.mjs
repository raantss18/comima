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

test('avancement : cases [x] = 1, [~] = 0,5, [ ] = 0 ; sections lointaines comptées à part', async () => {
  const { count, points, total, pct, lointaine } = await import('../scripts/avancement.mjs');
  const secs = count('## Plan\n- [x] a\n- [~] b\n- [ ] c\n  - [ ] d\n\n## Phase 2 — défis\n- [ ] e\n');
  assert.equal(secs.length, 2);
  assert.equal(points(secs[0]), 1.5);
  assert.equal(total(secs[0]), 4);
  assert.equal(pct(points(secs[0]), total(secs[0])), 38);
  assert.equal(lointaine(secs[1].titre), true);
  assert.equal(lointaine(secs[0].titre), false);
});
