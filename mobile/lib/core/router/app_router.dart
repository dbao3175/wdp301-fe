import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/admin/screens/admin_dashboard_screen.dart';
import '../../features/assistant/screens/assistant_income_screen.dart';
import '../../features/assistant/screens/assistant_tasks_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/editor/screens/editor_dashboard_screen.dart';
import '../../features/editor/screens/editor_proposals_screen.dart';
import '../../features/editorial_board/screens/board_voting_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/proposals/screens/proposal_preview_screen.dart';
import '../../features/rankings/screens/rankings_screen.dart';
import '../../features/reader/screens/chapter_reader_screen.dart';
import '../../features/reader/screens/reader_catalogue_screen.dart';
import '../../features/reader/screens/reader_series_screen.dart';
import '../../features/studio_dashboard/screens/studio_dashboard_screen.dart';
import '../../features/studio_shell/screens/studio_shell.dart';
import '../../models/app_models.dart';
import 'role_home.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/auth/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
          path: '/auth/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/reader/:chapterId',
        builder: (_, state) => ChapterReaderScreen(
          chapterId: state.pathParameters['chapterId']!,
        ),
      ),
      GoRoute(
        path: '/proposal/:proposalId/preview',
        builder: (_, state) => ProposalPreviewScreen(
          proposalId: state.pathParameters['proposalId']!,
        ),
      ),
      ShellRoute(
        builder: (context, state, child) => StudioShell(child: child),
        routes: [
          GoRoute(
              path: '/app', builder: (_, __) => const StudioDashboardScreen()),
          GoRoute(
              path: '/library',
              builder: (_, __) => const ReaderCatalogueScreen()),
          GoRoute(
            path: '/series/:seriesId',
            builder: (_, state) => ReaderSeriesScreen(
              seriesId: state.pathParameters['seriesId']!,
            ),
          ),
          GoRoute(
              path: '/assistant/tasks',
              builder: (_, __) => const AssistantTasksScreen()),
          GoRoute(
              path: '/assistant/income',
              builder: (_, __) => const AssistantIncomeScreen()),
          GoRoute(
              path: '/editor/dashboard',
              builder: (_, __) => const EditorDashboardScreen()),
          GoRoute(
              path: '/editor/proposals',
              builder: (_, __) => const EditorProposalsScreen()),
          GoRoute(
              path: '/board/voting',
              builder: (_, __) => const BoardVotingScreen()),
          GoRoute(
              path: '/rankings', builder: (_, __) => const RankingsScreen()),
          GoRoute(
              path: '/notifications',
              builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(
              path: '/admin', builder: (_, __) => const AdminDashboardScreen()),
        ],
      ),
    ],
    errorBuilder: (context, state) => _RouteErrorScreen(path: state.uri.path),
  );
});

class _RouteErrorScreen extends StatelessWidget {
  const _RouteErrorScreen({required this.path});

  final String path;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Quay lại',
          onPressed: () => _goBack(context),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        title: const Text('Không tìm thấy trang'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.link_off_rounded, size: 56),
              const SizedBox(height: 16),
              const Text(
                'Liên kết này không hợp lệ hoặc dữ liệu không còn tồn tại.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(path, textAlign: TextAlign.center),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: () => _goBack(context),
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('QUAY LẠI'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/splash');
    }
  }
}

class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(this._ref) {
    _ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;

  String? redirect(BuildContext context, GoRouterState state) {
    final location = state.uri.path;
    final auth = _ref.read(authControllerProvider);
    final session = auth.valueOrNull;
    final public = location == '/splash' || location.startsWith('/auth/');

    if (auth.isLoading) return location == '/splash' ? null : '/splash';
    if (session == null) return public ? null : '/auth/login';
    if (public) return RoleHome.pathFor(session.user.role);
    if (!_allowed(session.user.role, location)) {
      return RoleHome.pathFor(session.user.role);
    }
    return null;
  }

  bool _allowed(StudioRole role, String location) {
    if (location == '/notifications' ||
        location == '/profile' ||
        location == '/app' ||
        location == '/library' ||
        location.startsWith('/series/') ||
        location.startsWith('/reader/')) {
      return true;
    }
    if (location.startsWith('/proposal/')) {
      return role == StudioRole.admin ||
          role == StudioRole.editor ||
          role == StudioRole.boardMember ||
          role == StudioRole.mangaka;
    }
    if (role == StudioRole.admin) return true;
    if (role == StudioRole.assistant) return location.startsWith('/assistant');
    if (role == StudioRole.editor) {
      return location.startsWith('/editor') || location == '/rankings';
    }
    if (role == StudioRole.boardMember) {
      return location.startsWith('/board') || location == '/rankings';
    }
    if (role == StudioRole.mangaka) return location == '/rankings';
    return false;
  }
}
