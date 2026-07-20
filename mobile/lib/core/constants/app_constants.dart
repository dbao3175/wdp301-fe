import 'package:flutter/foundation.dart';

class AppConstants {
  AppConstants._();

  /// Chrome/web uses localhost, while Android emulator must use 10.0.2.2
  /// to reach the backend on the host.
  /// Override for a physical device or another backend host, for example:
  /// flutter run -d chrome --dart-define=API_BASE_URL=http://192.168.1.10:5000
  static const _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    return kIsWeb ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
  }

  static const tokenKey = 'manga_studio_token';
  static const userKey = 'manga_studio_user';
  static const localeKey = 'manga_studio_locale';
}
