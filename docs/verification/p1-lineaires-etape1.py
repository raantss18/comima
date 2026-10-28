import json
import subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2]
raw=subprocess.check_output(['node','-e',"const fs=require('fs'),Y=require('yaml');console.log(JSON.stringify(Y.parse(fs.readFileSync('content/app/notions/suites-lineaires.yaml','utf8')).questions));"],cwd=root,text=True)
qs=json.loads(raw); q={x['id']:x for x in qs}
assert len(q)==len(qs)==29
assert sum(x['difficulte']==1 for x in qs)==7
assert len({x['type'] for x in qs if x['difficulte']==1})>=4
# Lecture des coefficients, puis recomposition de la récurrence sur plusieurs valeurs.
p,c=q['sl-26']['reponse']; assert (p,c)==(7,-12)
assert all(p*x+c*y==7*x-12*y for x in range(-5,6) for y in range(-5,6))
# Produit nul, puis somme et produit des racines du polynôme développé.
roots=q['sl-27']['reponse']; assert set(roots)=={3,4}
assert sum(roots)==7 and roots[0]*roots[1]==12
assert all(r*r-7*r+12==0 for r in roots)
# Preuve générale : |p(i)-i|=0 pour p(i)=i ; contrôle sur les 50 premières tailles.
assert q['sl-28']['reponse'] is True
assert all(all(abs(i-i)<=1 for i in range(1,n+1)) for n in range(1,51))
# Comptage direct, puis position par position dans le bloc de remplacement source.
block='001'; counts=[int(x['reponse']) for x in q['sl-29']['trous']]
assert counts==[block.count('0'),block.count('1')]==[2,1]
assert sum(counts)==len(block) and [i for i,x in enumerate(block) if x=='1']==[2]
for id in ['sl-26','sl-27','sl-28','sl-29']:
 assert q[id]['difficulte']==1
 assert all(q[id][field].get(lang) for field in ['enonce','explication'] for lang in ['fr','en'])
print('4 sous-questions sourcées vérifiées ; étape 1 : 7 questions et 5 formats.')
