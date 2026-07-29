import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../providers/rankings_provider.dart';

class RankingsScreen extends ConsumerWidget {
  const RankingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final cycle = ref.watch(rankingCycleProvider);
    final rankings = ref.watch(rankingsProvider);
    return StudioPage(
      onRefresh: () async => ref.invalidate(rankingsProvider),
      children: [
        StudioHeaderCard(
            title: l10n.rankings,
            subtitle: l10n.readerSignals,
            icon: Icons.trending_up_rounded),
        const SizedBox(height: 16),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'weekly', label: Text('Weekly')),
            ButtonSegment(value: 'monthly', label: Text('Monthly'))
          ],
          selected: {cycle},
          onSelectionChanged: (value) =>
              ref.read(rankingCycleProvider.notifier).state = value.first,
        ),
        const SizedBox(height: 16),
        rankings.when(
          data: (items) => items.isEmpty
              ? EmptyState(
                  message: l10n.noData, icon: Icons.trending_up_outlined)
              : Column(
                  children: items
                      .asMap()
                      .entries
                      .map((entry) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _RankingCard(
                              index: entry.key, item: entry.value)))
                      .toList()),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error, onRetry: () => ref.invalidate(rankingsProvider)),
        ),
      ],
    );
  }
}

class _RankingCard extends StatelessWidget {
  const _RankingCard({required this.index, required this.item});

  final int index;
  final RankingEntry item;

  @override
  Widget build(BuildContext context) {
    final rank = item.rank > 0 ? item.rank : index + 1;
    return StudioCard(
      child: Row(children: [
        Container(
            width: 42,
            height: 42,
            alignment: Alignment.center,
            decoration: BoxDecoration(
                color: rank <= 3 ? AppColors.red : AppColors.ink,
                borderRadius: BorderRadius.circular(14)),
            child: Text('#$rank',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w900))),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(item.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w900)),
          Text('${item.votes} votes • score ${item.score.toStringAsFixed(1)}',
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        ])),
        StatusPill(status: item.status),
      ]),
    );
  }
}
