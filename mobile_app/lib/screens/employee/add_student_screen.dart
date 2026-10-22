import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../services/location_service.dart';

class AddStudentScreen extends StatefulWidget {
  final Map<String, dynamic>? student;
  const AddStudentScreen({super.key, this.student});

  @override
  State<AddStudentScreen> createState() => _AddStudentScreenState();
}

class _AddStudentScreenState extends State<AddStudentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();

  bool get _isEditing => widget.student != null;

  // Config data from /api/config
  List<dynamic> _configs = [];
  bool _isLoadingConfigs = true;

  // Form Controllers
  final _nameController = TextEditingController();
  final _fatherNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _marksController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _visitNumberController = TextEditingController();
  final _remarksController = TextEditingController();

  // Selection state
  String _gender = 'Male';
  String? _occupation;
  String? _group;

  // Previous School cascading state
  String? _schoolDistrict;
  String? _schoolMandal;
  String? _schoolVillage;
  String? _schoolName;

  // Residence cascading state
  String? _residenceDistrict;
  String? _residenceMandal;
  String? _residenceVillage;

  // Additional Dropdowns
  String? _studyInterestedAt;
  String? _educationStage;
  String? _ableToBearFee;

  bool _sameAsPhone = true;
  bool _doorstepCompleted = false;
  bool _isLoading = false;
  bool _isFetchingGps = false;

  // Phone duplication check
  Timer? _phoneDebounce;
  bool _isCheckingPhone = false;
  String? _phoneExistsError;

  // Live School Stats
  Map<String, dynamic>? _schoolStats;
  bool _isLoadingSchoolStats = false;

  // Success view state
  bool _isSuccessScreen = false;
  String _savedStudentName = '';
  String? _bannerSuccessMsg;

  @override
  void initState() {
    super.initState();
    _initStudentData();
    _loadConfigs();
  }

  void _initStudentData([Map<String, dynamic>? data]) {
    final s = data ?? widget.student;
    if (s != null) {
      _nameController.text = s['studentName']?.toString() ?? '';
      _gender = (s['gender']?.toString().isNotEmpty == true) ? s['gender'].toString() : 'Male';
      _fatherNameController.text = s['fatherName']?.toString() ?? '';
      final rawPhone = (s['phone']?.toString() ?? '').replaceAll(RegExp(r'\D'), '');
      _phoneController.text = rawPhone;
      final rawWa = (s['whatsapp']?.toString() ?? '').replaceAll(RegExp(r'\D'), '');
      _whatsappController.text = rawWa;
      _sameAsPhone = (rawWa.isEmpty || rawWa == rawPhone);
      _marksController.text = s['marks']?.toString() ?? '';
      _landmarkController.text = s['address']?.toString() ?? '';
      _visitNumberController.text = s['visitNumber']?.toString() ?? '';
      _remarksController.text = s['remarks']?.toString() ?? '';
      final visitsList = s['visits'] as List<dynamic>?;
      final hasVisits = visitsList != null && visitsList.isNotEmpty;
      _doorstepCompleted = (s['doorstepCompleted'] == true) || hasVisits;
      _occupation = s['occupation']?.toString();
      _group = s['group']?.toString();
      _studyInterestedAt = s['studyInterestedAt']?.toString();
      _educationStage = s['educationStage']?.toString();
      _ableToBearFee = s['ableToBearFee']?.toString();
      _schoolName = s['schoolName']?.toString();
      _schoolDistrict = s['schoolDistrict']?.toString();
      _schoolMandal = s['schoolMandal']?.toString();
      _schoolVillage = s['schoolVillage']?.toString() ?? s['schoolArea']?.toString();
      _residenceDistrict = s['district']?.toString();
      _residenceMandal = s['mandal']?.toString();
      _residenceVillage = s['village']?.toString();
    }
  }

  @override
  void dispose() {
    _phoneDebounce?.cancel();
    _scrollController.dispose();
    _nameController.dispose();
    _fatherNameController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    _marksController.dispose();
    _landmarkController.dispose();
    _visitNumberController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _loadConfigs() async {
    setState(() => _isLoadingConfigs = true);
    try {
      final futures = <Future>[ApiService.getConfigsList()];
      if (_isEditing && widget.student!['id'] != null) {
        futures.add(ApiService.getStudentById(widget.student!['id'].toString()));
      }

      final results = await Future.wait(futures);
      if (!mounted) return;

      final list = results[0] as List<dynamic>;
      _configs = list;

      if (results.length > 1) {
        final sRes = results[1] as Map<String, dynamic>;
        if (sRes['success'] == true && sRes['student'] != null) {
          final s = Map<String, dynamic>.from(sRes['student'] as Map);
          _initStudentData(s);
        }
      }

      _resolveCascadingHierarchies();

      if (mounted) {
        setState(() => _isLoadingConfigs = false);
      }
      if (_schoolName != null && _schoolName!.isNotEmpty) {
        _onSchoolChanged(_schoolName);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingConfigs = false);
    }
  }

  void _resolveCascadingHierarchies() {
    // 1. Resolve Residence Cascading Hierarchy from Village/Mandal/District
    if (_residenceVillage != null && _residenceVillage!.isNotEmpty) {
      final vNorm = _residenceVillage!.trim().toLowerCase();
      final vCfg = _configs.firstWhere(
        (c) => c is Map && (c['id']?.toString() == _residenceVillage || c['value']?.toString().trim().toLowerCase() == vNorm) && c['type'] == 'VILLAGE',
        orElse: () => null,
      );
      if (vCfg != null) {
        _residenceVillage = vCfg['id'].toString();
        if (vCfg['parentId'] != null) {
          _residenceMandal ??= vCfg['parentId'].toString();
        }
      }
    }
    if (_residenceMandal != null && _residenceMandal!.isNotEmpty) {
      final mNorm = _residenceMandal!.trim().toLowerCase();
      final mCfg = _configs.firstWhere(
        (c) => c is Map && (c['id']?.toString() == _residenceMandal || c['value']?.toString().trim().toLowerCase() == mNorm) && c['type'] == 'MANDAL',
        orElse: () => null,
      );
      if (mCfg != null) {
        _residenceMandal = mCfg['id'].toString();
        if (mCfg['parentId'] != null) {
          _residenceDistrict ??= mCfg['parentId'].toString();
        }
      }
    }
    if (_residenceDistrict != null && _residenceDistrict!.isNotEmpty) {
      final dNorm = _residenceDistrict!.trim().toLowerCase();
      final dCfg = _configs.firstWhere(
        (c) => c is Map && (c['id']?.toString() == _residenceDistrict || c['value']?.toString().trim().toLowerCase() == dNorm) && c['type'] == 'DISTRICT',
        orElse: () => null,
      );
      if (dCfg != null) {
        _residenceDistrict = dCfg['id'].toString();
      }
    }

    // 2. Resolve Previous School Cascading Hierarchy
    // Try from school name first
    if (_schoolName != null && _schoolName!.isNotEmpty) {
      final sNorm = _schoolName!.trim().toLowerCase();
      final schoolCfg = _configs.firstWhere(
        (c) => c is Map && c['type'] == 'SCHOOL' && (c['value']?.toString().trim().toLowerCase() == sNorm || c['id']?.toString() == _schoolName),
        orElse: () => null,
      );
      if (schoolCfg != null) {
        _schoolName = schoolCfg['value'].toString();
        if (schoolCfg['parentId'] != null) {
          _schoolVillage ??= schoolCfg['parentId'].toString();
        }
      }
    }

    // Climb up from school village
    if (_schoolVillage != null && _schoolVillage!.isNotEmpty) {
      final vNorm = _schoolVillage!.trim().toLowerCase();
      final vCfg = _configs.firstWhere(
        (c) => c is Map && (c['id']?.toString() == _schoolVillage || c['value']?.toString().trim().toLowerCase() == vNorm) && c['type'] == 'VILLAGE',
        orElse: () => null,
      );
      if (vCfg != null) {
        _schoolVillage = vCfg['id'].toString();
        if (vCfg['parentId'] != null) {
          _schoolMandal ??= vCfg['parentId'].toString();
        }
      }
    }

    // Climb up from school mandal
    if (_schoolMandal != null && _schoolMandal!.isNotEmpty) {
      final mNorm = _schoolMandal!.trim().toLowerCase();
      final mCfg = _configs.firstWhere(
        (c) => c is Map && (c['id']?.toString() == _schoolMandal || c['value']?.toString().trim().toLowerCase() == mNorm) && c['type'] == 'MANDAL',
        orElse: () => null,
      );
      if (mCfg != null) {
        _schoolMandal = mCfg['id'].toString();
        if (mCfg['parentId'] != null) {
          _schoolDistrict ??= mCfg['parentId'].toString();
        }
      }
    }

    // Climb up from school district
    if (_schoolDistrict != null && _schoolDistrict!.isNotEmpty) {
      final dNorm = _schoolDistrict!.trim().toLowerCase();
      final dCfg = _configs.firstWhere(
        (c) => c is Map && (c['id']?.toString() == _schoolDistrict || c['value']?.toString().trim().toLowerCase() == dNorm) && c['type'] == 'DISTRICT',
        orElse: () => null,
      );
      if (dCfg != null) {
        _schoolDistrict = dCfg['id'].toString();
      }
    }
  }

  // Filter helper matching web getByType and getByParent
  List<Map<String, dynamic>> _getByType(String type) {
    return _configs
        .where((c) => c is Map && c['type'] == type)
        .map((c) => Map<String, dynamic>.from(c as Map))
        .toList();
  }

  List<Map<String, dynamic>> _getByParent(String type, String parentId) {
    return _configs
        .where((c) => c is Map && c['type'] == type && c['parentId']?.toString() == parentId)
        .map((c) => Map<String, dynamic>.from(c as Map))
        .toList();
  }

  // Phone number sanitizer & debounced duplicate checker
  void _onPhoneChanged(String val) {
    String cleaned = val.replaceAll(RegExp(r'\D'), '');
    if (cleaned.length == 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.length == 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.length > 10) {
      cleaned = cleaned.substring(cleaned.length - 10);
    }

    if (cleaned != val) {
      _phoneController.value = TextEditingValue(
        text: cleaned,
        selection: TextSelection.collapsed(offset: cleaned.length),
      );
    }

    _phoneDebounce?.cancel();
    final originalPhone = (widget.student?['phone'] ?? '').toString().replaceAll(RegExp(r'\D'), '');
    if (_isEditing && cleaned == originalPhone) {
      setState(() {
        _isCheckingPhone = false;
        _phoneExistsError = null;
      });
      return;
    }

    if (cleaned.length == 10) {
      setState(() {
        _isCheckingPhone = true;
        _phoneExistsError = null;
      });
      _phoneDebounce = Timer(const Duration(milliseconds: 400), () async {
        final exists = await ApiService.checkPhoneExists(cleaned);
        if (mounted) {
          setState(() {
            _isCheckingPhone = false;
            _phoneExistsError = exists ? 'This mobile number is already registered.' : null;
          });
        }
      });
    } else {
      setState(() {
        _isCheckingPhone = false;
        _phoneExistsError = null;
      });
    }
  }

  // Load school stats when school changes
  Future<void> _onSchoolChanged(String? schoolName) async {
    setState(() {
      _schoolName = schoolName;
      _schoolStats = null;
    });

    if (schoolName == null || schoolName.trim().isEmpty) return;

    setState(() => _isLoadingSchoolStats = true);
    final stats = await ApiService.getSchoolStats(schoolName);
    if (mounted) {
      setState(() {
        _schoolStats = stats;
        _isLoadingSchoolStats = false;
      });
    }
  }

  Future<void> _captureDoorstepGps() async {
    setState(() => _isFetchingGps = true);
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
            Text('Detecting current GPS coordinates...'),
          ],
        ),
        duration: Duration(seconds: 4),
      ),
    );

    final pos = await LocationService.getCurrentLocation();
    if (!mounted) return;
    setState(() => _isFetchingGps = false);
    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    if (pos == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not access GPS. Please check Location permission in phone Settings.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    final currentText = _landmarkController.text.trim();
    final clean = LocationService.getCleanLandmark(currentText);
    final updatedText = LocationService.formatWithGps(clean, pos.latitude, pos.longitude);

    setState(() {
      _landmarkController.text = updatedText;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📍 Doorstep GPS tagged successfully!'),
        backgroundColor: Color(0xFF10B981),
      ),
    );
  }

  void _clearForm() {
    _formKey.currentState?.reset();
    _nameController.clear();
    _fatherNameController.clear();
    _phoneController.clear();
    _whatsappController.clear();
    _marksController.clear();
    _landmarkController.clear();
    _visitNumberController.clear();
    _remarksController.clear();

    setState(() {
      _gender = 'Male';
      _occupation = null;
      _group = null;
      _schoolDistrict = null;
      _schoolMandal = null;
      _schoolVillage = null;
      _schoolName = null;
      _schoolStats = null;
      _residenceDistrict = null;
      _residenceMandal = null;
      _residenceVillage = null;
      _studyInterestedAt = null;
      _educationStage = null;
      _ableToBearFee = null;
      _sameAsPhone = true;
      _doorstepCompleted = false;
      _phoneExistsError = null;
      _isCheckingPhone = false;
      _isSuccessScreen = false;
    });

    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  Future<void> _handleSave({bool addAnother = false}) async {
    if (_phoneExistsError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Cannot save. $_phoneExistsError'),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
      return;
    }

    final cleanPhone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    if (cleanPhone.isNotEmpty && cleanPhone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid 10-digit mobile number.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill all required fields correctly.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final studentName = _nameController.text.trim();
    final whatsapp = _sameAsPhone ? cleanPhone : _whatsappController.text.replaceAll(RegExp(r'\D'), '');

    final payload = {
      'studentName': studentName,
      'gender': _gender,
      'fatherName': _fatherNameController.text.trim(),
      'occupation': _occupation ?? '',
      'phone': cleanPhone,
      'whatsapp': whatsapp,
      'group': _group ?? '',
      'visitNumber': _visitNumberController.text.trim(),
      'schoolName': _schoolName ?? '',
      'schoolArea': _schoolVillage ?? '',
      'schoolDistrict': _schoolDistrict ?? '',
      'schoolMandal': _schoolMandal ?? '',
      'schoolVillage': _schoolVillage ?? '',
      'marks': _marksController.text.trim(),
      'remarks': _remarksController.text.trim(),
      'district': _residenceDistrict ?? '',
      'mandal': _residenceMandal ?? '',
      'village': _residenceVillage ?? '',
      'studyInterestedAt': _studyInterestedAt ?? '',
      'educationStage': _educationStage ?? '',
      'ableToBearFee': _ableToBearFee ?? '',
      'doorstepCompleted': _doorstepCompleted,
      'address': _landmarkController.text.trim(),
    };

    if (_isEditing) {
      final studentId = widget.student!['id']?.toString() ?? '';
      final result = await ApiService.updateStudent(studentId, payload);

      if (!mounted) return;
      setState(() => _isLoading = false);

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Student "$studentName" updated successfully! 🎉'),
            backgroundColor: const Color(0xFF059669),
          ),
        );
        Navigator.pop(context, true);
      } else {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Text('Error Updating Student', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
            content: Text(result['error'] ?? 'Failed to update student.', style: GoogleFonts.inter()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
      return;
    }

    final result = await ApiService.addStudent(payload);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      final isOffline = result['offline'] == true;
      final msg = isOffline
          ? 'Student "$studentName" saved offline! Will sync automatically when online.'
          : 'Student "$studentName" added successfully!';

      if (addAnother) {
        _clearForm();
        setState(() {
          _bannerSuccessMsg = '$msg You can add another.';
        });
      } else {
        setState(() {
          _savedStudentName = studentName;
          _isSuccessScreen = true;
          if (isOffline) {
            _bannerSuccessMsg = msg;
          }
        });
      }
    } else {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Error Saving Student', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          content: Text(result['error'] ?? 'Failed to save student.', style: GoogleFonts.inter()),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccessScreen) {
      return _buildSuccessScreen();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isEditing ? 'Edit Student Details' : 'Add Student',
              style: GoogleFonts.outfit(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            if (_isEditing)
              Text(
                'Update & modify student profile',
                style: GoogleFonts.inter(
                  color: const Color(0xFF64748B),
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
          ],
        ),
      ),
      body: _isLoadingConfigs
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF4F46E5)),
            )
          : SingleChildScrollView(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_isEditing) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.edit_note_rounded, color: Color(0xFF2563EB), size: 22),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Editing: ${_nameController.text.isNotEmpty ? _nameController.text : "Student"}',
                                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1E3A8A)),
                                  ),
                                  Text(
                                    'Make changes below and tap "Update Student Details".',
                                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF3B82F6)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (_bannerSuccessMsg != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD1FAE5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_rounded, color: Color(0xFF065F46), size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _bannerSuccessMsg!,
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF065F46),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF065F46)),
                              onPressed: () => setState(() => _bannerSuccessMsg = null),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // Section 1: Personal Details
                    _buildSectionCard(
                      title: 'Personal Details',
                      icon: Icons.person_outline_rounded,
                      iconColor: const Color(0xFF3B82F6),
                      children: [
                        _buildTextField(
                          label: 'Student Name *',
                          hint: 'Enter full name',
                          controller: _nameController,
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Student name is required' : null,
                        ),
                        const SizedBox(height: 16),

                        // Gender Radio Chips
                        Text(
                          'Gender *',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _buildChoiceChip('Male', _gender == 'Male', () {
                              setState(() => _gender = 'Male');
                            }),
                            const SizedBox(width: 10),
                            _buildChoiceChip('Female', _gender == 'Female', () {
                              setState(() => _gender = 'Female');
                            }),
                            const SizedBox(width: 10),
                            _buildChoiceChip('Other', _gender == 'Other', () {
                              setState(() => _gender = 'Other');
                            }),
                          ],
                        ),
                        const SizedBox(height: 16),

                        _buildTextField(
                          label: "Father's Name",
                          hint: "Enter father's name",
                          controller: _fatherNameController,
                        ),
                        const SizedBox(height: 16),

                        // Occupation Dropdown from configs
                        _buildDropdownField(
                          label: 'Occupation',
                          hint: 'Select Occupation',
                          value: _occupation,
                          items: _getByType('OCCUPATION')
                              .map((c) => DropdownMenuItem(
                                    value: c['value'].toString(),
                                    child: Text(c['value'].toString()),
                                  ))
                              .toList(),
                          onChanged: (val) => setState(() => _occupation = val),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Section 2: Contact Information
                    _buildSectionCard(
                      title: 'Contact Information',
                      icon: Icons.phone_outlined,
                      iconColor: const Color(0xFF10B981),
                      children: [
                        // Phone number with +91 prefix and live validation
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Phone Number *',
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                                ),
                                if (_isCheckingPhone)
                                  Text(
                                    'Checking...',
                                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF2563EB)),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.horizontal(left: Radius.circular(12)),
                                    border: Border(
                                      top: BorderSide(color: Color(0xFFCBD5E1)),
                                      left: BorderSide(color: Color(0xFFCBD5E1)),
                                      bottom: BorderSide(color: Color(0xFFCBD5E1)),
                                    ),
                                  ),
                                  child: Text(
                                    '+91',
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF475569),
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: TextFormField(
                                    controller: _phoneController,
                                    keyboardType: TextInputType.phone,
                                    maxLength: 10,
                                    onChanged: _onPhoneChanged,
                                    validator: (v) {
                                      final clean = (v ?? '').replaceAll(RegExp(r'\D'), '');
                                      if (clean.isEmpty) return 'Phone number is required';
                                      if (clean.length < 10) return 'Enter 10-digit mobile number';
                                      if (_phoneExistsError != null) return _phoneExistsError;
                                      return null;
                                    },
                                    style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF0F172A)),
                                    decoration: InputDecoration(
                                      counterText: '',
                                      hintText: '10-digit mobile number',
                                      hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                                      filled: true,
                                      fillColor: const Color(0xFFF8FAFC),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      border: const OutlineInputBorder(
                                        borderRadius: BorderRadius.horizontal(right: Radius.circular(12)),
                                        borderSide: BorderSide(color: Color(0xFFCBD5E1)),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(12)),
                                        borderSide: BorderSide(
                                          color: _phoneExistsError != null ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1),
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(12)),
                                        borderSide: BorderSide(
                                          color: _phoneExistsError != null ? const Color(0xFFDC2626) : const Color(0xFF4F46E5),
                                          width: 1.5,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (_phoneExistsError != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                _phoneExistsError!,
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFFDC2626)),
                              ),
                            ] else if (_phoneController.text.isNotEmpty && _phoneController.text.length < 10) ...[
                              const SizedBox(height: 4),
                              Text(
                                '${10 - _phoneController.text.length} more digits needed',
                                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 16),

                        // WhatsApp Number + Same as Phone Toggle
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'WhatsApp Number',
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                                ),
                                InkWell(
                                  onTap: () {
                                    setState(() => _sameAsPhone = !_sameAsPhone);
                                  },
                                  borderRadius: BorderRadius.circular(6),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: Checkbox(
                                            value: _sameAsPhone,
                                            activeColor: const Color(0xFF3B82F6),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                            onChanged: (val) => setState(() => _sameAsPhone = val ?? true),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Same as Phone',
                                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF3B82F6)),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.horizontal(left: Radius.circular(12)),
                                    border: Border(
                                      top: BorderSide(color: Color(0xFFCBD5E1)),
                                      left: BorderSide(color: Color(0xFFCBD5E1)),
                                      bottom: BorderSide(color: Color(0xFFCBD5E1)),
                                    ),
                                  ),
                                  child: Text(
                                    '+91',
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF475569),
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: TextFormField(
                                    controller: _sameAsPhone ? _phoneController : _whatsappController,
                                    enabled: !_sameAsPhone,
                                    keyboardType: TextInputType.phone,
                                    maxLength: 10,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      color: _sameAsPhone ? const Color(0xFF94A3B8) : const Color(0xFF0F172A),
                                    ),
                                    decoration: InputDecoration(
                                      counterText: '',
                                      hintText: '10-digit WhatsApp number',
                                      hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                                      filled: true,
                                      fillColor: _sameAsPhone ? const Color(0xFFF1F5F9) : const Color(0xFFF8FAFC),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      border: const OutlineInputBorder(
                                        borderRadius: BorderRadius.horizontal(right: Radius.circular(12)),
                                        borderSide: BorderSide(color: Color(0xFFCBD5E1)),
                                      ),
                                      enabledBorder: const OutlineInputBorder(
                                        borderRadius: BorderRadius.horizontal(right: Radius.circular(12)),
                                        borderSide: BorderSide(color: Color(0xFFCBD5E1)),
                                      ),
                                      disabledBorder: const OutlineInputBorder(
                                        borderRadius: BorderRadius.horizontal(right: Radius.circular(12)),
                                        borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Section 3: Academic Details
                    _buildSectionCard(
                      title: 'Academic Details',
                      icon: Icons.school_outlined,
                      iconColor: const Color(0xFF8B5CF6),
                      children: [
                        // Group Opting
                        _buildDropdownField(
                          label: 'Group Opting',
                          hint: 'Select Group',
                          value: _group,
                          items: _getByType('GROUP')
                              .map((g) => DropdownMenuItem(
                                    value: g['value'].toString(),
                                    child: Text(g['value'].toString()),
                                  ))
                              .toList(),
                          onChanged: (val) => setState(() => _group = val),
                        ),
                        const SizedBox(height: 16),

                        // Cascading Previous School District
                        _buildDropdownField(
                          label: 'Previous School (District)',
                          hint: 'Select District',
                          value: _schoolDistrict,
                          items: _getByType('DISTRICT')
                              .map((c) => DropdownMenuItem(
                                    value: c['id'].toString(),
                                    child: Text(c['value'].toString()),
                                  ))
                              .toList(),
                          onChanged: (val) {
                            setState(() {
                              _schoolDistrict = val;
                              _schoolMandal = null;
                              _schoolVillage = null;
                              _schoolName = null;
                              _schoolStats = null;
                            });
                          },
                        ),

                        // Cascading Previous School Mandal
                        if (_schoolDistrict != null) ...[
                          const SizedBox(height: 16),
                          _buildDropdownField(
                            label: 'Previous School (Mandal)',
                            hint: 'Select Mandal',
                            value: _schoolMandal,
                            items: _getByParent('MANDAL', _schoolDistrict!)
                                .map((c) => DropdownMenuItem(
                                      value: c['id'].toString(),
                                      child: Text(c['value'].toString()),
                                    ))
                                .toList(),
                            onChanged: (val) {
                              setState(() {
                                _schoolMandal = val;
                                _schoolVillage = null;
                                _schoolName = null;
                                _schoolStats = null;
                              });
                            },
                          ),
                        ],

                        // Cascading Previous School Village
                        if (_schoolMandal != null) ...[
                          const SizedBox(height: 16),
                          _buildDropdownField(
                            label: 'Previous School (Village)',
                            hint: 'Select Village',
                            value: _schoolVillage,
                            items: _getByParent('VILLAGE', _schoolMandal!)
                                .map((c) => DropdownMenuItem(
                                      value: c['id'].toString(),
                                      child: Text(c['value'].toString()),
                                    ))
                                .toList(),
                            onChanged: (val) {
                              setState(() {
                                _schoolVillage = val;
                                _schoolName = null;
                                _schoolStats = null;
                              });
                            },
                          ),
                        ],

                        // Cascading School Name
                        if (_schoolVillage != null) ...[
                          const SizedBox(height: 16),
                          _buildDropdownField(
                            label: 'School Name',
                            hint: 'Select School',
                            value: _schoolName,
                            items: _getByParent('SCHOOL', _schoolVillage!)
                                .map((c) => DropdownMenuItem(
                                      value: c['value'].toString(),
                                      child: Text(c['value'].toString()),
                                    ))
                                .toList(),
                            onChanged: _onSchoolChanged,
                          ),
                        ],
                        const SizedBox(height: 16),

                        _buildTextField(
                          label: 'Marks / Grade / GPA',
                          hint: 'e.g., 95%, 9.5, 950',
                          controller: _marksController,
                        ),

                        // Live School Stats Card
                        if (_schoolName != null) ...[
                          const SizedBox(height: 16),
                          _buildSchoolStatsCard(),
                        ],
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Section 4: Location & Preferences
                    _buildSectionCard(
                      title: 'Location & Preferences',
                      icon: Icons.place_outlined,
                      iconColor: const Color(0xFFF59E0B),
                      children: [
                        // Residence District
                        _buildDropdownField(
                          label: 'Residence District',
                          hint: 'Select District',
                          value: _residenceDistrict,
                          items: _getByType('DISTRICT')
                              .map((c) => DropdownMenuItem(
                                    value: c['id'].toString(),
                                    child: Text(c['value'].toString()),
                                  ))
                              .toList(),
                          onChanged: (val) {
                            setState(() {
                              _residenceDistrict = val;
                              _residenceMandal = null;
                              _residenceVillage = null;
                            });
                          },
                        ),

                        // Residence Mandal
                        if (_residenceDistrict != null) ...[
                          const SizedBox(height: 16),
                          _buildDropdownField(
                            label: 'Residence Mandal',
                            hint: 'Select Mandal',
                            value: _residenceMandal,
                            items: _getByParent('MANDAL', _residenceDistrict!)
                                .map((c) => DropdownMenuItem(
                                      value: c['id'].toString(),
                                      child: Text(c['value'].toString()),
                                    ))
                                .toList(),
                            onChanged: (val) {
                              setState(() {
                                _residenceMandal = val;
                                _residenceVillage = null;
                              });
                            },
                          ),
                        ],

                        // Residence Village
                        if (_residenceMandal != null) ...[
                          const SizedBox(height: 16),
                          _buildDropdownField(
                            label: 'Residence Village',
                            hint: 'Select Village',
                            value: _residenceVillage,
                            items: _getByParent('VILLAGE', _residenceMandal!)
                                .map((c) => DropdownMenuItem(
                                      value: c['id'].toString(),
                                      child: Text(c['value'].toString()),
                                    ))
                                .toList(),
                            onChanged: (val) => setState(() => _residenceVillage = val),
                          ),
                        ],

                        // Landmark Details (shown when village selected)
                        if (_residenceVillage != null) ...[
                          const SizedBox(height: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Landmark / Doorstep Address',
                                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                                  ),
                                  TextButton.icon(
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      foregroundColor: const Color(0xFF0F766E),
                                    ),
                                    icon: _isFetchingGps
                                        ? const SizedBox(
                                            width: 12,
                                            height: 12,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0F766E)),
                                          )
                                        : const Icon(Icons.my_location_rounded, size: 14),
                                    label: Text(
                                      LocationService.extractGps(_landmarkController.text) != null ? 'Re-pin GPS' : '📍 Pin Door GPS',
                                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700),
                                    ),
                                    onPressed: _isFetchingGps ? null : _captureDoorstepGps,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _landmarkController,
                                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF0F172A)),
                                decoration: InputDecoration(
                                  hintText: 'e.g. Near Ramalayam, 2nd house left',
                                  hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                                  filled: true,
                                  fillColor: const Color(0xFFF8FAFC),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5),
                                  ),
                                ),
                                onChanged: (_) => setState(() {}),
                              ),
                              if (LocationService.extractGps(_landmarkController.text) != null) ...[
                                const SizedBox(height: 6),
                                Builder(builder: (ctx) {
                                  final gps = LocationService.extractGps(_landmarkController.text)!;
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF0FDF4),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFF86EFAC)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.pin_drop_rounded, size: 14, color: Color(0xFF16A34A)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            'Pinned: ${gps['lat']!.toStringAsFixed(5)}, ${gps['lng']!.toStringAsFixed(5)}',
                                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF166534)),
                                          ),
                                        ),
                                        InkWell(
                                          onTap: () {
                                            LocationService.openGoogleMapsRoute(
                                              lat: gps['lat']!,
                                              lng: gps['lng']!,
                                              studentName: _nameController.text.trim(),
                                            );
                                          },
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.navigation_rounded, size: 12, color: Color(0xFF0F766E)),
                                                const SizedBox(width: 3),
                                                Text('Test', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF0F766E))),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        InkWell(
                                          onTap: () {
                                            final clean = LocationService.getCleanLandmark(_landmarkController.text);
                                            setState(() {
                                              _landmarkController.text = clean;
                                            });
                                          },
                                          child: const Icon(Icons.close_rounded, size: 14, color: Color(0xFF94A3B8)),
                                        ),
                                      ],
                                    ),
                                  );
                                }),
                              ],
                            ],
                          ),
                        ],
                        const SizedBox(height: 16),

                        // Study Interested At
                        _buildDropdownField(
                          label: 'Study Interested At',
                          hint: 'Select Interest',
                          value: _studyInterestedAt,
                          items: _getByType('STUDY_INTEREST')
                              .map((c) => DropdownMenuItem(
                                    value: c['value'].toString(),
                                    child: Text(c['value'].toString()),
                                  ))
                              .toList(),
                          onChanged: (val) => setState(() => _studyInterestedAt = val),
                        ),
                        const SizedBox(height: 16),

                        // Current Education Stage
                        _buildDropdownField(
                          label: 'Current Education Stage',
                          hint: 'Select Stage',
                          value: _educationStage,
                          items: _getByType('EDUCATION_STAGE')
                              .map((c) => DropdownMenuItem(
                                    value: c['value'].toString(),
                                    child: Text(c['value'].toString()),
                                  ))
                              .toList(),
                          onChanged: (val) => setState(() => _educationStage = val),
                        ),
                        const SizedBox(height: 16),

                        // Able to Bear Fee?
                        _buildDropdownField(
                          label: 'Able to Bear Fee?',
                          hint: 'Select Option',
                          value: _ableToBearFee,
                          items: _getByType('FEE_BEARABLE')
                              .map((c) => DropdownMenuItem(
                                    value: c['value'].toString(),
                                    child: Text(c['value'].toString()),
                                  ))
                              .toList(),
                          onChanged: (val) => setState(() => _ableToBearFee = val),
                        ),
                        const SizedBox(height: 16),

                        // Visit Number
                        _buildTextField(
                          label: 'Visit No.',
                          hint: 'e.g., 1, 2, 3',
                          controller: _visitNumberController,
                        ),
                        const SizedBox(height: 16),

                        // Remarks
                        _buildTextField(
                          label: 'Remarks',
                          hint: 'Any special notes?',
                          controller: _remarksController,
                          maxLines: 3,
                        ),
                        const SizedBox(height: 16),

                        // Doorstep Completed Card
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: _doorstepCompleted ? const Color(0xFFECFDF5) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _doorstepCompleted ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
                              width: _doorstepCompleted ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 22,
                                height: 22,
                                child: Checkbox(
                                  value: _doorstepCompleted,
                                  activeColor: const Color(0xFF10B981),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                                  onChanged: (val) {
                                    setState(() => _doorstepCompleted = val ?? false);
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Doorstep Visit Completed',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: _doorstepCompleted ? const Color(0xFF065F46) : const Color(0xFF334155),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      "Check this if executive has visited the student's home.",
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: _doorstepCompleted ? const Color(0xFF047857) : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Primary Action: Save / Update Student Details
                    ElevatedButton(
                      onPressed: _isLoading ? null : () => _handleSave(addAnother: false),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 2,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, valueColor: AlwaysStoppedAnimation(Colors.white)),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(_isEditing ? Icons.check_circle_outline_rounded : Icons.save_rounded, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  _isEditing ? 'Update Student Details' : 'Save Student Details',
                                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                    ),

                    // Secondary Action: Save & Add Another (only for new students)
                    if (!_isEditing) ...[
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: _isLoading ? null : () => _handleSave(addAnother: true),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF4F46E5),
                          side: const BorderSide(color: Color(0xFF4F46E5), width: 1.5),
                          backgroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.add_circle_outline_rounded, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Save & Add Another',
                              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),

                    // Cancel button
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        'Cancel & Go Back',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }

  // Live School Stats Card
  Widget _buildSchoolStatsCard() {
    if (_isLoadingSchoolStats) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF4F46E5)),
          ),
        ),
      );
    }

    final schoolConfig = _configs.firstWhere(
      (c) => c is Map && c['value'] == _schoolName && c['type'] == 'SCHOOL',
      orElse: () => null,
    );

    final rawStrength = schoolConfig?['strength'];
    final strength = rawStrength is int ? rawStrength : int.tryParse(rawStrength?.toString() ?? '') ?? 0;

    const gradeMap = {
      'A+': 'A+ (Vizag Hostel Schools)',
      'A': 'A (Local Corporate Schools)',
      'B': 'B (Local Private Schools)',
      'C': 'C (ZPH Schools)',
    };

    final rawGrade = schoolConfig?['grade']?.toString();
    final grade = (rawGrade != null && gradeMap.containsKey(rawGrade)) ? gradeMap[rawGrade]! : (rawGrade ?? 'N/A');

    final collected = (_schoolStats?['collected'] as num?)?.toInt() ?? 0;
    final remaining = (strength - collected).clamp(0, 999999);
    final percentage = strength > 0 ? ((collected / strength) * 100).clamp(0.0, 100.0) : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'School Stats',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Grade: $grade',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF1E40AF)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total Strength: $strength', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              Text('Collected: $collected', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              Text('Remaining: $remaining', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
            ],
          ),
          const SizedBox(height: 8),
          if (strength > 0) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: percentage / 100.0,
                minHeight: 8,
                backgroundColor: const Color(0xFFE2E8F0),
                valueColor: AlwaysStoppedAnimation<Color>(
                  percentage >= 100 ? const Color(0xFF10B981) : const Color(0xFF3B82F6),
                ),
              ),
            ),
          ] else ...[
            Text(
              'Total strength is not configured for this school.',
              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFF59E0B)),
            ),
          ],
        ],
      ),
    );
  }

  // Full Success Screen matching web
  Widget _buildSuccessScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: const BoxDecoration(
                      color: Color(0xFFDCFCE7),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_rounded, color: Color(0xFF16A34A), size: 48),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Success!',
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF166534),
                    ),
                  ),
                  const SizedBox(height: 8),
                  RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF475569)),
                      children: [
                        TextSpan(
                          text: _savedStudentName,
                          style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                        ),
                        const TextSpan(text: ' has been successfully added to the database.'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        _clearForm();
                        setState(() => _isSuccessScreen = false);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        'Add Another Student',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF475569),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        'Go to Dashboard',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Color iconColor,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: iconColor),
              const SizedBox(width: 8),
              Text(
                title,
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
              ),
            ],
          ),
          const Divider(height: 24, thickness: 1, color: Color(0xFFF1F5F9)),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    required TextEditingController controller,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          validator: validator,
          onChanged: onChanged,
          style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF0F172A)),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String hint,
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
  }) {
    final hasValidValue = value != null && items.any((item) => item.value == value);
    final selectedValue = hasValidValue ? value : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFCBD5E1)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: selectedValue,
              isExpanded: true,
              hint: Text(hint, style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13)),
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
              items: items,
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildChoiceChip(String label, bool isSelected, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 12),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFCBD5E1),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? const Color(0xFF1E40AF) : const Color(0xFF475569),
            ),
          ),
        ),
      ),
    );
  }
}
