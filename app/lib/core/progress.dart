import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:path_provider/path_provider.dart';

import 'content.dart';

/// Profils (téléphones partagés) et progression, enregistrés localement dans un fichier JSON
/// écrit de façon atomique. La synchronisation avec le serveur viendra ensuite (file d'envoi).
class ProgressStore {
  /// Version du format des données locales. Pour la changer : ajouter une migration
  /// `schema - 1 → schema` dans [_migrations] (jamais modifier une migration publiée), afin
  /// qu'une installation de la toute première version passe d'un coup à la plus récente.
  static const schema = 2;
  static final Map<int, void Function(Map<String, dynamic>)> _migrations = {
    // 0 → 1 : fichier sans numéro de schéma (aucune version publiée ne l'a produit).
    0: (d) {
      d['profiles'] ??= <dynamic>[];
    },
    // 1 → 2 (version 0.2.0) : journal d'entraînement (statistiques) et réglages des rappels.
    1: (d) {
      for (final p in (d['profiles'] as List).cast<Map<String, dynamic>>()) {
        // Les réponses déjà données en 0.1.0 alimentent le journal (dernier résultat connu).
        final answers = (p['answers'] as Map?)?.cast<String, dynamic>() ?? {};
        p['log'] ??= [
          for (final e in answers.entries)
            {'q': e.key, 'ok': (e.value as Map)['ok'] == true, 't': (e.value as Map)['t'] ?? DateTime.now().toIso8601String()},
        ];
      }
      d['reminders'] ??= <String, dynamic>{};
    },
  };

  Map<String, dynamic> _data = {
    'schema': schema,
    'profiles': <dynamic>[],
    'current': null,
    'lang': null,
    'reminders': <String, dynamic>{},
  };
  late File _file;
  bool _readOnly = false;

  Future<void> load() async {
    final dir = await getApplicationSupportDirectory();
    _file = File('${dir.path}/progress.json');
    for (final f in [_file, File('${_file.path}.tmp')]) {
      try {
        if (f.existsSync()) {
          final d = jsonDecode(await f.readAsString()) as Map<String, dynamic>;
          var v = (d['schema'] as int?) ?? 0;
          if (v > schema) {
            _readOnly = true; // données d'une version plus récente : ne rien écraser
            continue;
          }
          final migrated = v < schema;
          while (v < schema) {
            _migrations[v]!(d);
            d['schema'] = ++v;
          }
          _data = d;
          if (migrated) {
            await File('${_file.path}.bak').writeAsString(await f.readAsString());
            await _save();
          }
          return;
        }
      } catch (_) {}
    }
  }

  Future<void> _save() async {
    if (_readOnly) return;
    final tmp = File('${_file.path}.tmp');
    await tmp.writeAsString(jsonEncode(_data), flush: true);
    await tmp.rename(_file.path);
  }

  String? get lang => _data['lang'] as String?;
  set lang(String? v) {
    _data['lang'] = v;
    _save();
  }

  List<Map<String, dynamic>> get profiles => (_data['profiles'] as List).cast<Map<String, dynamic>>();

  Map<String, dynamic>? get current {
    final id = _data['current'];
    for (final p in profiles) {
      if (p['id'] == id) return p;
    }
    return profiles.isEmpty ? null : profiles.first;
  }

  /// Informations d'inscription : name, birthYear, school, region, centre.
  Future<void> addProfile(Map<String, dynamic> info) async {
    final id = '${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(1 << 32)}';
    profiles.add({...info, 'id': id, 'xp': 0, 'answers': <String, dynamic>{}, 'log': <dynamic>[]});
    _data['current'] = id;
    await _save();
  }

  Future<void> updateProfile(String id, Map<String, dynamic> info) async {
    for (final p in profiles) {
      if (p['id'] == id) p.addAll(info);
    }
    await _save();
  }

  /// Supprime un profil et toute sa progression (le dernier profil ne peut pas l'être).
  Future<bool> deleteProfile(String id) async {
    if (profiles.length <= 1) return false;
    profiles.removeWhere((p) => p['id'] == id);
    if (_data['current'] == id) _data['current'] = profiles.first['id'];
    await _save();
    return true;
  }

  Map<String, dynamic> get reminders => (_data['reminders'] as Map<String, dynamic>?) ?? {};

  Future<void> setReminders(Map<String, dynamic> r) async {
    _data['reminders'] = r;
    await _save();
  }

  /// Journal des réponses du profil courant (le plus ancien d'abord), pour les statistiques.
  List<Map<String, dynamic>> get log => ((current?['log'] as List?) ?? const []).cast<Map<String, dynamic>>();

  Future<void> select(String id) async {
    _data['current'] = id;
    await _save();
  }

  int get xp => (current?['xp'] as int?) ?? 0;

  /// Niveau du joueur : 100 XP pour passer le niveau 1, puis de plus en plus.
  int get level => 1 + sqrt(xp / 100).floor();

  Map<String, dynamic> get _answers => (current?['answers'] as Map<String, dynamic>?) ?? {};

  bool? lastResult(String qid) => (_answers[qid] as Map?)?['ok'] as bool?;

  /// Enregistre une réponse corrigée ; renvoie les XP gagnés (premier succès seulement).
  Future<int> record(Map<String, dynamic> q, bool ok, {String? notion, String? theme, int? ms}) async {
    final p = current;
    if (p == null) return 0;
    final id = q['id'] as String;
    final prev = _answers[id] as Map<String, dynamic>?;
    final firstSuccess = ok && !((prev?['best'] as bool?) ?? false);
    final gain = firstSuccess ? 10 * (q['difficulte'] as int) : 0;
    (p['answers'] as Map<String, dynamic>)[id] = {
      'ok': ok,
      'best': ok || ((prev?['best'] as bool?) ?? false),
      'n': ((prev?['n'] as int?) ?? 0) + 1,
      't': DateTime.now().toUtc().toIso8601String(),
    };
    p['xp'] = xp + gain;
    final log = (p['log'] ??= <dynamic>[]) as List;
    log.add({
      'q': id,
      'ok': ok,
      't': DateTime.now().toIso8601String(),
      'type': q['type'],
      'd': q['difficulte'],
      'n': ?notion,
      'th': ?theme,
      'ms': ?ms,
    });
    if (log.length > 5000) log.removeRange(0, log.length - 5000); // fichier borné
    await _save();
    return gain;
  }

  static bool autoGraded(Map<String, dynamic> q) => !['code', 'simulation', 'preuve'].contains(q['type']);

  /// Part des questions corrigées automatiquement dont la dernière réponse est juste.
  double mastery(Iterable<Map<String, dynamic>> qs) {
    final graded = qs.where(autoGraded).toList();
    if (graded.isEmpty) return 0;
    return graded.where((q) => lastResult(q['id'] as String) == true).length / graded.length;
  }

  double notionMastery(Notion n) => mastery(n.questions);

  bool stepMastered(Notion n, int etape) => mastery(n.questions.where((q) => q['difficulte'] == etape)) >= 0.8;
}
