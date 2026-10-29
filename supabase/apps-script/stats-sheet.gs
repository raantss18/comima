/**
 * COMIMa — tableau de bord des statistiques (Google Sheet), alimenté automatiquement par Supabase.
 *
 * Rien de secret dans ce fichier. Dans « Paramètres du projet → Propriétés du script » :
 *   SUPABASE_URL  = https://<projet>.supabase.co
 *   SUPABASE_KEY  = clé publique « anon » du projet
 *   STATS_TOKEN   = jeton d'accès aux statistiques (son hachage est dans comima.stats_acces ; voir supabase/README.md)
 * Seuls des comptes agrégés sont lus (aucun nom, e-mail, école ni réponse).
 *
 * Mise en route : exécuter une fois installerDeclencheur() (autorise le script, puis actualise toutes les 5 minutes).
 */

function props_() {
  var p = PropertiesService.getScriptProperties().getProperties();
  ['SUPABASE_URL', 'SUPABASE_KEY', 'STATS_TOKEN'].forEach(function (k) {
    if (!p[k]) throw new Error('Propriété du script manquante : ' + k);
  });
  return p;
}

function lire_() {
  var p = props_();
  var res = UrlFetchApp.fetch(p.SUPABASE_URL + '/rest/v1/rpc/comima_stats_sheet', {
    method: 'post',
    contentType: 'application/json',
    headers: { apikey: p.SUPABASE_KEY },
    payload: JSON.stringify({ p_token: p.STATS_TOKEN }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error('Supabase a répondu ' + res.getResponseCode());
  return JSON.parse(res.getContentText());
}

function feuille_(nom) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(nom) || ss.insertSheet(nom);
}

function ecrire_(nom, lignes) {
  var f = feuille_(nom);
  f.clearContents();
  f.getRange(1, 1, lignes.length, lignes[0].length).setValues(lignes);
  f.getRange(1, 1, 1, lignes[0].length).setFontWeight('bold').setBackground('#e7f1e7');
  f.setFrozenRows(1);
  f.autoResizeColumns(1, lignes[0].length);
}

function tableau_(titres, liste, cles) {
  return [titres].concat(liste.map(function (x) { return cles.map(function (c) { return x[c]; }); }));
}

function actualiser() {
  var d = lire_();
  var c = d.comptes, e = d.entrainement, l = d.lectures, g = d.groupes;
  var pct = e.reponses ? Math.round(100 * e.reussies / e.reponses) + ' %' : '–';
  ecrire_('Résumé', [
    ['Indicateur', 'Valeur'],
    ['Mis à jour (heure du serveur)', d.genere_le],
    ['Comptes synchronisés', c.total],
    ['Élèves', c.eleves],
    ['Encadreurs validés', c.encadreurs],
    ['Administrateurs', c.admins],
    ['Demandes « encadreur » en attente', c.encadreur_demande_non_valide],
    ['Nouveaux comptes (7 jours)', c.nouveaux_7j],
    ['Comptes actifs (7 jours)', c.actifs_7j],
    ['Comptes actifs (30 jours)', c.actifs_30j],
    ['Réponses d’entraînement', e.reponses],
    ['Réponses justes', e.reussies + ' (' + pct + ')'],
    ['Réponses (7 jours)', e.reponses_7j],
    ['Élèves qui s’entraînent (7 jours)', e.eleves_actifs_7j],
    ['Cours marqués lus ou faits', l.cours],
    ['Exercices marqués', l.exercices],
    ['Sujets marqués', l.sujets],
    ['Étoiles', l.etoiles],
    ['Groupes', g.groupes],
    ['Membres de groupes', g.membres],
    ['Exercices proposés', d.propositions_exercices],
  ]);
  ecrire_('Versions', tableau_(['Version de l’application', 'Comptes'], d.par_version, ['version', 'comptes']));
  ecrire_('Régions', tableau_(['Région (choisie dans le profil)', 'Comptes'], d.par_region, ['region', 'comptes']));
  ecrire_('Centres', tableau_(['Centre COMIMa', 'Comptes'], d.par_centre, ['centre', 'comptes']));
  ecrire_('Naissance', tableau_(['Années de naissance', 'Comptes'], d.par_naissance, ['tranche', 'comptes']));
  ecrire_('Thèmes', tableau_(['Thème', 'Réponses', 'Justes'], d.par_theme, ['theme', 'reponses', 'reussies']));
  ecrire_('Cours lus', tableau_(['Cours', 'Lecteurs'], d.cours_les_plus_lus, ['cours', 'lecteurs']));
  var premiere = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feuille 1');
  if (premiere && premiere.getLastRow() === 0 && SpreadsheetApp.getActiveSpreadsheet().getSheets().length > 1) {
    SpreadsheetApp.getActiveSpreadsheet().deleteSheet(premiere);
  }
}

/** À exécuter une fois : actualisation automatique toutes les 5 minutes. */
function installerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'actualiser') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('actualiser').timeBased().everyMinutes(5).create();
  actualiser();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('COMIMa').addItem('Actualiser maintenant', 'actualiser').addToUi();
}
