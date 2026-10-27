import 'dart:math';

import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/generated.dart';
import '../core/i18n.dart';
import '../core/progress.dart';
import 'notion.dart';
import 'quiz.dart';
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

/// D'où viennent les questions au hasard : de tous les cours, ou seulement de ce que l'élève a lu ou vu
/// (cours lus et exercices vus, qu'on ouvre : le suivi est automatique).
enum PracticeScope { all, read }

/// Notions concernées : toutes, ou celles des chapitres travaillés (cours lus, exercices vus).
List<Notion> notionsForScope(AppState s, PracticeScope scope) {
  final all = orderedNotions(s.content);
  if (scope == PracticeScope.all) return all;
  final read = s.studiedChapters;
  return [for (final n in all) if (read.contains(n.raw['chapitre'])) n];
}

/// Niveau (1 à 5) des questions générées pour ce profil : il monte avec le niveau de l'élève.
int tierOf(AppState s) => ((s.progress.level + 1) ~/ 2).clamp(1, 5);

/// Questions corrigées automatiquement, dans un ordre aléatoire (la liste est toujours tirée au hasard).
/// Avec `count`, la série mélange des questions rédigées et des questions **générées** (nombres tirés au hasard, réponse
/// calculée) : deux séries ne se ressemblent pas, même au même niveau. Sans `count`, seulement les questions rédigées.
List<Map<String, dynamic>> randomQuestions(AppState s, PracticeScope scope, {Set<String>? kinds, Random? random, int? count, Generator? generator}) {
  final pool = <Map<String, dynamic>>[];
  final notions = notionsForScope(s, scope);
  for (final n in notions) {
    for (final q in n.questions) {
      if (ProgressStore.autoGraded(q) && (kinds == null || kinds.contains(q['type']))) pool.add({...q, 'notion': n.id, 'theme': n.theme});
    }
  }
  final rnd = random ?? Random();
  pool.shuffle(rnd);
  if (count == null) return pool;
  // Environ 60 % de questions générées, le reste rédigé ; si l'une des deux sources manque, l'autre complète.
  final gen = (generator ?? Generator.instance).mixed(scope == PracticeScope.all ? null : {for (final n in notions) n.id}, (count * 0.6).ceil(), tier: tierOf(s));
  final generated = kinds == null ? gen : [for (final q in gen) if (kinds.contains(q['type'])) q];
  final out = <Map<String, dynamic>>[...generated, ...pool.take(count - generated.length)];
  if (out.length < count) out.addAll(pool.skip(count - generated.length).take(count - out.length));
  out.shuffle(rnd);
  return out.take(count).toList();
}

/// Titres des cours travaillés (pour annoncer d'où viennent les questions).
List<String> readCourseTitles(AppState s) {
  final read = s.studiedChapters;
  return [for (final c in s.content.list('cours')) if (read.contains(c['id'])) tr(c['titre'], s.lang)];
}

/// Choix « tous les cours / mes cours lus » : annonce clairement d'où viennent les questions au hasard.
class ScopePicker extends StatelessWidget {
  const ScopePicker({super.key, required this.s, required this.scope, required this.onChanged});

  final AppState s;
  final PracticeScope scope;
  final ValueChanged<PracticeScope> onChanged;

  @override
  Widget build(BuildContext context) {
    final l = s.lang;
    final theme = Theme.of(context);
    final titles = readCourseTitles(s);
    final hasRead = titles.isNotEmpty;
    final effective = hasRead ? scope : PracticeScope.all;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SegmentedButton<PracticeScope>(
        showSelectedIcon: false,
        segments: [
          ButtonSegment(value: PracticeScope.all, icon: const Icon(Icons.apps, size: 18), label: Text(t('scope_all', l))),
          ButtonSegment(value: PracticeScope.read, icon: const Icon(Icons.menu_book_outlined, size: 18), label: Text('${t('scope_read', l)} (${titles.length})'), enabled: hasRead),
        ],
        selected: {effective},
        onSelectionChanged: (v) => onChanged(v.first),
      ),
      const SizedBox(height: 6),
      Text(
        !hasRead
            ? t('scope_none_read', l)
            : effective == PracticeScope.read
                ? '${t('scope_announce_read', l)} ${titles.join(', ')}'
                : t('scope_announce_all', l),
        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
      ),
    ]);
  }
}

/// Carte « Questions au hasard » de l'Entraînement : le choix des cours, puis une série de 10 questions tirées au hasard.
class _RandomSeriesCard extends StatefulWidget {
  const _RandomSeriesCard({required this.s});

  final AppState s;

  @override
  State<_RandomSeriesCard> createState() => _RandomSeriesCardState();
}

class _RandomSeriesCardState extends State<_RandomSeriesCard> {
  PracticeScope _scope = PracticeScope.all;

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final l = s.lang;
    final theme = Theme.of(context);
    final scope = readCourseTitles(s).isEmpty ? PracticeScope.all : _scope;
    final available = randomQuestions(s, scope).length + Generator.instance.kindsFor(scope == PracticeScope.all ? null : {for (final n in notionsForScope(s, scope)) n.id}).length;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.shuffle, color: theme.colorScheme.primary),
            const SizedBox(width: 10),
            Expanded(child: Text(t('random_series', l), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800))),
          ]),
          const SizedBox(height: 10),
          ScopePicker(s: s, scope: _scope, onChanged: (v) => setState(() => _scope = v)),
          const SizedBox(height: 10),
          FilledButton.icon(
            onPressed: available == 0
                ? null
                : () {
                    final qs = randomQuestions(s, scope, count: 10);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => QuizPage(title: t('random_series', l), questions: qs)));
                  },
            icon: const Icon(Icons.play_arrow_rounded),
            label: Text(t('random_start', l)),
          ),
        ]),
      ),
    );
  }
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
        const SizedBox(height: 12),
        _RandomSeriesCard(s: s),
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
                // « Niveau n » et les XP : côte à côte s'il y a la place, sinon l'un sous l'autre
                // (jamais l'un sur l'autre, même avec une très grande police).
                Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.end,
                  spacing: 10,
                  runSpacing: 0,
                  children: [
                    Text('${t('level', l)} ${p.level}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    Text('${p.xp} ${t('xp', l)}', style: theme.textTheme.bodyMedium),
                  ],
                ),
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
        if (name.isNotEmpty)
          Flexible(child: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600))),
        const Spacer(),
        const SizedBox(width: 8),
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
                Text(
                  '${themeName(notion.theme, l)} · ${notion.questions.where(ProgressStore.autoGraded).length} ${t('questions', l)}${s.studiedChapters.contains(notion.raw['chapitre']) ? ' · 📘 ${t('course_read', l)}' : ''}',
                  style: theme.textTheme.bodySmall,
                ),
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
