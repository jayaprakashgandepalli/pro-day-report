import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../services/whatsapp_template_service.dart';

class VillageRelativesScreen extends StatefulWidget {
  const VillageRelativesScreen({super.key});

  @override
  State<VillageRelativesScreen> createState() => _VillageRelativesScreenState();
}

class _VillageRelativesScreenState extends State<VillageRelativesScreen> {
  List<dynamic> _relatives = [];
  List<dynamic> _filteredRelatives = [];
  bool _isLoading = true;
  String? _error;
  final _searchController = TextEditingController();

  static const List<String> _commonRelations = [
    'బాబాయ్ (Paternal Uncle)',
    'మావయ్య (Maternal Uncle)',
    'పెద్దనాన్న (Elder Uncle)',
    'అన్నయ్య / తమ్ముడు (Brother)',
    'బావ / బావమరిది (In-Law)',
    'పిన్ని / అత్తయ్య (Aunt)',
    'తాతయ్య (Grandfather)',
    'మేనల్లుడు (Nephew)',
    'స్నేహితుడు (Family Friend)',
    'బంధువు (Relative)',
  ];

  @override
  void initState() {
    super.initState();
    _fetchRelatives();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchRelatives({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    await ApiService.getConfigMap();
    final res = await ApiService.getRelatives(forceRefresh: forceRefresh);

    if (!mounted) return;

    if (res['success'] == true) {
      final list = res['relatives'] as List<dynamic>? ?? [];
      setState(() {
        _relatives = list;
        _filteredRelatives = list;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = res['error'] ?? 'Failed to load village relatives';
        _isLoading = false;
      });
    }
  }

  void _onSearch(String q) {
    final query = q.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() => _filteredRelatives = _relatives);
    } else {
      setState(() {
        _filteredRelatives = _relatives.where((r) {
          final name = (r['name'] ?? '').toString().toLowerCase();
          final phone = (r['phone'] ?? '').toString().toLowerCase();
          final relation = (r['relation'] ?? '').toString().toLowerCase();
          final occupation = (r['occupation'] ?? '').toString().toLowerCase();
          final rawVillage = (r['village'] ?? '').toString().toLowerCase();
          final rawMandal = (r['mandal'] ?? '').toString().toLowerCase();
          final resolvedVillage = ApiService.resolveConfig(r['village']).toLowerCase();
          final resolvedMandal = ApiService.resolveConfig(r['mandal']).toLowerCase();
          return name.contains(query) ||
              phone.contains(query) ||
              relation.contains(query) ||
              occupation.contains(query) ||
              rawVillage.contains(query) ||
              rawMandal.contains(query) ||
              resolvedVillage.contains(query) ||
              resolvedMandal.contains(query);
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
    final nameCtrl = TextEditingController(text: item?['name']?.toString() ?? '');
    final phoneCtrl = TextEditingController(text: item?['phone']?.toString() ?? '');
    final occupationCtrl = TextEditingController(text: item?['occupation']?.toString() ?? '');
    final villageCtrl = TextEditingController(text: ApiService.resolveConfig(item?['village']));
    final mandalCtrl = TextEditingController(text: ApiService.resolveConfig(item?['mandal']));
    String selectedRelation = item?['relation']?.toString() ?? _commonRelations.first;
    bool isSaving = false;

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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isEdit ? 'Edit Village Relative' : 'Add Village Relative',
                              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                            ),
                            Text(
                              'Relative of employee in village (గ్రామ బంధువు)',
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

                    _buildField('Relative Name *', 'e.g. Ramesh, Srinivas Rao', nameCtrl),
                    const SizedBox(height: 12),

                    Text('Relation with Employee *',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _commonRelations.contains(selectedRelation) ? selectedRelation : null,
                          hint: Text(selectedRelation.isNotEmpty ? selectedRelation : 'Select Relation',
                              style: GoogleFonts.inter(fontSize: 14)),
                          isExpanded: true,
                          items: _commonRelations.map((r) {
                            return DropdownMenuItem<String>(
                              value: r,
                              child: Text(r, style: GoogleFonts.inter(fontSize: 14)),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setModalState(() => selectedRelation = val);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    _buildField('Mobile Number *', '10-digit phone number', phoneCtrl,
                        keyboardType: TextInputType.phone),
                    const SizedBox(height: 12),

                    _buildField('Village / Habitation *', 'e.g. Kothapeta, Mallapur', villageCtrl),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: _buildField('Mandal (Optional)', 'e.g. Medchal', mandalCtrl),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildField('Occupation (వృత్తి)', 'e.g. Farmer, Business, Teacher', occupationCtrl),
                        ),
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
                                final village = villageCtrl.text.trim();

                                if (name.isEmpty || phone.isEmpty || village.isEmpty) {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    const SnackBar(
                                      content: Text('Name, Phone, and Village are required'),
                                      backgroundColor: Color(0xFFEF4444),
                                    ),
                                  );
                                  return;
                                }

                                setModalState(() => isSaving = true);

                                final payload = {
                                  'name': name,
                                  'phone': phone,
                                  'relation': selectedRelation,
                                  'village': village,
                                  'mandal': mandalCtrl.text.trim().isEmpty ? null : mandalCtrl.text.trim(),
                                  'occupation': occupationCtrl.text.trim().isEmpty ? null : occupationCtrl.text.trim(),
                                };

                                Map<String, dynamic> res;
                                if (isEdit) {
                                  res = await ApiService.updateRelative(item['id'].toString(), payload);
                                } else {
                                  res = await ApiService.addRelative(payload);
                                }

                                if (!modalCtx.mounted) return;
                                setModalState(() => isSaving = false);

                                if (res['success'] == true) {
                                  Navigator.pop(modalCtx);
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(isEdit
                                          ? 'Relative updated successfully! ✨'
                                          : 'Village relative added successfully! 🤝'),
                                      backgroundColor: const Color(0xFF059669),
                                    ),
                                  );
                                  _fetchRelatives(forceRefresh: true);
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
                          backgroundColor: const Color(0xFF0284C7),
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
                                isEdit ? 'Update Relative' : 'Save Village Relative',
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
        title: Text('Delete Relative?', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to remove ${item['name']} from your village relatives?',
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
              final res = await ApiService.deleteRelative(item['id'].toString());
              if (!mounted) return;
              if (res['success'] == true) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Relative removed successfully'), backgroundColor: Color(0xFF059669)),
                );
                _fetchRelatives(forceRefresh: true);
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

  Widget _buildField(
    String label,
    String hint,
    TextEditingController ctrl, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
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
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5),
            ),
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
              'Village Relatives (${_filteredRelatives.length})',
              style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontWeight: FontWeight.w700, fontSize: 18),
            ),
            Text(
              'గ్రామ బంధువులు • Relatives of employee',
              style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF0284C7)),
            onPressed: () => _fetchRelatives(forceRefresh: true),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF0284C7),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_rounded),
        label: Text('Add Relative', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        onPressed: () => _openAddOrEditDialog(),
      ),
      body: Column(
        children: [
          // Informational Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFFE0F2FE),
            child: Row(
              children: [
                const Icon(Icons.handshake_rounded, color: Color(0xFF0284C7), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Your relatives in villages who assist you in admissions & student outreach.',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF0369A1), fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),

          // Search Box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              onChanged: _onSearch,
              style: GoogleFonts.inter(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search relative, village, relation, phone...',
                hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF0284C7)),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),

          // Relatives List
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
                              onPressed: () => _fetchRelatives(forceRefresh: true),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _filteredRelatives.isEmpty
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
                                      color: const Color(0xFFE0F2FE),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.handshake_outlined, size: 36, color: Color(0xFF0284C7)),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No Village Relatives Added Yet',
                                    style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Add your relatives living in different villages to keep track of local contacts who can help with college admissions.',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), height: 1.4),
                                  ),
                                  const SizedBox(height: 20),
                                  ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0284C7),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                    ),
                                    icon: const Icon(Icons.add_rounded, size: 20),
                                    label: const Text('Add Your First Relative'),
                                    onPressed: () => _openAddOrEditDialog(),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _fetchRelatives(forceRefresh: true),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _filteredRelatives.length,
                              separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final r = _filteredRelatives[index];
                                final name = r['name'] ?? 'Relative';
                                final phone = (r['phone'] ?? '').toString();
                                final relation = (r['relation'] ?? '').toString();
                                final occupation = (r['occupation'] ?? '').toString();
                                final locationText = ApiService.formatLocation(r['village'], r['mandal']);

                                return Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.02),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          CircleAvatar(
                                            radius: 22,
                                            backgroundColor: const Color(0xFF0284C7).withValues(alpha: 0.12),
                                            child: Text(
                                              name.isNotEmpty ? name[0].toUpperCase() : 'R',
                                              style: GoogleFonts.outfit(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                                color: const Color(0xFF0284C7),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  name,
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w700,
                                                    color: const Color(0xFF0F172A),
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Wrap(
                                                  spacing: 6,
                                                  runSpacing: 4,
                                                  children: [
                                                    if (relation.isNotEmpty)
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: const Color(0xFFF3E8FF),
                                                          borderRadius: BorderRadius.circular(8),
                                                          border: Border.all(color: const Color(0xFFE9D5FF)),
                                                        ),
                                                        child: Text(
                                                          relation,
                                                          style: GoogleFonts.inter(
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.w600,
                                                            color: const Color(0xFF7E22CE),
                                                          ),
                                                        ),
                                                      ),
                                                    if (occupation.isNotEmpty)
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: const Color(0xFFECFDF5),
                                                          borderRadius: BorderRadius.circular(8),
                                                          border: Border.all(color: const Color(0xFFA7F3D0)),
                                                        ),
                                                        child: Text(
                                                          occupation,
                                                          style: GoogleFonts.inter(
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.w600,
                                                            color: const Color(0xFF047857),
                                                          ),
                                                        ),
                                                      ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          PopupMenuButton<String>(
                                            icon: const Icon(Icons.more_vert_rounded, color: Color(0xFF94A3B8)),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            onSelected: (val) {
                                              if (val == 'edit') {
                                                _openAddOrEditDialog(item: r);
                                              } else if (val == 'delete') {
                                                _confirmDelete(r);
                                              }
                                            },
                                            itemBuilder: (ctx) => [
                                              const PopupMenuItem(
                                                value: 'edit',
                                                child: Row(
                                                  children: [
                                                    Icon(Icons.edit_outlined, size: 18, color: Color(0xFF0284C7)),
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
                                      const SizedBox(height: 12),

                                      // Location and Contact row
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFF64748B)),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              locationText,
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                                color: const Color(0xFF475569),
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),

                                      // Actions Row: Call & WhatsApp
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton.icon(
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: const Color(0xFF0284C7),
                                                side: const BorderSide(color: Color(0xFFBAE6FD)),
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
