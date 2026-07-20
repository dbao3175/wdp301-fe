import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/locale/locale_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../widgets/studio_components.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final locale = ref.watch(localeControllerProvider);
    final session = ref.watch(authControllerProvider).valueOrNull;
    if (session == null) {
      return const Scaffold(
          body: Center(child: CircularProgressIndicator(color: AppColors.red)));
    }

    return StudioPage(children: [
      StudioHeaderCard(
          title: l10n.profile,
          subtitle: l10n.accountActive,
          icon: Icons.person_rounded),
      const SizedBox(height: 16),
      StudioCard(
        child: Row(children: [
          AvatarBadge(
              name: session.user.name, imageUrl: session.user.avatar, size: 58),
          const SizedBox(width: 14),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(session.user.name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w900, fontSize: 18)),
                Text(session.user.email,
                    style: const TextStyle(color: AppColors.muted)),
                const SizedBox(height: 8),
                StatusPill(status: session.user.role.apiValue),
              ])),
        ]),
      ),
      const SizedBox(height: 16),
      SectionHeader(title: l10n.language),
      const SizedBox(height: 10),
      StudioCard(
        child: SegmentedButton<Locale>(
          segments: [
            ButtonSegment(
                value: const Locale('vi'), label: Text(l10n.vietnamese)),
            ButtonSegment(value: const Locale('en'), label: Text(l10n.english))
          ],
          selected: {locale},
          onSelectionChanged: (value) => ref
              .read(localeControllerProvider.notifier)
              .setLocale(value.first),
        ),
      ),
      const SizedBox(height: 16),
      SectionHeader(title: l10n.apiEndpoint),
      const SizedBox(height: 10),
      StudioCard(
          child: Text(AppConstants.apiBaseUrl,
              style: TextStyle(
                  color: AppColors.muted, fontWeight: FontWeight.w700))),
      const SizedBox(height: 18),
      FilledButton.icon(
        style: FilledButton.styleFrom(backgroundColor: AppColors.ink),
        onPressed: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go('/auth/login');
        },
        icon: const Icon(Icons.logout_rounded),
        label: Text(l10n.logout),
      ),
    ]);
  }
}
