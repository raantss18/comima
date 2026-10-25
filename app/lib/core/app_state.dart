import 'dart:ui';

import 'package:flutter/widgets.dart';

import 'content.dart';
import 'progress.dart';
import 'reminders.dart';
import 'updater.dart';

class AppState extends ChangeNotifier {
  final content = ContentStore();
  final progress = ProgressStore();
  final updater = Updater();
  final reminders = Reminders();

  String get lang => progress.lang ?? (PlatformDispatcher.instance.locale.languageCode == 'en' ? 'en' : 'fr');

  set lang(String v) {
    progress.lang = v;
    notifyListeners();
  }

  Future<void> init() async {
    await Future.wait([content.load(), progress.load(), updater.init()]);
  }

  Future<UpdateResult> updateContent() async {
    final r = await content.update();
    notifyListeners();
    return r;
  }

  Future<int> record(Map<String, dynamic> q, bool ok, {String? notion, String? theme, int? ms}) async {
    final gain = await progress.record(q, ok, notion: notion, theme: theme, ms: ms);
    if (Reminders.trainedToday(progress)) reminders.reschedule(progress, lang); // pas de rappel aujourd'hui
    notifyListeners();
    return gain;
  }

  Future<void> setReminders(Map<String, dynamic> r) async {
    await progress.setReminders(r);
    await reminders.reschedule(progress, lang);
    notifyListeners();
  }

  Future<void> addProfile(Map<String, dynamic> info) async {
    await progress.addProfile(info);
    notifyListeners();
  }

  Future<void> updateProfile(String id, Map<String, dynamic> info) async {
    await progress.updateProfile(id, info);
    notifyListeners();
  }

  Future<bool> deleteProfile(String id) async {
    final ok = await progress.deleteProfile(id);
    notifyListeners();
    return ok;
  }

  Future<void> selectProfile(String id) async {
    await progress.select(id);
    notifyListeners();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
