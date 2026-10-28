// Formula rendering and complete FR/EN content contract, with strict LaTeX handling.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import katex from 'katex';
const root=path.resolve(import.meta.dirname,'../../..');
let formulas=0,fields=0,notions=0;
for(const name of fs.readdirSync(path.join(root,'content/app/notions')).filter(n=>/^(polynomes|fonctionnelles|jeux|strategies)-/.test(n))){
 const n=YAML.parse(fs.readFileSync(path.join(root,'content/app/notions',name),'utf8'));notions++;
 function visit(v){
  if(typeof v==='string'){
   for(const m of v.matchAll(/\$([^$]+)\$/g)){katex.renderToString(m[1],{throwOnError:true,strict:'error'});formulas++;}
   assert.equal((v.match(/\$/g)||[]).length%2,0,`${name}: unpaired dollar`);fields++;
  }else if(v&&typeof v==='object')Object.values(v).forEach(visit);
 }
 visit(n);
}
assert.equal(notions,12);console.log(`${notions} notions; ${fields} strings; ${formulas} formulas accepted by strict KaTeX.`);
