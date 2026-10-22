import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../services/whatsapp_template_service.dart';
import '../../services/caller_id_service.dart';
import '../../services/location_service.dart';
import 'add_student_screen.dart';

class VillageVisitsScreen extends StatefulWidget {
  const VillageVisitsScreen({super.key});

  @override
  State<VillageVisitsScreen> createState() => _VillageVisitsScreenState();
}

class _VillageVisitsScreenState extends State<VillageVisitsScreen> {
  List<dynamic> _students = [];
  bool _isLoading = true;
  String? _error;

  DateTime _selectedDate = DateTime.now();
  String _statusFilter = 'all'; // all, pending, met, never
  String _searchQuery = '';
  String? _selectedMandalId;
  String? _selectedVillageId;
  String? _selectedSchool;
  String? _expandedStudentId;

  Map<String, String> _configMap = {};
  Map<String, String> _configParentMap = {};
  List<dynamic> _colleges = [];

  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchInitialData({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ApiService.getStudents(limit: 1000, minimal: false, forceRefresh: forceRefresh),
        ApiService.getConfigMap(),
        ApiService.getConfigParentMap(),
        ApiService.getCollegesList(),
      ]);

      if (!mounted) return;

      final studentsRes = results[0] as Map<String, dynamic>;
      final cfgMap = results[1] as Map<String, String>;
      final cfgParentMap = results[2] as Map<String, String>;
      final collegesList = results[3] as List<dynamic>;

      if (studentsRes['success'] == true) {
        _students = (studentsRes['students'] as List<dynamic>?) ?? [];
        _configMap = cfgMap;
        _configParentMap = cfgParentMap;
        _colleges = collegesList;
        _isLoading = false;
        CallerIdService.updateStudentsCache(_students, _configMap);
        _recomputeAllFilters();
        setState(() {});
      } else {
        setState(() {
          _error = studentsRes['error'] ?? 'Failed to load village visit data';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Error loading data: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchStudentsOnly({bool forceRefresh = false}) async {
    final res = await ApiService.getStudents(limit: 1000, minimal: false, forceRefresh: forceRefresh);
    if (!mounted) return;
    if (res['success'] == true) {
      _students = (res['students'] as List<dynamic>?) ?? [];
      _recomputeAllFilters();
      setState(() {});
    }
  }

  String _formatDate(DateTime dt) {
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  String _formatDisplayDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${dt.day.toString().padLeft(2, '0')} ${months[dt.month - 1]}';
    } catch (_) {
      return dateStr.split('T')[0];
    }
  }

  String _resolveName(dynamic val) {
    if (val == null) return '';
    final str = val.toString().trim();
    if (str.isEmpty) return '';
    return _configMap[str] ?? str;
  }

  Map<String, dynamic>? _getVisitForDate(Map<String, dynamic> student, String dateStr) {
    final visits = student['visits'] as List<dynamic>?;
    if (visits == null || visits.isEmpty) return null;
    for (final v in visits) {
      if (v is Map) {
        final raw = (v['visitDate'] ?? '').toString();
        if (raw.startsWith(dateStr)) return Map<String, dynamic>.from(v);
        try {
          final dt = DateTime.parse(raw);
          if (_formatDate(dt.toLocal()) == dateStr || _formatDate(dt.toUtc()) == dateStr) {
            return Map<String, dynamic>.from(v);
          }
        } catch (_) {}
      }
    }
    return null;
  }

  bool _wasVisitedOnDate(Map<String, dynamic> student, String dateStr) {
    return _getVisitForDate(student, dateStr) != null;
  }

  // Precomputed cached filters for 60fps performance
  List<MapEntry<String, String>> _uniqueMandals = [];
  List<MapEntry<String, String>> _uniqueVillages = [];
  List<String> _uniqueSchools = [];
  Map<String, int> _schoolCounts = {};
  Map<String, int> _villageCounts = {};
  Map<String, int> _filterCounts = {'all': 0, 'pending': 0, 'met': 0, 'never': 0, 'star': 0};
  List<dynamic> _filteredStudents = [];

  bool _doesStudentMatchMandal(dynamic item, String? mandalId) {
    if (mandalId == null || mandalId.isEmpty) return true;
    if (item is! Map) return false;
    final s = item;
    final selMName = _resolveName(mandalId).trim().toLowerCase();

    final vId = (s['village'] ?? '').toString();
    final parentMId = _configParentMap[vId] ?? '';
    final sMandal = (s['mandal'] ?? '').toString();

    if (sMandal == mandalId || parentMId == mandalId) return true;
    if (_resolveName(sMandal).trim().toLowerCase() == selMName) return true;
    if (parentMId.isNotEmpty && _resolveName(parentMId).trim().toLowerCase() == selMName) return true;
    return false;
  }

  bool _doesStudentMatchVillage(dynamic item, String? villageId) {
    if (villageId == null || villageId.isEmpty) return true;
    if (item is! Map) return false;
    final s = item;
    final selVName = _resolveName(villageId).trim().toLowerCase();

    final vId = (s['village'] ?? '').toString();
    if (vId == villageId) return true;
    if (_resolveName(vId).trim().toLowerCase() == selVName) return true;
    return false;
  }

  bool _doesStudentMatchSchool(dynamic item, String? school) {
    if (school == null || school.isEmpty) return true;
    if (item is! Map) return false;
    final s = item;
    final selSchName = school.trim().toLowerCase();

    final rawSchool = (s['schoolName'] ?? '').toString();
    final schName = _resolveName(rawSchool).trim().toLowerCase();
    return schName == selSchName;
  }

  void _recomputeAllFilters() {
    _recomputeMandals();
    _recomputeVillagesAndSchools();
    _recomputeFilteredStudents();
  }

  void _recomputeMandals() {
    final mandalMap = <String, String>{};
    final seenMandalNames = <String>{};

    for (final item in _students) {
      if (item is! Map) continue;
      final s = item is Map<String, dynamic> ? item : Map<String, dynamic>.from(item);
      if (_isStudentClosed(s)) continue;

      final vId = (s['village'] ?? '').toString();
      String mId = _configParentMap[vId] ?? '';
      if (mId.isEmpty) {
        mId = (s['mandal'] ?? '').toString();
      }
      if (mId.isNotEmpty) {
        final mName = _resolveName(mId).trim();
        final lower = mName.toLowerCase();
        if (mName.isNotEmpty && !seenMandalNames.contains(lower)) {
          seenMandalNames.add(lower);
          mandalMap[mId] = mName;
        }
      }
    }
    final mEntries = mandalMap.entries.toList();
    mEntries.sort((a, b) => a.value.compareTo(b.value));
    _uniqueMandals = mEntries;

    if (_selectedMandalId != null && !_uniqueMandals.any((m) => m.key == _selectedMandalId)) {
      _selectedMandalId = null;
    }
  }

  void _recomputeVillagesAndSchools() {
    final villageMap = <String, String>{};
    final seenVillageNames = <String>{};
    final villageCounts = <String, int>{};

    for (final item in _students) {
      if (item is! Map) continue;
      final s = item is Map<String, dynamic> ? item : Map<String, dynamic>.from(item);
      if (_isStudentClosed(s)) continue;

      // Filter by selected mandal: only show villages belonging to this mandal
      if (!_doesStudentMatchMandal(s, _selectedMandalId)) continue;

      final vId = (s['village'] ?? '').toString().trim();
      if (vId.isNotEmpty) {
        final vName = _resolveName(vId).trim();
        final lower = vName.toLowerCase();
        if (vName.isNotEmpty) {
          villageCounts[lower] = (villageCounts[lower] ?? 0) + 1;
          if (!seenVillageNames.contains(lower)) {
            seenVillageNames.add(lower);
            villageMap[vId] = vName;
          }
        }
      }
    }
    final vEntries = villageMap.entries.toList();
    vEntries.sort((a, b) => a.value.compareTo(b.value));
    _uniqueVillages = vEntries;
    _villageCounts = villageCounts;

    if (_selectedVillageId != null && !_uniqueVillages.any((v) => v.key == _selectedVillageId)) {
      _selectedVillageId = null;
    }

    _recomputeSchools();
  }

  void _recomputeSchools() {
    final schoolCounts = <String, int>{};

    for (final item in _students) {
      if (item is! Map) continue;
      final s = item is Map<String, dynamic> ? item : Map<String, dynamic>.from(item);
      if (_isStudentClosed(s)) continue;

      // Filter by selected mandal AND selected village: only show schools for this village
      if (!_doesStudentMatchMandal(s, _selectedMandalId)) continue;
      if (!_doesStudentMatchVillage(s, _selectedVillageId)) continue;

      final rawSchool = (s['schoolName'] ?? '').toString();
      final schName = _resolveName(rawSchool).trim();
      if (schName.isNotEmpty) {
        schoolCounts[schName] = (schoolCounts[schName] ?? 0) + 1;
      }
    }
    final sList = schoolCounts.keys.toList();
    sList.sort((a, b) => a.compareTo(b));
    _uniqueSchools = sList;
    _schoolCounts = schoolCounts;

    if (_selectedSchool != null && !_uniqueSchools.contains(_selectedSchool)) {
      _selectedSchool = null;
    }
  }

  // Check if student is closed (matches web logic)
  bool _isStudentClosed(Map<String, dynamic> s) {
    final leadStatus = (s['leadStatus'] ?? '').toString();
    if (leadStatus == 'Joined Other College' || leadStatus == 'Not Interested') return true;
    final fee = (s['ableToBearFee'] ?? '').toString();
    if (fee == 'Not Bearable') return true;
    final interest = (s['studyInterestedAt'] ?? '').toString();
    if (interest == 'Local College' || interest == 'Other') return true;
    final group = (s['group'] ?? '').toString();
    const dropGroups = ['CEC', 'HEC', 'ITI academy', 'Polytechnic', 'Defence academy'];
    if (dropGroups.contains(group)) return true;
    return false;
  }

  void _recomputeFilteredStudents() {
    final q = _searchQuery.trim().toLowerCase();
    final dateStr = _formatDate(_selectedDate);

    final base = _students.where((item) {
      if (item is! Map) return false;
      final s = item is Map<String, dynamic> ? item : Map<String, dynamic>.from(item);
      if (_isStudentClosed(s)) return false;

      final name = (s['studentName'] ?? '').toString().toLowerCase();
      final phone = (s['phone'] ?? '').toString().toLowerCase();
      final vId = (s['village'] ?? '').toString();
      String mId = _configParentMap[vId] ?? '';
      if (mId.isEmpty) {
        mId = (s['mandal'] ?? '').toString();
      }

      // Search match
      if (q.isNotEmpty && !name.contains(q) && !phone.contains(q)) return false;

      // Cascading matches
      if (!_doesStudentMatchMandal(s, _selectedMandalId)) return false;
      if (!_doesStudentMatchVillage(s, _selectedVillageId)) return false;
      if (!_doesStudentMatchSchool(s, _selectedSchool)) return false;

      return true;
    }).toList();

    int all = 0;
    int pending = 0;
    int met = 0;
    int never = 0;
    int stars = 0;

    for (final item in base) {
      final s = item is Map<String, dynamic> ? item : Map<String, dynamic>.from(item as Map);
      all++;
      final isMet = _wasVisitedOnDate(s, dateStr);
      final visits = s['visits'] as List<dynamic>? ?? [];
      final hasAnyVisit = visits.isNotEmpty;
      final status = (s['leadStatus'] ?? '').toString().toLowerCase();
      final isStar = status.contains('star') || status.contains('prime');

      if (isMet) {
        met++;
      } else {
        pending++;
      }
      if (!hasAnyVisit) {
        never++;
      }
      if (isStar) {
        stars++;
      }
    }

    _filterCounts = {'all': all, 'pending': pending, 'met': met, 'never': never, 'star': stars};

    _filteredStudents = base.where((item) {
      final s = item is Map<String, dynamic> ? item : Map<String, dynamic>.from(item as Map);
      final isMet = _wasVisitedOnDate(s, dateStr);
      final visits = s['visits'] as List<dynamic>? ?? [];
      final hasAnyVisit = visits.isNotEmpty;
      final status = (s['leadStatus'] ?? '').toString().toLowerCase();
      final isStar = status.contains('star') || status.contains('prime');

      if (_statusFilter == 'pending') return !isMet;
      if (_statusFilter == 'met') return isMet;
      if (_statusFilter == 'never') return !hasAnyVisit;
      if (_statusFilter == 'star') return isStar;
      return true;
    }).toList();
  }

  Future<void> _toggleStarLead(Map<String, dynamic> student) async {
    final studentId = student['id']?.toString() ?? '';
    if (studentId.isEmpty) return;

    final currentStatus = (student['leadStatus'] ?? '').toString().toLowerCase();
    final currentlyStar = currentStatus.contains('star') || currentStatus.contains('prime');
    final newStatus = currentlyStar ? 'Following Up' : 'Star Lead';

    setState(() {
      student['leadStatus'] = newStatus;
      _recomputeFilteredStudents();
    });

    try {
      await ApiService.updateStudent(studentId, {'leadStatus': newStatus});
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: currentlyStar ? const Color(0xFF475569) : const Color(0xFFD97706),
            duration: const Duration(seconds: 2),
            content: Row(
              children: [
                Icon(currentlyStar ? Icons.star_border_rounded : Icons.star_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    currentlyStar
                        ? '${student['studentName']} removed from Star Leads'
                        : '⭐ ${student['studentName']} marked as Star Lead!',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          student['leadStatus'] = currentlyStar ? 'Star Lead' : 'Following Up';
          _recomputeFilteredStudents();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: $e')),
        );
      }
    }
  }

  // Direct Phone Call Launcher
  Future<void> _makePhoneCall(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.isEmpty) return;
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  // Direct WhatsApp Launcher
  Future<void> _launchWhatsApp(String phone, {String? text}) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.isEmpty) return;
    final number = clean.length == 10 ? '91$clean' : clean;
    final urlStr = text != null && text.isNotEmpty
        ? 'https://wa.me/$number?text=${Uri.encodeComponent(text)}'
        : 'https://wa.me/$number';
    final uri = Uri.parse(urlStr);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // Record / Update Visit Modal
  void _openVisitModal(Map<String, dynamic> student) {
    final studentId = student['id'].toString();
    final studentName = student['studentName'] ?? 'Student';
    final fatherName = student['fatherName'] ?? '';
    final phone = student['phone'] ?? '';
    final village = _resolveName(student['village']);
    final school = _resolveName(student['schoolName']);

    final dateStr = _formatDate(_selectedDate);
    final existingVisit = _getVisitForDate(student, dateStr);
    final isEditing = existingVisit != null;

    final visits = student['visits'] as List<dynamic>? ?? [];
    Map<String, dynamic>? priorVisit;
    if (visits.isNotEmpty) {
      if (isEditing) {
        for (final v in visits) {
          if (v is Map && v['id'] != existingVisit['id']) {
            priorVisit = Map<String, dynamic>.from(v);
            break;
          }
        }
      } else {
        priorVisit = Map<String, dynamic>.from(visits.first);
      }
    }

    final remarksController = TextEditingController(text: isEditing ? (existingVisit['remarks'] ?? '') : '');
    final appNumberController = TextEditingController();

    String outcome = '';
    final studentLeadStatus = (student['leadStatus'] ?? '').toString();
    if (isEditing) {
      if (studentLeadStatus == 'Joined Other College') {
        outcome = 'joined_other';
      } else if (studentLeadStatus == 'Not Interested') {
        outcome = 'not_interested';
      } else if (studentLeadStatus == 'Admitted') {
        outcome = 'admitted';
      } else if (studentLeadStatus == 'Following Up') {
        outcome = 'following_up';
      }
    }

    DateTime? nextFollowUpDate;
    String? selectedCollegeId;
    bool isSaving = false;
    bool isSavedSuccess = false;
    XFile? attachedPhoto;
    Uint8List? attachedPhotoBytes;
    bool isSharing = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            isEditing ? "Update Today's Visit" : 'Record Visit',
                            style: GoogleFonts.outfit(fontSize: 19, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Date notice banner
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isEditing ? const Color(0xFFF0FDF4) : const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isEditing ? const Color(0xFFBBF7D0) : const Color(0xFFBFDBFE)),
                      ),
                      child: Row(
                        children: [
                          Icon(isEditing ? Icons.edit_calendar_rounded : Icons.calendar_today_rounded, size: 16, color: isEditing ? const Color(0xFF166534) : const Color(0xFF1E40AF)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              isEditing
                                  ? 'Updating visit for $dateStr (Will update existing visit)'
                                  : 'Recording visit for $dateStr',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isEditing ? const Color(0xFF166534) : const Color(0xFF1E40AF),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Previous visit info box
                    if (priorVisit != null && !isEditing) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.history_rounded, size: 16, color: Color(0xFF64748B)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: RichText(
                                text: TextSpan(
                                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                                  children: [
                                    TextSpan(
                                      text: 'Previous visit (${_formatDisplayDate((priorVisit['visitDate'] ?? '').toString())}): ',
                                      style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                                    ),
                                    TextSpan(text: priorVisit['remarks']?.toString().isNotEmpty == true ? priorVisit['remarks'].toString() : 'No remarks recorded'),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),

                    if (isSavedSuccess) ...[
                      // Success View with WhatsApp Sharing & Photo Attachment
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF86EFAC)),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 48),
                            const SizedBox(height: 8),
                            Text(
                              isEditing ? 'Visit updated successfully!' : 'Visit saved successfully! 🎉',
                              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF166534)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Share visit details directly to student or counselor via WhatsApp',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF15803D)),
                            ),
                            const SizedBox(height: 16),

                            // Photo Attachment Section (Optional)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.add_a_photo_outlined, size: 16, color: Color(0xFF4F46E5)),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Attach Photo (Optional)',
                                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  if (attachedPhotoBytes != null) ...[
                                    Row(
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(8),
                                          child: Image.memory(
                                            attachedPhotoBytes!,
                                            width: 56,
                                            height: 56,
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                attachedPhoto?.name ?? 'visit_photo.jpg',
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                'Watermark with student details will be attached',
                                                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF16A34A), fontWeight: FontWeight.w500),
                                              ),
                                            ],
                                          ),
                                        ),
                                        IconButton(
                                          tooltip: 'Remove photo',
                                          icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444)),
                                          onPressed: () {
                                            setModalState(() {
                                              attachedPhoto = null;
                                              attachedPhotoBytes = null;
                                            });
                                          },
                                        ),
                                      ],
                                    ),
                                  ] else ...[
                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            style: OutlinedButton.styleFrom(
                                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                                              side: const BorderSide(color: Color(0xFFCBD5E1)),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                            ),
                                            icon: const Icon(Icons.camera_alt_outlined, size: 16, color: Color(0xFF4F46E5)),
                                            label: Text('Camera', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                            onPressed: () async {
                                              try {
                                                final picker = ImagePicker();
                                                XFile? picked;
                                                try {
                                                  picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 85);
                                                } catch (_) {
                                                  // Fallback to gallery if camera is unavailable (e.g. desktop)
                                                  picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                                                }
                                                if (picked != null) {
                                                  final bytes = await picked.readAsBytes();
                                                  setModalState(() {
                                                    attachedPhoto = picked;
                                                    attachedPhotoBytes = bytes;
                                                  });
                                                }
                                              } catch (e) {
                                                debugPrint('Camera error: $e');
                                                if (ctx.mounted) {
                                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                                    SnackBar(content: Text('Photo picker error: Please restart app (flutter run). ($e)')),
                                                  );
                                                }
                                              }
                                            },
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            style: OutlinedButton.styleFrom(
                                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                                              side: const BorderSide(color: Color(0xFFCBD5E1)),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                            ),
                                            icon: const Icon(Icons.photo_library_outlined, size: 16, color: Color(0xFF4F46E5)),
                                            label: Text('Gallery', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                            onPressed: () async {
                                              try {
                                                final picker = ImagePicker();
                                                final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                                                if (picked != null) {
                                                  final bytes = await picked.readAsBytes();
                                                  setModalState(() {
                                                    attachedPhoto = picked;
                                                    attachedPhotoBytes = bytes;
                                                  });
                                                }
                                              } catch (e) {
                                                debugPrint('Gallery error: $e');
                                                if (ctx.mounted) {
                                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                                    SnackBar(content: Text('Gallery error: Please restart app (flutter run). ($e)')),
                                                  );
                                                }
                                              }
                                            },
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                  const SizedBox(height: 6),
                                  Text(
                                    '* This photo will be shared directly to WhatsApp and will not be saved on our server.',
                                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B), fontStyle: FontStyle.italic),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // WhatsApp Share Button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF25D366),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                icon: isSharing
                                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                    : const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                                label: Text(
                                  isSharing
                                      ? 'Sending to WhatsApp...'
                                      : (attachedPhotoBytes != null ? 'Share Photo to WhatsApp' : 'Share to WhatsApp'),
                                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                                ),
                                onPressed: isSharing
                                    ? null
                                    : () async {
                                        final msg = StringBuffer();
                                        msg.writeln('*Student Name:* $studentName');
                                        if (fatherName.isNotEmpty) msg.writeln('*Father Name:* $fatherName');
                                        if (village.isNotEmpty) msg.writeln('*Village:* $village');
                                        if (school.isNotEmpty) msg.writeln('*School:* $school');
                                        if (phone.isNotEmpty) msg.writeln('*Phone:* $phone');
                                        if (remarksController.text.trim().isNotEmpty) {
                                          msg.writeln('*Remarks:* ${remarksController.text.trim()}');
                                        }

                                        if (attachedPhotoBytes != null) {
                                          setModalState(() => isSharing = true);
                                          try {
                                            if (kIsWeb) {
                                              await SharePlus.instance.share(
                                                ShareParams(
                                                  files: [
                                                    XFile.fromData(
                                                      attachedPhotoBytes!,
                                                      mimeType: 'image/jpeg',
                                                      name: 'visit_${DateTime.now().millisecondsSinceEpoch}.jpg',
                                                    ),
                                                  ],
                                                  text: msg.toString(),
                                                ),
                                              );
                                            } else {
                                              XFile shareFile;
                                              if (attachedPhoto != null) {
                                                shareFile = attachedPhoto!;
                                              } else {
                                                final tempDir = await getTemporaryDirectory();
                                                final tempFile = File('${tempDir.path}/visit_${DateTime.now().millisecondsSinceEpoch}.jpg');
                                                await tempFile.writeAsBytes(attachedPhotoBytes!);
                                                shareFile = XFile(tempFile.path);
                                              }
                                              await SharePlus.instance.share(
                                                ShareParams(
                                                  files: [shareFile],
                                                  text: msg.toString(),
                                                ),
                                              );
                                            }

                                            if (ctx.mounted) {
                                              Navigator.pop(ctx);
                                            }
                                          } catch (err) {
                                            debugPrint('Error sharing photo: $err');
                                            if (ctx.mounted) {
                                              Navigator.pop(ctx);
                                            }
                                            _launchWhatsApp(phone, text: msg.toString());
                                          }
                                        } else {
                                          Navigator.pop(ctx);
                                          _launchWhatsApp(phone, text: msg.toString());
                                        }
                                      },
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () => Navigator.pop(ctx),
                              child: Text('Done & Close', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      // Remarks Textarea (Optional)
                      Text('Remarks (Optional)', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                      const SizedBox(height: 6),
                      TextField(
                        controller: remarksController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: 'What was discussed? (Optional)',
                          hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Outcome Dropdown
                      Text('Visit Outcome / Next Action', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue: outcome.isNotEmpty ? outcome : null,
                        hint: Text('Select option...', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8))),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'following_up', child: Text('Just Follow-up (No specific date)')),
                          DropdownMenuItem(value: 'after_exams', child: Text('Follow-up After Exams')),
                          DropdownMenuItem(value: 'after_results', child: Text('Follow-up After Results')),
                          DropdownMenuItem(value: 'specific_date', child: Text('Follow-up on Specific Date')),
                          DropdownMenuItem(value: 'admitted', child: Text('Closed - Admitted to Our College')),
                          DropdownMenuItem(value: 'joined_other', child: Text('Closed - Joined Other College')),
                          DropdownMenuItem(value: 'not_interested', child: Text('Closed - Not Interested')),
                        ],
                        onChanged: (val) {
                          setModalState(() {
                            outcome = val ?? '';
                            if (outcome != 'specific_date') nextFollowUpDate = null;
                            if (outcome != 'admitted') selectedCollegeId = null;
                          });
                        },
                      ),

                      // Conditional: Specific Date
                      if (outcome == 'specific_date') ...[
                        const SizedBox(height: 12),
                        Text('Select Follow-up Date', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                        const SizedBox(height: 6),
                        ListTile(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFCBD5E1))),
                          tileColor: const Color(0xFFF8FAFC),
                          leading: const Icon(Icons.calendar_month_rounded, color: Color(0xFF4F46E5)),
                          title: Text(
                            nextFollowUpDate != null ? _formatDate(nextFollowUpDate!) : 'Tap to pick date',
                            style: GoogleFonts.inter(fontSize: 13, color: nextFollowUpDate != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8)),
                          ),
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: ctx,
                              initialDate: DateTime.now().add(const Duration(days: 3)),
                              firstDate: DateTime.now(),
                              lastDate: DateTime.now().add(const Duration(days: 365)),
                            );
                            if (picked != null) {
                              setModalState(() => nextFollowUpDate = picked);
                            }
                          },
                        ),
                      ],

                      // Conditional: Admitted College & Application No
                      if (outcome == 'admitted') ...[
                        const SizedBox(height: 12),
                        Text('Select College Branch *', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: selectedCollegeId,
                          hint: const Text('Select College Branch...'),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                          ),
                          items: _colleges.map((c) {
                            final empId = (c['employeeId'] ?? '').toString();
                            final name = (c['name'] ?? 'College').toString();
                            return DropdownMenuItem(value: empId, child: Text(name));
                          }).toList(),
                          onChanged: (val) => setModalState(() => selectedCollegeId = val),
                        ),
                        const SizedBox(height: 12),
                        Text('Application Number (Optional)', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                        const SizedBox(height: 6),
                        TextField(
                          controller: appNumberController,
                          decoration: InputDecoration(
                            hintText: 'e.g. APP-12345',
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                          ),
                        ),
                      ],

                      const SizedBox(height: 20),

                      // Submit & Cancel Buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: isSaving ? null : () => Navigator.pop(ctx),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF4F46E5),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              onPressed: isSaving
                                  ? null
                                  : () async {
                                      if (outcome == 'admitted' && (selectedCollegeId == null || selectedCollegeId!.isEmpty)) {
                                        ScaffoldMessenger.of(ctx).showSnackBar(
                                          const SnackBar(content: Text('Please select the college branch.')),
                                        );
                                        return;
                                      }

                                      setModalState(() => isSaving = true);

                                      String? apiFollowUpType;
                                      String? apiStudentStatus;

                                      final currentStatus = (student['leadStatus'] ?? '').toString().toLowerCase();
                                      final isAlreadyStar = currentStatus.contains('star') || currentStatus.contains('prime');

                                      if (outcome == 'after_exams') {
                                        apiFollowUpType = 'After Exams';
                                        apiStudentStatus = isAlreadyStar ? 'Star Lead' : 'Following Up';
                                      } else if (outcome == 'after_results') {
                                        apiFollowUpType = 'After Results';
                                        apiStudentStatus = isAlreadyStar ? 'Star Lead' : 'Following Up';
                                      } else if (outcome == 'specific_date') {
                                        apiFollowUpType = 'Date';
                                        apiStudentStatus = isAlreadyStar ? 'Star Lead' : 'Following Up';
                                      } else if (outcome == 'joined_other') {
                                        apiStudentStatus = 'Joined Other College';
                                      } else if (outcome == 'not_interested') {
                                        apiStudentStatus = 'Not Interested';
                                      } else if (outcome == 'following_up') {
                                        apiStudentStatus = isAlreadyStar ? 'Star Lead' : 'Following Up';
                                      } else if (outcome == 'admitted') {
                                        apiStudentStatus = 'Admitted';
                                      }

                                      final res = await ApiService.recordVisit(
                                        studentId: studentId,
                                        visitId: isEditing ? existingVisit['id']?.toString() : null,
                                        remarks: remarksController.text.trim(),
                                        visitDate: DateTime(
                                          _selectedDate.year,
                                          _selectedDate.month,
                                          _selectedDate.day,
                                          DateTime.now().hour,
                                          DateTime.now().minute,
                                        ).toIso8601String(),
                                        nextFollowUpType: apiFollowUpType,
                                        nextFollowUpDate: (apiFollowUpType == 'Date' && nextFollowUpDate != null)
                                            ? _formatDate(nextFollowUpDate!)
                                            : null,
                                        leadStatus: apiStudentStatus,
                                        joinedCollegeId: outcome == 'admitted' ? selectedCollegeId : null,
                                        applicationNumber: outcome == 'admitted' ? appNumberController.text.trim() : null,
                                      );

                                      if (!ctx.mounted) return;

                                      if (res['success'] == true) {
                                        setModalState(() {
                                          isSaving = false;
                                          isSavedSuccess = true;
                                        });
                                        student['doorstepCompleted'] = true;
                                        if (apiStudentStatus != null) student['leadStatus'] = apiStudentStatus;
                                        _fetchStudentsOnly(forceRefresh: true);
                                      } else {
                                        setModalState(() => isSaving = false);
                                        ScaffoldMessenger.of(ctx).showSnackBar(
                                          SnackBar(content: Text(res['error'] ?? 'Failed to record visit')),
                                        );
                                      }
                                    },
                              child: isSaving
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Text(isEditing ? 'Update Visit' : 'Save Visit', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _pinStudentLocation(Map<String, dynamic> s) async {
    final studentId = s['id'].toString();
    final studentName = s['studentName'] ?? 'Student';
    final existingAddress = (s['address'] ?? '').toString();
    final cleanLandmark = LocationService.getCleanLandmark(existingAddress);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            SizedBox(width: 12),
            Text('Fetching doorstep GPS location...'),
          ],
        ),
        duration: Duration(seconds: 4),
      ),
    );

    final pos = await LocationService.getCurrentLocation();
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    if (pos == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not access GPS. Please ensure Location is enabled in Settings.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    final newAddress = LocationService.formatWithGps(cleanLandmark, pos.latitude, pos.longitude);

    try {
      final res = await ApiService.updateStudent(studentId, {'address': newAddress});
      if (!mounted) return;
      if (res['success'] == true) {
        setState(() {
          s['address'] = newAddress;
        });
        CallerIdService.updateStudentsCache(_students, _configMap);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('📍 $studentName house GPS pinned successfully!'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['error'] ?? 'Failed to save GPS pin'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving GPS: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  // Student Full Details Modal
  void _openStudentDetailsModal(Map<String, dynamic> s) {
    final name = s['studentName'] ?? 'Student';
    final phone = (s['phone'] ?? '').toString();
    final whatsapp = (s['whatsapp'] ?? '').toString();
    final father = (s['fatherName'] ?? 'N/A').toString();
    final group = _resolveName(s['group']);
    final school = _resolveName(s['schoolName']);
    final schoolArea = _resolveName(s['schoolArea']);
    final village = _resolveName(s['village']);
    final landmark = (s['address'] ?? 'N/A').toString();
    final fee = _resolveName(s['ableToBearFee']);
    final visits = (s['visits'] as List<dynamic>?) ?? [];
    final assessmentReport = s['assessmentReport'] as Map<String, dynamic>?;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.88),
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Student Details', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF0F766E))),
                      Text('Field Survey Quick View', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(height: 20),

              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Basic Info
                      _buildDetailRow('Name:', name.toUpperCase(), isBold: true),
                      const SizedBox(height: 8),

                      Row(
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Text('Phone: ', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: const Color(0xFF334155))),
                                Text(phone, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A))),
                                const SizedBox(width: 4),
                                GestureDetector(
                                  onTap: () => _makePhoneCall(phone),
                                  child: const Icon(Icons.phone_rounded, size: 16, color: Color(0xFF0D9488)),
                                ),
                              ],
                            ),
                          ),
                          if (whatsapp.isNotEmpty)
                            Expanded(
                              child: Row(
                                children: [
                                  Text('WhatsApp: ', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: const Color(0xFF334155))),
                                  Text(whatsapp, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A))),
                                  const SizedBox(width: 4),
                                  GestureDetector(
                                    onTap: () async {
                                      final session = await ApiService.getSession();
                                      final empName = session['name'] ?? 'PRO Officer';
                                      final empPhone = session['identifier'] ?? '';
                                      if (ctx.mounted) {
                                        WhatsAppTemplateService.showTemplateSelector(
                                          ctx,
                                          student: Map<String, dynamic>.from(s),
                                          employeeName: empName,
                                          employeePhone: empPhone,
                                        );
                                      }
                                    },
                                    child: const Icon(Icons.chat_bubble_rounded, size: 16, color: Color(0xFF10B981)),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      _buildDetailRow('Father:', father),
                      const Divider(height: 20),

                      // Academic & Location Info
                      Row(
                        children: [
                          Text('Group: ', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: const Color(0xFF334155))),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                            ),
                            child: Text(group, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B))),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      _buildDetailRow('School:', '$school ${schoolArea.isNotEmpty ? "($schoolArea)" : ""}'),
                      const SizedBox(height: 8),
                      _buildDetailRow('Location (Village):', village.isNotEmpty ? village : 'N/A'),
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        'Landmark / Address:',
                        LocationService.getCleanLandmark(landmark).isNotEmpty
                            ? LocationService.getCleanLandmark(landmark)
                            : (landmark.contains('GPS:') ? 'Doorstep GPS Saved' : 'N/A'),
                      ),
                      const SizedBox(height: 8),
                      Builder(builder: (ctx) {
                        final gps = LocationService.extractGps(landmark);
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: gps != null ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: gps != null ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                gps != null ? Icons.pin_drop_rounded : Icons.location_off_outlined,
                                size: 16,
                                color: gps != null ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  gps != null
                                      ? 'GPS: ${gps['lat']!.toStringAsFixed(4)}, ${gps['lng']!.toStringAsFixed(4)}'
                                      : 'No Doorstep GPS pinned yet',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: gps != null ? const Color(0xFF166534) : const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                              if (gps != null)
                                ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0F766E),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                  ),
                                  icon: const Icon(Icons.navigation_rounded, size: 12),
                                  label: Text(
                                    'Route',
                                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700),
                                  ),
                                  onPressed: () {
                                    LocationService.openGoogleMapsRoute(
                                      lat: gps['lat']!,
                                      lng: gps['lng']!,
                                      studentName: name,
                                    );
                                  },
                                ),
                            ],
                          ),
                        );
                      }),
                      const Divider(height: 20),

                      _buildDetailRow('Fee Capacity:', fee.isNotEmpty ? fee : 'N/A'),
                      const SizedBox(height: 12),

                      // 75-Q Career Test Results Box
                      if (assessmentReport != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('🎓 75-Q Career Test Result', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1E40AF))),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(color: const Color(0xFFDBEAFE), borderRadius: BorderRadius.circular(12)),
                                    child: Text(
                                      (assessmentReport['recommendedGroup'] ?? 'Evaluated').toString(),
                                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF1D4ED8)),
                                    ),
                                  ),
                                ],
                              ),
                              if (assessmentReport['recommendedJobs'] != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Ideal Careers: ${assessmentReport['recommendedJobs']}',
                                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF1E3A8A)),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Visit History
                      Text('Visit History', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F766E))),
                      const SizedBox(height: 8),
                      if (visits.isEmpty)
                        Text('No visits recorded yet.', style: GoogleFonts.inter(fontSize: 13, fontStyle: FontStyle.italic, color: const Color(0xFF94A3B8)))
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: visits.length,
                          separatorBuilder: (ctx, i) => const SizedBox(height: 6),
                          itemBuilder: (context, idx) {
                            final v = visits[idx];
                            final vDate = (v['visitDate'] ?? '').toString();
                            final rem = (v['remarks'] ?? 'No remarks').toString();
                            return Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(_formatDisplayDate(vDate), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF64748B))),
                                  const SizedBox(height: 2),
                                  Text(rem, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF1E293B))),
                                ],
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () => Navigator.pop(ctx),
                      child: Text('Close', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F766E),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        _openVisitModal(s);
                      },
                      child: Text('Record Visit', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: const Color(0xFF334155))),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              color: const Color(0xFF0F172A),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final counts = _filterCounts;
    final filtered = _filteredStudents;
    final dateStr = _formatDate(_selectedDate);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Village Visits', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
            Text('Field Survey & Tracking', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8), letterSpacing: 0.5)),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFF34D399).withValues(alpha: 0.4)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircleAvatar(radius: 3, backgroundColor: Color(0xFF34D399)),
                const SizedBox(width: 5),
                Text('Online', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF6EE7B7))),
              ],
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Colors.red, size: 48),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: const Color(0xFF64748B))),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _fetchInitialData, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => _fetchStudentsOnly(forceRefresh: true),
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                        sliver: SliverToBoxAdapter(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Filter Card
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2)),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // 1. Date Selector
                                    Text('DATE', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF475569), letterSpacing: 0.5)),
                                    const SizedBox(height: 6),
                                    GestureDetector(
                                      onTap: () async {
                                        final picked = await showDatePicker(
                                          context: context,
                                          initialDate: _selectedDate,
                                          firstDate: DateTime(2024),
                                          lastDate: DateTime(2028),
                                        );
                                        if (picked != null) {
                                          setState(() {
                                            _selectedDate = picked;
                                            _recomputeFilteredStudents();
                                          });
                                        }
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF8FAFC),
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(color: const Color(0xFFCBD5E1)),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.calendar_month_rounded, size: 16, color: Color(0xFF64748B)),
                                            const SizedBox(width: 8),
                                            Text(_formatDate(_selectedDate), style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),

                                    // 2. Mandal & Village 2-Column Grid
                                    Row(
                                      children: [
                                        // Mandal Dropdown
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text('SELECT MANDAL', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF475569), letterSpacing: 0.5)),
                                              const SizedBox(height: 4),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF8FAFC),
                                                  borderRadius: BorderRadius.circular(10),
                                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                                ),
                                                child: DropdownButtonHideUnderline(
                                                  child: DropdownButton<String>(
                                                    value: (_selectedMandalId != null && _uniqueMandals.any((m) => m.key == _selectedMandalId))
                                                        ? _selectedMandalId
                                                        : '',
                                                    isExpanded: true,
                                                    icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF64748B)),
                                                    items: [
                                                      const DropdownMenuItem(value: '', child: Text('All Mandals', style: TextStyle(fontSize: 12))),
                                                      ..._uniqueMandals.map((m) => DropdownMenuItem(
                                                            value: m.key,
                                                            child: Text(m.value, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis),
                                                          )),
                                                    ],
                                                    onChanged: (val) {
                                                      setState(() {
                                                        _selectedMandalId = (val != null && val.isNotEmpty) ? val : null;
                                                        _selectedVillageId = null;
                                                        _selectedSchool = null;
                                                        _recomputeVillagesAndSchools();
                                                        _recomputeFilteredStudents();
                                                      });
                                                    },
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 10),

                                        // Village Dropdown
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text('SELECT VILLAGE', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF475569), letterSpacing: 0.5)),
                                              const SizedBox(height: 4),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF8FAFC),
                                                  borderRadius: BorderRadius.circular(10),
                                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                                ),
                                                child: DropdownButtonHideUnderline(
                                                  child: DropdownButton<String>(
                                                    value: (_selectedVillageId != null && _uniqueVillages.any((v) => v.key == _selectedVillageId))
                                                        ? _selectedVillageId
                                                        : '',
                                                    isExpanded: true,
                                                    icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF64748B)),
                                                    items: [
                                                      const DropdownMenuItem(value: '', child: Text('All Villages', style: TextStyle(fontSize: 12))),
                                                      ..._uniqueVillages.map((v) {
                                                        final count = _villageCounts[v.value.toLowerCase()] ?? 0;
                                                        return DropdownMenuItem(
                                                          value: v.key,
                                                          child: Text(
                                                            count > 0 ? '${v.value} ($count)' : v.value,
                                                            style: const TextStyle(fontSize: 12),
                                                            overflow: TextOverflow.ellipsis,
                                                          ),
                                                        );
                                                      }),
                                                    ],
                                                    onChanged: (val) {
                                                      setState(() {
                                                        _selectedVillageId = (val != null && val.isNotEmpty) ? val : null;
                                                        _selectedSchool = null;
                                                        _recomputeSchools();
                                                        _recomputeFilteredStudents();
                                                      });
                                                    },
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 14),

                                    const SizedBox(height: 10),

                                    // School Dropdown
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text('SELECT SCHOOL', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF475569), letterSpacing: 0.5)),
                                            if (_selectedSchool != null && _selectedSchool!.isNotEmpty)
                                              GestureDetector(
                                                onTap: () {
                                                  setState(() {
                                                    _selectedSchool = null;
                                                    _recomputeFilteredStudents();
                                                  });
                                                },
                                                child: Text('Clear', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF0284C7))),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF8FAFC),
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(color: const Color(0xFFCBD5E1)),
                                          ),
                                          child: DropdownButtonHideUnderline(
                                            child: DropdownButton<String>(
                                              value: (_selectedSchool != null && _uniqueSchools.contains(_selectedSchool))
                                                  ? _selectedSchool
                                                  : '',
                                              isExpanded: true,
                                              icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF64748B)),
                                              items: [
                                                const DropdownMenuItem(value: '', child: Text('All Schools', style: TextStyle(fontSize: 12))),
                                                ..._uniqueSchools.map((sch) {
                                                  final count = _schoolCounts[sch] ?? 0;
                                                  return DropdownMenuItem(
                                                    value: sch,
                                                    child: Text(
                                                      count > 0 ? '$sch ($count)' : sch,
                                                      style: const TextStyle(fontSize: 12),
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  );
                                                }),
                                              ],
                                              onChanged: (val) {
                                                setState(() {
                                                  _selectedSchool = (val != null && val.isNotEmpty) ? val : null;
                                                  _recomputeFilteredStudents();
                                                });
                                              },
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 14),

                                    // 3. Segmented 5-Filter Tab Row (All, Pending, Met Today, Never Met, Stars)
                                    Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        children: [
                                          _buildSegmentTab('All', counts['all'] ?? 0, 'all', const Color(0xFF0F172A)),
                                          _buildSegmentTab('Pending', counts['pending'] ?? 0, 'pending', const Color(0xFFB45309)),
                                          _buildSegmentTab('Met Today', counts['met'] ?? 0, 'met', const Color(0xFF047857)),
                                          _buildSegmentTab('Never Met', counts['never'] ?? 0, 'never', const Color(0xFF4338CA)),
                                          _buildSegmentTab('★ Stars', counts['star'] ?? 0, 'star', const Color(0xFFD97706)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Search Bar
                              TextField(
                                controller: _searchController,
                                onChanged: (val) {
                                  setState(() {
                                    _searchQuery = val;
                                    _recomputeFilteredStudents();
                                  });
                                },
                                decoration: InputDecoration(
                                  hintText: 'Search name or phone...',
                                  hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                                  prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF94A3B8)),
                                  suffixIcon: _searchQuery.isNotEmpty
                                      ? IconButton(
                                          icon: const Icon(Icons.clear_rounded, size: 18),
                                          onPressed: () {
                                            _searchController.clear();
                                            setState(() {
                                              _searchQuery = '';
                                              _recomputeFilteredStudents();
                                            });
                                          },
                                        )
                                      : null,
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                ),
                              ),
                              const SizedBox(height: 14),

                              // Counter Header
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'STUDENTS ENROLLED',
                                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF475569), letterSpacing: 0.5),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE0E7FF),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      '${filtered.length}',
                                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF4338CA)),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                            ],
                          ),
                        ),
                      ),

                      // Virtualized List of Students (or empty state)
                      if (filtered.isEmpty)
                        SliverPadding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          sliver: SliverToBoxAdapter(
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Column(
                                children: [
                                  const Icon(Icons.search_off_rounded, size: 40, color: Color(0xFF94A3B8)),
                                  const SizedBox(height: 8),
                                  Text('No students found for this filter.', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                                ],
                              ),
                            ),
                          ),
                        )
                      else
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                          sliver: SliverList.separated(
                            itemCount: filtered.length,
                            separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final s = filtered[index] as Map<String, dynamic>;
                              return _buildStudentCard(index, s, dateStr);
                            },
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildStudentCard(int index, Map<String, dynamic> s, String dateStr) {
    final studentId = s['id'].toString();
    final name = s['studentName'] ?? 'Student';
    final phone = (s['phone'] ?? '').toString();
    final whatsapp = (s['whatsapp'] ?? '').toString();
    final father = (s['fatherName'] ?? 'N/A').toString();
    final group = _resolveName(s['group']);
    final village = _resolveName(s['village']);
    final school = _resolveName(s['schoolName']);
    final schoolArea = _resolveName(s['schoolArea']);
    final isMetToday = _wasVisitedOnDate(s, dateStr);

    final visits = (s['visits'] as List<dynamic>?) ?? [];
    final latestVisit = visits.isNotEmpty ? visits.first as Map<String, dynamic> : null;
    final hasPastVisit = !isMetToday && latestVisit != null;
    final isExpanded = _expandedStudentId == studentId;

    final status = (s['leadStatus'] ?? '').toString().toLowerCase();
    final isStarLead = status.contains('star') || status.contains('prime');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isStarLead
              ? const Color(0xFFF59E0B)
              : isMetToday
                  ? const Color(0xFF10B981)
                  : hasPastVisit
                      ? const Color(0xFF93C5FD)
                      : const Color(0xFFE2E8F0),
          width: (isStarLead || isMetToday || hasPastVisit) ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isStarLead ? const Color(0xFFF59E0B).withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.02),
            blurRadius: isStarLead ? 10 : 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Colored Top Indicator Bar
            if (isStarLead)
              Container(height: 4, width: double.infinity, color: const Color(0xFFF59E0B))
            else if (isMetToday)
              Container(height: 4, width: double.infinity, color: const Color(0xFF10B981))
            else if (hasPastVisit)
              Container(height: 3, width: double.infinity, color: const Color(0xFF3B82F6)),

            // Card Header (Always Visible & Tap to Toggle)
            InkWell(
              onTap: () {
                setState(() {
                  _expandedStudentId = isExpanded ? null : studentId;
                });
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    // Index and Student Name
                    Expanded(
                      child: Row(
                        children: [
                          Flexible(
                            child: Text(
                              '${index + 1}. $name',
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.outfit(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          if (isStarLead) ...[
                            const SizedBox(width: 5),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFFCD34D)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star_rounded, size: 12, color: Color(0xFFD97706)),
                                  const SizedBox(width: 2),
                                  Text(
                                    'Star Lead',
                                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFFB45309)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          if (isMetToday) ...[
                            const SizedBox(width: 4),
                            const CircleAvatar(
                              radius: 8,
                              backgroundColor: Color(0xFF059669),
                              child: Icon(Icons.check, size: 11, color: Colors.white),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Status Badge
                    if (isMetToday)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(6), border: Border.all(color: const Color(0xFFA7F3D0))),
                        child: Text('Met Today', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF059669))),
                      )
                    else if (hasPastVisit)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6), border: Border.all(color: const Color(0xFFBFDBFE))),
                        child: Text('Met on ${_formatDisplayDate((latestVisit['visitDate'] ?? '').toString())}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF1D4ED8))),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(6), border: Border.all(color: const Color(0xFFE0E7FF))),
                        child: Text('Never Met', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF4338CA))),
                      ),
                    // Non-clickable Star Lead Identity Icon (Indicator only - No tap action)
                    if (isStarLead) ...[
                      const SizedBox(width: 4),
                      const Tooltip(
                        message: 'Star Lead',
                        child: Icon(
                          Icons.star_rounded,
                          size: 20,
                          color: Color(0xFFF59E0B),
                        ),
                      ),
                    ],
                    const SizedBox(width: 4),

                    // Direct Phone Call Button
                    IconButton(
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                      padding: EdgeInsets.zero,
                      icon: const Icon(Icons.phone_rounded, size: 18, color: Color(0xFF0D9488)),
                      onPressed: () => _makePhoneCall(phone),
                      tooltip: 'Call $phone',
                    ),

                    // Chevron Indicator
                    Icon(
                      isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                      color: const Color(0xFF94A3B8),
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),

            // Accordion Body (Expanded Content)
            if (isExpanded) ...[
              Padding(
                padding: const EdgeInsets.only(left: 14, right: 14, bottom: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Father Name
                    RichText(
                      text: TextSpan(
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                        children: [
                          const TextSpan(text: 'Father: '),
                          TextSpan(text: father, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF334155))),
                        ],
                      ),
                    ),
                    if (school.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      RichText(
                        overflow: TextOverflow.ellipsis,
                        text: TextSpan(
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                          children: [
                            const TextSpan(text: 'School: '),
                            TextSpan(
                              text: '$school${schoolArea.isNotEmpty ? " ($schoolArea)" : ""}',
                              style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),

                    // Group & Village Badges
                    Row(
                      children: [
                        if (group.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Text(group, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF334155))),
                          ),
                        if (group.isNotEmpty && village.isNotEmpty) const SizedBox(width: 6),
                        if (village.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEEF2FF),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFFE0E7FF)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.location_on_rounded, size: 12, color: Color(0xFF4338CA)),
                                const SizedBox(width: 3),
                                Text(village, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF4338CA))),
                              ],
                            ),
                          ),
                      ],
                    ),

                    // Recent Visit remarks box if visit exists
                    if (latestVisit != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isMetToday ? const Color(0xFFECFDF5) : const Color(0xFFF0F9FF),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isMetToday ? const Color(0xFFA7F3D0) : const Color(0xFFBAE6FD)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isMetToday
                                  ? "Today's Visit Remarks:"
                                  : 'Last Met (${_formatDisplayDate((latestVisit['visitDate'] ?? '').toString())}):',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isMetToday ? const Color(0xFF065F46) : const Color(0xFF0369A1),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              (latestVisit['remarks'] ?? 'No remarks recorded').toString(),
                              style: GoogleFonts.inter(fontSize: 12, fontStyle: FontStyle.italic, color: const Color(0xFF334155)),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // Doorstep GPS & Google Maps Navigation Box
                    Builder(builder: (ctx) {
                      final rawAddress = (s['address'] ?? '').toString();
                      final gps = LocationService.extractGps(rawAddress);
                      final cleanLandmark = LocationService.getCleanLandmark(rawAddress);

                      return Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(top: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: gps != null ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: gps != null ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Icon(
                                  gps != null ? Icons.pin_drop_rounded : Icons.location_off_outlined,
                                  size: 16,
                                  color: gps != null ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    cleanLandmark.isNotEmpty
                                        ? cleanLandmark
                                        : (gps != null ? 'Doorstep GPS Saved' : 'No Landmark / GPS tagged'),
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF1E293B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (gps != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDCFCE7),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'GPS PINNED',
                                      style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: const Color(0xFF15803D)),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (gps != null)
                              Row(
                                children: [
                                  // Navigate on Google Maps button
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF0F766E),
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      icon: const Icon(Icons.navigation_rounded, size: 14),
                                      label: Text(
                                        'Route on Maps',
                                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                                      ),
                                      onPressed: () {
                                        LocationService.openGoogleMapsRoute(
                                          lat: gps['lat']!,
                                          lng: gps['lng']!,
                                          studentName: name,
                                        );
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Re-pin Doorstep GPS button
                                  OutlinedButton.icon(
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: const Color(0xFF0D9488),
                                      side: const BorderSide(color: Color(0xFF99F6E4)),
                                      backgroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    icon: const Icon(Icons.my_location_rounded, size: 14),
                                    label: Text(
                                      'Re-pin',
                                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                                    ),
                                    onPressed: () => _pinStudentLocation(s),
                                  ),
                                ],
                              )
                            else
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0D9488),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  icon: const Icon(Icons.my_location_rounded, size: 15),
                                  label: Text(
                                    'Pin Door GPS',
                                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                                  ),
                                  onPressed: () => _pinStudentLocation(s),
                                ),
                              ),
                          ],
                        ),
                      );
                    }),

                    const Divider(height: 20),

                    // Actions Row (WhatsApp, Full Details, Edit Profile, Record/Update Visit)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            // WhatsApp Button
                            if (whatsapp.isNotEmpty || phone.isNotEmpty)
                              IconButton(
                                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                                style: IconButton.styleFrom(backgroundColor: const Color(0xFFECFDF5)),
                                icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16, color: Color(0xFF059669)),
                                tooltip: 'WhatsApp Message / Pamphlet',
                                onPressed: () async {
                                  final session = await ApiService.getSession();
                                  final empName = session['name'] ?? 'PRO Officer';
                                  final empPhone = session['identifier'] ?? '';
                                  if (mounted) {
                                    WhatsAppTemplateService.showTemplateSelector(
                                      context,
                                      student: Map<String, dynamic>.from(s),
                                      employeeName: empName,
                                      employeePhone: empPhone,
                                    );
                                  }
                                },
                              ),
                            const SizedBox(width: 6),

                            // Star Lead Button
                            TextButton.icon(
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                foregroundColor: isStarLead ? const Color(0xFFD97706) : const Color(0xFF64748B),
                                backgroundColor: isStarLead ? const Color(0xFFFEF3C7) : const Color(0xFFF1F5F9),
                              ),
                              icon: Icon(
                                isStarLead ? Icons.star_rounded : Icons.star_outline_rounded,
                                size: 14,
                                color: isStarLead ? const Color(0xFFD97706) : const Color(0xFF64748B),
                              ),
                              label: Text(
                                isStarLead ? 'Star Lead' : 'Mark Star',
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                              ),
                              onPressed: () => _toggleStarLead(s),
                            ),
                            const SizedBox(width: 6),

                            // Full Details Button
                            TextButton.icon(
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                foregroundColor: const Color(0xFF0EA5E9),
                              ),
                              icon: const Icon(Icons.visibility_outlined, size: 14),
                              label: Text('Full Details', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700)),
                              onPressed: () => _openStudentDetailsModal(s),
                            ),
                          ],
                        ),

                        Row(
                          children: [
                            // Edit Profile Button
                            IconButton(
                              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                              style: IconButton.styleFrom(backgroundColor: const Color(0xFFF1F5F9)),
                              icon: const Icon(Icons.edit_outlined, size: 16, color: Color(0xFF475569)),
                              tooltip: 'Edit Profile',
                              onPressed: () async {
                                final added = await Navigator.push(context, MaterialPageRoute(builder: (_) => AddStudentScreen(student: s)));
                                if (added == true && mounted) {
                                  _fetchInitialData(forceRefresh: true);
                                }
                              },
                            ),
                            const SizedBox(width: 8),

                            // Record / Edit Visit Button
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isMetToday
                                    ? const Color(0xFFECFDF5)
                                    : hasPastVisit
                                        ? const Color(0xFFEFF6FF)
                                        : const Color(0xFF4F46E5),
                                foregroundColor: isMetToday
                                    ? const Color(0xFF059669)
                                    : hasPastVisit
                                        ? const Color(0xFF1D4ED8)
                                        : Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                elevation: 0,
                                side: BorderSide(
                                  color: isMetToday
                                      ? const Color(0xFFA7F3D0)
                                      : hasPastVisit
                                          ? const Color(0xFFBFDBFE)
                                          : Colors.transparent,
                                ),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              icon: Icon(isMetToday ? Icons.edit_note_rounded : Icons.add_circle_outline_rounded, size: 16),
                              label: Text(
                                isMetToday ? 'Update Visit' : 'Add Visit',
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                              ),
                              onPressed: () => _openVisitModal(s),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSegmentTab(String title, int count, String value, Color activeColor) {
    final isSelected = _statusFilter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _statusFilter = value;
            _recomputeFilteredStudents();
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isSelected
                ? [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 1)),
                  ]
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? activeColor : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '($count)',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? activeColor : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
