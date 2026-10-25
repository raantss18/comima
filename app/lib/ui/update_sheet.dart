import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/updater.dart';

/// Fiche de mise à jour : proposée toute seule quand une nouvelle version existe. Montre les
/// nouveautés de toutes les versions sautées, télécharge, vérifie, puis installe ; si Android
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
    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.85),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              CircleAvatar(radius: 24, backgroundColor: theme.colorScheme.primaryContainer, child: Icon(Icons.system_update, color: theme.colorScheme.onPrimaryContainer)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${t('new_version', l)} ${r.version}', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  if (r.bytes > 0) Text('${(r.bytes / 1048576).toStringAsFixed(1)} ${l == 'en' ? 'MB' : 'Mo'}', style: theme.textTheme.bodySmall),
                ]),
              ),
            ]),
            const SizedBox(height: 14),
            Flexible(
              child: SingleChildScrollView(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // Nouveautés de chaque version sautée, de la plus récente à la plus ancienne.
                  for (final (v, n) in r.notes.reversed) ...[
                    Text(v, style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.primary)),
                    Text(tr(n, l)),
                    const SizedBox(height: 10),
                  ],
                ]),
              ),
            ),
            const SizedBox(height: 8),
            if (_progress != null) ...[
              LinearProgressIndicator(value: _progress, minHeight: 8, borderRadius: BorderRadius.circular(4)),
              const SizedBox(height: 6),
              Text(t('downloading', l), style: theme.textTheme.bodySmall),
            ] else if (_waitingPermission) ...[
              Text(t('update_permission', l), style: theme.textTheme.bodyMedium),
              const SizedBox(height: 8),
              OutlinedButton(onPressed: () => Navigator.pop(context), child: Text(t('close', l))),
            ] else
              Row(children: [
                if (!r.mandatory)
                  TextButton(
                    onPressed: () async {
                      await s.snoozeUpdate();
                      if (context.mounted) Navigator.pop(context);
                    },
                    child: Text(t('later', l)),
                  ),
                const Spacer(),
                FilledButton.icon(onPressed: _install, icon: const Icon(Icons.download), label: Text(t('update', l))),
              ]),
          ]),
        ),
      ),
    );
  }
}
