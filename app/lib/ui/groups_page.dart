import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/app_state.dart';
import '../core/cloud.dart';
import '../core/i18n.dart';
import 'marks.dart';

/// Groupes d'encadrement. Un encadreur crée un groupe et donne son code ; l'élève entre le code
/// pour le rejoindre. L'encadreur voit alors les marque-pages de ses élèves (et seulement eux :
/// les règles d'accès sont côté serveur).
class GroupsPage extends StatefulWidget {
  const GroupsPage({super.key, required this.profileId, required this.coach});

  final String profileId;
  final bool coach;

  @override
  State<GroupsPage> createState() => _GroupsPageState();
}

class _GroupsPageState extends State<GroupsPage> {
  String? _me;
  List<Map<String, dynamic>> _groups = const [];
  Map<String, Map<String, int>> _summary = const {}; // élève -> {fait, continuer, etoile, total}
  String? _error; // clé i18n
  bool _loading = true;
  final _code = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  String _errorKey(Object e) => e is CloudException && e.missingTable ? 'groups_unavailable' : 'groups_error';

  Future<void> _load() async {
    final s = AppScope.read(context);
    setState(() => _loading = true);
    try {
      final r = await s.withSession(widget.profileId, (c, ses) async {
        final groups = await c.myGroups(ses);
        final mine = [for (final g in groups) if (g['coach_id'] == ses.userId) g];
        final ids = {for (final g in mine) for (final m in (g['group_members'] as List? ?? const [])) (m as Map)['user_id'] as String};
        final marks = widget.coach ? await c.marksOf(ses, ids.toList()) : const <Map<String, dynamic>>[];
        return (ses.userId, groups, marks);
      });
      if (!mounted) return;
      if (r == null) {
        setState(() {
          _error = 'groups_error';
          _loading = false;
        });
        return;
      }
      final sum = <String, Map<String, int>>{};
      for (final m in r.$3) {
        final u = m['user_id'] as String;
        final x = sum.putIfAbsent(u, () => {'fait': 0, 'continuer': 0, 'etoile': 0, 'total': 0});
        if (m['status'] != null) x['total'] = x['total']! + 1;
        if (m['status'] == 'fait') x['fait'] = x['fait']! + 1;
        if (m['status'] == 'continuer') x['continuer'] = x['continuer']! + 1;
        if (m['starred'] == true) x['etoile'] = x['etoile']! + 1;
      }
      setState(() {
        _me = r.$1;
        _groups = r.$2;
        _summary = sum;
        _error = null;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = _errorKey(e);
          _loading = false;
        });
      }
    }
  }

  void _toast(String key, [String extra = '']) {
    final l = AppScope.read(context).lang;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${t(key, l)}$extra')));
  }

  Future<String?> _ask(String titleKey, String hintKey, String okKey) {
    final l = AppScope.read(context).lang;
    final c = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text(t(titleKey, l)),
        content: TextField(controller: c, autofocus: true, maxLength: 60, decoration: InputDecoration(labelText: t(hintKey, l))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(d), child: Text(t('cancel', l))),
          FilledButton(onPressed: () => Navigator.pop(d, c.text.trim()), child: Text(t(okKey, l))),
        ],
      ),
    );
  }

  Future<void> _create() async {
    final s = AppScope.read(context);
    final name = await _ask('group_new', 'group_name', 'group_create');
    if (name == null || name.isEmpty) return;
    try {
      await s.withSession(widget.profileId, (c, ses) => c.createGroup(ses, name));
      await _load();
    } catch (e) {
      if (mounted) _toast(_errorKey(e));
    }
  }

  Future<void> _join() async {
    final s = AppScope.read(context);
    final code = _code.text.trim();
    if (code.isEmpty) return;
    try {
      final name = await s.withSession(widget.profileId, (c, ses) => c.joinGroup(ses, code));
      _code.clear();
      if (mounted) _toast('group_joined', ' ${name ?? ''}');
      await _load();
    } on CloudException catch (e) {
      if (mounted) _toast(e.message.contains('Code inconnu') ? 'group_bad_code' : _errorKey(e));
    } catch (_) {
      if (mounted) _toast('groups_error');
    }
  }

  Future<void> _leave(Map<String, dynamic> g) async {
    final s = AppScope.read(context);
    final l = s.lang;
    final ok = await showDialog<bool>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text(g['name'].toString()),
        content: Text(t('group_leave_q', l)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(d, false), child: Text(t('cancel', l))),
          FilledButton(onPressed: () => Navigator.pop(d, true), child: Text(t('group_leave', l))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await s.withSession(widget.profileId, (c, ses) => c.leaveGroup(ses, g['id'] as String));
      await _load();
    } catch (e) {
      if (mounted) _toast(_errorKey(e));
    }
  }

  Future<void> _renew(Map<String, dynamic> g) async {
    final s = AppScope.read(context);
    final l = s.lang;
    final ok = await showDialog<bool>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text(t('group_renew', l)),
        content: Text(t('group_renew_warning', l)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(d, false), child: Text(t('cancel', l))),
          FilledButton(onPressed: () => Navigator.pop(d, true), child: Text(t('group_renew', l))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await s.withSession(widget.profileId, (c, ses) => c.renewGroupCode(ses, g['id'] as String));
      await _load();
    } catch (e) {
      if (mounted) _toast(_errorKey(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final mine = [for (final g in _groups) if (g['coach_id'] == _me) g];
    final joined = [for (final g in _groups) if (g['coach_id'] != _me) g];
    return Scaffold(
      appBar: AppBar(title: Text(t('groups', l))),
      floatingActionButton: widget.coach && _error == null ? FloatingActionButton.extended(onPressed: _create, icon: const Icon(Icons.group_add_outlined), label: Text(t('group_new', l))) : null,
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(padding: const EdgeInsets.fromLTRB(16, 12, 16, 96), children: [
          Text(t(widget.coach ? 'groups_intro_coach' : 'groups_intro_student', l), style: theme.textTheme.bodyMedium),
          const SizedBox(height: 12),
          if (_loading) const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
          if (_error != null && !_loading) Card(child: ListTile(leading: const Icon(Icons.cloud_off_outlined), title: Text(t(_error!, l)))),
          if (_error == null && !_loading) ...[
            if (!widget.coach) ...[
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(
                  child: TextField(
                    controller: _code,
                    textCapitalization: TextCapitalization.characters,
                    maxLength: 12,
                    decoration: InputDecoration(labelText: t('group_join_code', l), counterText: ''),
                    onSubmitted: (_) => _join(),
                  ),
                ),
                const SizedBox(width: 8),
                Padding(padding: const EdgeInsets.only(top: 6), child: FilledButton(onPressed: _join, child: Text(t('group_join', l)))),
              ]),
              const SizedBox(height: 12),
              if (joined.isNotEmpty) Text(t('groups_mine_student', l), style: theme.textTheme.titleMedium),
              for (final g in joined)
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.groups_2_outlined),
                    title: Text(g['name'].toString()),
                    trailing: TextButton(onPressed: () => _leave(g), child: Text(t('group_leave', l))),
                  ),
                ),
            ],
            if (widget.coach) ...[
              if (mine.isNotEmpty) Text(t('groups_mine_coach', l), style: theme.textTheme.titleMedium),
              for (final g in mine) _coachGroup(context, g, l, theme),
            ],
          ],
        ]),
      ),
    );
  }

  Widget _coachGroup(BuildContext context, Map<String, dynamic> g, String l, ThemeData theme) {
    final members = [for (final m in (g['group_members'] as List? ?? const [])) (m as Map).cast<String, dynamic>()];
    String nameOf(Map<String, dynamic> m) => ((m['profiles'] as Map?)?['display_name'] ?? '?').toString();
    members.sort((a, b) => nameOf(a).toLowerCase().compareTo(nameOf(b).toLowerCase()));
    return Card(
      margin: const EdgeInsets.only(top: 8),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(g['name'].toString(), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          Wrap(crossAxisAlignment: WrapCrossAlignment.center, children: [
            Text('${t('group_code', l)} ', style: theme.textTheme.bodyMedium),
            SelectableText(g['join_code'].toString(), style: theme.textTheme.titleMedium?.copyWith(letterSpacing: 2, fontWeight: FontWeight.w800)),
            IconButton(
              tooltip: t('group_code_copied', l),
              icon: const Icon(Icons.copy, size: 18),
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: g['join_code'].toString()));
                if (mounted) _toast('group_code_copied');
              },
            ),
            TextButton(onPressed: () => _renew(g), child: Text(t('group_renew', l))),
          ]),
          const Divider(height: 8),
          if (members.isEmpty) Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text(t('group_no_students', l), style: theme.textTheme.bodySmall)),
          for (final m in members)
            ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: const Icon(Icons.person_outline),
              title: Text(nameOf(m)),
              subtitle: Text(_line(_summary[m['user_id']], l)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => MemberMarksPage(profileId: widget.profileId, userId: m['user_id'] as String, name: nameOf(m))),
              ),
            ),
        ]),
      ),
    );
  }

  String _line(Map<String, int>? x, String l) {
    if (x == null || (x['total'] == 0 && x['etoile'] == 0)) return t('group_nothing_yet', l);
    return [
      '${x['fait']} ${t('mark_fait', l).toLowerCase()}',
      if (x['continuer']! > 0) '${x['continuer']} ${t('mark_continuer', l).toLowerCase()}',
      if (x['etoile']! > 0) '${x['etoile']} ★',
    ].join(' · ');
  }
}

/// Marque-pages d'un élève, vus par son encadreur : exercices, cours, sujets, du plus récent au plus ancien.
class MemberMarksPage extends StatefulWidget {
  const MemberMarksPage({super.key, required this.profileId, required this.userId, required this.name});

  final String profileId;
  final String userId;
  final String name;

  @override
  State<MemberMarksPage> createState() => _MemberMarksPageState();
}

class _MemberMarksPageState extends State<MemberMarksPage> {
  List<Map<String, dynamic>>? _marks;
  String? _error;
  String _filter = 'tous';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final s = AppScope.read(context);
    try {
      final rows = await s.withSession(widget.profileId, (c, ses) => c.marksOf(ses, [widget.userId]));
      if (!mounted) return;
      setState(() {
        _marks = rows;
        _error = rows == null ? 'groups_error' : null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e is CloudException && e.missingTable ? 'groups_unavailable' : 'groups_error');
    }
  }

  String _title(AppState s, String item) {
    final i = item.indexOf(':');
    if (i < 0) return item;
    final kind = item.substring(0, i);
    final id = item.substring(i + 1);
    final list = s.content.list(switch (kind) { 'exo' => 'exercices', 'cours' => 'cours', _ => 'sujets' });
    for (final e in list) {
      if (e['id'] == id) return tr(e['titre'], s.lang);
    }
    return id;
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final all = _marks;
    final shown = all == null
        ? const <Map<String, dynamic>>[]
        : [
            for (final m in all)
              if (_filter == 'tous' ? (m['status'] != null || m['starred'] == true) : _filter == 'etoile' ? m['starred'] == true : m['status'] == _filter) m
          ];
    return Scaffold(
      appBar: AppBar(title: Text(widget.name)),
      body: _error != null
          ? Padding(padding: const EdgeInsets.all(16), child: Card(child: ListTile(leading: const Icon(Icons.cloud_off_outlined), title: Text(t(_error!, l)))))
          : all == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(padding: const EdgeInsets.all(16), children: [
                  Wrap(spacing: 8, runSpacing: 4, children: [
                    for (final f in const ['tous', 'fait', 'continuer', 'teste', 'lu', 'etoile'])
                      ChoiceChip(
                        label: Text(f == 'tous' ? t('all', l) : f == 'etoile' ? t('mark_star', l) : t('mark_$f', l)),
                        selected: _filter == f,
                        onSelected: (_) => setState(() => _filter = f),
                      ),
                  ]),
                  const SizedBox(height: 8),
                  if (shown.isEmpty) Padding(padding: const EdgeInsets.all(16), child: Text(t('group_nothing_yet', l), style: theme.textTheme.bodyMedium)),
                  for (final m in shown)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(markIcon(m['status'] as String?), color: markColor(context, m['status'] as String?)),
                      title: Text(_title(s, m['item'].toString())),
                      subtitle: Text(_when(m['updated_at'], l)),
                      trailing: m['starred'] == true ? const Icon(Icons.star, color: Colors.amber) : null,
                    ),
                ]),
    );
  }

  String _when(Object? iso, String l) {
    final d = DateTime.tryParse((iso ?? '').toString())?.toLocal();
    if (d == null) return '';
    return '${t('group_updated', l)} ${d.day}/${d.month}';
  }
}
