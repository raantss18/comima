import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/i18n.dart';
import '../core/updater.dart';
import 'library.dart';
import 'notion.dart';
import 'profile_form.dart';
import 'reminders_section.dart';
import 'stats.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _startup());
  }

  /// Au démarrage : premier profil, puis mises à jour silencieuses (contenus, puis APK).
  Future<void> _startup() async {
    final s = AppScope.of(context);
    if (s.progress.current == null) await createProfile(context);
    await s.reminders.reschedule(s.progress, s.lang);
    await s.updateContent();
    final release = await s.updater.check();
    if (release != null && mounted) await showUpdateDialog(context, release);
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final pages = [const TrainingTab(), const LibraryTab(), const StatsTab(), const ProfileTab()];
    return Scaffold(
      body: SafeArea(child: pages[_tab]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.school_outlined), selectedIcon: const Icon(Icons.school), label: t('train', l)),
          NavigationDestination(icon: const Icon(Icons.menu_book_outlined), selectedIcon: const Icon(Icons.menu_book), label: t('library', l)),
          NavigationDestination(icon: const Icon(Icons.insights_outlined), selectedIcon: const Icon(Icons.insights), label: t('stats', l)),
          NavigationDestination(icon: const Icon(Icons.person_outline), selectedIcon: const Icon(Icons.person), label: t('profile', l)),
        ],
      ),
    );
  }
}

/// Création d'un profil (le premier est obligatoire : sans lui, rien n'est enregistré).
Future<void> createProfile(BuildContext context) async {
  final s = AppScope.of(context);
  final first = s.progress.current == null;
  final info = await showProfileForm(context, first: first);
  if (info != null) {
    await s.addProfile(info);
  } else if (first) {
    await s.addProfile({'name': s.lang == 'en' ? 'Student' : 'Élève', 'role': 'eleve'});
  }
}

Future<void> _confirmDelete(BuildContext context, Map<String, dynamic> p) async {
  final s = AppScope.of(context);
  final l = s.lang;
  if (s.progress.profiles.length <= 1) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('cannot_delete_last', l))));
    return;
  }
  final ok = await showDialog<bool>(
    context: context,
    builder: (c) => AlertDialog(
      title: Text('${t('delete_profile', l)} « ${p['name']} » ?'),
      content: Text(t('delete_profile_warning', l)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c, false), child: Text(t('cancel', l))),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: Theme.of(c).colorScheme.error),
          onPressed: () => Navigator.pop(c, true),
          child: Text(t('delete', l)),
        ),
      ],
    ),
  );
  if (ok == true) await s.deleteProfile(p['id'] as String);
}

Future<void> showUpdateDialog(BuildContext context, AppRelease r) async {
  final s = AppScope.of(context);
  final l = s.lang;
  final progress = ValueNotifier<double?>(null);
  await showDialog<void>(
    context: context,
    barrierDismissible: !r.mandatory,
    builder: (c) => ValueListenableBuilder<double?>(
      valueListenable: progress,
      builder: (c, p, _) => AlertDialog(
        title: Text(l == 'en' ? 'New version ${r.version}' : 'Nouvelle version ${r.version}'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Nouveautés de chaque version sautée, de la plus récente à la plus ancienne.
          for (final (v, n) in r.notes.reversed) ...[
            Text(v, style: const TextStyle(fontWeight: FontWeight.w700)),
            Text(tr(n, l)),
            const SizedBox(height: 6),
          ],
          if (r.bytes > 0) Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text('${(r.bytes / 1048576).toStringAsFixed(1)} Mo', style: Theme.of(c).textTheme.bodySmall),
          ),
          if (p != null) Padding(padding: const EdgeInsets.only(top: 12), child: LinearProgressIndicator(value: p)),
        ]),
        actions: [
          if (!r.mandatory && p == null) TextButton(onPressed: () => Navigator.pop(c), child: Text(l == 'en' ? 'Later' : 'Plus tard')),
          if (p == null)
            FilledButton(
              onPressed: () async {
                progress.value = 0;
                final ok = await s.updater.install(r, (v) => progress.value = v);
                if (!c.mounted) return;
                progress.value = null;
                if (!ok) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('update_failed', l))));
                }
                if (!r.mandatory) Navigator.pop(c);
              },
              child: Text(t('update', l)),
            ),
        ],
      ),
    ),
  );
}

class TrainingTab extends StatelessWidget {
  const TrainingTab({super.key});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final p = s.progress;
    return RefreshIndicator(
      onRefresh: s.updateContent,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        Row(children: [
          Image.asset('assets/logo.png', width: 44, height: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.current?['name']?.toString() ?? 'COMIMa', style: theme.textTheme.titleLarge),
              Text('${t('level', l)} ${p.level} · ${p.xp} ${t('xp', l)}', style: theme.textTheme.bodyMedium),
            ]),
          ),
        ]),
        const SizedBox(height: 16),
        if (s.progress.reminders['asked'] != true) const ReminderInvite(),
        for (final pack in s.content.packs) ...[
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text('${themeName(pack.theme, l)} · ${t('level', l)} ${pack.niveau}',
                style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700)),
          ),
          for (final n in pack.notions) NotionTile(notion: n),
        ],
      ]),
    );
  }
}

class NotionTile extends StatelessWidget {
  const NotionTile({super.key, required this.notion});

  final Notion notion;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final m = s.progress.notionMastery(notion);
    return Card(
      child: ListTile(
        title: Text(tr(notion.titre, l), style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Row(children: [
            Expanded(child: LinearProgressIndicator(value: m, minHeight: 6, borderRadius: BorderRadius.circular(3))),
            const SizedBox(width: 10),
            Text('${(m * 100).round()} %'),
          ]),
        ),
        trailing: m >= 0.8 ? const Icon(Icons.verified, color: Color(0xFF1D7A33)) : const Icon(Icons.chevron_right),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NotionPage(notion: notion))),
      ),
    );
  }
}

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  bool _busy = false;

  Future<void> _update() async {
    final s = AppScope.of(context);
    final l = s.lang;
    setState(() => _busy = true);
    final r = await s.updateContent();
    final release = await s.updater.check();
    if (!mounted) return;
    setState(() => _busy = false);
    final msg = switch (r) {
      UpdateResult.updated => t('updated', l),
      UpdateResult.upToDate => t('up_to_date', l),
      UpdateResult.offline => t('offline', l),
      UpdateResult.rejected => t('update_failed', l),
    };
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    if (release != null) await showUpdateDialog(context, release);
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    return ListView(padding: const EdgeInsets.all(16), children: [
      Text(t('profiles', l), style: theme.textTheme.titleMedium),
      for (final p in s.progress.profiles)
        Card(
          child: ListTile(
            leading: Icon(p['id'] == s.progress.current?['id'] ? Icons.radio_button_checked : Icons.radio_button_off,
                color: theme.colorScheme.primary),
            title: Text(p['name'].toString()),
            subtitle: Text([
              '${p['xp']} ${t('xp', l)}',
              if (p['role'] == 'encadreur') t('role_coach', l),
              if ((p['school'] ?? '').toString().isNotEmpty) p['school'],
              if (p['role'] != 'encadreur' && p['birthYear'] == null) '⚠ ${t('complete_profile', l)}',
            ].join(' · ')),
            onTap: () => s.selectProfile(p['id'] as String),
            trailing: PopupMenuButton<String>(
              onSelected: (v) async {
                if (v == 'edit') {
                  final info = await showProfileForm(context, initial: p);
                  if (info != null) await s.updateProfile(p['id'] as String, info);
                } else if (context.mounted) {
                  await _confirmDelete(context, p);
                }
              },
              itemBuilder: (c) => [
                PopupMenuItem(value: 'edit', child: ListTile(leading: const Icon(Icons.edit), title: Text(t('edit_profile', l)))),
                PopupMenuItem(
                  value: 'delete',
                  child: ListTile(leading: const Icon(Icons.delete_outline), title: Text(t('delete', l))),
                ),
              ],
            ),
          ),
        ),
      TextButton.icon(onPressed: () => createProfile(context), icon: const Icon(Icons.person_add_alt), label: Text(t('add_profile', l))),
      const Divider(height: 32),
      Text(t('language', l), style: theme.textTheme.titleMedium),
      const SizedBox(height: 8),
      SegmentedButton<String>(
        segments: const [ButtonSegment(value: 'fr', label: Text('Français')), ButtonSegment(value: 'en', label: Text('English'))],
        selected: {l},
        onSelectionChanged: (v) => s.lang = v.first,
      ),
      const Divider(height: 32),
      const RemindersSection(),
      const Divider(height: 32),
      Text(t('content', l), style: theme.textTheme.titleMedium),
      const SizedBox(height: 4),
      Text('${t('version', l)} : ${s.content.version}'),
      Text('Application : ${s.updater.version} (${s.updater.build}) — ${t('test_build', l)}'),
      const SizedBox(height: 8),
      FilledButton.icon(
        onPressed: _busy ? null : _update,
        icon: _busy
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.sync),
        label: Text(_busy ? t('updating', l) : t('update', l)),
      ),
    ]);
  }
}
