import json
import subprocess
from pathlib import Path
from fractions import Fraction
root=Path(__file__).resolve().parents[2]
raw=subprocess.check_output(['node','-e',"const fs=require('fs'),Y=require('yaml');console.log(JSON.stringify(Y.parse(fs.readFileSync('content/app/notions/suites-periodes-sommes.yaml','utf8')).questions));"],cwd=root,text=True)
qs=json.loads(raw)
byid={q['id']:q for q in qs}
assert len(qs)==32 and len(byid)==32
assert sum(q['difficulte']==5 for q in qs)==4
assert sum(q['type']=='preuve' for q in qs)==0
# Thue–Morse : la construction par complément doit égaler la parité binaire.
word=[0]
for _ in range(16):word += [1-x for x in word]
assert all(x==n.bit_count()%2 for n,x in enumerate(word))
# Identité symbolique de la preuve : complément sur k chiffres.
for p in range(1,501):
    k=p.bit_length()+1
    assert all((2**j-p).bit_count()==j-(p-1).bit_count() for j in [k,k+1])
    assert word[2**k-p] != word[2**(k+1)-p]
# Pour toute période p, les deux valeurs devraient pourtant égaler x(2**k)=1.
assert byid['sp-31']['type']=='ordre'
# Deux preuves indépendantes d’impossibilité pour 9.44.
# Cauchy–Schwarz : H_N**2 <= A_N B_N, H_N non borné (groupes dyadiques).
for m in range(1,10):
    H=sum((Fraction(1,n) for n in range(1,2**m+1)),Fraction())
    assert H >= 1+Fraction(m,2)
# Preuve différente : a_n + 1/(n² a_n) >= 2/n, par (x-y)²>=0.
for n in range(1,101):
    for a in [Fraction(1,n),Fraction(1,n*n),Fraction(3,7),Fraction(n,5)]:
        assert a+1/(n*n*a)>=Fraction(2,n)
assert byid['sp-32']['reponse'] is False
for id in ['sp-31','sp-32']:
    assert all(byid[id][field].get(lang) for field in ['enonce','explication'] for lang in ['fr','en'])
print('Deux questions sourcées : preuves relues, identités et arguments indépendants contrôlés ; étape 5 = 4 questions.')
