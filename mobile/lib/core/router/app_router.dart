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
import '../../features/editorial_board/screens/board_publications_screen.dart';
import '../../features/editorial_board/screens/board_voting_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/rankings/screens/rankings_screen.dart';
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
      ShellRoute(
        builder: (context, state, child) => StudioShell(child: child),
        routes: [
          GoRoute(
              path: '/app', builder: (_, __) => const StudioDashboardScreen()),
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
              path: '/board/publications',
              builder: (_, __) => const BoardPublicationsScreen()),
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
    errorBuilder: (context, state) =>
        Scaffold(body: Center(child: Text('Route not found: ${state.uri}'))),
  );
});

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
        location == '/app') {
      return true;
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
