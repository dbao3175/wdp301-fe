import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../providers/admin_provider.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final users = ref.watch(adminUsersProvider);
    final audits = ref.watch(adminAuditProvider);
    return StudioPage(
      onRefresh: () async {
        ref.invalidate(adminUsersProvider);
        ref.invalidate(adminAuditProvider);
      },
      children: [
        StudioHeaderCard(
            title: l10n.adminConsole,
            subtitle: 'Users, roles and audit signal.',
            icon: Icons.admin_panel_settings_rounded),
        const SizedBox(height: 16),
        users.when(
          data: (items) => _UserSummary(users: items),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error, onRetry: () => ref.invalidate(adminUsersProvider)),
        ),
        const SizedBox(height: 20),
        SectionHeader(title: 'Audit logs'),
        const SizedBox(height: 10),
        audits.when(
          data: (items) => items.isEmpty
              ? EmptyState(
                  message: l10n.noData, icon: Icons.receipt_long_outlined)
              : Column(
                  children: items
                      .take(6)
                      .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _AuditCard(item: item)))
                      .toList()),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error, onRetry: () => ref.invalidate(adminAuditProvider)),
        ),
      ],
    );
  }
}

class _UserSummary extends StatelessWidget {
  const _UserSummary({required this.users});

  final List<StudioUser> users;

  @override
  Widget build(BuildContext context) {
    int count(StudioRole role) =>
        users.where((user) => user.role == role).length;
    return Column(children: [
      Row(children: [
        Expanded(
            child: MetricTile(
                label: 'Users',
                value: users.length.toString(),
                icon: Icons.people_alt_outlined,
                color: AppColors.blue)),
        const SizedBox(width: 10),
        Expanded(
            child: MetricTile(
                label: 'Editors',
                value: count(StudioRole.editor).toString(),
                icon: Icons.edit_note_outlined,
                color: AppColors.violet)),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(
            child: MetricTile(
                label: 'Assistants',
                value: count(StudioRole.assistant).toString(),
                icon: Icons.brush_outlined,
                color: AppColors.amber)),
        const SizedBox(width: 10),
        Expanded(
            child: MetricTile(
                label: 'Board',
                value: count(StudioRole.boardMember).toString(),
                icon: Icons.how_to_vote_outlined,
                color: AppColors.red)),
      ]),
    ]);
  }
}

class _AuditCard extends StatelessWidget {
  const _AuditCard({required this.item});

  final Json item;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      child: Row(children: [
        const Icon(Icons.receipt_long_outlined, color: AppColors.muted),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(textOf(item['action'], 'Action'),
              style: const TextStyle(fontWeight: FontWeight.w900)),
          Text(textOf(item['target'] ?? item['details'], 'No details'),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        ])),
      ]),
    );
  }
}
