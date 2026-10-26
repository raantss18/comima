import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/progress.dart';
import 'marks.dart';

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
    if (log.isEmpty && s.progress.markCounts.isEmpty) {
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

    // Tuile : le nombre se réduit pour tenir (grande police, longs nombres) au lieu de déborder.
    Widget tile(String label, String value, IconData icon) => Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 12, 8, 10),
            child: Column(mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(icon, color: theme.colorScheme.primary),
              const SizedBox(height: 4),
              SizedBox(
                width: double.infinity,
                child: FittedBox(fit: BoxFit.scaleDown, child: Text(value, style: theme.textTheme.titleLarge)),
              ),
              Text(label, style: theme.textTheme.bodySmall, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
            ]),
          ),
        );

    // Trois tuiles par ligne, avec un vrai espace entre elles ; deux seulement quand la place
    // manque (écran étroit ou grande police), pour qu'aucun mot ne soit coupé ni chevauché.
    Widget tiles(List<Widget> items) => LayoutBuilder(builder: (context, c) {
          const gap = 8.0;
          final scale = MediaQuery.textScalerOf(context).scale(1);
          final cols = c.maxWidth / scale < 300 ? 2 : 3;
          // Une rangée = tuiles de même hauteur (la plus haute fixe les autres).
          return Column(children: [
            for (var i = 0; i < items.length; i += cols)
              Padding(
                padding: EdgeInsets.only(top: i == 0 ? 0 : gap),
                child: IntrinsicHeight(
                  child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    for (var j = 0; j < cols; j++) ...[
                      if (j > 0) const SizedBox(width: gap),
                      Expanded(child: i + j < items.length ? items[i + j] : const SizedBox.shrink()),
                    ],
                  ]),
                ),
              ),
          ]);
        });

    // Une ligne « libellé · barre · valeur » : la valeur garde sa place (réduite si besoin), le
    // libellé s'abrège avec « … » sans toucher la barre.
    Widget barRow(String label, double ratio, String value) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Row(children: [
            Expanded(flex: 6, child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis)),
            const SizedBox(width: 10),
            Expanded(flex: 4, child: LinearProgressIndicator(value: ratio.clamp(0, 1).toDouble(), minHeight: 8, borderRadius: BorderRadius.circular(4))),
            const SizedBox(width: 10),
            SizedBox(width: 84, child: FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerRight, child: Text(value))),
          ]),
        );

    Widget heading(String title) => Padding(
          padding: const EdgeInsets.only(top: 22, bottom: 6),
          child: Text(title, style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
        );

    Widget section(String title, Map<String, (int, int)> m, String Function(String) name) {
      if (m.isEmpty) return const SizedBox.shrink();
      final keys = m.keys.toList()..sort((a, b) => m[b]!.$1.compareTo(m[a]!.$1));
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        heading(title),
        for (final k in keys) barRow(name(k), m[k]!.$2 / m[k]!.$1, '${(100 * m[k]!.$2 / m[k]!.$1).round()} % (${m[k]!.$1})'),
      ]);
    }

    // ---- Exercices, cours et sujets des bibliothèques : combien faits, sur combien. ----
    final marks = s.progress;
    final lib = s.content.library;
    bool isDone(String kind, Object? id) => marks.markStatus(ProgressStore.markKey(kind, id)) == 'fait';
    bool seen(String kind, Object? id) => marks.markStatus(ProgressStore.markKey(kind, id)) != null;
    final cours = s.content.list('cours');
    final sujets = s.content.list('sujets');
    final exoDone = lib.where((e) => isDone('exo', e['id'])).length;
    final exoSeen = lib.where((e) => seen('exo', e['id'])).length;
    Widget countRow(String label, Iterable<Map<String, dynamic>> items, String kind) {
      final total = items.length;
      final done = items.where((e) => isDone(kind, e['id'])).length;
      return barRow(label, total == 0 ? 0 : done / total, '$done / $total');
    }
    final libraryStats = lib.isEmpty
        ? const <Widget>[]
        : <Widget>[
            heading(t('lib_progress', l)),
            tiles([
              tile(t('exo_done', l), '$exoDone / ${lib.length}', Icons.check_circle),
              tile(t('exo_started', l), '$exoSeen', Icons.edit_outlined),
              tile(t('mark_star', l), '${marks.markCounts['star'] ?? 0}', Icons.star_border),
            ]),
            const SizedBox(height: 6),
            for (var n = 1; n <= 5; n++)
              if (lib.any((e) => e['palier'] == n)) countRow(t('palier_$n', l), lib.where((e) => e['palier'] == n), 'exo'),
            heading(t('year_progression', l)),
            for (var n = 1; n <= 7; n++)
              if (lib.any((e) => e['progression'] == n)) countRow('$n · ${t('prog_$n', l)}', lib.where((e) => e['progression'] == n), 'exo'),
            heading(t('courses_papers', l)),
            countRow(t('chapters', l), cours, 'cours'),
            if (sujets.isNotEmpty) countRow(t('papers', l), sujets, 'sujet'),
          ];

    // Activité des 14 derniers jours.
    final last14 = [for (var i = 13; i >= 0; i--) today.subtract(Duration(days: i))];
    final maxN = last14.map((d) => days[d]?.$1 ?? 0).fold<int>(1, (a, b) => b > a ? b : a);

    return ListView(padding: const EdgeInsets.all(16), children: [
      if (log.isNotEmpty) ...[
        tiles([
          tile(t('answers', l), '${log.length}', Icons.edit_note),
          tile(t('success_rate', l), '${(100 * good / log.length).round()} %', Icons.check_circle_outline),
          tile(t('time_spent', l), '${(ms / 60000).round()} min', Icons.timer_outlined),
          tile(t('streak', l), '$current ${t('days', l)}', Icons.local_fire_department_outlined),
          tile(t('best_streak', l), '$best ${t('days', l)}', Icons.emoji_events_outlined),
          tile(t('active_days', l), '${days.length}', Icons.calendar_month_outlined),
        ]),
      ],
      ...libraryStats,
      if (s.progress.markCounts.isNotEmpty) ...[
        heading(t('mark_stats', l)),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final k in ['fait', 'continuer', 'teste', 'lu'])
            if ((s.progress.markCounts[k] ?? 0) > 0)
              Chip(avatar: Icon(markIcon(k), size: 18, color: markColor(context, k)), label: Text('${markLabel(k, l)} · ${s.progress.markCounts[k]}')),
          if ((s.progress.markCounts['star'] ?? 0) > 0)
            Chip(avatar: const Icon(Icons.star, size: 18, color: Color(0xFFF59E0B)), label: Text('${t('mark_star', l)} · ${s.progress.markCounts['star']}')),
        ]),
      ],
      if (log.isNotEmpty) ...[
        heading(t('last_14_days', l)),
        SizedBox(
          height: 96,
          child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            for (final d in last14)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 1.5),
                  child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                    Container(
                      height: 70 * (days[d]?.$1 ?? 0) / maxN,
                      decoration: BoxDecoration(color: theme.colorScheme.primary, borderRadius: BorderRadius.circular(3)),
                    ),
                    const SizedBox(height: 4),
                    // Un jour sur deux est numéroté : les 14 numéros ne se chevauchent plus.
                    SizedBox(height: 16, child: FittedBox(child: Text(last14.indexOf(d).isEven ? '${d.day}' : '', style: theme.textTheme.labelSmall))),
                  ]),
                ),
              ),
          ]),
        ),
        section(t('by_theme', l), by('th'), (k) => themeName(k, l)),
        section(t('by_notion', l), by('n'), (k) => notionTitles[k] ?? k),
        section(t('by_type', l), by('type'), (k) => questionTypeName(k, l)),
        section(t('by_difficulty', l), by('d'), (k) => '★' * (int.tryParse(k) ?? 1)),
      ],
    ]);
  }
}
