import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../services/whatsapp_template_service.dart';

class KeyPersonsScreen extends StatefulWidget {
  const KeyPersonsScreen({super.key});

  @override
  State<KeyPersonsScreen> createState() => _KeyPersonsScreenState();
}

class _KeyPersonsScreenState extends State<KeyPersonsScreen> {
  List<dynamic> _keyPersons = [];
  List<dynamic> _filteredPersons = [];
  bool _isLoading = true;
  String? _error;
  final _searchController = TextEditingController();

  static const List<String> _schoolDesignations = [
    'Senior Teacher (సీనియర్ ఉపాధ్యాయులు)',
    'Physical Director / PET (పీఈటీ / పీడీ)',
    'Maths Teacher (గణిత ఉపాధ్యాయులు)',
    'Science / English Teacher',
    'Correspondent / Trustee (కరస్పాండెంట్)',
    'Tuition Master / Incharge (ట్యూషన్ ఇన్చార్జి)',
    'Head Clerk / Office Staff',
    'Other School Staff (ఇతర పాఠశాల సిబ్బంది)',
  ];

  @override
  void initState() {
    super.initState();
    _fetchKeyPersons();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchKeyPersons({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final configFuture = ApiService.getConfigMap();
    final res = await ApiService.getKeyPersons(forceRefresh: forceRefresh);
    await configFuture;

    if (!mounted) return;

    if (res['success'] == true) {
      final list = res['keyPersons'] as List<dynamic>? ?? [];
      setState(() {
        _keyPersons = list;
        _filteredPersons = list;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = res['error'] ?? 'Failed to load school key persons';
        _isLoading = false;
      });
    }
  }

  void _onSearch(String q) {
    final query = q.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() => _filteredPersons = _keyPersons);
    } else {
      setState(() {
        _filteredPersons = _keyPersons.where((p) {
          final name = (p['name'] ?? '').toString().toLowerCase();
          final phone = (p['phone'] ?? '').toString().toLowerCase();
          final desig = (p['designation'] ?? '').toString().toLowerCase();
          final school = (p['schoolName'] ?? '').toString().toLowerCase();
          final village = ApiService.resolveConfig(p['village']).toLowerCase();
          final mandal = (p['mandal'] ?? '').toString().toLowerCase();
          return name.contains(query) ||
              phone.contains(query) ||
              desig.contains(query) ||
              school.contains(query) ||
              village.contains(query) ||
              mandal.contains(query);
        }).toList();
      });
    }
  }

  Future<void> _launchCall(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.isEmpty) return;
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _openAddOrEditDialog({Map<String, dynamic>? item}) {
    final isEdit = item != null;
    final schoolCtrl = TextEditingController(text: item?['schoolName']?.toString() ?? '');
    final nameCtrl = TextEditingController(text: item?['name']?.toString() ?? '');
    final phoneCtrl = TextEditingController(text: item?['phone']?.toString() ?? '');
    final desigCtrl = TextEditingController(text: item?['designation']?.toString() ?? '');
    final villageCtrl = TextEditingController(text: item?['village']?.toString() ?? '');
    final mandalCtrl = TextEditingController(text: item?['mandal']?.toString() ?? '');
    final districtCtrl = TextEditingController(text: item?['district']?.toString() ?? '');
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
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
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isEdit ? 'Edit School Key Person' : 'Add School Key Person',
                              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                            ),
                            Text(
                              'Important person in school other than HM',
                              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                    const Divider(height: 20),

                    _buildField('School Name *', 'e.g. ZPHS Kothapeta, Sri Chaitanya School', schoolCtrl),
                    const SizedBox(height: 12),

                    _buildField('Staff / Person Name *', 'Enter full name', nameCtrl),
                    const SizedBox(height: 12),

                    _buildField('Mobile Number *', '10-digit number', phoneCtrl, keyboardType: TextInputType.phone),
                    const SizedBox(height: 12),

                    Text('Designation in School *',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                    const SizedBox(height: 6),
                    // Quick Designation Suggestions
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _schoolDesignations.take(4).map((d) {
                          final shortName = d.split(' (')[0];
                          return Padding(
                            padding: const EdgeInsets.only(right: 6.0),
                            child: ActionChip(
                              label: Text(shortName, style: GoogleFonts.inter(fontSize: 11)),
                              backgroundColor: const Color(0xFFFEF3C7),
                              labelStyle: const TextStyle(color: Color(0xFF92400E)),
                              padding: EdgeInsets.zero,
                              onPressed: () {
                                setModalState(() => desigCtrl.text = shortName);
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: desigCtrl,
                      style: GoogleFonts.inter(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'e.g. Senior Teacher, PD, Correspondent, Tuition Head',
                        hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      ),
                    ),
                    const SizedBox(height: 12),

                    _buildField('Village / Town', 'Enter village or town of school', villageCtrl),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(child: _buildField('Mandal', 'Enter mandal', mandalCtrl)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildField('District', 'Enter district', districtCtrl)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isSaving
                            ? null
                            : () async {
                                final name = nameCtrl.text.trim();
                                final phone = phoneCtrl.text.trim();
                                final schoolName = schoolCtrl.text.trim();

                                if (name.isEmpty || phone.isEmpty || schoolName.isEmpty) {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    const SnackBar(
                                      content: Text('School Name, Person Name, and Mobile Number are required'),
                                      backgroundColor: Color(0xFFEF4444),
                                    ),
                                  );
                                  return;
                                }

                                setModalState(() => isSaving = true);

                                final payload = {
                                  'schoolName': schoolName,
                                  'name': name,
                                  'phone': phone,
                                  'designation': desigCtrl.text.trim(),
                                  'village': villageCtrl.text.trim(),
                                  'mandal': mandalCtrl.text.trim(),
                                  'district': districtCtrl.text.trim(),
                                };

                                Map<String, dynamic> res;
                                if (isEdit) {
                                  res = await ApiService.updateKeyPerson(item['id'].toString(), payload);
                                } else {
                                  res = await ApiService.addKeyPerson(payload);
                                }

                                if (!modalCtx.mounted) return;
                                setModalState(() => isSaving = false);

                                if (res['success'] == true) {
                                  Navigator.pop(modalCtx);
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(isEdit
                                          ? 'School key person updated successfully! ✨'
                                          : 'School key person added successfully! 🏫'),
                                      backgroundColor: const Color(0xFF059669),
                                    ),
                                  );
                                  _fetchKeyPersons(forceRefresh: true);
                                } else {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    SnackBar(
                                      content: Text(res['error'] ?? 'Operation failed'),
                                      backgroundColor: const Color(0xFFEF4444),
                                    ),
                                  );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD97706),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        child: isSaving
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation(Colors.white),
                                ),
                              )
                            : Text(
                                isEdit ? 'Update Key Person' : 'Save School Key Person',
                                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _confirmDelete(Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Delete School Key Person?', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to remove ${item['name']} from school key persons?',
            style: GoogleFonts.inter(fontSize: 14)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444), foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              final res = await ApiService.deleteKeyPerson(item['id'].toString());
              if (!mounted) return;
              if (res['success'] == true) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Key person deleted successfully'), backgroundColor: Color(0xFF059669)),
                );
                _fetchKeyPersons(forceRefresh: true);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(res['error'] ?? 'Failed to delete'), backgroundColor: const Color(0xFFEF4444)),
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController ctrl, {TextInputType keyboardType = TextInputType.text}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          keyboardType: keyboardType,
          style: GoogleFonts.inter(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFD97706), width: 1.5)),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
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
              'School Key Persons (${_filteredPersons.length})',
              style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontWeight: FontWeight.w700, fontSize: 18),
            ),
            Text(
              'పాఠశాల ముఖ్య వ్యక్తులు • Staff other than HM',
              style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFFD97706)),
            onPressed: () => _fetchKeyPersons(forceRefresh: true),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFD97706),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_alt_1_rounded),
        label: Text('Add Key Person', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        onPressed: () => _openAddOrEditDialog(),
      ),
      body: Column(
        children: [
          // Informational Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFFFEF3C7),
            child: Row(
              children: [
                const Icon(Icons.school_rounded, color: Color(0xFFD97706), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'School staff other than Headmaster (HM): Teachers, PDs, Correspondents, Tuition Heads.',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF92400E), fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),

          // Search box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              onChanged: _onSearch,
              style: GoogleFonts.inter(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search by school, name, phone, designation...',
                hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFFD97706)),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!, style: GoogleFonts.inter(color: const Color(0xFFEF4444))),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => _fetchKeyPersons(forceRefresh: true),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _filteredPersons.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 72,
                                    height: 72,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEF3C7),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.school_outlined, size: 36, color: Color(0xFFD97706)),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No School Key Persons Found',
                                    style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Save important teachers, physical directors, and school influencers other than the HM to facilitate student admissions.',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), height: 1.4),
                                  ),
                                  const SizedBox(height: 20),
                                  ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFD97706),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                    ),
                                    icon: const Icon(Icons.add_rounded, size: 20),
                                    label: const Text('Add School Key Person'),
                                    onPressed: () => _openAddOrEditDialog(),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _fetchKeyPersons(forceRefresh: true),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _filteredPersons.length,
                              separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final p = _filteredPersons[index];
                                final name = (p['name'] ?? 'Key Person').toString();
                                final phone = (p['phone'] ?? '').toString();
                                final desig = (p['designation'] ?? '').toString();
                                final school = (p['schoolName'] ?? '').toString();
                                final village = ApiService.resolveConfig(p['village']);
                                final mandal = (p['mandal'] ?? '').toString();

                                return Container(
                                  padding: const EdgeInsets.all(16),
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
                                      // School Name Header
                                      if (school.isNotEmpty)
                                        Container(
                                          margin: const EdgeInsets.only(bottom: 10),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFFBEB),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFFDE68A)),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.school_rounded, size: 15, color: Color(0xFFD97706)),
                                              const SizedBox(width: 6),
                                              Flexible(
                                                child: Text(
                                                  school,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w700,
                                                    color: const Color(0xFFB45309),
                                                  ),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),

                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          CircleAvatar(
                                            radius: 22,
                                            backgroundColor: const Color(0xFFD97706).withValues(alpha: 0.12),
                                            child: Text(
                                              name.isNotEmpty ? name[0].toUpperCase() : 'P',
                                              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFFD97706)),
                                            ),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  name,
                                                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                                                ),
                                                if (desig.isNotEmpty)
                                                  Container(
                                                    margin: const EdgeInsets.only(top: 3),
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFEEF2FF),
                                                      borderRadius: BorderRadius.circular(6),
                                                      border: Border.all(color: const Color(0xFFE0E7FF)),
                                                    ),
                                                    child: Text(
                                                      desig,
                                                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF4F46E5)),
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          ),
                                          PopupMenuButton<String>(
                                            icon: const Icon(Icons.more_vert_rounded, color: Color(0xFF94A3B8)),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            onSelected: (val) {
                                              if (val == 'edit') {
                                                _openAddOrEditDialog(item: p);
                                              } else if (val == 'delete') {
                                                _confirmDelete(p);
                                              }
                                            },
                                            itemBuilder: (ctx) => [
                                              const PopupMenuItem(
                                                value: 'edit',
                                                child: Row(
                                                  children: [
                                                    Icon(Icons.edit_outlined, size: 18, color: Color(0xFFD97706)),
                                                    SizedBox(width: 8),
                                                    Text('Edit'),
                                                  ],
                                                ),
                                              ),
                                              const PopupMenuItem(
                                                value: 'delete',
                                                child: Row(
                                                  children: [
                                                    Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFEF4444)),
                                                    SizedBox(width: 8),
                                                    Text('Delete', style: TextStyle(color: Color(0xFFEF4444))),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),

                                      // Location
                                      if (village.isNotEmpty || mandal.isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(bottom: 12),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.location_on_outlined, size: 15, color: Color(0xFF64748B)),
                                              const SizedBox(width: 4),
                                              Expanded(
                                                child: Text(
                                                  village.isNotEmpty
                                                      ? (mandal.isNotEmpty ? '$village, $mandal' : village)
                                                      : mandal,
                                                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),

                                      // Actions Row: Call & WhatsApp
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton.icon(
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: const Color(0xFFD97706),
                                                side: const BorderSide(color: Color(0xFFFDE68A)),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                              ),
                                              icon: const Icon(Icons.call_outlined, size: 18),
                                              label: Text(
                                                phone.isNotEmpty ? phone : 'Call',
                                                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                                              ),
                                              onPressed: phone.isNotEmpty ? () => _launchCall(phone) : null,
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF25D366),
                                                foregroundColor: Colors.white,
                                                elevation: 0,
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                              ),
                                              icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                                              label: Text(
                                                'WhatsApp',
                                                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                                              ),
                                              onPressed: phone.isNotEmpty
                                                  ? () => WhatsAppTemplateService.launchWhatsApp(phone)
                                                  : null,
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
          ),
        ],
      ),
    );
  }
}
