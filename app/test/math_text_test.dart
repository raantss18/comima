import 'dart:convert';
import 'dart:io';

import 'package:comima/ui/math_text.dart';
import 'package:flutter/material.dart';
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

  test('accolades de groupe LaTeX : jamais affichées', () {
    final r = MathText.fromLatex(r'{Indication pour 2 : écrire $\frac{n+13}{2n+25}$.} et \{a, b\}');
    expect(r, isNot(contains('{Indication')));
    expect(r, contains(r'$\frac{n+13}{2n+25}$')); // formule intacte
    expect(r, contains('{a, b}')); // accolades échappées : conservées
  });

  testWidgets('formule plus large que l\'écran : réduite pour tenir, jamais coupée', (tester) async {
    tester.view.physicalSize = const Size(400, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: MathText(r'$2{,}5 \leqslant \frac{1}{0!} + \frac{1}{1!} + \frac{1}{2!} + \cdots + \frac{1}{n!} \leqslant 4 + \frac{1}{0!} + \frac{1}{1!} + \frac{1}{2!}$ ?'),
        ),
      ),
    ));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    for (final f in find.byType(FittedBox).evaluate()) {
      expect((f.renderObject as RenderBox).size.width, lessThanOrEqualTo(400));
    }
  });

  testWidgets('article : bouton, lien et gras imbriqué, aucun balisage visible', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: MathText('Texte avec **[comima.mg/app](/fr/application/)** et un [lien](https://x.org).\n\n[[Télécharger l\'application]](https://x.org/a.apk)'),
        ),
      ),
    ));
    await tester.pumpAndSettle();
    expect(find.byType(FilledButton), findsOneWidget);
    expect(find.text('comima.mg/app'), findsOneWidget);
    expect(find.textContaining('](' ), findsNothing);
    expect(find.textContaining('[['), findsNothing);
  });
}
