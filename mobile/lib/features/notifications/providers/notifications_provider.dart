import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';
import '../../auth/providers/auth_provider.dart';

final notificationsProvider =
    FutureProvider.autoDispose<List<StudioNotification>>((ref) {
  final session = ref.watch(authControllerProvider).valueOrNull;
  if (session == null) return Future.value(const []);
  return ref.watch(studioServiceProvider).getNotifications(session.user.id);
});
