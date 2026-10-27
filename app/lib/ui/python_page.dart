import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/native.dart';
import 'design.dart';

/// Petit interpréteur Python : on écrit, on exécute, on voit les affichages (`print`), les questions (`input`), les
/// erreurs expliquées et de petits dessins (`point`, `ligne`, `courbe`, `cercle`, `texte`, `fenetre`). Même moteur
/// borné que les questions de code : pas d'`import`, pas de fichiers.
class PythonPage extends StatefulWidget {
  const PythonPage({super.key});

  @override
  State<PythonPage> createState() => _PythonPageState();
}

class _Example {
  const _Example(this.fr, this.en, this.code);
  final String fr;
  final String en;
  final String code;
}

const _examples = <_Example>[
  _Example('Bonjour', 'Hello', '''nom = input("Comment t'appelles-tu ? ")
print(f"Bonjour {nom} !")
for i in range(1, 4):
    print(i, "x 7 =", i * 7)
'''),
  _Example('PGCD (Euclide)', 'GCD (Euclid)', '''def pgcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a

print("pgcd(1071, 462) =", pgcd(1071, 462))
print("pgcd(17, 5) =", pgcd(17, 5))
'''),
  _Example('Crible d\'Ératosthène', 'Sieve of Eratosthenes', '''n = 50
premier = [True] * (n + 1)
premier[0] = premier[1] = False
for p in range(2, n + 1):
    if premier[p]:
        for k in range(p * p, n + 1, p):
            premier[k] = False
print([p for p in range(n + 1) if premier[p]])
'''),
  _Example('Table de multiplication', 'Times table', '''n = int(input("Quelle table ? "))
for i in range(1, 11):
    print(f"{n} x {i:2d} = {n * i:3d}")
'''),
  _Example('Courbe de x²', 'Graph of x²', '''xs = [x / 2 for x in range(-8, 9)]
ys = [x * x for x in xs]
fenetre(-4, 4, -1, 17)
courbe(xs, ys)
point(2, 4)
texte(-3.8, 15, "y = x²")
'''),
  _Example('Suite de Fibonacci', 'Fibonacci sequence', '''a, b = 0, 1
for i in range(12):
    print(a, end=" ")
    a, b = b, a + b
print()
'''),
];

class _PythonPageState extends State<PythonPage> {
  late final TextEditingController _code;
  final _inputs = <String>[];
  final _answer = TextEditingController();
  final _focus = FocusNode();
  Map<String, dynamic>? _result;
  bool _running = false;

  @override
  void initState() {
    super.initState();
    final saved = AppScope.read(context).pythonCode;
    _code = TextEditingController(text: saved.isNotEmpty ? saved : _examples.first.code);
  }

  @override
  void dispose() {
    _code.dispose();
    _answer.dispose();
    _focus.dispose();
    super.dispose();
  }

  Future<void> _run({bool fresh = true}) async {
    if (fresh) _inputs.clear();
    final s = AppScope.read(context);
    setState(() => _running = true);
    Map<String, dynamic> r;
    try {
      r = await Engine.runAsync(_code.text, List.of(_inputs));
    } catch (_) {
      r = {'kind': 'runtime', 'output': '', 'error': t('py_engine_error', s.lang), 'draws': const []};
    }
    if (!mounted) return;
    setState(() {
      _result = r;
      _running = false;
    });
    if (fresh) s.setPythonCode(_code.text);
  }

  void _useExample(_Example e) {
    setState(() {
      _code.text = e.code;
      _inputs.clear();
      _result = null;
    });
  }

  /// Insère du texte à la position du curseur (touches rapides sous l'éditeur).
  void _insert(String text) {
    final v = _code.value;
    final sel = v.selection.isValid ? v.selection : TextSelection.collapsed(offset: v.text.length);
    final start = math.min(sel.start, sel.end);
    final end = math.max(sel.start, sel.end);
    final out = v.text.replaceRange(start, end, text);
    _code.value = TextEditingValue(text: out, selection: TextSelection.collapsed(offset: start + text.length));
  }

  Future<void> _sendAnswer() async {
    _inputs.add(_answer.text);
    _answer.clear();
    await _run(fresh: false);
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final r = _result;
    final kind = r?['kind'] as String?;
    final draws = ((r?['draws'] as List?) ?? const []).cast<Map<String, dynamic>>();
    return Scaffold(
      appBar: AppBar(title: Text(t('python', l)), actions: const [LogoMenuButton()]),
      body: SafeArea(
        top: false,
        child: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 28), children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              for (final e in _examples)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(label: Text(l == 'en' ? e.en : e.fr), onPressed: () => _useExample(e)),
                ),
            ]),
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHigh.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            child: TextField(
              controller: _code,
              minLines: 9,
              maxLines: 20,
              keyboardType: TextInputType.multiline,
              autocorrect: false,
              enableSuggestions: false,
              textCapitalization: TextCapitalization.none,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 14.5, height: 1.4),
              decoration: InputDecoration.collapsed(hintText: t('py_hint', l)),
              onChanged: (_) {
                if (_result != null) setState(() => _result = null);
              },
            ),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              for (final k in const ['    ', ':', '(', ')', '[', ']', '"', '=', '#', '+', '-', '*', '/', '%', ','])
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: SizedBox(
                    height: 38,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(minimumSize: const Size(44, 38), padding: const EdgeInsets.symmetric(horizontal: 10)),
                      onPressed: () => _insert(k),
                      child: Text(k.trim().isEmpty ? '⇥' : k, style: const TextStyle(fontFamily: 'monospace', fontSize: 16)),
                    ),
                  ),
                ),
            ]),
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: _running ? null : () => _run(),
                icon: _running ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.play_arrow_rounded),
                label: Text(t('py_run', l)),
              ),
            ),
            const SizedBox(width: 10),
            IconButton.outlined(
              tooltip: t('py_clear', l),
              onPressed: () => setState(() {
                _code.clear();
                _result = null;
                _inputs.clear();
              }),
              icon: const Icon(Icons.delete_outline),
            ),
          ]),
          if (r != null) ...[
            const SizedBox(height: 14),
            if ((r['output'] ?? '').toString().isNotEmpty || draws.isEmpty) _Terminal(output: (r['output'] ?? '').toString(), l: l),
            if (kind == 'input') ...[
              const SizedBox(height: 8),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: _answer,
                    focusNode: _focus,
                    autofocus: true,
                    textInputAction: TextInputAction.send,
                    decoration: InputDecoration(hintText: t('py_type_answer', l)),
                    onSubmitted: (_) => _sendAnswer(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(onPressed: _sendAnswer, icon: const Icon(Icons.keyboard_return)),
              ]),
            ],
            if (kind == 'syntax' || kind == 'runtime' || kind == 'limit') ...[
              const SizedBox(height: 8),
              _ErrorBox(kind: kind!, message: (r['error'] ?? '').toString(), line: r['line'] as int?, l: l),
            ],
            if (draws.isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                margin: EdgeInsets.zero,
                clipBehavior: Clip.antiAlias,
                child: AspectRatio(
                  aspectRatio: 4 / 3,
                  child: CustomPaint(painter: _DrawPainter(draws, theme.colorScheme.primary, theme.colorScheme.onSurface)),
                ),
              ),
            ],
          ],
          const SizedBox(height: 18),
          Text(t('py_help', l), style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ]),
      ),
    );
  }
}

class _Terminal extends StatelessWidget {
  const _Terminal({required this.output, required this.l});

  final String output;
  final String l;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF111A15), borderRadius: BorderRadius.circular(20)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(t('py_result', l).toUpperCase(), style: theme.textTheme.labelSmall?.copyWith(color: const Color(0xFF7FD79A), letterSpacing: 1, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        SelectableText(
          output.isEmpty ? t('py_no_output', l) : output,
          style: TextStyle(fontFamily: 'monospace', fontSize: 14, height: 1.4, color: output.isEmpty ? const Color(0xFF8FA396) : const Color(0xFFE8F3EC)),
        ),
      ]),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox({required this.kind, required this.message, required this.line, required this.l});

  final String kind;
  final String message;
  final int? line;
  final String l;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final head = switch (kind) {
      'syntax' => '${t('py_syntax', l)}${line == null ? '' : ' (${t('py_line', l)} $line)'}',
      'limit' => t('py_limit', l),
      _ => t('py_error', l),
    };
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: theme.colorScheme.errorContainer.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(20)),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(Icons.error_outline, color: theme.colorScheme.error),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(head, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800, color: theme.colorScheme.onErrorContainer)),
            if (kind != 'limit' && message.isNotEmpty) Text(message, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onErrorContainer)),
          ]),
        ),
      ]),
    );
  }
}

/// Dessin : repère automatique (ou celui de `fenetre`), axes, courbes, points, segments, cercles et textes.
class _DrawPainter extends CustomPainter {
  _DrawPainter(this.cmds, this.main, this.ink);

  final List<Map<String, dynamic>> cmds;
  final Color main;
  final Color ink;

  double _n(Object? v) => (v as num?)?.toDouble() ?? 0;

  @override
  void paint(Canvas canvas, Size size) {
    // fenêtre : explicite, sinon l'ensemble des éléments
    double? x0, x1, y0, y1;
    void grow(double x, double y) {
      x0 = x0 == null ? x : math.min(x0!, x);
      x1 = x1 == null ? x : math.max(x1!, x);
      y0 = y0 == null ? y : math.min(y0!, y);
      y1 = y1 == null ? y : math.max(y1!, y);
    }

    Map<String, dynamic>? win;
    for (final c in cmds) {
      switch (c['t']) {
        case 'fenetre':
          win = c;
        case 'point' || 'texte':
          grow(_n(c['x']), _n(c['y']));
        case 'ligne':
          grow(_n(c['x1']), _n(c['y1']));
          grow(_n(c['x2']), _n(c['y2']));
        case 'cercle':
          final r = _n(c['r']).abs();
          grow(_n(c['x']) - r, _n(c['y']) - r);
          grow(_n(c['x']) + r, _n(c['y']) + r);
        case 'courbe':
          for (final p in (c['pts'] as List)) {
            grow(_n((p as List)[0]), _n(p[1]));
          }
      }
    }
    var xa = win != null ? _n(win['xmin']) : (x0 ?? -1);
    var xb = win != null ? _n(win['xmax']) : (x1 ?? 1);
    var ya = win != null ? _n(win['ymin']) : (y0 ?? -1);
    var yb = win != null ? _n(win['ymax']) : (y1 ?? 1);
    if (win == null) {
      final px = (xb - xa).abs() * 0.08 + 0.5, py = (yb - ya).abs() * 0.08 + 0.5;
      xa -= px;
      xb += px;
      ya -= py;
      yb += py;
    }
    if (xb - xa < 1e-9) xb = xa + 1;
    if (yb - ya < 1e-9) yb = ya + 1;
    const pad = 22.0;
    final w = size.width - 2 * pad, h = size.height - 2 * pad;
    Offset pt(double x, double y) => Offset(pad + (x - xa) / (xb - xa) * w, pad + (1 - (y - ya) / (yb - ya)) * h);

    final axis = Paint()
      ..color = ink.withValues(alpha: 0.35)
      ..strokeWidth = 1;
    canvas.save();
    canvas.clipRect(Offset.zero & size);
    if (xa <= 0 && xb >= 0) canvas.drawLine(pt(0, ya), pt(0, yb), axis);
    if (ya <= 0 && yb >= 0) canvas.drawLine(pt(xa, 0), pt(xb, 0), axis);
    final stroke = Paint()
      ..color = main
      ..strokeWidth = 2.4
      ..style = PaintingStyle.stroke
      ..strokeJoin = StrokeJoin.round;
    final fill = Paint()..color = main;
    for (final c in cmds) {
      switch (c['t']) {
        case 'courbe':
          final path = Path();
          var first = true;
          for (final p in (c['pts'] as List)) {
            final o = pt(_n((p as List)[0]), _n(p[1]));
            if (first) {
              path.moveTo(o.dx, o.dy);
              first = false;
            } else {
              path.lineTo(o.dx, o.dy);
            }
          }
          canvas.drawPath(path, stroke);
        case 'point':
          canvas.drawCircle(pt(_n(c['x']), _n(c['y'])), 4.5, fill);
        case 'ligne':
          canvas.drawLine(pt(_n(c['x1']), _n(c['y1'])), pt(_n(c['x2']), _n(c['y2'])), stroke);
        case 'cercle':
          final r = _n(c['r']).abs();
          final c0 = pt(_n(c['x']), _n(c['y']));
          canvas.drawOval(Rect.fromCenter(center: c0, width: r / (xb - xa) * w * 2, height: r / (yb - ya) * h * 2), stroke);
        case 'texte':
          final tp = TextPainter(text: TextSpan(text: c['s'].toString(), style: TextStyle(color: ink, fontSize: 13)), textDirection: TextDirection.ltr)..layout(maxWidth: size.width);
          tp.paint(canvas, pt(_n(c['x']), _n(c['y'])));
      }
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _DrawPainter old) => old.cmds != cmds || old.main != main;
}
