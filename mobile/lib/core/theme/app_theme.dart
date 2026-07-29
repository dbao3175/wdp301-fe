import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const ink = Color(0xFF1C1C18);
  static const inkSoft = Color(0xFF2A2926);
  static const red = Color(0xFFB31D2D);
  static const redBright = Color(0xFFD63843);
  static const redDark = Color(0xFF92001C);
  static const paper = Color(0xFFFCF9F2);
  static const warmWhite = Color(0xFFF7F1E8);
  static const canvas = Color(0xFFF2ECE2);
  static const muted = Color(0xFF746B60);
  static const line = Color(0xFFD8D0C4);
  static const outline = Color(0xFF8E706E);
  static const surfaceHigh = Color(0xFFE5E2DC);
  static const sand = Color(0xFFE9DCC8);
  static const green = Color(0xFF23875F);
  static const amber = Color(0xFFB7791F);
  static const blue = Color(0xFF2D6CDF);
  static const violet = Color(0xFF7C3AED);
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.red,
      brightness: Brightness.light,
      primary: AppColors.red,
      secondary: AppColors.blue,
      surface: AppColors.paper,
      error: AppColors.redDark,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.canvas,
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
            fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -0.4),
        headlineMedium: TextStyle(
            fontSize: 25, fontWeight: FontWeight.w900, letterSpacing: -0.2),
        titleLarge: TextStyle(
            fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.1),
        titleMedium: TextStyle(
            fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 0),
        bodyMedium: TextStyle(fontSize: 14, height: 1.35, letterSpacing: 0),
        labelMedium: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.6),
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: AppColors.canvas,
        foregroundColor: AppColors.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: AppColors.paper,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: AppColors.ink, width: 1.4),
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.paper,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        labelStyle: const TextStyle(
            color: AppColors.muted, fontWeight: FontWeight.w800),
        prefixIconColor: AppColors.muted,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.ink, width: 1.3)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.ink, width: 1.2)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.red, width: 2)),
        errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.redDark)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.red,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(50),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle:
              const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.4),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.ink,
          side: const BorderSide(color: AppColors.ink, width: 1.4),
          minimumSize: const Size.fromHeight(46),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle:
              const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.4),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.paper,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
            side: BorderSide(color: AppColors.ink, width: 2)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.ink,
        contentTextStyle:
            const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
