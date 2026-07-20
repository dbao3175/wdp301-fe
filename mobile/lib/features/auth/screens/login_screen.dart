import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/locale/locale_provider.dart';
import '../../../core/router/role_home.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../widgets/studio_components.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref
        .read(authControllerProvider.notifier)
        .login(_email.text, _password.text);
    if (!mounted) return;
    final session = ref.read(authControllerProvider).valueOrNull;
    if (session != null) context.go(RoleHome.pathFor(session.user.role));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final locale = ref.watch(localeControllerProvider);
    final auth = ref.watch(authControllerProvider);
    final loading = auth.isLoading;
    final error = auth.whenOrNull(error: (error, _) => readableApiError(error));

    return Scaffold(
      body: CustomPaint(
        painter: const _AuthScreentonePainter(),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(22),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Align(
                      alignment: Alignment.centerRight,
                      child: SegmentedButton<Locale>(
                        segments: const [
                          ButtonSegment(value: Locale('vi'), label: Text('VI')),
                          ButtonSegment(value: Locale('en'), label: Text('EN')),
                        ],
                        selected: {locale},
                        showSelectedIcon: false,
                        style: ButtonStyle(
                          visualDensity: VisualDensity.compact,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          backgroundColor:
                              WidgetStateProperty.resolveWith<Color?>((states) {
                            if (states.contains(WidgetState.selected)) {
                              return AppColors.red;
                            }
                            return AppColors.paper;
                          }),
                          foregroundColor:
                              WidgetStateProperty.resolveWith<Color?>((states) {
                            if (states.contains(WidgetState.selected)) {
                              return Colors.white;
                            }
                            return AppColors.ink;
                          }),
                          side: const WidgetStatePropertyAll(
                              BorderSide(color: AppColors.ink, width: 1.4)),
                        ),
                        onSelectionChanged: (value) => ref
                            .read(localeControllerProvider.notifier)
                            .setLocale(value.first),
                      ),
                    ),
                    const SizedBox(height: 28),
                    Column(children: [
                      const StudioLogo(),
                      const SizedBox(height: 16),
                      Container(width: 70, height: 3, color: AppColors.ink),
                    ]),
                    const SizedBox(height: 30),
                    StudioCard(
                      padding: const EdgeInsets.all(22),
                      color: AppColors.warmWhite,
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(l10n.loginTitle.toUpperCase(),
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(color: AppColors.ink)),
                            const SizedBox(height: 6),
                            Text(l10n.loginSubtitle,
                                style: const TextStyle(
                                    color: AppColors.muted,
                                    height: 1.42,
                                    fontWeight: FontWeight.w600)),
                            const SizedBox(height: 22),
                            TextFormField(
                              controller: _email,
                              keyboardType: TextInputType.emailAddress,
                              decoration: InputDecoration(
                                  labelText: l10n.email,
                                  hintText: 'id@studio.com',
                                  prefixIcon: const Icon(Icons.mail_outline)),
                              validator: (value) =>
                                  value == null || !value.contains('@')
                                      ? 'Email không hợp lệ.'
                                      : null,
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _password,
                              obscureText: _obscure,
                              decoration: InputDecoration(
                                labelText: l10n.password,
                                prefixIcon: const Icon(Icons.lock_outline),
                                suffixIcon: IconButton(
                                  onPressed: () =>
                                      setState(() => _obscure = !_obscure),
                                  icon: Icon(_obscure
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined),
                                ),
                              ),
                              validator: (value) =>
                                  value == null || value.isEmpty
                                      ? 'Vui lòng nhập mật khẩu.'
                                      : null,
                            ),
                            if (error != null) ...[
                              const SizedBox(height: 14),
                              ErrorState(error: error),
                            ],
                            const SizedBox(height: 20),
                            FilledButton.icon(
                              onPressed: loading ? null : _submit,
                              icon: loading
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2, color: Colors.white))
                                  : const Icon(Icons.login_rounded),
                              label: Text(l10n.signIn.toUpperCase()),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    TextButton(
                        onPressed: () => context.go('/auth/register'),
                        child: Text(l10n.noAccount)),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.lock_outline,
                            size: 15, color: AppColors.muted),
                        SizedBox(width: 5),
                        Text('STUDIO SESSION SECURE',
                            style: TextStyle(
                                color: AppColors.muted,
                                fontSize: 10,
                                letterSpacing: 0.8,
                                fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthScreentonePainter extends CustomPainter {
  const _AuthScreentonePainter();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawColor(AppColors.canvas, BlendMode.src);
    final paint = Paint()..color = AppColors.line.withValues(alpha: 0.48);
    const gap = 8.0;
    for (var y = 0.0; y < size.height; y += gap) {
      for (var x = 0.0; x < size.width; x += gap) {
        canvas.drawCircle(Offset(x, y), 0.75, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
