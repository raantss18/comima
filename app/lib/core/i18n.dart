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
  'other': ['Autre', 'Other'],
  'welcome_title': ['Bienvenue sur COMIMa', 'Welcome to COMIMa'],
  'signup_intro': [
    'Quelques informations pour suivre ta progression et te rattacher à ton centre. Elles restent sur ce téléphone tant que tu ne crées pas de compte.',
    'A few details to track your progress and link you to your centre. They stay on this phone until you create an account.',
  ],
  'edit_profile': ['Modifier le profil', 'Edit profile'],
  'role_student': ['Élève', 'Student'],
  'role_coach': ['Encadreur', 'Coach'],
  'required': ['Obligatoire', 'Required'],
  'birth_year': ['Année de naissance', 'Year of birth'],
  'years': ['ans', 'years old'],
  'school': ['Établissement d\'origine', 'School'],
  'school_coach': ['Établissement ou institution', 'School or institution'],
  'region': ['Région', 'Region'],
  'centre': ['Centre COMIMa', 'COMIMa centre'],
  'no_centre': ['Pas encore de centre', 'No centre yet'],
  'privacy_note': [
    'Ces informations ne servent qu\'au suivi pédagogique et aux statistiques des centres. Elles ne sont jamais publiées.',
    'This information is only used for coaching and centre statistics. It is never published.',
  ],
  'complete_profile': ['profil à compléter', 'profile to complete'],
  'delete': ['Supprimer', 'Delete'],
  'delete_profile': ['Supprimer le profil', 'Delete profile'],
  'delete_profile_warning': [
    'Sa progression, ses XP et ses statistiques seront effacés de ce téléphone. Cette action est définitive.',
    'Its progress, XP and statistics will be erased from this phone. This cannot be undone.',
  ],
  'cannot_delete_last': ['Il faut garder au moins un profil.', 'At least one profile must remain.'],
  'exercises': ['Exercices', 'Exercises'],
  'courses': ['Cours', 'Courses'],
  'papers': ['Sujets', 'Papers'],
  'news': ['Actualités', 'News'],
  'simulations': ['Simulations', 'Simulations'],
  'with_solution': ['Avec solution', 'With solution'],
  'solution': ['Solution', 'Solution'],
  'show_solution': ['Voir la solution (cherche d\'abord !)', 'Show the solution (try first!)'],
  'no_solution_yet': ['Pas encore de solution rédigée : propose-la à ton encadreur.', 'No written solution yet: suggest one to your coach.'],
  'course_pdf': ['Chapitre complet (PDF, en ligne)', 'Full chapter (PDF, online)'],
  'stats': ['Statistiques', 'Statistics'],
  'stats_empty': ['Réponds à quelques questions : tes statistiques apparaîtront ici.', 'Answer a few questions: your statistics will appear here.'],
  'answers': ['réponses', 'answers'],
  'success_rate': ['réussite', 'success'],
  'time_spent': ['de travail', 'of practice'],
  'streak': ['série en cours', 'current streak'],
  'best_streak': ['meilleure série', 'best streak'],
  'active_days': ['jours actifs', 'active days'],
  'days': ['j', 'd'],
  'last_14_days': ['Les 14 derniers jours', 'Last 14 days'],
  'by_theme': ['Par thème', 'By theme'],
  'by_notion': ['Par notion', 'By topic'],
  'by_type': ['Par type de question', 'By question type'],
  'by_difficulty': ['Par difficulté', 'By difficulty'],
  'reminders': ['Rappels d\'entraînement', 'Practice reminders'],
  'reminder_invite': ['Un petit rappel pour t\'entraîner ?', 'A small reminder to practise?'],
  'reminder_promise': [
    'Au plus un par jour, à l\'heure que tu choisis, jamais si tu t\'es déjà entraîné. Pause possible pendant les examens.',
    'At most one a day, at the time you choose, never if you have already practised. Can be paused during exams.',
  ],
  'no_thanks': ['Non merci', 'No thanks'],
  'enable': ['Activer', 'Enable'],
  'reminder_time': ['Heure du rappel', 'Reminder time'],
  'exam_pause': ['Pause examens :', 'Exam break:'],
  'weeks': ['sem.', 'wk'],
  'paused_until': ['En pause jusqu\'au', 'Paused until'],
  'resume': ['Reprendre', 'Resume'],
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
