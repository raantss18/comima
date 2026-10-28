import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/coffre.dart';
import '../core/i18n.dart';
import 'math_text.dart';

/// Texte d'une solution ou d'une explication lu dans le coffre (réservé aux encadreurs validés).
/// Affiche le texte, ou la raison pour laquelle il n'est pas disponible. Ne s'utilise que pour un encadreur (voir `AppState.isCoach`).
class CoffreText extends StatefulWidget {
  const CoffreText({super.key, required this.item, this.style});

  /// Identifiant du coffre : `exo:` ou `q:` suivi de l'identifiant.
  final String item;
  final TextStyle? style;

  @override
  State<CoffreText> createState() => _CoffreTextState();
}

class _CoffreTextState extends State<CoffreText> {
  Future<CoffreResult>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.read(context).coffre.get(widget.item);
  }

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    final theme = Theme.of(context);
    return FutureBuilder<CoffreResult>(
      future: _future,
      builder: (c, snap) {
        if (!snap.hasData) return Padding(padding: const EdgeInsets.all(8), child: Text(t('coffre_loading', l), style: theme.textTheme.bodySmall));
        final r = snap.data!;
        if (r.status == CoffreStatus.ok) return MathText(tr(r.contenu, l), style: widget.style ?? theme.textTheme.bodyLarge);
        final key = switch (r.status) {
          CoffreStatus.signedOut => 'coffre_signin',
          CoffreStatus.denied => 'coffre_denied',
          CoffreStatus.offline => 'coffre_offline',
          _ => 'coffre_missing',
        };
        return Text(t(key, l), style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant));
      },
    );
  }
}
