import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

/// Texte Markdown léger + LaTeX ($…$, $$…$$, \[…\]) rendu hors ligne.
/// Couvre ce qu'utilisent les paquets et les énoncés du site : paragraphes, listes,
/// **gras**, `code`, formules en ligne et centrées.
class MathText extends StatelessWidget {
  const MathText(this.text, {super.key, this.style});

  final String text;
  final TextStyle? style;

  static String _fromLatex(String s) => s
      .replaceAllMapped(RegExp(r'\\\[(.*?)\\\]', dotAll: true), (m) => '\$\$${m[1]}\$\$')
      .replaceAllMapped(RegExp(r'\\textbf\{([^{}]*)\}'), (m) => '**${m[1]}**')
      .replaceAllMapped(RegExp(r'\\(?:emph|textit)\{([^{}]*)\}'), (m) => m[1]!)
      .replaceAll(RegExp(r'\\begin\{(?:enumerate|itemize)\}(\[[^\]]*\])?'), '')
      .replaceAll(RegExp(r'\\end\{(?:enumerate|itemize)\}'), '')
      .replaceAll(RegExp(r'\\item\s*'), '\n• ')
      .replaceAll(r'\og ', '« ')
      .replaceAll(r'\fg{}', ' »')
      .replaceAll(r'\fg', ' »');

  @override
  Widget build(BuildContext context) {
    final base = style ?? DefaultTextStyle.of(context).style;
    // Les formules gardent la typographie mathématique (variables en italique), même en gras.
    final math = TextStyle(fontSize: base.fontSize, color: base.color);
    final src = _fromLatex(text);
    final blocks = <Widget>[];
    final parts = src.split(r'$$');
    for (var i = 0; i < parts.length; i++) {
      if (i.isOdd) {
        blocks.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Center(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Math.tex(parts[i].trim(),
                  textStyle: math, onErrorFallback: (_) => Text(parts[i], style: base)),
            ),
          ),
        ));
        continue;
      }
      for (final para in parts[i].split(RegExp(r'\n\s*\n'))) {
        if (para.trim().isEmpty) continue;
        blocks.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Text.rich(TextSpan(children: _inline(para.trim(), base, math)), style: base),
        ));
      }
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: blocks);
  }

  static List<InlineSpan> _inline(String s, TextStyle base, TextStyle math) {
    final spans = <InlineSpan>[];
    final pieces = s.split(r'$');
    for (var i = 0; i < pieces.length; i++) {
      final p = pieces[i];
      if (i.isOdd && i < pieces.length - 1) {
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Math.tex(p, mathStyle: MathStyle.text, textStyle: math, onErrorFallback: (_) => Text(p, style: base)),
        ));
      } else {
        spans.addAll(_styled(i.isOdd ? '\$$p' : p, base));
      }
    }
    return spans;
  }

  static List<InlineSpan> _styled(String s, TextStyle base) {
    final out = <InlineSpan>[];
    final re = RegExp(r'\*\*(.+?)\*\*|`([^`]+)`');
    var last = 0;
    for (final m in re.allMatches(s)) {
      if (m.start > last) out.add(TextSpan(text: s.substring(last, m.start)));
      if (m[1] != null) {
        out.add(TextSpan(text: m[1], style: const TextStyle(fontWeight: FontWeight.w700)));
      } else {
        out.add(TextSpan(text: m[2], style: const TextStyle(fontFamily: 'monospace')));
      }
      last = m.end;
    }
    if (last < s.length) out.add(TextSpan(text: s.substring(last)));
    return out;
  }
}
