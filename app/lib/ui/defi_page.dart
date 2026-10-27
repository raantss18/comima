import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/native.dart';
import '../core/progress.dart';
import 'design.dart';
import 'math_text.dart';
import 'quiz.dart';
import 'theme.dart';

/// Défi chronométré : un maximum de bonnes réponses en 3 minutes, questions tirées au hasard dans tout
/// l'entraînement (réponses courtes seulement), meilleur score gardé. Fonctionne hors ligne.
class DefiPage extends StatefulWidget {
  const DefiPage({super.key});

  @override
  State<DefiPage> createState() => _DefiPageState();
}

enum _Phase { intro, playing, done }

class _DefiPageState extends State<DefiPage> {
  static const total = Duration(minutes: 3);
  static const _quick = {'qcm', 'vrai-faux', 'numeric', 'expression', 'ensemble', 'n-uplet', 'intervalle'};

  _Phase _phase = _Phase.intro;
  final _watch = Stopwatch();
  Timer? _tick;
  List<Map<String, dynamic>> _pool = [];
  int _i = 0;
  int _good = 0, _answered = 0;
  Object? _answer;
  bool? _flash; // true/false pendant le court retour visuel après une réponse
  bool _newBest = false;
  int _best = 0;
  DateTime _qStart = DateTime.now();

  @override
  void initState() {
    super.initState();
    _best = AppScope.read(context).progress.defiBest(AppScope.read(context).progress.current!['id'] as String);
  }

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  Duration get _left {
    final d = total - _watch.elapsed;
    return d.isNegative ? Duration.zero : d;
  }

  void _start() {
    final s = AppScope.read(context);
    final pool = <Map<String, dynamic>>[];
    for (final p in s.content.packs) {
      for (final n in p.notions) {
        for (final q in n.questions) {
          if (_quick.contains(q['type']) && ProgressStore.autoGraded(q)) pool.add({...q, 'notion': n.id, 'theme': n.theme});
        }
      }
    }
    pool.shuffle(math.Random());
    setState(() {
      _pool = pool;
      _i = 0;
      _good = _answered = 0;
      _answer = null;
      _flash = null;
      _qStart = DateTime.now();
      _phase = pool.isEmpty ? _Phase.intro : _Phase.playing;
    });
    if (pool.isEmpty) return;
    _watch
      ..reset()
      ..start();
    _tick?.cancel();
    _tick = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!mounted) return;
      if (_left == Duration.zero) {
        _finish();
      } else {
        setState(() {});
      }
    });
  }

  Future<void> _finish() async {
    _tick?.cancel();
    _watch.stop();
    final s = AppScope.read(context);
    final id = s.progress.current!['id'] as String;
    final better = await s.progress.recordDefi(id, _good);
    if (!mounted) return;
    setState(() {
      _newBest = better && _good > 0;
      _best = s.progress.defiBest(id);
      _phase = _Phase.done;
    });
  }

  Future<void> _submit() async {
    if (_flash != null || _i >= _pool.length) return;
    final s = AppScope.read(context);
    final q = _pool[_i];
    final v = Engine.instance.check(q, _answer);
    if (v['status'] == 'invalid') {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(engineMessage(v['code'] as String?, s.lang))));
      return;
    }
    final ok = v['status'] == 'correct';
    unawaited(s.record(q, ok, notion: q['notion'] as String?, theme: q['theme'] as String?, ms: DateTime.now().difference(_qStart).inMilliseconds));
    setState(() {
      _flash = ok;
      _answered++;
      if (ok) _good++;
    });
    await Future<void>.delayed(const Duration(milliseconds: 650));
    if (!mounted || _phase != _Phase.playing) return;
    setState(() {
      _flash = null;
      _answer = null;
      _i = (_i + 1) % _pool.length;
      _qStart = DateTime.now();
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final c = readable(context, AppSection.defi.color);
    return Scaffold(
      appBar: AppBar(title: Text(t('defi', l)), actions: const [LogoMenuButton()]),
      body: SafeArea(
        top: false,
        child: switch (_phase) {
          _Phase.intro => ListView(padding: const EdgeInsets.all(20), children: [
              const SizedBox(height: 12),
              Center(child: Container(width: 92, height: 92, decoration: BoxDecoration(color: AppSection.defi.color.withValues(alpha: 0.16), shape: BoxShape.circle), child: Icon(Icons.timer_outlined, size: 48, color: c))),
              const SizedBox(height: 18),
              Text(t('defi_title', l), textAlign: TextAlign.center, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(t('defi_rules', l), textAlign: TextAlign.center, style: theme.textTheme.bodyLarge),
              const SizedBox(height: 18),
              if (_best > 0)
                Center(child: Chip(avatar: const Text('🏆'), label: Text('${t('defi_best', l)} : $_best'))),
              const SizedBox(height: 18),
              FilledButton.icon(onPressed: _start, icon: const Icon(Icons.play_arrow_rounded), label: Text(t('defi_start', l))),
              if (s.content.packs.isEmpty) Padding(padding: const EdgeInsets.only(top: 16), child: Text(t('no_content', l), textAlign: TextAlign.center)),
            ]),
          _Phase.playing => _playing(context, s, theme),
          _Phase.done => ListView(padding: const EdgeInsets.all(20), children: [
              const SizedBox(height: 12),
              Center(child: Text(_newBest ? '🏆' : '⏱️', style: const TextStyle(fontSize: 56))),
              const SizedBox(height: 10),
              Text(_newBest ? t('defi_new_best', l) : t('defi_done', l), textAlign: TextAlign.center, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 14),
              Text('$_good', textAlign: TextAlign.center, style: theme.textTheme.displayLarge?.copyWith(fontWeight: FontWeight.w900, color: c)),
              Text('${t('defi_correct', l)} · $_answered ${t('defi_answered', l)}', textAlign: TextAlign.center, style: theme.textTheme.bodyLarge),
              const SizedBox(height: 6),
              Text('${t('defi_best', l)} : $_best', textAlign: TextAlign.center, style: theme.textTheme.bodyMedium),
              const SizedBox(height: 22),
              FilledButton.icon(onPressed: _start, icon: const Icon(Icons.replay), label: Text(t('defi_again', l))),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: t('defi_share', l).replaceAll('{n}', '$_good')));
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('link_copied', l))));
                },
                icon: const Icon(Icons.copy),
                label: Text(t('defi_copy', l)),
              ),
            ]),
        },
      ),
    );
  }

  Widget _playing(BuildContext context, AppState s, ThemeData theme) {
    final l = s.lang;
    final q = _pool[_i];
    final left = _left;
    final frac = left.inMilliseconds / total.inMilliseconds;
    final urgent = left.inSeconds < 20;
    final flashColor = _flash == null ? null : (_flash! ? const Color(0xFF1D7A33) : const Color(0xFFD6362B));
    final mm = left.inMinutes, ss = (left.inSeconds % 60).toString().padLeft(2, '0');
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 6),
        child: Row(children: [
          Text('$mm:$ss', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900, color: urgent ? theme.colorScheme.error : null, fontFeatures: const [FontFeature.tabularFigures()])),
          const SizedBox(width: 12),
          Expanded(child: LinearProgressIndicator(value: frac, minHeight: 8, borderRadius: BorderRadius.circular(4), color: urgent ? theme.colorScheme.error : null)),
          const SizedBox(width: 12),
          Chip(avatar: const Icon(Icons.check_circle, size: 18), label: Text('$_good')),
        ]),
      ),
      Expanded(
        child: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 16), children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(22), border: Border.all(color: flashColor ?? Colors.transparent, width: 3)),
            child: Card(
              margin: EdgeInsets.zero,
              child: Padding(padding: const EdgeInsets.all(16), child: MathText(tr(q['enonce'], l), style: theme.textTheme.titleMedium?.copyWith(height: 1.35))),
            ),
          ),
          const SizedBox(height: 12),
          IgnorePointer(
            ignoring: _flash != null,
            child: AnswerInput(key: ValueKey('${q['id']}-$_answered'), question: q, lang: l, onChanged: (a) => _answer = a),
          ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
        child: Row(children: [
          TextButton(
            onPressed: _flash != null
                ? null
                : () => setState(() {
                      _i = (_i + 1) % _pool.length;
                      _answer = null;
                      _qStart = DateTime.now();
                    }),
            child: Text(t('defi_skip', l)),
          ),
          const SizedBox(width: 8),
          Expanded(child: FilledButton(onPressed: _submit, child: Text(t('check', l)))),
        ]),
      ),
    ]);
  }
}
