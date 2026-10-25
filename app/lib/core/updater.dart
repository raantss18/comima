import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import 'content.dart';
import 'native.dart';

const _system = MethodChannel('mg.comima.app/system');

class AppRelease {
  AppRelease(this.build, this.version, this.notes, this.url, this.sha256, this.bytes, this.mandatory);
  final int build;
  final String version;

  /// Nouveautés de toutes les versions publiées depuis celle installée : [(version, {fr, en})].
  final List<(String, Object?)> notes;
  final String url;
  final String sha256;
  final int bytes;
  final bool mandatory;
}

/// Mise à jour de l'APK depuis `https://www.comima.mg/app/release.json`.
///
/// Ce fichier garde le même format pour toujours : toute version de l'application, même la
/// toute première, sait y lire la dernière version et l'installer directement (pas besoin
/// d'installer les versions intermédiaires). Trois vérifications en chaîne :
///   1. `release.json` est signé (Ed25519, `release.json.sig`) : clé publique dans le cœur Rust ;
///   2. l'APK téléchargé doit avoir l'empreinte SHA-256 annoncée par ce fichier signé ;
///   3. l'installateur Android exige la même clé de signature que l'application installée.
class Updater {
  int build = 0;
  String version = '';
  List<String> abis = const [];

  Future<void> init() async {
    try {
      final info = await _system.invokeMapMethod<String, dynamic>('info');
      build = (info?['build'] as int?) ?? 0;
      version = (info?['version'] as String?) ?? '';
      abis = ((info?['abis'] as List?) ?? const []).cast<String>();
    } catch (_) {}
  }

  /// Nouvelle version disponible, ou null (à jour, hors ligne, fichier illisible).
  Future<AppRelease?> check() async {
    try {
      final res = await http.get(Uri.parse('$siteUrl/app/release.json')).timeout(const Duration(seconds: 15));
      final sig = await http.get(Uri.parse('$siteUrl/app/release.json.sig')).timeout(const Duration(seconds: 15));
      if (res.statusCode != 200 || sig.statusCode != 200) return null;
      if (!Engine.instance.verifyRelease(res.bodyBytes, utf8.decode(sig.bodyBytes))) return null;
      final r = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      final latest = r['latest'] as Map<String, dynamic>;
      final b = latest['build'] as int;
      if (b <= build) return null;
      final apks = latest['apks'] as Map<String, dynamic>;
      // APK propre au processeur du téléphone (plus léger), sinon l'APK universel.
      final abi = abis.firstWhere(apks.containsKey, orElse: () => 'universal');
      final apk = apks[abi] as Map<String, dynamic>;
      final url = apk['url'] as String;
      if (!url.startsWith('https://')) return null;
      final notes = <(String, Object?)>[
        for (final h in ((r['history'] as List?) ?? const []).cast<Map<String, dynamic>>())
          if ((h['build'] as int) > build) (h['version'] as String, h['notes']),
      ];
      return AppRelease(b, latest['version'] as String, notes, url, apk['sha256'] as String,
          (apk['bytes'] as int?) ?? 0, build < ((r['minBuild'] as int?) ?? 0));
    } catch (_) {
      return null;
    }
  }

  /// Télécharge, vérifie et lance l'installation. Renvoie false si le fichier est refusé.
  Future<bool> install(AppRelease r, void Function(double) onProgress) async {
    final dir = Directory('${(await getTemporaryDirectory()).path}/updates');
    if (dir.existsSync()) dir.deleteSync(recursive: true);
    dir.createSync(recursive: true);
    final file = File('${dir.path}/comima-${r.build}.apk');
    final client = http.Client();
    try {
      final res = await client.send(http.Request('GET', Uri.parse(r.url))).timeout(const Duration(seconds: 30));
      if (res.statusCode != 200) return false;
      final total = res.contentLength ?? r.bytes;
      final sink = file.openWrite();
      var got = 0;
      await for (final chunk in res.stream.timeout(const Duration(seconds: 60))) {
        sink.add(chunk);
        got += chunk.length;
        if (total > 0) onProgress(got / total);
      }
      await sink.close();
    } catch (_) {
      return false;
    } finally {
      client.close();
    }
    if (Engine.instance.sha256(await file.readAsBytes()) != r.sha256) {
      file.deleteSync();
      return false;
    }
    if (!((await _system.invokeMethod<bool>('canInstall')) ?? false)) {
      await _system.invokeMethod('openInstallSettings');
      return true;
    }
    await _system.invokeMethod('install', {'path': file.path});
    return true;
  }
}
