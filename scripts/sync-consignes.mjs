// AGENTS.md (Codex) et CLAUDE.md (Claude) donnent les MÊMES consignes : AGENTS.md est une copie de CLAUDE.md
// où seule la première ligne change. `node scripts/sync-consignes.mjs` recopie ; `--check` vérifie (utilisé par les tests).
import fs from 'node:fs';
import { ROOT } from './content-lib.mjs';

const claude = fs.readFileSync(`${ROOT}/CLAUDE.md`, 'utf8');
const attendu = claude.replace(/^# .*\n/, '# Consignes pour les sessions Codex (Antsa et ARHeritiana)\n');
const actuel = fs.existsSync(`${ROOT}/AGENTS.md`) ? fs.readFileSync(`${ROOT}/AGENTS.md`, 'utf8') : '';

if (process.argv.includes('--check')) {
  if (actuel !== attendu) {
    console.error('✗ AGENTS.md diffère de CLAUDE.md : lancer `node scripts/sync-consignes.mjs`');
    process.exit(1);
  }
  console.log('✓ AGENTS.md identique à CLAUDE.md');
} else {
  fs.writeFileSync(`${ROOT}/AGENTS.md`, attendu);
  console.log('✓ AGENTS.md synchronisé depuis CLAUDE.md');
}
