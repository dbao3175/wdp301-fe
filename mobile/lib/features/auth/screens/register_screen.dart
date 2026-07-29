import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/role_home.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _code = TextEditingController();
  StudioRole _role = StudioRole.mangaka;
  bool _sendingCode = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    if (!_email.text.contains('@')) return;
    setState(() => _sendingCode = true);
    try {
      await ref
          .read(authControllerProvider.notifier)
          .sendVerificationCode(_email.text);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Đã gửi mã xác thực.')));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(readableApiError(error))));
      }
    } finally {
      if (mounted) setState(() => _sendingCode = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authControllerProvider.notifier).register(
          name: _name.text,
          email: _email.text,
          password: _password.text,
          role: _role,
          verificationCode: _code.text,
        );
    if (!mounted) return;
    final session = ref.read(authControllerProvider).valueOrNull;
    if (session != null) context.go(RoleHome.pathFor(session.user.role));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final loading = auth.isLoading;
    final error = auth.whenOrNull(error: (error, _) => readableApiError(error));
    final roles = [
      StudioRole.mangaka,
      StudioRole.assistant,
      StudioRole.editor,
      StudioRole.boardMember,
      StudioRole.admin
    ];

    return Scaffold(
      appBar: AppBar(
          leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => context.go('/auth/login'))),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(22),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const StudioLogo(),
            const SizedBox(height: 22),
            Text(l10n.createAccount,
                style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(l10n.appSubtitle,
                style: const TextStyle(color: AppColors.muted)),
            const SizedBox(height: 20),
            StudioCard(
              padding: const EdgeInsets.all(18),
              child: Form(
                key: _formKey,
                child: Column(children: [
                  TextFormField(
                      controller: _name,
                      decoration: InputDecoration(
                          labelText: l10n.fullName,
                          prefixIcon: const Icon(Icons.badge_outlined)),
                      validator: (value) => value == null || value.isEmpty
                          ? 'Vui lòng nhập tên.'
                          : null),
                  const SizedBox(height: 14),
                  Row(children: [
                    Expanded(
                        child: TextFormField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                                labelText: l10n.email,
                                prefixIcon: const Icon(Icons.mail_outline)),
                            validator: (value) =>
                                value == null || !value.contains('@')
                                    ? 'Email không hợp lệ.'
                                    : null)),
                    const SizedBox(width: 10),
                    SizedBox(
                        width: 112,
                        child: OutlinedButton(
                            onPressed: _sendingCode ? null : _sendCode,
                            child: Text(_sendingCode ? '...' : l10n.sendCode))),
                  ]),
                  const SizedBox(height: 14),
                  TextFormField(
                      controller: _code,
                      decoration: InputDecoration(
                          labelText: l10n.verificationCode,
                          prefixIcon: const Icon(Icons.verified_user_outlined)),
                      validator: (value) => value == null || value.isEmpty
                          ? 'Nhập mã xác thực.'
                          : null),
                  const SizedBox(height: 14),
                  TextFormField(
                      controller: _password,
                      obscureText: true,
                      decoration: InputDecoration(
                          labelText: l10n.password,
                          prefixIcon: const Icon(Icons.lock_outline)),
                      validator: (value) => value == null || value.length < 6
                          ? 'Mật khẩu tối thiểu 6 ký tự.'
                          : null),
                  const SizedBox(height: 16),
                  Align(
                      alignment: Alignment.centerLeft,
                      child: Text(l10n.role,
                          style: const TextStyle(fontWeight: FontWeight.w900))),
                  const SizedBox(height: 8),
                  Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: roles.map((role) {
                        final selected = role == _role;
                        return ChoiceChip(
                          selected: selected,
                          label: Text(l10n.roleLabel(role.apiValue)),
                          selectedColor: AppColors.ink,
                          labelStyle: TextStyle(
                              color: selected ? Colors.white : AppColors.ink,
                              fontWeight: FontWeight.w800),
                          onSelected: (_) => setState(() => _role = role),
                        );
                      }).toList()),
                  if (error != null) ...[
                    const SizedBox(height: 14),
                    ErrorState(error: error),
                  ],
                  const SizedBox(height: 18),
                  FilledButton.icon(
                      onPressed: loading ? null : _submit,
                      icon: const Icon(Icons.person_add_alt_1),
                      label: Text(l10n.register)),
                ]),
              ),
            ),
            const SizedBox(height: 14),
            TextButton(
                onPressed: () => context.go('/auth/login'),
                child: Text(l10n.haveAccount)),
          ]),
        ),
      ),
    );
  }
}
