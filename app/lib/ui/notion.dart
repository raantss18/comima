import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/i18n.dart';
import 'math_text.dart';
import 'quiz.dart';

class NotionPage extends StatelessWidget {
  const NotionPage({super.key, required this.notion});

  final Notion notion;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(tr(notion.titre, l))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(t('sheet', l), style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
              const SizedBox(height: 8),
              MathText(tr(notion.fiche, l), style: theme.textTheme.bodyLarge),
            ]),
          ),
        ),
        const SizedBox(height: 8),
        for (final e in notion.etapes)
          Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: s.progress.stepMastered(notion, e) ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                foregroundColor: s.progress.stepMastered(notion, e) ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                child: Text('$e'),
              ),
              title: Text('${t('step', l)} $e'),
              subtitle: Text(
                  '${notion.questions.where((q) => q['difficulte'] == e).length} ${t('questions', l)} · ${'★' * e}'),
              trailing: const Icon(Icons.play_arrow),
              onTap: () => _start(context, notion.questions.where((q) => q['difficulte'] == e).toList()),
            ),
          ),
        const SizedBox(height: 8),
        FilledButton.icon(
          onPressed: () => _start(context, notion.questions),
          icon: const Icon(Icons.playlist_play),
          label: Text('${t('all', l)} (${notion.questions.length} ${t('questions', l)})'),
        ),
      ]),
    );
  }

  void _start(BuildContext context, List<Map<String, dynamic>> qs) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => QuizPage(
            title: tr(notion.titre, AppScope.of(context).lang), questions: qs, notion: notion.id, theme: notion.theme)));
  }
}
