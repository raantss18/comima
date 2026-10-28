import test from 'node:test';
import assert from 'node:assert/strict';
import { studiedChapters } from '../src/scripts/training-reading.ts';

test('lectures : cours lus et exercices vus, sans étoiles seules ni sujets sans chapitre', () => {
  const marks = {
    'cours:00-exemples': { st: 'lu' },
    'cours:01-tiroirs': { st: 'fait' },
    'cours:02-invariants': { st: null, star: true },
    'exo:e1': { st: 'teste' },
    'exo:e2': { st: 'continuer' },
    'exo:e3': { st: null, star: true },
    'sujet:om-2026': { st: 'lu' },
    'exo:sans-chapitre': { st: 'lu' },
  };
  assert.deepEqual([...studiedChapters(marks, { e1: '03-algebre', e2: '03-algebre', e3: '04-geometrie' })].sort(),
    ['00-exemples', '01-tiroirs', '03-algebre']);
});

test('lectures : aucun compte ni lecture nécessaire ; recalcul après synchronisation et retrait', () => {
  assert.equal(studiedChapters({}, {}).size, 0);
  const marks = { 'cours:00-exemples': { st: 'lu' } };
  assert.equal(studiedChapters(marks, {}).has('00-exemples'), true);
  marks['cours:00-exemples'].st = null;
  assert.equal(studiedChapters(marks, {}).size, 0);
});
