import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';
import '../../../widgets/studio_components.dart';
import '../../studio_dashboard/providers/studio_dashboard_provider.dart';
import '../providers/assistant_provider.dart';

class AssistantTasksScreen extends ConsumerStatefulWidget {
  const AssistantTasksScreen({super.key});

  @override
  ConsumerState<AssistantTasksScreen> createState() =>
      _AssistantTasksScreenState();
}

class _AssistantTasksScreenState extends ConsumerState<AssistantTasksScreen> {
  bool _approved = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tasks = ref.watch(assistantTasksProvider);

    return StudioPage(
      onRefresh: () async => ref.invalidate(assistantTasksProvider),
      children: [
        StudioHeaderCard(
            title: l10n.tasks,
            subtitle: 'Assigned workspace for assistant production.',
            icon: Icons.task_alt_rounded),
        const SizedBox(height: 16),
        SegmentedButton<bool>(
          segments: [
            ButtonSegment(value: false, label: Text(l10n.openTasks)),
            ButtonSegment(
                value: true, label: Text(l10n.statusLabel('APPROVED')))
          ],
          selected: {_approved},
          onSelectionChanged: (value) =>
              setState(() => _approved = value.first),
        ),
        const SizedBox(height: 16),
        tasks.when(
          data: (items) {
            final filtered = items
                .where((task) => _approved
                    ? task.status.toUpperCase() == 'APPROVED'
                    : task.status.toUpperCase() != 'APPROVED')
                .toList();
            if (filtered.isEmpty) {
              return EmptyState(
                  message: l10n.noData, icon: Icons.task_alt_outlined);
            }
            return Column(
                children: filtered
                    .map((task) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _AssistantTaskCard(task: task)))
                    .toList());
          },
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(assistantTasksProvider)),
        ),
      ],
    );
  }
}

class _AssistantTaskCard extends ConsumerWidget {
  const _AssistantTaskCard({required this.task});

  final StudioTask task;

  bool get _canSubmit => !['SUBMITTED', 'APPROVED', 'COMPLETED']
      .contains(task.status.toUpperCase());

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    return StudioCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.draw_outlined, color: AppColors.red)),
          const SizedBox(width: 12),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(task.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w900, fontSize: 16)),
                const SizedBox(height: 4),
                Text('${task.seriesTitle} • ${task.chapterLabel}',
                    style:
                        const TextStyle(color: AppColors.muted, fontSize: 12)),
              ])),
          StatusPill(status: task.status),
        ]),
        if (task.description.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(task.description, maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
              value: task.progress / 100,
              minHeight: 8,
              color: AppColors.green,
              backgroundColor: AppColors.line),
        ),
        const SizedBox(height: 12),
        Row(children: [
          const Icon(Icons.schedule, size: 16, color: AppColors.muted),
          const SizedBox(width: 5),
          Text(relativeDue(task.dueAt),
              style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
          const Spacer(),
          if (_canSubmit)
            FilledButton.icon(
                onPressed: () => _submit(context, ref),
                icon: const Icon(Icons.send_rounded),
                label: Text(l10n.submitTask)),
        ]),
      ]),
    );
  }

  Future<void> _submit(BuildContext context, WidgetRef ref) async {
    final l10n = AppLocalizations.of(context);
    try {
      await ref.read(studioServiceProvider).submitTask(task.id);
      ref.invalidate(assistantTasksProvider);
      ref.invalidate(studioOverviewProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(l10n.taskSubmitted)));
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(readableApiError(error))));
      }
    }
  }
}
