import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RemarksPresetService {
  RemarksPresetService._();

  static String? _activeEmployeeId;
  static List<String>? _cachedPresets;

  static const List<String> defaultPresets = [
    'Met parents & student together',
    'Very positive - Promised to join',
    'Promised to visit college campus',
    'Asked for fee concession / discount',
    'Waiting for results to decide',
    'Door locked / Family not available',
    'Student outside, met parents only',
    'Confused on group selection (MPC/BiPC)',
    'Comparing with other colleges',
    'Asked to call back after 3 days',
  ];

  static Future<void> setActiveEmployee(String? employeeId) async {
    final cleanId = employeeId?.trim();
    if (_activeEmployeeId == cleanId && _cachedPresets != null) return;
    _activeEmployeeId = cleanId;
    _cachedPresets = null;
  }

  static Future<void> _ensureActiveEmployee() async {
    if (_activeEmployeeId == null || _activeEmployeeId!.isEmpty) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final id = prefs.getString('user_identifier');
        if (id != null && id.isNotEmpty) {
          _activeEmployeeId = id;
        }
      } catch (_) {}
    }
  }

  static String get _keyPresets => (_activeEmployeeId != null && _activeEmployeeId!.isNotEmpty)
      ? 'custom_remarks_presets_v1_$_activeEmployeeId'
      : 'custom_remarks_presets_v1_common';

  /// Get combined list of presets (defaults + custom presets)
  static Future<List<String>> getPresets() async {
    if (_cachedPresets != null) {
      return List<String>.from(_cachedPresets!);
    }

    await _ensureActiveEmployee();
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyPresets);
      List<String> customList = [];
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          customList = decoded.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
        }
      }

      // Merge defaults with custom (avoid exact duplicates)
      final merged = <String>[...defaultPresets];
      for (final item in customList) {
        if (!merged.contains(item)) {
          merged.add(item);
        }
      }

      _cachedPresets = merged;
      return List<String>.from(merged);
    } catch (e) {
      debugPrint('Error loading remarks presets: $e');
      return List<String>.from(defaultPresets);
    }
  }

  /// Add custom preset for active employee
  static Future<bool> addCustomPreset(String newPreset) async {
    final clean = newPreset.trim();
    if (clean.isEmpty) return false;

    await _ensureActiveEmployee();
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyPresets);
      List<String> customList = [];
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          customList = decoded.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
        }
      }

      if (!customList.contains(clean) && !defaultPresets.contains(clean)) {
        customList.add(clean);
        await prefs.setString(_keyPresets, jsonEncode(customList));
      }

      _cachedPresets = null; // Invalidate cache
      return true;
    } catch (e) {
      debugPrint('Error adding custom preset: $e');
      return false;
    }
  }

  /// Delete a custom preset for active employee
  static Future<bool> deleteCustomPreset(String preset) async {
    await _ensureActiveEmployee();
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyPresets);
      if (raw == null || raw.isEmpty) return false;

      final decoded = jsonDecode(raw);
      if (decoded is List) {
        final customList = decoded.map((e) => e.toString().trim()).where((e) => e != preset.trim()).toList();
        await prefs.setString(_keyPresets, jsonEncode(customList));
        _cachedPresets = null;
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error deleting custom preset: $e');
      return false;
    }
  }

  /// Check if preset is a default preset (cannot be deleted)
  static bool isDefaultPreset(String preset) {
    return defaultPresets.contains(preset.trim());
  }
}
