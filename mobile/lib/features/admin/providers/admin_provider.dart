import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';

final adminUsersProvider = FutureProvider.autoDispose<List<StudioUser>>((ref) {
  return ref.watch(studioServiceProvider).getUsers();
});

final adminAuditProvider = FutureProvider.autoDispose<List<Json>>((ref) {
  return ref.watch(studioServiceProvider).getAuditLogs();
});

final adminNotificationsProvider =
    FutureProvider.autoDispose<List<StudioNotification>>((ref) {
  return ref.watch(studioServiceProvider).getAdminNotifications();
});
