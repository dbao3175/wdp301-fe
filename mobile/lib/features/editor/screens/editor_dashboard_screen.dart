import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../providers/editor_provider.dart';

class EditorDashboardScreen extends ConsumerWidget {
  const EditorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final dashboard = ref.watch(editorDashboardProvider);
    final series = ref.watch(editorSeriesProvider);

    return StudioPage(
      onRefresh: () async {
        ref.invalidate(editorDashboardProvider);
        ref.invalidate(editorSeriesProvider);
      },
      children: [
        StudioHeaderCard(
            title: l10n.editor,
            subtitle: l10n.production,
            icon: Icons.edit_note_rounded),
        const SizedBox(height: 14),
        const WebWorkspaceBanner(compact: true),
        const SizedBox(height: 16),
        dashboard.when(
          data: (data) => Row(children: [
            Expanded(
                child: MetricTile(
                    label: l10n.proposals,
                    value:
                        intOf(data['pendingProposals'] ?? data['proposalCount'])
                            .toString(),
                    icon: Icons.rate_review_outlined,
                    color: AppColors.violet)),
            const SizedBox(width: 10),
            Expanded(
                child: MetricTile(
                    label: l10n.series,
                    value: intOf(data['activeSeries'] ?? data['seriesCount'])
                        .toString(),
                    icon: Icons.auto_stories_outlined,
                    color: AppColors.red)),
          ]),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(editorDashboardProvider)),
        ),
        const SizedBox(height: 20),
        SectionHeader(title: l10n.recentSeries),
        const SizedBox(height: 10),
        series.when(
          data: (items) => items.isEmpty
              ? EmptyState(message: l10n.noData)
              : Column(
                  children: items
                      .take(5)
                      .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _EditorSeriesCard(series: item)))
                      .toList()),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(editorSeriesProvider)),
        ),
      ],
    );
  }
}

class _EditorSeriesCard extends StatelessWidget {
  const _EditorSeriesCard({required this.series});

  final StudioSeries series;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      child: Row(children: [
        const Icon(Icons.library_books_outlined, color: AppColors.red),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(series.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w900)),
          Text(series.authorName,
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        ])),
        StatusPill(status: series.status),
      ]),
    );
  }
}
