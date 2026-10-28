import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:ota_update/ota_update.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api_service.dart';

class AppUpdateService {
  static bool _isChecking = false;

  /// Check server for app updates. If a newer build is available, prompts the user to update.
  static Future<void> checkForUpdate(BuildContext context, {bool showNoUpdateToast = false}) async {
    // Only Android supports OTA package installation directly
    if (kIsWeb) return;
    if (_isChecking) return;
    _isChecking = true;

    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final currentBuild = int.tryParse(packageInfo.buildNumber) ?? 1;
      final currentVersion = packageInfo.version;

      final uri = await ApiService.buildUri('/api/app-version');
      final response = await http.get(uri).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          final serverBuild = int.tryParse(data['buildNumber']?.toString() ?? '1') ?? 1;
          final serverVersion = data['versionName']?.toString() ?? '1.0.0';
          final downloadUrl = data['downloadUrl']?.toString() ?? '';
          final releaseNotes = data['releaseNotes']?.toString() ?? '';

          if (serverBuild > currentBuild && downloadUrl.isNotEmpty && context.mounted) {
            _showUpdateDialog(
              context,
              currentVersion: currentVersion,
              currentBuild: currentBuild,
              serverVersion: serverVersion,
              serverBuild: serverBuild,
              downloadUrl: downloadUrl,
              releaseNotes: releaseNotes,
            );
            return;
          }
        }
      }

      if (showNoUpdateToast && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ App is up to date! (v$currentVersion)'),
            backgroundColor: const Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (showNoUpdateToast && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not check for updates. Check internet connection.'),
            backgroundColor: Color(0xFF64748B),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      _isChecking = false;
    }
  }

  static void _showUpdateDialog(
    BuildContext context, {
    required String currentVersion,
    required int currentBuild,
    required String serverVersion,
    required int serverBuild,
    required String downloadUrl,
    required String releaseNotes,
  }) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        double progress = 0.0;
        bool isDownloading = false;
        String statusText = '';
        String? errorMessage;

        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            void startOtaDownload() {
              setModalState(() {
                isDownloading = true;
                progress = 0.01;
                statusText = 'Starting download...';
                errorMessage = null;
              });

              try {
                OtaUpdate()
                    .execute(
                  downloadUrl,
                  destinationFilename: 'pro_day_report.apk',
                  androidProviderAuthority: 'com.prodayreport.pro_mobile_app.ota_update_provider',
                )
                    .listen(
                  (OtaEvent event) {
                    if (!modalCtx.mounted) return;
                    if (event.status == OtaStatus.DOWNLOADING) {
                      final pVal = double.tryParse(event.value ?? '0') ?? 0.0;
                      setModalState(() {
                        progress = (pVal / 100.0).clamp(0.0, 1.0);
                        statusText = 'Downloading update: ${pVal.toInt()}%';
                      });
                    } else if (event.status == OtaStatus.INSTALLING) {
                      setModalState(() {
                        progress = 1.0;
                        statusText = 'Opening installer...';
                      });
                    } else if (event.status == OtaStatus.INSTALLATION_DONE) {
                      setModalState(() {
                        progress = 1.0;
                        statusText = 'Update completed!';
                        isDownloading = false;
                      });
                    } else if (event.status == OtaStatus.ALREADY_RUNNING_ERROR) {
                      setModalState(() {
                        errorMessage = 'Download already in progress.';
                        isDownloading = false;
                      });
                    } else if (event.status == OtaStatus.PERMISSION_NOT_GRANTED_ERROR) {
                      setModalState(() {
                        errorMessage = 'Install permission required. Please allow app installs in Settings.';
                        isDownloading = false;
                      });
                    } else {
                      setModalState(() {
                        errorMessage = 'Update error (${event.status.name}): ${event.value ?? "Unknown"}. Tap below to download directly.';
                        isDownloading = false;
                      });
                    }
                  },
                  onError: (e) {
                    if (modalCtx.mounted) {
                      setModalState(() {
                        isDownloading = false;
                        errorMessage = 'Error downloading update: $e';
                      });
                    }
                  },
                );
              } catch (err) {
                setModalState(() {
                  isDownloading = false;
                  errorMessage = 'Could not start installer: $err';
                });
              }
            }

            return Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: const Icon(Icons.system_update_rounded, color: Color(0xFF2563EB), size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '🚀 New Update Available!',
                              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Current: v$currentVersion • Latest: v$serverVersion',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  const SizedBox(height: 14),

                  Text(
                    'A new version of PRO Day Report is ready to install with important bug fixes and improvements.',
                    style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF334155), height: 1.4),
                  ),

                  if (errorMessage != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            errorMessage!,
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF991B1B)),
                          ),
                          const SizedBox(height: 6),
                          InkWell(
                            onTap: () => launchUrl(Uri.parse(downloadUrl), mode: LaunchMode.externalApplication),
                            child: Text(
                              '👉 Tap here to download via Browser',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF2563EB)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  if (isDownloading) ...[
                    const SizedBox(height: 20),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: progress > 0 ? progress : null,
                        minHeight: 10,
                        backgroundColor: const Color(0xFFF1F5F9),
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Center(
                      child: Text(
                        statusText,
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF2563EB)),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  if (!isDownloading) ...[
                    Row(
                      children: [
                        Expanded(
                          flex: 1,
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(modalCtx),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              side: const BorderSide(color: Color(0xFFCBD5E1)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(
                              'Later',
                              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF64748B)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton.icon(
                            onPressed: startOtaDownload,
                            icon: const Icon(Icons.download_rounded, size: 18),
                            label: Text(
                              'Update Now',
                              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF16A34A),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Center(
                      child: TextButton.icon(
                        onPressed: () => launchUrl(Uri.parse(downloadUrl), mode: LaunchMode.externalApplication),
                        icon: const Icon(Icons.open_in_browser_rounded, size: 16, color: Color(0xFF2563EB)),
                        label: Text(
                          '🌐 బ్రౌజర్ ద్వారా డైరెక్ట్ డౌన్‌లోడ్ (Direct APK)',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF2563EB)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }
}
