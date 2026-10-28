"""Exécute les programmes imprimés du chapitre : CPython et moteur COMIMa."""
import ast
import bisect
import contextlib
import ctypes
import io
import itertools
import json
import math
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
text = (ROOT/'content/cours/09-python-algorithmes/cours.tex').read_text()
blocks = re.findall(r'\\begin\{verbatim\}\n(.*?)\\end\{verbatim\}', text, re.S)
assert len(blocks) == 7
libpath = ROOT/'app/native/target/debug/libcomima_core.so'
if not libpath.exists():
    raise SystemExit('Compiler le moteur : cargo build --manifest-path app/native/Cargo.toml')
lib = ctypes.CDLL(str(libpath))
lib.comima_run.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
lib.comima_run.restype = ctypes.c_void_p
lib.comima_free.argtypes = [ctypes.c_void_p]
checks = 0

def compare(code, inputs=()):
    global checks
    ast.parse(code)
    values = iter(inputs)
    def read_input(prompt=''):
        value = next(values)
        print(prompt + value)  # Le panneau COMIMa affiche le prompt et la saisie.
        return value
    ns = {'input': read_input}
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        exec(code, ns)
    ptr = lib.comima_run(code.encode(), json.dumps(list(inputs)).encode())
    try:
        result = json.loads(ctypes.string_at(ptr))
    finally:
        lib.comima_free(ptr)
    assert result['kind'] == 'ok', result
    assert result['output'] == output.getvalue(), (result, output.getvalue())
    checks += 1
    return ns

compare(blocks[0])
for value in ['-42', '0', '42']:
    compare(blocks[1], [value])
compare(blocks[2])
for n in [0, 1, 2, 3, 10, 100, 2000]:
    ns = compare(blocks[3]+f'\nprint(fibonacci_avant({n}))\n')
    expected = []
    f = [0, 1]
    while f[-1] < max(n, 2):
        f.append(sum(f[-2:]))
    expected = [x for x in f if x < n]
    assert ns['fibonacci_avant'](n) == expected, n
for a in range(-10, 11):
    for b in range(-10, 11):
        if a == b == 0:
            continue
        ns = compare(blocks[4]+f'\nprint(pgcd({a}, {b}))\n')
        assert ns['pgcd'](a, b) == math.gcd(a, b)
for length in range(5):
    for t in itertools.combinations_with_replacement(range(-2, 3), length):
        t = list(t)
        for x in range(-3, 4):
            ns = compare(blocks[5]+f'\nprint(position({t}, {x}))\n')
            assert ns['position'](t, x) == bisect.bisect_left(t, x)
for n in range(101):
    ns = compare(blocks[6]+f'\nprint(premiers({n}))\n')
    expected = [k for k in range(2, n+1) if all(k % d for d in range(2, k))]
    assert ns['premiers'](n) == expected, n
# Expressions de lecture reproduites de la documentation Python.
assert (17//3, 17%3, 2**7) == (5, 2, 128)
assert list(range(5, 10)) == [5, 6, 7, 8, 9]
assert list(range(0, 10, 3)) == [0, 3, 6, 9]
assert list(range(-10, -100, -30)) == [-10, -40, -70]
print(f'7 programmes imprimés : {checks} exécutions CPython/COMIMa identiques ; contrôles mathématiques indépendants réussis.')
