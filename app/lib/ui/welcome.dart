import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import 'design.dart';
import 'notion.dart';
import 'practice.dart';
import 'theme.dart';

/// Accueil : un mot de bienvenue, les grandes parties de l'application en tuiles, puis « Reprendre » (les dernières
/// pages consultées). Pas de barre de raccourcis : le logo, en haut des autres écrans, ouvre la liste des parties. Ici, sur l'accueil,
/// le logo ouvre « Profil et réglages » (qui n'a donc pas de tuile) ; dans les autres écrans, « Profil et réglages » est dans la liste du logo.
class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final p = s.progress;
    final name = (p.current?['name'] ?? '').toString().trim();
    final tiles = [AppSection.train, AppSection.defi, AppSection.library, AppSection.news, AppSection.python];
    // Une colonne si la police du téléphone est très grande : jamais de texte coupé ou superposé.
    final oneColumn = MediaQuery.textScalerOf(context).scale(16) > 22;
    final recent = resolveHistory(s, max: 4);
    final next = recent.isEmpty ? nextNotion(orderedNotions(s.content), s) : null;
    return Scaffold(
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.fromLTRB(20, 14, 20, 28), children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Le logo COMIMa ouvre « Profil et réglages » (compte, langue, rappels).
            Tooltip(
              message: t('profile_settings', l),
              child: Semantics(
                button: true,
                label: t('profile_settings', l),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => goTo(context, AppSection.profile),
                  child: Padding(padding: const EdgeInsets.all(4), child: Image.asset('assets/logo.png', height: 40)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Les pastilles passent à la ligne si la place manque (très grandes polices) : jamais de débordement.
            Expanded(
              child: Wrap(
                alignment: WrapAlignment.end,
                spacing: 8,
                runSpacing: 8,
                children: [
                  _StatChip(emoji: '🔥', text: '${p.streak} ${t('days', l)}', show: p.streak > 0, onTap: () => openStats(context)),
                  _StatChip(emoji: '⭐', text: '${t('level', l)} ${p.level}', show: true, onTap: () => openStats(context)),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 22),
          Text(
            name.isEmpty ? '${greeting(DateTime.now(), l)} 👋' : '${greeting(DateTime.now(), l)}, $name 👋',
            style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800, height: 1.15),
          ),
          const SizedBox(height: 6),
          Text(t('welcome_line', l), style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 22),
          if (oneColumn)
            for (final sec in tiles) Padding(padding: const EdgeInsets.only(bottom: 10), child: _Tile(section: sec, l: l))
          else
            for (var i = 0; i < tiles.length; i += 2)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: IntrinsicHeight(
                  child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    Expanded(child: _Tile(section: tiles[i], l: l)),
                    if (i + 1 < tiles.length) ...[
                      const SizedBox(width: 10),
                      Expanded(child: _Tile(section: tiles[i + 1], l: l)),
                    ],
                  ]),
                ),
              ),
          const SizedBox(height: 14),
          Text(t('resume', l), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          if (recent.isEmpty && next == null)
            Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text(t('resume_empty', l), style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)))
          else if (recent.isEmpty && next != null)
            _ResumeCard(
              icon: Icons.play_circle_outline,
              kind: t('topic', l),
              title: tr(next.titre, l),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NotionPage(notion: next))),
            )
          else
            for (final e in recent) _ResumeCard(icon: historyIcon(e.kind), kind: historyKindLabel(e.kind, l), title: e.title, onTap: () => e.open(context)),
        ]),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.emoji, required this.text, required this.show, required this.onTap});

  final String emoji;
  final String text;
  final bool show;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    if (!show) return const SizedBox.shrink();
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.surfaceContainerHigh.withValues(alpha: 0.7),
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
            Flexible(child: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700))),
          ]),
        ),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.section, required this.l});

  final AppSection section;
  final String l;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = readable(context, section.color);
    return Material(
      color: section.color.withValues(alpha: theme.brightness == Brightness.light ? 0.10 : 0.16),
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => goTo(context, section),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: section.color.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(14)),
              child: Icon(section.icon, color: c, size: 26),
            ),
            const SizedBox(height: 12),
            Text(section.label(l), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800, height: 1.15)),
            const SizedBox(height: 3),
            Text(section.hint(l), maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          ]),
        ),
      ),
    );
  }
}

class _ResumeCard extends StatelessWidget {
  const _ResumeCard({required this.icon, required this.kind, required this.title, required this.onTap});

  final IconData icon;
  final String kind;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(children: [
            Icon(icon, color: theme.colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(kind, style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
              ]),
            ),
            const Icon(Icons.chevron_right),
          ]),
        ),
      ),
    );
  }
}
