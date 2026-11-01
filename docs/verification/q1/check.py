"""Q1: source contracts, exact arithmetic and independent finite-model verification.

Run: python3 docs/verification/q1/check.py
Requires PyYAML and SymPy. Universal proofs are additionally reviewed in REVIEW.md;
finite samples here are never claimed as proofs of infinite statements.
"""
from pathlib import Path
from fractions import Fraction as F
from functools import lru_cache
from itertools import combinations, product
from math import isqrt, ceil
import json
import sys
import yaml
import sympy as S
sys.setrecursionlimit(10000)
R=Path(__file__).resolve().parents[3]
sources=json.loads((Path(__file__).with_name('sources.json')).read_text())
notions={p.stem:yaml.safe_load(p.read_text()) for p in (R/'content/app/notions').glob('*.yaml') if p.stem.split('-')[0] in ['polynomes','fonctionnelles','jeux','strategies']}
assert len(notions)==12
questions={q['id']:q for n in notions.values() for q in n['questions']}
assert len(questions)==180 and set(questions)==set(sources)
for name,n in notions.items():
 assert n['id']==name and len(n['questions'])>=15
 assert [sum(q['difficulte']==d for q in n['questions']) for d in range(1,6)]==[3]*5
 for q in n['questions']:
  for field in ['enonce','explication']:
   assert all(isinstance(q[field][l],str) and q[field][l].strip() for l in ['fr','en'])
  src=sources[q['id']];p=R/'content/exercices'/src['exercise']
  assert yaml.safe_load((p/'meta.yaml').read_text())['source']['reference']==src['reference']
  assert (p/'enonce.en.tex').read_text().strip()
  assert src['reference'] in (R/'content/app/notions'/f'{name}.yaml').read_text()
checked=set()
x,y,z,a,b,c,n,u,t=S.symbols('x y z a b c n u t', real=True)
def qid(name,i):return f'{name}-{i:02}'
def Q(name,i):return questions[qid(name,i)]
def expr(v):return S.sympify(str(v).replace('^','**'),locals={str(k):k for k in [x,y,z,a,b,c,n,u,t]})
def check(name,i,expected):
 q=Q(name,i);typ=q['type']
 if typ in ['numeric','expression']:assert S.simplify(expr(q['reponse'])-expected)==0,(q['id'],q['reponse'],expected)
 elif typ=='vrai-faux':assert q['reponse']==bool(expected),q['id']
 elif typ in ['ensemble','n-uplet']:
  got=list(map(expr,q['reponse'])); exp=list(map(S.sympify,expected))
  if typ=='ensemble':assert set(got)==set(exp),q['id']
  else:assert got==exp,q['id']
 elif typ=='trous':assert [expr(v['reponse']) for v in q['trous']]==list(map(S.sympify,expected)),q['id']
 elif typ=='qcm':assert q['bonnes']==expected,q['id']
 else:raise AssertionError(typ)
 checked.add(q['id'])
def batch(name,values):
 for i,v in values.items():check(name,i,v)
# Polynomial roots: solve equations and differentiate rather than copying stored keys.
name='polynomes-racines';p=x*x-(a-2)*x-a-1
roots=S.solve(p,x);square_sum=S.simplify(sum(r*r for r in roots))
mult=S.solve([a+b+1,4*a+3*b],[a,b]);mp=x**5-a*x*x-a*x+1
batch(name,{1:sum(S.solve(p.subs(a,3),x)),2:S.prod(S.solve(x*x-6*x+1,x)),3:S.solve(a+b+1,a)[0]+b,4:square_sum,5:sum(r*r for r in S.solve(x*x-6*x+1,x)),6:mp.subs(x,-1),7:S.solve(S.diff(square_sum,a),a)[0],8:[mult[a],mult[b]],9:S.solve(S.diff(mp,x).subs(x,-1),a)[0]})
seq=[2,6]
for k in range(30):seq.append(6*seq[-1]-seq[-2])
assert all(k%5 for k in seq)
check(name,13,True)
# Check the recurrence and all distractors at a discriminating state.
assert seq[2]==6*seq[1]-seq[0];check(name,10,[1])
check(name,12,[1]);check(name,14,[0])
assert S.expand(((-a/2)**3+a*(-a/2)**2+b*(-a/2)+c)*8)==a**3-4*a*b+8*c
assert S.expand((x+y+z)**2-3*(x*y+y*z+z*x)-((x-y)**2+(y-z)**2+(z-x)**2)/2)==0
# Factorization: symbolic quotients and explicit coefficient extraction.
name='polynomes-factorisations';cube=x**3+y**3+z**3-3*x*y*z
factor=x**4-4*x**3+8*x*x+4*x+1
batch(name,{1:cube.subs({x:1,y:2,z:3}),2:True,3:(x**4+x*x+1).subs(x,1),4:S.cancel((x**4+x*x+1)/(x*x+x+1)),5:S.cancel((x**3-y**3)/(x-y)),6:S.expand((1-x+x*x)*(1+x+x*x)).coeff(x,3)!=0,7:S.cancel(cube/(x+y+z)),8:S.cancel((x**8+x**4+1)/(x**4+x*x+1)),9:S.solve((x**3+y**3+z**3+a*x*y*z).subs(z,-x-y),a)[0],11:S.expand(sum((-x)**k for k in range(101))*sum(x**k for k in range(101))).coeff(x,100),12:S.solve(2-a-98,a)[0],14:S.div(x**8+98*x**4+1,factor)[0],15:[0]})
assert S.rem(x**8+98*x**4+1,factor)==0
# Remainders and partial fractions, solved at their distinct poles.
name='polynomes-restes';p=x**100-2*x**51+1;f=sum(x**k for k in range(5))
abc=[S.cancel((x+5)/S.prod(x-j for j in [1,2,3] if j!=k)).subs(x,k) for k in [1,2,3]]
batch(name,{1:p.subs(x,1),2:p.subs(x,-1),3:f.subs(x,1),4:S.rem(p,x*x-1,x),5:0,6:True,7:abc,9:S.rem(f.subs(x,x**5),f,x),13:[0],14:True,15:n*(n+1)/2})
for m in range(1,30):
 p=m*x**(m+1)-(m+1)*x**m+1
 assert S.rem(p,(x-1)**2,x)==0
 if m>=2:assert S.div(p,(x-1)**2,x)[0].subs(x,1)==m*(m+1)//2
 assert S.rem(x**(4*m+2)+2*x**(2*m+1)+1,(x+1)**2,x)==0
# Functional substitutions: exact linear orbit solve and symbolic verification.
name='fonctionnelles-substitutions';T=1/(1-x);T2=S.cancel(T.subs(x,T));A,B,C=S.symbols('A B C')
orb=S.solve([A+B-2,B+C+1,C+A-S.Rational(1,2)],[A,B,C])
sol=(x-T+T2)/2
batch(name,{1:0,2:0,3:T.subs(x,2),6:T2,7:1,8:4*u,9:orb[A],11:1,12:2*u,14:sol})
assert S.cancel(sol+sol.subs(x,T)-x)==0
# Polynomial transformations and affine equation.
name='fonctionnelles-polynomiales';m,k=S.symbols('m k');f=m*x+k
aff=S.solve(S.Poly(3*f.subs(x,2*x+1)-f-5*x,x).coeffs(),[m,k])
batch(name,{1:4,2:0,3:True,4:x*x+3,5:2*2+1,6:2+2,7:S.Rational(1,2),8:S.Rational(1,3),9:[aff[m],aff[k]],10:x*x/2+3*x/2,11:x**3/3+2*x/3,12:[2]})
for i,extra in [(10,x*y),(11,x*y*(x+y))]:
 f=expr(Q(name,i)['reponse']);assert S.expand(f.subs(x,x+y)-f-f.subs(x,y)-extra)==0
# Binary recursion: independently reverse the binary digits for the integer recursion.
name='fonctionnelles-iterations'
def reverse_bits(v):return int(bin(v)[2:][::-1],2)
@lru_cache(None)
def dyadic(v):
 if v in (0,1):return v
 return dyadic(2*v)/4 if v<F(1,2) else F(3,4)+dyadic(2*v-1)/4
batch(name,{1:reverse_bits(8),2:S.Rational(dyadic(F(1,2))),3:True,4:reverse_bits(5),5:S.Rational(dyadic(F(1,4))),6:True,7:False,8:True,9:reverse_bits(13),11:S.Rational(dyadic(F(5,8))),12:False,13:c*c})
for m in range(1,15):
 assert reverse_bits(2**m-1)==2**m-1
 assert dyadic(1-F(1,2**m))==1-F(1,4**m)
# Wythoff positions: bottom-up table versus the recursive definition.
name='jeux-positions';W={}
for total in range(31):
 for v in range(total+1):
  w=total-v
  dest=[(v-k,w) for k in range(1,v+1)]+[(v,w-k) for k in range(1,w+1)]+[(v-k,w-k) for k in range(1,min(v,w)+1)]
  W[v,w]=any(not W[d] for d in dest)
losers=sorted({v for (v,w),win in W.items() if v<=w and v+w<=15 and not win})
def pp(v):
 if v==1:return True
 primes=[p for p in range(2,v+1) if all(p%q for q in range(2,isqrt(p)+1))]
 return any(v==p**k for p in primes for k in range(1,v.bit_length()+1))
P=[False]
for v in range(1,100):P.append(any(not P[v-k] for k in range(1,v+1) if pp(k)))
assert [i for i in range(100) if not P[i]]==list(range(0,100,6))
batch(name,{1:True,2:3,3:True,4:[1,2],5:not W[1,2],6:[k for k in range(1,7) if pp(k)],7:next(k for k in range(1,4) if not W[2,3-k]),8:[k for k in range(13) if not P[k]],9:[1],10:losers,11:True,12:True,13:10**7%6,14:False})
# Full threshold game: independent backward table and recursive game-tree exploration.
win={}
for v in range(1989,1,-1):win[v]=any(v+d>=1990 or not win[v+d] for d in range(1,v) if v%d==0)
@lru_cache(None)
def tree(v):
 if v>=1990:return False
 return any(not tree(v+d) for d in range(v-1,0,-1) if v%d==0)
assert tree(2)==win[2] and tree(3)==win[3]
check(name,15,win[2])
# Board symmetries: exhaustive cell-pair attack tests, not just a picture.
name='jeux-symetrie';cells=list(product(range(1,9),repeat=2))
rot=lambda p:(9-p[0],9-p[1]);ref=lambda p:(p[0],9-p[1]);color=lambda p:sum(p)%2
knight=lambda p,q:sorted([abs(p[0]-q[0]),abs(p[1]-q[1])])==[1,2]
bishop=lambda p,q:p!=q and abs(p[0]-q[0])==abs(p[1]-q[1])
assert all(color(p)==color(rot(p)) and color(p)!=color(ref(p)) for p in cells)
assert all(not knight(p,rot(p)) and not bishop(p,ref(p)) for p in cells)
for p,q in combinations(cells,2):
 assert knight(p,q)==knight(rot(p),rot(q))
 assert bishop(p,q)==bishop(ref(p),ref(q))
batch(name,{1:len(cells),2:True,3:False,4:rot((2,3)),5:6*6//2,6:True,7:True,8:True,9:False,10:True,11:True,12:True,13:False,14:True,15:False})
# Algebraic games: exact factorization and complete small Euclid game table.
name='jeux-algebriques'
batch(name,{1:0,2:sum(map(int,'123456'))%9,3:12//4,4:-a,5:next(d for d in range(1,7) if (14+d)%9==0),6:[17-k*5 for k in range(1,4)],7:S.cancel((x**3+a*x*x-x-a)/(x*x-1)),8:sum((14+d)%9!=0 for d in range(1,7)),9:-(1+2-3+5),10:True,11:True,12:True,14:False,15:False})
@lru_cache(None)
def euclid(a,b):
 if a<b:a,b=b,a
 if b==0:return False
 return any(not euclid(a-k*b,b) for k in range(1,a//b+1))
assert all(euclid(a,b) for b in range(1,40) for a in range(2*b+1,120))
check(name,13,True)
# Triangulations: construct all triangle sets by splitting at the base edge.
@lru_cache(None)
def triang(vertices):
 if len(vertices)<3:return (frozenset(),)
 i,j=vertices[0],vertices[-1];out=[]
 for k in range(1,len(vertices)-1):
  for left in triang(vertices[:k+1]):
   for right in triang(vertices[k:]):out.append(left|right|{tuple(sorted((i,vertices[k],j)))})
 return tuple(out)
ts=triang(tuple(range(6)))
def has_side(tr):return any((b-a)%6 in (1,5) for a,b in combinations(tr,2))
valid=sum(all(has_side(tr) for tr in tiling) for tiling in ts)
assert len(ts)==14 and valid==12
sizes=[2,2,2,2,1];edge_count=sum(sizes[i]*sizes[j] for i,j in combinations(range(5),2))
# Blow-up construction checked on every triple of nine distinct vertices.
cls=[i for i,m in enumerate(sizes) for _ in range(m)]
def edge(i,j):
 if cls[i]==cls[j]:return None
 return (cls[i]-cls[j])%5 in (1,4)
assert all(None in (cols:=[edge(i,j),edge(i,k),edge(j,k)]) or len(set(cols))>1 for i,j,k in combinations(range(9),3))
name='strategies-graphes'
batch(name,{1:17*4,2:len(list(combinations(range(9),2))),3:6-2,4:17*4//2,5:ceil(F(28,9)),6:True,7:1+4+4*3,8:True,9:False,10:valid,11:True,12:edge_count,13:True,15:True})
# Descent: exact congruence exhaustion and polynomial invariance.
name='strategies-descente';form=x*x+x*y-y*y
assert S.expand(form.subs({x:x+y,y:x+2*y},simultaneous=True)-form)==0
assert S.expand(form.subs({x:2*x-y,y:y-x},simultaneous=True)-form)==0
assert all(X%2==Y%2==Z%2==T%2==0 for X,Y,Z,T in product(range(16),repeat=4) if (8*X**4+4*Y**4+2*Z**4-T**4)%16==0)
assert all(X%3==Y%3==Z%3==0 for X,Y,Z in product(range(27),repeat=3) if (X**3-3*Y**3-9*Z**3)%27==0)
batch(name,{1:sorted({k**4%16 for k in range(16)}),2:form.subs({x:2,y:3}),3:True,4:1,5:[2,3],7:[2*5-8,8-5],6:True,8:True,9:3,10:True,11:True,12:False,13:False,15:True})
# Conjugates: algebraic number fields give exact floors and coefficients.
name='strategies-conjugues';rt=S.sqrt(2);r3=S.sqrt(3)
batch(name,{1:S.expand((1+rt)*(1-rt)),2:S.floor(2+r3),3:S.divisor_count(6),4:[3,2],5:sum(S.divisor_count(k) for k in range(1,5)),6:1/(S.sqrt(n*n+1)+n),7:S.Rational(1,2),8:S.floor(S.expand((2+r3)**2)),9:sum(S.divisor_sigma(k) for k in range(1,5)),10:True,11:sum(S.divisor_count(k) for k in range(1,11)),12:2,14:((x-1)**2-5)**2-24,15:True})
for k in range(1,30):
 v=S.expand((1+rt)**k);u=v.coeff(rt,0);w=v.coeff(rt,1);assert u*u-2*w*w==(-1)**k
for k in range(1,9):assert int(S.floor(S.expand((2+r3)**k)))%2==1
assert S.expand(expr(Q(name,14)['reponse']).subs(x,1+rt+r3))==0
for m in range(1,80):
 assert sum(S.divisor_count(k) for k in range(1,m+1))==sum(m//d for d in range(1,m+1))
 assert sum(S.divisor_sigma(k) for k in range(1,m+1))==sum(d*(m//d) for d in range(1,m+1))
# Document exactly which items require proof review beyond this arithmetic/model gate.
proof_only=sorted(set(questions)-checked)
print(f'{len(notions)} notions, {len(questions)} sourced bilingual questions; {len(checked)} answer/model checks passed.')
print('Proof-only items (reviewed in REVIEW.md, not proved by finite tests):',', '.join(proof_only))
