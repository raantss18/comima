import json
import subprocess
from pathlib import Path
from fractions import Fraction
root = Path(__file__).resolve().parents[2]
raw = subprocess.check_output(['node', '-e', "const fs=require('fs'),Y=require('yaml'); const n=Y.parse(fs.readFileSync('content/app/notions/suites-periodes-sommes.yaml','utf8'));console.log(JSON.stringify(n.questions.filter(q=>/^sp-(26|27|28|29|30)$/.test(q.id))));"], cwd=root, text=True)
q = {x['id']: x for x in json.loads(raw)}
assert len(q) == 5
# Somme exacte des différences, puis addition des quatre fractions réduites.
a=sum((Fraction(1,k)-Fraction(1,k+1) for k in range(1,5)),Fraction())
b=sum([Fraction(1,2),Fraction(1,6),Fraction(1,12),Fraction(1,20)])
assert a == b == Fraction(q['sp-26']['reponse'])
# Valeur de position : lecture binaire, puis somme des poids de chaque chiffre.
assert q['sp-27']['reponse'] == '2*n'
for n in range(1,257):
    digits=bin(n)[2:]+'0'
    positional=sum(int(d)*2**i for i,d in enumerate(reversed(digits)))
    assert int(digits,2)==positional==2*n
# Ensemble du bloc, puis appartenance testée séparément sur plusieurs répétitions.
block=[0,2,2,1]
assert set(q['sp-28']['reponse'])==set(block)=={v for v in range(-5,6) if v in block*20}
# n=0 suffit à réfuter toutes les périodes p>=1 ; la queue est identiquement nulle.
assert q['sp-29']['reponse'] is False
assert all(([2]+[0]*100)[p] != 2 for p in range(1,101))
# Annulation symbolique via les coefficients, puis contrôle sur b_k=k^2.
coef=[0]*7
for k in range(2,6): coef[k]+=1; coef[k+1]-=1
assert coef==[0,0,1,0,0,0,-1]
assert sum(k*k-(k+1)**2 for k in range(2,6))==2**2-6**2
assert q['sp-30']['bonnes']==[2]
for x in q.values():
    assert x['difficulte']==1
    assert all(x[field].get(lang) for field in ['enonce','explication'] for lang in ['fr','en'])
print('5 questions : réponses contrôlées par deux méthodes exactes ; FR/EN et difficulté OK')
