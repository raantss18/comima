import 'dart:convert';
import 'dart:io';

import 'package:comima/ui/math_text.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('LaTeX de texte : titres, environnements et mises en forme ne s\'affichent jamais bruts', () {
    final r = MathText.fromLatex(
        r'\begin{center} Premier jour --- lundi 21 septembre 2020 \end{center}'
        '\n\n'
        r'\subsection*{Problème 1} On considère $ABCD$ et \textbf{gras} avec \emph{accent}~:'
        r' \[ \widehat{PAD} = 1 \] \vspace{2mm} \hfill fin');
    expect(r, isNot(contains(r'\begin')));
    expect(r, isNot(contains(r'\end')));
    expect(r, isNot(contains(r'\subsection')));
    expect(r, isNot(contains(r'\textbf')));
    expect(r, isNot(contains(r'\vspace')));
    expect(r, contains('### Problème 1'));
    expect(r, contains('**gras**'));
    expect(r, contains('Premier jour — lundi'));
    // Les formules restent intactes.
    expect(r, contains(r'$ABCD$'));
    expect(r, contains(r'$$ \widehat{PAD} = 1 $$'));
  });

  test('listes et caractères échappés', () {
    final r = MathText.fromLatex(r'\begin{enumerate}[label=(\alph*)] \item Un \item Deux \end{enumerate} 50\% \& $a\%b$');
    expect(r, contains('• Un'));
    expect(r, contains('• Deux'));
    expect(r, contains('50% &'));
    expect(r, contains(r'$a\%b$')); // dans une formule : inchangé
    expect(r, isNot(contains(r'\begin')));
  });

  test('toute la bibliothèque : aucune commande LaTeX de texte ne reste hors des formules', () {
    final f = File('../public/app/v1/library.json');
    if (!f.existsSync()) return; // fichier généré (npm run app-packs)
    final lib = jsonDecode(f.readAsStringSync()) as Map<String, dynamic>;
    final bad = <String>[];
    for (final k in ['exercices', 'sujets']) {
      for (final e in (lib[k] as List).cast<Map<String, dynamic>>()) {
        for (final field in [e['enonce'], e['epreuve'], e['solutionTex']]) {
          final texts = field is Map ? field.values : [field];
          for (final raw in texts) {
            if (raw is! String) continue;
            final out = MathText.fromLatex(raw).replaceAll(RegExp(r'\$\$.*?\$\$|\$[^\$]*\$', dotAll: true), '');
            final m = RegExp(r'\\[a-zA-Z]+').firstMatch(out);
            if (m != null) bad.add('${e['id']}: ${m[0]}');
          }
        }
      }
    }
    expect(bad, isEmpty, reason: bad.take(10).join('\n'));
  });
}
