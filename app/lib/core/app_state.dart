import 'dart:ui';

import 'package:flutter/widgets.dart';

import 'content.dart';
import 'progress.dart';
import 'updater.dart';

class AppState extends ChangeNotifier {
  final content = ContentStore();
  final progress = ProgressStore();
  final updater = Updater();

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

  Future<int> record(Map<String, dynamic> q, bool ok) async {
    final gain = await progress.record(q, ok);
    notifyListeners();
    return gain;
  }

  Future<void> addProfile(String name) async {
    await progress.addProfile(name);
    notifyListeners();
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
