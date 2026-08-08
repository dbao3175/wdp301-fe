import 'package:dio/dio.dart';
import 'package:intl/intl.dart';

import '../../models/app_models.dart';

String readableApiError(Object error) {
  if (error is DioException) {
    final body = error.response?.data;
    if (body is Json && body['message'] != null) {
      return body['message'].toString();
    }
    if (error.type == DioExceptionType.connectionError) {
      return 'Không thể kết nối backend. Hãy kiểm tra server và API_BASE_URL.';
    }
    return error.message ?? 'Không thể kết nối đến máy chủ.';
  }
  return error.toString();
}

String compactDate(DateTime? date) {
  if (date == null) return 'No date';
  return DateFormat('dd/MM/yyyy').format(date.toLocal());
}

String relativeDue(DateTime? date, {bool isVi = true}) {
  if (date == null) return isVi ? 'Không có hạn' : 'No due date';
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final target = DateTime(date.year, date.month, date.day);
  final days = target.difference(today).inDays;
  if (days < 0) return isVi ? 'Quá hạn' : 'Overdue';
  if (days == 0) return isVi ? 'Hôm nay' : 'Today';
  if (days == 1) return isVi ? 'Ngày mai' : 'Tomorrow';
  if (days <= 7) return isVi ? 'Còn $days ngày' : '$days days left';
  return compactDate(date);
}

String initials(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.isEmpty) return 'M';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
      .toUpperCase();
}

/// Dynamic Notification Title Translation Helper
String localizeNotificationTitle(String title, {bool isVi = true}) {
  if (!isVi) return title;
  final t = title.trim();
  if (t.contains('Revision Requested')) return 'Yêu cầu sửa đổi Đề xuất';
  if (t.contains('Task Submitted')) return 'Task đã được nộp kiểm duyệt';
  if (t.contains('Proposal Approved')) return 'Đề xuất đã được phê duyệt';
  if (t.contains('Forwarded to Board') || t.contains('Proposal Forwarded')) {
    return 'Đề xuất đã chuyển Hội đồng';
  }
  if (t.contains('Proposal Rejected')) return 'Đề xuất bị từ chối';
  if (t.contains('New Task Assigned') || t.contains('Task Assigned')) {
    return 'Được giao Task mới';
  }
  if (t.contains('Task Approved')) return 'Task đã được phê duyệt';
  if (t.contains('Publication Vote') || t.contains('Vote Opened')) {
    return 'Mở bình chọn xuất bản';
  }
  if (t.contains('Publication Approved')) return 'Phê duyệt xuất bản';
  if (t.contains('Directive Created') || t.contains('Board Directive')) {
    return 'Chỉ thị mới từ Hội đồng';
  }
  return title;
}

/// Dynamic Notification Content Translation Helper
String localizeNotificationContent(String content, {bool isVi = true}) {
  if (!isVi) return content;
  var c = content;
  c = c.replaceAll(
    'Editor has requested revision for your proposal',
    'Biên tập viên đã yêu cầu sửa đổi cho đề xuất',
  );
  c = c.replaceAll(
    'has requested revision for your proposal',
    'đã yêu cầu sửa đổi cho đề xuất',
  );
  c = c.replaceAll(
    'Assistant',
    'Trợ lý',
  );
  c = c.replaceAll(
    'has submitted the task',
    'đã nộp task',
  );
  c = c.replaceAll(
    'Please review it.',
    'Vui lòng kiểm duyệt.',
  );
  c = c.replaceAll(
    'Reason:',
    'Lý do:',
  );
  c = c.replaceAll(
    'Editor has forwarded your proposal',
    'Biên tập viên đã chuyển đề xuất',
  );
  c = c.replaceAll(
    'to Editorial Board.',
    'đến Hội đồng biên tập.',
  );
  c = c.replaceAll(
    'Editor has approved your proposal',
    'Biên tập viên đã chấp thuận đề xuất',
  );
  c = c.replaceAll(
    'Editor has rejected your proposal',
    'Biên tập viên đã từ chối đề xuất',
  );
  c = c.replaceAll(
    'New task assigned:',
    'Task mới được giao:',
  );
  c = c.replaceAll(
    'Due date:',
    'Hạn nộp:',
  );
  return c;
}
