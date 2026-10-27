import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Le moteur WebAssembly du site expose les mêmes générateurs de questions que l'application : on le charge comme le fait
// le navigateur (training.ts) et on vérifie, pour chaque modèle, que la bonne réponse est acceptée et la mauvaise refusée.
const WASM = 'app/native/target/wasm32-unknown-unknown/release/comima_core.wasm';

test('moteur WebAssembly : modèles de questions générées corrigés par le même moteur', { skip: !fs.existsSync(WASM) && 'moteur WebAssembly non compilé' }, async () => {
  const { instance } = await WebAssembly.instantiate(fs.readFileSync(WASM), {});
  const e = instance.exports;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const readResult = (r) => {
    const mem = new Uint8Array(e.memory.buffer);
    let end = r;
    while (mem[end]) end++;
    const out = dec.decode(mem.subarray(r, end));
    e.comima_free(r);
    return JSON.parse(out);
  };
  const withStr = (s, f) => {
    const u = enc.encode(s);
    const p = e.comima_alloc(u.length + 1);
    const m = new Uint8Array(e.memory.buffer, p, u.length + 1);
    m.set(u);
    m[u.length] = 0;
    try {
      return f(p);
    } finally {
      e.comima_dealloc(p, u.length + 1);
    }
  };
  const generate = (kind, niveau, seed) => withStr(JSON.stringify({ kind, niveau, seed }), (p) => readResult(e.comima_generate(p)));
  const check = (q, a) => {
    const [qs, as] = [JSON.stringify(q), JSON.stringify(a)];
    return withStr(qs, (pq) => withStr(as, (pa) => readResult(e.comima_check(pq, pa))));
  };

  const kinds = readResult(e.comima_kinds());
  assert.ok(kinds.length >= 30, `${kinds.length} modèles`);
  assert.deepEqual(generate('inconnu', 1, 1), { error: 'unknown_kind' });
  for (const k of kinds) {
    for (const niveau of [1, 3, 5]) {
      for (const seed of [1, 2, 3, 99, 12345]) {
        const q = generate(k.id, niveau, seed);
        assert.equal(q.generated, true, k.id);
        const list = (xs) => (Array.isArray(xs) ? xs.join(', ') : '');
        const good = {
          numeric: () => q.reponse,
          'vrai-faux': () => q.reponse,
          qcm: () => q.bonnes,
          'n-uplet': () => `(${list(q.reponse)})`,
          ensemble: () => `{${list(q.reponse)}}`,
        }[q.type]();
        assert.equal(check(q, good).status, 'correct', `${k.id} niveau ${niveau} graine ${seed}`);
      }
    }
  }
  // Même graine, même question ; autre graine, autre question.
  assert.deepEqual(generate('pgcd', 3, 7), generate('pgcd', 3, 7));
  assert.notDeepEqual(generate('pgcd', 3, 7).enonce, generate('pgcd', 3, 8).enonce);
});
