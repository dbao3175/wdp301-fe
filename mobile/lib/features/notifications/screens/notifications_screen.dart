import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';
import '../../../widgets/studio_components.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final notifications = ref.watch(notificationsProvider);
    final session = ref.watch(authControllerProvider).valueOrNull;
    return StudioPage(
      onRefresh: () async => ref.invalidate(notificationsProvider),
      children: [
        StudioHeaderCard(
          title: l10n.inbox,
          subtitle: l10n.accountActive,
          icon: Icons.notifications_rounded,
          trailing: IconButton(
            color: Colors.white,
            onPressed: session == null
                ? null
                : () async {
                    await ref
                        .read(studioServiceProvider)
                        .markAllNotificationsRead(session.user.id);
                    ref.invalidate(notificationsProvider);
                  },
            icon: const Icon(Icons.done_all_rounded),
            tooltip: l10n.markAllRead,
          ),
        ),
        const SizedBox(height: 16),
        notifications.when(
          data: (items) => items.isEmpty
              ? EmptyState(
                  message: l10n.noData, icon: Icons.notifications_none_rounded)
              : Column(
                  children: items
                      .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _NotificationCard(item: item)))
                      .toList()),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(notificationsProvider)),
        ),
      ],
    );
  }
}

class _NotificationCard extends ConsumerWidget {
  const _NotificationCard({required this.item});

  final StudioNotification item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color = item.type == 'ERROR'
        ? AppColors.red
        : item.type == 'WARNING'
            ? AppColors.amber
            : AppColors.blue;
    return StudioCard(
      color: AppColors.paper,
      borderColor: item.isRead ? AppColors.ink : color,
      shadowColor: item.isRead ? AppColors.ink : color,
      onTap: () async {
        await ref.read(studioServiceProvider).markNotificationRead(item.id);
        ref.invalidate(notificationsProvider);
      },
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
                color: color.withValues(alpha: 0.10),
                border: Border.all(color: color, width: 1.3),
                borderRadius: BorderRadius.circular(6)),
            child: Icon(Icons.circle_notifications_outlined, color: color)),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Text(item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: AppColors.ink,
                      fontWeight: FontWeight.w900,
                      fontSize: 15)),
            ),
            if (!item.isRead)
              Container(
                  width: 9,
                  height: 9,
                  decoration: const BoxDecoration(
                      color: AppColors.red, shape: BoxShape.circle)),
          ]),
          const SizedBox(height: 5),
          Text(item.content,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  color: AppColors.muted,
                  height: 1.35,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(compactDate(item.createdAt),
              style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 11,
                  letterSpacing: 0.4,
                  fontWeight: FontWeight.w900)),
        ])),
      ]),
    );
  }
}
