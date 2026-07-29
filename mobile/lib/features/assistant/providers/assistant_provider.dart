import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';

final assistantTasksProvider =
    FutureProvider.autoDispose<List<StudioTask>>((ref) {
  return ref.watch(studioServiceProvider).getTasks(StudioRole.assistant);
});

final assistantIncomeProvider = FutureProvider.autoDispose<Json>((ref) {
  return ref.watch(studioServiceProvider).getAssistantIncomeOverview();
});
