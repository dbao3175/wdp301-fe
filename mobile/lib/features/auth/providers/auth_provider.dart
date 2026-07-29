import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';

final authControllerProvider =
    AsyncNotifierProvider<AuthController, StudioSession?>(AuthController.new);

class AuthController extends AsyncNotifier<StudioSession?> {
  @override
  Future<StudioSession?> build() {
    return ref.read(authServiceProvider).restore();
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(authServiceProvider).login(email, password));
  }

  Future<void> register(
      {required String name,
      required String email,
      required String password,
      required StudioRole role,
      required String verificationCode}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authServiceProvider).register(
            name: name,
            email: email,
            password: password,
            role: role,
            verificationCode: verificationCode,
          ),
    );
  }

  Future<void> sendVerificationCode(String email) {
    return ref.read(authServiceProvider).sendVerificationCode(email);
  }

  Future<void> logout() async {
    await ref.read(authServiceProvider).logout();
    state = const AsyncData(null);
  }
}
