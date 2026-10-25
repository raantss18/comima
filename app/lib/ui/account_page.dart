import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/sync.dart';

/// Compte d'un profil : connexion (e-mail, Google, Facebook), synchronisation, déconnexion.
/// Tout est facultatif : sans compte, l'application fonctionne comme avant, hors ligne.
class AccountPage extends StatefulWidget {
  const AccountPage({super.key, required this.profileId});

  final String profileId;

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _signUp = false;
  bool _busy = false;
  bool _hidden = true;
  String? _message;

  @override
  void initState() {
    super.initState();
    // L'état du serveur (modes de connexion activés) est relu à l'ouverture de la page.
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => AppScope.of(context).refreshCloudStatus(force: true),
    );
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _toast(String code) {
    final l = AppScope.of(context).lang;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(t('a_$code', l))));
  }

  Future<void> _submit() async {
    final s = AppScope.of(context);
    final email = _email.text.trim();
    if (!email.contains('@') || _password.text.length < 6) {
      setState(() => _message = 'bad_input');
      return;
    }
    setState(() {
      _busy = true;
      _message = null;
    });
    final r = _signUp
        ? await s.signUpEmail(widget.profileId, email, _password.text)
        : await s.signInEmail(widget.profileId, email, _password.text);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _message = r;
    });
  }

  Future<void> _oauth(String provider) async {
    final s = AppScope.of(context);
    setState(() => _message = null);
    final ok = await s.startOAuth(widget.profileId, provider);
    if (!ok && mounted) setState(() => _message = 'login_failed');
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final profile = s.progress.profile(widget.profileId);
    final auth = s.progress.authOf(widget.profileId);
    // Message déposé par un retour de navigateur (Google, Facebook, lien d'e-mail).
    if (s.accountMessage != null) {
      final m = s.accountMessage!;
      s.accountMessage = null;
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => mounted ? _toast(m) : null,
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text('${t('account', l)} · ${profile?['name'] ?? ''}'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (!s.accountsEnabled)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(t('accounts_soon', l)),
              ),
            )
          else if (auth == null && !s.accountsReady)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(t('accounts_not_ready', l)),
              ),
            )
          else if (auth != null)
            ..._connected(context, s, l, theme, profile!, auth)
          else
            ..._form(context, s, l, theme),
          const SizedBox(height: 16),
          Text(t('account_privacy', l), style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }

  List<Widget> _form(
    BuildContext context,
    AppState s,
    String l,
    ThemeData theme,
  ) {
    return [
      Text(t('account_why', l), style: theme.textTheme.bodyLarge),
      const SizedBox(height: 16),
      if (s.cloudStatus.google)
        FilledButton.tonalIcon(
          onPressed: _busy ? null : () => _oauth('google'),
          icon: const Icon(Icons.g_mobiledata, size: 28),
          label: Text(t('continue_google', l)),
        ),
      if (s.cloudStatus.google && s.cloudStatus.facebook)
        const SizedBox(height: 8),
      if (s.cloudStatus.facebook)
        FilledButton.tonalIcon(
          onPressed: _busy ? null : () => _oauth('facebook'),
          icon: const Icon(Icons.facebook),
          label: Text(t('continue_facebook', l)),
        ),
      if (!s.cloudStatus.email)
        ...const []
      else ...[
        if (s.cloudStatus.google || s.cloudStatus.facebook)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(),
          ),
        SegmentedButton<bool>(
          segments: [
            ButtonSegment(value: false, label: Text(t('signin', l))),
            ButtonSegment(value: true, label: Text(t('signup', l))),
          ],
          selected: {_signUp},
          onSelectionChanged: (v) => setState(() {
            _signUp = v.first;
            _message = null;
          }),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          decoration: InputDecoration(
            labelText: t('email', l),
            border: const OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          obscureText: _hidden,
          autocorrect: false,
          decoration: InputDecoration(
            labelText: t('password', l),
            helperText: _signUp ? t('password_hint', l) : null,
            border: const OutlineInputBorder(),
            suffixIcon: IconButton(
              icon: Icon(_hidden ? Icons.visibility : Icons.visibility_off),
              onPressed: () => setState(() => _hidden = !_hidden),
            ),
          ),
          onSubmitted: (_) => _submit(),
        ),
        if (_message != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              t('a_$_message', l),
              style: TextStyle(
                color: _message == 'check_mail'
                    ? theme.colorScheme.primary
                    : theme.colorScheme.error,
              ),
            ),
          ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: _busy
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(_signUp ? t('signup', l) : t('signin', l)),
        ),
        if (!_signUp)
          TextButton(
            onPressed: _busy
                ? null
                : () async {
                    if (!_email.text.contains('@')) {
                      return setState(() => _message = 'bad_input');
                    }
                    final r = await s.recoverPassword(_email.text);
                    if (mounted) setState(() => _message = r);
                  },
            child: Text(t('forgot', l)),
          ),
      ],
    ];
  }

  List<Widget> _connected(
    BuildContext context,
    AppState s,
    String l,
    ThemeData theme,
    Map<String, dynamic> profile,
    Map<String, dynamic> auth,
  ) {
    final syncing = s.syncing.contains(widget.profileId);
    final last = DateTime.tryParse((auth['lastSync'] ?? '').toString())
        ?.toLocal();
    final unsent = s.progress.unsynced(widget.profileId, limit: 100000).length;
    return [
      Card(
        child: ListTile(
          leading: Icon(
            Icons.cloud_done_outlined,
            color: theme.colorScheme.primary,
          ),
          title: Text((auth['email'] ?? t('connected', l)).toString()),
          subtitle: Text(
            [
              if (profile['serverRole'] == 'encadreur') t('role_coach', l),
              if (profile['serverRole'] == 'admin') 'Admin',
              last == null
                  ? t('never_synced', l)
                  : '${t('last_sync', l)} ${last.day}/${last.month} ${last.hour.toString().padLeft(2, '0')}:${last.minute.toString().padLeft(2, '0')}',
              if (unsent > 0) '$unsent ${t('to_send', l)}',
            ].join(' · '),
          ),
        ),
      ),
      if (profile['role'] == 'encadreur' && profile['serverRole'] == 'eleve')
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(t('coach_pending', l), style: theme.textTheme.bodySmall),
        ),
      const SizedBox(height: 12),
      FilledButton.icon(
        onPressed: syncing
            ? null
            : () async {
                final r = await s.syncProfile(widget.profileId);
                if (!mounted) return;
                _toast(switch (r) {
                  SyncResult.ok => 'synced',
                  SyncResult.offline => 'offline',
                  SyncResult.signedOut => 'signed_out',
                  SyncResult.failed => 'sync_failed',
                });
              },
        icon: syncing
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.sync),
        label: Text(syncing ? t('syncing', l) : t('sync_now', l)),
      ),
      const SizedBox(height: 8),
      OutlinedButton.icon(
        onPressed: () async {
          await s.signOutProfile(widget.profileId);
          if (mounted) setState(() {});
        },
        icon: const Icon(Icons.logout),
        label: Text(t('signout', l)),
      ),
      const SizedBox(height: 24),
      TextButton.icon(
        style: TextButton.styleFrom(foregroundColor: theme.colorScheme.error),
        onPressed: () async {
          final ok = await showDialog<bool>(
            context: context,
            builder: (c) => AlertDialog(
              title: Text(t('delete_online', l)),
              content: Text(t('delete_online_warning', l)),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(c, false),
                  child: Text(t('cancel', l)),
                ),
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: theme.colorScheme.error,
                  ),
                  onPressed: () => Navigator.pop(c, true),
                  child: Text(t('delete', l)),
                ),
              ],
            ),
          );
          if (ok != true) return;
          final done = await s.deleteOnline(widget.profileId);
          if (mounted) {
            _toast(done ? 'deleted_online' : 'offline');
            setState(() {});
          }
        },
        icon: const Icon(Icons.delete_outline),
        label: Text(t('delete_online', l)),
      ),
    ];
  }
}
