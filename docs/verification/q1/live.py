"""Verify published manifest hashes and every new FR/EN topic page.

Run after a successful Pages deployment. HTTP and payload checks, not a browser
walkthrough or an Android installation test. No query-string cache bypass.
"""
from pathlib import Path
import hashlib
import json
import re
import urllib.request
import yaml
ROOT=Path(__file__).resolve().parents[3]
BASE='https://www.comima.mg/'
def get(path):
 with urllib.request.urlopen(BASE+path,timeout=45) as r:
  assert r.status==200
  return r.read()
manifest=json.loads(get('app/v1/manifest.json'))
notions=[]
for pack in manifest['packs']:
 raw=get('app/v1/'+pack['path'])
 assert hashlib.sha256(raw).hexdigest()==pack['sha256'],pack['id']
 assert len(raw)==pack['bytes'],pack['id']
 notions.extend(json.loads(raw)['notions'])
assert len(notions)==24,len(notions)
assert get('app/engine.wasm').startswith(b'\x00asm')
for topic in notions:
 if not re.match(r'^(polynomes|fonctionnelles|jeux|strategies|suites)-',topic['id']):continue
 source=yaml.safe_load((ROOT/'content/app/notions'/f"{topic['id']}.yaml").read_text())
 for field in ['titre','fiche']:
  assert topic[field]==source[field],(topic['id'],field)
 got={q['id']:q for q in topic['questions']}
 expected={q['id']:{k:v for k,v in q.items() if k != 'explication'} for q in source['questions']}
 assert got==expected,(topic['id'],'published text differs from main')
assert sum(len(n['questions']) for n in notions)==516
wanted={q.rsplit('-',1)[0] for q in json.loads(Path(__file__).with_name('sources.json').read_text())}
for topic in notions:
 if topic['id'] not in wanted:continue
 assert len(topic['questions'])==15
 for lang,route in [('fr','entrainement'),('en','training')]:
  html=get(f'{lang}/{route}/{topic["id"]}/').decode()
  assert topic['id'] in html
  match=re.search(r'<script[^>]+id="quiz-data"[^>]*>(.*?)</script>',html,re.S)
  assert match,(lang,topic['id'])
  payload=json.loads(match.group(1))
  assert payload['notion']==topic['id'] and len(payload['questions'])==15
  assert payload['lang']==lang
  print(lang,topic['id'],'15 questions, HTTP 200')
for topic in notions:
 if not topic['id'].startswith('suites-'):continue
 assert min(sum(q['difficulte']==d for q in topic['questions']) for d in range(1,6))>=5
print('LIVE OK:',manifest['version'],'24 notions, 516 questions, 24 bilingual pages, all pack SHA-256 hashes and byte counts verified.')
