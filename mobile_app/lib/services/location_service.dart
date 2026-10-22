import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

class LocationService {
  /// Extracts latitude and longitude from student address string if tagged
  /// Supports: "[GPS: 17.6868, 83.2185]", "GPS: 17.6868, 83.2185", etc.
  static Map<String, double>? extractGps(String? rawAddress) {
    if (rawAddress == null || rawAddress.trim().isEmpty) return null;
    final text = rawAddress.trim();

    final regex = RegExp(r'\[?GPS:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\]?', caseSensitive: false);
    final match = regex.firstMatch(text);
    if (match != null) {
      final lat = double.tryParse(match.group(1) ?? '');
      final lng = double.tryParse(match.group(2) ?? '');
      if (lat != null && lng != null && lat != 0.0 && lng != 0.0) {
        return {'lat': lat, 'lng': lng};
      }
    }

    // Secondary fallback: plain "17.6868, 83.2185"
    final plainRegex = RegExp(r'^(\-?\d{1,2}\.\d+)\s*,\s*(\-?\d{1,3}\.\d+)$');
    final plainMatch = plainRegex.firstMatch(text);
    if (plainMatch != null) {
      final lat = double.tryParse(plainMatch.group(1) ?? '');
      final lng = double.tryParse(plainMatch.group(2) ?? '');
      if (lat != null && lng != null) {
        return {'lat': lat, 'lng': lng};
      }
    }

    return null;
  }

  /// Returns clean human landmark without the technical [GPS: ...] tag
  static String getCleanLandmark(String? rawAddress) {
    if (rawAddress == null || rawAddress.trim().isEmpty) return '';
    final text = rawAddress.trim();
    final clean = text
        .replaceAll(RegExp(r'\[?GPS:\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\]?', caseSensitive: false), '')
        .trim();
    return clean;
  }

  /// Formats landmark with GPS tag for persistence
  static String formatWithGps(String landmark, double lat, double lng) {
    final cleanLandmark = getCleanLandmark(landmark);
    final gpsTag = '[GPS: ${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}]';
    if (cleanLandmark.isEmpty) {
      return gpsTag;
    }
    return '$cleanLandmark $gpsTag';
  }

  /// Fetches current device GPS coordinates with user permission check
  static Future<Position?> getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Location services are not enabled
        return null;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return null;
      }

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
    } catch (e) {
      debugPrint('[LocationService] Error fetching current location: $e');
      return null;
    }
  }

  /// Opens Google Maps with turn-by-turn biking/driving navigation to the student's door
  static Future<bool> openGoogleMapsRoute({
    required double lat,
    required double lng,
    String? studentName,
  }) async {
    final destination = '$lat,$lng';

    // Primary web/app universal URL
    final webUrl = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$destination&travelmode=two-wheeler');

    // Android native navigation intent
    final nativeGeoUri = Uri.parse('google.navigation:q=$destination&mode=w');

    try {
      if (!kIsWeb && Platform.isAndroid) {
        if (await canLaunchUrl(nativeGeoUri)) {
          return await launchUrl(nativeGeoUri, mode: LaunchMode.externalApplication);
        }
      }
      return await launchUrl(webUrl, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('[LocationService] Error opening Google Maps: $e');
      return await launchUrl(webUrl, mode: LaunchMode.externalApplication);
    }
  }

  /// Opens Google Maps search if GPS is not yet pinned (e.g. search Village + Landmark)
  static Future<bool> searchLocationInMaps(String searchQuery) async {
    final query = Uri.encodeComponent(searchQuery.trim());
    final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    return await launchUrl(url, mode: LaunchMode.externalApplication);
  }
}
