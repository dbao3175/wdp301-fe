import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../models/app_models.dart';
import '../models/reader_models.dart';

final readerServiceProvider = Provider<ReaderService>((ref) {
  return ReaderService(ref.watch(apiClientProvider));
});

class ReaderService {
  const ReaderService(this._api);

  final ApiClient _api;

  Future<List<ReaderSeries>> getCatalogue() async {
    final data = await _api.getList('/api/reader/series');
    return jsonListOf(data)
        .map(ReaderSeries.fromJson)
        .toList(growable: false);
  }

  Future<ReaderSeries> getSeries(String id) async {
    return ReaderSeries.fromJson(await _api.getMap('/api/reader/series/$id'));
  }

  Future<ReaderChapter> getChapter(String id) async {
    return ReaderChapter.fromJson(
      await _api.getMap('/api/reader/chapters/$id'),
    );
  }
}
