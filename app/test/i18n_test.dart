import 'dart:io';

import 'package:comima/core/i18n.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('chaque texte utilisé par l\'interface existe en français et en anglais', () {
    final used = <String>{};
    final re = RegExp(r"""\bt\(\s*'([a-z_0-9]+)'""");
    for (final f in Directory('lib').listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'))) {
      for (final m in re.allMatches(f.readAsStringSync())) {
        used.add(m[1]!);
      }
    }
    // Clés construites : a_<code> (messages de compte), order_<code> (preuves à remettre dans l'ordre).
    final dynamic = ['a_bad_input', 'a_signed_in', 'a_login_cancelled', 'a_offline', 'a_other_account', 'a_login_failed', 'order_intrus', 'order_missing', 'order_order'];
    final missing = <String>[];
    for (final k in [...used, ...dynamic]) {
      if (!hasText(k)) missing.add(k);
    }
    expect(missing, isEmpty, reason: 'textes manquants : $missing');
  });
}
