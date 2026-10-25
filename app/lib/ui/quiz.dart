import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/native.dart';
import '../core/progress.dart';
import 'math_text.dart';

/// Une série de questions : saisie → correction par le moteur Rust → explication.
class QuizPage extends StatefulWidget {
  const QuizPage({super.key, required this.title, required this.questions});

  final String title;
  final List<Map<String, dynamic>> questions;

  @override
  State<QuizPage> createState() => _QuizPageState();
}

class _QuizPageState extends State<QuizPage> {
  int _i = 0;
  Object? _answer;
  Map<String, dynamic>? _verdict;
  bool _showManual = false;
  int _good = 0, _graded = 0, _xp = 0;

  Map<String, dynamic> get _q => widget.questions[_i];

  void _check() async {
    final s = AppScope.of(context);
    final l = s.lang;
    final v = Engine.instance.check(_q, _answer);
    if (v['status'] == 'invalid') {
      final parts = (v['parts'] as List?)?.cast<Map<String, dynamic>>();
      final code = parts?.firstWhere((p) => p['status'] == 'invalid', orElse: () => v)['code'] ?? v['code'];
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(engineMessage(code as String?, l))));
      return;
    }
    final ok = v['status'] == 'correct';
    final gain = await s.record(_q, ok);
    setState(() {
      _verdict = v;
      _graded++;
      if (ok) _good++;
      _xp += gain;
    });
  }

  void _next() {
    setState(() {
      _i++;
      _answer = null;
      _verdict = null;
      _showManual = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    if (widget.questions.isEmpty) {
      return Scaffold(appBar: AppBar(title: Text(widget.title)), body: Center(child: Text(t('no_question', l))));
    }
    if (_i >= widget.questions.length) return _summary(context, l);
    final q = _q;
    final theme = Theme.of(context);
    final manual = !ProgressStore.autoGraded(q);
    final done = _verdict != null || _showManual;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(value: _i / widget.questions.length),
        ),
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text('${_i + 1} / ${widget.questions.length} · ${'★' * (q['difficulte'] as int)}', style: theme.textTheme.bodySmall),
        const SizedBox(height: 8),
        MathText(tr(q['enonce'], l), style: theme.textTheme.titleMedium),
        if (q['indice'] != null && !done)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              icon: const Icon(Icons.lightbulb_outline),
              label: Text(t('hint', l)),
              onPressed: () => showDialog<void>(
                context: context,
                builder: (c) => AlertDialog(content: MathText(tr(q['indice'], l))),
              ),
            ),
          ),
        const SizedBox(height: 12),
        if (manual)
          Card(child: Padding(padding: const EdgeInsets.all(12), child: Text(t('manual', l))))
        else
          IgnorePointer(
            ignoring: done,
            child: AnswerInput(key: ValueKey(q['id']), question: q, lang: l, onChanged: (a) => _answer = a),
          ),
        const SizedBox(height: 16),
        if (_verdict != null) _feedback(context, l),
        if (_showManual) _explanation(context, l),
        const SizedBox(height: 8),
        if (!done)
          FilledButton(
            onPressed: manual ? () => setState(() => _showManual = true) : _check,
            child: Text(manual ? t('show_expl', l) : t('check', l)),
          )
        else
          FilledButton(
            onPressed: _next,
            child: Text(_i + 1 < widget.questions.length ? t('next', l) : t('finish', l)),
          ),
      ]),
    );
  }

  Widget _feedback(BuildContext context, String l) {
    final ok = _verdict!['status'] == 'correct';
    final code = _verdict!['code'] as String?;
    final color = ok ? const Color(0xFF1D7A33) : const Color(0xFFD6362B);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
        child: Row(children: [
          Icon(ok ? Icons.check_circle : Icons.cancel, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              ok ? t('correct', l) : (code != null ? '${t('incorrect', l)} ${t('order_$code', l)}' : t('incorrect', l)),
              style: TextStyle(color: color, fontWeight: FontWeight.w700),
            ),
          ),
        ]),
      ),
      _explanation(context, l),
    ]);
  }

  Widget _explanation(BuildContext context, String l) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(t('explanation', l), style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.primary)),
          const SizedBox(height: 6),
          MathText(tr(_q['explication'], l)),
        ]),
      ),
    );
  }

  Widget _summary(BuildContext context, String l) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(_graded > 0 && _good / _graded >= 0.8 ? Icons.emoji_events : Icons.flag, size: 64, color: theme.colorScheme.primary),
            const SizedBox(height: 12),
            Text('${t('score', l)} : $_good / $_graded', style: theme.textTheme.headlineSmall),
            if (_xp > 0) Text('+$_xp ${t('xp', l)}', style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.secondary)),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => setState(() {
                _i = 0;
                _good = _graded = _xp = 0;
                _answer = null;
                _verdict = null;
              }),
              child: Text(t('again', l)),
            ),
            TextButton(onPressed: () => Navigator.pop(context), child: Text(t('back', l))),
          ]),
        ),
      ),
    );
  }
}

/// Saisie adaptée au type de question ; transmet une réponse au format du moteur.
class AnswerInput extends StatelessWidget {
  const AnswerInput({super.key, required this.question, required this.lang, required this.onChanged});

  final Map<String, dynamic> question;
  final String lang;
  final ValueChanged<Object?> onChanged;

  @override
  Widget build(BuildContext context) {
    return switch (question['type']) {
      'qcm' => _Qcm(q: question, lang: lang, onChanged: onChanged),
      'vrai-faux' => _TrueFalse(lang: lang, onChanged: onChanged),
      'ordre' => _Order(q: question, lang: lang, onChanged: onChanged),
      'trous' => _Gaps(q: question, lang: lang, onChanged: onChanged),
      _ => MathField(spec: question, lang: lang, onChanged: onChanged),
    };
  }
}

class _Qcm extends StatefulWidget {
  const _Qcm({required this.q, required this.lang, required this.onChanged});
  final Map<String, dynamic> q;
  final String lang;
  final ValueChanged<Object?> onChanged;

  @override
  State<_Qcm> createState() => _QcmState();
}

class _QcmState extends State<_Qcm> {
  final _sel = <int>{};

  @override
  Widget build(BuildContext context) {
    final choix = widget.q['choix'] as List;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(t('qcm_help', widget.lang), style: Theme.of(context).textTheme.bodySmall),
      for (var k = 0; k < choix.length; k++)
        CheckboxListTile(
          value: _sel.contains(k),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          title: MathText(tr(choix[k], widget.lang)),
          onChanged: (v) {
            setState(() => v! ? _sel.add(k) : _sel.remove(k));
            widget.onChanged(_sel.toList());
          },
        ),
    ]);
  }
}

class _TrueFalse extends StatefulWidget {
  const _TrueFalse({required this.lang, required this.onChanged});
  final String lang;
  final ValueChanged<Object?> onChanged;

  @override
  State<_TrueFalse> createState() => _TrueFalseState();
}

class _TrueFalseState extends State<_TrueFalse> {
  bool? _v;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<bool>(
      emptySelectionAllowed: true,
      segments: [
        ButtonSegment(value: true, label: Text(t('true', widget.lang)), icon: const Icon(Icons.check)),
        ButtonSegment(value: false, label: Text(t('false', widget.lang)), icon: const Icon(Icons.close)),
      ],
      selected: {?_v},
      onSelectionChanged: (s) {
        setState(() => _v = s.isEmpty ? null : s.first);
        widget.onChanged(_v);
      },
    );
  }
}

/// Champ de saisie mathématique : touches utiles + aperçu LaTeX calculé par le moteur Rust.
class MathField extends StatefulWidget {
  const MathField({super.key, required this.spec, required this.lang, required this.onChanged, this.label});
  final Map<String, dynamic> spec;
  final String lang;
  final ValueChanged<Object?> onChanged;
  final String? label;

  @override
  State<MathField> createState() => _MathFieldState();
}

class _MathFieldState extends State<MathField> {
  final _ctrl = TextEditingController();
  Map<String, dynamic>? _preview;

  String get _type => widget.spec['type'] as String;
  List<String> get _vars => ((widget.spec['variables'] as List?) ?? const []).cast<String>();

  List<String> get _keys => switch (_type) {
        'expression' => [..._vars, '^', '/', '(', ')', '√(', 'π'],
        'ensemble' || 'n-uplet' => [';', '-', '/', '√('],
        'intervalle' => ['[', ']', ';', '-∞', '+∞', '-', '/'],
        _ => ['-', '/', '^', '√(', 'π'],
      };

  void _insert(String s) {
    final sel = _ctrl.selection;
    final text = _ctrl.text;
    final start = sel.isValid ? sel.start : text.length;
    final end = sel.isValid ? sel.end : text.length;
    _ctrl.value = TextEditingValue(
      text: text.replaceRange(start, end, s),
      selection: TextSelection.collapsed(offset: start + s.length),
    );
    _changed(_ctrl.text);
  }

  void _changed(String v) {
    widget.onChanged(v);
    if (_type == 'expression' || _type == 'numeric') {
      setState(() => _preview = v.trim().isEmpty ? null : Engine.instance.preview(v, _vars));
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = widget.lang;
    final helper = switch (_type) {
      'ensemble' || 'n-uplet' => t('list_help', l),
      'intervalle' => t('interval_help', l),
      _ => null,
    };
    final theme = Theme.of(context);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      TextField(
        controller: _ctrl,
        onChanged: _changed,
        autocorrect: false,
        enableSuggestions: false,
        keyboardType: _type == 'numeric' ? const TextInputType.numberWithOptions(signed: true, decimal: true) : TextInputType.text,
        style: const TextStyle(fontSize: 18),
        decoration: InputDecoration(
          labelText: widget.label ?? t('your_answer', l),
          helperText: helper,
          border: const OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 6),
      Wrap(spacing: 6, runSpacing: 4, children: [
        for (final k in _keys)
          ActionChip(label: Text(k, style: const TextStyle(fontSize: 16)), onPressed: () => _insert(k), visualDensity: VisualDensity.compact),
      ]),
      if (_preview != null)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: _preview!['ok'] == true
              ? SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Math.tex(_preview!['latex'] as String,
                      textStyle: TextStyle(fontSize: 20, color: theme.colorScheme.primary),
                      onErrorFallback: (_) => const SizedBox.shrink()),
                )
              : Text(engineMessage(_preview!['code'] as String?, l), style: TextStyle(color: theme.colorScheme.error)),
        ),
    ]);
  }
}

/// Preuve puzzle : étapes mélangées (dont les intrus) à remettre dans l'ordre.
class _Order extends StatefulWidget {
  const _Order({required this.q, required this.lang, required this.onChanged});
  final Map<String, dynamic> q;
  final String lang;
  final ValueChanged<Object?> onChanged;

  @override
  State<_Order> createState() => _OrderState();
}

class _OrderState extends State<_Order> {
  late List<int> _items; // indices : étapes 0..n-1, intrus n..
  final _out = <int>{};
  late List<Object?> _texts;

  @override
  void initState() {
    super.initState();
    final etapes = widget.q['etapes'] as List;
    final intrus = (widget.q['intrus'] as List?) ?? const [];
    _texts = [...etapes, ...intrus];
    _items = List.generate(_texts.length, (i) => i);
    final rng = Random(widget.q['id'].hashCode);
    do {
      _items.shuffle(rng);
    } while (_items.length > 1 && List.generate(_items.length, (i) => i).every((i) => _items[i] == i));
    _emit();
  }

  void _emit() => widget.onChanged(_items.where((i) => !_out.contains(i)).toList());

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(t('order_help', widget.lang), style: theme.textTheme.bodySmall),
      ReorderableListView(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        buildDefaultDragHandles: false,
        onReorderItem: (a, b) {
          setState(() => _items.insert(b, _items.removeAt(a)));
          _emit();
        },
        children: [
          for (var k = 0; k < _items.length; k++)
            Card(
              key: ValueKey(_items[k]),
              color: _out.contains(_items[k]) ? theme.colorScheme.surfaceContainerHighest : null,
              child: ReorderableDragStartListener(
                index: k,
                child: ListTile(
                  leading: const Icon(Icons.drag_indicator),
                  title: Opacity(
                    opacity: _out.contains(_items[k]) ? 0.4 : 1,
                    child: MathText(tr(_texts[_items[k]], widget.lang)),
                  ),
                  trailing: IconButton(
                    icon: Icon(_out.contains(_items[k]) ? Icons.undo : Icons.close),
                    onPressed: () {
                      setState(() => _out.contains(_items[k]) ? _out.remove(_items[k]) : _out.add(_items[k]));
                      _emit();
                    },
                  ),
                ),
              ),
            ),
        ],
      ),
    ]);
  }
}

/// Texte à trous : un champ par trou numéroté.
class _Gaps extends StatefulWidget {
  const _Gaps({required this.q, required this.lang, required this.onChanged});
  final Map<String, dynamic> q;
  final String lang;
  final ValueChanged<Object?> onChanged;

  @override
  State<_Gaps> createState() => _GapsState();
}

class _GapsState extends State<_Gaps> {
  late final List<String> _vals = List.filled((widget.q['trous'] as List).length, '');

  @override
  Widget build(BuildContext context) {
    final trous = (widget.q['trous'] as List).cast<Map<String, dynamic>>();
    final texte = tr(widget.q['texte'], widget.lang).replaceAllMapped(RegExp(r'\{\{(\d+)\}\}'), (m) => '**[${m[1]}]**');
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Card(child: Padding(padding: const EdgeInsets.all(12), child: MathText(texte))),
      for (var k = 0; k < trous.length; k++)
        Padding(
          padding: const EdgeInsets.only(top: 10),
          child: MathField(
            spec: trous[k],
            lang: widget.lang,
            label: '[${k + 1}]',
            onChanged: (v) {
              _vals[k] = (v as String?) ?? '';
              widget.onChanged(List<String>.from(_vals));
            },
          ),
        ),
    ]);
  }
}
