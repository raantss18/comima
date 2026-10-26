import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/updater.dart';

/// Fiche de mise à jour (sur le modèle de Tontolo) : titre, version actuelle, nouveautés en
/// puces lisibles, puis « Plus tard · Détails · Installer ». Proposée toute seule quand une
/// nouvelle version existe ; montre les nouveautés de toutes les versions sautées. Si Android
/// demande d'autoriser l'installation, elle reprend automatiquement au retour.
Future<void> showUpdateSheet(BuildContext context, AppRelease r) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    isDismissible: !r.mandatory,
    enableDrag: !r.mandatory,
    showDragHandle: true,
    builder: (_) => _UpdateSheet(release: r),
  );
}

/// Notes d'une version (Markdown « - … ») → une liste de puces.
List<String> _bullets(String text) => [
      for (final line in text.split('\n'))
        if (line.trim().isNotEmpty) line.trim().replaceFirst(RegExp(r'^[-*•]\s*'), ''),
    ];

class _UpdateSheet extends StatefulWidget {
  const _UpdateSheet({required this.release});

  final AppRelease release;

  @override
  State<_UpdateSheet> createState() => _UpdateSheetState();
}

class _UpdateSheetState extends State<_UpdateSheet> {
  double? _progress;
  bool _waitingPermission = false;

  Future<void> _install() async {
    final s = AppScope.of(context);
    setState(() => _progress = 0);
    final ok = await s.updater.install(widget.release, (v) {
      if (mounted) setState(() => _progress = v);
    });
    if (!mounted) return;
    if (!ok) {
      setState(() => _progress = null);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('update_failed', s.lang))));
      return;
    }
    // Soit l'installateur Android s'ouvre, soit l'autorisation est demandée : dans les deux cas,
    // la suite se fait toute seule au retour dans l'application.
    setState(() {
      _progress = null;
      _waitingPermission = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final r = widget.release;
    final size = r.bytes > 0 ? ' · ${(r.bytes / 1048576).toStringAsFixed(1).replaceAll('.', l == 'en' ? '.' : ',')} ${l == 'en' ? 'MB' : 'Mo'}' : '';
    // Plus récente d'abord ; le numéro de version n'est rappelé que si plusieurs versions sont sautées.
    final groups = r.notes.reversed.toList();
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.92,
      builder: (context, controller) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.system_update, size: 28),
              const SizedBox(width: 12),
              Expanded(child: Text('${t('update_title', l)} ${r.version}', style: theme.textTheme.titleLarge)),
            ]),
            const SizedBox(height: 4),
            Text('${t('update_from', l)} ${s.updater.version}$size', style: theme.textTheme.bodySmall),
            if (r.mandatory)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(t('update_required', l), style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error)),
              ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView(controller: controller, children: [
                for (final (v, n) in groups) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 4),
                    child: Text(
                      groups.length > 1 ? '${t('update_whats_new', l)} · $v' : t('update_whats_new', l),
                      style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.primary),
                    ),
                  ),
                  for (final b in _bullets(tr(n, l)))
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 3),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Padding(padding: EdgeInsets.only(top: 7, right: 10), child: Icon(Icons.circle, size: 6)),
                        Expanded(child: Text(b, style: theme.textTheme.bodyMedium)),
                      ]),
                    ),
                ],
              ]),
            ),
            if (_progress != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${t('downloading', l)} ${(_progress! * 100).round()} %'),
                  const SizedBox(height: 6),
                  LinearProgressIndicator(value: _progress == 0 ? null : _progress, minHeight: 6, borderRadius: BorderRadius.circular(3)),
                ]),
              )
            else if (_waitingPermission) ...[
              Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text(t('update_permission', l))),
              Align(alignment: Alignment.centerRight, child: OutlinedButton(onPressed: () => Navigator.pop(context), child: Text(t('close', l)))),
            ] else ...[
              const SizedBox(height: 8),
              Row(children: [
                if (!r.mandatory)
                  TextButton(
                    onPressed: () async {
                      await s.snoozeUpdate();
                      if (context.mounted) Navigator.pop(context);
                    },
                    child: Text(t('later', l)),
                  ),
                if (r.tag != null)
                  TextButton(
                    onPressed: () => launchUrl(Uri.parse('https://github.com/raantss18/comima/releases/tag/${r.tag}'), mode: LaunchMode.externalApplication),
                    child: Text(t('details', l)),
                  ),
                const Spacer(),
                FilledButton.icon(onPressed: _install, icon: const Icon(Icons.download_done), label: Text(t('install', l))),
              ]),
            ],
          ]),
        ),
      ),
    );
  }
}
