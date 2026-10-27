import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import 'profile_tab.dart' show createProfile;
import 'update_sheet.dart';
import 'welcome.dart';

/// Racine de l'application : l'accueil (mot de bienvenue, tuiles, « Reprendre »). Elle garde aussi la vie de
/// l'application : mises à jour des contenus et de l'application, retour de connexion.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
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
    // Message de connexion (retour de Google ou du lien e-mail) : affiché où qu'on soit.
    if (s.accountMessage != null) {
      final m = s.accountMessage!;
      s.accountMessage = null;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('a_$m', l))));
      });
    }
    // Pastille sur « Profil et réglages » quand une nouvelle version est disponible : voir l'écran d'accueil.
    return const WelcomePage();
  }
}
