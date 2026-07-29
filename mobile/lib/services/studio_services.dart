import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../core/storage/session_storage.dart';
import '../models/app_models.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(
      ref.watch(apiClientProvider), ref.watch(sessionStorageProvider));
});

final studioServiceProvider = Provider<StudioService>((ref) {
  return StudioService(ref.watch(apiClientProvider));
});

class AuthService {
  AuthService(this._api, this._storage);

  final ApiClient _api;
  final SessionStorage _storage;

  Future<StudioSession?> restore() => _storage.read();

  Future<void> sendVerificationCode(String email) {
    return _api.postMap('/api/auth/send-verification-code',
        {'email': email.trim()}).then((_) {});
  }

  Future<StudioSession> login(String email, String password) async {
    final data = await _api.postMap(
        '/api/auth/login', {'email': email.trim(), 'password': password});
    final session = StudioSession(
        token: data['token'] as String, user: StudioUser.fromJson(data));
    await _storage.save(session);
    return session;
  }

  Future<StudioSession> register(
      {required String name,
      required String email,
      required String password,
      required StudioRole role,
      required String verificationCode}) async {
    final data = await _api.postMap('/api/auth/register', {
      'name': name.trim(),
      'email': email.trim(),
      'password': password,
      'role': role.apiValue,
      'verificationCode': verificationCode.trim(),
    });
    final session = StudioSession(
        token: data['token'] as String, user: StudioUser.fromJson(data));
    await _storage.save(session);
    return session;
  }

  Future<void> logout() => _storage.clearSession();
}

class StudioService {
  StudioService(this._api);

  final ApiClient _api;

  Future<List<StudioSeries>> getSeries({String? status}) async {
    final list = await _api.getList('/api/series',
        query: status == null ? null : {'status': status});
    return list
        .whereType<Json>()
        .map(StudioSeries.fromJson)
        .toList(growable: false);
  }

  Future<List<StudioChapter>> getChapters({String? seriesId}) async {
    final list = await _api.getList('/api/chapters',
        query: seriesId == null ? null : {'seriesId': seriesId});
    return list
        .whereType<Json>()
        .map(StudioChapter.fromJson)
        .toList(growable: false);
  }

  Future<List<StudioTask>> getTasks(StudioRole role) async {
    final path =
        role == StudioRole.assistant ? '/api/assistant/my-tasks' : '/api/tasks';
    final list = await _api.getList(path);
    return list
        .whereType<Json>()
        .map(StudioTask.fromJson)
        .toList(growable: false);
  }

  Future<void> submitTask(String taskId) async {
    await _api.putMap('/api/assistant/tasks/$taskId/submit');
  }

  Future<List<SeriesProposal>> getProposals({String? status}) async {
    final list = await _api.getList('/api/series/proposal',
        query: status == null ? null : {'status': status});
    return list
        .whereType<Json>()
        .map(SeriesProposal.fromJson)
        .toList(growable: false);
  }

  Future<void> forwardProposal(String proposalId, String comment) async {
    await _api.putMap(
        '/api/series/proposal/$proposalId/forward', {'content': comment});
  }

  Future<void> requestProposalRevision(
      String proposalId, String comment) async {
    await _api.putMap(
        '/api/series/proposal/$proposalId/revision', {'content': comment});
  }

  Future<void> rejectProposal(String proposalId, String comment) async {
    await _api.putMap(
        '/api/series/proposal/$proposalId/reject', {'content': comment});
  }

  Future<List<BoardSubmission>> getBoardSubmissions() async {
    final list = await _api.getList('/api/submissions/all');
    return list
        .whereType<Json>()
        .map(BoardSubmission.fromJson)
        .toList(growable: false);
  }

  Future<List<BoardVote>> getVotesForSubmission(String submissionId) async {
    final list = await _api.getList('/api/votes/submission/$submissionId');
    return list
        .whereType<Json>()
        .map(BoardVote.fromJson)
        .toList(growable: false);
  }

  Future<void> submitProposalVote(
      {required String submissionId,
      required String decision,
      required String comment,
      String? schedule}) async {
    await _api.postMap('/api/votes', {
      'submissionId': submissionId,
      'decision': decision,
      'comment': comment,
      if (schedule != null) 'schedule': schedule,
    });
  }

  Future<void> tieBreakProposalVote(
      {required String submissionId,
      required String decision,
      required String comment}) async {
    await _api.postMap('/api/votes/submission/$submissionId/tie-break',
        {'decision': decision, 'comment': comment});
  }

  Future<List<BoardPublication>> getPublications() async {
    final list = await _api.getList('/api/board/publications');
    return list
        .whereType<Json>()
        .map(BoardPublication.fromJson)
        .toList(growable: false);
  }

  Future<void> openPublication(String chapterId) async {
    await _api.postMap(
        '/api/board/publications/$chapterId/open', <String, dynamic>{});
  }

  Future<void> votePublication(
      {required String sessionId,
      required String decision,
      required String comment}) async {
    await _api.postMap('/api/board/publications/$sessionId/vote',
        {'decision': decision, 'comment': comment});
  }

  Future<void> tieBreakPublication(
      {required String sessionId,
      required String decision,
      required String comment}) async {
    await _api.postMap('/api/board/publications/$sessionId/tie-break',
        {'decision': decision, 'comment': comment});
  }

  Future<List<Directive>> getDirectives() async {
    final list = await _api.getList('/api/directives');
    return list
        .whereType<Json>()
        .map(Directive.fromJson)
        .toList(growable: false);
  }

  Future<void> voteDirective(
      {required String directiveId,
      required String decision,
      required String comment}) async {
    await _api.postMap('/api/directives/$directiveId/vote',
        {'decision': decision, 'comment': comment});
  }

  Future<List<RankingEntry>> getRankings({String? type}) async {
    final list = await _api.getList('/api/rankings',
        query: type == null ? null : {'type': type});
    return list
        .whereType<Json>()
        .map(RankingEntry.fromJson)
        .toList(growable: false);
  }

  Future<Json> getEditorDashboard() => _api.getMap('/api/editor/dashboard');

  Future<Json> getEditorProductionOverview() =>
      _api.getMap('/api/editor/dashboard/production-overview');

  Future<List<StudioSeries>> getEditorSeries() async {
    final list = await _api.getList('/api/editor/my-series');
    return list
        .whereType<Json>()
        .map(StudioSeries.fromJson)
        .toList(growable: false);
  }

  Future<List<StudioNotification>> getNotifications(String userId) async {
    final list = await _api.getList('/api/notifications/$userId');
    return list
        .whereType<Json>()
        .map(StudioNotification.fromJson)
        .toList(growable: false);
  }

  Future<void> markNotificationRead(String id) async {
    await _api.patchMap('/api/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead(String userId) async {
    await _api.patchMap('/api/notifications/$userId/read-all');
  }

  Future<List<StudioUser>> getUsers({String? role}) async {
    final list = await _api.getList('/api/users',
        query: role == null ? null : {'role': role});
    return list
        .whereType<Json>()
        .map(StudioUser.fromJson)
        .toList(growable: false);
  }

  Future<List<Json>> getAuditLogs() async {
    final list = await _api.getList('/api/audit-logs');
    return list.whereType<Json>().toList(growable: false);
  }

  Future<Json> getAssistantIncomeOverview() async {
    final summary = await _api.getMap('/api/assistant/income/tasks');
    final analytics = await _api.getList('/api/assistant/income/analytics');
    return {
      ...summary,
      'analytics': analytics.whereType<Json>().toList(growable: false),
    };
  }

  Future<Json> getAssistantPayoutAccount() =>
      _api.getMap('/api/assistant/payout-account');
}
