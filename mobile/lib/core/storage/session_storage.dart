import 'dart:convert';
import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../models/app_models.dart';
import '../constants/app_constants.dart';

final sessionStorageProvider = Provider<SessionStorage>((ref) {
  return SessionStorage(const FlutterSecureStorage());
});

class SessionStorage {
  const SessionStorage(this._storage);

  final FlutterSecureStorage _storage;

  Future<StudioSession?> read() async {
    final token = await _storage.read(key: AppConstants.tokenKey);
    final rawUser = await _storage.read(key: AppConstants.userKey);
    if (token == null || rawUser == null) return null;

    try {
      return StudioSession(
        token: token,
        user: StudioUser.fromJson(jsonDecode(rawUser) as Json),
      );
    } catch (_) {
      await clearSession();
      return null;
    }
  }

  Future<void> save(StudioSession session) async {
    await _storage.write(key: AppConstants.tokenKey, value: session.token);
    await _storage.write(
        key: AppConstants.userKey, value: jsonEncode(session.user.toJson()));
  }

  Future<String?> token() => _storage.read(key: AppConstants.tokenKey);

  Future<void> clearSession() async {
    await _storage.delete(key: AppConstants.tokenKey);
    await _storage.delete(key: AppConstants.userKey);
  }

  Future<Locale?> readLocale() async {
    final code = await _storage.read(key: AppConstants.localeKey);
    if (code == null || code.isEmpty) return null;
    return Locale(code);
  }

  Future<void> saveLocale(Locale locale) {
    return _storage.write(
        key: AppConstants.localeKey, value: locale.languageCode);
  }
}
