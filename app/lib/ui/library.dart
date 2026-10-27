import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/i18n.dart';
import '../core/progress.dart';
import 'design.dart';
import 'figure_view.dart';
import 'math_text.dart';
import 'marks.dart';
import 'notion.dart';

/// Tout le contenu du site, consultable hors ligne : exercices (avec solutions), cours,
/// sujets, actualités et simulations (ouvertes sur le site).
class LibraryTab extends StatelessWidget {
  const LibraryTab({super.key, this.initialTab = 0});

  /// Onglet affiché au départ (3 = Actualités, depuis le raccourci de l'accueil).
  final int initialTab;

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    return DefaultTabController(
      length: 5,
      initialIndex: initialTab,
      child: Column(children: [
        TabBar(isScrollable: true, tabAlignment: TabAlignment.start, tabs: [
          Tab(text: t('exercises', l)),
          Tab(text: t('courses', l)),
          Tab(text: t('papers', l)),
          Tab(text: t('news', l)),
          Tab(text: t('simulations', l)),
        ]),
        const Expanded(
          child: TabBarView(children: [_Exercises(), _Courses(), _Papers(), _News(), _Simulations()]),
        ),
      ]),
    );
  }
}

Future<void> openSite(String pathOrUrl) async {
  final url = pathOrUrl.startsWith('http') ? pathOrUrl : '$siteUrl/${pathOrUrl.replaceFirst(RegExp('^/'), '')}';
  await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
}

class _Exercises extends StatefulWidget {
  const _Exercises();

  @override
  State<_Exercises> createState() => _ExercisesState();
}

class _ExercisesState extends State<_Exercises> {
  String _q = '';
  String? _theme;
  int? _prog;
  bool _withSolution = false;
  // Filtre marque-pages : 'todo' (non fait), 'continuer', 'fait', 'star'.
  String? _mark;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final q = _q.toLowerCase();
    final items = s.content.library.where((e) {
      if (_theme != null && !(e['theme'] as List).contains(_theme)) return false;
      if (_withSolution && e['solutionTex'] == null) return false;
      if (_prog != null && e['progression'] != _prog) return false;
      if (_mark != null) {
        final key = ProgressStore.markKey('exo', e['id']);
        final st = s.progress.markStatus(key);
        final ok = switch (_mark) {
          'todo' => st != 'fait',
          'star' => s.progress.markStarred(key),
          _ => st == _mark,
        };
        if (!ok) return false;
      }
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: FilterChip(
              avatar: const Icon(Icons.lightbulb_outline, size: 18),
              label: Text(t('with_solution', l)),
              selected: _withSolution,
              onSelected: (v) => setState(() => _withSolution = v),
            ),
          ),
          for (final (k, label, icon) in [
            ('star', t('mark_star', l), Icons.star_border),
            ('todo', t('mark_filter_todo', l), Icons.radio_button_unchecked),
            ('continuer', t('mark_filter_continue', l), Icons.schedule),
            ('fait', t('mark_fait', l), Icons.check_circle_outline),
          ])
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: FilterChip(
                avatar: Icon(icon, size: 18),
                label: Text(label),
                selected: _mark == k,
                onSelected: (v) => setState(() => _mark = v ? k : null),
              ),
            ),
          for (var p = 1; p <= 7; p++)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: FilterChip(
                avatar: CircleAvatar(radius: 10, child: Text('$p', style: const TextStyle(fontSize: 11))),
                label: Text(t('prog_$p', l)),
                selected: _prog == p,
                onSelected: (v) => setState(() => _prog = v ? p : null),
              ),
            ),
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
            // Bibliothèque déjà triée par palier (lycée 1 → 3, universitaire, recherche) :
            // un titre à chaque changement de palier. Anciens contenus sans palier : pas de titre.
            final p = e['palier'] as int?;
            final head = p != null && (i == 0 || items[i - 1]['palier'] != p);
            final tile = ListTile(
              leading: MarkBadge(item: ProgressStore.markKey('exo', e['id'])),
              title: Text(tr(e['titre'], l)),
              subtitle: Text('${(e['theme'] as List).map((x) => themeName(x as String, l)).join(', ')} · ${'★' * ((e['difficulte'] as int?) ?? 1)}'),
              trailing: e['solutionTex'] != null ? const Icon(Icons.lightbulb_outline, size: 20) : null,
              onTap: () => Navigator.push(c, MaterialPageRoute(builder: (_) => ExercisePage(ex: e))),
            );
            if (!head) return tile;
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: Text(t('palier_$p', l), style: Theme.of(c).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
              ),
              tile,
            ]);
          },
        ),
      ),
    ]);
  }
}

class ExercisePage extends StatefulWidget {
  const ExercisePage({super.key, required this.ex});

  final Map<String, dynamic> ex;

  @override
  State<ExercisePage> createState() => _ExercisePageState();
}

class _ExercisePageState extends State<ExercisePage> {
  bool _show = false;

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    final ex = widget.ex;
    final theme = Theme.of(context);
    return TouchHistory(
      kind: 'exo',
      id: ex['id'].toString(),
      child: Scaffold(
      appBar: AppBar(title: Text(tr(ex['titre'], l)), actions: [MarkAction(item: ProgressStore.markKey('exo', ex['id'])), const LogoMenuButton()]),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        if (ex['source'] != null) Text('${t('source', l)} : ${ex['source']}', style: theme.textTheme.bodySmall),
        const SizedBox(height: 12),
        MathText(tr(ex['enonce'], l), style: theme.textTheme.bodyLarge),
        const Divider(height: 32),
        if (ex['solutionTex'] != null)
          _show
              ? Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t('solution', l), style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
                  const SizedBox(height: 8),
                  MathText(tr(ex['solutionTex'], l), style: theme.textTheme.bodyLarge),
                ])
              : OutlinedButton.icon(
                  icon: const Icon(Icons.lightbulb_outline),
                  label: Text(t('show_solution', l)),
                  onPressed: () => setState(() => _show = true),
                )
        else
          Text(t('no_solution_yet', l), style: theme.textTheme.bodySmall),
        if (ex['solution'] != null)
          TextButton.icon(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: Text(t('solution_online', l)),
            onPressed: () => openSite(ex['solution'] as String),
          ),
      ]),
    ),
    );
  }
}

class _Courses extends StatelessWidget {
  const _Courses();

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final cours = s.content.list('cours');
    return ListView.builder(
      itemCount: cours.length,
      itemBuilder: (c, i) {
        final ch = cours[i];
        return ListTile(
          leading: CircleAvatar(child: Text('${ch['numero']}')),
          title: Text(tr(ch['titre'], l)),
          trailing: MarkBadge(item: ProgressStore.markKey('cours', ch['id'])),
          subtitle: Text(tr(ch['description'], l), maxLines: 2, overflow: TextOverflow.ellipsis),
          onTap: () => Navigator.push(c, MaterialPageRoute(builder: (_) => CoursePage(chapter: ch))),
        );
      },
    );
  }
}

/// Chapitre du cours : résumé, notions d'entraînement liées, simulations, PDF en ligne.
class CoursePage extends StatelessWidget {
  const CoursePage({super.key, required this.chapter});

  final Map<String, dynamic> chapter;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final id = chapter['id'];
    final notions = [for (final p in s.content.packs) ...p.notions.where((n) => n.raw['chapitre'] == id)];
    final sims = s.content.list('simulations').where((x) => x['chapitre'] == id).toList();
    return TouchHistory(
      kind: 'cours',
      id: id.toString(),
      child: Scaffold(
      appBar: AppBar(title: Text(tr(chapter['titre'], l)), actions: [MarkAction(item: ProgressStore.markKey('cours', id)), const LogoMenuButton()]),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text(tr(chapter['description'], l), style: theme.textTheme.bodyLarge),
        FigureView(name: 'cours-$id'),
        if (notions.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(t('train', l), style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
          for (final n in notions)
            ListTile(
              leading: const Icon(Icons.school),
              title: Text(tr(n.titre, l)),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NotionPage(notion: n))),
            ),
        ],
        if (sims.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(t('simulations', l), style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
          for (final x in sims) _SimTile(sim: x),
        ],
        const SizedBox(height: 16),
        if (chapter['pdf'] != null)
          OutlinedButton.icon(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: Text(t('course_pdf', l)),
            onPressed: () => openSite(chapter['pdf'] as String),
          ),
      ]),
    ),
    );
  }
}

class _Papers extends StatelessWidget {
  const _Papers();

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final papers = s.content.list('sujets');
    return ListView.builder(
      itemCount: papers.length,
      itemBuilder: (c, i) {
        final p = papers[i];
        return ListTile(
          leading: const Icon(Icons.description_outlined),
          trailing: MarkBadge(item: ProgressStore.markKey('sujet', p['id'])),
          title: Text(tr(p['titre'], l)),
          subtitle: Text((p['source'] ?? '').toString()),
          onTap: () => Navigator.push(c, MaterialPageRoute(builder: (_) => PaperPage(paper: p))),
        );
      },
    );
  }
}

class PaperPage extends StatelessWidget {
  const PaperPage({super.key, required this.paper});

  final Map<String, dynamic> paper;

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    final theme = Theme.of(context);
    return TouchHistory(
      kind: 'sujet',
      id: paper['id'].toString(),
      child: Scaffold(
      appBar: AppBar(title: Text(tr(paper['titre'], l)), actions: [MarkAction(item: ProgressStore.markKey('sujet', paper['id'])), const LogoMenuButton()]),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text(tr(paper['description'], l), style: theme.textTheme.bodySmall),
        const SizedBox(height: 12),
        MathText((paper['epreuve'] ?? '').toString(), style: theme.textTheme.bodyLarge),
        const SizedBox(height: 16),
        if (paper['pdfSolution'] != null)
          TextButton.icon(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: Text(t('solution_online', l)),
            onPressed: () => openSite(paper['pdfSolution'] as String),
          ),
      ]),
    ),
    );
  }
}

class _News extends StatelessWidget {
  const _News();

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final news = s.content.list('actualites').where((n) => n['lang'] == l).toList();
    return ListView.builder(
      itemCount: news.length,
      itemBuilder: (c, i) {
        final n = news[i];
        return ListTile(
          title: Text(n['titre'].toString()),
          subtitle: Text('${n['date']} · ${n['resume']}', maxLines: 2, overflow: TextOverflow.ellipsis),
          onTap: () => Navigator.push(c, MaterialPageRoute(builder: (_) => NewsPage(item: n))),
        );
      },
    );
  }
}

class NewsPage extends StatelessWidget {
  const NewsPage({super.key, required this.item});

  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return TouchHistory(
      kind: 'actu',
      id: item['slug'].toString(),
      child: Scaffold(
        appBar: AppBar(title: Text(item['date'].toString()), actions: const [LogoMenuButton()]),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          Text(item['titre'].toString(), style: theme.textTheme.headlineSmall),
          const SizedBox(height: 12),
          MathText(item['corps'].toString(), style: theme.textTheme.bodyLarge),
        ]),
      ),
    );
  }
}

class _Simulations extends StatelessWidget {
  const _Simulations();

  @override
  Widget build(BuildContext context) {
    final sims = AppScope.of(context).content.list('simulations');
    return ListView(children: [for (final x in sims) _SimTile(sim: x)]);
  }
}

class _SimTile extends StatelessWidget {
  const _SimTile({required this.sim});

  final Map<String, dynamic> sim;

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    return ListTile(
      leading: const Icon(Icons.science_outlined),
      title: Text(tr(sim['titre'], l)),
      subtitle: Text(tr(sim['resume'], l), maxLines: 2, overflow: TextOverflow.ellipsis),
      trailing: const Icon(Icons.open_in_new, size: 18),
      onTap: () => openSite('${l == 'en' ? 'en' : 'fr'}/simulations/${sim['slug']}/'),
    );
  }
}
