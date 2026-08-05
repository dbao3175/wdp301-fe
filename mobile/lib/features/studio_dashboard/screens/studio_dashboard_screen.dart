import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/studio_dashboard_provider.dart';

class StudioDashboardScreen extends ConsumerWidget {
  const StudioDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final session = ref.watch(authControllerProvider).valueOrNull;
    final overview = ref.watch(studioOverviewProvider);

    return StudioPage(
      onRefresh: () async => ref.invalidate(studioOverviewProvider),
      children: [
        StudioHeaderCard(
          title: l10n.dashboard,
          subtitle: session == null
              ? l10n.appSubtitle
              : '${session.user.name} • ${l10n.roleLabel(session.user.role.apiValue)}',
          icon: Icons.dashboard_customize_rounded,
        ),
        const SizedBox(height: 14),
        const WebWorkspaceBanner(),
        const SizedBox(height: 18),
        overview.when(
          data: (data) => _DashboardBody(data: data),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(studioOverviewProvider)),
        ),
      ],
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody({required this.data});

  final StudioOverview data;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final openTasks = data.tasks
        .where((task) =>
            !['APPROVED', 'COMPLETED'].contains(task.status.toUpperCase()))
        .toList();
    final dueSoon = openTasks
        .where((task) =>
            task.dueAt != null &&
            task.dueAt!.difference(DateTime.now()).inDays <= 3)
        .length;
    final pendingProposals = data.series
        .where((s) => ['PENDING', 'SUBMITTED', 'REVIEW'].contains(s.status.toUpperCase()))
        .length;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
            child: MetricTile(
                label: l10n.series,
                value: data.series.length.toString(),
                icon: Icons.auto_stories_outlined,
                color: AppColors.red)),
        const SizedBox(width: 10),
        Expanded(
            child: MetricTile(
                label: l10n.chapters,
                value: data.chapters.length.toString(),
                icon: Icons.menu_book_outlined,
                color: AppColors.blue)),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(
            child: MetricTile(
                label: l10n.openTasks,
                value: openTasks.length.toString(),
                icon: Icons.task_alt_outlined,
                color: AppColors.violet)),
        const SizedBox(width: 10),
        Expanded(
            child: MetricTile(
                label: l10n.dueSoon,
                value: dueSoon.toString(),
                icon: Icons.timer_outlined,
                color: AppColors.amber)),
      ]),
      const SizedBox(height: 22),
      RoleStatusSummaryCard(
        seriesCount: data.series.length,
        openTasksCount: openTasks.length,
        pendingProposalsCount: pendingProposals,
        pendingVotesCount: 0,
      ),
      const SizedBox(height: 22),
      SectionHeader(title: l10n.todayFocus, subtitle: l10n.recentActivity),
      const SizedBox(height: 10),
      if (openTasks.isEmpty)
        EmptyState(message: l10n.noData, icon: Icons.check_circle_outline)
      else
        ...openTasks.take(4).map((task) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _TaskMini(task: task))),
      const SizedBox(height: 14),
      SectionHeader(title: l10n.recentSeries),
      const SizedBox(height: 10),
      if (data.series.isEmpty)
        EmptyState(message: l10n.noData, icon: Icons.auto_stories_outlined)
      else
        ...data.series.take(3).map((series) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _SeriesMini(series: series))),
    ]);
  }
}

class _TaskMini extends StatelessWidget {
  const _TaskMini({required this.task});

  final StudioTask task;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      child: Row(children: [
        Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
                color: AppColors.violet.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14)),
            child: const Icon(Icons.brush_outlined, color: AppColors.violet)),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(task.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w900)),
          const SizedBox(height: 3),
          Text(
              '${task.seriesTitle} • ${task.chapterLabel} • ${relativeDue(task.dueAt)}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        ])),
        const SizedBox(width: 8),
        StatusPill(status: task.status),
      ]),
    );
  }
}

class _SeriesMini extends StatelessWidget {
  const _SeriesMini({required this.series});

  final StudioSeries series;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      child: Row(children: [
        Container(
            width: 42,
            height: 54,
            alignment: Alignment.center,
            decoration: BoxDecoration(
                color: AppColors.sand, borderRadius: BorderRadius.circular(10)),
            child:
                const Icon(Icons.auto_stories_outlined, color: AppColors.ink)),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(series.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(series.authorName,
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        ])),
        StatusPill(status: series.status),
      ]),
    );
  }
}
