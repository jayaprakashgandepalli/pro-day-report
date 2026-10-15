import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// OfflineService manages persistent caching of all application data
/// and queues offline write actions (adding students, recording visits, etc.)
/// so the app functions instantly and seamlessly even without internet.
class OfflineService {
  OfflineService._();

  static const String _keyStudents = 'offline_students_cache';
  static const String _keyConfigs = 'offline_configs_cache';
  static const String _keyColleges = 'offline_colleges_cache';
  static const String _keyTasksPrefix = 'offline_tasks_';
  static const String _keyFollowupsPrefix = 'offline_followups_';
  static const String _keyTelecallerUpdates = 'offline_telecaller_updates';
  static const String _keyKeyPersons = 'offline_key_persons';
  static const String _keyDashboardStats = 'offline_dashboard_stats';
  static const String _keyPendingActions = 'offline_pending_actions_queue';

  // Fast in-memory cache to guarantee 0ms instant UI responses
  static final Map<String, dynamic> _memoryCache = {};
  static bool _initialized = false;

  /// Initialize and warm up in-memory cache from SharedPreferences
  static Future<void> init() async {
    if (_initialized) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final key in prefs.getKeys()) {
        if (key.startsWith('offline_')) {
          final val = prefs.getString(key);
          if (val != null) {
            try {
              _memoryCache[key] = jsonDecode(val);
            } catch (_) {
              _memoryCache[key] = val;
            }
          }
        }
      }
      _initialized = true;
    } catch (e) {
      debugPrint('OfflineService.init error: $e');
    }
  }

  // Generic fast save to memory + async persist to disk
  static Future<void> _save(String key, dynamic data) async {
    _memoryCache[key] = data;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, jsonEncode(data));
    } catch (e) {
      debugPrint('OfflineService._save error for $key: $e');
    }
  }

  static dynamic _get(String key) {
    return _memoryCache[key];
  }

  // ================= STUDENTS CACHE =================

  static Future<void> saveStudents(List<dynamic> students) async {
    await _save(_keyStudents, students);
  }

  static List<dynamic>? getCachedStudents() {
    final data = _get(_keyStudents);
    if (data is List) return List<dynamic>.from(data);
    return null;
  }

  /// Appends an offline-created student locally so it appears in lists immediately
  static Future<void> addOfflineStudentLocally(Map<String, dynamic> student) async {
    final list = getCachedStudents() ?? [];
    // Ensure temporary id and offline flag
    final localStudent = Map<String, dynamic>.from(student);
    localStudent['id'] ??= 'offline_${DateTime.now().millisecondsSinceEpoch}';
    localStudent['_isOffline'] = true;
    localStudent['createdAt'] ??= DateTime.now().toIso8601String();
    list.insert(0, localStudent);
    await saveStudents(list);
  }

  /// Updates a student locally
  static Future<void> updateStudentLocally(String studentId, Map<String, dynamic> updateData) async {
    final list = getCachedStudents();
    if (list == null) return;
    for (int i = 0; i < list.length; i++) {
      if (list[i] is Map && list[i]['id']?.toString() == studentId) {
        final merged = Map<String, dynamic>.from(list[i]);
        merged.addAll(updateData);
        merged['_isOffline'] = true;
        list[i] = merged;
        break;
      }
    }
    await saveStudents(list);
  }

  // ================= CONFIGS & COLLEGESS CACHE =================

  static Future<void> saveConfigs(List<dynamic> configs) async {
    await _save(_keyConfigs, configs);
  }

  static List<dynamic>? getCachedConfigs() {
    final data = _get(_keyConfigs);
    if (data is List) return List<dynamic>.from(data);
    return null;
  }

  static Future<void> saveColleges(List<dynamic> colleges) async {
    await _save(_keyColleges, colleges);
  }

  static List<dynamic>? getCachedColleges() {
    final data = _get(_keyColleges);
    if (data is List) return List<dynamic>.from(data);
    return null;
  }

  // ================= TASKS & FOLLOWUPS =================

  static Future<void> saveTasks(String status, Map<String, dynamic> data) async {
    await _save('$_keyTasksPrefix$status', data);
  }

  static Map<String, dynamic>? getCachedTasks(String status) {
    final data = _get('$_keyTasksPrefix$status');
    if (data is Map) return Map<String, dynamic>.from(data);
    return null;
  }

  static Future<void> saveFollowups(String tab, List<dynamic> students) async {
    await _save('$_keyFollowupsPrefix$tab', students);
  }

  static List<dynamic>? getCachedFollowups(String tab) {
    final data = _get('$_keyFollowupsPrefix$tab');
    if (data is List) return List<dynamic>.from(data);
    return null;
  }

  // ================= TELECALLER & KEY PERSONS =================

  static Future<void> saveTelecallerUpdates(Map<String, dynamic> data) async {
    await _save(_keyTelecallerUpdates, data);
  }

  static Map<String, dynamic>? getCachedTelecallerUpdates() {
    final data = _get(_keyTelecallerUpdates);
    if (data is Map) return Map<String, dynamic>.from(data);
    return null;
  }

  static Future<void> saveKeyPersons(List<dynamic> list) async {
    await _save(_keyKeyPersons, list);
  }

  static List<dynamic>? getCachedKeyPersons() {
    final data = _get(_keyKeyPersons);
    if (data is List) return List<dynamic>.from(data);
    return null;
  }

  // ================= DASHBOARD STATS =================

  static Future<void> saveDashboardStats(Map<String, dynamic> stats) async {
    await _save(_keyDashboardStats, stats);
  }

  static Map<String, dynamic>? getCachedDashboardStats() {
    final data = _get(_keyDashboardStats);
    if (data is Map) return Map<String, dynamic>.from(data);
    return null;
  }

  // ================= OFFLINE ACTION QUEUE =================

  /// Enqueue an action to be synchronized when internet returns
  static Future<void> enqueueAction({
    required String actionType,
    required Map<String, dynamic> payload,
  }) async {
    final queue = getPendingActions();
    queue.add({
      'actionType': actionType,
      'payload': payload,
      'timestamp': DateTime.now().toIso8601String(),
    });
    await _save(_keyPendingActions, queue);
    debugPrint('OfflineService: Enqueued action "$actionType" (Queue size: ${queue.length})');
  }

  /// Get list of pending offline actions
  static List<Map<String, dynamic>> getPendingActions() {
    final data = _get(_keyPendingActions);
    if (data is List) {
      return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  /// Clear the entire queue or successfully synced items
  static Future<void> clearPendingActions() async {
    await _save(_keyPendingActions, []);
  }

  /// Remove single item after successful sync
  static Future<void> removePendingAction(int index) async {
    final queue = getPendingActions();
    if (index >= 0 && index < queue.length) {
      queue.removeAt(index);
      await _save(_keyPendingActions, queue);
    }
  }

  /// Check if there are pending actions
  static int get pendingActionsCount => getPendingActions().length;
}
