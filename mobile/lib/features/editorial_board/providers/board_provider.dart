import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';

final boardSubmissionsProvider =
    FutureProvider.autoDispose<List<BoardSubmission>>((ref) {
  return ref.watch(studioServiceProvider).getBoardSubmissions();
});

final boardPublicationsProvider =
    FutureProvider.autoDispose<List<BoardPublication>>((ref) {
  return ref.watch(studioServiceProvider).getPublications();
});

final boardDirectivesProvider =
    FutureProvider.autoDispose<List<Directive>>((ref) {
  return ref.watch(studioServiceProvider).getDirectives();
});
