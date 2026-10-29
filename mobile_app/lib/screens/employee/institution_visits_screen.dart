import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';

class InstitutionVisitsScreen extends StatefulWidget {
  const InstitutionVisitsScreen({super.key});

  @override
  State<InstitutionVisitsScreen> createState() => _InstitutionVisitsScreenState();
}

class _InstitutionVisitsScreenState extends State<InstitutionVisitsScreen> {
  List<dynamic> _visits = [];
  List<dynamic> _filteredVisits = [];
  bool _isLoading = true;
  String? _error;
  final _searchController = TextEditingController();

  DateTime? _filterDate;
  String _selectedType = 'ALL'; // 'ALL', 'SCHOOL', 'TUITION'

  List<Map<String, dynamic>> _mandals = [];
  List<Map<String, dynamic>> _villages = [];
  List<Map<String, dynamic>> _schools = [];
  List<dynamic> _keyPersons = [];
  final Map<String, String> _mandalNames = {};
  final Map<String, String> _villageNames = {};
  final Map<String, String> _villageToMandal = {};

  @override
  void initState() {
    super.initState();
    _fetchVisits();
    _fetchConfigsAndKeyPersons();
  }

  Future<void> _fetchConfigsAndKeyPersons() async {
    try {
      final confs = await ApiService.getConfigsList();
      final kpRes = await ApiService.getKeyPersons();

      final mandals = <Map<String, dynamic>>[];
      final villages = <Map<String, dynamic>>[];
      final schools = <Map<String, dynamic>>[];
      final mNames = <String, String>{};
      final vNames = <String, String>{};
      final vToM = <String, String>{};

      for (final c in confs) {
        if (c is Map<String, dynamic>) {
          final type = (c['type'] ?? '').toString();
          final id = (c['id'] ?? '').toString();
          final val = (c['value'] ?? '').toString();
          final parentId = (c['parentId'] ?? '').toString();

          if (type == 'MANDAL') {
            mandals.add(c);
            mNames[id] = val;
          } else if (type == 'VILLAGE') {
            villages.add(c);
            vNames[id] = val;
            if (parentId.isNotEmpty) {
              vToM[id] = parentId;
            }
          } else if (type == 'SCHOOL') {
            schools.add(c);
          }
        }
      }

      mandals.sort((a, b) => (a['value'] ?? '').toString().compareTo((b['value'] ?? '').toString()));
      villages.sort((a, b) => (a['value'] ?? '').toString().compareTo((b['value'] ?? '').toString()));
      schools.sort((a, b) => (a['value'] ?? '').toString().compareTo((b['value'] ?? '').toString()));

      if (!mounted) return;
      setState(() {
        _mandals = mandals;
        _villages = villages;
        _schools = schools;
        _mandalNames.addAll(mNames);
        _villageNames.addAll(vNames);
        _villageToMandal.addAll(vToM);
        if (kpRes['success'] == true && kpRes['keyPersons'] is List) {
          _keyPersons = kpRes['keyPersons'] as List<dynamic>;
        }
      });
    } catch (e) {
      debugPrint('Error fetching configs/key-persons: $e');
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatApiDate(DateTime dt) {
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  String _formatDisplayDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  List<Map<String, dynamic>> _getAvailableInstitutionsForType({
    required String type,
    required String? mandalId,
    required String? villageId,
  }) {
    final isTuition = type.toUpperCase() == 'TUITION';
    final result = <Map<String, dynamic>>[];
    final seenNames = <String>{};

    if (isTuition) {
      // 1. Collect Tuition Centers from KeyPersons
      for (final kp in _keyPersons) {
        if (kp is! Map) continue;
        final schName = (kp['schoolName'] ?? '').toString().trim();
        if (schName.isEmpty) continue;

        final desig = (kp['designation'] ?? '').toString().toLowerCase();
        final nameLower = schName.toLowerCase();

        final isExplicitTuition = desig.contains('tuition') ||
            desig.contains('tutor') ||
            desig.contains('coaching') ||
            nameLower.contains('tuition') ||
            nameLower.contains('tution') ||
            nameLower.contains('coach') ||
            nameLower.contains('center') ||
            nameLower.contains('centre') ||
            nameLower.contains('academy') ||
            nameLower.contains('classes') ||
            nameLower.contains('study') ||
            nameLower.contains('tutorial');

        // Check if it's already a regular government/private school in _schools
        final isKnownSchool = _schools.any((s) => (s['value'] ?? '').toString().toLowerCase() == nameLower);
        if (isKnownSchool && !isExplicitTuition) continue;

        final vStr = (kp['village'] ?? '').toString().toLowerCase().trim();
        final cStr = (kp['name'] ?? '').toString().toLowerCase().trim();
        final dedupKey = '${nameLower}_${vStr}_$cStr';

        if (!seenNames.contains(dedupKey)) {
          seenNames.add(dedupKey);
          result.add({
            'id': 'kp_${kp['id'] ?? '${nameLower}_$vStr'}',
            'value': schName,
            'type': 'TUITION',
            'mandal': kp['mandal']?.toString(),
            'village': kp['village']?.toString(),
            'district': kp['district']?.toString(),
            'contactPerson': kp['name']?.toString(),
            'phone': kp['phone']?.toString(),
            'designation': kp['designation']?.toString() ?? 'Tuition Tutor / Owner',
          });
        }
      }

      // 2. Collect any from ConfigValue with type TUITION or tuition in name
      for (final s in _schools) {
        final sVal = (s['value'] ?? '').toString();
        final sLower = sVal.toLowerCase();
        if (s['type'] == 'TUITION' ||
            sLower.contains('tuition') ||
            sLower.contains('tution') ||
            sLower.contains('coaching')) {
          final pId = (s['parentId'] ?? '').toString();
          final dedupKey = '${sLower}_$pId';
          if (!seenNames.contains(dedupKey)) {
            seenNames.add(dedupKey);
            result.add({
              'id': s['id']?.toString() ?? sVal,
              'value': sVal,
              'type': 'TUITION',
              'parentId': s['parentId']?.toString(),
              'headmasterName': s['headmasterName'],
              'headmasterPhone': s['headmasterPhone'],
              'keyPersonName': s['keyPersonName'],
              'keyPersonPhone': s['keyPersonPhone'],
              'strength': s['strength'],
            });
          }
        }
      }

      // 3. Collect from past recorded visits of type TUITION
      for (final v in _visits) {
        if (v is! Map) continue;
        if ((v['type'] ?? '').toString().toUpperCase() == 'TUITION') {
          final vName = (v['name'] ?? '').toString().trim();
          final vLower = vName.toLowerCase();
          final vVill = (v['village'] ?? '').toString().toLowerCase().trim();
          final vCont = (v['contactPerson'] ?? '').toString().toLowerCase().trim();
          final dedupKey = '${vLower}_${vVill}_$vCont';
          if (vName.isNotEmpty && !seenNames.contains(dedupKey)) {
            seenNames.add(dedupKey);
            result.add({
              'id': 'visit_${v['id'] ?? vName}',
              'value': vName,
              'type': 'TUITION',
              'mandal': v['mandal']?.toString(),
              'village': v['village']?.toString(),
              'district': v['district']?.toString(),
              'contactPerson': v['contactPerson']?.toString(),
              'phone': v['phone']?.toString(),
              'designation': 'Tuition Tutor / Owner',
            });
          }
        }
      }
    } else {
      // SCHOOL: Regular schools from ConfigValue
      for (final s in _schools) {
        final sVal = (s['value'] ?? '').toString();
        final sLower = sVal.toLowerCase();
        final isTuitionOnly = s['type'] == 'TUITION' ||
            (sLower.contains('tution center') || sLower.contains('tuition center'));
        if (isTuitionOnly) continue;

        final pId = (s['parentId'] ?? '').toString();
        final dedupKey = '${sLower}_$pId';
        if (!seenNames.contains(dedupKey)) {
          seenNames.add(dedupKey);
          result.add(Map<String, dynamic>.from(s));
        }
      }

      // Also KeyPersons that belong to schools
      for (final kp in _keyPersons) {
        if (kp is! Map) continue;
        final schName = (kp['schoolName'] ?? '').toString().trim();
        final nameLower = schName.toLowerCase();
        final isTuitionOnly = nameLower.contains('tution center') || nameLower.contains('tuition center');
        if (isTuitionOnly) continue;

        if (schName.isNotEmpty) {
          final vStr = (kp['village'] ?? '').toString().toLowerCase().trim();
          final cStr = (kp['name'] ?? '').toString().toLowerCase().trim();
          final dedupKey = '${nameLower}_${vStr}_$cStr';
          if (!seenNames.contains(dedupKey)) {
            if (nameLower.contains('school') || nameLower.contains('high') || nameLower.contains('zphs') || nameLower.contains('convent')) {
              seenNames.add(dedupKey);
              result.add({
                'id': 'kp_${kp['id'] ?? '${nameLower}_$vStr'}',
                'value': schName,
                'type': 'SCHOOL',
                'mandal': kp['mandal']?.toString(),
                'village': kp['village']?.toString(),
                'district': kp['district']?.toString(),
                'contactPerson': kp['name']?.toString(),
                'phone': kp['phone']?.toString(),
                'designation': kp['designation']?.toString() ?? 'HM / Principal',
              });
            }
          }
        }
      }
    }

    // Filter by selected village or mandal
    final filtered = result.where((item) {
      final parentId = item['parentId']?.toString();
      final itemMandal = (item['mandal'] ?? '').toString().trim().toLowerCase();
      final itemVillage = (item['village'] ?? '').toString().trim().toLowerCase();

      final selectedMandalName = mandalId != null ? (_mandalNames[mandalId] ?? '').toLowerCase() : '';
      final selectedVillageName = villageId != null ? (_villageNames[villageId] ?? '').toLowerCase() : '';

      if (villageId != null) {
        if (parentId != null && parentId == villageId) return true;
        if (itemVillage.isNotEmpty && (itemVillage == selectedVillageName || itemVillage == villageId.toLowerCase())) {
          return true;
        }
        return false;
      }

      if (mandalId != null) {
        if (parentId != null) {
          final pMandal = _villageToMandal[parentId];
          if (pMandal == mandalId || parentId == mandalId) return true;
        }
        if (itemMandal.isNotEmpty && (itemMandal == selectedMandalName || itemMandal == mandalId.toLowerCase())) {
          return true;
        }
        if (itemVillage.isNotEmpty) {
          final foundVId = _villageNames.entries.firstWhere(
            (e) => e.value.toLowerCase() == itemVillage,
            orElse: () => const MapEntry('', ''),
          ).key;
          if (foundVId.isNotEmpty && _villageToMandal[foundVId] == mandalId) {
            return true;
          }
        }
        return false;
      }

      return true;
    }).toList();

    filtered.sort((a, b) => (a['value'] ?? '').toString().compareTo((b['value'] ?? '').toString()));
    return filtered;
  }

  Future<void> _fetchVisits() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await ApiService.getInstitutionVisits(
        date: _filterDate != null ? _formatApiDate(_filterDate!) : null,
        type: _selectedType,
        search: _searchController.text.trim().isNotEmpty ? _searchController.text.trim() : null,
      );

      if (!mounted) return;

      if (res['success'] == true) {
        setState(() {
          _visits = (res['visits'] as List<dynamic>?) ?? [];
          _applyLocalFilter();
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = res['error'] ?? 'Failed to load visits';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _applyLocalFilter() {
    final q = _searchController.text.trim().toLowerCase();
    setState(() {
      _filteredVisits = _visits.where((v) {
        if (q.isEmpty) return true;
        final name = (v['name'] ?? '').toString().toLowerCase();
        final contact = (v['contactPerson'] ?? '').toString().toLowerCase();
        final phone = (v['phone'] ?? '').toString().toLowerCase();
        final village = (v['village'] ?? '').toString().toLowerCase();
        final remarks = (v['remarks'] ?? '').toString().toLowerCase();
        return name.contains(q) || contact.contains(q) || phone.contains(q) || village.contains(q) || remarks.contains(q);
      }).toList();
    });
  }

  void _openDateFilterPicker() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _filterDate ?? DateTime.now(),
      firstDate: DateTime(2023),
      lastDate: DateTime(2030),
      helpText: 'SELECT VISIT DATE (PAST OR PRESENT)',
    );

    if (picked != null) {
      setState(() {
        _filterDate = picked;
      });
      _fetchVisits();
    }
  }

  void _openAddEditSheet([Map<String, dynamic>? visit]) {
    final isEditing = visit != null;
    final nameCtrl = TextEditingController(text: visit?['name'] ?? '');
    final contactCtrl = TextEditingController(text: visit?['contactPerson'] ?? '');
    final phoneCtrl = TextEditingController(text: visit?['phone'] ?? '');
    final villageCtrl = TextEditingController(text: visit?['village'] ?? '');
    final studentsCountCtrl = TextEditingController(text: (visit?['studentsMetCount'] ?? '').toString());
    final remarksCtrl = TextEditingController(text: visit?['remarks'] ?? '');

    String selectedType = visit?['type'] ?? 'SCHOOL';
    DateTime selectedVisitDate = visit?['visitDate'] != null
        ? DateTime.tryParse(visit!['visitDate'].toString()) ?? DateTime.now()
        : (_filterDate ?? DateTime.now());

    String? sheetSelectedMandalId;
    String? sheetSelectedVillageId;
    String? sheetSelectedSchoolId;
    List<Map<String, String>> sheetContactOptions = [];

    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          return Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              top: 20,
              left: 20,
              right: 20,
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isEditing ? 'Edit Visit Record' : 'Record School / Tuition Visit',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(sheetCtx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Institution Type Toggle
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => setSheetState(() {
                            if (selectedType != 'SCHOOL') {
                              selectedType = 'SCHOOL';
                              sheetSelectedSchoolId = null;
                              sheetContactOptions = [];
                            }
                          }),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: selectedType == 'SCHOOL' ? const Color(0xFFFEF3C7) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selectedType == 'SCHOOL' ? const Color(0xFFD97706) : const Color(0xFFE2E8F0),
                                width: selectedType == 'SCHOOL' ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.school_rounded, size: 18, color: selectedType == 'SCHOOL' ? const Color(0xFFD97706) : const Color(0xFF64748B)),
                                const SizedBox(width: 8),
                                Text(
                                  'School',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: selectedType == 'SCHOOL' ? const Color(0xFFD97706) : const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: InkWell(
                          onTap: () => setSheetState(() {
                            if (selectedType != 'TUITION') {
                              selectedType = 'TUITION';
                              sheetSelectedSchoolId = null;
                              sheetContactOptions = [];
                            }
                          }),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: selectedType == 'TUITION' ? const Color(0xFFDCFCE7) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selectedType == 'TUITION' ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                                width: selectedType == 'TUITION' ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.menu_book_rounded, size: 16, color: selectedType == 'TUITION' ? const Color(0xFF16A34A) : const Color(0xFF64748B)),
                                const SizedBox(width: 6),
                                Text(
                                  'Tuition Center',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                    color: selectedType == 'TUITION' ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: InkWell(
                          onTap: () => setSheetState(() {
                            if (selectedType != 'OTHER') {
                              selectedType = 'OTHER';
                              sheetSelectedSchoolId = null;
                              sheetContactOptions = [];
                            }
                          }),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: selectedType == 'OTHER' ? const Color(0xFFF3E8FF) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selectedType == 'OTHER' ? const Color(0xFF9333EA) : const Color(0xFFE2E8F0),
                                width: selectedType == 'OTHER' ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.assignment_rounded, size: 16, color: selectedType == 'OTHER' ? const Color(0xFF9333EA) : const Color(0xFF64748B)),
                                const SizedBox(width: 6),
                                Text(
                                  'Other Duty',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                    color: selectedType == 'OTHER' ? const Color(0xFF9333EA) : const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Visit Date Picker
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: selectedVisitDate,
                        firstDate: DateTime(2023),
                        lastDate: DateTime(2030),
                        helpText: 'SELECT DATE (PAST OR PRESENT)',
                      );
                      if (picked != null) {
                        setSheetState(() => selectedVisitDate = picked);
                      }
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_month_rounded, color: Color(0xFF2563EB), size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('WORK / VISIT DATE (Supports Past Date)', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                                Text(
                                  '${selectedVisitDate.day.toString().padLeft(2, '0')}/${selectedVisitDate.month.toString().padLeft(2, '0')}/${selectedVisitDate.year}',
                                  style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.edit_calendar_rounded, color: Color(0xFF94A3B8), size: 18),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Conditional Box: Quick Select for School/Tuition OR Category Chips for Other Duty
                  if (selectedType == 'OTHER') ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFAF5FF),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE9D5FF)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.stars_rounded, color: Color(0xFF9333EA), size: 18),
                              const SizedBox(width: 6),
                              Text(
                                'QUICK DUTY CATEGORY (Tap to auto-fill)',
                                style: GoogleFonts.outfit(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF9333EA),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              '📞 Phone Follow-up (WFH / Rain)',
                              '🏢 Office Work / Desk Duty',
                              '🏛️ College / Campus Duty',
                              '📢 Canvassing / Pamphlets',
                              '👥 Parent / Student Meeting',
                              '📝 Review Meeting / Training',
                              '✏️ Other Special Work',
                            ].map((cat) {
                              final cleanCat = cat.replaceFirst(RegExp(r'^[^\s]+\s'), '');
                              final isSelected = contactCtrl.text == cleanCat || nameCtrl.text.contains(cleanCat);
                              return ActionChip(
                                label: Text(cat, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
                                backgroundColor: isSelected ? const Color(0xFF9333EA) : Colors.white,
                                labelStyle: TextStyle(color: isSelected ? Colors.white : const Color(0xFF6B21A8)),
                                side: const BorderSide(color: Color(0xFFD8B4FE)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                onPressed: () {
                                  setSheetState(() {
                                    contactCtrl.text = cleanCat;
                                    if (nameCtrl.text.isEmpty || [
                                      'Phone Follow-up (WFH / Rain)',
                                      'Office Work / Desk Duty',
                                      'College / Campus Duty',
                                      'Canvassing / Pamphlets',
                                      'Parent / Student Meeting',
                                      'Review Meeting / Training',
                                      'Other Special Work'
                                    ].any((k) => nameCtrl.text.contains(k))) {
                                      nameCtrl.text = cleanCat;
                                    }
                                  });
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Smart Quick Select & Auto-Fill Box for SCHOOL and TUITION
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFF0F7FF), Color(0xFFF8FAFC)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFBFDBFE), width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF1E3A8A).withOpacity(0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header Row
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF2563EB).withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.flash_on_rounded, size: 14, color: Color(0xFF1D4ED8)),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'QUICK AUTO-FILL',
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF1E3A8A),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  Text(
                                    'Select to instantly auto-fill details',
                                    style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFF93C5FD)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.storage_rounded, size: 11, color: Color(0xFF2563EB)),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Master DB',
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF1D4ED8),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // 1. Mandal Dropdown
                          Builder(
                            builder: (context) {
                              final mandalVal = _mandals.any((m) => m['id']?.toString() == sheetSelectedMandalId)
                                  ? sheetSelectedMandalId
                                  : null;

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 5),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 18,
                                          height: 18,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF2563EB).withOpacity(0.12),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Center(
                                            child: Text(
                                              '1',
                                              style: GoogleFonts.outfit(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                color: const Color(0xFF1D4ED8),
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'SELECT MANDAL',
                                          style: GoogleFonts.outfit(
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF334155),
                                            letterSpacing: 0.4,
                                          ),
                                        ),
                                        const Spacer(),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFE2E8F0)),
                                          ),
                                          child: Text(
                                            '${_mandals.length} Mandals',
                                            style: GoogleFonts.inter(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF64748B),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  DropdownButtonFormField<String?>(
                                    value: mandalVal,
                                    isExpanded: true,
                                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B), size: 20),
                                    decoration: InputDecoration(
                                      prefixIcon: const Icon(Icons.account_balance_outlined, size: 18, color: Color(0xFF2563EB)),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      filled: true,
                                      fillColor: Colors.white,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5)),
                                    ),
                                    items: [
                                      DropdownMenuItem<String?>(
                                        value: null,
                                        child: Text(
                                          'All Mandals (${_mandals.length})',
                                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF334155)),
                                        ),
                                      ),
                                      ..._mandals.map((m) {
                                        return DropdownMenuItem<String?>(
                                          value: m['id']?.toString(),
                                          child: Text(m['value']?.toString() ?? '', style: GoogleFonts.inter(fontSize: 13), overflow: TextOverflow.ellipsis),
                                        );
                                      }),
                                    ],
                                    onChanged: (val) {
                                      setSheetState(() {
                                        sheetSelectedMandalId = val;
                                        if (sheetSelectedVillageId != null && val != null) {
                                          final vMandal = _villageToMandal[sheetSelectedVillageId];
                                          if (vMandal != val) {
                                            sheetSelectedVillageId = null;
                                            sheetSelectedSchoolId = null;
                                          }
                                        }
                                      });
                                    },
                                  ),
                                ],
                              );
                            },
                          ),
                          const SizedBox(height: 10),

                          // 2. Village Dropdown
                          Builder(
                            builder: (context) {
                              final filteredVillages = _villages.where((v) {
                                if (sheetSelectedMandalId == null) return true;
                                return v['parentId']?.toString() == sheetSelectedMandalId;
                              }).toList();

                              final villageVal = filteredVillages.any((v) => v['id']?.toString() == sheetSelectedVillageId)
                                  ? sheetSelectedVillageId
                                  : null;

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 5),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 18,
                                          height: 18,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF0284C7).withOpacity(0.12),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Center(
                                            child: Text(
                                              '2',
                                              style: GoogleFonts.outfit(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                color: const Color(0xFF0284C7),
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'SELECT VILLAGE',
                                          style: GoogleFonts.outfit(
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF334155),
                                            letterSpacing: 0.4,
                                          ),
                                        ),
                                        const Spacer(),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFE2E8F0)),
                                          ),
                                          child: Text(
                                            sheetSelectedMandalId != null
                                                ? '${filteredVillages.length} in Mandal'
                                                : '${filteredVillages.length} Total',
                                            style: GoogleFonts.inter(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF64748B),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  DropdownButtonFormField<String?>(
                                    value: villageVal,
                                    isExpanded: true,
                                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B), size: 20),
                                    decoration: InputDecoration(
                                      prefixIcon: const Icon(Icons.location_on_outlined, size: 18, color: Color(0xFF0284C7)),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      filled: true,
                                      fillColor: Colors.white,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5)),
                                    ),
                                    items: [
                                      DropdownMenuItem<String?>(
                                        value: null,
                                        child: Text(
                                          sheetSelectedMandalId != null
                                              ? '-- Choose Village (${filteredVillages.length} in Mandal) --'
                                              : '-- Choose Village (All) --',
                                          style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B)),
                                        ),
                                      ),
                                      ...filteredVillages.map((v) {
                                        return DropdownMenuItem<String?>(
                                          value: v['id']?.toString(),
                                          child: Text(v['value']?.toString() ?? '', style: GoogleFonts.inter(fontSize: 13), overflow: TextOverflow.ellipsis),
                                        );
                                      }),
                                    ],
                                    onChanged: (val) {
                                      setSheetState(() {
                                        sheetSelectedVillageId = val;
                                        sheetSelectedSchoolId = null;
                                        if (val != null) {
                                          final vName = _villageNames[val] ?? '';
                                          if (vName.isNotEmpty) {
                                            villageCtrl.text = vName;
                                          }
                                          final mId = _villageToMandal[val];
                                          if (mId != null && mId.isNotEmpty) {
                                            sheetSelectedMandalId = mId;
                                          }
                                        }
                                      });
                                    },
                                  ),
                                ],
                              );
                            },
                          ),
                          const SizedBox(height: 10),

                          // 3. Institution (School / Tuition) Dropdown
                          Builder(
                            builder: (context) {
                              final availableInstitutions = _getAvailableInstitutionsForType(
                                type: selectedType,
                                mandalId: sheetSelectedMandalId,
                                villageId: sheetSelectedVillageId,
                              );

                              final institutionVal = availableInstitutions.any((s) => s['id']?.toString() == sheetSelectedSchoolId)
                                  ? sheetSelectedSchoolId
                                  : (sheetSelectedSchoolId == 'CUSTOM' ? 'CUSTOM' : null);

                              final isSchool = selectedType == 'SCHOOL';

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 5),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 18,
                                          height: 18,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF7C3AED).withOpacity(0.12),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Center(
                                            child: Text(
                                              '3',
                                              style: GoogleFonts.outfit(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                color: const Color(0xFF7C3AED),
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          isSchool ? 'SELECT SCHOOL' : 'SELECT TUITION CENTER',
                                          style: GoogleFonts.outfit(
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF334155),
                                            letterSpacing: 0.4,
                                          ),
                                        ),
                                        const Spacer(),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFE2E8F0)),
                                          ),
                                          child: Text(
                                            '${availableInstitutions.length} Available',
                                            style: GoogleFonts.inter(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF64748B),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  DropdownButtonFormField<String?>(
                                    value: institutionVal,
                                    isExpanded: true,
                                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B), size: 20),
                                    decoration: InputDecoration(
                                      prefixIcon: Icon(
                                        isSchool ? Icons.school_outlined : Icons.menu_book_outlined,
                                        size: 18,
                                        color: const Color(0xFF7C3AED),
                                      ),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      filled: true,
                                      fillColor: Colors.white,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF7C3AED), width: 1.5)),
                                    ),
                                    items: [
                                      DropdownMenuItem<String?>(
                                        value: null,
                                        child: Text(
                                          isSchool ? '-- Choose Existing School --' : '-- Choose Existing Tuition Center --',
                                          style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B)),
                                        ),
                                      ),
                                      ...availableInstitutions.map((s) {
                                        final contactPart = (s['headmasterName'] != null && s['headmasterName'].toString().isNotEmpty)
                                            ? ' [HM: ${s['headmasterName']}]'
                                            : ((s['contactPerson'] != null && s['contactPerson'].toString().isNotEmpty)
                                                ? ' [${s['contactPerson']}]'
                                                : '');
                                        final areaPart = (s['village'] != null && s['village'].toString().isNotEmpty && sheetSelectedVillageId == null)
                                            ? ' (${s['village']})'
                                            : '';
                                        return DropdownMenuItem<String?>(
                                          value: s['id']?.toString(),
                                          child: Text(
                                            '${s['value']}$areaPart$contactPart',
                                            style: GoogleFonts.inter(fontSize: 13),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        );
                                      }),
                                      DropdownMenuItem<String?>(
                                        value: 'CUSTOM',
                                        child: Text(
                                          isSchool ? '✏️ + Other / Enter Custom School' : '✏️ + Other / Enter Custom Tuition Center',
                                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2563EB)),
                                        ),
                                      ),
                                    ],
                                    onChanged: (val) {
                                  setSheetState(() {
                                    sheetSelectedSchoolId = val;
                                    if (val == null || val == 'CUSTOM') {
                                      sheetContactOptions = [];
                                      return;
                                    }

                                    final institution = availableInstitutions.firstWhere(
                                      (s) => s['id']?.toString() == val,
                                      orElse: () => {},
                                    );

                                    if (institution.isNotEmpty) {
                                      final instName = institution['value']?.toString() ?? '';
                                      nameCtrl.text = instName;

                                      final hmName = institution['headmasterName']?.toString().trim() ?? '';
                                      final hmPhone = institution['headmasterPhone']?.toString().trim() ?? '';
                                      final kpName = institution['keyPersonName']?.toString().trim() ?? '';
                                      final kpPhone = institution['keyPersonPhone']?.toString().trim() ?? '';
                                      final sParentId = institution['parentId']?.toString() ?? '';
                                      final directVillage = institution['village']?.toString().trim() ?? '';
                                      final directMandal = institution['mandal']?.toString().trim() ?? '';

                                      // Auto-fill Village and Mandal
                                      if (_villageNames.containsKey(sParentId)) {
                                        sheetSelectedVillageId = sParentId;
                                        villageCtrl.text = _villageNames[sParentId]!;
                                        final mId = _villageToMandal[sParentId];
                                        if (mId != null && mId.isNotEmpty) {
                                          sheetSelectedMandalId = mId;
                                        }
                                      } else if (_mandalNames.containsKey(sParentId)) {
                                        sheetSelectedMandalId = sParentId;
                                        villageCtrl.text = _mandalNames[sParentId]!;
                                      } else if (directVillage.isNotEmpty) {
                                        villageCtrl.text = directVillage;
                                        final vEntry = _villageNames.entries.firstWhere(
                                          (e) => e.value.toLowerCase() == directVillage.toLowerCase() || e.key == directVillage,
                                          orElse: () => const MapEntry('', ''),
                                        );
                                        if (vEntry.key.isNotEmpty) {
                                          sheetSelectedVillageId = vEntry.key;
                                          final mId = _villageToMandal[vEntry.key];
                                          if (mId != null && mId.isNotEmpty) {
                                            sheetSelectedMandalId = mId;
                                          }
                                        }
                                      }

                                      if (directMandal.isNotEmpty && sheetSelectedMandalId == null) {
                                        final mEntry = _mandalNames.entries.firstWhere(
                                          (e) => e.value.toLowerCase() == directMandal.toLowerCase() || e.key == directMandal,
                                          orElse: () => const MapEntry('', ''),
                                        );
                                        if (mEntry.key.isNotEmpty) {
                                          sheetSelectedMandalId = mEntry.key;
                                        }
                                      }

                                      final strength = (institution['strength'] as num?)?.toInt() ?? 0;
                                      if (strength > 0) {
                                        studentsCountCtrl.text = '$strength';
                                      }

                                      final opts = <Map<String, String>>[];
                                      if (hmName.isNotEmpty) {
                                        opts.add({'role': isSchool ? 'HM / Principal' : 'Owner / In-charge', 'name': hmName, 'phone': hmPhone});
                                      }
                                      if (kpName.isNotEmpty && kpName.toLowerCase() != hmName.toLowerCase()) {
                                        opts.add({'role': 'Key Person', 'name': kpName, 'phone': kpPhone});
                                      }

                                      final directContact = institution['contactPerson']?.toString().trim() ?? '';
                                      final directPhone = institution['phone']?.toString().trim() ?? '';
                                      final directDesig = institution['designation']?.toString().trim() ?? '';
                                      if (directContact.isNotEmpty && !opts.any((o) => o['name']?.toLowerCase() == directContact.toLowerCase())) {
                                        opts.add({
                                          'role': directDesig.isNotEmpty ? directDesig : (isSchool ? 'Staff' : 'Tutor / Owner'),
                                          'name': directContact,
                                          'phone': directPhone,
                                        });
                                      }

                                      // Match in KeyPersons table
                                      for (final kp in _keyPersons) {
                                        if (kp is Map) {
                                          final kpSch = (kp['schoolName'] ?? '').toString().toLowerCase().trim();
                                          final kpSchId = (kp['schoolId'] ?? '').toString();
                                          final thisSchName = instName.toLowerCase().trim();

                                          if ((kpSchId == val || (kpSch.isNotEmpty && kpSch == thisSchName)) && kp['name'] != null) {
                                            final n = kp['name'].toString().trim();
                                            if (n.isNotEmpty && !opts.any((o) => o['name']?.toLowerCase() == n.toLowerCase())) {
                                              opts.add({
                                                'role': (kp['designation'] ?? (isSchool ? 'Key Person' : 'Tutor')).toString(),
                                                'name': n,
                                                'phone': (kp['phone'] ?? '').toString().trim(),
                                              });
                                            }
                                          }
                                        }
                                      }

                                      sheetContactOptions = opts;

                                      if (opts.isNotEmpty) {
                                        contactCtrl.text = opts.first['name'] ?? '';
                                        phoneCtrl.text = opts.first['phone'] ?? '';
                                      }
                                    }
                                  });
                                  },
                                ),
                              ],
                            );
                          },
                        ),

                          // 3. Who did you meet? Chips
                          if (sheetContactOptions.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Text(
                              'WHO DID YOU MEET? (Tap to auto-fill contact)',
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF1E3A8A)),
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: sheetContactOptions.map((opt) {
                                final isSelected = contactCtrl.text == opt['name'];
                                return ActionChip(
                                  avatar: Icon(
                                    opt['role']?.contains('HM') == true ? Icons.school_rounded : Icons.person_rounded,
                                    size: 14,
                                    color: isSelected ? Colors.white : const Color(0xFF2563EB),
                                  ),
                                  label: Text(
                                    '${opt['role']}: ${opt['name']}${opt['phone']!.isNotEmpty ? " (${opt['phone']})" : ""}',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                      color: isSelected ? Colors.white : const Color(0xFF1E293B),
                                    ),
                                  ),
                                  backgroundColor: isSelected ? const Color(0xFF2563EB) : Colors.white,
                                  side: BorderSide(color: isSelected ? const Color(0xFF2563EB) : const Color(0xFF93C5FD)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  onPressed: () {
                                    setSheetState(() {
                                      contactCtrl.text = opt['name'] ?? '';
                                      phoneCtrl.text = opt['phone'] ?? '';
                                    });
                                  },
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),

                  // Institution / Work Title
                  TextField(
                    controller: nameCtrl,
                    decoration: InputDecoration(
                      labelText: selectedType == 'OTHER'
                          ? 'Duty / Work Title *'
                          : (selectedType == 'SCHOOL' ? 'School Name *' : 'Tuition / Coaching Name *'),
                      hintText: selectedType == 'OTHER'
                          ? 'e.g. Phone Follow-up from Home due to heavy rain'
                          : (selectedType == 'SCHOOL' ? 'e.g. ZPHS Kothapeta' : 'e.g. Master Minds Tuitions'),
                      prefixIcon: Icon(
                        selectedType == 'OTHER' ? Icons.assignment_rounded : Icons.account_balance_rounded,
                        size: 20,
                        color: selectedType == 'OTHER' ? const Color(0xFF9333EA) : null,
                      ),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Contact Person & Phone
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: contactCtrl,
                          decoration: InputDecoration(
                            labelText: selectedType == 'OTHER' ? 'Duty Category / Coordinator' : 'HM / Tutor Name',
                            hintText: selectedType == 'OTHER' ? 'e.g. Phone Follow-up' : 'e.g. Ramesh Sir',
                            prefixIcon: Icon(
                              selectedType == 'OTHER' ? Icons.category_rounded : Icons.person_rounded,
                              size: 20,
                            ),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: phoneCtrl,
                          keyboardType: TextInputType.phone,
                          decoration: InputDecoration(
                            labelText: selectedType == 'OTHER' ? 'Phone (Optional)' : 'Phone',
                            hintText: '9876543210',
                            prefixIcon: const Icon(Icons.phone_rounded, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Village & Students Met Count
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: villageCtrl,
                          decoration: InputDecoration(
                            labelText: selectedType == 'OTHER' ? 'Location / Zone (Optional)' : 'Village / Area',
                            hintText: selectedType == 'OTHER' ? 'e.g. Home (WFH) / Campus' : 'e.g. Tenali',
                            prefixIcon: const Icon(Icons.place_rounded, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: studentsCountCtrl,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: selectedType == 'OTHER' ? 'Persons Reached' : 'Students Met',
                            hintText: selectedType == 'OTHER' ? 'e.g. 35 calls' : 'e.g. 35',
                            prefixIcon: const Icon(Icons.groups_rounded, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Remarks / Work Details
                  TextField(
                    controller: remarksCtrl,
                    minLines: selectedType == 'OTHER' ? 3 : 2,
                    maxLines: 5,
                    decoration: InputDecoration(
                      labelText: selectedType == 'OTHER' ? 'Detailed Work Description / Remarks *' : 'Remarks / Key Discussion',
                      hintText: selectedType == 'OTHER'
                          ? 'Write full details of what work was completed today (e.g. Due to rain, called 35 students from K. Kotapadu mandal...)'
                          : 'Distributed pamphlets, explained MPC/BiPC groups, HM agreed for seminar...',
                      alignLabelWithHint: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Save Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: isSubmitting
                          ? null
                          : () async {
                              final name = nameCtrl.text.trim();
                              if (name.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(selectedType == 'OTHER' ? 'Please enter Duty / Work Title' : 'Please enter Institution Name')),
                                );
                                return;
                              }

                              setSheetState(() => isSubmitting = true);

                              final data = {
                                'type': selectedType,
                                'name': name,
                                'contactPerson': contactCtrl.text.trim().isNotEmpty ? contactCtrl.text.trim() : null,
                                'phone': phoneCtrl.text.trim().isNotEmpty ? phoneCtrl.text.trim() : null,
                                'village': villageCtrl.text.trim().isNotEmpty ? villageCtrl.text.trim() : null,
                                'studentsMetCount': int.tryParse(studentsCountCtrl.text.trim()) ?? 0,
                                'visitDate': _formatApiDate(selectedVisitDate),
                                'remarks': remarksCtrl.text.trim().isNotEmpty ? remarksCtrl.text.trim() : null,
                              };

                              final messenger = ScaffoldMessenger.of(context);
                              bool ok = false;
                              if (isEditing) {
                                final res = await ApiService.updateInstitutionVisit(visit['id'], data);
                                ok = res['success'] == true;
                              } else {
                                final res = await ApiService.createInstitutionVisit(data);
                                ok = res['success'] == true;
                              }

                              if (!mounted) return;

                              if (ok) {
                                Navigator.pop(sheetCtx);
                                _fetchVisits();
                                messenger.showSnackBar(
                                  SnackBar(content: Text(isEditing ? 'Visit updated successfully' : 'Visit recorded successfully')),
                                );
                              } else {
                                setSheetState(() => isSubmitting = false);
                                messenger.showSnackBar(
                                  const SnackBar(content: Text('Failed to save visit record')),
                                );
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      icon: isSubmitting
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.check_circle_rounded),
                      label: Text(
                        isSubmitting ? 'Saving...' : (isEditing ? 'Update Visit' : 'Save Visit'),
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _confirmDelete(Map<String, dynamic> v) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Delete Visit?', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to delete the visit for "${v['name']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final ok = await ApiService.deleteInstitutionVisit(v['id']);
              if (ok) {
                _fetchVisits();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Visit deleted successfully')),
                  );
                }
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _shareVisit(Map<String, dynamic> v) async {
    final type = v['type'] ?? 'SCHOOL';
    final isSchool = type == 'SCHOOL';
    final isOther = type == 'OTHER';
    final lines = <String>[
      if (isOther)
        '💼 *Official Duty / Work Report*'
      else if (isSchool)
        '🏛️ *School Visit Report*'
      else
        '📖 *Tuition Center Visit Report*',
      '*${isOther ? "Duty / Task" : "Name"}:* ${v["name"]}',
      if (v['contactPerson'] != null && v['contactPerson'].toString().isNotEmpty)
        '*${isOther ? "Category / Lead" : "Incharge/HM"}:* ${v["contactPerson"]}',
      if (v['phone'] != null && v['phone'].toString().isNotEmpty) '*Phone:* ${v["phone"]}',
      if (v['village'] != null && v['village'].toString().isNotEmpty) '*Location:* ${v["village"]}',
      if (v['studentsMetCount'] != null && (v['studentsMetCount'] as num) > 0)
        '*${isOther ? "Persons Reached" : "Students Addressed"}:* ${v["studentsMetCount"]}',
      '*Date:* ${_formatDisplayDate(v["visitDate"])}',
      if (v['remarks'] != null && v['remarks'].toString().isNotEmpty)
        '*${isOther ? "Work Details / Remarks" : "Remarks"}:* ${v["remarks"]}',
    ];

    final text = Uri.encodeComponent(lines.join('\n'));
    final url = Uri.parse('https://wa.me/?text=$text');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Stats calculation
    int schools = 0;
    int tuitions = 0;
    int otherDuties = 0;
    int studentsMet = 0;
    for (final v in _visits) {
      if (v['type'] == 'SCHOOL') {
        schools++;
      } else if (v['type'] == 'TUITION') {
        tuitions++;
      } else {
        otherDuties++;
      }
      studentsMet += ((v['studentsMetCount'] as num?)?.toInt() ?? 0);
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'School & Tuition Visits',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(_filterDate != null ? Icons.event_available_rounded : Icons.event_rounded, color: _filterDate != null ? const Color(0xFF38BDF8) : Colors.white),
            tooltip: 'Filter by Date',
            onPressed: _openDateFilterPicker,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: _fetchVisits,
          ),
        ],
      ),
      body: Column(
        children: [
          // Active Date Filter Bar
          if (_filterDate != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0xFF0284C7),
              child: Row(
                children: [
                  const Icon(Icons.filter_alt_rounded, color: Colors.white, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'Showing visits for: ${_formatApiDate(_filterDate!)}',
                    style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const Spacer(),
                  InkWell(
                    onTap: () {
                      setState(() => _filterDate = null);
                      _fetchVisits();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                      child: const Text('Show All', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),

          // Stats Banner
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: Colors.white,
            child: Row(
              children: [
                _buildStatBadge('TOTAL', '${_visits.length}', const Color(0xFF0284C7), const Color(0xFFE0F2FE)),
                const SizedBox(width: 6),
                _buildStatBadge('SCHOOLS', '$schools', const Color(0xFFD97706), const Color(0xFFFEF3C7)),
                const SizedBox(width: 6),
                _buildStatBadge('TUITIONS', '$tuitions', const Color(0xFF16A34A), const Color(0xFFDCFCE7)),
                const SizedBox(width: 6),
                _buildStatBadge('DUTIES', '$otherDuties', const Color(0xFF9333EA), const Color(0xFFF3E8FF)),
                const SizedBox(width: 6),
                _buildStatBadge('STUDENTS', '$studentsMet', const Color(0xFF0D9488), const Color(0xFFCCFBF1)),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Search & Filter Tabs
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  onChanged: (_) => _applyLocalFilter(),
                  decoration: InputDecoration(
                    hintText: 'Search school, tuition, duty, HM, village...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                    prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _applyLocalFilter();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildFilterChip('All Visits', 'ALL'),
                    const SizedBox(width: 6),
                    _buildFilterChip('Schools', 'SCHOOL'),
                    const SizedBox(width: 6),
                    _buildFilterChip('Tuitions', 'TUITION'),
                    const SizedBox(width: 6),
                    _buildFilterChip('Other Duty', 'OTHER'),
                  ],
                ),
              ],
            ),
          ),

          // Visits List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline_rounded, size: 40, color: Colors.red),
                            const SizedBox(height: 8),
                            Text(_error!, style: const TextStyle(color: Colors.red)),
                            const SizedBox(height: 12),
                            ElevatedButton(onPressed: _fetchVisits, child: const Text('Retry')),
                          ],
                        ),
                      )
                    : _filteredVisits.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.assignment_outlined, size: 56, color: Colors.grey.shade400),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No visits or duties found',
                                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Tap "+ Record Visit" below to log your school, tuition, or other duty reports.',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                            itemCount: _filteredVisits.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final v = _filteredVisits[i] as Map<String, dynamic>;
                              final type = v['type'] ?? 'SCHOOL';
                              final isSchool = type == 'SCHOOL';
                              final isOther = type == 'OTHER';
                              final metCount = (v['studentsMetCount'] as num?)?.toInt() ?? 0;

                              return Card(
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: BorderSide(
                                    color: isOther ? const Color(0xFFE9D5FF) : const Color(0xFFE2E8F0),
                                    width: isOther ? 1.5 : 1,
                                  ),
                                ),
                                color: Colors.white,
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Top Header
                                      Row(
                                        children: [
                                          Container(
                                            width: 40,
                                            height: 40,
                                            decoration: BoxDecoration(
                                              color: isOther
                                                  ? const Color(0xFFF3E8FF)
                                                  : isSchool
                                                      ? const Color(0xFFFEF3C7)
                                                      : const Color(0xFFDCFCE7),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: Icon(
                                              isOther
                                                  ? Icons.assignment_rounded
                                                  : isSchool
                                                      ? Icons.school_rounded
                                                      : Icons.menu_book_rounded,
                                              color: isOther
                                                  ? const Color(0xFF9333EA)
                                                  : isSchool
                                                      ? const Color(0xFFD97706)
                                                      : const Color(0xFF16A34A),
                                              size: 22,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: isOther
                                                            ? const Color(0xFFF3E8FF)
                                                            : isSchool
                                                                ? const Color(0xFFFDE68A)
                                                                : const Color(0xFFBBF7D0),
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: Text(
                                                        isOther ? 'OTHER DUTY' : (v['type'] ?? 'SCHOOL'),
                                                        style: GoogleFonts.inter(
                                                          fontSize: 9,
                                                          fontWeight: FontWeight.bold,
                                                          color: isOther
                                                              ? const Color(0xFF7E22CE)
                                                              : isSchool
                                                                  ? const Color(0xFF92400E)
                                                                  : const Color(0xFF166534),
                                                        ),
                                                      ),
                                                    ),
                                                    const Spacer(),
                                                    Text(
                                                      _formatDisplayDate(v['visitDate']),
                                                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  v['name'] ?? '',
                                                  style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),

                                      // Contact, Village & Students Addressed
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 6,
                                        children: [
                                          if (v['contactPerson'] != null && v['contactPerson'].toString().isNotEmpty)
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(isOther ? Icons.category_rounded : Icons.person_outline_rounded, size: 14, color: const Color(0xFF64748B)),
                                                const SizedBox(width: 4),
                                                Text(v['contactPerson'], style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF334155))),
                                              ],
                                            ),
                                          if (v['village'] != null && v['village'].toString().isNotEmpty)
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.place_outlined, size: 14, color: Color(0xFF64748B)),
                                                const SizedBox(width: 4),
                                                Text(v['village'], style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF334155))),
                                              ],
                                            ),
                                          if (metCount > 0)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: isOther ? const Color(0xFFF3E8FF) : const Color(0xFFF3E8FF),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                isOther ? '🎯 $metCount Persons Reached' : '🎯 $metCount Students Addressed',
                                                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF7C3AED)),
                                              ),
                                            ),
                                        ],
                                      ),

                                      // Remarks
                                      if (v['remarks'] != null && v['remarks'].toString().isNotEmpty) ...[
                                        const SizedBox(height: 8),
                                        Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF8FAFC),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFE2E8F0)),
                                          ),
                                          child: Text(
                                            '"${v['remarks']}"',
                                            style: GoogleFonts.inter(fontSize: 12, fontStyle: FontStyle.italic, color: const Color(0xFF475569)),
                                          ),
                                        ),
                                      ],

                                      const SizedBox(height: 10),
                                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                      const SizedBox(height: 8),

                                      // Action Buttons Row
                                      Row(
                                        children: [
                                          if (v['phone'] != null && v['phone'].toString().isNotEmpty) ...[
                                            IconButton(
                                              icon: const Icon(Icons.phone_rounded, color: Color(0xFF0284C7), size: 18),
                                              padding: EdgeInsets.zero,
                                              constraints: const BoxConstraints(),
                                              tooltip: 'Call',
                                              onPressed: () => launchUrl(Uri.parse('tel:${v['phone']}')),
                                            ),
                                            const SizedBox(width: 14),
                                            IconButton(
                                              icon: const Icon(Icons.chat_bubble_rounded, color: Color(0xFF16A34A), size: 18),
                                              padding: EdgeInsets.zero,
                                              constraints: const BoxConstraints(),
                                              tooltip: 'WhatsApp',
                                              onPressed: () => launchUrl(Uri.parse('https://wa.me/91${v['phone'].toString().replaceAll(RegExp(r'[^0-9]'), '')}'), mode: LaunchMode.externalApplication),
                                            ),
                                            const SizedBox(width: 14),
                                          ],
                                          IconButton(
                                            icon: const Icon(Icons.share_rounded, color: Color(0xFF7C3AED), size: 18),
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                            tooltip: 'Share',
                                            onPressed: () => _shareVisit(v),
                                          ),
                                          const Spacer(),
                                          IconButton(
                                            icon: const Icon(Icons.edit_rounded, color: Color(0xFFD97706), size: 18),
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                            tooltip: 'Edit',
                                            onPressed: () => _openAddEditSheet(v),
                                          ),
                                          const SizedBox(width: 14),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444), size: 18),
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                            tooltip: 'Delete',
                                            onPressed: () => _confirmDelete(v),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddEditSheet(),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: Text('Record Visit', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
      ),
    );
  }

  Widget _buildStatBadge(String label, String value, Color color, Color bg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(value, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String typeKey) {
    final isSelected = _selectedType == typeKey;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() => _selectedType = typeKey);
          _fetchVisits();
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0)),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
          ),
        ),
      ),
    );
  }
}
