import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';

final rankingCycleProvider = StateProvider<String>((ref) => 'weekly');

final rankingsProvider = FutureProvider.autoDispose<List<RankingEntry>>((ref) {
  final cycle = ref.watch(rankingCycleProvider);
  return ref.watch(studioServiceProvider).getRankings(type: cycle);
});
