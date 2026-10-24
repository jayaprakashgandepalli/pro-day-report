import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../services/remarks_preset_service.dart';

class FollowupsScreen extends StatefulWidget {
  const FollowupsScreen({super.key});

  @override
  State<FollowupsScreen> createState() => _FollowupsScreenState();
}

class _FollowupsScreenState extends State<FollowupsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<String> _tabs = ['today', 'action', 'upcoming'];

  List<dynamic> _students = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _fetchFollowups(_tabs[_tabController.index]);
      }
    });
    _fetchFollowups('today');
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchFollowups(String tab, {bool forceRefresh = false}) async {
    if (_students.isEmpty) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    final res = await ApiService.getFollowups(tab, forceRefresh: forceRefresh);

    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _students = res['students'] as List<dynamic>? ?? [];
        _isLoading = false;
      });
    } else {
      setState(() {
        if (_students.isEmpty) _error = res['error'] ?? 'Failed to load follow-ups';
        _isLoading = false;
      });
    }
  }

  void _openUpdateModal(Map<String, dynamic> student) async {
    final studentId = student['id'].toString();
    final studentName = student['studentName'] ?? 'Student';
    final remarksController = TextEditingController();
    String followUpType = 'Date';
    DateTime? nextDate = DateTime.now().add(const Duration(days: 3));
    bool isSaving = false;

    List<String> presets = await RemarksPresetService.getPresets();
    if (!mounted) return;

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
                        Text(
                          'Update Follow-up: $studentName',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                    const Divider(height: 20),

                    // Remarks Header with Quick Tag & Clear
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Follow-up Remarks *',
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEEF2FF),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFC7D2FE)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.bolt_rounded, size: 12, color: Color(0xFF4F46E5)),
                                  const SizedBox(width: 2),
                                  Text(
                                    'Quick 1-Tap',
                                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF4F46E5)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (remarksController.text.trim().isNotEmpty)
                          InkWell(
                            onTap: () {
                              setModalState(() {
                                remarksController.clear();
                              });
                            },
                            borderRadius: BorderRadius.circular(4),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.clear_rounded, size: 12, color: Color(0xFFEF4444)),
                                  const SizedBox(width: 2),
                                  Text(
                                    'Clear',
                                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFFEF4444)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Sleek Horizontal Presets Slider
                    SizedBox(
                      height: 34,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        itemCount: presets.length,
                        separatorBuilder: (ctx, i) => const SizedBox(width: 6),
                        itemBuilder: (context, idx) {
                          final preset = presets[idx];
                          final isIncluded = remarksController.text.contains(preset);

                          return FilterChip(
                            selected: isIncluded,
                            showCheckmark: false,
                            avatar: Icon(
                              isIncluded ? Icons.check_circle_rounded : Icons.add_rounded,
                              size: 13,
                              color: isIncluded ? const Color(0xFF4F46E5) : const Color(0xFF64748B),
                            ),
                            label: Text(
                              preset,
                              style: GoogleFonts.inter(
                                fontSize: 11.5,
                                fontWeight: isIncluded ? FontWeight.w700 : FontWeight.w500,
                                color: isIncluded ? const Color(0xFF4F46E5) : const Color(0xFF334155),
                              ),
                            ),
                            backgroundColor: const Color(0xFFF8FAFC),
                            selectedColor: const Color(0xFFEEF2FF),
                            side: BorderSide(
                              color: isIncluded ? const Color(0xFF818CF8) : const Color(0xFFE2E8F0),
                              width: isIncluded ? 1.3 : 1,
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            visualDensity: VisualDensity.compact,
                            onSelected: (selected) {
                              setModalState(() {
                                if (selected) {
                                  final current = remarksController.text.trim();
                                  if (current.isEmpty) {
                                    remarksController.text = preset;
                                  } else if (!current.contains(preset)) {
                                    final sep = current.endsWith('.') || current.endsWith(',') ? ' ' : '. ';
                                    remarksController.text = '$current$sep$preset';
                                  }
                                } else {
                                  String current = remarksController.text;
                                  current = current.replaceAll('$preset. ', '');
                                  current = current.replaceAll('. $preset', '');
                                  current = current.replaceAll(preset, '');
                                  remarksController.text = current.trim();
                                }
                              });
                            },
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 8),

                    TextField(
                      controller: remarksController,
                      maxLines: 3,
                      onChanged: (_) => setModalState(() {}),
                      decoration: InputDecoration(
                        hintText: 'Spoke over phone / visited student...',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Text(
                      'Next Action Type',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: followUpType,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Date', child: Text('Specific Date')),
                        DropdownMenuItem(value: 'After Exams', child: Text('After Exams')),
                        DropdownMenuItem(value: 'After Results', child: Text('After Results')),
                      ],
                      onChanged: (val) {
                        if (val != null) setModalState(() => followUpType = val);
                      },
                    ),

                    if (followUpType == 'Date') ...[
                      const SizedBox(height: 16),
                      Text(
                        'Next Follow-Up Date',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 6),
                      ListTile(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE2E8F0))),
                        tileColor: const Color(0xFFF8FAFC),
                        leading: const Icon(Icons.calendar_month_rounded, color: Color(0xFF4F46E5)),
                        title: Text(
                          nextDate != null
                              ? '${nextDate!.year}-${nextDate!.month.toString().padLeft(2, '0')}-${nextDate!.day.toString().padLeft(2, '0')}'
                              : 'Select Date',
                          style: GoogleFonts.inter(fontSize: 14),
                        ),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: modalCtx,
                            initialDate: nextDate ?? DateTime.now().add(const Duration(days: 3)),
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (picked != null) {
                            setModalState(() => nextDate = picked);
                          }
                        },
                      ),
                    ],
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isSaving
                            ? null
                            : () async {
                                if (remarksController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    const SnackBar(content: Text('Please enter remarks')),
                                  );
                                  return;
                                }

                                setModalState(() => isSaving = true);

                                final nextDateStr = nextDate != null
                                    ? '${nextDate!.year}-${nextDate!.month.toString().padLeft(2, '0')}-${nextDate!.day.toString().padLeft(2, '0')}'
                                    : null;

                                final res = await ApiService.recordVisit(
                                  studentId: studentId,
                                  remarks: remarksController.text.trim(),
                                  visitDate: DateTime.now().toIso8601String(),
                                  nextFollowUpType: followUpType,
                                  nextFollowUpDate: followUpType == 'Date' ? nextDateStr : null,
                                  leadStatus: 'Following Up',
                                );

                                if (!modalCtx.mounted) return;
                                setModalState(() => isSaving = false);

                                if (res['success'] == true) {
                                  Navigator.pop(modalCtx);
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Follow-up updated successfully! 🎉'),
                                      backgroundColor: Color(0xFF059669),
                                    ),
                                  );
                                  _fetchFollowups(_tabs[_tabController.index]);
                                } else {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    SnackBar(content: Text(res['error'] ?? 'Failed to update follow-up')),
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
                            : Text('Update Follow-up', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
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
          'Pending Follow-ups',
          style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontWeight: FontWeight.w700, fontSize: 18),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF4F46E5),
          labelColor: const Color(0xFF4F46E5),
          unselectedLabelColor: const Color(0xFF64748B),
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
          tabs: const [
            Tab(text: 'Due Today'),
            Tab(text: 'Action Needed'),
            Tab(text: 'Upcoming'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _students.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.phone_callback_rounded, size: 48, color: Color(0xFFCBD5E1)),
                          const SizedBox(height: 12),
                          Text('No follow-ups in this section! 🎉', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () => _fetchFollowups(_tabs[_tabController.index], forceRefresh: true),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _students.length,
                        separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final s = _students[index];
                          final name = s['studentName'] ?? 'Student';
                          final phone = s['phone'] ?? '';
                          final group = s['group'] ?? '';
                          final school = s['schoolName'] ?? '';
                          final nextDate = s['nextFollowUpDate'] ?? '';
                          final followType = s['nextFollowUpType'] ?? '';
                          final remarks = s['remarks'] ?? '';

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
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        name,
                                        style: GoogleFonts.outfit(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF0F172A),
                                        ),
                                      ),
                                    ),
                                    if (group.isNotEmpty)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF4F46E5).withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          group,
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF4F46E5),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.phone_rounded, size: 14, color: Color(0xFF64748B)),
                                    const SizedBox(width: 4),
                                    Text(phone, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                                    if (school.isNotEmpty) ...[
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          '•  $school',
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                if (nextDate.isNotEmpty || followType.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEF3C7),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFFD97706)),
                                        const SizedBox(width: 6),
                                        Text(
                                          nextDate.isNotEmpty ? 'Due Date: $nextDate' : 'Type: $followType',
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: const Color(0xFFB45309),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                                if (remarks.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    'Previous remarks: $remarks',
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.inter(fontSize: 12, fontStyle: FontStyle.italic, color: const Color(0xFF64748B)),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: () => _openUpdateModal(s),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF4F46E5),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                    icon: const Icon(Icons.edit_calendar_rounded, size: 16),
                                    label: Text(
                                      'Update Follow-up',
                                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
