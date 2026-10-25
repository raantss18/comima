import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import 'progress.dart';

/// Rappels d'entraînement pensés pour ne pas déranger les études :
/// - désactivés tant que l'élève ne les active pas ;
/// - au plus un par jour, à l'heure et les jours choisis ;
/// - aucun rappel le jour où l'élève s'est déjà entraîné ;
/// - « pause examens » de 1 à 4 semaines ;
/// - seulement les 7 prochains jours sont planifiés : sans ouverture de l'application pendant
///   une semaine, les rappels s'arrêtent d'eux-mêmes (pas d'insistance).
class Reminders {
  final _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;

  static const defaults = <String, dynamic>{
    'enabled': false,
    'hour': 17,
    'minute': 30,
    'days': [1, 2, 3, 4, 5, 6], // lundi → samedi
    'pauseUntil': null,
  };

  static Map<String, dynamic> settingsOf(ProgressStore p) => {...defaults, ...p.reminders};

  Future<void> _init() async {
    if (_ready) return;
    tzdata.initializeTimeZones();
    await _plugin.initialize(
      settings: const InitializationSettings(android: AndroidInitializationSettings('@mipmap/ic_launcher')),
    );
    _ready = true;
  }

  /// Demande l'autorisation (Android 13+) ; false si refusée.
  Future<bool> requestPermission() async {
    await _init();
    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    return (await android?.requestNotificationsPermission()) ?? true;
  }

  static bool trainedToday(ProgressStore p) {
    final log = p.log;
    if (log.isEmpty) return false;
    final last = DateTime.tryParse(log.last['t'] as String? ?? '');
    final now = DateTime.now();
    return last != null && last.year == now.year && last.month == now.month && last.day == now.day;
  }

  /// Replanifie les 7 prochains jours (à l'ouverture et après chaque série).
  Future<void> reschedule(ProgressStore p, String lang) async {
    try {
      await _init();
      await _plugin.cancelAll();
      final cfg = settingsOf(p);
      if (cfg['enabled'] != true) return;
      final days = ((cfg['days'] as List?) ?? const []).cast<int>();
      final pause = DateTime.tryParse((cfg['pauseUntil'] ?? '').toString());
      final now = DateTime.now();
      final name = (p.current?['name'] ?? '').toString();
      for (var d = 0; d < 7; d++) {
        final day = DateTime(now.year, now.month, now.day + d, cfg['hour'] as int, cfg['minute'] as int);
        if (!day.isAfter(now)) continue;
        if (!days.contains(day.weekday)) continue;
        if (pause != null && day.isBefore(pause)) continue;
        if (d == 0 && trainedToday(p)) continue;
        final (title, body) = _message(day.day, lang, name);
        await _plugin.zonedSchedule(
          id: d,
          scheduledDate: tz.TZDateTime.from(day.toUtc(), tz.UTC),
          title: title,
          body: body,
          androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
          notificationDetails: const NotificationDetails(
            android: AndroidNotificationDetails(
              'entrainement',
              'Rappels d\'entraînement',
              channelDescription: 'Un rappel par jour au plus, à l\'heure choisie',
              importance: Importance.defaultImportance,
              priority: Priority.defaultPriority,
            ),
          ),
        );
      }
    } catch (_) {
      // Les rappels sont un confort : une erreur ne doit jamais bloquer l'application.
    }
  }

  static (String, String) _message(int seed, String lang, String name) {
    const fr = [
      ('5 minutes de maths ?', 'Une étape courte suffit pour garder le rythme.'),
      ('Ton cerveau a faim', 'Une petite notion avant de te reposer ?'),
      ('Un défi t\'attend', 'Trois questions, et c\'est fait pour aujourd\'hui.'),
      ('Petit à petit…', 'Chaque jour un peu : c\'est comme ça qu\'on progresse aux olympiades.'),
    ];
    const en = [
      ('5 minutes of maths?', 'One short step is enough to keep the pace.'),
      ('Your brain is hungry', 'A small topic before you rest?'),
      ('A challenge is waiting', 'Three questions and you are done for today.'),
      ('Little by little…', 'A bit every day: that is how olympiad skills grow.'),
    ];
    final (t, b) = (lang == 'en' ? en : fr)[seed % 4];
    return (name.isEmpty ? t : '$t, $name', b);
  }
}
