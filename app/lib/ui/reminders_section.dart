import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/reminders.dart';

/// Proposition unique (accueil) : l'élève choisit, rien n'est activé sans son accord.
class ReminderInvite extends StatelessWidget {
  const ReminderInvite({super.key});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final cfg = Reminders.settingsOf(s.progress);
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.notifications_active_outlined),
            const SizedBox(width: 8),
            Expanded(child: Text(t('reminder_invite', l), style: const TextStyle(fontWeight: FontWeight.w600))),
          ]),
          const SizedBox(height: 4),
          Text(t('reminder_promise', l)),
          Row(mainAxisAlignment: MainAxisAlignment.end, children: [
            TextButton(onPressed: () => s.setReminders({...cfg, 'asked': true}), child: Text(t('no_thanks', l))),
            FilledButton.tonal(
              onPressed: () async {
                final granted = await s.reminders.requestPermission();
                await s.setReminders({...cfg, 'asked': true, 'enabled': granted});
              },
              child: Text(t('enable', l)),
            ),
          ]),
        ]),
      ),
    );
  }
}

/// Réglages des rappels (profil) : heure, jours, pause examens.
class RemindersSection extends StatelessWidget {
  const RemindersSection({super.key});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    final cfg = Reminders.settingsOf(s.progress);
    final enabled = cfg['enabled'] == true;
    final days = ((cfg['days'] as List?) ?? const []).cast<int>();
    final pause = DateTime.tryParse((cfg['pauseUntil'] ?? '').toString());
    final paused = pause != null && pause.isAfter(DateTime.now());
    Future<void> save(Map<String, dynamic> change) => s.setReminders({...cfg, 'asked': true, ...change});
    const names = {
      'fr': ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
      'en': ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    };
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(t('reminders', l), style: theme.textTheme.titleMedium),
        subtitle: Text(t('reminder_promise', l)),
        value: enabled,
        onChanged: (v) async {
          final granted = !v || await s.reminders.requestPermission();
          await save({'enabled': v && granted});
        },
      ),
      if (enabled) ...[
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.schedule),
          title: Text(t('reminder_time', l)),
          trailing: Text(
            '${cfg['hour'].toString().padLeft(2, '0')}:${cfg['minute'].toString().padLeft(2, '0')}',
            style: theme.textTheme.titleMedium,
          ),
          onTap: () async {
            final picked = await showTimePicker(
              context: context,
              initialTime: TimeOfDay(hour: cfg['hour'] as int, minute: cfg['minute'] as int),
            );
            if (picked != null) await save({'hour': picked.hour, 'minute': picked.minute});
          },
        ),
        Wrap(spacing: 6, children: [
          for (var d = 1; d <= 7; d++)
            FilterChip(
              label: Text(names[l == 'en' ? 'en' : 'fr']![d - 1]),
              selected: days.contains(d),
              onSelected: (v) => save({'days': v ? [...days, d] : days.where((x) => x != d).toList()}),
            ),
        ]),
        const SizedBox(height: 8),
        if (paused)
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.pause_circle_outline),
            title: Text('${t('paused_until', l)} ${pause.day}/${pause.month}'),
            trailing: TextButton(onPressed: () => save({'pauseUntil': null}), child: Text(t('resume', l))),
          )
        else
          Wrap(spacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
            Text(t('exam_pause', l)),
            for (final w in [1, 2, 4])
              ActionChip(
                label: Text('$w ${t('weeks', l)}'),
                onPressed: () => save({'pauseUntil': DateTime.now().add(Duration(days: 7 * w)).toIso8601String()}),
              ),
          ]),
      ],
    ]);
  }
}
