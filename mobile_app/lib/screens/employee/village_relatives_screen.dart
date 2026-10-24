import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';

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
  final Set<String> _expandedIds = <String>{};

  static const List<String> _commonRelations = [
    'Paternal Uncle',
    'Maternal Uncle',
    'Elder Uncle',
    'Brother',
    'In-Law',
    'Aunt',
    'Grandfather',
    'Nephew',
    'Family Friend',
    'Relative',
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
                              'Relative of employee in village',
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
                          value: () {
                            if (_commonRelations.contains(selectedRelation)) return selectedRelation;
                            final cleaned = _cleanTelugu(selectedRelation);
                            if (_commonRelations.contains(cleaned)) return cleaned;
                            return selectedRelation.isNotEmpty ? selectedRelation : null;
                          }(),
                          hint: Text(selectedRelation.isNotEmpty ? _cleanTelugu(selectedRelation) : 'Select Relation',
                              style: GoogleFonts.inter(fontSize: 14)),
                          isExpanded: true,
                          items: () {
                            final list = List<String>.from(_commonRelations);
                            final cleaned = _cleanTelugu(selectedRelation);
                            if (cleaned.isNotEmpty && !list.contains(cleaned)) {
                              list.insert(0, cleaned);
                            }
                            return list.map((r) {
                              return DropdownMenuItem<String>(
                                value: r,
                                child: Text(r, style: GoogleFonts.inter(fontSize: 14)),
                              );
                            }).toList();
                          }(),
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
                          child: _buildField('Occupation', 'e.g. Farmer, Business, Teacher', occupationCtrl),
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

  String _cleanTelugu(String text) {
    if (text.isEmpty) return text;
    final match = RegExp(r'\((.*?)\)').firstMatch(text);
    if (match != null && match.group(1) != null) {
      return match.group(1)!.trim();
    }
    final cleaned = text.replaceAll(RegExp(r'[\u0C00-\u0C7F]'), '').trim();
    return cleaned.isNotEmpty ? cleaned : text;
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).toList();
    if (parts.isEmpty) return 'VR';
    if (parts.length == 1) {
      return parts[0].length >= 2 ? parts[0].substring(0, 2).toUpperCase() : parts[0].toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  LinearGradient _getAvatarGradient(int index) {
    const gradients = [
      LinearGradient(
        colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      LinearGradient(
        colors: [Color(0xFF0284C7), Color(0xFF0EA5E9)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      LinearGradient(
        colors: [Color(0xFF7C3AED), Color(0xFF6366F1)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      LinearGradient(
        colors: [Color(0xFF0D9488), Color(0xFF059669)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      LinearGradient(
        colors: [Color(0xFFE11D48), Color(0xFFF43F5E)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      LinearGradient(
        colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ];
    return gradients[index % gradients.length];
  }

  Widget _buildDetailRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    Widget? action,
  }) {
    return Row(
      children: [
        Icon(icon, size: 15, color: iconColor),
        const SizedBox(width: 8),
        SizedBox(
          width: 95,
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: const Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 12.5,
              color: const Color(0xFF1E293B),
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (action != null) ...[
          const SizedBox(width: 6),
          action,
        ],
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
              'Relatives of employee in villages',
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
                              padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 90),
                              itemCount: _filteredRelatives.length,
                              separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final r = _filteredRelatives[index];
                                final rId = (r['id'] ?? index).toString();
                                final isExpanded = _expandedIds.contains(rId);

                                final name = r['name'] ?? 'Relative';
                                final phone = (r['phone'] ?? '').toString();
                                final relation = (r['relation'] ?? '').toString();
                                final occupation = (r['occupation'] ?? '').toString();
                                final relClean = relation.isNotEmpty ? _cleanTelugu(relation) : 'Relative';
                                final m = ApiService.resolveConfig(r['mandal']);
                                final v = ApiService.resolveConfig(r['village']);
                                String locPart = '';
                                if (m.isNotEmpty) {
                                  locPart = m;
                                } else if (v.isNotEmpty) {
                                  locPart = v;
                                }
                                final subtitleText = locPart.isNotEmpty ? '$relClean • $locPart' : relClean;

                                return Material(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  child: InkWell(
                                    onTap: () {
                                      setState(() {
                                        if (isExpanded) {
                                          _expandedIds.remove(rId);
                                        } else {
                                          _expandedIds.add(rId);
                                        }
                                      });
                                    },
                                    borderRadius: BorderRadius.circular(18),
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 200),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(18),
                                        border: Border.all(
                                          color: isExpanded ? const Color(0xFF0284C7).withValues(alpha: 0.35) : const Color(0xFFF1F5F9),
                                          width: isExpanded ? 1.5 : 1,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                                            blurRadius: 10,
                                            offset: const Offset(0, 3),
                                          ),
                                        ],
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // Compact Modern Row (Image 1 design)
                                          Row(
                                            children: [
                                              // 1. Two-letter Initials Avatar with Gradient
                                              Container(
                                                width: 44,
                                                height: 44,
                                                decoration: BoxDecoration(
                                                  shape: BoxShape.circle,
                                                  gradient: _getAvatarGradient(index),
                                                ),
                                                child: Center(
                                                  child: Text(
                                                    _getInitials(name),
                                                    style: GoogleFonts.outfit(
                                                      fontSize: 15,
                                                      fontWeight: FontWeight.w700,
                                                      color: Colors.white,
                                                      letterSpacing: 0.5,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 12),

                                              // 2. Name + Active Badge + Subtitle (Relation • Location)
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Row(
                                                      children: [
                                                        Flexible(
                                                          child: Text(
                                                            name,
                                                            style: GoogleFonts.outfit(
                                                              fontSize: 15.5,
                                                              fontWeight: FontWeight.w700,
                                                              color: const Color(0xFF0F172A),
                                                            ),
                                                            maxLines: 1,
                                                            overflow: TextOverflow.ellipsis,
                                                          ),
                                                        ),
                                                        const SizedBox(width: 8),
                                                        Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                                          decoration: BoxDecoration(
                                                            color: const Color(0xFFECFDF5),
                                                            borderRadius: BorderRadius.circular(6),
                                                            border: Border.all(
                                                              color: const Color(0xFFA7F3D0).withValues(alpha: 0.6),
                                                            ),
                                                          ),
                                                          child: Text(
                                                            'Active',
                                                            style: GoogleFonts.inter(
                                                              fontSize: 10.5,
                                                              fontWeight: FontWeight.w600,
                                                              color: const Color(0xFF059669),
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 3),
                                                    Text(
                                                      subtitleText,
                                                      style: GoogleFonts.inter(
                                                        fontSize: 13,
                                                        fontWeight: FontWeight.w500,
                                                        color: const Color(0xFF64748B),
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              const SizedBox(width: 8),

                                              // 3. Green Circular Call Button
                                              if (phone.isNotEmpty) ...[
                                                Material(
                                                  color: Colors.transparent,
                                                  child: InkWell(
                                                    onTap: () => _launchCall(phone),
                                                    borderRadius: BorderRadius.circular(22),
                                                    child: Container(
                                                      width: 40,
                                                      height: 40,
                                                      decoration: BoxDecoration(
                                                        color: const Color(0xFF10B981),
                                                        shape: BoxShape.circle,
                                                        boxShadow: [
                                                          BoxShadow(
                                                            color: const Color(0xFF10B981).withValues(alpha: 0.35),
                                                            blurRadius: 8,
                                                            offset: const Offset(0, 3),
                                                          ),
                                                        ],
                                                      ),
                                                      child: const Center(
                                                        child: Icon(
                                                          Icons.call_rounded,
                                                          size: 20,
                                                          color: Colors.white,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                              ],

                                              // 4. Expand / Collapse Arrow
                                              Icon(
                                                isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                                                color: const Color(0xFF94A3B8),
                                                size: 26,
                                              ),
                                            ],
                                          ),

                                          // Expanded Details Section
                                          AnimatedSize(
                                            duration: const Duration(milliseconds: 200),
                                            curve: Curves.easeInOut,
                                            child: isExpanded
                                                ? Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      const SizedBox(height: 12),
                                                      const Divider(height: 1, color: Color(0xFFE2E8F0)),
                                                      const SizedBox(height: 12),
                                                      Container(
                                                        padding: const EdgeInsets.all(12),
                                                        decoration: BoxDecoration(
                                                          color: const Color(0xFFF8FAFC),
                                                          borderRadius: BorderRadius.circular(12),
                                                          border: Border.all(color: const Color(0xFFE2E8F0)),
                                                        ),
                                                        child: Column(
                                                          children: [
                                                            _buildDetailRow(
                                                              icon: Icons.phone_outlined,
                                                              iconColor: const Color(0xFF059669),
                                                              label: 'Mobile Number',
                                                              value: phone.isNotEmpty ? phone : 'Not provided',
                                                              action: phone.isNotEmpty
                                                                  ? InkWell(
                                                                      onTap: () => _launchCall(phone),
                                                                      borderRadius: BorderRadius.circular(6),
                                                                      child: Container(
                                                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                                        decoration: BoxDecoration(
                                                                          color: const Color(0xFFECFDF5),
                                                                          borderRadius: BorderRadius.circular(6),
                                                                          border: Border.all(color: const Color(0xFFA7F3D0)),
                                                                        ),
                                                                        child: Row(
                                                                          mainAxisSize: MainAxisSize.min,
                                                                          children: [
                                                                            const Icon(Icons.call, size: 12, color: Color(0xFF059669)),
                                                                            const SizedBox(width: 4),
                                                                            Text(
                                                                              'Call Now',
                                                                              style: GoogleFonts.inter(
                                                                                fontSize: 11,
                                                                                fontWeight: FontWeight.w600,
                                                                                color: const Color(0xFF047857),
                                                                              ),
                                                                            ),
                                                                          ],
                                                                        ),
                                                                      ),
                                                                    )
                                                                  : null,
                                                            ),
                                                            const SizedBox(height: 8),
                                                            _buildDetailRow(
                                                              icon: Icons.people_outline_rounded,
                                                              iconColor: const Color(0xFF7E22CE),
                                                              label: 'Relation',
                                                              value: relation.isNotEmpty ? _cleanTelugu(relation) : 'Not specified',
                                                            ),
                                                            if (occupation.isNotEmpty) ...[
                                                              const SizedBox(height: 8),
                                                              _buildDetailRow(
                                                                icon: Icons.work_outline_rounded,
                                                                iconColor: const Color(0xFF0284C7),
                                                                label: 'Occupation',
                                                                value: _cleanTelugu(occupation),
                                                              ),
                                                            ],
                                                            const SizedBox(height: 8),
                                                            _buildDetailRow(
                                                              icon: Icons.location_city_rounded,
                                                              iconColor: const Color(0xFFD97706),
                                                              label: 'Village',
                                                              value: ApiService.resolveConfig(r['village']).isNotEmpty
                                                                  ? ApiService.resolveConfig(r['village'])
                                                                  : (r['village']?.toString() ?? 'Not specified'),
                                                            ),
                                                            if ((r['mandal']?.toString() ?? '').isNotEmpty) ...[
                                                              const SizedBox(height: 8),
                                                              _buildDetailRow(
                                                                icon: Icons.map_outlined,
                                                                iconColor: const Color(0xFF475569),
                                                                label: 'Mandal',
                                                                value: ApiService.resolveConfig(r['mandal']).isNotEmpty
                                                                    ? ApiService.resolveConfig(r['mandal'])
                                                                    : (r['mandal']?.toString() ?? ''),
                                                              ),
                                                            ],
                                                          ],
                                                        ),
                                                      ),
                                                      const SizedBox(height: 12),
                                                      Row(
                                                        children: [
                                                          Expanded(
                                                            child: OutlinedButton.icon(
                                                              style: OutlinedButton.styleFrom(
                                                                foregroundColor: const Color(0xFF0284C7),
                                                                side: const BorderSide(color: Color(0xFFBAE6FD)),
                                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                                padding: const EdgeInsets.symmetric(vertical: 9),
                                                              ),
                                                              icon: const Icon(Icons.edit_outlined, size: 16),
                                                              label: Text('Edit Details', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                                                              onPressed: () => _openAddOrEditDialog(item: r),
                                                            ),
                                                          ),
                                                          const SizedBox(width: 8),
                                                          OutlinedButton.icon(
                                                            style: OutlinedButton.styleFrom(
                                                              foregroundColor: const Color(0xFFEF4444),
                                                              side: const BorderSide(color: Color(0xFFFECACA)),
                                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                                                            ),
                                                            icon: const Icon(Icons.delete_outline_rounded, size: 16),
                                                            label: Text('Delete', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                                                            onPressed: () => _confirmDelete(r),
                                                          ),
                                                        ],
                                                      ),
                                                    ],
                                                  )
                                                : const SizedBox.shrink(),
                                          ),
                                        ],
                                      ),
                                    ),
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
