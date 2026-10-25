import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';

/// Statistiques du profil courant, calculées hors ligne à partir du journal d'entraînement.
class StatsTab extends StatelessWidget {
  const StatsTab({super.key});

  static DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final log = s.progress.log;
    if (log.isEmpty) {
      return Center(child: Padding(padding: const EdgeInsets.all(32), child: Text(t('stats_empty', l), textAlign: TextAlign.center)));
    }

    final good = log.where((e) => e['ok'] == true).length;
    final ms = log.fold<int>(0, (a, e) => a + ((e['ms'] as int?) ?? 0));
    final days = <DateTime, (int, int)>{};
    for (final e in log) {
      final d = DateTime.tryParse(e['t'] as String? ?? '');
      if (d == null) continue;
      final k = _day(d);
      final (n, g) = days[k] ?? (0, 0);
      days[k] = (n + 1, g + (e['ok'] == true ? 1 : 0));
    }
    // Séries : jours consécutifs avec au moins une réponse.
    final today = _day(DateTime.now());
    var current = 0;
    for (var d = days.containsKey(today) ? today : today.subtract(const Duration(days: 1));
        days.containsKey(d);
        d = d.subtract(const Duration(days: 1))) {
      current++;
    }
    var best = 0, run = 0;
    DateTime? prev;
    for (final d in days.keys.toList()..sort()) {
      run = (prev != null && d.difference(prev).inDays == 1) ? run + 1 : 1;
      if (run > best) best = run;
      prev = d;
    }

    Map<String, (int, int)> by(String key) {
      final m = <String, (int, int)>{};
      for (final e in log) {
        if (e[key] == null) continue; // réponses reprises de la 0.1.0 : sans thème ni notion
        final k = e[key].toString();
        final (n, g) = m[k] ?? (0, 0);
        m[k] = (n + 1, g + (e['ok'] == true ? 1 : 0));
      }
      return m;
    }

    final notionTitles = {
      for (final p in s.content.packs)
        for (final n in p.notions) n.id: tr(n.titre, l),
    };

    Widget tile(String label, String value, IconData icon) => Expanded(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(children: [
                Icon(icon, color: theme.colorScheme.primary),
                const SizedBox(height: 4),
                Text(value, style: theme.textTheme.titleLarge),
                Text(label, style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
              ]),
            ),
          ),
        );

    Widget section(String title, Map<String, (int, int)> m, String Function(String) name) {
      if (m.isEmpty) return const SizedBox.shrink();
      final keys = m.keys.toList()..sort((a, b) => m[b]!.$1.compareTo(m[a]!.$1));
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 16),
        Text(title, style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
        for (final k in keys)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(children: [
              Expanded(flex: 4, child: Text(name(k), overflow: TextOverflow.ellipsis)),
              Expanded(
                flex: 5,
                child: LinearProgressIndicator(value: m[k]!.$2 / m[k]!.$1, minHeight: 8, borderRadius: BorderRadius.circular(4)),
              ),
              SizedBox(width: 72, child: Text('  ${(100 * m[k]!.$2 / m[k]!.$1).round()} % (${m[k]!.$1})')),
            ]),
          ),
      ]);
    }

    // Activité des 14 derniers jours.
    final last14 = [for (var i = 13; i >= 0; i--) today.subtract(Duration(days: i))];
    final maxN = last14.map((d) => days[d]?.$1 ?? 0).fold<int>(1, (a, b) => b > a ? b : a);

    return ListView(padding: const EdgeInsets.all(16), children: [
      Row(children: [
        tile(t('answers', l), '${log.length}', Icons.edit_note),
        tile(t('success_rate', l), '${(100 * good / log.length).round()} %', Icons.check_circle_outline),
        tile(t('time_spent', l), '${(ms / 60000).round()} min', Icons.timer_outlined),
      ]),
      Row(children: [
        tile(t('streak', l), '$current ${t('days', l)}', Icons.local_fire_department_outlined),
        tile(t('best_streak', l), '$best ${t('days', l)}', Icons.emoji_events_outlined),
        tile(t('active_days', l), '${days.length}', Icons.calendar_month_outlined),
      ]),
      const SizedBox(height: 16),
      Text(t('last_14_days', l), style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
      const SizedBox(height: 8),
      SizedBox(
        height: 90,
        child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          for (final d in last14)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                  Container(
                    height: 70 * (days[d]?.$1 ?? 0) / maxN,
                    decoration: BoxDecoration(color: theme.colorScheme.primary, borderRadius: BorderRadius.circular(3)),
                  ),
                  const SizedBox(height: 4),
                  Text('${d.day}', style: theme.textTheme.labelSmall),
                ]),
              ),
            ),
        ]),
      ),
      section(t('by_theme', l), by('th'), (k) => themeName(k, l)),
      section(t('by_notion', l), by('n'), (k) => notionTitles[k] ?? k),
      section(t('by_type', l), by('type'), (k) => k),
      section(t('by_difficulty', l), by('d'), (k) => '★' * (int.tryParse(k) ?? 1)),
    ]);
  }
}
