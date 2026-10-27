import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/native.dart';
import '../core/progress.dart';
import 'design.dart';
import 'math_text.dart';
import 'reminders_section.dart';
import 'theme.dart';

/// Une série de questions : saisie → correction par le moteur Rust → explication.
class QuizPage extends StatefulWidget {
  const QuizPage({
    super.key,
    required this.title,
    required this.questions,
    this.notion,
    this.theme,
  });

  final String title;
  final List<Map<String, dynamic>> questions;

  /// Notion et thème d'origine (statistiques) ; null pour une série mélangée.
  final String? notion;
  final String? theme;

  @override
  State<QuizPage> createState() => _QuizPageState();
}

class _QuizPageState extends State<QuizPage> {
  /// Série corrigée automatiquement ; le reste (code, simulation, preuve rédigée) est proposé à la
  /// fin, au choix, sans score (on ne peut pas le corriger).
  late final List<Map<String, dynamic>> _qs = [for (final q in widget.questions) if (ProgressStore.autoGraded(q)) q];
  late final List<Map<String, dynamic>> _bonus = [for (final q in widget.questions) if (!ProgressStore.autoGraded(q)) q];
  int _i = 0;
  Object? _answer;
  Map<String, dynamic>? _verdict;
  bool _showManual = false;
  int _good = 0, _graded = 0, _xp = 0;
  String? _previous; // résultat de la série précédente, gardé affiché après « Recommencer »
  late List<bool?> _results = List.filled(
    _qs.length,
    null,
  ); // pastilles de progression
  final _clock = Stopwatch()..start(); // temps passé sur la question en cours

  Map<String, dynamic> get _q => _qs[_i];

  void _check() async {
    final s = AppScope.of(context);
    final l = s.lang;
    final v = Engine.instance.check(_q, _answer);
    if (v['status'] == 'invalid') {
      final parts = (v['parts'] as List?)?.cast<Map<String, dynamic>>();
      final code =
          parts?.firstWhere(
            (p) => p['status'] == 'invalid',
            orElse: () => v,
          )['code'] ??
          v['code'];
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(content: Text('${engineMessage(code as String?, l)}${v['detail'] ?? ''}')),
        );
      return;
    }
    final ok = v['status'] == 'correct';
    final gain = await s.record(
      _q,
      ok,
      notion: widget.notion ?? _q['notion'] as String?,
      theme: widget.theme ?? _q['theme'] as String?,
      ms: _clock.elapsedMilliseconds,
    );
    if (!mounted) return;
    setState(() {
      _verdict = v;
      _results[_i] = ok;
      _graded++;
      if (ok) _good++;
      _xp += gain;
    });
  }

  void _next() {
    _clock
      ..reset()
      ..start();
    setState(() {
      _i++;
      _answer = null;
      _verdict = null;
      _showManual = false;
    });
  }

  void _showHint(BuildContext context, String l) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.lightbulb, color: Theme.of(c).colorScheme.primary),
                  const SizedBox(width: 8),
                  Text(
                    t('hint', l),
                    style: Theme.of(c).textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              MathText(tr(_q['indice'], l)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    if (_qs.isEmpty && _bonus.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: Center(child: Text(t('no_question', l))),
      );
    }
    if (_i >= _qs.length) return _summary(context, l);
    final q = _q;
    final theme = Theme.of(context);
    final manual = !ProgressStore.autoGraded(q);
    final done = _verdict != null || _showManual;
    final st = styleOf(widget.theme ?? '');
    final c = readable(context, st.color);
    return Scaffold(
      appBar: AppBar(
        actions: const [LogoMenuButton()],
        title: Text(
          widget.title,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20),
          child: _Dots(results: _results, current: _i),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_previous != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Chip(
                    avatar: const Icon(Icons.history, size: 18),
                    label: Text('${t('previous_series', l)} · $_previous'),
                    visualDensity: VisualDensity.compact,
                  ),
                ),
              ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                children: [
                  // Carte de question, comme dans Tontolo : icône du thème, numéro, difficulté.
                  Card(
                    margin: EdgeInsets.zero,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(st.icon, color: c, size: 22),
                              const SizedBox(width: 8),
                              Text(
                                '${t('question', l)} ${_i + 1}/${_qs.length}',
                                style: theme.textTheme.labelLarge?.copyWith(
                                  color: c,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '★' * (q['difficulte'] as int),
                                style: TextStyle(
                                  color: theme.colorScheme.secondary,
                                  letterSpacing: 2,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          MathText(
                            tr(q['enonce'], l),
                            style: theme.textTheme.titleMedium?.copyWith(
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (manual)
                    Card(
                      margin: EdgeInsets.zero,
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Text(t('manual', l)),
                      ),
                    )
                  else
                    IgnorePointer(
                      ignoring: done,
                      child: AnswerInput(
                        key: ValueKey(q['id']),
                        question: q,
                        lang: l,
                        onChanged: (a) => _answer = a,
                      ),
                    ),
                  const SizedBox(height: 12),
                  if (_verdict != null) _feedback(context, l),
                  if (_showManual) _explanation(context, l),
                ],
              ),
            ),
            // Actions au pouce : indice, puis vérifier / suivante.
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: Row(
                children: [
                  if (q['indice'] != null && !done)
                    ActionChip(
                      avatar: const Icon(Icons.lightbulb_outline, size: 18),
                      label: Text(t('hint', l)),
                      onPressed: () => _showHint(context, l),
                    ),
                  if (q['indice'] != null && !done) const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: !done
                          ? (manual
                                ? () => setState(() => _showManual = true)
                                : _check)
                          : _next,
                      child: Text(
                        !done
                            ? (manual ? t('show_expl', l) : t('check', l))
                            : (_i + 1 < _qs.length
                                  ? t('next', l)
                                  : t('finish', l)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _feedback(BuildContext context, String l) {
    final ok = _verdict!['status'] == 'correct';
    final code = _verdict!['code'] as String?;
    final color = ok ? const Color(0xFF1D7A33) : const Color(0xFFD6362B);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            children: [
              Icon(ok ? Icons.check_circle : Icons.cancel, color: color),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  ok
                      ? t('correct', l)
                      : (code != null
                            ? '${t('incorrect', l)} ${t('order_$code', l)}${(_verdict!['detail'] ?? '').toString().isEmpty ? '' : '\n${_verdict!['detail']}${_verdict!['expected'] == null ? '' : ' (${t('code_expected', l)} : ${_verdict!['expected']})'}'}'
                            : t('incorrect', l)),
                  style: TextStyle(color: color, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        _explanation(context, l),
      ],
    );
  }

  Widget _explanation(BuildContext context, String l) {
    final theme = Theme.of(context);
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.school_outlined,
                  size: 18,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 6),
                Text(
                  t('explanation', l),
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            MathText(tr(_q['explication'], l)),
          ],
        ),
      ),
    );
  }

  Widget _summary(BuildContext context, String l) {
    final s = AppScope.of(context);
    final theme = Theme.of(context);
    final pct = _graded == 0 ? 0.0 : _good / _graded;
    final great = pct >= 0.8;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 12),
            Center(
              child: CircleAvatar(
                radius: 44,
                backgroundColor: great
                    ? theme.colorScheme.primary
                    : theme.colorScheme.secondaryContainer,
                child: Icon(
                  great ? Icons.emoji_events : Icons.trending_up,
                  size: 46,
                  color: great
                      ? theme.colorScheme.onPrimary
                      : theme.colorScheme.onSecondaryContainer,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              great ? t('well_done', l) : t('keep_going', l),
              textAlign: TextAlign.center,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${t('score', l)} : $_good / $_graded',
              textAlign: TextAlign.center,
              style: theme.textTheme.titleLarge,
            ),
            if (_xp > 0)
              Text(
                '+$_xp ${t('xp', l)}',
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.secondary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            const SizedBox(height: 8),
            Center(child: _Dots(results: _results, current: -1)),
            const SizedBox(height: 10),
            // Les réponses sont enregistrées au fur et à mesure : le dire, pour qu'un « Recommencer » par mégarde n'inquiète pas.
            Text(t('progress_saved', l), textAlign: TextAlign.center, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            const SizedBox(height: 14),
            // Après une première série réussie : proposer (une fois) les rappels, sans insister.
            if (s.progress.reminders['asked'] != true) const ReminderInvite(),
            if (_bonus.isNotEmpty)
              OutlinedButton.icon(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BonusPage(title: widget.title, questions: _bonus))),
                icon: const Icon(Icons.extension_outlined),
                label: Text('${t('bonus_title', l)} (${_bonus.length})'),
              ),
            const SizedBox(height: 10),
            FilledButton(
              onPressed: () => setState(() {
                _previous = '${t('score', l)} : $_good / $_graded';
                _i = 0;
                _good = _graded = _xp = 0;
                _results = List.filled(_qs.length, null);
                _answer = null;
                _verdict = null;
              }),
              child: Text(t('again', l)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(t('back', l)),
            ),
          ],
        ),
      ),
    );
  }
}

/// Une pastille par question : verte (juste), rouge (fausse), vide (à venir) ; la courante est cerclée.
class _Dots extends StatelessWidget {
  const _Dots({required this.results, required this.current});

  final List<bool?> results;
  final int current;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var k = 0; k < results.length; k++)
            Container(
              width: results.length > 14 ? 8 : 12,
              height: results.length > 14 ? 8 : 12,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: results[k] == null
                    ? Colors.transparent
                    : (results[k]!
                          ? const Color(0xFF1D7A33)
                          : scheme.secondary),
                border: Border.all(
                  color: k == current ? scheme.primary : scheme.outlineVariant,
                  width: k == current ? 2.5 : 1.5,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Saisie adaptée au type de question ; transmet une réponse au format du moteur.
class AnswerInput extends StatelessWidget {
  const AnswerInput({
    super.key,
    required this.question,
    required this.lang,
    required this.onChanged,
  });

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
      'code' => _CodeEditor(q: question, lang: lang, onChanged: onChanged),
      _ => MathField(spec: question, lang: lang, onChanged: onChanged),
    };
  }
}

/// Éditeur de code Python : le squelette de l'énoncé, quelques exemples, et le code est exécuté par le moteur.
class _CodeEditor extends StatefulWidget {
  const _CodeEditor({required this.q, required this.lang, required this.onChanged});
  final Map<String, dynamic> q;
  final String lang;
  final ValueChanged<Object?> onChanged;

  @override
  State<_CodeEditor> createState() => _CodeEditorState();
}

class _CodeEditorState extends State<_CodeEditor> {
  late final TextEditingController _c = TextEditingController(text: tr(widget.q['squelette'], widget.lang).toString().trimRight());

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => widget.onChanged(_c.text));
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  static String _py(Object? v) => switch (v) {
        null => 'None',
        true => 'True',
        false => 'False',
        String x => "'$x'",
        List x => '[${x.map(_py).join(', ')}]',
        _ => '$v',
      };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tests = (widget.q['tests'] as List? ?? const []).cast<Map<String, dynamic>>();
    final fn = widget.q['fonction'];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.only(bottom: 8, left: 4),
        child: Text(t('code_hint', widget.lang), style: theme.textTheme.bodySmall),
      ),
      if (tests.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(bottom: 8, left: 4),
          child: Text(
            '${t('code_examples', widget.lang)} : ${tests.map((x) => '$fn(${(x['entree'] as List).map(_py).join(', ')}) → ${_py(x['sortie'])}').join('   ·   ')}',
            style: theme.textTheme.bodySmall?.copyWith(fontFamily: 'monospace'),
          ),
        ),
      TextField(
        controller: _c,
        onChanged: widget.onChanged,
        minLines: 8,
        maxLines: 18,
        keyboardType: TextInputType.multiline,
        autocorrect: false,
        enableSuggestions: false,
        textCapitalization: TextCapitalization.none,
        style: const TextStyle(fontFamily: 'monospace', fontSize: 14, height: 1.35),
        decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
      ),
    ]);
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
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8, left: 4),
          child: Text(
            t('qcm_help', widget.lang),
            style: theme.textTheme.bodySmall,
          ),
        ),
        for (var k = 0; k < choix.length; k++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Material(
              color: _sel.contains(k)
                  ? theme.colorScheme.primaryContainer
                  : theme.colorScheme.surfaceContainerHigh.withValues(
                      alpha: 0.55,
                    ),
              borderRadius: BorderRadius.circular(18),
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () {
                  setState(
                    () => _sel.contains(k) ? _sel.remove(k) : _sel.add(k),
                  );
                  widget.onChanged(_sel.toList());
                },
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: _sel.contains(k)
                            ? theme.colorScheme.primary
                            : theme.colorScheme.surfaceContainerHighest,
                        foregroundColor: _sel.contains(k)
                            ? theme.colorScheme.onPrimary
                            : theme.colorScheme.onSurface,
                        child: Text(
                          String.fromCharCode(65 + k),
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: MathText(tr(choix[k], widget.lang))),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
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
        ButtonSegment(
          value: true,
          label: Text(t('true', widget.lang)),
          icon: const Icon(Icons.check),
        ),
        ButtonSegment(
          value: false,
          label: Text(t('false', widget.lang)),
          icon: const Icon(Icons.close),
        ),
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
  const MathField({
    super.key,
    required this.spec,
    required this.lang,
    required this.onChanged,
    this.label,
  });
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
  List<String> get _vars =>
      ((widget.spec['variables'] as List?) ?? const []).cast<String>();

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
      setState(
        () => _preview = v.trim().isEmpty
            ? null
            : Engine.instance.preview(v, _vars),
      );
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _ctrl,
          onChanged: _changed,
          autocorrect: false,
          enableSuggestions: false,
          keyboardType: _type == 'numeric'
              ? const TextInputType.numberWithOptions(
                  signed: true,
                  decimal: true,
                )
              : TextInputType.text,
          style: const TextStyle(fontSize: 18),
          decoration: InputDecoration(
            labelText: widget.label ?? t('your_answer', l),
            helperText: helper,
            border: const OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 4,
          children: [
            for (final k in _keys)
              ActionChip(
                label: Text(k, style: const TextStyle(fontSize: 16)),
                onPressed: () => _insert(k),
                visualDensity: VisualDensity.compact,
              ),
          ],
        ),
        if (_preview != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: _preview!['ok'] == true
                ? SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Math.tex(
                      _preview!['latex'] as String,
                      textStyle: TextStyle(
                        fontSize: 20,
                        color: theme.colorScheme.primary,
                      ),
                      onErrorFallback: (_) => const SizedBox.shrink(),
                    ),
                  )
                : Text(
                    engineMessage(_preview!['code'] as String?, l),
                    style: TextStyle(color: theme.colorScheme.error),
                  ),
          ),
      ],
    );
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
    } while (_items.length > 1 &&
        List.generate(_items.length, (i) => i).every((i) => _items[i] == i));
    _emit();
  }

  void _emit() =>
      widget.onChanged(_items.where((i) => !_out.contains(i)).toList());

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                color: _out.contains(_items[k])
                    ? theme.colorScheme.surfaceContainerHighest
                    : null,
                child: ReorderableDragStartListener(
                  index: k,
                  child: ListTile(
                    leading: const Icon(Icons.drag_indicator),
                    title: Opacity(
                      opacity: _out.contains(_items[k]) ? 0.4 : 1,
                      child: MathText(tr(_texts[_items[k]], widget.lang)),
                    ),
                    trailing: IconButton(
                      icon: Icon(
                        _out.contains(_items[k]) ? Icons.undo : Icons.close,
                      ),
                      onPressed: () {
                        setState(
                          () => _out.contains(_items[k])
                              ? _out.remove(_items[k])
                              : _out.add(_items[k]),
                        );
                        _emit();
                      },
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
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
  late final List<String> _vals = List.filled(
    (widget.q['trous'] as List).length,
    '',
  );

  @override
  Widget build(BuildContext context) {
    final trous = (widget.q['trous'] as List).cast<Map<String, dynamic>>();
    final texte = tr(
      widget.q['texte'],
      widget.lang,
    ).replaceAllMapped(RegExp(r'\{\{(\d+)\}\}'), (m) => '**[${m[1]}]**');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: MathText(texte),
          ),
        ),
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
      ],
    );
  }
}

/// Défis facultatifs (code, simulation, preuve rédigée) : l'énoncé, un indice, puis l'explication à la
/// demande. Rien n'est compté (pas de score, pas de XP) : on ne peut pas les corriger automatiquement.
class BonusPage extends StatelessWidget {
  const BonusPage({super.key, required this.title, required this.questions});

  final String title;
  final List<Map<String, dynamic>> questions;

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text(t('bonus_intro', l), style: theme.textTheme.bodyMedium),
        const SizedBox(height: 12),
        for (final q in questions)
          Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                MathText(tr(q['enonce'], l), style: theme.textTheme.titleMedium?.copyWith(height: 1.35)),
                if (q['indice'] != null)
                  ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    leading: const Icon(Icons.lightbulb_outline),
                    title: Text(t('hint', l)),
                    children: [Align(alignment: Alignment.centerLeft, child: MathText(tr(q['indice'], l)))],
                  ),
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  leading: const Icon(Icons.school_outlined),
                  title: Text(t('show_expl', l)),
                  children: [Align(alignment: Alignment.centerLeft, child: MathText(tr(q['explication'], l)))],
                ),
              ]),
            ),
          ),
      ]),
    );
  }
}
