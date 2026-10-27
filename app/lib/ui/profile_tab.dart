import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/i18n.dart';
import 'about_page.dart';
import 'account_page.dart';
import 'design.dart';
import 'profile_form.dart';
import 'reminders_section.dart';
import 'role_page.dart';
import 'update_sheet.dart';

/// Création d'un profil : d'abord « élève ou encadreur » (un choix définitif), puis le
/// formulaire. Le premier profil est obligatoire : sans lui, rien n'est enregistré.
Future<void> createProfile(BuildContext context) async {
  final s = AppScope.of(context);
  final first = s.progress.current == null;
  final role = await pickRole(context, first: first);
  if (role == null || !context.mounted) return;
  final info = await showProfileForm(context, first: first, role: role);
  if (info != null) {
    await s.addProfile(info);
  } else if (first) {
    await s.addProfile({'name': s.lang == 'en' ? 'Student' : 'Élève', 'role': role});
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

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  bool _busy = false;

  Future<void> _refresh() async {
    final s = AppScope.of(context);
    final l = s.lang;
    setState(() => _busy = true);
    final r = await s.updateContent();
    await s.checkUpdate(force: true);
    if (!mounted) return;
    setState(() => _busy = false);
    final msg = switch (r) {
      UpdateResult.updated => t('updated', l),
      UpdateResult.upToDate => s.availableUpdate == null ? t('up_to_date', l) : null,
      UpdateResult.offline => t('offline', l),
      UpdateResult.rejected => t('update_failed', l),
    };
    if (msg != null) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    if (s.availableUpdate != null) await showUpdateSheet(context, s.availableUpdate!);
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final up = s.availableUpdate;
    return ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 28), children: [
      if (up != null)
        Material(
          color: theme.colorScheme.tertiaryContainer,
          borderRadius: BorderRadius.circular(22),
          child: InkWell(
            borderRadius: BorderRadius.circular(22),
            onTap: () => showUpdateSheet(context, up),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Icon(Icons.system_update, color: theme.colorScheme.onTertiaryContainer),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('${t('new_version', l)} ${up.version}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: theme.colorScheme.onTertiaryContainer)),
                    Text(t('tap_to_update', l), style: TextStyle(color: theme.colorScheme.onTertiaryContainer)),
                  ]),
                ),
                Icon(Icons.chevron_right, color: theme.colorScheme.onTertiaryContainer),
              ]),
            ),
          ),
        ),
      _Section(t('profiles', l)),
      for (final p in s.progress.profiles) _ProfileCard(profile: p),
      Align(
        alignment: Alignment.centerLeft,
        child: TextButton.icon(onPressed: () => createProfile(context), icon: const Icon(Icons.person_add_alt), label: Text(t('add_profile', l))),
      ),
      _Section(t('language', l)),
      SegmentedButton<String>(
        segments: const [ButtonSegment(value: 'fr', label: Text('Français')), ButtonSegment(value: 'en', label: Text('English'))],
        selected: {l},
        onSelectionChanged: (v) => s.lang = v.first,
      ),
      const SizedBox(height: 8),
      const Card(child: Padding(padding: EdgeInsets.all(14), child: RemindersSection())),
      _Section(t('content', l)),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${t('version', l)} : ${s.content.version}', style: theme.textTheme.bodyMedium),
            Text('${t('app_version', l)} : ${s.updater.version} (${s.updater.build})', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 10),
            FilledButton.tonalIcon(
              onPressed: _busy ? null : _refresh,
              icon: _busy ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.sync),
              label: Text(_busy ? t('updating', l) : t('check_updates', l)),
            ),
          ]),
        ),
      ),
      const SizedBox(height: 8),
      Card(
        child: ListTile(
          leading: const Icon(Icons.insights_outlined),
          title: Text(t('stats', l)),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => openStats(context),
        ),
      ),
      Card(
        child: ListTile(
          leading: const Icon(Icons.info_outline),
          title: Text(t('about_app', l)),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AboutPage())),
        ),
      ),
    ]);
  }
}

class _Section extends StatelessWidget {
  const _Section(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 22, bottom: 8),
        child: Text(text, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
      );
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.profile});

  final Map<String, dynamic> profile;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final p = profile;
    final id = p['id'] as String;
    final coach = p['role'] == 'encadreur';
    final current = id == s.progress.current?['id'];
    final name = p['name'].toString();
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: current ? BorderSide(color: theme.colorScheme.primary, width: 2) : BorderSide.none,
      ),
      child: ListTile(
        onTap: () => s.selectProfile(id),
        leading: CircleAvatar(
          backgroundColor: coach ? const Color(0xFF3F51B5) : theme.colorScheme.primary,
          foregroundColor: Colors.white,
          child: Text(name.characters.first.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w800)),
        ),
        title: Row(children: [
          Flexible(child: Text(name, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700))),
          const SizedBox(width: 8),
          Icon(coach ? Icons.co_present : Icons.school, size: 16, color: theme.colorScheme.onSurfaceVariant),
        ]),
        subtitle: Text([
          coach ? t('role_coach', l) : t('role_student', l),
          if (!coach) '${p['xp']} ${t('xp', l)}',
          if (s.progress.authOf(id) != null) '☁ ${t('connected', l)}',
          if ((p['school'] ?? '').toString().isNotEmpty) p['school'],
          if (!coach && p['birthYear'] == null) '⚠ ${t('complete_profile', l)}',
        ].join(' · ')),
        trailing: PopupMenuButton<String>(
          onSelected: (v) async {
            if (v == 'edit') {
              final info = await showProfileForm(context, initial: p);
              if (info != null) {
                await s.updateProfile(id, info);
                s.syncSoon();
              }
            } else if (v == 'account') {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => AccountPage(profileId: id)));
            } else if (context.mounted) {
              await _confirmDelete(context, p);
            }
          },
          itemBuilder: (c) => [
            PopupMenuItem(value: 'account', child: ListTile(leading: const Icon(Icons.cloud_outlined), title: Text(t('account', l)))),
            PopupMenuItem(value: 'edit', child: ListTile(leading: const Icon(Icons.edit), title: Text(t('edit_profile', l)))),
            PopupMenuItem(value: 'delete', child: ListTile(leading: const Icon(Icons.delete_outline), title: Text(t('delete', l)))),
          ],
        ),
      ),
    );
  }
}
