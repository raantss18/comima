import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/i18n.dart';
import 'notion.dart';
import 'theme.dart';

/// Les notions dans l'ordre du parcours : niveau croissant, puis ordre des chapitres du cours.
List<Notion> orderedNotions(ContentStore content) {
  final all = [for (final p in content.packs) ...p.notions];
  all.sort((a, b) {
    final byLevel = a.niveau.compareTo(b.niveau);
    if (byLevel != 0) return byLevel;
    final byChapter = ((a.raw['chapitre'] ?? 'zz') as String).compareTo((b.raw['chapitre'] ?? 'zz') as String);
    return byChapter != 0 ? byChapter : a.id.compareTo(b.id);
  });
  return all;
}

const _levelNames = {
  'fr': ['Découvrir', 'Pratiquer', 'Approfondir', 'Maîtriser', 'Défier', 'Chercher', 'Démontrer', 'Concourir', 'Exceller', 'Olympiade'],
  'en': ['Discover', 'Practise', 'Deepen', 'Master', 'Challenge', 'Explore', 'Prove', 'Compete', 'Excel', 'Olympiad'],
};

String levelName(int niveau, String lang) {
  final names = _levelNames[lang == 'en' ? 'en' : 'fr']!;
  return niveau >= 1 && niveau <= names.length ? names[niveau - 1] : '';
}

/// Notion à proposer pour continuer : celle déjà commencée et pas encore maîtrisée (la plus
/// avancée dans le parcours), sinon la première pas encore commencée.
Notion? nextNotion(List<Notion> notions, AppState s) {
  Notion? started;
  Notion? fresh;
  for (final n in notions) {
    final m = s.progress.notionMastery(n);
    if (m >= 0.8) continue;
    if (m > 0) {
      started ??= n;
    } else {
      fresh ??= n;
    }
  }
  return started ?? fresh;
}

String greeting(DateTime now, String l) {
  final h = now.hour;
  if (l == 'en') return h < 12 ? 'Good morning' : (h < 18 ? 'Good afternoon' : 'Good evening');
  return h < 18 ? 'Bonjour' : 'Bonsoir';
}

class TrainingTab extends StatelessWidget {
  const TrainingTab({super.key});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final notions = orderedNotions(s.content);
    final next = nextNotion(notions, s);
    final levels = <int>{for (final n in notions) n.niveau}.toList()..sort();
    return RefreshIndicator(
      onRefresh: s.updateContent,
      child: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 24), children: [
        _Header(s: s, l: l),
        if (next != null) ...[
          const SizedBox(height: 12),
          _ContinueCard(notion: next, s: s, l: l),
        ],
        for (final lv in levels) ...[
          _LevelHeader(level: lv, notions: notions.where((n) => n.niveau == lv).toList(), s: s, l: l),
          for (final n in notions.where((n) => n.niveau == lv)) NotionTile(notion: n),
        ],
        if (notions.isEmpty) Padding(padding: const EdgeInsets.all(32), child: Text(t('no_content', l), textAlign: TextAlign.center)),
      ]),
    );
  }
}

/// Salutation, niveau et progression vers le niveau suivant, série de jours.
class _Header extends StatelessWidget {
  const _Header({required this.s, required this.l});

  final AppState s;
  final String l;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final p = s.progress;
    final span = p.xpLevelEnd - p.xpLevelStart;
    final frac = span <= 0 ? 0.0 : ((p.xp - p.xpLevelStart) / span).clamp(0.0, 1.0);
    final streak = p.streak;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('${greeting(DateTime.now(), l)}${(p.current?['name'] ?? '').toString().isEmpty ? '' : ', ${p.current!['name']}'} 👋',
          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
      const SizedBox(height: 12),
      Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: theme.colorScheme.primary,
              child: Text('${p.level}', style: TextStyle(color: theme.colorScheme.onPrimary, fontWeight: FontWeight.w800, fontSize: 20)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text('${t('level', l)} ${p.level}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Text('${p.xp} ${t('xp', l)}', style: theme.textTheme.bodyMedium),
                ]),
                const SizedBox(height: 8),
                LinearProgressIndicator(value: frac, minHeight: 8, borderRadius: BorderRadius.circular(4)),
                const SizedBox(height: 4),
                Text('${p.xpLevelEnd - p.xp} ${t('xp_to_next', l)}', style: theme.textTheme.bodySmall),
              ]),
            ),
            if (streak > 0) ...[
              const SizedBox(width: 12),
              Column(children: [
                const Text('🔥', style: TextStyle(fontSize: 22)),
                Text('$streak ${t('days', l)}', style: theme.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700)),
              ]),
            ],
          ]),
        ),
      ),
    ]);
  }
}

class _ContinueCard extends StatelessWidget {
  const _ContinueCard({required this.notion, required this.s, required this.l});

  final Notion notion;
  final AppState s;
  final String l;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final st = styleOf(notion.theme);
    final started = s.progress.notionMastery(notion) > 0;
    return Material(
      color: theme.colorScheme.primaryContainer,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NotionPage(notion: notion))),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Icon(st.icon, size: 34, color: theme.colorScheme.onPrimaryContainer),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(started ? t('continue', l) : t('start_here', l), style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.onPrimaryContainer)),
                Text(tr(notion.titre, l), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: theme.colorScheme.onPrimaryContainer)),
              ]),
            ),
            Icon(Icons.arrow_forward_rounded, color: theme.colorScheme.onPrimaryContainer),
          ]),
        ),
      ),
    );
  }
}

class _LevelHeader extends StatelessWidget {
  const _LevelHeader({required this.level, required this.notions, required this.s, required this.l});

  final int level;
  final List<Notion> notions;
  final AppState s;
  final String l;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final done = notions.where((n) => s.progress.notionMastery(n) >= 0.8).length;
    final name = levelName(level, l);
    return Padding(
      padding: const EdgeInsets.only(top: 22, bottom: 6),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(color: theme.colorScheme.primary, borderRadius: BorderRadius.circular(14)),
          child: Text('${t('level', l)} $level', style: TextStyle(color: theme.colorScheme.onPrimary, fontWeight: FontWeight.w800)),
        ),
        const SizedBox(width: 10),
        if (name.isNotEmpty) Text(name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
        const Spacer(),
        Text('$done/${notions.length}', style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.primary)),
        const SizedBox(width: 2),
        Icon(done == notions.length && done > 0 ? Icons.verified : Icons.flag_outlined, size: 18, color: theme.colorScheme.primary),
      ]),
    );
  }
}

class NotionTile extends StatelessWidget {
  const NotionTile({super.key, required this.notion});

  final Notion notion;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final m = s.progress.notionMastery(notion);
    final st = styleOf(notion.theme);
    final c = readable(context, st.color);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NotionPage(notion: notion))),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(color: c.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(16)),
              child: Icon(st.icon, color: c),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr(notion.titre, l), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, height: 1.2)),
                const SizedBox(height: 2),
                Text('${themeName(notion.theme, l)} · ${notion.questions.length} ${t('questions', l)}', style: theme.textTheme.bodySmall),
                const SizedBox(height: 8),
                LinearProgressIndicator(value: m, minHeight: 6, color: c, backgroundColor: c.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(3)),
              ]),
            ),
            const SizedBox(width: 8),
            m >= 0.8 ? Icon(Icons.verified, color: theme.colorScheme.primary) : const Icon(Icons.chevron_right),
          ]),
        ),
      ),
    );
  }
}
