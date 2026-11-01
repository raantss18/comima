import 'dart:convert';
import 'dart:io';

/// Résultat d'une lecture du coffre des solutions.
enum CoffreStatus {
  /// Texte trouvé (au serveur ou dans la copie gardée sur ce téléphone).
  ok,

  /// Pas de compte connecté : rien à lire.
  signedOut,

  /// Connecté, mais le serveur ne donne rien : le compte n'est pas (encore) validé comme encadreur.
  denied,

  /// Pas de réseau et pas de copie sur ce téléphone.
  offline,

  /// Le serveur répond, mais il n'y a pas de texte pour cet élément.
  missing,
}

class CoffreResult {
  const CoffreResult(this.status, [this.contenu]);
  final CoffreStatus status;

  /// {fr, en} (LaTeX / Markdown), si [status] est [CoffreStatus.ok].
  final Map<String, dynamic>? contenu;
}

/// Lit les solutions et explications dans le coffre (Supabase) et en garde une copie sur le téléphone, pour qu'un encadreur
/// puisse les relire hors ligne. Le serveur seul décide qui lit : cette classe n'applique aucune règle de rôle. La copie
/// est effacée à la déconnexion.
class CoffreStore {
  /// [fetch] renvoie les lignes {item, contenu} demandées, `null` si aucun compte n'est connecté, et lève une exception
  /// si le réseau manque.
  CoffreStore(this._file, this._fetch);

  final File _file;
  final Future<List<Map<String, dynamic>>?> Function(List<String> items) _fetch;
  Map<String, dynamic>? _cache;

  Future<Map<String, dynamic>> _load() async {
    if (_cache != null) return _cache!;
    try {
      final d = jsonDecode(await _file.readAsString());
      _cache = d is Map ? d.cast<String, dynamic>() : <String, dynamic>{};
    } catch (_) {
      _cache = <String, dynamic>{};
    }
    return _cache!;
  }

  Future<void> _save() async {
    try {
      await _file.parent.create(recursive: true);
      await _file.writeAsString(jsonEncode(_cache));
    } catch (_) {
      // Copie facultative : sans elle, on relit au serveur.
    }
  }

  /// Efface la copie (déconnexion, suppression des données en ligne).
  Future<void> clear() async {
    _cache = <String, dynamic>{};
    try {
      if (_file.existsSync()) await _file.delete();
    } catch (_) {}
  }

  /// Lit plusieurs éléments d'un coup (les manquants sont demandés au serveur en une seule requête).
  Future<Map<String, CoffreResult>> getMany(List<String> items) async {
    final cache = await _load();
    final out = <String, CoffreResult>{
      for (final i in items)
        if (cache[i] is Map) i: CoffreResult(CoffreStatus.ok, (cache[i] as Map).cast<String, dynamic>()),
    };
    final missing = [for (final i in items) if (!out.containsKey(i)) i];
    if (missing.isEmpty) return out;
    List<Map<String, dynamic>>? rows;
    try {
      rows = await _fetch(missing);
    } catch (_) {
      for (final i in missing) {
        out[i] = const CoffreResult(CoffreStatus.offline);
      }
      return out;
    }
    if (rows == null) {
      for (final i in missing) {
        out[i] = const CoffreResult(CoffreStatus.signedOut);
      }
      return out;
    }
    var got = 0;
    for (final r in rows) {
      final item = r['item'];
      final contenu = r['contenu'];
      if (item is String && contenu is Map && missing.contains(item)) {
        cache[item] = contenu;
        out[item] = CoffreResult(CoffreStatus.ok, contenu.cast<String, dynamic>());
        got++;
      }
    }
    if (got > 0) await _save();
    // Le serveur répond mais ne donne rien : soit le compte n'est pas validé (liste vide pour tout), soit ces éléments n'existent pas.
    for (final i in missing) {
      out.putIfAbsent(i, () => CoffreResult(got == 0 ? CoffreStatus.denied : CoffreStatus.missing));
    }
    return out;
  }

  Future<CoffreResult> get(String item) async => (await getMany([item]))[item]!;
}
