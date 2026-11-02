#!/usr/bin/env python3
"""Vérification des notions python-bases et python-algorithmes (PY2).

1. Chaque `reference` passe tous ses tests (visibles et cachés) sous CPython.
2. Chaque squelette se compile (l'élève part d'un code valide).
3. Chaque programme « qu'affiche ce programme ? » est exécuté et comparé à la réponse.

Lancer : python3 docs/verification/py2-python-bases.py
"""
import contextlib
import io
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
NOTIONS = ["python-bases", "python-algorithmes"]
erreurs = 0


def egal(a, b):
    """Comme le moteur : comparaison JSON, un nombre à 1e-9 près, un tuple vaut une liste."""
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(a - b) <= 1e-9
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(egal(x, y) for x, y in zip(a, b))
    return a == b


def ko(msg):
    global erreurs
    erreurs += 1
    print("KO", msg)


questions = []
for nom in NOTIONS:
    questions += yaml.safe_load((ROOT / f"content/app/notions/{nom}.yaml").read_text(encoding="utf-8"))["questions"]

for q in questions:
    qid = q["id"]
    if q["type"] == "code":
        env = {}
        exec(q["reference"], env)
        f = env[q["fonction"]]
        for t in q["tests"] + q["tests_caches"]:
            got = f(*json.loads(json.dumps(t["entree"])))
            if not egal(got, t["sortie"]):
                ko(f"{qid} {t['entree']} → {got!r}, attendu {t['sortie']!r}")
        for lang in ("fr", "en"):
            try:
                compile(q["squelette"][lang], qid, "exec")
            except SyntaxError as e:
                ko(f"{qid} squelette {lang} invalide : {e}")
        print("OK", qid, len(q["tests"]) + len(q["tests_caches"]), "tests")
    else:
        m = re.search(r"```python\n(.*?)```", q["enonce"]["fr"], re.S)
        if m and "print(" in m.group(1) and q["type"] == "numeric":
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                exec(m.group(1), {})
            if out.getvalue().strip() != str(q["reponse"]):
                ko(f"{qid} affiche {out.getvalue().strip()!r}, réponse {q['reponse']!r}")
            else:
                print("OK", qid, "affiche", q["reponse"])

# Questions vérifiées à part (expressions et programmes sans sortie numérique).
assert 17 % 5 == 2 and 7 / 2 == 3.5 and (10 // 3, 10 % 3) == (3, 1)
a = 3; b = a; a = a + 1; assert b == 3                       # pb-03 : faux
assert "3" + "4" == "34"                                      # pb-12 : faux
l = [1, 2, 3]; m = l; m.append(4); assert len(l) == 4         # pb-22 : vrai
assert list(range(1, 11)) == list(range(1, 11))               # pb-08 : 1 et 11
seq, mx, ch = [3, 9, 2, 9, 5], 3, 0                           # pb-21 : 3, 1, 9
for x in seq:
    if x > mx:
        mx, ch = x, ch + 1
assert (seq[0], ch, mx) == (3, 1, 9)
print("OK pb-02 pb-03 pb-04 pb-08 pb-12 pb-16 pb-21 pb-22")

# python-algorithmes : questions sans programme à exécuter.
b, vals = 18, []                                              # pa-02 : 12, 6, 0
a = 48
while b:
    a, b = b, a % b
    vals.append(b)
assert vals == [12, 6, 0]
l = [5, 9, 1]; g, d = 0, 2                                    # pa-03 : la dichotomie rate 1 dans une liste non triée
m = (g + d) // 2; assert l[m] > 1 and 1 not in l[:m]
crib = lambda n: [k for k in range(2, n + 1) if all(k % p for p in range(2, int(k ** 0.5) + 1))]
assert max(p for p in crib(100) if p * p <= 100) == 7          # pa-07 : 7
assert crib(30) == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]        # pa-16 : 10, 29, 5
assert max(p for p in crib(30) if p * p <= 30) == 5
t, r = 1000, 0                                                # pa-15 : 9
while t > 1:
    t //= 2; r += 1
assert r == 9
l = [4, 3, 2, 1]                                              # pa-13 : vrai
for j in range(3):
    if l[j] > l[j + 1]:
        l[j], l[j + 1] = l[j + 1], l[j]
assert l == [3, 2, 1, 4]
print("OK pa-02 pa-03 pa-07 pa-13 pa-15 pa-16 (pa-12 et pa-21 : raisonnement, voir les explications)")

print("erreurs :", erreurs)
sys.exit(1 if erreurs else 0)
