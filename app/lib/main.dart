import 'package:flutter/material.dart';

import 'core/app_state.dart';
import 'ui/home.dart';

const comimaGreen = Color(0xFF1D7A33);
const comimaRed = Color(0xFFD6362B);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final state = AppState();
  await state.init();
  runApp(AppScope(state: state, child: const ComimaApp()));
}

ThemeData _theme(Brightness b) {
  final scheme = ColorScheme.fromSeed(
    seedColor: comimaGreen,
    brightness: b,
    primary: b == Brightness.light ? comimaGreen : const Color(0xFF53B96E),
    secondary: b == Brightness.light ? comimaRed : const Color(0xFFF0655A),
  );
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    scaffoldBackgroundColor: b == Brightness.light ? const Color(0xFFF7F8F6) : const Color(0xFF0F1310),
    cardTheme: const CardThemeData(margin: EdgeInsets.symmetric(vertical: 6)),
  );
}

class ComimaApp extends StatelessWidget {
  const ComimaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'COMIMa',
      debugShowCheckedModeBanner: false,
      theme: _theme(Brightness.light),
      darkTheme: _theme(Brightness.dark),
      home: const HomePage(),
    );
  }
}
