import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../providers/assistant_provider.dart';

class AssistantIncomeScreen extends ConsumerWidget {
  const AssistantIncomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final income = ref.watch(assistantIncomeProvider);

    return StudioPage(
      onRefresh: () async => ref.invalidate(assistantIncomeProvider),
      children: [
        StudioHeaderCard(
            title: l10n.income,
            subtitle: 'Approved task earnings and payout snapshot.',
            icon: Icons.payments_rounded),
        const SizedBox(height: 16),
        income.when(
          data: (data) => _IncomeBody(data: data),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(assistantIncomeProvider)),
        ),
      ],
    );
  }
}

class _IncomeBody extends StatelessWidget {
  const _IncomeBody({required this.data});

  final Json data;

  @override
  Widget build(BuildContext context) {
    final total = doubleOf(data['totalEarnings'] ?? data['totalEarning']);
    final tasks = intOf(data['totalCompletedTasks'] ?? data['approvedTasks']);
    final analytics = jsonListOf(data['analytics']);
    final taskRows = jsonListOf(data['tasks']);

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
            child: MetricTile(
                label: 'Approved tasks',
                value: tasks.toString(),
                icon: Icons.verified_outlined,
                color: AppColors.green)),
        const SizedBox(width: 10),
        Expanded(
            child: MetricTile(
                label: 'Total VND',
                value: _money(total),
                icon: Icons.savings_outlined,
                color: AppColors.amber)),
      ]),
      const SizedBox(height: 18),
      SectionHeader(title: 'Monthly analytics'),
      const SizedBox(height: 12),
      analytics.isEmpty
          ? const EmptyState(
              message: 'No approved earnings yet.',
              icon: Icons.bar_chart_rounded)
          : _IncomeChart(rows: analytics),
      const SizedBox(height: 18),
      SectionHeader(title: 'Recent approved work'),
      const SizedBox(height: 12),
      if (taskRows.isEmpty)
        const EmptyState(
            message: 'Approved tasks will appear here.',
            icon: Icons.task_alt_outlined)
      else
        ...taskRows.take(5).map((task) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _IncomeTaskCard(task: task),
            )),
    ]);
  }
}

class _IncomeChart extends StatelessWidget {
  const _IncomeChart({required this.rows});

  final List<Json> rows;

  @override
  Widget build(BuildContext context) {
    final maxAmount = rows.fold<double>(
        0, (max, row) => math.max(max, doubleOf(row['amount'])));
    return StudioCard(
      color: AppColors.warmWhite,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('EARNINGS DASHBOARD',
            style: TextStyle(
                color: AppColors.redDark,
                fontSize: 10,
                letterSpacing: 0.8,
                fontWeight: FontWeight.w900)),
        const SizedBox(height: 14),
        SizedBox(
          height: 128,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: rows.map((row) {
              final amount = doubleOf(row['amount']);
              final heightFactor = maxAmount == 0 ? 0.08 : amount / maxAmount;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Align(
                          alignment: Alignment.bottomCenter,
                          child: FractionallySizedBox(
                            heightFactor: heightFactor.clamp(0.08, 1.0),
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppColors.red,
                                border: Border.all(
                                    color: AppColors.ink, width: 1.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(textOf(row['month'], '--'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 9,
                              fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ]),
    );
  }
}

class _IncomeTaskCard extends StatelessWidget {
  const _IncomeTaskCard({required this.task});

  final Json task;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      color: AppColors.paper,
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.green.withValues(alpha: 0.10),
            border: Border.all(color: AppColors.green, width: 1.3),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Icon(Icons.task_alt_rounded, color: AppColors.green),
        ),
        const SizedBox(width: 12),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(textOf(task['title'], 'Approved Page'),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w900)),
            const SizedBox(height: 3),
            Text(textOf(task['series'], 'Unknown series'),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 12,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 3),
            Text(compactDate(dateOf(task['approvedAt'])),
                style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700)),
          ]),
        ),
        const SizedBox(width: 8),
        Text(_money(doubleOf(task['earnings'])),
            style: const TextStyle(
                color: AppColors.green,
                fontWeight: FontWeight.w900,
                fontSize: 12)),
      ]),
    );
  }
}

String _money(double value) {
  if (value >= 1000000) {
    return '${(value / 1000000).toStringAsFixed(1)}M';
  }
  if (value >= 1000) {
    return '${(value / 1000).toStringAsFixed(0)}K';
  }
  return value.toStringAsFixed(0);
}
