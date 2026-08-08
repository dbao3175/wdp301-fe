import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';

final proposalPreviewProvider =
    FutureProvider.autoDispose.family<SeriesProposal, String>((ref, id) {
  return ref.watch(studioServiceProvider).getProposalById(id);
});
