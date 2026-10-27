// Vérification reproductible du complément final de la banque 1.3.0.
// Lancer depuis la racine : node docs/verification/banque-1-3-0.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import YAML from 'yaml';
const dir = 'content/app/notions/';
const notions = fs.readdirSync(dir).filter(f => f.endsWith('.yaml')).map(f => YAML.parse(fs.readFileSync(dir + f, 'utf8')));
const questions = new Map(notions.flatMap(n => n.questions.map(q => [q.id, q])));
for (const n of notions) assert.ok(n.questions.length >= 25, `${n.id} : moins de 25 questions`);
const answer = id => questions.get(id).reponse;
const numeric = (id, result) => assert.equal(String(answer(id)), String(result), id);
const choose = (id, index) => assert.deepEqual(questions.get(id).bonnes, [index], id);

// Pavages : remplissage exhaustif case par case, indépendant de la récurrence par blocs.
function tileGrid(width, squares = false) {
  const results = [];
  const full = (1 << (2 * width)) - 1;
  function fill(mask, count) {
    if (mask === full) { results.push(count); return; }
    let i = 0;
    while (mask & (1 << i)) i++;
    const row = Math.floor(i / width), col = i % width;
    const shapes = [];
    if (row === 0) shapes.push([i, i + width]);
    if (col + 1 < width) shapes.push([i, i + 1]);
    if (squares && row === 0 && col + 1 < width) shapes.push([i, i + 1, i + width, i + width + 1]);
    for (const shape of shapes) {
      const bits = shape.reduce((m, j) => m | (1 << j), 0);
      if (!(mask & bits)) fill(mask | bits, count + Number(shape.length === 4));
    }
  }
  fill(0, 0);
  return results;
}
assert.deepEqual(answer('sl-21'), [0, 1, 2].map(n => tileGrid(n).length));
const counts = Array.from({length: 7}, (_, n) => tileGrid(n, true).length);
for (let n = 2; n <= 6; n++) assert.equal(counts[n], counts[n-1] + 2 * counts[n-2]);
choose('sl-22', 1);
assert.notEqual(counts[3], 2 * counts[2] + counts[1]);
assert.notEqual(counts[2], counts[1] + counts[0]);
numeric('sl-25', tileGrid(6, true).filter(s => s === 2).length);
assert.equal(tileGrid(6, true).filter(s => s === 2).length, 6 + 3); // ordres de blocs

// Moyennes : tous les termes jusqu'à a7 sont calculés exactement sur le dénominateur 32.
const terms = [0, 2 * 32, 5 * 32];
for (let n = 1; n <= 5; n++) terms.push((terms[n+1] + terms[n]) / 2);
const [num, den] = answer('sl-23').split('/').map(Number);
assert.equal((terms[7] - terms[6]) * den, num * 32);
assert.equal(num / den, 3 * (-1 / 2) ** 5); // méthode des différences
choose('sl-24', 2);
function seq(a, b) { const s = [a,b]; for (let n=2;n<20;n++) s.push(s[n-1]+s[n-2]); return s; }
assert.deepEqual(seq(1,1), Array.from({length:20}, (_,n) => {
  let a=1,b=1; for(let k=0;k<n;k++) [a,b]=[b,a+b]; return a;
}));
assert.notDeepEqual(seq(1,1),seq(1,2));
assert.notDeepEqual(seq(1,1),seq(0,1));

// Tiroirs : énumérer les classes et contrôler aussi les configurations à la borne.
const parities = new Set();
for (let x=-2;x<=2;x++) for(let y=-2;y<=2;y++) for(let z=-2;z<=2;z++)
  parities.add([x,y,z].map(v => (v%2+2)%2).join(','));
numeric('tb-24',parities.size);
assert.equal(parities.size,2**3);
numeric('tb-25',7*4+1);
assert.equal(Array(7).fill(4).reduce((s,n)=>s+n,0),Number(answer('tb-25'))-1);
assert.ok(Math.ceil(Number(answer('tb-25'))/7)>=5);

// Invariants : explorer TOUS les choix de paires, pas seulement un ordre d'opérations.
function finals(start, combine) {
  const seen=new Map();
  function solve(values) {
    const v=[...values].sort((a,b)=>a-b), key=v.join(',');
    if(seen.has(key)) return seen.get(key);
    const out=new Set();
    if(v.length===1) out.add(v[0]);
    else for(let i=0;i<v.length;i++) for(let j=i+1;j<v.length;j++) {
      const rest=v.filter((_,k)=>k!==i&&k!==j);
      for(const r of solve([...rest,combine(v[i],v[j])])) out.add(r);
    }
    seen.set(key,out); return out;
  }
  return [...solve(start)];
}
assert.deepEqual(finals([1,1,1,1,-1,-1,-1],(a,b)=>a*b),[-1]);
choose('iv-24',1);
const rules={'0,0':0,'0,1':1,'0,2':2,'1,1':2,'1,2':0,'2,2':1};
const letters=[0,1,1,2,2,2];
numeric('iv-25',finals(letters,(a,b)=>rules[[a,b].sort().join(',')])[0]);
assert.deepEqual(finals(letters,(a,b)=>rules[[a,b].sort().join(',')]),[letters.reduce((a,b)=>a+b,0)%3]);

// Somme de la suite : table de la définition contre formule de sommes partielles.
const paper=[0];
for(let n=1;n<=32;n++) paper[n]=n%2===0?paper[n/2]:Number(n%4===1);
numeric('sp-25',paper.slice(1).reduce((a,b)=>a+b,0));
function sum(N) { return N===1?1:sum(N/2)+Math.ceil(N/4); }
assert.equal(sum(32),Number(answer('sp-25')));
console.log(`OK : ${notions.length} notions, ${notions.reduce((s,n)=>s+n.questions.length,0)} questions ; dix compléments vérifiés, dont parcours exhaustifs des pavages et des opérations.`);
