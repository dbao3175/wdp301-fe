import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/session_storage.dart';

final localeControllerProvider =
    StateNotifierProvider<LocaleController, Locale>((ref) {
  return LocaleController(ref.watch(sessionStorageProvider));
});

class LocaleController extends StateNotifier<Locale> {
  LocaleController(this._storage) : super(const Locale('vi')) {
    _restore();
  }

  final SessionStorage _storage;

  Future<void> _restore() async {
    final saved = await _storage.readLocale();
    if (saved != null && mounted) state = saved;
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    await _storage.saveLocale(locale);
  }
}
