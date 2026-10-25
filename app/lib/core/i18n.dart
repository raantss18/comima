/// Textes de l'interface (FR / EN). Les contenus viennent des paquets, déjà bilingues.
const _t = <String, List<String>>{
  'train': ['Entraînement', 'Practice'],
  'library': ['Bibliothèque', 'Library'],
  'profile': ['Profil', 'Profile'],
  'level': ['Niveau', 'Level'],
  'xp': ['XP', 'XP'],
  'notions': ['notions', 'topics'],
  'questions': ['questions', 'questions'],
  'sheet': ['Fiche', 'Summary'],
  'step': ['Étape', 'Step'],
  'all': ['Tout', 'All'],
  'start': ['Commencer', 'Start'],
  'check': ['Vérifier', 'Check'],
  'next': ['Suivant', 'Next'],
  'finish': ['Terminer', 'Finish'],
  'correct': ['Bonne réponse !', 'Correct!'],
  'incorrect': ['Pas tout à fait.', 'Not quite.'],
  'explanation': ['Explication', 'Explanation'],
  'hint': ['Indice', 'Hint'],
  'true': ['Vrai', 'True'],
  'false': ['Faux', 'False'],
  'your_answer': ['Ta réponse', 'Your answer'],
  'preview': ['Aperçu', 'Preview'],
  'manual': [
    'Ce type de question (code, simulation, preuve rédigée) sera corrigé dans une prochaine version. Lis l\'explication puis passe à la suite.',
    'This kind of question (code, simulation, written proof) will be graded in a later version. Read the explanation, then move on.',
  ],
  'show_expl': ['Voir l\'explication', 'Show explanation'],
  'order_help': [
    'Fais glisser les étapes dans le bon ordre. Touche ✕ pour écarter une étape fausse.',
    'Drag the steps into the right order. Tap ✕ to discard a wrong step.',
  ],
  'order_intrus': ['Une étape fausse est restée dans la preuve.', 'A wrong step is still in the proof.'],
  'order_missing': ['Une étape juste a été écartée.', 'A correct step was discarded.'],
  'order_order': ['Les étapes ne sont pas dans un ordre valable.', 'The steps are not in a valid order.'],
  'qcm_help': ['Plusieurs réponses peuvent être justes.', 'Several answers may be correct.'],
  'score': ['Score', 'Score'],
  'mastered': ['maîtrisée', 'mastered'],
  'again': ['Recommencer', 'Try again'],
  'back': ['Retour', 'Back'],
  'language': ['Langue', 'Language'],
  'content': ['Contenus', 'Content'],
  'update': ['Mettre à jour', 'Update'],
  'updating': ['Mise à jour…', 'Updating…'],
  'up_to_date': ['Contenus à jour.', 'Content is up to date.'],
  'updated': ['Nouveaux contenus installés.', 'New content installed.'],
  'offline': ['Pas de connexion : l\'application fonctionne hors ligne.', 'No connection: the app works offline.'],
  'update_failed': ['Mise à jour refusée (fichier corrompu). Les contenus actuels sont conservés.', 'Update rejected (corrupted file). Current content kept.'],
  'version': ['Version des contenus', 'Content version'],
  'profiles': ['Profils sur ce téléphone', 'Profiles on this phone'],
  'add_profile': ['Ajouter un profil', 'Add a profile'],
  'name': ['Prénom ou pseudo', 'First name or nickname'],
  'ok': ['OK', 'OK'],
  'cancel': ['Annuler', 'Cancel'],
  'search': ['Rechercher', 'Search'],
  'solution_online': ['Solution (PDF) sur comima.mg', 'Solution (PDF) on comima.mg'],
  'source': ['Source', 'Source'],
  'difficulty': ['Difficulté', 'Difficulty'],
  'test_build': ['Version de test', 'Test version'],
  'welcome': ['Bienvenue ! Comment t\'appelles-tu ?', 'Welcome! What is your name?'],
  'no_question': ['Aucune question à cette étape.', 'No question at this step.'],
  'list_help': ['Sépare les éléments par « ; »', 'Separate items with “;”'],
  'interval_help': ['Ex. [1; 5[  ou  ]-∞; 2]', 'E.g. [1; 5)  or  (-∞; 2]'],
  // Messages du moteur Rust (saisie refusée, jamais comptée fausse)
  'e_empty': ['Écris ta réponse.', 'Type your answer.'],
  'e_incomplete': ['Expression incomplète.', 'Incomplete expression.'],
  'e_unclosed_paren': ['Une parenthèse n\'est pas fermée.', 'A bracket is not closed.'],
  'e_unexpected': ['Symbole inattendu : ', 'Unexpected symbol: '],
  'e_unknown_var': ['Lettre inconnue dans cette question : ', 'Unknown letter for this question: '],
  'e_too_long': ['Réponse trop longue.', 'Answer too long.'],
  'e_too_big': ['Nombre trop grand.', 'Number too large.'],
  'e_bad_interval': ['Écris un intervalle, par exemple [1; 5[.', 'Write an interval, e.g. [1; 5).'],
  'e_not_a_number': ['Ce n\'est pas un nombre.', 'This is not a number.'],
  'e_cannot_check': ['Réponse impossible à vérifier : simplifie-la.', 'Cannot check this answer: simplify it.'],
  'e_other': ['Question mal formée : signale-la à ton encadreur.', 'Malformed question: report it to your coach.'],
};

const themeNames = <String, List<String>>{
  'algèbre': ['Algèbre', 'Algebra'],
  'géométrie': ['Géométrie', 'Geometry'],
  'arithmétique': ['Arithmétique', 'Number theory'],
  'combinatoire': ['Combinatoire', 'Combinatorics'],
  'analyse': ['Analyse', 'Analysis'],
  'informatique': ['Informatique', 'Computer science'],
};

String t(String key, String lang) => (_t[key] ?? [key, key])[lang == 'en' ? 1 : 0];

String themeName(String theme, String lang) => (themeNames[theme] ?? [theme, theme])[lang == 'en' ? 1 : 0];

/// Texte bilingue d'un paquet : {fr, en}.
String tr(Object? v, String lang) {
  if (v is Map) return (v[lang] ?? v['fr'] ?? '').toString();
  return v?.toString() ?? '';
}

/// Message d'un code d'erreur du moteur (« unexpected:) » → « Symbole inattendu : ) »).
String engineMessage(String? code, String lang) {
  if (code == null) return t('e_other', lang);
  final i = code.indexOf(':');
  final key = i < 0 ? code : code.substring(0, i);
  final arg = i < 0 ? '' : code.substring(i + 1);
  final msg = _t['e_$key'];
  if (msg == null) return t('e_other', lang);
  return msg[lang == 'en' ? 1 : 0] + (arg.isEmpty ? '' : '« $arg »');
}
