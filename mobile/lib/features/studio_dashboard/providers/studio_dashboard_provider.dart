import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';
import '../../auth/providers/auth_provider.dart';

final studioOverviewProvider =
    FutureProvider.autoDispose<StudioOverview>((ref) async {
  final session = ref.watch(authControllerProvider).valueOrNull;
  final service = ref.watch(studioServiceProvider);
  final role = session?.user.role ?? StudioRole.unknown;
  final results = await Future.wait<dynamic>([
    service.getSeries(),
    service.getChapters(),
    service.getTasks(role),
    role.canReviewPublication
        ? service.getPublications()
        : Future.value(<BoardPublication>[]),
    role == StudioRole.editor || role == StudioRole.admin
        ? service.getProposals()
        : Future.value(<SeriesProposal>[]),
  ]);
  return StudioOverview(
    series: results[0] as List<StudioSeries>,
    chapters: results[1] as List<StudioChapter>,
    tasks: results[2] as List<StudioTask>,
    publications: results[3] as List<BoardPublication>,
    proposals: results[4] as List<SeriesProposal>,
  );
});
