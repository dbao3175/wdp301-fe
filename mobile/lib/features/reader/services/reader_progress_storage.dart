import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/reader_models.dart';

final readerProgressStorageProvider = Provider<ReaderProgressStorage>((ref) {
  return ReaderProgressStorage(const FlutterSecureStorage());
});

class ReaderProgressStorage {
  const ReaderProgressStorage(this._storage);

  final FlutterSecureStorage _storage;

  String _pageKey(String chapterId) => 'reader_page_$chapterId';
  String _seriesKey(String seriesId) => 'reader_series_$seriesId';

  Future<int> readPage(String chapterId) async {
    return int.tryParse(await _storage.read(key: _pageKey(chapterId)) ?? '') ??
        0;
  }

  Future<ReaderResume?> readResume(String seriesId) async {
    final raw = await _storage.read(key: _seriesKey(seriesId));
    if (raw == null || raw.isEmpty) return null;
    try {
      final value = jsonDecode(raw) as Map<String, dynamic>;
      return ReaderResume(
        chapterId: value['chapterId']?.toString() ?? '',
        pageIndex:
            value['pageIndex'] is num ? (value['pageIndex'] as num).toInt() : 0,
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> save({
    required String seriesId,
    required String chapterId,
    required int pageIndex,
  }) async {
    await Future.wait([
      _storage.write(key: _pageKey(chapterId), value: '$pageIndex'),
      _storage.write(
        key: _seriesKey(seriesId),
        value: jsonEncode({'chapterId': chapterId, 'pageIndex': pageIndex}),
      ),
    ]);
  }
}
