import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/reader_models.dart';
import '../services/reader_progress_storage.dart';
import '../services/reader_service.dart';

final readerCatalogueProvider = FutureProvider<List<ReaderSeries>>((ref) {
  return ref.watch(readerServiceProvider).getCatalogue();
});

final readerSeriesProvider =
    FutureProvider.family<ReaderSeries, String>((ref, id) {
  return ref.watch(readerServiceProvider).getSeries(id);
});

final readerChapterProvider =
    FutureProvider.family<ReaderChapter, String>((ref, id) {
  return ref.watch(readerServiceProvider).getChapter(id);
});

final readerResumeProvider =
    FutureProvider.family<ReaderResume?, String>((ref, seriesId) {
  return ref.watch(readerProgressStorageProvider).readResume(seriesId);
});
