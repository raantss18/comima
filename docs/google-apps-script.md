# Compteur de visites & bouton « utile 👍 » — backend Google Sheets

Le site COMIMa est **statique** (GitHub Pages). Pour compter les visites et
recueillir les « 👍 utile » des visiteurs, on utilise un petit **Google Apps
Script** relié à une **feuille Google** que **vous** contrôlez. C'est gratuit,
durable, et les données restent chez vous.

## 1. Créer la feuille + le script

1. Allez sur <https://sheets.google.com> et créez une feuille vierge, par
   exemple **« COMIMa data »**.
2. Menu **Extensions → Apps Script**.
3. Effacez le contenu par défaut et collez le script ci-dessous (`Code.gs`).
4. **Enregistrez** (icône disquette).

```javascript
// COMIMa — compteur de visites + votes « utile ». Stocke tout dans la feuille.
function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var visits = sheetOf(ss, 'visits'); // clés : "total" et "page:/fr/..."
    var votes = sheetOf(ss, 'votes');   // clés : id d'exercice
    var p = (e && e.parameter) || {};
    var out = {};
    switch (p.action) {
      case 'hit':
        out.total = inc(visits, 'total', 1);
        if (p.page) out.page = inc(visits, 'page:' + p.page, 1);
        break;
      case 'vote':
        out.exo = p.exo;
        out.count = inc(votes, p.exo, 1);
        break;
      case 'votes':
        out.exo = p.exo;
        out.count = get(votes, p.exo);
        break;
      case 'stats':
        out.total = get(visits, 'total');
        out.pages = rows(visits, 'page:');
        out.votes = rows(votes, '');
        break;
      default:
        out.error = 'unknown action';
    }
    return json(out);
  } finally {
    lock.releaseLock();
  }
}

function sheetOf(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(['key', 'count']);
  }
  return sh;
}
function map(sh) {
  var data = sh.getDataRange().getValues();
  var m = {};
  for (var i = 1; i < data.length; i++) m[data[i][0]] = { row: i + 1, count: Number(data[i][1]) || 0 };
  return m;
}
function inc(sh, key, by) {
  var m = map(sh);
  if (m[key]) {
    var v = m[key].count + by;
    sh.getRange(m[key].row, 2).setValue(v);
    return v;
  }
  sh.appendRow([key, by]);
  return by;
}
function get(sh, key) {
  var m = map(sh);
  return m[key] ? m[key].count : 0;
}
function rows(sh, prefix) {
  var m = map(sh);
  var out = [];
  for (var k in m) if (!prefix || k.indexOf(prefix) === 0) out.push([k, m[k].count]);
  return out;
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

## 2. Déployer en application web

1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Type (roue crantée) : **Application web**.
3. **Exécuter en tant que** : *Moi*.
4. **Qui a accès** : *Tout le monde* (indispensable pour que le site public
   puisse écrire — la feuille, elle, reste privée).
5. **Déployer**, autorisez l'accès à votre compte quand Google le demande.
6. Copiez l'**URL de l'application web** (elle finit par `/exec`).

> À chaque modification du script, refaites **Déployer → Gérer les
> déploiements → (crayon) → Version : Nouvelle**, sinon l'ancienne version
> reste active.

## 3. Activer sur le site

Ouvrez `src/lib/config.ts` et collez l'URL :

```ts
export const DATA_API_URL = 'https://script.google.com/macros/s/XXXX.../exec';
```

Publiez (commit sur `main`). Dès le redéploiement :

- chaque visite est comptée ;
- chaque page d'exercice affiche le bouton **👍 Utile** avec son total ;
- la page **/admin** montre les visites cumulées, les pages les plus vues et
  les exercices les plus « utiles ».

Tant que `DATA_API_URL` est vide, ces fonctions sont **désactivées** (aucune
requête, aucun bouton) — le site fonctionne normalement.

## Notes

- **Confidentialité** : on ne stocke que des compteurs (chemins de page,
  identifiants d'exercice) — aucune donnée personnelle, aucun cookie.
- **Anti-doublon** : une visite par onglet (sessionStorage) ; un vote par
  appareil et par exercice (localStorage). Ce n'est pas infaillible, mais
  suffisant pour un usage associatif.
