import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/i18n.dart';
import 'figure_view.dart';
import 'library.dart';
import 'math_text.dart';
import 'practice.dart';
import 'quiz.dart';
import 'theme.dart';

class NotionPage extends StatelessWidget {
  const NotionPage({super.key, required this.notion});

  final Notion notion;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final st = styleOf(notion.theme);
    final c = readable(context, st.color);
    final chapter = s.content.list('cours').where((x) => x['id'] == notion.raw['chapitre']).firstOrNull;
    final mastery = s.progress.notionMastery(notion);
    return Scaffold(
      appBar: AppBar(),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 28), children: [
        Row(children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(color: c.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(18)),
            child: Icon(st.icon, color: c, size: 30),
          ),
          const SizedBox(width: 14),
          Expanded(child: Text(tr(notion.titre, l), style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800, height: 1.15))),
        ]),
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 4, children: [
          Chip(avatar: Icon(st.icon, size: 16, color: c), label: Text(themeName(notion.theme, l))),
          Chip(label: Text('${t('level', l)} ${notion.niveau} · ${levelName(notion.niveau, l)}')),
          if (chapter != null)
            ActionChip(
              avatar: const Icon(Icons.menu_book, size: 16),
              label: Text(t('course_chapter', l)),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CoursePage(chapter: chapter))),
            ),
        ]),
        const SizedBox(height: 12),
        Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(Icons.lightbulb_outline, color: theme.colorScheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(t('sheet', l), style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700)),
              ]),
              const SizedBox(height: 8),
              MathText(tr(notion.fiche, l), style: theme.textTheme.bodyLarge),
            ]),
          ),
        ),
        FigureView(name: 'fiche-${notion.id}'),
        const SizedBox(height: 18),
        Row(children: [
          Text(t('steps', l), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const Spacer(),
          Text('${(mastery * 100).round()} %', style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.primary)),
        ]),
        const SizedBox(height: 6),
        for (final e in notion.etapes) _StepCard(notion: notion, step: e, color: c),
        const SizedBox(height: 14),
        FilledButton.icon(
          onPressed: () => _start(context, notion.questions),
          icon: const Icon(Icons.playlist_play),
          label: Text('${t('all', l)} · ${notion.questions.length} ${t('questions', l)}'),
        ),
      ]),
    );
  }

  void _start(BuildContext context, List<Map<String, dynamic>> qs) {
    final l = AppScope.of(context).lang;
    Navigator.push(context, MaterialPageRoute(builder: (_) => QuizPage(title: tr(notion.titre, l), questions: qs, notion: notion.id, theme: notion.theme)));
  }
}

class _StepCard extends StatelessWidget {
  const _StepCard({required this.notion, required this.step, required this.color});

  final Notion notion;
  final int step;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final done = s.progress.stepMastered(notion, step);
    final qs = notion.questions.where((q) => q['difficulte'] == step).toList();
    final answered = qs.where((q) => s.progress.lastResult(q['id'] as String) == true).length;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => QuizPage(title: tr(notion.titre, l), questions: qs, notion: notion.id, theme: notion.theme)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            CircleAvatar(
              backgroundColor: done ? theme.colorScheme.primary : color.withValues(alpha: 0.16),
              foregroundColor: done ? theme.colorScheme.onPrimary : color,
              child: done ? const Icon(Icons.check) : Text('$step', style: const TextStyle(fontWeight: FontWeight.w800)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${t('step', l)} $step', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                Text('$answered/${qs.length} ${t('correct_plural', l)} · ${'★' * step}', style: theme.textTheme.bodySmall),
              ]),
            ),
            const Icon(Icons.play_circle_outline),
          ]),
        ),
      ),
    );
  }
}
