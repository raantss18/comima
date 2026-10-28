"""Contrôles HTTP du contenu PY1 déployé ; aucune donnée privée."""
import hashlib, json, urllib.request
from pathlib import Path
base='https://www.comima.mg/'
def get(path):
 with urllib.request.urlopen(base+path,timeout=30) as r:
  assert r.status==200
  return r.read()
chapter=get('fr/cours/09-python-algorithmes/').decode()
assert 'Python et algorithmes' in chapter and 'lycée' in chapter
assert chapter.count('recueil-9-')>=10
pdf=get('pdfs/cours/09-python-algorithmes/cours.pdf')
Path('/tmp/comima-py1-online.pdf').write_bytes(pdf)
assert pdf[:5]==b'%PDF-'
manifest=json.loads(get('app/v1/manifest.json'))
print('Manifest:',manifest['version'])
libdata=get('app/v1/library.json')
assert hashlib.sha256(libdata).hexdigest()==manifest['library']['sha256'], 'La bibliothèque reçue ne correspond pas encore au manifeste'
assert len(libdata)==manifest['library']['bytes']
lib=json.loads(libdata)
chapterapp=next(c for c in lib['cours'] if c['id']=='09-python-algorithmes')
assert chapterapp['pages']==9
exos=[e for e in lib['exercices'] if e['id'].startswith('recueil-9-')]
assert len(exos)==10
for e in exos:
 assert e['enonce']['fr'] and e['enonce']['en']
 assert e.get('solution') is None and e.get('solutionTex') is None
 page=get('fr/ressources/'+e['id']+'/').decode()
 assert 'voir la source originale' in page
 for name in ['enonce.pdf','enonce-en.pdf']:
  assert get('pdfs/exercices/'+e['id']+'/'+name)[:5]==b'%PDF-'
print('OK : chapitre, PDF, bibliothèque de l’application, dix exercices FR/EN, liens de sources et vingt PDF accessibles ; aucune solution associée.')
print('PDF SHA256:', hashlib.sha256(pdf).hexdigest())
print('Bibliothèque SHA256:',hashlib.sha256(libdata).hexdigest())
print('Entrée du manifeste pour la bibliothèque:', json.dumps(manifest.get('library'),ensure_ascii=False))
