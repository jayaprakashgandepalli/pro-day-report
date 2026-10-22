import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CallerIdService {
  static const MethodChannel _channel = MethodChannel('com.prodayreport.pro_mobile_app/caller_id');
  static const String _cacheKey = 'pro_caller_id_cache';

  /// Syncs students list to local cache for instant caller ID matching
  static Future<void> updateStudentsCache(List<dynamic> students, Map<String, String> configMap) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final Map<String, dynamic> lookup = {};

      String resolve(dynamic val) {
        if (val == null) return '';
        final str = val.toString().trim();
        return configMap[str] ?? str;
      }

      for (final item in students) {
        if (item is! Map) continue;
        final s = item;

        final rawPhone = (s['phone'] ?? '').toString();
        final rawWhatsApp = (s['whatsappNumber'] ?? s['whatsapp'] ?? '').toString();

        final name = (s['studentName'] ?? '').toString().trim();
        final school = resolve(s['schoolName']).trim();
        final mandal = resolve(s['mandal']).trim();
        final village = resolve(s['village']).trim();
        final group = resolve(s['group']).trim();
        final status = (s['leadStatus'] ?? '').toString().toLowerCase();
        final isStar = status.contains('star') || status.contains('prime');

        final studentData = {
          'id': (s['id'] ?? '').toString(),
          'name': name,
          'school': school,
          'mandal': mandal,
          'village': village,
          'group': group,
          'star': isStar,
        };

        void addNumber(String numStr) {
          final clean = numStr.replaceAll(RegExp(r'\D'), '');
          if (clean.length >= 10) {
            final last10 = clean.substring(clean.length - 10);
            lookup[last10] = studentData;
          }
        }

        if (rawPhone.isNotEmpty) addNumber(rawPhone);
        if (rawWhatsApp.isNotEmpty) addNumber(rawWhatsApp);
      }

      await prefs.setString(_cacheKey, jsonEncode(lookup));
      debugPrint('[CallerIdService] Cached ${lookup.length} student phone numbers for instant Caller ID');
    } catch (e) {
      debugPrint('[CallerIdService] Error updating caller ID cache: $e');
    }
  }

  /// Checks if Android call detection permissions are granted
  static Future<bool> hasPermissions() async {
    if (kIsWeb) return false;
    try {
      final res = await _channel.invokeMethod<bool>('checkPermissions');
      return res == true;
    } catch (_) {
      return false;
    }
  }

  /// Prompts Android runtime permission request dialog
  static Future<void> requestPermissions() async {
    if (kIsWeb) return;
    try {
      await _channel.invokeMethod('requestPermissions');
    } catch (_) {}
  }
}
