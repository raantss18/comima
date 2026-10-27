import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';

typedef _Str2 = Pointer<Utf8> Function(Pointer<Utf8>, Pointer<Utf8>);
typedef _ShaN = Pointer<Utf8> Function(Pointer<Uint8>, Size);
typedef _ShaD = Pointer<Utf8> Function(Pointer<Uint8>, int);
typedef _VerN = Int32 Function(Pointer<Uint8>, Size, Pointer<Utf8>);
typedef _VerD = int Function(Pointer<Uint8>, int, Pointer<Utf8>);
typedef _FreeN = Void Function(Pointer<Utf8>);
typedef _FreeD = void Function(Pointer<Utf8>);

/// Pont vers le cœur Rust (`app/native`) : correction des réponses, aperçu LaTeX, empreintes.
class Engine {
  Engine._(DynamicLibrary lib)
      : _check = lib.lookupFunction<_Str2, _Str2>('comima_check'),
        _preview = lib.lookupFunction<_Str2, _Str2>('comima_preview'),
        _run = lib.lookupFunction<_Str2, _Str2>('comima_run'),
        _sha = lib.lookupFunction<_ShaN, _ShaD>('comima_sha256'),
        _verify = lib.lookupFunction<_VerN, _VerD>('comima_verify_release'),
        _free = lib.lookupFunction<_FreeN, _FreeD>('comima_free');

  static final Engine instance = Engine._(
    DynamicLibrary.open(Platform.isAndroid ? 'libcomima_core.so' : 'native/target/release/libcomima_core.so'),
  );

  final _Str2 _check;
  final _Str2 _preview;
  final _Str2 _run;
  final _ShaD _sha;
  final _VerD _verify;
  final _FreeD _free;

  String _call2(_Str2 f, String a, String b) {
    final pa = a.toNativeUtf8();
    final pb = b.toNativeUtf8();
    try {
      final r = f(pa, pb);
      final s = r.toDartString();
      _free(r);
      return s;
    } finally {
      malloc.free(pa);
      malloc.free(pb);
    }
  }

  /// Verdict : {status: correct|incorrect|invalid|manual, code?, parts?}
  Map<String, dynamic> check(Map<String, dynamic> question, Object? answer) =>
      jsonDecode(_call2(_check, jsonEncode(question), jsonEncode(answer))) as Map<String, dynamic>;

  /// {ok: true, latex} ou {ok: false, code}
  Map<String, dynamic> preview(String input, List<String> vars) =>
      jsonDecode(_call2(_preview, input, jsonEncode(vars))) as Map<String, dynamic>;

  /// Exécute un programme Python (page « Interpréteur »). `inputs` : réponses déjà données à `input()`.
  /// Résultat : {kind: ok|syntax|runtime|limit|input, output, error, line, needInput, draws}.
  Map<String, dynamic> run(String code, List<String> inputs) =>
      jsonDecode(_call2(_run, code, jsonEncode(inputs))) as Map<String, dynamic>;

  /// Comme [run], dans un autre fil d'exécution : l'écran reste fluide même si le programme travaille longtemps.
  static Future<Map<String, dynamic>> runAsync(String code, List<String> inputs) =>
      Isolate.run(() => Engine.instance.run(code, inputs));

  String sha256(Uint8List bytes) {
    final p = malloc<Uint8>(bytes.isEmpty ? 1 : bytes.length);
    try {
      p.asTypedList(bytes.length).setAll(0, bytes);
      final r = _sha(p, bytes.length);
      final s = r.toDartString();
      _free(r);
      return s;
    } finally {
      malloc.free(p);
    }
  }

  /// Vrai si `sigHex` est la signature Ed25519 de `data` par la clé des mises à jour COMIMa.
  bool verifyRelease(Uint8List data, String sigHex) {
    final p = malloc<Uint8>(data.isEmpty ? 1 : data.length);
    final s = sigHex.toNativeUtf8();
    try {
      p.asTypedList(data.length).setAll(0, data);
      return _verify(p, data.length, s) == 1;
    } finally {
      malloc.free(p);
      malloc.free(s);
    }
  }
}
