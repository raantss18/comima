import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import 'theme.dart';

/// « Tu es élève ou encadreur ? » : un choix, fait une fois pour toutes à la création du profil
/// (on est l'un ou l'autre). Renvoie 'eleve' ou 'encadreur', ou null si l'élève revient en arrière.
Future<String?> pickRole(BuildContext context, {required bool first}) {
  return Navigator.push<String>(
    context,
    MaterialPageRoute(fullscreenDialog: !first, builder: (_) => RolePage(first: first)),
  );
}

class RolePage extends StatelessWidget {
  const RolePage({super.key, required this.first});

  final bool first;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    return PopScope(
      canPop: !first, // au tout premier lancement, on ne peut pas passer ce choix
      child: Scaffold(
        appBar: first ? null : AppBar(title: Text(t('new_profile', l))),
        body: SafeArea(
          child: ListView(padding: const EdgeInsets.all(20), children: [
            if (first) ...[
              const SizedBox(height: 12),
              Center(child: Image.asset('assets/logo.png', width: 130)),
              const SizedBox(height: 16),
              Text(t('welcome_title', l), textAlign: TextAlign.center, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(t('welcome_text', l), textAlign: TextAlign.center, style: theme.textTheme.bodyLarge),
              const SizedBox(height: 28),
            ],
            Text(t('who_are_you', l), style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            _RoleCard(
              icon: Icons.school,
              color: comimaGreen,
              title: t('role_student', l),
              text: t('role_student_text', l),
              onTap: () => Navigator.pop(context, 'eleve'),
            ),
            const SizedBox(height: 12),
            _RoleCard(
              icon: Icons.co_present,
              color: const Color(0xFF3F51B5),
              title: t('role_coach', l),
              text: t('role_coach_text', l),
              onTap: () => Navigator.pop(context, 'encadreur'),
            ),
            const SizedBox(height: 16),
            Text(t('role_fixed', l), style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
          ]),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({required this.icon, required this.color, required this.title, required this.text, required this.onTap});

  final IconData icon;
  final Color color;
  final String title;
  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = readable(context, color);
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: c.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(18)),
              child: Icon(icon, color: c, size: 30),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(text, style: theme.textTheme.bodyMedium),
              ]),
            ),
            const Icon(Icons.chevron_right),
          ]),
        ),
      ),
    );
  }
}
