#!/usr/bin/env python3
"""Prépare la publication d'une version de l'application (après tool/build_apk.sh).

- vérifie la règle de version (chiffres de 0 à 9, jamais de retour en arrière) et que le
  numéro de build augmente : c'est lui que les applications installées comparent ;
- lit les nouveautés FR/EN de la version dans app/CHANGELOG.md ;
- écrit app/release.json (dernière version + historique complet, pour afficher les
  nouveautés de toutes les versions sautées) et sa signature Ed25519 app/release.json.sig.

Usage : python3 app/tool/release.py [--min-build N]
Clé privée : ~/.config/comima-app/update-signing.pem (ou COMIMA_UPDATE_KEY), hors du dépôt.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
REPO = 'raantss18/comima'
ABIS = ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'universal']


def fail(msg):
    sys.exit(f'✗ {msg}')


def notes_for(version):
    text = (APP / 'CHANGELOG.md').read_text(encoding='utf-8')
    m = re.search(rf'^## \[{re.escape(version)}\][^\n]*\n(.*?)(?=^## \[|\Z)', text, re.M | re.S)
    if not m:
        fail(f'CHANGELOG.md : section « ## [{version}] » absente')
    notes = {}
    for lang in ('fr', 'en'):
        b = re.search(rf'^### {lang}\n(.*?)(?=^### |\Z)', m.group(1), re.M | re.S)
        if not b or not b.group(1).strip():
            fail(f'CHANGELOG.md [{version}] : sous-section « ### {lang} » absente ou vide')
        notes[lang] = b.group(1).strip()
    return notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--min-build', type=int, help='versions plus anciennes obligées de se mettre à jour')
    args = ap.parse_args()

    pub = (APP / 'pubspec.yaml').read_text(encoding='utf-8')
    version, build = re.search(r'^version: (\d+\.\d+\.\d+)\+(\d+)$', pub, re.M).groups()
    build = int(build)
    if any(int(x) > 9 for x in version.split('.')):
        fail(f'version {version} : chaque chiffre va de 0 à 9')

    path = APP / 'release.json'
    old = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'history': [], 'minBuild': 1}
    prev = old.get('latest')
    if prev:
        if build <= prev['build']:
            fail(f'build {build} ≤ build publié {prev["build"]} : incrémenter pubspec.yaml')
        if tuple(map(int, version.split('.'))) <= tuple(map(int, prev['version'].split('.'))):
            fail(f'version {version} ≤ version publiée {prev["version"]}')

    out = APP / 'build' / 'release'
    tag = f'app-v{version}'
    apks = {}
    for abi in ABIS:
        f = out / f'comima-{version}-{abi}.apk'
        if not f.exists():
            fail(f'{f} absent : lancer tool/build_apk.sh')
        data = f.read_bytes()
        apks[abi] = {
            'url': f'https://github.com/{REPO}/releases/download/{tag}/{f.name}',
            'sha256': hashlib.sha256(data).hexdigest(),
            'bytes': len(data),
        }

    notes = notes_for(version)
    entry = {'build': build, 'version': version, 'date': date.today().isoformat(), 'notes': notes}
    release = {
        'format': 1,
        'latest': {**entry, 'tag': tag, 'apks': apks},
        'minBuild': args.min_build or old.get('minBuild', 1),
        'history': [h for h in old.get('history', []) if h['build'] != build] + [entry],
    }
    body = json.dumps(release, ensure_ascii=False, indent=2) + '\n'
    path.write_text(body, encoding='utf-8')

    key = os.environ.get('COMIMA_UPDATE_KEY') or str(Path.home() / '.config/comima-app/update-signing.pem')
    with tempfile.NamedTemporaryFile() as sig:
        subprocess.run(['openssl', 'pkeyutl', '-sign', '-inkey', key, '-rawin', '-in', str(path), '-out', sig.name],
                       check=True)
        (APP / 'release.json.sig').write_text(Path(sig.name).read_bytes().hex() + '\n', encoding='ascii')

    (out / 'release-notes.md').write_text(
        f'## COMIMa {version}\n\n### Français\n\n{notes["fr"]}\n\n### English\n\n{notes["en"]}\n\n'
        '### Quel fichier installer ? / Which file?\n\n'
        '- `arm64-v8a` : la plupart des téléphones récents / most recent phones\n'
        '- `armeabi-v7a` : téléphones anciens (32 bits) / older 32-bit phones\n'
        '- `universal` : si vous ne savez pas / if unsure (plus lourd / larger)\n\n'
        'Vérification : `sha256sum -c SHA256SUMS --ignore-missing`\n',
        encoding='utf-8')
    print(f'✓ release.json + signature : {version} (build {build}), tag {tag}')


if __name__ == '__main__':
    main()
