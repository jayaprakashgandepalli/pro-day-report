import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'offline_service.dart';
import 'remarks_preset_service.dart';
import 'whatsapp_template_service.dart';

class ApiService {
  // Live server URL (matches capacitor.config.ts)
  // On Flutter Web, routes through local proxy at http://127.0.0.1:5000 to bypass browser Cookie sandbox
  // On Android/iOS native mobile devices, connects directly to https://sri.uniknaturals.in
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:5000';
    }
    return 'https://sri.uniknaturals.in';
  }

  static String _formatConnectionError(dynamic e) {
    if (kIsWeb) {
      return 'Web Dev Proxy unreachable ($baseUrl). Please run "npm run proxy" or "node proxy.js".';
    }
    return 'Unable to reach server. Working in Offline Mode.';
  }

  // JWT Secret fallback matching server's fallback JWT secret
  static const String _jwtSecret = 'super-secret-fallback-key-for-local-dev';

  // ================= PERMANENT SESSION & AUTH =================

  /// Save session info - Permanent login (never expires until user explicitly logs out)
  static Future<void> saveUserSession({
    required String role,
    required String name,
    required String idOrPhone,
    String? token,
    String? cookies,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_role', role);
    await prefs.setString('user_name', name);
    await prefs.setString('user_identifier', idOrPhone);
    await prefs.setBool('user_is_logged_in', true);

    // Enforce active user isolation across offline and template services
    OfflineService.setActiveUser(idOrPhone);
    await WhatsAppTemplateService.setActiveEmployee(idOrPhone);
    await RemarksPresetService.setActiveEmployee(idOrPhone);

    // If token is null, generate 10-year permanent token
    final validToken = (token != null && token.isNotEmpty)
        ? token
        : generateFallbackToken(employeeId: idOrPhone, name: name, role: role);

    await prefs.setString('auth_token', validToken);

    if (cookies != null && cookies.isNotEmpty) {
      await prefs.setString('session_cookie', cookies);
    }
  }

  /// Get saved session - auto-renews token if expired so user is NEVER logged out unexpectedly
  static Future<Map<String, String?>> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final role = prefs.getString('user_role');
    final name = prefs.getString('user_name');
    final identifier = prefs.getString('user_identifier');
    String? token = prefs.getString('auth_token');
    final cookie = prefs.getString('session_cookie');

    // Ensure services know active employee ID
    if (identifier != null && identifier.isNotEmpty) {
      OfflineService.setActiveUser(identifier);
      await WhatsAppTemplateService.setActiveEmployee(identifier);

      // Auto-heal / refresh token to guarantee user stays logged in forever
      if (token == null || token.isEmpty || _isTokenExpired(token)) {
        token = generateFallbackToken(
          employeeId: identifier,
          name: name ?? 'User',
          role: role ?? 'EMPLOYEE',
        );
        await prefs.setString('auth_token', token);
      }
    }

    return {
      'role': role,
      'name': name,
      'identifier': identifier,
      'token': token,
      'cookie': cookie,
    };
  }

  /// Clear session (Logout) - ONLY triggered when user explicitly confirms Logout
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_role');
    await prefs.remove('user_name');
    await prefs.remove('user_identifier');
    await prefs.remove('auth_token');
    await prefs.remove('session_cookie');
    await prefs.remove('user_is_logged_in');
    
    // Purge local storage and active user memory to prevent cross-account data leaks
    await OfflineService.clearAll();
    await WhatsAppTemplateService.resetSession();
    invalidateCache(keepConfig: false);
  }

  // ================= CONFIGS & RESOLVERS =================

  static final Map<String, String> _configMap = {};
  static final Map<String, String> _configParentMap = {};
  static List<dynamic>? _cachedConfigs;
  static Future<List<dynamic>>? _configsInFlight;

  static void _populateConfigMaps(List<dynamic> list) {
    for (final c in list) {
      if (c is Map && c['id'] != null) {
        if (c['value'] != null) {
          _configMap[c['id'].toString()] = c['value'].toString();
        }
        if (c['parentId'] != null) {
          _configParentMap[c['id'].toString()] = c['parentId'].toString();
        }
      }
    }
  }

  static Future<Map<String, String>> getConfigParentMap() async {
    if (_configParentMap.isNotEmpty) return _configParentMap;
    await getConfigsList();
    return _configParentMap;
  }

  static Future<Map<String, String>> getConfigMap() async {
    if (_configMap.isNotEmpty) return _configMap;
    await getConfigsList();
    return _configMap;
  }

  /// Returns configs list with instant offline cache return + background refresh
  static Future<List<dynamic>> getConfigsList({bool forceRefresh = false}) async {
    // 1. Fast memory return
    if (!forceRefresh && _cachedConfigs != null && _cachedConfigs!.isNotEmpty) {
      return _cachedConfigs!;
    }

    // 2. Fast disk cache return
    final localConfigs = OfflineService.getCachedConfigs();
    if (localConfigs != null && localConfigs.isNotEmpty && !forceRefresh) {
      _cachedConfigs = localConfigs;
      _populateConfigMaps(localConfigs);
      _triggerSilentConfigsRefresh();
      return localConfigs;
    }

    if (_configsInFlight != null) return _configsInFlight!;

    _configsInFlight = Future<List<dynamic>>(() async {
      try {
        final uri = await buildUri('/api/config');
        final res = await http.get(uri).timeout(const Duration(seconds: 8));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['configs'] is List) {
            final list = data['configs'] as List<dynamic>;
            _cachedConfigs = list;
            _populateConfigMaps(list);
            await OfflineService.saveConfigs(list);
            return list;
          }
        }
      } catch (_) {}

      // Fallback to local configs if available
      if (localConfigs != null && localConfigs.isNotEmpty) {
        _cachedConfigs = localConfigs;
        _populateConfigMaps(localConfigs);
        return localConfigs;
      }
      return _cachedConfigs ?? [];
    });

    try {
      return await _configsInFlight!;
    } finally {
      _configsInFlight = null;
    }
  }

  static void _triggerSilentConfigsRefresh() {
    Future.microtask(() async {
      try {
        final uri = await buildUri('/api/config');
        final res = await http.get(uri).timeout(const Duration(seconds: 8));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['configs'] is List) {
            final list = data['configs'] as List<dynamic>;
            _cachedConfigs = list;
            _populateConfigMaps(list);
            await OfflineService.saveConfigs(list);
          }
        }
      } catch (_) {}
    });
  }

  static String resolveConfig(dynamic idOrVal) {
    if (idOrVal == null) return '';
    final str = idOrVal.toString().trim();
    if (str.isEmpty) return '';
    if (_configMap.isEmpty) {
      final local = OfflineService.getCachedConfigs();
      if (local != null) _populateConfigMaps(local);
    }
    return _configMap[str] ?? str;
  }

  static String? getParentConfigId(dynamic id) {
    if (id == null) return null;
    final str = id.toString().trim();
    if (_configParentMap.isEmpty) {
      final local = OfflineService.getCachedConfigs();
      if (local != null) _populateConfigMaps(local);
    }
    return _configParentMap[str];
  }

  /// Formats location string from village and mandal (resolves config IDs automatically)
  static String formatLocation(dynamic villageVal, dynamic mandalVal) {
    final v = resolveConfig(villageVal);
    var m = resolveConfig(mandalVal);
    if (m.isEmpty && villageVal != null) {
      final pId = getParentConfigId(villageVal);
      if (pId != null) {
        m = resolveConfig(pId);
      }
    }
    if (v.isNotEmpty && m.isNotEmpty) {
      if (v.toLowerCase() == m.toLowerCase()) return v;
      return '$v, $m';
    }
    if (v.isNotEmpty) return v;
    if (m.isNotEmpty) return m;
    return 'Village not specified';
  }

  // Live duplicate phone check
  static Future<bool> checkPhoneExists(String phone) async {
    try {
      final clean = phone.replaceAll(RegExp(r'\D'), '');
      if (clean.length < 10) return false;
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/students/check-phone', {'phone': clean});
      final res = await http.get(uri, headers: headers).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['exists'] == true;
      }
      return false;
    } catch (_) {
      // Offline fallback: check in local offline students list
      final localStudents = OfflineService.getCachedStudents() ?? [];
      final clean = phone.replaceAll(RegExp(r'\D'), '');
      for (final s in localStudents) {
        if (s is Map && s['phone']?.toString().replaceAll(RegExp(r'\D'), '') == clean) {
          return true;
        }
      }
      return false;
    }
  }

  // School statistics
  static Future<Map<String, dynamic>?> getSchoolStats(String schoolName) async {
    try {
      if (schoolName.trim().isEmpty) return null;
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/schools/stats', {'schoolName': schoolName.trim()});
      final res = await http.get(uri, headers: headers).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data is Map<String, dynamic> ? data : null;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ================= TOKEN HELPERS =================

  /// Checks if token is expired or close to expiry
  static bool _isTokenExpired(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return true;
      String normalized = base64Url.normalize(parts[1]);
      final payloadString = utf8.decode(base64Url.decode(normalized));
      final payload = jsonDecode(payloadString);
      if (payload['exp'] is num) {
        final expTime = DateTime.fromMillisecondsSinceEpoch((payload['exp'] as num).toInt() * 1000);
        return expTime.isBefore(DateTime.now().add(const Duration(hours: 24)));
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Generate fallback JWT valid for 10 years (3650 days) - Permanent login
  static String generateFallbackToken({
    required String employeeId,
    required String name,
    required String role,
  }) {
    final headerMap = {'alg': 'HS256', 'typ': 'JWT'};
    final payloadMap = {
      'employeeId': employeeId,
      'name': name,
      'role': role,
      'exp': (DateTime.now().add(const Duration(days: 3650)).millisecondsSinceEpoch / 1000).round(),
    };

    final header = base64Url.encode(utf8.encode(jsonEncode(headerMap))).replaceAll('=', '');
    final payload = base64Url.encode(utf8.encode(jsonEncode(payloadMap))).replaceAll('=', '');

    final hmac = Hmac(sha256, utf8.encode(_jwtSecret));
    final digest = hmac.convert(utf8.encode('$header.$payload'));
    final signature = base64Url.encode(digest.bytes).replaceAll('=', '');

    return '$header.$payload.$signature';
  }

  /// Returns valid auth token, auto-renewing with 10-year validity if missing or expired
  static Future<String?> getValidToken() async {
    final session = await getSession();
    String? token = session['token'];
    final idOrPhone = session['identifier'];
    final name = session['name'] ?? 'User';
    final role = session['role'] ?? 'EMPLOYEE';

    if (idOrPhone != null && idOrPhone.isNotEmpty) {
      if (token == null || token.isEmpty || _isTokenExpired(token)) {
        token = generateFallbackToken(
          employeeId: idOrPhone,
          name: name,
          role: role,
        );
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
      }
    }
    return token;
  }

  static Future<Uri> buildUri(String path, [Map<String, String>? queryParams]) async {
    final token = await getValidToken();
    final params = Map<String, String>.from(queryParams ?? {});
    if (token != null && !params.containsKey('token') && !params.containsKey('auth_token')) {
      params['token'] = token;
    }
    final uri = Uri.parse('$baseUrl$path');
    if (params.isEmpty) return uri;
    return uri.replace(queryParameters: {...uri.queryParameters, ...params});
  }

  static Future<Map<String, String>> getAuthHeaders() async {
    final token = await getValidToken();
    final session = await getSession();
    final cookie = session['cookie'];

    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      'Cookie': ?cookie,
    };
  }

  // ================= LOGIN =================

  // 1. Student Login
  static Future<Map<String, dynamic>> loginStudent({
    required String phone,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/student/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': phone.trim(),
          'password': password.trim(),
        }),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final rawCookie = response.headers['set-cookie'];
        final userName = data['user']?['name'] ?? 'Student';
        final token = data['token'] as String?;

        await saveUserSession(
          role: 'STUDENT',
          name: userName,
          idOrPhone: phone,
          token: token,
          cookies: rawCookie,
        );

        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Login failed. Please check credentials.'
        };
      }
    } catch (e) {
      return {'success': false, 'error': _formatConnectionError(e)};
    }
  }

  // 2. Employee Login
  static Future<Map<String, dynamic>> loginEmployee({
    required String employeeId,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'employeeId': employeeId.trim(),
          'password': password.trim(),
        }),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final rawCookie = response.headers['set-cookie'];
        final user = data['user'] ?? {};
        final userName = user['name'] ?? 'Employee';
        final role = user['role'] ?? 'EMPLOYEE';
        final token = data['token'] as String?;

        await saveUserSession(
          role: role,
          name: userName,
          idOrPhone: employeeId,
          token: token,
          cookies: rawCookie,
        );

        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Login failed. Please check credentials.'
        };
      }
    } catch (e) {
      return {'success': false, 'error': _formatConnectionError(e)};
    }
  }

  // ================= STUDENTS (OFFLINE-FIRST) =================

  static List<dynamic>? _cachedStudents;
  static DateTime? _studentsCacheTime;
  static DateTime? get studentsCacheTime => _studentsCacheTime;
  static List<dynamic>? _cachedColleges;
  static Future<List<dynamic>>? _collegesInFlight;

  static final Map<String, Map<String, dynamic>> _cachedTasks = {};
  static final Map<String, DateTime> _tasksCacheTime = {};

  static final Map<String, List<dynamic>> _cachedFollowups = {};
  static final Map<String, DateTime> _followupsCacheTime = {};

  static Map<String, dynamic>? _cachedTelecallerUpdates;
  static DateTime? _telecallerCacheTime;
  static List<dynamic>? _cachedKeyPersons;
  static DateTime? _keyPersonsCacheTime;
  static List<dynamic>? _cachedRelatives;
  static DateTime? _relativesCacheTime;

  static void invalidateCache({bool keepConfig = true}) {
    _cachedStudents = null;
    _cachedTasks.clear();
    _tasksCacheTime.clear();
    _cachedFollowups.clear();
    _followupsCacheTime.clear();
    _cachedTelecallerUpdates = null;
    _telecallerCacheTime = null;
    _cachedKeyPersons = null;
    _keyPersonsCacheTime = null;
    _cachedRelatives = null;
    _relativesCacheTime = null;
    if (!keepConfig) {
      _cachedColleges = null;
      _cachedConfigs = null;
      _configMap.clear();
      _configParentMap.clear();
    }
  }

  /// 4. Fetch Students List with instant cache-first (0ms) and offline fallback
  static Future<Map<String, dynamic>> getStudents({
    int limit = 1000,
    bool minimal = false,
    bool forceRefresh = false,
    String? search,
    String? startDate,
    String? endDate,
    String? reportType,
    String? group,
    String? village,
    String? mandal,
    String? schoolName,
    String? admissionStatus,
    String? profileStatus,
    String? preset,
  }) async {
    final isDefaultQuery = (search == null || search.isEmpty) &&
        (startDate == null || startDate.isEmpty) &&
        (endDate == null || endDate.isEmpty) &&
        (reportType == null || reportType.isEmpty) &&
        (group == null || group.isEmpty) &&
        (village == null || village.isEmpty) &&
        (mandal == null || mandal.isEmpty) &&
        (schoolName == null || schoolName.isEmpty) &&
        (admissionStatus == null || admissionStatus.isEmpty) &&
        (profileStatus == null || profileStatus.isEmpty) &&
        (preset == null || preset.isEmpty);

    final localStudents = OfflineService.getCachedStudents();

    // 1. FAST RETURN: If default query and not force refreshing, return instantly
    if (!forceRefresh && isDefaultQuery) {
      if (_cachedStudents != null && _cachedStudents!.isNotEmpty) {
        _triggerSilentStudentsRefresh(limit, minimal);
        return {
          'success': true,
          'students': _cachedStudents!,
          'total': _cachedStudents!.length,
        };
      }
      if (localStudents != null && localStudents.isNotEmpty) {
        _cachedStudents = localStudents;
        _studentsCacheTime = DateTime.now();
        _triggerSilentStudentsRefresh(limit, minimal);
        return {
          'success': true,
          'students': localStudents,
          'total': localStudents.length,
          'offline': true,
        };
      }
    }

    try {
      final headers = await getAuthHeaders();
      final queryParams = {'limit': limit.toString()};
      if (minimal) queryParams['minimal'] = 'true';
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (startDate != null && startDate.isNotEmpty) queryParams['startDate'] = startDate;
      if (endDate != null && endDate.isNotEmpty) queryParams['endDate'] = endDate;
      if (reportType != null && reportType.isNotEmpty) queryParams['reportType'] = reportType;
      if (group != null && group.isNotEmpty) queryParams['group'] = group;
      if (village != null && village.isNotEmpty) queryParams['village'] = village;
      if (mandal != null && mandal.isNotEmpty) queryParams['mandal'] = mandal;
      if (schoolName != null && schoolName.isNotEmpty) queryParams['schoolName'] = schoolName;
      if (admissionStatus != null && admissionStatus.isNotEmpty) queryParams['admissionStatus'] = admissionStatus;
      if (profileStatus != null && profileStatus.isNotEmpty) queryParams['profileStatus'] = profileStatus;
      if (preset != null && preset.isNotEmpty) queryParams['preset'] = preset;
      final uri = await buildUri('/api/students', queryParams);
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final students = data['students'] ?? (data is List ? data : []);
        final total = data['total'] ?? (students is List ? students.length : 0);
        if (isDefaultQuery && students is List) {
          _cachedStudents = List<dynamic>.from(students);
          _studentsCacheTime = DateTime.now();
          await OfflineService.saveStudents(_cachedStudents!);
        }
        // Auto-sync pending actions in background since network is confirmed alive
        syncPendingOfflineActions();
        return {
          'success': true,
          'students': students,
          'total': total,
        };
      } else {
        if (localStudents != null && localStudents.isNotEmpty) {
          _cachedStudents = localStudents;
          return {
            'success': true,
            'students': localStudents,
            'total': localStudents.length,
            'offline': true,
          };
        }
        return {'success': false, 'error': data['error'] ?? 'Failed to load students.'};
      }
    } catch (e) {
      // Offline fallback: return cached students
      if (localStudents != null && localStudents.isNotEmpty) {
        _cachedStudents = localStudents;
        return {
          'success': true,
          'students': localStudents,
          'total': localStudents.length,
          'offline': true,
        };
      }
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  static void _triggerSilentStudentsRefresh(int limit, bool minimal) {
    Future.microtask(() async {
      try {
        final headers = await getAuthHeaders();
        final queryParams = {'limit': limit.toString()};
        if (minimal) queryParams['minimal'] = 'true';
        final uri = await buildUri('/api/students', queryParams);
        final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final students = data['students'] ?? (data is List ? data : []);
          if (students is List) {
            _cachedStudents = List<dynamic>.from(students);
            _studentsCacheTime = DateTime.now();
            await OfflineService.saveStudents(_cachedStudents!);
          }
          syncPendingOfflineActions();
        }
      } catch (_) {}
    });
  }

  // 3. Add Student - Online + Offline Queue Support
  static Future<Map<String, dynamic>> addStudent(Map<String, dynamic> studentData) async {
    try {
      final res = await addStudentToServerOnly(studentData);
      if (res['success'] == true) {
        final saved = res['data']?['student'] ?? studentData;
        await OfflineService.addOfflineStudentLocally(Map<String, dynamic>.from(saved));
        _cachedStudents = OfflineService.getCachedStudents();
        return res;
      }
      return res;
    } catch (e) {
      // Offline fallback: save locally and enqueue for background sync
      await OfflineService.addOfflineStudentLocally(studentData);
      await OfflineService.enqueueAction(actionType: 'add_student', payload: studentData);
      _cachedStudents = OfflineService.getCachedStudents();
      return {
        'success': true,
        'offline': true,
        'message': 'Student saved offline! Will sync automatically when connected.',
      };
    }
  }

  static Future<Map<String, dynamic>> addStudentToServerOnly(Map<String, dynamic> studentData) async {
    final headers = await getAuthHeaders();
    final uri = await buildUri('/api/students');
    final response = await http.post(
      uri,
      headers: headers,
      body: jsonEncode(studentData),
    ).timeout(const Duration(seconds: 12));

    final data = jsonDecode(response.body);

    if (response.statusCode == 200 || response.statusCode == 201) {
      _cachedStudents = null;
      _studentsCacheTime = null;
      return {'success': true, 'data': data};
    } else {
      return {
        'success': false,
        'error': data['error'] ?? 'Failed to save student. Status: ${response.statusCode}'
      };
    }
  }

  // 3b. Update Student - Online + Offline Queue Support
  static Future<Map<String, dynamic>> updateStudent(String studentId, Map<String, dynamic> studentData) async {
    try {
      final res = await updateStudentToServerOnly(studentId, studentData);
      if (res['success'] == true) {
        final serverStudent = res['data']?['student'];
        final updatedMap = (serverStudent is Map) ? Map<String, dynamic>.from(serverStudent) : studentData;
        await OfflineService.updateStudentLocally(studentId, updatedMap);
        _cachedStudents = OfflineService.getCachedStudents();
        return res;
      }
      return res;
    } catch (e) {
      await OfflineService.updateStudentLocally(studentId, studentData);
      await OfflineService.enqueueAction(actionType: 'update_student', payload: {'studentId': studentId, ...studentData});
      _cachedStudents = OfflineService.getCachedStudents();
      return {
        'success': true,
        'offline': true,
        'message': 'Student updated offline! Will sync automatically when connected.',
      };
    }
  }

  static Future<Map<String, dynamic>> updateStudentToServerOnly(String studentId, Map<String, dynamic> studentData) async {
    final headers = await getAuthHeaders();
    final uri = await buildUri('/api/students/$studentId');
    final response = await http.put(
      uri,
      headers: headers,
      body: jsonEncode(studentData),
    ).timeout(const Duration(seconds: 12));

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 || response.statusCode == 201) {
      _cachedStudents = null;
      _studentsCacheTime = null;
      return {'success': true, 'data': data};
    } else {
      return {
        'success': false,
        'error': data['error'] ?? 'Failed to update student. Status: ${response.statusCode}'
      };
    }
  }

  // 3b-1. Admit Student helper
  static Future<Map<String, dynamic>> admitStudent({
    required String studentId,
    required String joinedCollegeId,
    String? collegeBranchId,
    String? applicationNumber,
    String? studentPhoto,
    String? applicationPhoto,
    String? remarks,
  }) async {
    final payload = <String, dynamic>{
      'leadStatus': 'Admitted',
      'joinedCollegeId': joinedCollegeId,
      'collegeBranchId': collegeBranchId ?? joinedCollegeId,
      'applicationNumber': applicationNumber ?? '',
      'admissionDate': DateTime.now().toIso8601String(),
    };
    if (studentPhoto != null && studentPhoto.isNotEmpty) payload['studentPhoto'] = studentPhoto;
    if (applicationPhoto != null && applicationPhoto.isNotEmpty) payload['applicationPhoto'] = applicationPhoto;
    if (remarks != null && remarks.isNotEmpty) payload['remarks'] = remarks;
    return await updateStudent(studentId, payload);
  }

  // 3b-2. Update Student Photos helper
  static Future<Map<String, dynamic>> updateStudentPhotos({
    required String studentId,
    String? studentPhoto,
    String? applicationPhoto,
  }) async {
    final payload = <String, dynamic>{};
    if (studentPhoto != null) payload['studentPhoto'] = studentPhoto;
    if (applicationPhoto != null) payload['applicationPhoto'] = applicationPhoto;
    return await updateStudent(studentId, payload);
  }

  // 3c. Get Student by ID
  static Future<Map<String, dynamic>> getStudentById(String studentId) async {
    // 1. Try to fetch fresh and complete student details from server first
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/students/$studentId');
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 8));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['student'] != null) {
        final serverStudent = Map<String, dynamic>.from(data['student'] as Map);
        await OfflineService.updateStudentLocally(studentId, serverStudent);
        return {'success': true, 'student': serverStudent};
      }
    } catch (_) {}

    // 2. Offline fallback: check in local cache
    final localList = OfflineService.getCachedStudents();
    if (localList != null) {
      for (final s in localList) {
        if (s is Map && s['id']?.toString() == studentId) {
          return {'success': true, 'student': s};
        }
      }
    }

    return {'success': false, 'error': 'Student not found'};
  }

  // 3d. Delete Student
  static Future<Map<String, dynamic>> deleteStudent(String studentId) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/students/$studentId');
      final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 8));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _cachedStudents = null;
        _studentsCacheTime = null;
        return {'success': true, 'message': data['message'] ?? 'Student deleted successfully'};
      }
      return {'success': false, 'error': data['error'] ?? 'Failed to delete student'};
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // Location Filters
  static Future<Map<String, dynamic>> getStudentFilters({
    String? mandal,
    String? village,
  }) async {
    try {
      final headers = await getAuthHeaders();
      final queryParams = <String, String>{};
      if (mandal != null && mandal.isNotEmpty) queryParams['mandal'] = mandal;
      if (village != null && village.isNotEmpty) queryParams['village'] = village;
      final uri = await buildUri('/api/students/filters', queryParams);
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'mandals': (data['mandals'] as List<dynamic>?) ?? [],
          'villages': (data['villages'] as List<dynamic>?) ?? [],
          'schools': (data['schools'] as List<dynamic>?) ?? [],
        };
      }
      return {'success': false, 'mandals': [], 'villages': [], 'schools': []};
    } catch (e) {
      return {'success': false, 'mandals': [], 'villages': [], 'schools': []};
    }
  }

  // Colleges List (cached offline)
  static Future<List<dynamic>> getCollegesList({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedColleges != null && _cachedColleges!.isNotEmpty) {
      return _cachedColleges!;
    }
    final local = OfflineService.getCachedColleges();
    if (local != null && local.isNotEmpty && !forceRefresh) {
      _cachedColleges = local;
      return local;
    }

    if (_collegesInFlight != null) return _collegesInFlight!;

    _collegesInFlight = Future<List<dynamic>>(() async {
      try {
        final headers = await getAuthHeaders();
        final session = await getSession();
        final queryParams = <String, String>{};
        if (session['identifier'] != null && session['identifier']!.isNotEmpty) {
          queryParams['employeeId'] = session['identifier']!;
        }
        final uri = await buildUri('/api/colleges/list', queryParams.isNotEmpty ? queryParams : null);
        final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 8));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final list = (data['branches'] ?? data['colleges'] as List<dynamic>?) ?? [];
          _cachedColleges = list;
          await OfflineService.saveColleges(list);
          return list;
        }
        return local ?? [];
      } catch (_) {
        return local ?? _cachedColleges ?? [];
      }
    });

    try {
      return await _collegesInFlight!;
    } finally {
      _collegesInFlight = null;
    }
  }

  // 4b. College Branches CRUD API
  static Future<List<dynamic>> getCollegeBranches({bool forceRefresh = false}) async {
    try {
      final headers = await getAuthHeaders();
      final session = await getSession();
      final queryParams = <String, String>{};
      if (session['identifier'] != null && session['identifier']!.isNotEmpty) {
        queryParams['employeeId'] = session['identifier']!;
      }
      final uri = await buildUri('/api/college-branches', queryParams.isNotEmpty ? queryParams : null);
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data['branches'] as List<dynamic>?) ?? [];
        _cachedColleges = list;
        await OfflineService.saveColleges(list);
        return list;
      }
    } catch (_) {}
    return getCollegesList(forceRefresh: forceRefresh);
  }

  static Future<Map<String, dynamic>> createCollegeBranch({
    required String name,
    String? code,
    String? location,
    String? phone,
  }) async {
    try {
      final headers = await getAuthHeaders();
      final session = await getSession();
      final empId = session['identifier'] ?? '';
      final queryParams = <String, String>{};
      if (empId.isNotEmpty) {
        queryParams['employeeId'] = empId;
      }
      final uri = await buildUri('/api/college-branches', queryParams.isNotEmpty ? queryParams : null);
      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({
          'name': name.trim(),
          if (code != null && code.isNotEmpty) 'code': code.trim(),
          if (location != null && location.isNotEmpty) 'location': location.trim(),
          if (phone != null && phone.isNotEmpty) 'phone': phone.trim(),
          if (empId.isNotEmpty) 'employeeId': empId,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        _cachedColleges = null;
        return {'success': true, 'branch': data['branch']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to create branch'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> updateCollegeBranch({
    required String id,
    required String name,
    String? code,
    String? location,
    String? phone,
    bool? isActive,
  }) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/college-branches/$id');
        final payload = <String, dynamic>{
          'name': name.trim(),
          'code': code != null && code.isNotEmpty ? code.trim() : null,
          'location': location != null && location.isNotEmpty ? location.trim() : null,
          'phone': phone != null && phone.isNotEmpty ? phone.trim() : null,
        };
        if (isActive != null) payload['isActive'] = isActive;

        final response = await http.put(
          uri,
          headers: headers,
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _cachedColleges = null;
        return {'success': true, 'branch': data['branch']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to update branch'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> deleteCollegeBranch(String id) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/college-branches/$id');
      final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _cachedColleges = null;
        return {'success': true, 'message': data['message'] ?? 'Branch deleted'};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to delete branch'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  // 5. Record Village Visit - Online + Offline Queue Support
  static Future<Map<String, dynamic>> recordVisit({
    required String studentId,
    String? visitId,
    required String remarks,
    required String visitDate,
    String? nextFollowUpType,
    String? nextFollowUpDate,
    String? leadStatus,
    String? joinedCollegeId,
    String? applicationNumber,
  }) async {
    final payload = {
      'studentId': studentId,
      'visitId': ?visitId,
      'remarks': remarks,
      'visitDate': visitDate,
      'nextFollowUpType': ?nextFollowUpType,
      'nextFollowUpDate': ?nextFollowUpDate,
      'leadStatus': ?leadStatus,
      'joinedCollegeId': ?joinedCollegeId,
      'applicationNumber': ?applicationNumber,
    };

    try {
      final res = await recordVisitToServerOnly(payload);
      if (res['success'] == true) {
        await OfflineService.updateStudentLocally(studentId, {
          'doorstepCompleted': true,
          'leadStatus': ?leadStatus,
          if (remarks.isNotEmpty) 'remarks': remarks,
        });
        _cachedStudents = OfflineService.getCachedStudents();
        _studentsCacheTime = null;
        _cachedFollowups.clear();
        _followupsCacheTime.clear();
        return res;
      }
      return res;
    } catch (e) {
      // Offline fallback
      await OfflineService.enqueueAction(actionType: 'record_visit', payload: payload);
      await OfflineService.updateStudentLocally(studentId, {
        'doorstepCompleted': true,
        'leadStatus': ?leadStatus,
        if (remarks.isNotEmpty) 'remarks': remarks,
      });
      _cachedStudents = OfflineService.getCachedStudents();
      return {
        'success': true,
        'offline': true,
        'message': 'Visit recorded offline! Will sync automatically when internet is available.',
      };
    }
  }

  static Future<Map<String, dynamic>> recordVisitToServerOnly(Map<String, dynamic> payload) async {
    final studentId = payload['studentId'];
    final headers = await getAuthHeaders();
    final uri = await buildUri('/api/students/$studentId/visits');
    final response = await http.post(
      uri,
      headers: headers,
      body: jsonEncode(payload),
    ).timeout(const Duration(seconds: 12));

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return {'success': true, 'data': data};
    } else {
      return {'success': false, 'error': data['error'] ?? 'Failed to save visit'};
    }
  }

  // 6. Fetch Follow-up Students (today, action, upcoming)
  static Future<Map<String, dynamic>> getFollowups(String tab, {bool forceRefresh = false}) async {
    final local = OfflineService.getCachedFollowups(tab);
    if (!forceRefresh) {
      if (_cachedFollowups.containsKey(tab)) {
        return {'success': true, 'students': _cachedFollowups[tab]!};
      }
      if (local != null && local.isNotEmpty) {
        final validLocal = local.where((s) {
          if (s is! Map) return false;
          final status = (s['leadStatus'] ?? '').toString();
          if (status == 'Admitted') return false;
          final nd = (s['nextFollowUpDate'] ?? '').toString();
          final nt = (s['nextFollowUpType'] ?? '').toString();
          return nd.isNotEmpty || nt.isNotEmpty;
        }).toList();
        _cachedFollowups[tab] = validLocal;
        return {'success': true, 'students': validLocal, 'offline': true};
      }
    }

    try {
      final headers = await getAuthHeaders();
      final session = await getSession();
      final queryParams = <String, String>{
        'followup': tab,
        'limit': '200',
        'minimal': 'true',
      };
      if (session['identifier'] != null && session['identifier']!.isNotEmpty) {
        queryParams['employeeId'] = session['identifier']!;
      }
      final uri = await buildUri('/api/students', queryParams);
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final rawStudents = (data['students'] as List<dynamic>?) ?? [];
        final students = rawStudents.where((s) {
          if (s is! Map) return false;
          final status = (s['leadStatus'] ?? '').toString();
          if (status == 'Admitted') return false;
          final nd = (s['nextFollowUpDate'] ?? '').toString();
          final nt = (s['nextFollowUpType'] ?? '').toString();
          return nd.isNotEmpty || nt.isNotEmpty;
        }).toList();
        _cachedFollowups[tab] = students;
        _followupsCacheTime[tab] = DateTime.now();
        await OfflineService.saveFollowups(tab, students);
        return {'success': true, 'students': students};
      } else {
        if (local != null) return {'success': true, 'students': local, 'offline': true};
        return {'success': false, 'error': data['error'] ?? 'Failed to load followups'};
      }
    } catch (e) {
      if (local != null) return {'success': true, 'students': local, 'offline': true};
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 7. Get Employee Tasks & Stats
  static Future<Map<String, dynamic>> getTasks({String status = 'ALL', bool forceRefresh = false}) async {
    final local = OfflineService.getCachedTasks(status);
    if (!forceRefresh) {
      if (_cachedTasks.containsKey(status)) return _cachedTasks[status]!;
      if (local != null) {
        _cachedTasks[status] = local;
        return local;
      }
    }

    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/employee/tasks', {'status': status});
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final res = {
          'success': true,
          'tasks': data['tasks'] ?? [],
          'stats': data['stats'] ?? {},
        };
        _cachedTasks[status] = res;
        _tasksCacheTime[status] = DateTime.now();
        await OfflineService.saveTasks(status, res);
        return res;
      } else {
        if (local != null) return local;
        return {'success': false, 'error': data['error'] ?? 'Failed to load tasks'};
      }
    } catch (e) {
      if (local != null) return local;
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 8. Create New Task
  static Future<Map<String, dynamic>> createTask(Map<String, dynamic> taskData) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/employee/tasks');
      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode(taskData),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        _cachedTasks.clear();
        _tasksCacheTime.clear();
        return {'success': true, 'task': data['task']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to create task'};
      }
    } catch (e) {
      await OfflineService.enqueueAction(actionType: 'create_task', payload: taskData);
      return {
        'success': true,
        'offline': true,
        'message': 'Task created offline! Will sync automatically.',
      };
    }
  }

  // 9. Update Task Status
  static Future<Map<String, dynamic>> updateTaskStatus(String taskId, String status, {String? notes}) async {
    try {
      return await updateTaskStatusToServerOnly(taskId, status, notes: notes);
    } catch (e) {
      await OfflineService.enqueueAction(
        actionType: 'update_task',
        payload: {'taskId': taskId, 'status': status, 'notes': notes},
      );
      return {
        'success': true,
        'offline': true,
        'message': 'Task status updated offline! Will sync automatically.',
      };
    }
  }

  static Future<Map<String, dynamic>> updateTaskStatusToServerOnly(String taskId, String status, {String? notes}) async {
    final headers = await getAuthHeaders();
    final uri = await buildUri('/api/employee/tasks/$taskId');
    final response = await http.put(
      uri,
      headers: headers,
      body: jsonEncode({
        'status': status,
        'completionNotes': ?notes,
      }),
    ).timeout(const Duration(seconds: 10));

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      _cachedTasks.clear();
      _tasksCacheTime.clear();
      return {'success': true, 'task': data['task']};
    } else {
      return {'success': false, 'error': data['error'] ?? 'Failed to update task'};
    }
  }

  // 10. Get Telecaller Updates
  static Future<Map<String, dynamic>> getTelecallerUpdates({int page = 1, int limit = 20, bool forceRefresh = false}) async {
    final local = OfflineService.getCachedTelecallerUpdates();
    if (!forceRefresh && page == 1) {
      if (_cachedTelecallerUpdates != null && _telecallerCacheTime != null) return _cachedTelecallerUpdates!;
      if (local != null) return local;
    }

    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/employee/telecaller-updates', {
        'page': page.toString(),
        'limit': limit.toString(),
      });
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final res = {
          'success': true,
          'updates': data['updates'] ?? [],
          'pagination': data['pagination'] ?? {},
        };
        if (page == 1) {
          _cachedTelecallerUpdates = res;
          _telecallerCacheTime = DateTime.now();
          await OfflineService.saveTelecallerUpdates(res);
        }
        return res;
      } else {
        if (local != null && page == 1) return local;
        return {'success': false, 'error': data['error'] ?? 'Failed to load telecaller updates'};
      }
    } catch (e) {
      if (local != null && page == 1) return local;
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 11. Get Key Persons
  static Future<Map<String, dynamic>> getKeyPersons({bool forceRefresh = false}) async {
    final local = OfflineService.getCachedKeyPersons();
    if (!forceRefresh) {
      if (_cachedKeyPersons != null && _keyPersonsCacheTime != null) return {'success': true, 'keyPersons': _cachedKeyPersons!};
      if (local != null) return {'success': true, 'keyPersons': local, 'offline': true};
    }

    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/key-persons');
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final list = (data['keyPersons'] as List<dynamic>?) ?? [];
        _cachedKeyPersons = list;
        _keyPersonsCacheTime = DateTime.now();
        await OfflineService.saveKeyPersons(list);
        return {'success': true, 'keyPersons': list};
      } else {
        if (local != null) return {'success': true, 'keyPersons': local, 'offline': true};
        return {'success': false, 'error': data['error'] ?? 'Failed to load key persons'};
      }
    } catch (e) {
      if (local != null) return {'success': true, 'keyPersons': local, 'offline': true};
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 12. Add Key Person
  static Future<Map<String, dynamic>> addKeyPerson(Map<String, dynamic> personData) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/key-persons');
      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode(personData),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        _cachedKeyPersons = null;
        _keyPersonsCacheTime = null;
        return {'success': true, 'keyPerson': data['keyPerson']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to add key person'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 12b. Update Key Person
  static Future<Map<String, dynamic>> updateKeyPerson(String id, Map<String, dynamic> personData) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/key-persons/$id');
      final response = await http.put(
        uri,
        headers: headers,
        body: jsonEncode(personData),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _cachedKeyPersons = null;
        _keyPersonsCacheTime = null;
        return {'success': true, 'keyPerson': data['keyPerson']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to update key person'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 12c. Delete Key Person
  static Future<Map<String, dynamic>> deleteKeyPerson(String id) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/key-persons/$id');
      final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _cachedKeyPersons = null;
        _keyPersonsCacheTime = null;
        return {'success': true};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to delete key person'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 13. Get Village Relatives (Relative of employee in village)
  static Future<Map<String, dynamic>> getRelatives({
    bool forceRefresh = false,
    String? mandal,
    String? village,
    String? search,
  }) async {
    final local = OfflineService.getCachedRelatives();
    if (!forceRefresh && mandal == null && village == null && search == null) {
      if (_cachedRelatives != null && _relativesCacheTime != null) {
        return {'success': true, 'relatives': _cachedRelatives!};
      }
      if (local != null) {
        return {'success': true, 'relatives': local, 'offline': true};
      }
    }

    try {
      final headers = await getAuthHeaders();
      final queryParams = <String, String>{};
      if (mandal != null && mandal.isNotEmpty) queryParams['mandal'] = mandal;
      if (village != null && village.isNotEmpty) queryParams['village'] = village;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final uri = await buildUri('/api/relatives', queryParams);
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final list = (data['relatives'] as List<dynamic>?) ?? [];
        if (mandal == null && village == null && search == null) {
          _cachedRelatives = list;
          _relativesCacheTime = DateTime.now();
          await OfflineService.saveRelatives(list);
        }
        return {'success': true, 'relatives': list, 'total': data['total'] ?? list.length};
      } else {
        if (local != null) return {'success': true, 'relatives': local, 'offline': true};
        return {'success': false, 'error': data['error'] ?? 'Failed to load relatives'};
      }
    } catch (e) {
      if (local != null) return {'success': true, 'relatives': local, 'offline': true};
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 14. Add Village Relative
  static Future<Map<String, dynamic>> addRelative(Map<String, dynamic> relativeData) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/relatives');
      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode(relativeData),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        _cachedRelatives = null;
        _relativesCacheTime = null;
        return {'success': true, 'relative': data['relative']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to add relative'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 15. Update Village Relative
  static Future<Map<String, dynamic>> updateRelative(String id, Map<String, dynamic> relativeData) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/relatives/$id');
      final response = await http.put(
        uri,
        headers: headers,
        body: jsonEncode(relativeData),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _cachedRelatives = null;
        _relativesCacheTime = null;
        return {'success': true, 'relative': data['relative']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to update relative'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 16. Delete Village Relative
  static Future<Map<String, dynamic>> deleteRelative(String id) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/relatives/$id');
      final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _cachedRelatives = null;
        _relativesCacheTime = null;
        return {'success': true};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to delete relative'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 17. WhatsApp Templates (Per-Employee Isolation)
  static Future<Map<String, dynamic>> getEmployeeWhatsAppTemplates() async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/employee/whatsapp-templates');
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'templates': data['templates'],
          'pamphletUrl': data['pamphletUrl'],
        };
      }
      return {'success': false, 'error': 'Failed to fetch employee templates'};
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  static Future<Map<String, dynamic>> saveEmployeeWhatsAppTemplates({
    required List<Map<String, dynamic>> templates,
    required String pamphletUrl,
  }) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/employee/whatsapp-templates');
      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({
          'templates': templates,
          'pamphletUrl': pamphletUrl,
        }),
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        return {'success': true};
      }
      return {'success': false, 'error': 'Failed to save employee templates'};
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 13. Analytics: Mandals Summary
  static Future<Map<String, dynamic>> getMandalsSummary() async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/reports/mandals-summary');
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'summaries': data['summaries'] ?? []};
      }
      return {'success': false, 'error': 'Failed to load analytics'};
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // 14. Analytics: Schools Progress
  static Future<Map<String, dynamic>> getSchoolsProgress(String mandalId) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/reports/schools-progress', {'mandalId': mandalId});
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'report': data['report'] ?? [], 'mandalName': data['reportTitleLocation'] ?? ''};
      }
      return {'success': false, 'error': 'Failed to load schools progress'};
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  // ================= AUTOMATIC BACKGROUND OFFLINE SYNC =================

  static bool _isSyncing = false;

  /// Automatically synchronizes any actions saved while the user was offline
  static Future<void> syncPendingOfflineActions() async {
    if (_isSyncing) return;
    final actions = OfflineService.getPendingActions();
    if (actions.isEmpty) return;

    _isSyncing = true;
    try {
      debugPrint('Syncing ${actions.length} pending offline actions to server...');
      for (int i = 0; i < actions.length; i++) {
        final item = actions[i];
        final type = item['actionType'];
        final payload = Map<String, dynamic>.from(item['payload'] as Map);
        bool success = false;

        try {
          if (type == 'add_student') {
            final res = await addStudentToServerOnly(payload);
            success = res['success'] == true;
          } else if (type == 'update_student') {
            final studentId = payload['studentId']?.toString() ?? '';
            final res = await updateStudentToServerOnly(studentId, payload);
            success = res['success'] == true;
          } else if (type == 'record_visit') {
            final res = await recordVisitToServerOnly(payload);
            success = res['success'] == true;
          } else if (type == 'update_task') {
            final taskId = payload['taskId']?.toString() ?? '';
            final status = payload['status']?.toString() ?? '';
            final notes = payload['notes']?.toString();
            final res = await updateTaskStatusToServerOnly(taskId, status, notes: notes);
            success = res['success'] == true;
          }
        } catch (e) {
          debugPrint('Error syncing offline action $type: $e');
          success = false;
        }

        if (success) {
          await OfflineService.removePendingAction(i);
          i--; // Adjust index
          debugPrint('Synced and removed action: $type');
        } else {
          // If a request fails, stop batch to avoid out-of-order execution
          break;
        }
      }
    } finally {
      _isSyncing = false;
    }
  }

  // ================= EMPLOYEE PROFILE SYNC =================

  static Future<Map<String, dynamic>?> getEmployeeProfile(String employeeId) async {
    try {
      final headers = await getAuthHeaders();
      final uri = await buildUri('/api/employee/profile', {'employeeId': employeeId.trim()});
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res['success'] == true && res['profile'] != null) {
          return res['profile'] as Map<String, dynamic>;
        }
      }
    } catch (e) {
      debugPrint('Error getting employee profile: $e');
    }
    return null;
  }

  static Future<bool> saveEmployeeProfile({
    required String employeeId,
    required String name,
    required String phone,
    required String collegeName,
  }) async {
    try {
      final headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      final uri = await buildUri('/api/employee/profile');
      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({
          'employeeId': employeeId.trim(),
          'name': name.trim(),
          'phone': phone.trim(),
          'collegeName': collegeName.trim(),
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        return res['success'] == true;
      }
      return false;
    } catch (e) {
      debugPrint('Error saving employee profile: $e');
      return false;
    }
  }
}
