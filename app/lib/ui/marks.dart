import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/progress.dart';

/// Marque-pages des bibliothèques : où en est l'élève sur chaque exercice, sujet et cours.
/// Un état (lu, testé, à continuer, fait ; aucun = pas encore vu) et une étoile « à voir ».
/// Synchronisés avec le compte (voir `Sync`), consultables par l'encadreur.

IconData markIcon(String? status) => switch (status) {
      'lu' => Icons.visibility_outlined,
      'teste' => Icons.edit_outlined,
      'continuer' => Icons.schedule,
      'fait' => Icons.check_circle,
      _ => Icons.radio_button_unchecked,
    };

Color markColor(BuildContext context, String? status) {
  final c = Theme.of(context).colorScheme;
  return switch (status) {
    'fait' => c.primary,
    'continuer' => const Color(0xFFD97706),
    'teste' => c.secondary,
    'lu' => c.onSurfaceVariant,
    _ => c.outline,
  };
}

String markLabel(String? status, String lang) => t('mark_${status ?? 'none'}', lang);

/// Pastille d'état (liste) : l'icône de l'état, avec une petite étoile si l'élément est à voir.
class MarkBadge extends StatelessWidget {
  const MarkBadge({super.key, required this.item});

  final String item;

  @override
  Widget build(BuildContext context) {
    final p = AppScope.of(context).progress;
    final status = p.markStatus(item);
    final starred = p.markStarred(item);
    return Semantics(
      label: markLabel(status, AppScope.of(context).lang) + (starred ? ', ${t('mark_star', AppScope.of(context).lang)}' : ''),
      child: SizedBox(
        width: 32,
        height: 32,
        child: Stack(alignment: Alignment.center, children: [
          Icon(markIcon(status), color: markColor(context, status), size: 26),
          if (starred) const Positioned(right: -2, top: -2, child: Icon(Icons.star, size: 15, color: Color(0xFFF59E0B))),
        ]),
      ),
    );
  }
}

/// Bouton de la barre d'une page (exercice, cours, sujet) : ouvre le choix du marque-page.
class MarkAction extends StatelessWidget {
  const MarkAction({super.key, required this.item});

  final String item;

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    return IconButton(
      tooltip: t('bookmark', l),
      icon: MarkBadge(item: item),
      onPressed: () => showMarkSheet(context, item),
    );
  }
}

Future<void> showMarkSheet(BuildContext context, String item) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (_) => _MarkSheet(item: item),
  );
}

class _MarkSheet extends StatelessWidget {
  const _MarkSheet({required this.item});

  final String item;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final status = s.progress.markStatus(item);
    final starred = s.progress.markStarred(item);
    final options = <String?>[null, ...ProgressStore.markStatuses];
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 0, 8, 12),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
            child: Align(alignment: Alignment.centerLeft, child: Text(t('bookmark', l), style: Theme.of(context).textTheme.titleMedium)),
          ),
          for (final o in options)
            ListTile(
              leading: Icon(markIcon(o), color: markColor(context, o)),
              title: Text(markLabel(o, l)),
              trailing: o == status ? const Icon(Icons.check) : null,
              selected: o == status,
              onTap: () {
                s.setMark(item, status: o, starred: starred);
                Navigator.pop(context);
              },
            ),
          const Divider(height: 8),
          ListTile(
            leading: Icon(starred ? Icons.star : Icons.star_border, color: const Color(0xFFF59E0B)),
            title: Text(t('mark_star', l)),
            onTap: () {
              s.setMark(item, status: status, starred: !starred);
              Navigator.pop(context);
            },
          ),
        ]),
      ),
    );
  }
}
