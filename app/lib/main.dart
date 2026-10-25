import 'package:flutter/material.dart';

import 'core/app_state.dart';
import 'ui/shell.dart';
import 'ui/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final state = AppState();
  await state.init();
  runApp(AppScope(state: state, child: const ComimaApp()));
}

class ComimaApp extends StatelessWidget {
  const ComimaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'COMIMa',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      home: const HomePage(),
    );
  }
}
