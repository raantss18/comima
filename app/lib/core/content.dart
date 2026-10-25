import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import 'native.dart';

const siteUrl = 'https://www.comima.mg';
const packFormat = 1;

class Notion {
  Notion(this.raw);
  final Map<String, dynamic> raw;
  String get id => raw['id'] as String;
  String get theme => raw['theme'] as String;
  int get niveau => raw['niveau'] as int;
  Object? get titre => raw['titre'];
  Object? get fiche => raw['fiche'];
  List<Map<String, dynamic>> get questions => (raw['questions'] as List).cast<Map<String, dynamic>>();

  /// Étapes = niveaux de difficulté présents, dans l'ordre.
  List<int> get etapes => (questions.map((q) => q['difficulte'] as int).toSet().toList()..sort());
}

class Pack {
  Pack(this.raw) : notions = (raw['notions'] as List).map((n) => Notion(n as Map<String, dynamic>)).toList();
  final Map<String, dynamic> raw;
  final List<Notion> notions;
  String get id => raw['id'] as String;
  String get theme => raw['theme'] as String;
  int get niveau => raw['niveau'] as int;
}

enum UpdateResult { upToDate, updated, offline, rejected }

/// Contenus hors ligne : paquets fournis avec l'APK, remplacés par les versions téléchargées
/// depuis comima.mg. Chaque fichier est vérifié (SHA-256, moteur Rust) avant d'être utilisé,
/// et l'installation est atomique : un paquet incomplet n'est jamais lu.
class ContentStore {
  Map<String, dynamic> manifest = {};
  List<Pack> packs = [];
  List<Map<String, dynamic>> library = [];

  /// Bibliothèque complète : exercices, cours, sujets, actualités, simulations, centres, régions.
  Map<String, dynamic> libraryMeta = {};

  List<Map<String, dynamic>> list(String key) => ((libraryMeta[key] as List?) ?? const []).cast<Map<String, dynamic>>();
  String source = 'bundle';

  late Directory _base;
  Directory get _dir => Directory('${_base.path}/content');

  String get version => (manifest['version'] ?? '?').toString();

  /// Date de génération d'un manifeste (absente avant la 0.2.0 : la plus ancienne possible).
  static DateTime _stamp(Map<String, dynamic> m) =>
      DateTime.tryParse((m['generatedAt'] ?? '').toString()) ?? DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);

  Future<void> load() async {
    _base = await getApplicationSupportDirectory();
    final old = Directory('${_base.path}/content.old');
    if (!_dir.existsSync() && old.existsSync()) old.renameSync(_dir.path); // échange interrompu
    // Après une mise à jour de l'APK, ses contenus peuvent être plus récents que ceux
    // téléchargés auparavant : on garde toujours les plus récents.
    var localIsNewer = true;
    try {
      final bundled = jsonDecode(utf8.decode(await _bundle('manifest.json'))) as Map<String, dynamic>;
      final local = jsonDecode(await File('${_dir.path}/manifest.json').readAsString()) as Map<String, dynamic>;
      localIsNewer = !_stamp(bundled).isAfter(_stamp(local));
    } catch (_) {}
    if (localIsNewer && File('${_dir.path}/manifest.json').existsSync()) {
      try {
        await _loadFrom((p) async => File('${_dir.path}/$p').readAsBytes());
        source = 'local';
        return;
      } catch (_) {
        // Contenus locaux illisibles ou altérés : retour aux contenus de l'APK.
      }
    }
    await _loadFrom(_bundle);
    source = 'bundle';
  }

  Future<Uint8List> _bundle(String p) async => (await rootBundle.load('assets/content/$p')).buffer.asUint8List();

  static List<Map<String, dynamic>> _files(Map<String, dynamic> m) =>
      [...(m['packs'] as List), m['library']].cast<Map<String, dynamic>>();

  static bool _safePath(String p) => RegExp(r'^[a-z0-9-]+(/[a-z0-9-]+)?\.json$').hasMatch(p);

  Future<void> _loadFrom(Future<Uint8List> Function(String) read) async {
    final m = jsonDecode(utf8.decode(await read('manifest.json'))) as Map<String, dynamic>;
    if (m['format'] != packFormat) throw const FormatException('format');
    final contents = <String, dynamic>{};
    for (final f in _files(m)) {
      final path = f['path'] as String;
      if (!_safePath(path)) throw const FormatException('path');
      final bytes = await read(path);
      if (Engine.instance.sha256(bytes) != f['sha256']) throw const FormatException('sha256');
      contents[path] = jsonDecode(utf8.decode(bytes));
    }
    manifest = m;
    packs = (m['packs'] as List).map((p) => Pack(contents[p['path']] as Map<String, dynamic>)).toList();
    libraryMeta = (contents[m['library']['path']] as Map).cast<String, dynamic>();
    library = list('exercices');
  }

  Future<UpdateResult> update() async {
    final Map<String, dynamic> remote;
    final Uint8List remoteBytes;
    try {
      final res = await http.get(Uri.parse('$siteUrl/app/v$packFormat/manifest.json')).timeout(const Duration(seconds: 15));
      if (res.statusCode != 200) return UpdateResult.offline;
      remoteBytes = res.bodyBytes;
      remote = jsonDecode(utf8.decode(remoteBytes)) as Map<String, dynamic>;
    } catch (_) {
      return UpdateResult.offline;
    }
    if (remote['format'] != packFormat) return UpdateResult.upToDate; // l'APK doit être mis à jour
    if (remote['version'] == manifest['version']) return UpdateResult.upToDate;
    // Le site n'est pas encore à jour (APK plus récent que le dernier déploiement) : on attend.
    if (_stamp(remote).isBefore(_stamp(manifest))) return UpdateResult.upToDate;

    final staging = Directory('${_base.path}/content.new');
    try {
      if (staging.existsSync()) staging.deleteSync(recursive: true);
      Directory('${staging.path}/packs').createSync(recursive: true);
      final have = {for (final f in _files(manifest)) f['path']: f['sha256']};
      for (final f in _files(remote)) {
        final path = f['path'] as String;
        if (!_safePath(path)) return UpdateResult.rejected;
        Uint8List bytes;
        if (have[path] == f['sha256']) {
          bytes = source == 'local' ? await File('${_dir.path}/$path').readAsBytes() : await _bundle(path);
        } else {
          final res = await http.get(Uri.parse('$siteUrl/app/v$packFormat/$path')).timeout(const Duration(seconds: 60));
          if (res.statusCode != 200) return UpdateResult.offline;
          bytes = res.bodyBytes;
        }
        if (Engine.instance.sha256(bytes) != f['sha256']) return UpdateResult.rejected;
        await File('${staging.path}/$path').writeAsBytes(bytes, flush: true);
      }
      await File('${staging.path}/manifest.json').writeAsBytes(remoteBytes, flush: true);

      final old = Directory('${_base.path}/content.old');
      if (old.existsSync()) old.deleteSync(recursive: true);
      if (_dir.existsSync()) _dir.renameSync(old.path);
      staging.renameSync(_dir.path);
      if (old.existsSync()) old.deleteSync(recursive: true);
    } catch (_) {
      return UpdateResult.offline;
    } finally {
      if (staging.existsSync()) staging.deleteSync(recursive: true);
    }
    await load();
    return UpdateResult.updated;
  }
}
