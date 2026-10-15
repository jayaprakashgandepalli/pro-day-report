import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';

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

  Future<void> _fetchKeyPersons() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final configFuture = ApiService.getConfigMap();
    final res = await ApiService.getKeyPersons();
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
        _error = res['error'] ?? 'Failed to load key persons';
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
          final village = ApiService.resolveConfig(p['village']).toLowerCase();
          return name.contains(query) || phone.contains(query) || desig.contains(query) || village.contains(query);
        }).toList();
      });
    }
  }

  void _openAddPersonDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final desigCtrl = TextEditingController();
    final villageCtrl = TextEditingController();
    final mandalCtrl = TextEditingController();
    final districtCtrl = TextEditingController();
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
                        Text('Add Key Person', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                        IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(modalCtx)),
                      ],
                    ),
                    const Divider(height: 20),

                    _buildField('Full Name *', 'Enter name', nameCtrl),
                    const SizedBox(height: 12),
                    _buildField('Mobile Number *', '10-digit number', phoneCtrl, keyboardType: TextInputType.phone),
                    const SizedBox(height: 12),
                    _buildField('Designation', 'e.g. Headmaster, Sarpanch, Ward Member', desigCtrl),
                    const SizedBox(height: 12),
                    _buildField('Village / Town', 'Enter village', villageCtrl),
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
                                if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    const SnackBar(content: Text('Name and Phone are required')),
                                  );
                                  return;
                                }

                                setModalState(() => isSaving = true);

                                final res = await ApiService.addKeyPerson({
                                  'name': nameCtrl.text.trim(),
                                  'phone': phoneCtrl.text.trim(),
                                  'designation': desigCtrl.text.trim(),
                                  'village': villageCtrl.text.trim(),
                                  'mandal': mandalCtrl.text.trim(),
                                  'district': districtCtrl.text.trim(),
                                });

                                if (!modalCtx.mounted) return;
                                setModalState(() => isSaving = false);

                                if (res['success'] == true) {
                                  Navigator.pop(modalCtx);
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Key person added successfully! 🎉'), backgroundColor: Color(0xFF059669)),
                                  );
                                  _fetchKeyPersons();
                                } else {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    SnackBar(content: Text(res['error'] ?? 'Failed to add person')),
                                  );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: isSaving
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)))
                            : Text('Save Person', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
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
        title: Text(
          'Key Persons (${_filteredPersons.length})',
          style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF4F46E5)),
            onPressed: _fetchKeyPersons,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_alt_1_rounded),
        label: Text('Add Person', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        onPressed: _openAddPersonDialog,
      ),
      body: Column(
        children: [
          // Search box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              onChanged: _onSearch,
              style: GoogleFonts.inter(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search by name, phone, designation...',
                hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF6366F1)),
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
                    ? Center(child: Text(_error!))
                    : _filteredPersons.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.badge_outlined, size: 48, color: Color(0xFFCBD5E1)),
                                const SizedBox(height: 12),
                                Text('No key persons found.', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _fetchKeyPersons,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _filteredPersons.length,
                              separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final p = _filteredPersons[index];
                                final name = p['name'] ?? 'Person';
                                final phone = p['phone'] ?? '';
                                final desig = p['designation'] ?? '';
                                final village = ApiService.resolveConfig(p['village']);

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
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 22,
                                        backgroundColor: const Color(0xFF0D9488).withValues(alpha: 0.12),
                                        child: Text(
                                          name.isNotEmpty ? name[0].toUpperCase() : 'P',
                                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0D9488)),
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
                                              Text(
                                                desig,
                                                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF0D9488)),
                                              ),
                                            Row(
                                              children: [
                                                if (phone.isNotEmpty)
                                                  Text(phone, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                                                if (village.isNotEmpty) ...[
                                                  const SizedBox(width: 8),
                                                  Text('• $village', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                                                ],
                                              ],
                                            ),
                                          ],
                                        ),
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
