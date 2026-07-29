import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/role_home.dart';
import '../../../core/theme/app_theme.dart';
import '../../../widgets/studio_components.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    auth.whenOrNull(
      data: (session) => _go(
          context,
          session == null
              ? '/auth/login'
              : RoleHome.pathFor(session.user.role)),
      error: (_, __) => _go(context, '/auth/login'),
    );

    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            StudioLogo(),
            SizedBox(height: 22),
            CircularProgressIndicator(color: AppColors.red),
          ],
        ),
      ),
    );
  }

  void _go(BuildContext context, String location) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.mounted) context.go(location);
    });
  }
}
