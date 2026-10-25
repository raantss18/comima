import 'package:flutter/material.dart';

/// Identité COMIMa : vert et rouge du club, fond clair ou sombre, police du site (Hanken
/// Grotesk), formes arrondies et cartes sans ombre portée, dans l'esprit de Tontolo.
const comimaGreen = Color(0xFF1D7A33);
const comimaRed = Color(0xFFD6362B);

ThemeData buildTheme(Brightness b) {
  final light = b == Brightness.light;
  final scheme = ColorScheme.fromSeed(
    seedColor: comimaGreen,
    brightness: b,
    primary: light ? comimaGreen : const Color(0xFF53B96E),
    secondary: light ? comimaRed : const Color(0xFFF0655A),
    surface: light ? const Color(0xFFF7F8F6) : const Color(0xFF0F1310),
  );
  return ThemeData(
    useMaterial3: true,
    fontFamily: 'HankenGrotesk',
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surface,
    materialTapTargetSize: MaterialTapTargetSize.padded, // cibles ≥ 48 dp
    appBarTheme: AppBarTheme(backgroundColor: scheme.surface, surfaceTintColor: Colors.transparent, scrolledUnderElevation: 0),
    cardTheme: CardThemeData(
      elevation: 0,
      margin: const EdgeInsets.symmetric(vertical: 5),
      color: scheme.surfaceContainerHigh.withValues(alpha: light ? 0.55 : 0.7),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
    ),
    chipTheme: ChipThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(minimumSize: const Size(48, 48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24))),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(minimumSize: const Size(48, 48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24))),
    ),
    snackBarTheme: SnackBarThemeData(behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
    dialogTheme: DialogThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28))),
  );
}

/// Un thème mathématique = une couleur et une icône, pour reconnaître d'un coup d'œil de quoi
/// parle une notion.
class ThemeStyle {
  const ThemeStyle(this.color, this.icon);
  final Color color;
  final IconData icon;
}

const themeStyles = <String, ThemeStyle>{
  'algèbre': ThemeStyle(Color(0xFF3F51B5), Icons.functions),
  'géométrie': ThemeStyle(Color(0xFF00897B), Icons.change_history),
  'arithmétique': ThemeStyle(Color(0xFFE64A19), Icons.tag),
  'combinatoire': ThemeStyle(Color(0xFF8E24AA), Icons.grid_view),
  'analyse': ThemeStyle(Color(0xFFF9A825), Icons.show_chart),
  'informatique': ThemeStyle(Color(0xFF546E7A), Icons.code),
};

ThemeStyle styleOf(String theme) => themeStyles[theme] ?? const ThemeStyle(comimaGreen, Icons.school);

/// Couleur lisible sur le fond courant (les teintes sombres sont éclaircies en mode sombre).
Color readable(BuildContext context, Color c) {
  if (Theme.of(context).brightness == Brightness.light) return c;
  return Color.lerp(c, Colors.white, 0.35)!;
}
