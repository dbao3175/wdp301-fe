import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';

final editorDashboardProvider = FutureProvider.autoDispose<Json>((ref) {
  return ref.watch(studioServiceProvider).getEditorDashboard();
});

final editorSeriesProvider =
    FutureProvider.autoDispose<List<StudioSeries>>((ref) {
  return ref.watch(studioServiceProvider).getEditorSeries();
});

final editorProposalsProvider =
    FutureProvider.autoDispose<List<SeriesProposal>>((ref) {
  return ref.watch(studioServiceProvider).getProposals();
});
