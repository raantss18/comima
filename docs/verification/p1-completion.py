"""Exact checks independent of the YAML authoring; run from the repository root."""
from fractions import Fraction as F
from itertools import permutations
from functools import lru_cache
from math import comb, factorial
from pathlib import Path
import yaml
import sympy as s
R=Path(__file__).resolve().parents[2]
ns={n:yaml.safe_load((R/f'content/app/notions/{n}.yaml').read_text()) for n in ['suites-convergence','suites-lineaires','suites-periodes-sommes']}
qs={q['id']:q for n in ns.values() for q in n['questions']}
def answer(id,v): assert str(qs[id]['reponse'])==str(v),(id,v)
for n in ns.values():
 for d in range(1,6): assert sum(q['difficulte']==d for q in n['questions'])>=5,(n['id'],d)
# Positivity follows from the sign of both summands; check the exact error identity symbolically.
e,t=s.symbols('e t',positive=True)
assert s.simplify(((e+t)+t*t/(e+t))/2-t-e**2/(2*(e+t)))==0
assert qs['sc-27']['reponse'] is True
assert s.simplify(s.sympify(qs['sc-29']['reponse'].replace('sqrt(a)','t').replace('^','**'))-s.sympify('e**2/(2*(e+t))'))==0
u=[F(2),F(5)]
for _ in range(40):u.append(sum(u[-2:])/2)
assert all(u[i]+2*u[i+1]==12 for i in range(len(u)-1))
answer('sc-28',4)
for n in range(2,30):
 p=F(1)
 for k in range(2,n+1):p*=F(k**3-1,k**3+1)
 assert p-F(2,3)==F(2,3*n*(n+1))
answer('sc-30','2/3')
for n in range(6,80):
 a=sum((F(1,comb(n,k)) for k in range(n+1)),F(0))
 assert 0<=n*(a-2)-2<=F(4,n-1)+F(6*(n-5),(n-1)*(n-2))
answer('sc-31',2)
# Enumerate every permutation, then count via an independent used-values DP.
brute=sum(all(abs(v-i)<=2 for i,v in enumerate(p,1)) for p in permutations(range(1,8)))
@lru_cache(None)
def dp(mask):
 i=mask.bit_count()+1
 if i==8:return 1
 return sum(dp(mask|1<<(v-1)) for v in range(1,8) if not mask>> (v-1)&1 and abs(v-i)<=2)
assert brute==dp(0)==172
answer('sl-30',brute)
# Enumerate actual occupied cells, independently of block decomposition.
def tilings(n,squares=False):
 full=(1<<(2*n))-1
 def walk(mask,tiles):
  if mask==full:
   yield tiles;return
  k=next(k for k in range(2*n) if not mask>>k&1);r,c=divmod(k,n)
  shapes=[(k,k+n)] if r==0 else []
  if c+1<n:shapes.append((k,k+1))
  if squares and r==0 and c+1<n:shapes.append((k,k+1,k+n,k+n+1))
  for cells in shapes:
   bits=sum(1<<x for x in cells)
   if not mask&bits:yield from walk(mask|bits,tiles+(frozenset(cells),))
 return walk(0,())
t8=list(tilings(8))
def reflect(tiles,n):return frozenset(frozenset((x//n)*n+n-1-x%n for x in tile) for tile in tiles)
symmetric=sum(reflect(t,8)==frozenset(t) for t in t8)
assert symmetric==8;answer('sl-31',symmetric)
three=sum(sum(len(t)==4 for t in ts)==3 for ts in tilings(10,True))
assert three==sum(factorial(7-h)//(factorial(3)*factorial(h)*factorial(4-2*h)) for h in range(3))==105
answer('sl-32',three)
a=[1,12,20]
for _ in range(30):a.append(2*a[-1]+2*a[-2]-a[-3])
assert all(a[i]+a[i+2]-3*a[i+1]==15*(-1)**(i+1) for i in range(len(a)-2))
assert qs['sl-33']['bonnes']==[1]
# sp-33 is a quantified implication, verified by the proof, not by finite samples.
assert qs['sp-33']['reponse'] is True
print('P1: ten answers checked; symbolic identities, exact bounds, two independent enumerations; five questions per stage in all three sequences notions. Proof implications also require mathematical review.')
