import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import 'defi_page.dart';
import 'library.dart';
import 'notion.dart';
import 'practice.dart';
import 'profile_tab.dart';
import 'python_page.dart';
import 'stats.dart';
import 'theme.dart';

/// Les grandes parties de l'application : l'accueil les propose en tuiles, et le logo COMIMa (en haut de
/// chaque écran) les propose en liste déroulante, avec les dernières pages consultées.
enum AppSection { home, train, defi, library, news, python, profile }

extension AppSectionInfo on AppSection {
  IconData get icon => switch (this) {
        AppSection.home => Icons.home_outlined,
        AppSection.train => Icons.school_outlined,
        AppSection.defi => Icons.timer_outlined,
        AppSection.library => Icons.menu_book_outlined,
        AppSection.news => Icons.newspaper_outlined,
        AppSection.python => Icons.terminal,
        AppSection.profile => Icons.person_outline,
      };

  Color get color => switch (this) {
        AppSection.home => comimaGreen,
        AppSection.train => comimaGreen,
        AppSection.defi => const Color(0xFFE08A00),
        AppSection.library => const Color(0xFF3A6EA5),
        AppSection.news => comimaRed,
        AppSection.python => const Color(0xFF6A4FB6),
        AppSection.profile => const Color(0xFF546E7A),
      };

  String label(String l) => switch (this) {
        AppSection.home => t('home', l),
        AppSection.train => t('train', l),
        AppSection.defi => t('defi', l),
        AppSection.library => t('library', l),
        AppSection.news => t('news', l),
        AppSection.python => t('python', l),
        AppSection.profile => t('profile_settings', l),
      };

  /// Courte phrase sous le nom, sur les tuiles de l'accueil.
  String hint(String l) => switch (this) {
        AppSection.home => '',
        AppSection.train => t('train_hint', l),
        AppSection.defi => t('defi_hint', l),
        AppSection.library => t('library_hint', l),
        AppSection.news => t('news_hint', l),
        AppSection.python => t('python_hint', l),
        AppSection.profile => t('profile_hint', l),
      };
}

/// Écran d'une section : barre d'en-tête avec le menu du logo, puis le contenu.
class SectionPage extends StatelessWidget {
  const SectionPage({super.key, required this.section, required this.child});

  final AppSection section;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    return Scaffold(
      appBar: AppBar(title: Text(section.label(l)), actions: const [LogoMenuButton()]),
      body: SafeArea(top: false, child: child),
    );
  }
}

Widget _sectionBody(AppSection s) => switch (s) {
      AppSection.train => const TrainingTab(),
      AppSection.library => const LibraryTab(),
      AppSection.news => const NewsList(),
      AppSection.profile => const ProfileTab(),
      _ => const SizedBox.shrink(),
    };

/// Va à une section : on revient à l'accueil puis on ouvre la section (jamais d'empilement de sections).
void goTo(BuildContext context, AppSection section) {
  final nav = Navigator.of(context);
  nav.popUntil((r) => r.isFirst);
  switch (section) {
    case AppSection.home:
      return;
    case AppSection.defi:
      nav.push(MaterialPageRoute(builder: (_) => const DefiPage()));
    case AppSection.python:
      nav.push(MaterialPageRoute(builder: (_) => const PythonPage()));
    default:
      nav.push(MaterialPageRoute(builder: (_) => SectionPage(section: section, child: _sectionBody(section))));
  }
}

/// Statistiques : ouvertes depuis l'accueil et depuis « Profil et réglages ».
void openStats(BuildContext context) {
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SectionPage(section: AppSection.profile, child: StatsTab())));
}

// ---------------------------------------------------------------- historique « Reprendre »

IconData historyIcon(String kind) => switch (kind) {
      'cours' => Icons.menu_book_outlined,
      'sujet' => Icons.description_outlined,
      'notion' => Icons.school_outlined,
      'actu' => Icons.newspaper_outlined,
      _ => Icons.edit_note_outlined,
    };

String historyKindLabel(String kind, String l) => switch (kind) {
      'cours' => t('course', l),
      'sujet' => t('paper', l),
      'notion' => t('topic', l),
      'actu' => t('news_item', l),
      _ => t('exercise', l),
    };

/// Page mémorisée retrouvée dans les contenus actuels (une page retirée du contenu disparaît de la liste).
class HistoryEntry {
  HistoryEntry(this.kind, this.id, this.title, this.open);
  final String kind;
  final String id;
  final String title;
  final void Function(BuildContext) open;
}

List<HistoryEntry> resolveHistory(AppState s, {int max = 6}) {
  final l = s.lang;
  final out = <HistoryEntry>[];
  Map<String, dynamic>? find(String key, String id, {String field = 'id'}) {
    for (final e in s.content.list(key)) {
      if (e[field] == id) return e;
    }
    return null;
  }

  for (final h in s.history) {
    if (out.length >= max) break;
    final kind = h['k'] as String;
    final id = h['id'] as String;
    switch (kind) {
      case 'exo':
        final e = find('exercices', id);
        if (e != null) out.add(HistoryEntry(kind, id, tr(e['titre'], l), (c) => Navigator.push(c, MaterialPageRoute(builder: (_) => ExercisePage(ex: e)))));
      case 'cours':
        final e = find('cours', id);
        if (e != null) out.add(HistoryEntry(kind, id, tr(e['titre'], l), (c) => Navigator.push(c, MaterialPageRoute(builder: (_) => CoursePage(chapter: e)))));
      case 'sujet':
        final e = find('sujets', id);
        if (e != null) out.add(HistoryEntry(kind, id, tr(e['titre'], l), (c) => Navigator.push(c, MaterialPageRoute(builder: (_) => PaperPage(paper: e)))));
      case 'actu':
        for (final e in s.content.list('actualites')) {
          if (e['slug'] == id && e['lang'] == l) {
            out.add(HistoryEntry(kind, id, e['titre'].toString(), (c) => Navigator.push(c, MaterialPageRoute(builder: (_) => NewsPage(item: e)))));
            break;
          }
        }
      case 'notion':
        for (final n in orderedNotions(s.content)) {
          if (n.id == id) {
            out.add(HistoryEntry(kind, id, tr(n.titre, l), (c) => Navigator.push(c, MaterialPageRoute(builder: (_) => NotionPage(notion: n)))));
            break;
          }
        }
    }
  }
  return out;
}

/// Mémorise la page dans « Reprendre » à son ouverture, puis affiche [child] tel quel.
class TouchHistory extends StatefulWidget {
  const TouchHistory({super.key, required this.kind, required this.id, required this.child});

  final String kind;
  final String id;
  final Widget child;

  @override
  State<TouchHistory> createState() => _TouchHistoryState();
}

class _TouchHistoryState extends State<TouchHistory> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) AppScope.read(context).touch(widget.kind, widget.id);
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

// ---------------------------------------------------------------- menu du logo

/// Le logo COMIMa, en haut à droite de chaque écran : une liste déroulante avec toutes les sections et les
/// dernières pages consultées. Un appui sur une ligne y va directement.
class LogoMenuButton extends StatelessWidget {
  const LogoMenuButton({super.key});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    return PopupMenuButton<Object>(
      tooltip: t('menu', l),
      position: PopupMenuPosition.under,
      offset: const Offset(0, 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      constraints: const BoxConstraints(minWidth: 250, maxWidth: 330),
      onSelected: (v) {
        if (v is AppSection) {
          goTo(context, v);
        } else if (v is HistoryEntry) {
          v.open(context);
        }
      },
      itemBuilder: (_) {
        final recent = resolveHistory(s, max: 5);
        return <PopupMenuEntry<Object>>[
          for (final sec in AppSection.values)
            PopupMenuItem<Object>(
              value: sec,
              child: Row(children: [
                Icon(sec.icon, color: readable(context, sec.color), size: 22),
                const SizedBox(width: 12),
                Expanded(child: Text(sec.label(l), maxLines: 1, overflow: TextOverflow.ellipsis)),
              ]),
            ),
          if (recent.isNotEmpty) ...[
            const PopupMenuDivider(),
            PopupMenuItem<Object>(
              enabled: false,
              height: 30,
              child: Text(t('resume', l).toUpperCase(), style: theme.textTheme.labelSmall?.copyWith(letterSpacing: 1, fontWeight: FontWeight.w800)),
            ),
            for (final e in recent)
              PopupMenuItem<Object>(
                value: e,
                child: Row(children: [
                  Icon(historyIcon(e.kind), size: 20, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(width: 12),
                  Expanded(child: Text(e.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
                ]),
              ),
          ],
        ];
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Image.asset('assets/logo.png', height: 32),
      ),
    );
  }
}
