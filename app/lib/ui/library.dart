import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/i18n.dart';
import 'math_text.dart';

/// Exercices du site, consultables hors ligne.
class LibraryTab extends StatefulWidget {
  const LibraryTab({super.key});

  @override
  State<LibraryTab> createState() => _LibraryTabState();
}

class _LibraryTabState extends State<LibraryTab> {
  String _q = '';
  String? _theme;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final q = _q.toLowerCase();
    final items = s.content.library.where((e) {
      if (_theme != null && !(e['theme'] as List).contains(_theme)) return false;
      if (q.isEmpty) return true;
      return tr(e['titre'], l).toLowerCase().contains(q) || (e['source'] ?? '').toString().toLowerCase().contains(q);
    }).toList();
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: TextField(
          decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: t('search', l), border: const OutlineInputBorder(), isDense: true),
          onChanged: (v) => setState(() => _q = v),
        ),
      ),
      SizedBox(
        height: 48,
        child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [
          for (final th in themeNames.keys)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: FilterChip(
                label: Text(themeName(th, l)),
                selected: _theme == th,
                onSelected: (v) => setState(() => _theme = v ? th : null),
              ),
            ),
        ]),
      ),
      Expanded(
        child: ListView.builder(
          itemCount: items.length,
          itemBuilder: (c, i) {
            final e = items[i];
            return ListTile(
              title: Text(tr(e['titre'], l)),
              subtitle: Text('${(e['theme'] as List).map((x) => themeName(x as String, l)).join(', ')} · ${'★' * ((e['difficulte'] as int?) ?? 1)}'),
              onTap: () => Navigator.push(c, MaterialPageRoute(builder: (_) => ExercisePage(ex: e))),
            );
          },
        ),
      ),
    ]);
  }
}

class ExercisePage extends StatelessWidget {
  const ExercisePage({super.key, required this.ex});

  final Map<String, dynamic> ex;

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(tr(ex['titre'], l))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        if (ex['source'] != null) Text('${t('source', l)} : ${ex['source']}', style: theme.textTheme.bodySmall),
        const SizedBox(height: 12),
        MathText(tr(ex['enonce'], l), style: theme.textTheme.bodyLarge),
        if (ex['solution'] != null) ...[
          const Divider(height: 32),
          Text(t('solution_online', l), style: theme.textTheme.titleSmall),
          SelectableText('$siteUrl/${ex['solution']}', style: TextStyle(color: theme.colorScheme.primary)),
        ],
      ]),
    );
  }
}
