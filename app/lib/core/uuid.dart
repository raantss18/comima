import 'dart:math';

final _rng = Random.secure();

/// Identifiant aléatoire (UUID v4). Chaque réponse du journal en reçoit un : l'envoi au serveur
/// est ainsi idempotent (renvoyer deux fois la même réponse ne crée pas de doublon).
String newUuid() {
  final b = List<int>.generate(16, (_) => _rng.nextInt(256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  final h = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
  return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
}
