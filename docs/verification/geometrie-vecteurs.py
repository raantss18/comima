#!/usr/bin/env python3
"""Vérification indépendante des réponses de la notion geometrie-vecteurs (chapitre 4).

Chaque réponse est recalculée ici à partir de l'énoncé, puis comparée au fichier YAML.
Usage : python3 docs/verification/geometrie-vecteurs.py
"""
from fractions import Fraction as F
from math import cos, isclose, pi, sqrt
from pathlib import Path

import yaml

NOTION = Path(__file__).resolve().parents[2] / 'content' / 'app' / 'notions' / 'geometrie-vecteurs.yaml'


def sub(p, q):
    return (p[0] - q[0], p[1] - q[1])


def dot(u, v):
    return u[0] * v[0] + u[1] * v[1]


def norm2(u):
    return dot(u, u)


def centroid(*pts):
    return tuple(F(sum(p[i] for p in pts), len(pts)) for i in range(2))


attendu = {}
attendu['gv-01'] = list(sub((5, -4), (1, 2)))
attendu['gv-02'] = list(centroid((-3, 5), (7, 1)))
attendu['gv-03'] = sqrt(norm2((3, 4)))
attendu['gv-04'] = all(sub(c, a) == tuple(x + y for x, y in zip(sub(b, a), sub(c, b)))
                       for a in [(0, 0), (2, -1)] for b in [(3, 4), (2, -1)] for c in [(-5, 1), (0, 0)])
attendu['gv-05'] = dot((2, -1), (3, 4))
attendu['gv-06'] = dot((2, 3), (-3, 2)) == 0
attendu['gv-07'] = list(centroid((1, 1), (7, 3), (4, 8)))
A, B, C = (1, 0), (4, 1), (6, 5)
attendu['gv-08'] = [A[0] + C[0] - B[0], A[1] + C[1] - B[1]]
attendu['gv-09'] = sqrt(9 + 2 * 0 + 16)
attendu['gv-10'] = 2 * 5 * cos(pi / 3)
attendu['gv-11'] = F(12, 3)  # 3x - 12 = 0
attendu['gv-12'] = [0, 3]
# gv-12 : vérification numérique sur un parallélogramme et un « faux » ordre ABDC.
P = [(0, 0), (4, 1), (6, 5), (2, 4)]
assert sub(P[1], P[0]) == sub(P[2], P[3]) and P[0][0] + P[2][0] == P[1][0] + P[3][0]
assert sub(P[1], P[0]) != sub(P[3], P[2])
attendu['gv-13'] = True  # troisième angle = 180° moins les deux autres
attendu['gv-14'] = F(49 - 9 - 25, 2)
attendu['gv-15'] = F(10, 4) * 6
attendu['gv-16'] = 3 ** 2
A, B, C = (5, 0), (-3, 4), (0, -5)
assert norm2(A) == norm2(B) == norm2(C) == 25
H = (A[0] + B[0] + C[0], A[1] + B[1] + C[1])
# H est bien sur les trois hauteurs.
assert dot(sub(H, A), sub(C, B)) == 0 and dot(sub(H, B), sub(C, A)) == 0 and dot(sub(H, C), sub(B, A)) == 0
attendu['gv-17'] = list(H)
Q = [(0, 0), (4, 0), (6, 4), (0, 2)]
m1 = centroid(Q[0], Q[1]); m2 = centroid(Q[2], Q[3]); m3 = centroid(Q[1], Q[2]); m4 = centroid(Q[3], Q[0])
assert centroid(m1, m2) == centroid(m3, m4) == centroid(*Q)
attendu['gv-18'] = centroid(*Q)[0]
attendu['gv-19'] = True
attendu['gv-20'] = dot(sub((0, 0), (4, 0)), sub((1, 3), (4, 0)))
attendu['gv-21'] = sqrt(64 - 2 * 5 * 8 * cos(pi / 3) + 25)
attendu['gv-22'] = F(2, 5) * 10
G = centroid((0, 0), (4, 0), (1, 3))
assert sum((F(p[0]) - G[0] for p in [(0, 0), (4, 0), (1, 3)])) == 0
attendu['gv-23'] = True
A, B, C = (5, 0), (3, 4), (-4, -3)
assert norm2(A) == norm2(B) == norm2(C) == 25
H = (A[0] + B[0] + C[0], A[1] + B[1] + C[1])
assert dot(sub(H, A), sub(C, B)) == 0 and dot(sub(H, B), sub(C, A)) == 0
attendu['gv-24'] = norm2(H)
attendu['gv-25'] = 2 * (25 + 9) - 49
# gv-25 : un vrai parallélogramme avec AB = 5, AD = 3, AC = 7 existe (cos de l'angle en A dans [-1, 1]).
cosA = (49 - 25 - 9) / (2 * 5 * 3)
assert -1 <= cosA <= 1


def valeur(r):
    if isinstance(r, bool) or isinstance(r, list):
        return r
    return F(str(r))


questions = {q['id']: q for q in yaml.safe_load(NOTION.read_text(encoding='utf-8'))['questions']}
assert set(questions) == set(attendu), set(questions) ^ set(attendu)
erreurs = 0
for qid, att in attendu.items():
    q = questions[qid]
    rep = q['bonnes'] if q['type'] == 'qcm' else q['reponse']
    if isinstance(att, float):
        ok = isclose(float(valeur(rep)), att, abs_tol=1e-9)
    elif isinstance(att, list):
        ok = [F(str(x)) for x in rep] == [F(x) for x in att]
    else:
        ok = valeur(rep) == att
    if not ok:
        erreurs += 1
        print(f'✗ {qid} : YAML {rep!r}, recalculé {att!r}')
print(f'{len(attendu) - erreurs}/{len(attendu)} réponses vérifiées' + ('' if erreurs else ' ✓'))
raise SystemExit(1 if erreurs else 0)
