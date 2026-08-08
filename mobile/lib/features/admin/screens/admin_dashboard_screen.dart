import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';
import '../../../widgets/studio_components.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/admin_provider.dart';

enum _AdminTab { users, notifications, audit }

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  _AdminTab _tab = _AdminTab.users;
  String _search = '';

  bool get _isVi => AppLocalizations.of(context).isVi;
  String tr(String vi, String en) => _isVi ? vi : en;

  void _refresh() {
    ref.invalidate(adminUsersProvider);
    ref.invalidate(adminNotificationsProvider);
    ref.invalidate(adminAuditProvider);
  }

  @override
  Widget build(BuildContext context) {
    return StudioPage(
      onRefresh: () async => _refresh(),
      children: [
        StudioHeaderCard(
          title: tr('QUẢN TRỊ HỆ THỐNG', 'SYSTEM ADMINISTRATION'),
          subtitle: tr(
            'Quản lý người dùng, thông báo và nhật ký hệ thống.',
            'Manage users, system notifications and audit logs.',
          ),
          icon: Icons.admin_panel_settings_rounded,
        ),
        const SizedBox(height: 14),
        _AdminTabs(
          value: _tab,
          isVi: _isVi,
          onChanged: (value) => setState(() => _tab = value),
        ),
        const SizedBox(height: 16),
        switch (_tab) {
          _AdminTab.users => _buildUsers(),
          _AdminTab.notifications => _buildNotifications(),
          _AdminTab.audit => _buildAudit(),
        },
      ],
    );
  }

  Widget _buildUsers() {
    final users = ref.watch(adminUsersProvider);
    final currentId = ref.watch(authControllerProvider).valueOrNull?.user.id;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
          child: TextField(
            onChanged: (value) => setState(() => _search = value.trim()),
            decoration: InputDecoration(
              hintText: tr('Tìm tên, email hoặc vai trò...',
                  'Search name, email or role...'),
              prefixIcon: const Icon(Icons.search_rounded),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 112,
          child: FilledButton.icon(
            onPressed: () => _showUserForm(),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
            icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
            label: Text(tr('THÊM', 'ADD'), maxLines: 1, softWrap: false),
          ),
        ),
      ]),
      const SizedBox(height: 12),
      users.when(
        loading: () => const LoadingPanel(),
        error: (error, _) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(adminUsersProvider),
        ),
        data: (items) {
          final query = _search.toLowerCase();
          final filtered = items.where((user) {
            if (query.isEmpty) return true;
            return user.name.toLowerCase().contains(query) ||
                user.email.toLowerCase().contains(query) ||
                user.role.apiValue.toLowerCase().contains(query);
          }).toList(growable: false);
          if (filtered.isEmpty) {
            return EmptyState(
              message: tr('Không tìm thấy người dùng.', 'No users found.'),
              icon: Icons.people_outline_rounded,
            );
          }
          return Column(
            children: filtered
                .map((user) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _UserCard(
                        user: user,
                        isVi: _isVi,
                        isCurrentUser: user.id == currentId,
                        onEdit: () => _showUserForm(user),
                        onToggle: () => _toggleUser(user),
                        onDelete: () => _deleteUser(user),
                      ),
                    ))
                .toList(),
          );
        },
      ),
    ]);
  }

  Widget _buildNotifications() {
    final notifications = ref.watch(adminNotificationsProvider);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
          child: SectionHeader(
            title: tr('THÔNG BÁO HỆ THỐNG', 'SYSTEM NOTIFICATIONS'),
          ),
        ),
        SizedBox(
          width: 112,
          child: FilledButton.icon(
            onPressed: _showNotificationForm,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
            icon: const Icon(Icons.send_rounded, size: 17),
            label: Text(tr('GỬI', 'SEND'), maxLines: 1, softWrap: false),
          ),
        ),
      ]),
      const SizedBox(height: 12),
      notifications.when(
        loading: () => const LoadingPanel(),
        error: (error, _) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(adminNotificationsProvider),
        ),
        data: (items) => items.isEmpty
            ? EmptyState(
                message: tr('Chưa có thông báo.', 'No notifications yet.'),
                icon: Icons.notifications_none_rounded,
              )
            : Column(
                children: items
                    .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _NotificationCard(
                            item: item,
                            isVi: _isVi,
                            onDelete: () => _deleteNotification(item),
                          ),
                        ))
                    .toList(),
              ),
      ),
    ]);
  }

  Widget _buildAudit() {
    final audits = ref.watch(adminAuditProvider);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SectionHeader(title: tr('NHẬT KÝ HỆ THỐNG', 'SYSTEM AUDIT LOGS')),
      const SizedBox(height: 12),
      audits.when(
        loading: () => const LoadingPanel(),
        error: (error, _) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(adminAuditProvider),
        ),
        data: (items) => items.isEmpty
            ? EmptyState(
                message: tr('Chưa có nhật ký.', 'No audit logs found.'),
                icon: Icons.receipt_long_outlined,
              )
            : Column(
                children: items
                    .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _AuditCard(item: item, isVi: _isVi),
                        ))
                    .toList(),
              ),
      ),
    ]);
  }

  Future<void> _showUserForm([StudioUser? user]) async {
    final name = TextEditingController(text: user?.name ?? '');
    final email = TextEditingController(text: user?.email ?? '');
    final password = TextEditingController();
    var role = user?.role ?? StudioRole.assistant;
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
              20, 20, 20, 24 + MediaQuery.viewInsetsOf(context).bottom),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(
              user == null
                  ? tr('THÊM NGƯỜI DÙNG', 'CREATE USER')
                  : tr('CHỈNH SỬA NGƯỜI DÙNG', 'EDIT USER'),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 14),
            TextField(
                controller: name,
                decoration: InputDecoration(labelText: tr('Họ tên', 'Name'))),
            const SizedBox(height: 10),
            TextField(
                controller: email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email')),
            if (user == null) ...[
              const SizedBox(height: 10),
              TextField(
                controller: password,
                obscureText: true,
                decoration:
                    InputDecoration(labelText: tr('Mật khẩu', 'Password')),
              ),
            ],
            const SizedBox(height: 10),
            DropdownButtonFormField<StudioRole>(
              initialValue: role,
              decoration: InputDecoration(labelText: tr('Vai trò', 'Role')),
              items: StudioRole.values
                  .where((item) => item != StudioRole.unknown)
                  .map((item) => DropdownMenuItem(
                        value: item,
                        child: Text(item.fallbackLabel),
                      ))
                  .toList(),
              onChanged: (value) => setSheetState(() => role = value ?? role),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () async {
                  if (name.text.trim().isEmpty ||
                      email.text.trim().isEmpty ||
                      (user == null && password.text.isEmpty)) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content: Text(tr('Vui lòng nhập đủ thông tin bắt buộc.',
                            'Please complete all required fields.'))));
                    return;
                  }
                  try {
                    final payload = <String, dynamic>{
                      'name': name.text.trim(),
                      'email': email.text.trim(),
                      'role': role.apiValue,
                      if (user == null) 'password': password.text,
                    };
                    final service = ref.read(studioServiceProvider);
                    if (user == null) {
                      await service.createUser(payload);
                    } else {
                      await service.updateUser(user.id, payload);
                    }
                    if (context.mounted) Navigator.pop(context, true);
                  } catch (error) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(readableApiError(error))));
                    }
                  }
                },
                icon: const Icon(Icons.save_outlined),
                label: Text(tr('LƯU', 'SAVE')),
              ),
            ),
          ]),
        ),
      ),
    );
    name.dispose();
    email.dispose();
    password.dispose();
    if (saved == true) {
      ref.invalidate(adminUsersProvider);
      _showSuccess(tr('Đã lưu người dùng.', 'User saved.'));
    }
  }

  Future<void> _toggleUser(StudioUser user) async {
    try {
      await ref.read(studioServiceProvider).toggleUserStatus(user.id);
      ref.invalidate(adminUsersProvider);
      _showSuccess(tr('Đã cập nhật trạng thái.', 'Status updated.'));
    } catch (error) {
      _showError(error);
    }
  }

  Future<void> _deleteUser(StudioUser user) async {
    final accepted = await _confirm(
      tr('Xóa tài khoản ${user.name}?', 'Delete ${user.name}?'),
    );
    if (!accepted) return;
    try {
      await ref.read(studioServiceProvider).deleteUser(user.id);
      ref.invalidate(adminUsersProvider);
      _showSuccess(tr('Đã xóa người dùng.', 'User deleted.'));
    } catch (error) {
      _showError(error);
    }
  }

  Future<void> _showNotificationForm() async {
    final users =
        ref.read(adminUsersProvider).valueOrNull ?? const <StudioUser>[];
    if (users.isEmpty) {
      _showSuccess(
          tr('Danh sách người dùng chưa sẵn sàng.', 'User list is not ready.'));
      return;
    }
    final title = TextEditingController();
    final content = TextEditingController();
    String userId = users.first.id;
    String type = 'INFO';
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
              20, 20, 20, 24 + MediaQuery.viewInsetsOf(context).bottom),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(tr('GỬI THÔNG BÁO', 'SEND NOTIFICATION'),
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              initialValue: userId,
              decoration:
                  InputDecoration(labelText: tr('Người nhận', 'Recipient')),
              items: users
                  .map((user) => DropdownMenuItem(
                        value: user.id,
                        child: Text('${user.name} (${user.role.apiValue})'),
                      ))
                  .toList(),
              onChanged: (value) => userId = value ?? userId,
            ),
            const SizedBox(height: 10),
            TextField(
                controller: title,
                decoration: InputDecoration(labelText: tr('Tiêu đề', 'Title'))),
            const SizedBox(height: 10),
            TextField(
              controller: content,
              minLines: 3,
              maxLines: 5,
              decoration: InputDecoration(labelText: tr('Nội dung', 'Content')),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              initialValue: type,
              decoration: InputDecoration(labelText: tr('Mức độ', 'Severity')),
              items: const ['INFO', 'WARNING', 'ERROR']
                  .map((value) =>
                      DropdownMenuItem(value: value, child: Text(value)))
                  .toList(),
              onChanged: (value) => setSheetState(() => type = value ?? type),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () async {
                  if (title.text.trim().isEmpty ||
                      content.text.trim().isEmpty) {
                    return;
                  }
                  try {
                    await ref
                        .read(studioServiceProvider)
                        .createAdminNotification(
                          userId: userId,
                          title: title.text.trim(),
                          content: content.text.trim(),
                          type: type,
                        );
                    if (context.mounted) Navigator.pop(context, true);
                  } catch (error) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(readableApiError(error))));
                    }
                  }
                },
                icon: const Icon(Icons.send_rounded),
                label: Text(tr('GỬI NGAY', 'SEND NOW')),
              ),
            ),
          ]),
        ),
      ),
    );
    title.dispose();
    content.dispose();
    if (sent == true) {
      ref.invalidate(adminNotificationsProvider);
      _showSuccess(tr('Đã gửi thông báo.', 'Notification sent.'));
    }
  }

  Future<void> _deleteNotification(StudioNotification item) async {
    if (!await _confirm(
        tr('Xóa thông báo này?', 'Delete this notification?'))) {
      return;
    }
    try {
      await ref.read(studioServiceProvider).deleteAdminNotification(item.id);
      ref.invalidate(adminNotificationsProvider);
    } catch (error) {
      _showError(error);
    }
  }

  Future<bool> _confirm(String message) async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(tr('Xác nhận', 'Confirm')),
            content: Text(message),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(tr('Hủy', 'Cancel'))),
              FilledButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: Text(tr('Đồng ý', 'Confirm'))),
            ],
          ),
        ) ??
        false;
  }

  void _showSuccess(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  void _showError(Object error) => _showSuccess(readableApiError(error));
}

class _AdminTabs extends StatelessWidget {
  const _AdminTabs({
    required this.value,
    required this.isVi,
    required this.onChanged,
  });

  final _AdminTab value;
  final bool isVi;
  final ValueChanged<_AdminTab> onChanged;

  @override
  Widget build(BuildContext context) {
    final tabs = [
      (
        _AdminTab.users,
        Icons.people_alt_outlined,
        isVi ? 'NGƯỜI DÙNG' : 'USERS'
      ),
      (
        _AdminTab.notifications,
        Icons.notifications_none_rounded,
        isVi ? 'THÔNG BÁO' : 'ALERTS'
      ),
      (
        _AdminTab.audit,
        Icons.monitor_heart_outlined,
        isVi ? 'NHẬT KÝ' : 'AUDIT'
      ),
    ];
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: AppColors.paper,
        border: Border.all(color: AppColors.ink, width: 2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: tabs.map((tab) {
          final active = tab.$1 == value;
          return Expanded(
            child: InkWell(
              onTap: () => onChanged(tab.$1),
              borderRadius: BorderRadius.circular(5),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding:
                    const EdgeInsets.symmetric(vertical: 10, horizontal: 2),
                decoration: BoxDecoration(
                  color: active ? AppColors.ink : Colors.transparent,
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(tab.$2,
                      color: active ? Colors.white : AppColors.muted, size: 19),
                  const SizedBox(height: 4),
                  Text(tab.$3,
                      maxLines: 1,
                      style: TextStyle(
                          color: active ? Colors.white : AppColors.muted,
                          fontSize: 8,
                          fontWeight: FontWeight.w900)),
                ]),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  const _UserCard({
    required this.user,
    required this.isVi,
    required this.isCurrentUser,
    required this.onEdit,
    required this.onToggle,
    required this.onDelete,
  });

  final StudioUser user;
  final bool isVi;
  final bool isCurrentUser;
  final VoidCallback onEdit;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      child: Row(children: [
        AvatarBadge(name: user.name, size: 46),
        const SizedBox(width: 12),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(user.name,
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
            const SizedBox(height: 3),
            Text(user.email,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, fontSize: 11)),
            const SizedBox(height: 7),
            Wrap(spacing: 6, runSpacing: 5, children: [
              StatusPill(status: user.role.apiValue),
              StatusPill(status: user.isActive ? 'ACTIVE' : 'SUSPENDED'),
            ]),
          ]),
        ),
        PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'edit') onEdit();
            if (value == 'toggle') onToggle();
            if (value == 'delete') onDelete();
          },
          itemBuilder: (_) => [
            PopupMenuItem(
                value: 'edit', child: Text(isVi ? 'Chỉnh sửa' : 'Edit')),
            if (!isCurrentUser)
              PopupMenuItem(
                value: 'toggle',
                child: Text(user.isActive
                    ? (isVi ? 'Tạm khóa' : 'Suspend')
                    : (isVi ? 'Khôi phục' : 'Restore')),
              ),
            if (!isCurrentUser)
              PopupMenuItem(
                  value: 'delete', child: Text(isVi ? 'Xóa' : 'Delete')),
          ],
        ),
      ]),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard(
      {required this.item, required this.isVi, required this.onDelete});

  final StudioNotification item;
  final bool isVi;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final color = item.type == 'ERROR'
        ? AppColors.red
        : item.type == 'WARNING'
            ? AppColors.amber
            : AppColors.blue;
    return StudioCard(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(9),
          decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              border: Border.all(color: color),
              borderRadius: BorderRadius.circular(6)),
          child: Icon(Icons.notifications_active_outlined, color: color),
        ),
        const SizedBox(width: 11),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item.title,
                style: const TextStyle(fontWeight: FontWeight.w900)),
            const SizedBox(height: 4),
            Text(item.content,
                style: const TextStyle(color: AppColors.muted, height: 1.35)),
            const SizedBox(height: 7),
            Text(
              '${isVi ? 'Người nhận' : 'Recipient'}: ${item.recipientName.isEmpty ? item.recipientId : item.recipientName}',
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800),
            ),
          ]),
        ),
        IconButton(
          onPressed: onDelete,
          color: AppColors.red,
          icon: const Icon(Icons.delete_outline_rounded),
          tooltip: isVi ? 'Xóa thông báo' : 'Delete notification',
        ),
      ]),
    );
  }
}

class _AuditCard extends StatelessWidget {
  const _AuditCard({required this.item, required this.isVi});

  final Json item;
  final bool isVi;

  @override
  Widget build(BuildContext context) {
    final user = item['userId'] ?? item['user'];
    final time = dateOf(item['createdAt'] ?? item['timestamp']);
    return StudioCard(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(Icons.receipt_long_outlined, color: AppColors.muted),
        const SizedBox(width: 12),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(textOf(item['action'], isVi ? 'Hành động' : 'Action'),
                style: const TextStyle(fontWeight: FontWeight.w900)),
            const SizedBox(height: 4),
            Text(textOf(item['target'] ?? item['details'], '—'),
                style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            const SizedBox(height: 5),
            Text(
              '${ownerName(user, isVi ? 'Không rõ người dùng' : 'Unknown user')}${time == null ? '' : ' · ${time.toLocal().toString().substring(0, 16)}'}',
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
            ),
          ]),
        ),
      ]),
    );
  }
}
