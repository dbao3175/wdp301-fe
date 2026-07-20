import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/app_models.dart';
import '../constants/app_constants.dart';
import '../storage/session_storage.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(sessionStorageProvider));
});

class ApiClient {
  ApiClient(this._sessionStorage)
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConstants.apiBaseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 20),
            headers: const {'Content-Type': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _sessionStorage.token();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final SessionStorage _sessionStorage;
  final Dio _dio;

  Future<Json> getMap(String path, {Map<String, dynamic>? query}) async {
    final response = await _dio.get<dynamic>(path, queryParameters: query);
    return _mapPayload(response.data);
  }

  Future<List<dynamic>> getList(String path,
      {Map<String, dynamic>? query}) async {
    final response = await _dio.get<dynamic>(path, queryParameters: query);
    final data = _unwrap(response.data);
    return data is List ? data : const [];
  }

  Future<Json> postMap(String path, [Object? body]) async {
    final response = await _dio.post<dynamic>(path, data: body);
    return _mapPayload(response.data);
  }

  Future<Json> putMap(String path, [Object? body]) async {
    final response = await _dio.put<dynamic>(path, data: body);
    return _mapPayload(response.data);
  }

  Future<Json> patchMap(String path, [Object? body]) async {
    final response = await _dio.patch<dynamic>(path, data: body);
    return _mapPayload(response.data);
  }

  dynamic _unwrap(dynamic body) {
    if (body is Json && body.containsKey('data')) return body['data'];
    return body;
  }

  Json _mapPayload(dynamic body) {
    final data = _unwrap(body);
    if (data is Json) return data;
    if (data == null) return <String, dynamic>{};
    throw DioException(
      requestOptions: RequestOptions(path: ''),
      error: 'Unexpected API response.',
    );
  }
}
