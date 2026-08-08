import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../../auth/providers/auth_provider.dart';
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).valueOrNull;
    final token = session?.token;

    final desc = task.description;
    String cleanDesc = desc;
    String? embeddedImageUrl;

    final match = RegExp(r'^\[IMAGE_URL:([^\]]+)\]').firstMatch(desc);
    if (match != null) {
      final imgPath = match.group(1)!;
      embeddedImageUrl = imgPath.startsWith('http')
          ? imgPath
          : '${AppConstants.apiBaseUrl}/${imgPath.startsWith('/') ? imgPath.substring(1) : imgPath}';
      cleanDesc = desc.replaceFirst(RegExp(r'^\[IMAGE_URL:[^\]]+\]\s*'), '');
    }

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
        if (cleanDesc.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(cleanDesc, style: const TextStyle(height: 1.4)),
        ],
        if (embeddedImageUrl != null) ...[
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.line, width: 1.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Image.network(
                embeddedImageUrl,
                headers: token != null ? {'Authorization': 'Bearer $token'} : null,
                width: double.infinity,
                height: 180,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 100,
                  color: AppColors.surfaceHigh,
                  alignment: Alignment.center,
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 32),
                      SizedBox(height: 4),
                      Text('Không thể tải hình ảnh minh họa', style: TextStyle(color: AppColors.muted, fontSize: 11)),
                    ],
                  ),
                ),
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    height: 180,
                    color: AppColors.surfaceHigh,
                    alignment: Alignment.center,
                    child: const Center(
                      child: CircularProgressIndicator(color: AppColors.red),
                    ),
                  );
                },
              ),
            ),
          ),
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
        ]),
      ]),
    );
  }
}
