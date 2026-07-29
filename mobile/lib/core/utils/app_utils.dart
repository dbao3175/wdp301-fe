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

String relativeDue(DateTime? date) {
  if (date == null) return 'No due date';
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final target = DateTime(date.year, date.month, date.day);
  final days = target.difference(today).inDays;
  if (days < 0) return 'Overdue';
  if (days == 0) return 'Today';
  if (days == 1) return 'Tomorrow';
  if (days <= 7) return '$days days left';
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
