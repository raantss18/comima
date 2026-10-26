import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import 'library.dart';
import 'practice.dart';
import 'profile_tab.dart';
import 'stats.dart';
import 'update_sheet.dart';

/// Écran principal : une barre d'icônes en haut (comme Tontolo) — l'onglet actif se déploie en
/// pastille avec son nom, les autres restent des icônes.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
  int _tab = 0;
  bool _sheetOpen = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _startup());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Au retour dans l'application : l'installation en attente reprend (après l'autorisation
  /// « installer depuis cette source »), et on vérifie s'il y a une nouvelle version.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed || !mounted) return;
    final s = AppScope.of(context);
    s.updater.resumePending();
    _offerUpdate();
    s.refreshCloudStatus();
  }

  /// Au démarrage : premier profil, puis mises à jour silencieuses (contenus, puis application).
  Future<void> _startup() async {
    final s = AppScope.of(context);
    if (s.progress.current == null) await createProfile(context);
    await s.reminders.reschedule(s.progress, s.lang);
    await s.updateContent();
    await _offerUpdate();
  }

  /// Propose la mise à jour d'elle-même (au plus toutes les 6 h, et pas si « plus tard » a été
  /// choisi il y a moins de 24 h) : l'élève n'a rien à chercher.
  Future<void> _offerUpdate() async {
    final s = AppScope.of(context);
    await s.checkUpdate();
    if (!mounted || _sheetOpen || !s.shouldPromptUpdate) return;
    _sheetOpen = true;
    await showUpdateSheet(context, s.availableUpdate!);
    _sheetOpen = false;
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    // Message de connexion (retour de Google, Facebook ou du lien e-mail) : affiché où qu'on soit.
    if (s.accountMessage != null) {
      final m = s.accountMessage!;
      s.accountMessage = null;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('a_$m', l))));
      });
    }
    final pages = [const TrainingTab(), const LibraryTab(), const StatsTab(), const ProfileTab()];
    final items = [
      (Icons.school_outlined, Icons.school, t('train', l), false),
      (Icons.menu_book_outlined, Icons.menu_book, t('library', l), false),
      (Icons.insights_outlined, Icons.insights, t('stats', l), false),
      (Icons.person_outline, Icons.person, t('profile', l), s.availableUpdate != null),
    ];
    return PopScope(
      canPop: _tab == 0, // le retour système ramène à l'entraînement avant de quitter
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => _tab = 0);
      },
      child: Scaffold(
        appBar: AppBar(
          toolbarHeight: 68,
          automaticallyImplyLeading: false,
          titleSpacing: 12,
          title: LayoutBuilder(builder: (context, c) {
            // Le nom de l'onglet actif ne s'affiche que s'il tient vraiment (largeur mesurée avec
            // la taille de police du téléphone) ; sinon icônes seules. La dernière icône n'est
            // jamais coupée : au pire, la rangée se réduit.
            final label = TextPainter(
              text: TextSpan(text: items[_tab].$3, style: _NavItem.labelStyle),
              textScaler: MediaQuery.textScalerOf(context),
              maxLines: 1,
              textDirection: TextDirection.ltr,
            )..layout();
            const logo = 54 + 10;
            final icons = items.length * 44.0;
            final labels = c.maxWidth >= logo + icons + label.width + 8 + 8;
            return Row(children: [
              Image.asset('assets/logo.png', height: 36),
              const SizedBox(width: 10),
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerRight,
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                  for (var i = 0; i < items.length; i++)
                    _NavItem(
                      icon: items[i].$1,
                      selectedIcon: items[i].$2,
                      label: items[i].$3,
                      selected: i == _tab,
                      showLabel: labels,
                      badge: items[i].$4,
                      onTap: () => setState(() => _tab = i),
                    ),
                  ]),
                ),
              ),
            ]);
          }),
        ),
        body: SafeArea(top: false, child: AnimatedSwitcher(duration: const Duration(milliseconds: 180), child: KeyedSubtree(key: ValueKey(_tab), child: pages[_tab]))),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.showLabel,
    required this.onTap,
    this.badge = false,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final bool showLabel;
  final bool badge;
  final VoidCallback onTap;

  static const labelStyle = TextStyle(fontWeight: FontWeight.w700);

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final pill = selected && showLabel;
    Widget ic = Icon(selected ? selectedIcon : icon, color: selected ? scheme.onSecondaryContainer : scheme.onSurfaceVariant);
    if (badge) ic = Badge(smallSize: 9, child: ic);
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: Tooltip(
        message: label,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            decoration: BoxDecoration(color: selected ? scheme.secondaryContainer : Colors.transparent, borderRadius: BorderRadius.circular(24)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              ic,
              if (pill) ...[
                const SizedBox(width: 8),
                Text(label, maxLines: 1, style: labelStyle.copyWith(color: scheme.onSecondaryContainer)),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}
