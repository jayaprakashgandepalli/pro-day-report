import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../services/whatsapp_template_service.dart';
import 'add_student_screen.dart';
import 'pdf_report_screen.dart';

class StudentsListScreen extends StatefulWidget {
  final bool isStarLeads;
  final String? initialFilter;

  const StudentsListScreen({
    super.key,
    this.isStarLeads = false,
    this.initialFilter,
  });

  @override
  State<StudentsListScreen> createState() => _StudentsListScreenState();
}

class _StudentsListScreenState extends State<StudentsListScreen> {
  List<dynamic> _allStudents = [];
  List<dynamic> _baseStudents = [];
  List<dynamic> _filteredStudents = [];
  Map<String, String> _configMap = {};
  Map<String, String> _configParentMap = {};

  bool _isLoading = true;
  bool _isOffline = false;
  String? _error;
  final _searchController = TextEditingController();

  // Status Filter: '' (all), 'admitted', 'incomplete'
  String _statusFilter = '';

  // Location Filters
  String _filterMandal = '';
  String _filterVillage = '';
  String _filterSchool = '';

  // Computed dropdown lists
  List<Map<String, dynamic>> _mandals = [];
  List<Map<String, dynamic>> _villages = [];
  List<Map<String, dynamic>> _schools = [];

  // Dynamic status counts
  Map<String, int> _statusCounts = {'': 0, 'admitted': 0, 'incomplete': 0};

  // Expanded student card
  String? _expandedStudentId;

  @override
  void initState() {
    super.initState();
    if (widget.initialFilter != null) {
      _statusFilter = widget.initialFilter!;
    }
    _fetchData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchData({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ApiService.getStudents(
          limit: 1000,
          minimal: true,
          forceRefresh: forceRefresh,
        ),
        ApiService.getConfigMap(),
        ApiService.getConfigParentMap(),
      ]);

      if (!mounted) return;

      final res = results[0];
      _configMap = results[1] as Map<String, String>;
      _configParentMap = results[2] as Map<String, String>;

      if (res['success'] == true) {
        _isOffline = res['offline'] == true;
        final list = (res['students'] as List<dynamic>?) ?? [];
        _allStudents = list;

        if (widget.isStarLeads) {
          _baseStudents = list.where((s) {
            final interest = ApiService.resolveConfig(s['studyInterestedAt']).toLowerCase();
            final fee = ApiService.resolveConfig(s['ableToBearFee']).toLowerCase();
            final g = ApiService.resolveConfig(s['group']).toUpperCase();

            final isVizag = interest.contains('vizag') || interest.contains('visakha');
            final isBearable = fee.contains('yes') || fee.contains('bearable');
            final isTargetGroup = g.contains('MPC') || g.contains('BIPC');

            return isVizag && isBearable && isTargetGroup;
          }).toList();
        } else {
          _baseStudents = list;
        }

        _recomputeFilters();
        setState(() => _isLoading = false);
      } else {
        setState(() {
          _error = res['error'] ?? 'Failed to load students';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Error loading students: $e';
        _isLoading = false;
      });
    }
  }

  String _resolveName(dynamic val) {
    if (val == null) return '';
    final str = val.toString().trim();
    if (str.isEmpty) return '';
    return _configMap[str] ?? ApiService.resolveConfig(str);
  }

  String _getStudentMandalId(dynamic s) {
    if (s is! Map) return '';
    final m = (s['mandal'] ?? '').toString().trim();
    if (m.isNotEmpty) return m;
    final v = (s['village'] ?? '').toString().trim();
    if (v.isNotEmpty) {
      final p = _configParentMap[v] ?? '';
      if (p.isNotEmpty) return p;
    }
    return '';
  }

  String _getStudentVillageId(dynamic s) {
    if (s is! Map) return '';
    return (s['village'] ?? '').toString().trim();
  }

  String _getStudentSchoolName(dynamic s) {
    if (s is! Map) return '';
    return (s['schoolName'] ?? '').toString().trim();
  }

  bool _matchesMandal(dynamic s, String filterMandal) {
    if (filterMandal.isEmpty) return true;
    final mId = _getStudentMandalId(s);
    if (mId == filterMandal) return true;
    final filterName = _resolveName(filterMandal).toLowerCase();
    if (filterName.isNotEmpty) {
      if (_resolveName(mId).toLowerCase() == filterName) return true;
      final raw = (s['mandal'] ?? '').toString().trim();
      if (_resolveName(raw).toLowerCase() == filterName) return true;
    }
    return false;
  }

  bool _matchesVillage(dynamic s, String filterVillage) {
    if (filterVillage.isEmpty) return true;
    final vId = _getStudentVillageId(s);
    if (vId == filterVillage) return true;
    final filterName = _resolveName(filterVillage).toLowerCase();
    if (filterName.isNotEmpty && _resolveName(vId).toLowerCase() == filterName) return true;
    return false;
  }

  bool _matchesSchool(dynamic s, String filterSchool) {
    if (filterSchool.isEmpty) return true;
    final sch = _getStudentSchoolName(s);
    if (sch.toLowerCase() == filterSchool.toLowerCase()) return true;
    final res = _resolveName(sch).toLowerCase();
    if (res.isNotEmpty && res == filterSchool.toLowerCase()) return true;
    return false;
  }

  bool _matchesStatus(dynamic s, String status) {
    if (status.isEmpty) return true;
    if (s is! Map) return false;
    if (status == 'admitted') {
      final leadStatus = (s['leadStatus'] ?? '').toString().toLowerCase();
      final joined = (s['joinedCollegeId'] ?? '').toString().trim();
      return leadStatus == 'admitted' || joined.isNotEmpty;
    }
    if (status == 'incomplete') {
      final comp = _getProfileCompletion(Map<String, dynamic>.from(s));
      return comp['status'] != 'Complete';
    }
    return true;
  }

  bool _matchesSearch(dynamic s, String query) {
    if (query.isEmpty) return true;
    if (s is! Map) return false;
    final q = query.toLowerCase();
    final name = (s['studentName'] ?? '').toString().toLowerCase();
    final phone = (s['phone'] ?? '').toString().toLowerCase();
    final school = _resolveName(s['schoolName']).toLowerCase();
    final village = _resolveName(s['village']).toLowerCase();
    final mandal = _resolveName(s['mandal']).toLowerCase();
    final group = _resolveName(s['group']).toLowerCase();
    return name.contains(q) ||
        phone.contains(q) ||
        school.contains(q) ||
        village.contains(q) ||
        mandal.contains(q) ||
        group.contains(q);
  }

  void _recomputeFilters() {
    // 1. Mandals computation from all base students
    final Map<String, int> mandalCounts = {};
    for (final s in _baseStudents) {
      final mId = _getStudentMandalId(s);
      if (mId.isNotEmpty) {
        mandalCounts[mId] = (mandalCounts[mId] ?? 0) + 1;
      }
    }
    final List<Map<String, dynamic>> mandals = mandalCounts.entries.map((e) {
      final id = e.key;
      final name = _resolveName(id);
      return {'id': id, 'name': name.isNotEmpty ? name : id, 'count': e.value};
    }).toList();
    mandals.sort((a, b) => (a['name'] as String).compareTo(b['name'] as String));
    _mandals = mandals;

    if (_filterMandal.isNotEmpty && !_mandals.any((m) => m['id'] == _filterMandal)) {
      _filterMandal = '';
    }

    // 2. Villages computation (within selected mandal)
    final Map<String, int> villageCounts = {};
    for (final s in _baseStudents) {
      if (_filterMandal.isNotEmpty && !_matchesMandal(s, _filterMandal)) continue;
      final vId = _getStudentVillageId(s);
      if (vId.isNotEmpty) {
        villageCounts[vId] = (villageCounts[vId] ?? 0) + 1;
      }
    }
    final List<Map<String, dynamic>> villages = villageCounts.entries.map((e) {
      final id = e.key;
      final name = _resolveName(id);
      return {'id': id, 'name': name.isNotEmpty ? name : id, 'count': e.value};
    }).toList();
    villages.sort((a, b) => (a['name'] as String).compareTo(b['name'] as String));
    _villages = villages;

    if (_filterVillage.isNotEmpty && !_villages.any((v) => v['id'] == _filterVillage)) {
      _filterVillage = '';
    }

    // 3. Schools computation (within selected mandal & village)
    final Map<String, int> schoolCounts = {};
    for (final s in _baseStudents) {
      if (_filterMandal.isNotEmpty && !_matchesMandal(s, _filterMandal)) continue;
      if (_filterVillage.isNotEmpty && !_matchesVillage(s, _filterVillage)) continue;
      final sch = _getStudentSchoolName(s);
      if (sch.isNotEmpty) {
        schoolCounts[sch] = (schoolCounts[sch] ?? 0) + 1;
      }
    }
    final List<Map<String, dynamic>> schools = schoolCounts.entries.map((e) {
      final name = e.key;
      return {'id': name, 'name': name, 'count': e.value};
    }).toList();
    schools.sort((a, b) => (a['name'] as String).compareTo(b['name'] as String));
    _schools = schools;

    if (_filterSchool.isNotEmpty && !_schools.any((sc) => sc['id'] == _filterSchool)) {
      _filterSchool = '';
    }

    // 4. Status counts (within selected locations & search query)
    final query = _searchController.text.trim();
    int allCount = 0;
    int admittedCount = 0;
    int incompleteCount = 0;

    for (final s in _baseStudents) {
      if (!_matchesMandal(s, _filterMandal)) continue;
      if (!_matchesVillage(s, _filterVillage)) continue;
      if (!_matchesSchool(s, _filterSchool)) continue;
      if (!_matchesSearch(s, query)) continue;

      allCount++;
      if (_matchesStatus(s, 'admitted')) admittedCount++;
      if (_matchesStatus(s, 'incomplete')) incompleteCount++;
    }

    _statusCounts = {
      '': allCount,
      'admitted': admittedCount,
      'incomplete': incompleteCount,
    };

    // 5. Final filtered students
    _filteredStudents = _baseStudents.where((s) {
      return _matchesMandal(s, _filterMandal) &&
          _matchesVillage(s, _filterVillage) &&
          _matchesSchool(s, _filterSchool) &&
          _matchesStatus(s, _statusFilter) &&
          _matchesSearch(s, query);
    }).toList();
  }

  // Profile completion calculation matching old web app
  Map<String, dynamic> _getProfileCompletion(Map<String, dynamic> s) {
    final List<Map<String, dynamic>> fields = [
      {'val': s['fatherName'], 'label': 'Father Name'},
      {'val': s['district'], 'label': 'District'},
      {'val': s['schoolName'], 'label': 'School'},
      {'val': s['gender'], 'label': 'Gender'},
      {'val': s['occupation'], 'label': 'Occupation'},
    ];

    final missing = fields
        .where((f) => f['val'] == null || f['val'].toString().trim().isEmpty)
        .map((f) => f['label'] as String)
        .toList();

    if (missing.length == fields.length) {
      return {
        'status': 'Incomplete',
        'color': const Color(0xFFEF4444),
        'bg': const Color(0xFFFEE2E2),
        'missing': missing,
      };
    } else if (missing.isNotEmpty) {
      return {
        'status': 'Partial',
        'color': const Color(0xFFF59E0B),
        'bg': const Color(0xFFFEF3C7),
        'missing': missing,
      };
    } else {
      return {
        'status': 'Complete',
        'color': const Color(0xFF10B981),
        'bg': const Color(0xFFD1FAE5),
        'missing': <String>[],
      };
    }
  }

  Future<void> _makePhoneCall(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.isEmpty) return;
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _confirmDeleteStudent(Map<String, dynamic> student) async {
    final studentId = student['id']?.toString() ?? '';
    final studentName = student['studentName']?.toString() ?? 'this student';

    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.delete_forever_rounded, color: Color(0xFFDC2626), size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Delete Student?',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18),
              ),
            ),
          ],
        ),
        content: Text(
          'Are you sure you want to delete "$studentName"? This will permanently remove the student profile and all associated data.',
          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(
              'Delete',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );

    if (shouldDelete == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Text('Deleting $studentName...'),
            ],
          ),
          duration: const Duration(seconds: 2),
        ),
      );

      final res = await ApiService.deleteStudent(studentId);
      if (!mounted) return;

      if (res['success'] == true) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF059669),
            content: Text('Student "$studentName" deleted successfully.'),
          ),
        );
        setState(() {
          _allStudents.removeWhere((s) => s['id']?.toString() == studentId);
          _baseStudents.removeWhere((s) => s['id']?.toString() == studentId);
          _recomputeFilters();
        });
      } else {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text(res['error'] ?? 'Failed to delete student.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool hasActiveFilters = _statusFilter.isNotEmpty ||
        _filterMandal.isNotEmpty ||
        _filterVillage.isNotEmpty ||
        _filterSchool.isNotEmpty ||
        _searchController.text.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.isStarLeads ? 'Hot Prospects' : 'All Students',
              style: GoogleFonts.outfit(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            Row(
              children: [
                Text(
                  '${_filteredStudents.length} Students Enrolled',
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
                ),
                if (_isOffline) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: const Color(0xFFF59E0B), width: 0.8),
                    ),
                    child: Text(
                      'OFFLINE',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFB45309),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
        actions: [
          // PDF Report shortcut matching old app header
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFF4F46E5)),
            tooltip: 'Generate PDF',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PdfReportScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B)),
            tooltip: 'Refresh',
            onPressed: () => _fetchData(forceRefresh: true),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_rounded),
        label: Text('Add Student', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        onPressed: () async {
          final added = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddStudentScreen()),
          );
          if (added == true) _fetchData(forceRefresh: true);
        },
      ),
      body: Column(
        children: [
          // Prime banner if Hot prospects
          if (widget.isStarLeads)
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Text(
                'Showing students interested in Vizag, can bear fee, and studying MPC/BIPC.',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFFD97706)),
              ),
            ),

          // Status Filter Tabs
          if (!widget.isStarLeads) ...[
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildStatusChip('All Students (${_statusCounts[''] ?? 0})', '', _statusFilter == ''),
                    const SizedBox(width: 8),
                    _buildStatusChip('✓ Admitted (${_statusCounts['admitted'] ?? 0})', 'admitted', _statusFilter == 'admitted', color: const Color(0xFF16A34A)),
                    const SizedBox(width: 8),
                    _buildStatusChip('⚠️ Incomplete Profiles (${_statusCounts['incomplete'] ?? 0})', 'incomplete', _statusFilter == 'incomplete', color: const Color(0xFFEF4444)),
                  ],
                ),
              ),
            ),

            // Location Filters Dropdowns (Mandals, Villages, Schools)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: Row(
                children: [
                  Expanded(
                    child: _buildLocationDropdown(
                      value: _filterMandal,
                      hint: 'All Mandals',
                      items: _mandals,
                      onChanged: (val) {
                        setState(() {
                          _filterMandal = val ?? '';
                          _filterVillage = '';
                          _filterSchool = '';
                          _recomputeFilters();
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _buildLocationDropdown(
                      value: _filterVillage,
                      hint: 'All Villages',
                      items: _villages,
                      onChanged: (val) {
                        setState(() {
                          _filterVillage = val ?? '';
                          _filterSchool = '';
                          _recomputeFilters();
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _buildLocationDropdown(
                      value: _filterSchool,
                      hint: 'All Schools',
                      items: _schools,
                      onChanged: (val) {
                        setState(() {
                          _filterSchool = val ?? '';
                          _recomputeFilters();
                        });
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Search Box & Reset Filters row
          Container(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: (_) {
                      setState(() => _recomputeFilters());
                    },
                    style: GoogleFonts.inter(fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search name, phone, school, village...',
                      hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 12),
                      prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF6366F1), size: 18),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 16),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _recomputeFilters());
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFFF1F5F9),
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                if (hasActiveFilters) ...[
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: () {
                      setState(() {
                        _statusFilter = '';
                        _filterMandal = '';
                        _filterVillage = '';
                        _filterSchool = '';
                        _searchController.clear();
                        _recomputeFilters();
                      });
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.filter_alt_off_rounded, size: 14, color: Color(0xFFDC2626)),
                          const SizedBox(width: 4),
                          Text(
                            'Clear',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFFDC2626),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Students List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 40),
                              const SizedBox(height: 12),
                              Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: const Color(0xFF64748B))),
                              const SizedBox(height: 16),
                              ElevatedButton(onPressed: () => _fetchData(forceRefresh: true), child: const Text('Try Again')),
                            ],
                          ),
                        ),
                      )
                    : _filteredStudents.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.school_outlined, size: 48, color: Color(0xFFCBD5E1)),
                                const SizedBox(height: 12),
                                Text(
                                  hasActiveFilters
                                      ? 'No students match the selected filters.'
                                      : 'No students enrolled yet.',
                                  style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 14),
                                ),
                                if (hasActiveFilters) ...[
                                  const SizedBox(height: 12),
                                  TextButton.icon(
                                    onPressed: () {
                                      setState(() {
                                        _statusFilter = '';
                                        _filterMandal = '';
                                        _filterVillage = '';
                                        _filterSchool = '';
                                        _searchController.clear();
                                        _recomputeFilters();
                                      });
                                    },
                                    icon: const Icon(Icons.refresh_rounded, size: 16),
                                    label: const Text('Reset All Filters'),
                                  ),
                                ],
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _fetchData(forceRefresh: true),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _filteredStudents.length,
                              separatorBuilder: (context, index) => const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final s = Map<String, dynamic>.from(_filteredStudents[index]);
                                final id = s['id']?.toString() ?? index.toString();
                                final isExpanded = _expandedStudentId == id;
                                final name = s['studentName'] ?? 'No Name';
                                final phone = s['phone'] ?? '';
                                final group = _resolveName(s['group']);
                                final school = _resolveName(s['schoolName']);
                                final isAdmitted = s['leadStatus'] == 'Admitted' ||
                                    (s['joinedCollegeId'] != null && s['joinedCollegeId'].toString().isNotEmpty);
                                final comp = _getProfileCompletion(s);
                                final missingFields = comp['missing'] as List<String>;

                                return Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isAdmitted ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.02),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    children: [
                                      // Card Header
                                      InkWell(
                                        onTap: () {
                                          setState(() {
                                            _expandedStudentId = isExpanded ? null : id;
                                          });
                                        },
                                        borderRadius: BorderRadius.circular(16),
                                        child: Padding(
                                          padding: const EdgeInsets.all(14),
                                          child: Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              // Index Badge
                                              Container(
                                                width: 26,
                                                height: 26,
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF1F5F9),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Center(
                                                  child: Text(
                                                    '${index + 1}',
                                                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700),
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 10),

                                              // Main Info
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Row(
                                                      children: [
                                                        Expanded(
                                                          child: Text(
                                                            name,
                                                            maxLines: 1,
                                                            overflow: TextOverflow.ellipsis,
                                                            style: GoogleFonts.outfit(
                                                              fontSize: 15,
                                                              fontWeight: FontWeight.w700,
                                                              color: const Color(0xFF0F172A),
                                                            ),
                                                          ),
                                                        ),
                                                        const SizedBox(width: 6),
                                                        // Completion Badge
                                                        Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                          decoration: BoxDecoration(
                                                            color: comp['bg'] as Color,
                                                            borderRadius: BorderRadius.circular(4),
                                                          ),
                                                          child: Text(
                                                            comp['status'] as String,
                                                            style: GoogleFonts.inter(
                                                              fontSize: 10,
                                                              fontWeight: FontWeight.w700,
                                                              color: comp['color'] as Color,
                                                            ),
                                                          ),
                                                        ),
                                                        const SizedBox(width: 6),
                                                        // Admitted / Group Badge
                                                        if (isAdmitted)
                                                          Container(
                                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                            decoration: BoxDecoration(
                                                              color: const Color(0xFFDCFCE7),
                                                              borderRadius: BorderRadius.circular(6),
                                                            ),
                                                            child: Text(
                                                              'Admitted',
                                                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF166534)),
                                                            ),
                                                          )
                                                        else if (group.isNotEmpty)
                                                          Container(
                                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                            decoration: BoxDecoration(
                                                              color: const Color(0xFFEEF2FF),
                                                              borderRadius: BorderRadius.circular(6),
                                                            ),
                                                            child: Text(
                                                              group,
                                                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF4F46E5)),
                                                            ),
                                                          ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 3),

                                                    // Missing Fields Warning (if any)
                                                    if (missingFields.isNotEmpty)
                                                      Padding(
                                                        padding: const EdgeInsets.only(bottom: 3),
                                                        child: Text(
                                                          'Missing: ${missingFields.join(', ')}',
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFEF4444), fontWeight: FontWeight.w500),
                                                        ),
                                                      ),

                                                    // Phone & School
                                                    Text(
                                                      'Phone: $phone${school.isNotEmpty ? ' • $school' : ''}',
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                                    ),
                                                  ],
                                                ),
                                              ),

                                              const SizedBox(width: 6),
                                              Icon(
                                                isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                                                color: const Color(0xFF94A3B8),
                                                size: 20,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),

                                      // Expanded Body
                                      if (isExpanded) ...[
                                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                        Padding(
                                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              // Father Name
                                              RichText(
                                                text: TextSpan(
                                                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                                  children: [
                                                    const TextSpan(text: 'Father: '),
                                                    TextSpan(
                                                      text: s['fatherName'] ?? 'No Father Name',
                                                      style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              const SizedBox(height: 6),

                                              // Village & Mandal
                                              if (_resolveName(s['village']).isNotEmpty || _resolveName(s['mandal']).isNotEmpty)
                                                Padding(
                                                  padding: const EdgeInsets.only(bottom: 6),
                                                  child: Text(
                                                    'Location: ${_resolveName(s['village'])} ${_resolveName(s['mandal'])}'.trim(),
                                                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                                  ),
                                                ),

                                              // If Admitted
                                              if (isAdmitted)
                                                Container(
                                                  margin: const EdgeInsets.symmetric(vertical: 8),
                                                  padding: const EdgeInsets.all(10),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFF0FDF4),
                                                    borderRadius: BorderRadius.circular(8),
                                                    border: Border.all(color: const Color(0xFFBBF7D0)),
                                                  ),
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        'Admitted to: ${s['joinedCollege']?['name'] ?? 'College Branch'}',
                                                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF166534)),
                                                      ),
                                                      if (s['applicationNumber'] != null)
                                                        Text(
                                                          'Application No: ${s['applicationNumber']}',
                                                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF15803D)),
                                                        ),
                                                    ],
                                                  ),
                                                ),

                                              const Divider(height: 16, color: Color(0xFFF1F5F9)),

                                              // Action Buttons Row (Full Details, Edit, Call, WhatsApp, Delete)
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  // Full Details & Edit buttons
                                                  Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      TextButton.icon(
                                                        onPressed: () => _showStudentDetails(s),
                                                        icon: const Icon(Icons.visibility_outlined, size: 16),
                                                        label: const Text('Full Details'),
                                                        style: TextButton.styleFrom(
                                                          foregroundColor: const Color(0xFF0EA5E9),
                                                          padding: EdgeInsets.zero,
                                                          visualDensity: VisualDensity.compact,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 8),
                                                      InkWell(
                                                        onTap: () async {
                                                          final updated = await Navigator.push(
                                                            context,
                                                            MaterialPageRoute(builder: (_) => AddStudentScreen(student: s)),
                                                          );
                                                          if (updated == true) _fetchData(forceRefresh: true);
                                                        },
                                                        borderRadius: BorderRadius.circular(6),
                                                        child: Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                          decoration: BoxDecoration(
                                                            color: const Color(0xFFEFF6FF),
                                                            borderRadius: BorderRadius.circular(6),
                                                            border: Border.all(color: const Color(0xFFBFDBFE)),
                                                          ),
                                                          child: Row(
                                                            mainAxisSize: MainAxisSize.min,
                                                            children: [
                                                              const Icon(Icons.edit_outlined, size: 13, color: Color(0xFF2563EB)),
                                                              const SizedBox(width: 3),
                                                              Text(
                                                                'Edit',
                                                                style: GoogleFonts.inter(
                                                                  fontSize: 11,
                                                                  fontWeight: FontWeight.w700,
                                                                  color: const Color(0xFF2563EB),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),

                                                  // Action Icons & Delete
                                                  Row(
                                                    children: [
                                                      // Call
                                                      if (phone.isNotEmpty)
                                                        IconButton(
                                                          icon: const Icon(Icons.phone_rounded, color: Color(0xFF10B981), size: 20),
                                                          tooltip: 'Call $phone',
                                                          onPressed: () => _makePhoneCall(phone),
                                                        ),

                                                      // WhatsApp
                                                      IconButton(
                                                        icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF25D366), size: 20),
                                                        tooltip: 'WhatsApp Message / Pamphlet',
                                                        onPressed: () async {
                                                          final session = await ApiService.getSession();
                                                          final empName = session['name'] ?? 'PRO Officer';
                                                          final empPhone = session['identifier'] ?? '';
                                                          if (context.mounted) {
                                                            WhatsAppTemplateService.showTemplateSelector(
                                                              context,
                                                              student: Map<String, dynamic>.from(s),
                                                              employeeName: empName,
                                                              employeePhone: empPhone,
                                                            );
                                                          }
                                                        },
                                                      ),

                                                      // Delete Student
                                                      ElevatedButton.icon(
                                                        onPressed: () => _confirmDeleteStudent(s),
                                                        icon: const Icon(Icons.delete_outline_rounded, size: 16),
                                                        label: const Text('Delete'),
                                                        style: ElevatedButton.styleFrom(
                                                          backgroundColor: const Color(0xFFFEE2E2),
                                                          foregroundColor: const Color(0xFFDC2626),
                                                          elevation: 0,
                                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                                          shape: RoundedRectangleBorder(
                                                            borderRadius: BorderRadius.circular(8),
                                                            side: const BorderSide(color: Color(0xFFFCA5A5)),
                                                          ),
                                                        ),
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
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String label, String key, bool isSelected, {Color? color}) {
    final chipColor = color ?? const Color(0xFF0F172A);
    return InkWell(
      onTap: () {
        setState(() {
          _statusFilter = key;
          _recomputeFilters();
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? chipColor : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _buildLocationDropdown({
    required String value,
    required String hint,
    required List<Map<String, dynamic>> items,
    required ValueChanged<String?> onChanged,
  }) {
    final bool hasValue = value.isNotEmpty && items.any((m) => m['id']?.toString() == value);
    final String currentValue = hasValue ? value : '';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      height: 38,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: currentValue.isNotEmpty ? const Color(0xFF6366F1) : const Color(0xFFCBD5E1),
          width: currentValue.isNotEmpty ? 1.5 : 1.0,
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: currentValue,
          isExpanded: true,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: currentValue.isNotEmpty ? const Color(0xFF4338CA) : const Color(0xFF334155),
            fontWeight: currentValue.isNotEmpty ? FontWeight.w600 : FontWeight.w500,
          ),
          icon: Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 18,
            color: currentValue.isNotEmpty ? const Color(0xFF6366F1) : const Color(0xFF64748B),
          ),
          items: [
            DropdownMenuItem(
              value: '',
              child: Text(
                hint,
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF64748B), fontSize: 11),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            ...items.map((m) {
              final id = m['id']?.toString() ?? '';
              final name = m['name']?.toString() ?? id;
              final count = m['count'] ?? 0;
              return DropdownMenuItem(
                value: id,
                child: Text(
                  '$name ($count)',
                  style: GoogleFonts.inter(fontSize: 11),
                  overflow: TextOverflow.ellipsis,
                ),
              );
            }),
          ],
          onChanged: onChanged,
        ),
      ),
    );
  }

  void _showStudentDetails(Map<String, dynamic> s) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s['studentName'] ?? 'Student Profile',
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          'Phone: ${s['phone'] ?? 'N/A'}',
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      InkWell(
                        onTap: () async {
                          Navigator.pop(context);
                          final updated = await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => AddStudentScreen(student: s)),
                          );
                          if (updated == true) _fetchData(forceRefresh: true);
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.edit_outlined, size: 14, color: Color(0xFF2563EB)),
                              const SizedBox(width: 4),
                              Text(
                                'Edit',
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF2563EB)),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () {
                          Navigator.pop(context);
                          _confirmDeleteStudent(s);
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.delete_outline_rounded, size: 14, color: Color(0xFFDC2626)),
                              const SizedBox(width: 4),
                              Text(
                                'Delete',
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFFDC2626)),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _resolveName(s['group']).isNotEmpty ? _resolveName(s['group']) : 'OTHER',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF4F46E5),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildDetailRow(Icons.school_outlined, 'School', _resolveName(s['schoolName'])),
                  _buildDetailRow(Icons.person_outline, "Father's Name", s['fatherName']),
                  _buildDetailRow(Icons.work_outline, 'Occupation', _resolveName(s['occupation'])),
                  _buildDetailRow(Icons.location_on_outlined, 'Village / Mandal', '${_resolveName(s['village'])} ${_resolveName(s['mandal'])}'.trim()),
                  _buildDetailRow(Icons.home_outlined, 'Address', s['address']),
                  _buildDetailRow(Icons.grade_outlined, 'Marks', s['marks']),
                  _buildDetailRow(Icons.interests_outlined, 'Interested At', _resolveName(s['studyInterestedAt'])),
                  _buildDetailRow(Icons.school_outlined, 'Education Stage', _resolveName(s['educationStage'])),
                  _buildDetailRow(Icons.payment_outlined, 'Fee Affordability', _resolveName(s['ableToBearFee'])),
                  _buildDetailRow(Icons.doorbell_outlined, 'Doorstep Visit', s['doorstepCompleted'] == true ? 'Completed' : 'Pending'),
                  if ((s['remarks'] ?? '').isNotEmpty)
                    _buildDetailRow(Icons.comment_outlined, 'Remarks', s['remarks']),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, dynamic value) {
    if (value == null || value.toString().trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: const Color(0xFF6366F1)),
          const SizedBox(width: 12),
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(
              value.toString(),
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A), fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
