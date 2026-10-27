import 'dart:math';

import 'native.dart';

/// Construit la question d'un modèle (`kind`) au niveau `level`, pour la graine `seed` ; null si impossible.
typedef GenerateFn = Map<String, dynamic>? Function(String kind, int level, int seed);

/// Questions **générées** (voir `app/native/src/gen.rs`) : mêmes modèles, nombres tirés au hasard, réponse calculée par le
/// moteur. Elles rendent chaque série différente, même au même niveau. Si le moteur n'est pas disponible, on n'en produit
/// simplement pas : l'application garde ses questions rédigées.
class Generator {
  Generator({GenerateFn? generate, List<Map<String, dynamic>>? kinds, Random? random})
      : _generate = generate ?? _engineGenerate,
        // ignore: prefer_initializing_formals
        _kinds = kinds,
        _random = random ?? Random();

  static final Generator instance = Generator();

  final GenerateFn _generate;
  final Random _random;
  List<Map<String, dynamic>>? _kinds;

  static Map<String, dynamic>? _engineGenerate(String kind, int level, int seed) {
    try {
      final q = Engine.instance.generate(kind, level, seed);
      return q.containsKey('error') ? null : q;
    } catch (_) {
      return null;
    }
  }

  List<Map<String, dynamic>> get kinds {
    try {
      return _kinds ??= Engine.instance.kinds();
    } catch (_) {
      return const [];
    }
  }

  /// Modèles rattachés à l'une des notions données (toutes si `notions` est null).
  List<Map<String, dynamic>> kindsFor(Set<String>? notions) => [
        for (final k in kinds)
          if (notions == null || (k['notions'] as List).any((n) => notions.contains(n))) k,
      ];

  int _seed() => _random.nextInt(1 << 30) * 1024 + _random.nextInt(1024);

  /// `count` questions variées (modèles différents d'abord) aux niveaux autour de `tier` (1 à 5).
  List<Map<String, dynamic>> mixed(Set<String>? notions, int count, {int tier = 1, bool exact = false}) {
    final ks = kindsFor(notions);
    if (ks.isEmpty || count <= 0) return const [];
    final order = [...ks]..shuffle(_random);
    final out = <Map<String, dynamic>>[];
    final seen = <String>{};
    for (var i = 0; out.length < count && i < count * 6; i++) {
      final kind = order[i % order.length]['id'] as String;
      final level = exact ? tier.clamp(1, 5) : (tier + const [-1, 0, 0, 1][_random.nextInt(4)]).clamp(1, 5);
      final q = _generate(kind, level, _seed());
      if (q == null) continue;
      // Pas deux fois le même énoncé dans une série.
      final key = '${q['enonce']}${q['choix']}';
      if (seen.add(key)) out.add(q);
    }
    return out;
  }

  /// `count` questions d'une notion, exactement au niveau (étape) `level`.
  List<Map<String, dynamic>> forNotion(String notionId, int level, int count) => mixed({notionId}, count, tier: level, exact: true);
}
