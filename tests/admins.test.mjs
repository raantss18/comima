import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { encrypt, decrypt, parseList, hashEmail } from '../scripts/admins.mjs';

test('liste des admins : lecture, doublons, adresses invalides', () => {
  assert.deepEqual(parseList('# bureau\nAntsa@Exemple.org\n\nantsa@exemple.org # doublon\nheri@exemple.org\n'), ['antsa@exemple.org', 'heri@exemple.org']);
  assert.throws(() => parseList('pas-un-email'), /adresse invalide/);
});

test('chiffrement de la liste : aller-retour, mauvaise phrase refusée, rien en clair', () => {
  const clair = 'antsa@exemple.org\nheri@exemple.org\n';
  const c = encrypt(clair, 'phrase secrète');
  assert.equal(decrypt(c, 'phrase secrète'), clair);
  assert.throws(() => decrypt(c, 'autre phrase'), /phrase secrète incorrecte/);
  assert.ok(!c.toString('latin1').includes('exemple.org'));
});

test('empreintes : salées, sensibles à la casse normalisée, illisibles', () => {
  assert.equal(hashEmail('s', 'A@b.org'), hashEmail('s', ' a@B.org '));
  assert.notEqual(hashEmail('s1', 'a@b.org'), hashEmail('s2', 'a@b.org'));
  assert.match(hashEmail('s', 'a@b.org'), /^[0-9a-f]{64}$/);
});

test('dépôt public : aucun e-mail dans public/admins.json, release-keys/ ignoré par Git', () => {
  if (fs.existsSync('public/admins.json')) assert.ok(!/@/.test(fs.readFileSync('public/admins.json', 'utf8')));
  assert.match(fs.readFileSync('.gitignore', 'utf8'), /^release-keys\/?$/m);
});
