import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../services/location_service.dart';
import '../../utils/pdf_downloader.dart';

class PdfReportScreen extends StatefulWidget {
  const PdfReportScreen({super.key});

  @override
  State<PdfReportScreen> createState() => _PdfReportScreenState();
}

class _PdfReportScreenState extends State<PdfReportScreen> {
  bool _loading = false;
  bool _generatingPdf = false;
  List<dynamic> _students = [];
  String _employeeName = 'Employee';
  String _collegeName = '';

  // Date Range
  bool _isAllTime = false;
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();

  // Report Category
  String _reportType = 'all'; // 'all', 'new_students', 'visits'

  // Location Filters
  String _filterMandal = '';
  String _filterVillage = '';
  String _filterSchool = '';
  List<dynamic> _mandals = [];
  List<dynamic> _villages = [];
  List<dynamic> _schools = [];

  // Available Columns to Download / Include
  final List<Map<String, String>> _availableColumns = [
    {'id': 'sno', 'label': 'S.No.'},
    {'id': 'studentName', 'label': 'Student Name'},
    {'id': 'fatherName', 'label': "Father's Name"},
    {'id': 'occupation', 'label': 'Occupation'},
    {'id': 'address', 'label': 'Address'},
    {'id': 'gps', 'label': 'GPS'},
    {'id': 'phone', 'label': 'Phone'},
    {'id': 'whatsapp', 'label': 'Alt. Phone'},
    {'id': 'group', 'label': 'Group'},
    {'id': 'visitNumber', 'label': 'Visit No.'},
    {'id': 'schoolName', 'label': 'School Name'},
    {'id': 'doorstep', 'label': 'Doorstep'},
    {'id': 'remarks', 'label': 'Remarks'},
  ];

  final List<String> _selectedColumns = [
    'sno',
    'studentName',
    'fatherName',
    'occupation',
    'address',
    'gps',
    'phone',
    'whatsapp',
    'group',
    'visitNumber',
    'schoolName',
    'doorstep',
    'remarks',
  ];

  @override
  void initState() {
    super.initState();
    _loadEmployeeName();
    _fetchStats();
    _fetchReportData();
  }

  Future<void> _loadEmployeeName() async {
    try {
      final session = await ApiService.getSession();
      final prefs = await SharedPreferences.getInstance();
      final storedName = prefs.getString('user_name') ?? session['name'];
      final storedCollege = prefs.getString('employee_college');
      if (mounted) {
        setState(() {
          if (storedName != null && storedName.isNotEmpty) {
            _employeeName = storedName;
          }
          if (storedCollege != null && storedCollege.trim().isNotEmpty) {
            _collegeName = storedCollege.trim();
          }
        });
      }
    } catch (_) {}
  }

  String _formatApiDate(DateTime dt) {
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  String _formatDisplayDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }

  Future<void> _fetchStats() async {
    try {
      await ApiService.getConfigMap();
      final res = await ApiService.getStudentFilters(
        mandal: _filterMandal,
        village: _filterVillage,
      );
      if (res['success'] == true && mounted) {
        setState(() {
          _mandals = res['mandals'] ?? [];
          _villages = res['villages'] ?? [];
          _schools = res['schools'] ?? [];
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchReportData() async {
    setState(() {
      _loading = true;
    });

    try {
      final res = await ApiService.getStudents(
        limit: 10000,
        startDate: _isAllTime ? null : _formatApiDate(_startDate),
        endDate: _isAllTime ? null : _formatApiDate(_endDate),
        reportType: _reportType,
        mandal: _filterMandal.isNotEmpty ? _filterMandal : null,
        village: _filterVillage.isNotEmpty ? _filterVillage : null,
        schoolName: _filterSchool.isNotEmpty ? _filterSchool : null,
      );

      if (!mounted) return;

      if (res['success'] == true) {
        setState(() {
          _students = (res['students'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['error'] ?? 'Failed to load report data')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading report: $e')),
      );
    }
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime(2023, 1, 1),
      lastDate: DateTime(2030, 12, 31),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate.isBefore(_startDate)) _endDate = _startDate;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  String get _reportTypeDisplay {
    if (_reportType == 'new_students') return 'New Students Only';
    if (_reportType == 'visits') return 'Village Visits Only';
    return 'All (New Students + Village Visits)';
  }

  String get _dateRangeDisplay {
    if (_isAllTime) return 'All Time (${_students.length} Leads)';
    if (_startDate.year == _endDate.year &&
        _startDate.month == _endDate.month &&
        _startDate.day == _endDate.day) {
      return _formatDisplayDate(_startDate);
    }
    return '${_formatDisplayDate(_startDate)} to ${_formatDisplayDate(_endDate)}';
  }

  // Generate PDF Document Bytes exactly matching web app (A4 Landscape, teal headers, summary)
  Future<Uint8List> _buildPdfDoc() async {
    final pdf = pw.Document();

    // Load active college name from SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    final storedCollege = prefs.getString('employee_college');
    final headerCollege = (storedCollege != null && storedCollege.trim().isNotEmpty)
        ? storedCollege.trim()
        : _collegeName.trim();

    // Preload hierarchy mappings for complete addresses
    final configParentMap = await ApiService.getConfigParentMap();

    // Headers & Column Widths
    final List<String> tableHeaders = [];
    final Map<int, pw.TableColumnWidth> columnWidths = {};
    int colIdx = 0;

    for (final col in _availableColumns) {
      final id = col['id']!;
      if (_selectedColumns.contains(id)) {
        tableHeaders.add(col['label']!);
        if (id == 'sno') {
          columnWidths[colIdx] = const pw.FixedColumnWidth(28);
        } else if (id == 'studentName') {
          columnWidths[colIdx] = const pw.FlexColumnWidth(2.2);
        } else if (id == 'fatherName') {
          columnWidths[colIdx] = const pw.FlexColumnWidth(2.0);
        } else if (id == 'occupation') {
          columnWidths[colIdx] = const pw.FlexColumnWidth(1.4);
        } else if (id == 'address') {
          columnWidths[colIdx] = const pw.FlexColumnWidth(3.0);
        } else if (id == 'gps') {
          columnWidths[colIdx] = const pw.FixedColumnWidth(64);
        } else if (id == 'phone') {
          columnWidths[colIdx] = const pw.FixedColumnWidth(64);
        } else if (id == 'whatsapp') {
          columnWidths[colIdx] = const pw.FixedColumnWidth(64);
        } else if (id == 'group') {
          columnWidths[colIdx] = const pw.FlexColumnWidth(1.3);
        } else if (id == 'visitNumber') {
          columnWidths[colIdx] = const pw.FixedColumnWidth(36);
        } else if (id == 'schoolName') {
          columnWidths[colIdx] = const pw.FlexColumnWidth(2.7);
        } else if (id == 'doorstep') {
          columnWidths[colIdx] = const pw.FixedColumnWidth(48);
        } else if (id == 'remarks') {
          columnWidths[colIdx] = const pw.FlexColumnWidth(4.0);
        }
        colIdx++;
      }
    }

    // Rows
    final List<List<String>> tableData = [];
    for (int i = 0; i < _students.length; i++) {
      final s = _students[i];
      final row = <String>[];

      // Full Hierarchical Address (Village, Mandal, District, Landmark)
      final villageId = s['village']?.toString() ?? '';
      final villageName = ApiService.resolveConfig(villageId);

      String mandalId = s['mandal']?.toString() ?? '';
      if (mandalId.isEmpty && villageId.isNotEmpty) {
        mandalId = configParentMap[villageId] ?? '';
      }
      final mandalName = ApiService.resolveConfig(mandalId);

      String districtId = s['district']?.toString() ?? '';
      if (districtId.isEmpty && mandalId.isNotEmpty) {
        districtId = configParentMap[mandalId] ?? '';
      }
      final districtName = ApiService.resolveConfig(districtId);

      final addressParts = <String>[];
      if (villageName.isNotEmpty) addressParts.add(villageName);
      if (mandalName.isNotEmpty && mandalName.toLowerCase() != villageName.toLowerCase()) {
        addressParts.add(mandalName.toLowerCase().contains('mandal') ? mandalName : '$mandalName Mdl');
      }
      if (districtName.isNotEmpty && districtName.toLowerCase() != mandalName.toLowerCase()) {
        addressParts.add(districtName.toLowerCase().contains('dist') ? districtName : '$districtName Dt.');
      }

      String finalAddress = addressParts.join(', ');
      final rawAddress = s['address']?.toString().trim() ?? '';
      final cleanLandmark = LocationService.getCleanLandmark(rawAddress);
      if (cleanLandmark.isNotEmpty) {
        finalAddress = finalAddress.isNotEmpty ? '$finalAddress\nLandmark: $cleanLandmark' : cleanLandmark;
      }
      if (finalAddress.isEmpty) finalAddress = '-';

      // Group resolution (avoid blank empty cells)
      final rawGroup = s['group']?.toString().trim() ?? '';
      final resolvedGroup = ApiService.resolveConfig(rawGroup);
      final groupDisplay = resolvedGroup.isNotEmpty
          ? resolvedGroup
          : (rawGroup.isNotEmpty ? rawGroup : '-');

      // Visit Number & Count
      final visits = s['visits'] as List<dynamic>?;
      final visitCount = visits?.length ?? 0;
      final rawVisitNumber = s['visitNumber']?.toString().trim() ?? '';
      final visitNumber = rawVisitNumber.isNotEmpty
          ? rawVisitNumber
          : (visitCount > 0 ? '$visitCount' : '-');

      // School Name
      final sc = ApiService.resolveConfig(s['schoolName']?.toString() ?? '');
      final schoolDisplay = sc.isNotEmpty ? sc : (s['schoolName']?.toString() ?? '-');

      // Detailed Remarks
      String extraRemarks = '';
      final visit = (visits != null && visits.isNotEmpty) ? visits[0] : null;
      final vDate = visit?['visitDate'] != null ? visit!['visitDate'].toString().split('T')[0] : '';
      final visitRemark = visit?['remarks']?.toString().trim() ?? '';
      final studentRemark = s['remarks']?.toString().trim() ?? '';

      if (visitRemark.isNotEmpty) {
        extraRemarks = 'Visit ($vDate): $visitRemark';
        if (studentRemark.isNotEmpty && studentRemark.toLowerCase() != visitRemark.toLowerCase()) {
          extraRemarks += ' | $studentRemark';
        }
      } else if (studentRemark.isNotEmpty) {
        extraRemarks = studentRemark;
      }

      if (s['marks'] != null && s['marks'].toString().trim().isNotEmpty) {
        final m = s['marks'].toString().trim();
        extraRemarks += extraRemarks.isNotEmpty ? ' | Marks: $m' : 'Marks: $m';
      }
      if (s['studyInterestedAt'] != null && s['studyInterestedAt'].toString().isNotEmpty) {
        final intAt = ApiService.resolveConfig(s['studyInterestedAt'].toString());
        extraRemarks += extraRemarks.isNotEmpty ? ' | Int: $intAt' : 'Int: $intAt';
      }
      if (s['ableToBearFee'] != null && s['ableToBearFee'].toString().isNotEmpty) {
        final fee = ApiService.resolveConfig(s['ableToBearFee'].toString());
        extraRemarks += extraRemarks.isNotEmpty ? ' | Fee: $fee' : 'Fee: $fee';
      }
      if (s['leadStatus'] != null && s['leadStatus'].toString().isNotEmpty) {
        extraRemarks += extraRemarks.isNotEmpty ? ' | Status: ${s['leadStatus']}' : 'Status: ${s['leadStatus']}';
      }

      for (final col in _availableColumns) {
        final id = col['id']!;
        if (_selectedColumns.contains(id)) {
          if (id == 'sno') {
            row.add('${i + 1}');
          } else if (id == 'studentName') {
            row.add(s['studentName']?.toString() ?? '-');
          } else if (id == 'fatherName') {
            row.add(s['fatherName']?.toString() ?? '-');
          } else if (id == 'occupation') {
            row.add(s['occupation']?.toString() ?? '-');
          } else if (id == 'address') {
            row.add(finalAddress);
          } else if (id == 'gps') {
            final coords = LocationService.extractGps(rawAddress);
            if (coords != null) {
              row.add('${coords['lat']!.toStringAsFixed(4)},\n${coords['lng']!.toStringAsFixed(4)}');
            } else {
              row.add('-');
            }
          } else if (id == 'phone') {
            row.add(s['phone']?.toString() ?? '-');
          } else if (id == 'whatsapp') {
            row.add(s['whatsapp']?.toString() ?? '-');
          } else if (id == 'group') {
            row.add(groupDisplay);
          } else if (id == 'visitNumber') {
            row.add(visitNumber);
          } else if (id == 'schoolName') {
            row.add(schoolDisplay);
          } else if (id == 'doorstep') {
            row.add(s['doorstepCompleted'] == true ? 'Yes' : 'No');
          } else if (id == 'remarks') {
            row.add(extraRemarks.isNotEmpty ? extraRemarks : '-');
          }
        }
      }
      tableData.add(row);
    }

    // Report Title
    String reportTitle = 'DAY REPORT - ALL (NEW & VISITS)';
    if (_reportType == 'new_students') {
      reportTitle = 'DAY REPORT - NEW ADMISSION STUDENTS';
    } else if (_reportType == 'visits') {
      reportTitle = 'DAY REPORT - VILLAGE VISITS';
    }

    // Filter labels
    final filterParts = <String>[];
    if (_reportType == 'new_students') {
      filterParts.add('Type: New Students Only');
    } else if (_reportType == 'visits') {
      filterParts.add('Type: Village Visits Only');
    } else {
      filterParts.add('Type: All (New & Visits)');
    }

    if (_filterMandal.isNotEmpty) {
      filterParts.add('Mandal: ${ApiService.resolveConfig(_filterMandal)}');
    }
    if (_filterVillage.isNotEmpty) {
      filterParts.add('Village: ${ApiService.resolveConfig(_filterVillage)}');
    }
    if (_filterSchool.isNotEmpty) {
      filterParts.add('School: ${ApiService.resolveConfig(_filterSchool)}');
    }

    // Group counts summary with clean labels (never empty group keys)
    final groupCounts = <String, int>{};
    for (final s in _students) {
      final rawG = s['group']?.toString().trim() ?? '';
      final g = ApiService.resolveConfig(rawG);
      final groupName = g.isNotEmpty ? g : (rawG.isNotEmpty ? rawG : 'Not Specified');
      groupCounts[groupName] = (groupCounts[groupName] ?? 0) + 1;
    }
    final groupCountsSummary = groupCounts.entries.map((e) => '${e.key}: ${e.value}').join(' | ');

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4.landscape,
        margin: const pw.EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        header: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Center(
                child: pw.Column(
                  children: [
                    if (headerCollege.isNotEmpty) ...[
                      pw.Text(
                        headerCollege.toUpperCase(),
                        style: pw.TextStyle(
                          fontSize: 16,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColor.fromHex('#0F2B47'),
                          letterSpacing: 1.2,
                        ),
                      ),
                      pw.SizedBox(height: 3),
                    ],
                    pw.Text(
                      reportTitle,
                      style: pw.TextStyle(
                        fontSize: 12.5,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColor.fromHex('#0F766E'),
                      ),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 6),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'Employee Name: $_employeeName',
                    style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold),
                  ),
                  pw.Text(
                    'Date Range: $_dateRangeDisplay',
                    style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold),
                  ),
                ],
              ),
              if (filterParts.isNotEmpty)
                pw.Padding(
                  padding: const pw.EdgeInsets.only(top: 2),
                  child: pw.Text(
                    'Filters: ${filterParts.join(' | ')}',
                    style: pw.TextStyle(fontSize: 8.5, color: PdfColor.fromHex('#64748B')),
                  ),
                ),
              pw.SizedBox(height: 6),
            ],
          );
        },
        footer: (pw.Context context) {
          return pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                'Page ${context.pageNumber} of ${context.pagesCount}',
                style: const pw.TextStyle(fontSize: 8.0, color: PdfColors.grey),
              ),
              pw.Text(
                'PRO Day Report',
                style: const pw.TextStyle(fontSize: 8.0, color: PdfColors.grey),
              ),
            ],
          );
        },
        build: (pw.Context context) {
          return [
            pw.TableHelper.fromTextArray(
              headers: tableHeaders,
              data: tableData,
              columnWidths: columnWidths,
              border: pw.TableBorder.all(color: PdfColor.fromHex('#CBD5E1'), width: 0.5),
              headerStyle: pw.TextStyle(
                fontSize: 8.5,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.white,
              ),
              headerDecoration: pw.BoxDecoration(
                color: PdfColor.fromHex('#0F766E'),
              ),
              cellStyle: const pw.TextStyle(fontSize: 8.0),
              cellPadding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3.5),
              headerPadding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4.5),
              cellAlignment: pw.Alignment.centerLeft,
              headerAlignment: pw.Alignment.centerLeft,
            ),
            pw.SizedBox(height: 12),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Summary:',
                      style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold),
                    ),
                    pw.SizedBox(height: 3),
                    pw.Text(
                      'Total Students: ${_students.length}',
                      style: const pw.TextStyle(fontSize: 8.5),
                    ),
                    if (groupCountsSummary.isNotEmpty) ...[
                      pw.SizedBox(height: 2),
                      pw.Text(
                        groupCountsSummary,
                        style: const pw.TextStyle(fontSize: 8.0),
                      ),
                    ],
                  ],
                ),
                pw.Padding(
                  padding: const pw.EdgeInsets.only(top: 8),
                  child: pw.Text(
                    'Employee Signature: _________________',
                    style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold),
                  ),
                ),
              ],
            ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  Future<void> _handleDownloadPdf() async {
    if (_students.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No students found in the selected date range.')),
      );
      return;
    }
    if (_selectedColumns.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one column to download.')),
      );
      return;
    }

    setState(() => _generatingPdf = true);

    try {
      final pdfBytes = await _buildPdfDoc();
      final safeName = _employeeName.trim().isNotEmpty
          ? _employeeName.trim().replaceAll(RegExp(r'\s+'), '_')
          : 'Employee';
      final filename = 'Report_$safeName.pdf';

      await PdfDownloader.download(pdfBytes, filename);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF059669),
            content: Text('PDF Downloaded: $filename'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: const Color(0xFFDC2626), content: Text('Error generating PDF: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _generatingPdf = false);
    }
  }

  Future<void> _sharePdfToWhatsApp(String summary) async {
    setState(() => _generatingPdf = true);
    try {
      final pdfBytes = await _buildPdfDoc();
      final safeName = _employeeName.trim().isNotEmpty
          ? _employeeName.trim().replaceAll(RegExp(r'\s+'), '_')
          : 'Employee';
      final filename = 'Report_$safeName.pdf';

      if (!kIsWeb) {
        // On Mobile (Android/iOS): share PDF directly via native share sheet (WhatsApp)
        await Printing.sharePdf(
          bytes: pdfBytes,
          filename: filename,
          subject: 'Day Report - $_employeeName',
          body: summary,
        );
      } else {
        // On Web: download the PDF and open WhatsApp Web so user can attach the document
        await PdfDownloader.download(pdfBytes, filename);
        final webUrl = Uri.parse('https://web.whatsapp.com');
        await launchUrl(webUrl, mode: LaunchMode.externalApplication);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF059669),
              content: Text('PDF downloaded! Drag & drop or attach the file in WhatsApp Web.'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: const Color(0xFFDC2626), content: Text('Failed to share PDF: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _generatingPdf = false);
    }
  }

  Future<void> _shareSummaryToWhatsApp(String summary) async {
    final whatsappUrl = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(summary)}');
    final webUrl = Uri.parse('https://api.whatsapp.com/send?text=${Uri.encodeComponent(summary)}');
    try {
      if (!kIsWeb && await canLaunchUrl(whatsappUrl)) {
        await launchUrl(whatsappUrl, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(webUrl, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      try {
        await launchUrl(webUrl, mode: LaunchMode.externalApplication);
      } catch (e2) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not open WhatsApp: $e2')),
          );
        }
      }
    }
  }

  Future<void> _handleShareReport() async {
    if (_students.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No students found to share.')),
      );
      return;
    }

    final int doorstepDone = _students.where((s) => s['doorstepCompleted'] == true).length;
    final int pending = _students.length - doorstepDone;

    // Group breakdown for the summary
    final groupCounts = <String, int>{};
    for (final s in _students) {
      final rawG = s['group']?.toString().trim() ?? '';
      final g = ApiService.resolveConfig(rawG);
      final groupName = g.isNotEmpty ? g : (rawG.isNotEmpty ? rawG : 'Others');
      groupCounts[groupName] = (groupCounts[groupName] ?? 0) + 1;
    }
    final groupSummary = groupCounts.entries.map((e) => '${e.key}: ${e.value}').join(', ');

    final collegeLine = _collegeName.isNotEmpty ? '🏫 *$_collegeName*\n' : '';
    final summary = '$collegeLine'
        '📊 *PRO DAY PROGRESS REPORT*\n'
        '👤 *Employee:* $_employeeName\n'
        '📅 *Date Range:* $_dateRangeDisplay\n'
        '━━━━━━━━━━━━━━━━━━━━\n'
        '📋 *Total Leads:* ${_students.length}\n'
        '✅ *Doorstep Done:* $doorstepDone\n'
        '⏳ *Pending Leads:* $pending\n'
        '🏷 *Category:* $_reportTypeDisplay\n'
        '${groupSummary.isNotEmpty ? "📚 *Groups:* $groupSummary\n" : ""}'
        '━━━━━━━━━━━━━━━━━━━━';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(22),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.share_rounded, color: Color(0xFF16A34A), size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Share to WhatsApp',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                        ),
                        Text(
                          'Choose how you want to share with WhatsApp',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.picture_as_pdf_rounded, size: 22),
                label: const Text('Share PDF via WhatsApp', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                onPressed: () {
                  Navigator.pop(ctx);
                  _sharePdfToWhatsApp(summary);
                },
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF0F172A),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF25D366), size: 20),
                label: const Text('Send Text Summary on WhatsApp', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                onPressed: () {
                  Navigator.pop(ctx);
                  _shareSummaryToWhatsApp(summary);
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final int doorstepDone = _students.where((s) => s['doorstepCompleted'] == true).length;
    final int pendingCount = _students.length - doorstepDone;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Generate PDF Report',
          style: GoogleFonts.outfit(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF4F46E5)),
            onPressed: () {
              _fetchStats();
              _fetchReportData();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // CARD 1: Filters (Date, Category, Locations)
            _buildFilterCard(),
            const SizedBox(height: 16),

            // CARD 2: Column Selection
            _buildColumnSelectionCard(),
            const SizedBox(height: 16),

            // CARD 3: Report Summary & Actions
            _buildSummaryAndActionsCard(doorstepDone, pendingCount),
            const SizedBox(height: 20),

            // CARD 4: Records Preview
            _buildRecordsPreview(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // ==================== CARD 1: FILTER CONTROLS ====================
  Widget _buildFilterCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header + All-Time Checkbox
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_today_rounded, size: 18, color: Color(0xFF4F46E5)),
                  const SizedBox(width: 8),
                  Text(
                    'Select Date Range',
                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              InkWell(
                onTap: () {
                  setState(() => _isAllTime = !(_isAllTime == true));
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: (_isAllTime == true) ? const Color(0xFFEEF2FF) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: (_isAllTime == true) ? const Color(0xFF4F46E5) : const Color(0xFFCBD5E1),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: (_isAllTime == true) ? const Color(0xFF4F46E5) : Colors.transparent,
                          border: Border.all(
                            color: (_isAllTime == true) ? const Color(0xFF4F46E5) : const Color(0xFF94A3B8),
                            width: 1.5,
                          ),
                        ),
                        child: (_isAllTime == true)
                            ? const Icon(Icons.check, size: 10, color: Colors.white)
                            : null,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'All Time (548)',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: (_isAllTime == true) ? const Color(0xFF4F46E5) : const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Report Category Dropdown
          Text(
            'Report Category',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDFA),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF0D9488)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: ['all', 'new_students', 'visits'].contains(_reportType) ? _reportType : 'all',
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF0D9488)),
                items: const [
                  DropdownMenuItem(
                    value: 'all',
                    child: Text('👥 All (New Students + Village Visits)'),
                  ),
                  DropdownMenuItem(
                    value: 'new_students',
                    child: Text('🆕 New Students Only'),
                  ),
                  DropdownMenuItem(
                    value: 'visits',
                    child: Text('🏡 Village Visits Only'),
                  ),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _reportType = val);
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Date Pickers (Disabled if All Time is checked)
          Opacity(
            opacity: _isAllTime ? 0.4 : 1.0,
            child: IgnorePointer(
              ignoring: _isAllTime,
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('From Date', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        InkWell(
                          onTap: () => _pickDate(true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(_formatDisplayDate(_startDate), style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                                const Icon(Icons.calendar_month_outlined, size: 16, color: Color(0xFF64748B)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('To Date', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        InkWell(
                          onTap: () => _pickDate(false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(_formatDisplayDate(_endDate), style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                                const Icon(Icons.calendar_month_outlined, size: 16, color: Color(0xFF64748B)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Location Filters: Mandal, Village, School Dropdowns
          Text(
            'Location Filters (Optional)',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
          ),
          const SizedBox(height: 6),

          // Mandal Dropdown
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFCBD5E1)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _mandals.any((m) => m['id']?.toString() == _filterMandal) ? _filterMandal : '',
                isExpanded: true,
                items: [
                  const DropdownMenuItem(value: '', child: Text('All Mandals')),
                  ..._mandals.map((m) {
                    final id = m['id']?.toString() ?? '';
                    final name = ApiService.resolveConfig(id).isNotEmpty ? ApiService.resolveConfig(id) : id;
                    final count = m['count'] ?? 0;
                    return DropdownMenuItem(value: id, child: Text('$name ($count)'));
                  }),
                ],
                onChanged: (val) {
                  setState(() {
                    _filterMandal = val ?? '';
                    _filterVillage = '';
                    _filterSchool = '';
                  });
                  _fetchStats();
                },
              ),
            ),
          ),

          // Village Dropdown
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFCBD5E1)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _villages.any((v) => v['id']?.toString() == _filterVillage) ? _filterVillage : '',
                isExpanded: true,
                items: [
                  const DropdownMenuItem(value: '', child: Text('All Villages')),
                  ..._villages.map((v) {
                    final id = v['id']?.toString() ?? '';
                    final name = ApiService.resolveConfig(id).isNotEmpty ? ApiService.resolveConfig(id) : id;
                    final count = v['count'] ?? 0;
                    return DropdownMenuItem(value: id, child: Text('$name ($count)'));
                  }),
                ],
                onChanged: (val) {
                  setState(() {
                    _filterVillage = val ?? '';
                    _filterSchool = '';
                  });
                  _fetchStats();
                },
              ),
            ),
          ),

          // School Dropdown
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFCBD5E1)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _schools.any((s) => s['id']?.toString() == _filterSchool) ? _filterSchool : '',
                isExpanded: true,
                items: [
                  const DropdownMenuItem(value: '', child: Text('All Schools')),
                  ..._schools.map((s) {
                    final id = s['id']?.toString() ?? '';
                    final name = ApiService.resolveConfig(id).isNotEmpty ? ApiService.resolveConfig(id) : id;
                    final count = s['count'] ?? 0;
                    return DropdownMenuItem(value: id, child: Text('$name ($count)'));
                  }),
                ],
                onChanged: (val) {
                  setState(() => _filterSchool = val ?? '');
                },
              ),
            ),
          ),

          // Preview Report Data Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _loading ? null : _fetchReportData,
              icon: _loading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.search_rounded),
              label: Text(_loading ? 'Fetching Data...' : 'Preview Report Data'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4F46E5),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==================== CARD 2: SELECT COLUMNS ====================
  Widget _buildColumnSelectionCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Select Columns to Download',
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  Text(
                    '${_selectedColumns.length}/${_availableColumns.length} selected',
                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                  ),
                ],
              ),
              Row(
                children: [
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _selectedColumns.clear();
                        _selectedColumns.addAll(_availableColumns.map((c) => c['id']!));
                      });
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      'Select All',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF4F46E5)),
                    ),
                  ),
                  const SizedBox(width: 4),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _selectedColumns.clear();
                      });
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      'Clear',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFFEF4444)),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _availableColumns.map((col) {
              final isChecked = _selectedColumns.contains(col['id']);
              return FilterChip(
                label: Text(col['label']!),
                selected: isChecked,
                selectedColor: const Color(0xFFEEF2FF),
                checkmarkColor: const Color(0xFF4F46E5),
                labelStyle: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isChecked ? const Color(0xFF4F46E5) : const Color(0xFF475569),
                ),
                backgroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(
                    color: isChecked ? const Color(0xFF4F46E5) : const Color(0xFFCBD5E1),
                  ),
                ),
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedColumns.add(col['id']!);
                    } else {
                      _selectedColumns.remove(col['id']!);
                    }
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ==================== CARD 3: SUMMARY & ACTIONS ====================
  Widget _buildSummaryAndActionsCard(int doorstepDone, int pendingCount) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Icon(Icons.description_rounded, size: 40, color: Color(0xFF38BDF8)),
          const SizedBox(height: 8),
          Text(
            'Report is Ready',
            style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white),
          ),
          const SizedBox(height: 4),
          Text(
            'Found ${_students.length} $_reportTypeDisplay',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildHeaderMetric('Total Leads', _students.length.toString(), const Color(0xFF38BDF8)),
              const SizedBox(width: 24),
              _buildHeaderMetric('Doorstep Done', doorstepDone.toString(), const Color(0xFF34D399)),
              const SizedBox(width: 24),
              _buildHeaderMetric('Pending', pendingCount.toString(), const Color(0xFFF87171)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: (_students.isEmpty || _generatingPdf) ? null : _handleDownloadPdf,
                  icon: _generatingPdf
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.file_download_outlined),
                  label: Text(_generatingPdf ? 'Generating...' : 'Download PDF'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: (_students.isEmpty || _generatingPdf) ? null : _handleShareReport,
                  icon: const Icon(Icons.share_outlined, color: Color(0xFF25D366)),
                  label: const Text('Share to WhatsApp'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF0F172A),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFF25D366)),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==================== CARD 4: RECORDS PREVIEW ====================
  Widget _buildRecordsPreview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Report Records Preview (${_students.length})',
              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
            ),
            Text(
              _dateRangeDisplay,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
            ),
          ],
        ),
        const SizedBox(height: 10),

        if (_students.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Center(
              child: Column(
                children: [
                  const Icon(Icons.folder_open_rounded, size: 40, color: Color(0xFF94A3B8)),
                  const SizedBox(height: 8),
                  Text(
                    'No students found in the selected date range / filters.',
                    style: GoogleFonts.inter(color: const Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      setState(() => _isAllTime = true);
                      _fetchReportData();
                    },
                    child: const Text('Switch to All Time (548 Leads)'),
                  ),
                ],
              ),
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _students.length,
              separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
              itemBuilder: (context, idx) {
                final s = _students[idx];
                final grp = (s['group'] ?? '').toString().trim();
                final isDone = s['doorstepCompleted'] == true;

                return Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Center(
                          child: Text(
                            '${idx + 1}',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              s['studentName'] ?? 'No Name',
                              style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Phone: ${s['phone'] ?? 'N/A'} • ${ApiService.resolveConfig(s['schoolName']).isNotEmpty ? ApiService.resolveConfig(s['schoolName']) : 'No School'}',
                              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                            ),
                            if (ApiService.resolveConfig(s['village']).isNotEmpty)
                              Text(
                                'Village: ${ApiService.resolveConfig(s['village'])}',
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                              ),
                            if (s['remarks'] != null && s['remarks'].toString().trim().isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  'Remarks: ${s['remarks']}',
                                  style: GoogleFonts.inter(fontSize: 11, fontStyle: FontStyle.italic, color: const Color(0xFF64748B)),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (grp.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              margin: const EdgeInsets.only(bottom: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEEF2FF),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                grp,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF4F46E5),
                                ),
                              ),
                            ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isDone ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: isDone ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A),
                              ),
                            ),
                            child: Text(
                              isDone ? 'Doorstep Done' : 'Pending',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: isDone ? const Color(0xFF059669) : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildHeaderMetric(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          value,
          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800, color: color),
        ),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
        ),
      ],
    );
  }
}
