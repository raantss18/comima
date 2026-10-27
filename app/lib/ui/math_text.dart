import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/content.dart' show siteUrl;

/// Texte Markdown léger + LaTeX ($…$, $$…$$, \[…\]) rendu hors ligne.
/// Couvre ce qu'utilisent les paquets et les énoncés du site : paragraphes, listes,
/// **gras**, `code`, formules en ligne et centrées.
class MathText extends StatelessWidget {
  const MathText(this.text, {super.key, this.style});

  final String text;
  final TextStyle? style;

  /// Convertit le LaTeX « de texte » (sections, environnements, mises en forme, espaces) en Markdown léger ;
  /// les formules ($…$, $$…$$, \[…\]) sont laissées intactes pour flutter_math. Une commande inconnue n'est
  /// jamais affichée telle quelle : elle disparaît et son argument reste.
  @visibleForTesting
  static String fromLatex(String s) {
    // Formules d'abord (on ne touche à rien dedans), le reste est du texte.
    var t = s.replaceAllMapped(RegExp(r'\\\[(.*?)\\\]', dotAll: true), (m) => '\$\$${m[1]}\$\$');
    final math = RegExp(r'\$\$.*?\$\$|\$[^$]*\$', dotAll: true);
    final out = StringBuffer();
    var last = 0;
    for (final m in math.allMatches(t)) {
      out.write(_text(t.substring(last, m.start)));
      out.write(m[0]);
      last = m.end;
    }
    out.write(_text(t.substring(last)));
    return out.toString();
  }

  static String _text(String s) {
    const arg = r'((?:[^{}]|\{[^{}]*\})*)'; // un niveau d'accolades imbriquées
    var t = s;
    // Titres.
    t = t.replaceAllMapped(RegExp(r'\\(section|chapter)\*?\{' + arg + r'\}'), (m) => '\n\n## ${m[2]}\n\n');
    t = t.replaceAllMapped(RegExp(r'\\(?:subsection|subsubsection|paragraph)\*?\{' + arg + r'\}'), (m) => '\n\n### ${m[1]}\n\n');
    // Environnements : listes en puces, le reste (center, quote, minipage, tabular…) disparaît.
    t = t.replaceAll(RegExp(r'\\begin\{(?:enumerate|itemize|description)\}(\[[^\]]*\])?'), '\n');
    t = t.replaceAll(RegExp(r'\\end\{(?:enumerate|itemize|description)\}'), '\n');
    t = t.replaceAll(RegExp(r'\\item\s*(\[[^\]]*\])?\s*'), '\n• ');
    t = t.replaceAll(RegExp(r'\\(?:begin|end)\{[^{}]*\}(\{[^{}]*\})?(\[[^\]]*\])?'), '\n\n');
    // Mises en forme.
    t = t.replaceAllMapped(RegExp(r'\\textbf\{' + arg + r'\}'), (m) => '**${m[1]}**');
    t = t.replaceAllMapped(RegExp(r'\\texttt\{' + arg + r'\}'), (m) => '`${m[1]}`');
    t = t.replaceAllMapped(RegExp(r'\\(?:emph|textit|textsc|textrm|textsf|underline|mbox|text)\{' + arg + r'\}'), (m) => m[1]!);
    // Espaces, coupures, guillemets, caractères échappés.
    t = t.replaceAll(RegExp(r'\\(?:hfill|medskip|smallskip|bigskip|noindent|par|centering|raggedright|newpage|clearpage|pagebreak|bigbreak)\b\s*'), '');
    t = t.replaceAll(RegExp(r'\\(?:vspace|hspace|vskip|hskip)\*?\{[^{}]*\}'), '');
    t = t.replaceAll(RegExp(r'\\(?:label|ref|cite|index)\{[^{}]*\}'), '');
    t = t.replaceAll(RegExp(r'\\\\(\[[^\]]*\])?|\\newline\b'), '\n');
    t = t.replaceAll(r'\og ', '« ').replaceAll(r'\fg{}', ' »').replaceAll(r'\fg', ' »');
    t = t.replaceAll('~', '\u00a0').replaceAll(RegExp(r'\\[,;:! ]'), ' ');
    // Groupes LaTeX `{ … }` du texte (ex. `{\small …}`) : les accolades ne s'affichent pas ; `\{` et `\}` restent.
    t = t.replaceAll(RegExp(r'(?<!\\)[{}]'), '');
    t = t.replaceAllMapped(RegExp(r'\\([%&#_${}])'), (m) => m[1]!);
    t = t.replaceAll('---', '—').replaceAll('--', '–').replaceAll('``', '“').replaceAll("''", '”');
    // Reste : commande inconnue avec argument → l'argument ; commande seule → rien.
    t = t.replaceAllMapped(RegExp(r'\\[a-zA-Z]+\*?(?:\[[^\]]*\])?\{' + arg + r'\}'), (m) => m[1]!);
    t = t.replaceAll(RegExp(r'\\[a-zA-Z]+\*?'), '');
    return t;
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (context, c) => _content(context, c.maxWidth.isFinite ? c.maxWidth : 600));

  Widget _content(BuildContext context, double maxW) {
    final base = style ?? DefaultTextStyle.of(context).style;
    // Les formules gardent la typographie mathématique (variables en italique), même en gras.
    final math = TextStyle(fontSize: base.fontSize, color: base.color);
    final src = fromLatex(text);
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
        final img = RegExp(r'^!\[([^\]]*)\]\(([^)\s]+)\)$').firstMatch(para.trim());
        if (img != null) {
          // Image d'une actualité : chargée en ligne, rien n'est affiché hors ligne.
          final src = img[2]!.startsWith('http') ? img[2]! : 'https://www.comima.mg${img[2]}';
          blocks.add(Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(src, semanticLabel: img[1], errorBuilder: (_, _, _) => const SizedBox.shrink()),
            ),
          ));
          continue;
        }
        final btn = RegExp(r'^\[\[([^\]\n]+)\]\]\(([^)\s]+)\)$').firstMatch(para.trim());
        if (btn != null) {
          blocks.add(Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(onPressed: () => openLink(btn[2]!), child: Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Text(btn[1]!, textAlign: TextAlign.center))),
            ),
          ));
          continue;
        }
        final h = RegExp(r'^(#{1,4})\s+(.*)$').firstMatch(para.trim());
        if (h != null) {
          blocks.add(Padding(
            padding: const EdgeInsets.only(top: 10, bottom: 4),
            child: Text(h[2]!, style: base.copyWith(fontSize: (base.fontSize ?? 14) * (h[1]!.length <= 2 ? 1.25 : 1.1), fontWeight: FontWeight.w700)),
          ));
          continue;
        }
        blocks.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          // Comme en LaTeX, un retour à la ligne simple n'est qu'une espace (sauf avant une puce).
          child: Text.rich(
            TextSpan(children: _inline(para.trim().replaceAll(RegExp(r'\n(?!\s*(?:[-•]|\d+\.)\s)'), ' '), base, math, maxW, Theme.of(context).colorScheme.primary)),
            style: base,
          ),
        ));
      }
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: blocks);
  }

  static List<InlineSpan> _inline(String s, TextStyle base, TextStyle math, double maxW, Color link) {
    final spans = <InlineSpan>[];
    final pieces = s.split(r'$');
    for (var i = 0; i < pieces.length; i++) {
      final p = pieces[i];
      if (i.isOdd && i < pieces.length - 1) {
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          // Une formule plus large que la ligne est réduite pour tenir (jamais coupée ni hors de l'écran).
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxW),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Math.tex(p, mathStyle: MathStyle.text, textStyle: math, onErrorFallback: (_) => Text(p, style: base)),
            ),
          ),
        ));
      } else {
        spans.addAll(_styled(i.isOdd ? '\$$p' : p, base, link));
      }
    }
    return spans;
  }

  /// Gras (`**…**`), code (`` `…` ``) et liens (`[texte](adresse)`, adresse relative = site comima.mg).
  static List<InlineSpan> _styled(String s, TextStyle base, Color link, {bool bold = false}) {
    final out = <InlineSpan>[];
    final re = RegExp(r'\*\*(.+?)\*\*|`([^`]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)');
    var last = 0;
    final plain = bold ? const TextStyle(fontWeight: FontWeight.w700) : null;
    for (final m in re.allMatches(s)) {
      if (m.start > last) out.add(TextSpan(text: s.substring(last, m.start), style: plain));
      if (m[1] != null) {
        out.addAll(_styled(m[1]!, base, link, bold: true));
      } else if (m[2] != null) {
        out.add(TextSpan(text: m[2], style: const TextStyle(fontFamily: 'monospace')));
      } else {
        final url = m[4]!;
        out.add(WidgetSpan(
          alignment: PlaceholderAlignment.baseline,
          baseline: TextBaseline.alphabetic,
          child: InkWell(
            onTap: () => openLink(url),
            child: Text(m[3]!, style: base.copyWith(color: link, decoration: TextDecoration.underline, fontWeight: bold ? FontWeight.w700 : null)),
          ),
        ));
      }
      last = m.end;
    }
    if (last < s.length) out.add(TextSpan(text: s.substring(last), style: plain));
    return out;
  }

  /// Ouvre une adresse dans le navigateur ; une adresse relative (`/fr/application/`) est celle du site.
  static Future<void> openLink(String url) {
    final u = url.startsWith('http://') || url.startsWith('https://') ? url : '$siteUrl/${url.replaceFirst(RegExp(r'^/'), '')}';
    return launchUrl(Uri.parse(u), mode: LaunchMode.externalApplication);
  }
}
