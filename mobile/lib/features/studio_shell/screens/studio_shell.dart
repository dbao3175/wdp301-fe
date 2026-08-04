import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../../auth/providers/auth_provider.dart';

class StudioShell extends ConsumerWidget {
  const StudioShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).valueOrNull;
    if (session == null) {
      return const Scaffold(
          body: Center(child: CircularProgressIndicator(color: AppColors.red)));
    }
    final location = GoRouterState.of(context).uri.path;
    final items = _itemsFor(context, session.user.role);

    return Scaffold(
      appBar: AppBar(
        title: const StudioLogo(compact: true),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(2),
          child: Divider(height: 2, thickness: 2, color: AppColors.ink),
        ),
        actions: [
          IconButton(
              onPressed: () => context.go('/notifications'),
              icon: const Icon(Icons.notifications_none_rounded)),
          Padding(
              padding: const EdgeInsets.only(right: 14),
              child: AvatarBadge(
                  name: session.user.name,
                  imageUrl: session.user.avatar,
                  size: 34)),
        ],
      ),
      body: child,
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          margin: const EdgeInsets.fromLTRB(14, 0, 14, 12),
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: AppColors.paper,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.ink, width: 2),
            boxShadow: const [
              BoxShadow(
                  color: AppColors.ink, offset: Offset(4, 4), blurRadius: 0),
            ],
          ),
          child: Row(
            children: items.map((item) {
              final active = location == item.path ||
                  (item.path != '/app' && location.startsWith(item.path)) ||
                  (item.path == '/library' && location.startsWith('/series/'));
              return Expanded(
                child: _NavButton(
                    item: item,
                    active: active,
                    onTap: () => context.go(item.path)),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  List<_ShellItem> _itemsFor(BuildContext context, StudioRole role) {
    final l10n = AppLocalizations.of(context);
    final library = _ShellItem(
      '/library',
      l10n.isVi ? 'Truyện' : 'Library',
      Icons.auto_stories_outlined,
      Icons.auto_stories_rounded,
    );
    final common = <_ShellItem>[
      _ShellItem('/profile', l10n.profile, Icons.person_outline_rounded,
          Icons.person_rounded),
    ];
    return switch (role) {
      StudioRole.assistant => [
          _ShellItem('/assistant/tasks', l10n.tasks, Icons.task_alt_outlined,
              Icons.task_alt_rounded),
          _ShellItem('/assistant/income', l10n.income, Icons.payments_outlined,
              Icons.payments_rounded),
          library,
          ...common,
        ],
      StudioRole.editor => [
          _ShellItem('/editor/dashboard', l10n.dashboard,
              Icons.dashboard_outlined, Icons.dashboard_rounded),
          _ShellItem('/editor/proposals', l10n.proposals,
              Icons.rate_review_outlined, Icons.rate_review_rounded),
          library,
          _ShellItem('/rankings', l10n.rankings, Icons.trending_up_outlined,
              Icons.trending_up_rounded),
          ...common,
        ],
      StudioRole.boardMember => [
          _ShellItem('/board/voting', l10n.board, Icons.how_to_vote_outlined,
              Icons.how_to_vote_rounded),
          library,
          _ShellItem('/rankings', l10n.rankings, Icons.trending_up_outlined,
              Icons.trending_up_rounded),
          ...common,
        ],
      StudioRole.admin => [
          _ShellItem('/admin', l10n.admin, Icons.admin_panel_settings_outlined,
              Icons.admin_panel_settings_rounded),
          ...common,
        ],
      _ => [
          _ShellItem('/app', l10n.studio, Icons.dashboard_outlined,
              Icons.dashboard_rounded),
          library,
          _ShellItem('/rankings', l10n.rankings, Icons.trending_up_outlined,
              Icons.trending_up_rounded),
          ...common,
        ],
    };
  }
}

class _ShellItem {
  const _ShellItem(this.path, this.label, this.icon, this.activeIcon);

  final String path;
  final String label;
  final IconData icon;
  final IconData activeIcon;
}

class _NavButton extends StatelessWidget {
  const _NavButton(
      {required this.item, required this.active, required this.onTap});

  final _ShellItem item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(6),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
        decoration: BoxDecoration(
          color: active ? AppColors.red : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
              color: active ? AppColors.ink : Colors.transparent, width: 1.4),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(active ? item.activeIcon : item.icon,
              color: active ? Colors.white : AppColors.ink, size: 20),
          const SizedBox(height: 3),
          Text(item.label.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  color: active ? Colors.white : AppColors.muted,
                  fontSize: 8,
                  letterSpacing: 0.2,
                  fontWeight: FontWeight.w900)),
        ]),
      ),
    );
  }
}
