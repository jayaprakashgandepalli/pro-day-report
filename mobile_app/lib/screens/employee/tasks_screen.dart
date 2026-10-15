import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<dynamic> _tasks = [];
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;
  String? _error;
  String _selectedStatus = 'ALL'; // ALL, PENDING, IN_PROGRESS, COMPLETED, OVERDUE

  @override
  void initState() {
    super.initState();
    _fetchTasks();
  }

  Future<void> _fetchTasks({bool forceRefresh = false}) async {
    if (_tasks.isEmpty) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    final res = await ApiService.getTasks(status: _selectedStatus, forceRefresh: forceRefresh);

    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _tasks = res['tasks'] as List<dynamic>? ?? [];
        _stats = res['stats'] as Map<String, dynamic>? ?? {};
        _isLoading = false;
      });
    } else {
      setState(() {
        if (_tasks.isEmpty) _error = res['error'] ?? 'Failed to load tasks';
        _isLoading = false;
      });
    }
  }

  void _openCreateTaskDialog() {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    String category = 'COLLEGE_DUTY';
    String priority = 'MEDIUM';
    DateTime endDate = DateTime.now().add(const Duration(days: 1));
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
                        Text('Create New Task', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                        IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(modalCtx)),
                      ],
                    ),
                    const Divider(height: 20),

                    Text('Work Title *', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: titleController,
                      decoration: InputDecoration(
                        hintText: 'e.g. Visit ZPHS High School for admissions',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      ),
                    ),
                    const SizedBox(height: 14),

                    Text('Category', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: category,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'COLLEGE_DUTY', child: Text('🏛️ General College Duty')),
                        DropdownMenuItem(value: 'SCHOOL_VISIT', child: Text('🏫 School Visit')),
                        DropdownMenuItem(value: 'STUDENT_FOLLOWUP', child: Text('📞 Student Follow-up')),
                        DropdownMenuItem(value: 'DOCUMENT_VERIFICATION', child: Text('📄 Document Verification')),
                        DropdownMenuItem(value: 'OFFICE_WORK', child: Text('🏢 Office Work')),
                        DropdownMenuItem(value: 'CAMPAIGN_EVENT', child: Text('📢 Campaign & Event')),
                        DropdownMenuItem(value: 'OTHER', child: Text('📌 Other Task')),
                      ],
                      onChanged: (val) {
                        if (val != null) setModalState(() => category = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Priority', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                initialValue: priority,
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: const Color(0xFFF8FAFC),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                ),
                                items: const [
                                  DropdownMenuItem(value: 'LOW', child: Text('🟢 Low')),
                                  DropdownMenuItem(value: 'MEDIUM', child: Text('🟡 Medium')),
                                  DropdownMenuItem(value: 'HIGH', child: Text('🟠 High')),
                                  DropdownMenuItem(value: 'URGENT', child: Text('🔴 Urgent')),
                                ],
                                onChanged: (val) {
                                  if (val != null) setModalState(() => priority = val);
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Deadline', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              ListTile(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE2E8F0))),
                                tileColor: const Color(0xFFF8FAFC),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10),
                                title: Text(
                                  '${endDate.year}-${endDate.month.toString().padLeft(2, '0')}-${endDate.day.toString().padLeft(2, '0')}',
                                  style: GoogleFonts.inter(fontSize: 13),
                                ),
                                trailing: const Icon(Icons.calendar_today_rounded, size: 16, color: Color(0xFF4F46E5)),
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: modalCtx,
                                    initialDate: endDate,
                                    firstDate: DateTime.now(),
                                    lastDate: DateTime.now().add(const Duration(days: 365)),
                                  );
                                  if (picked != null) setModalState(() => endDate = picked);
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    Text('Description / Notes', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: descController,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'Additional details about this task...',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      ),
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isSaving
                            ? null
                            : () async {
                                if (titleController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    const SnackBar(content: Text('Please enter task title')),
                                  );
                                  return;
                                }

                                setModalState(() => isSaving = true);

                                final res = await ApiService.createTask({
                                  'title': titleController.text.trim(),
                                  'description': descController.text.trim(),
                                  'category': category,
                                  'priority': priority,
                                  'startDate': DateTime.now().toIso8601String(),
                                  'endDate': endDate.toIso8601String(),
                                });

                                if (!modalCtx.mounted) return;
                                setModalState(() => isSaving = false);

                                if (res['success'] == true) {
                                  Navigator.pop(modalCtx);
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Task created successfully! 🎉'), backgroundColor: Color(0xFF059669)),
                                  );
                                  _fetchTasks();
                                } else {
                                  ScaffoldMessenger.of(modalCtx).showSnackBar(
                                    SnackBar(content: Text(res['error'] ?? 'Failed to create task')),
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
                            : Text('Save Task', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
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

  void _markTaskCompleted(String taskId, String title) {
    final notesController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Complete Task', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mark "$title" as completed?', style: GoogleFonts.inter(fontSize: 14)),
            const SizedBox(height: 12),
            TextField(
              controller: notesController,
              decoration: InputDecoration(
                hintText: 'Completion notes / remarks (optional)',
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              final res = await ApiService.updateTaskStatus(taskId, 'COMPLETED', notes: notesController.text.trim());
              if (!mounted) return;
              if (res['success'] == true) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Task marked as Completed! ✓'), backgroundColor: Color(0xFF059669)),
                );
                _fetchTasks();
              }
            },
            child: const Text('Mark Completed'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _stats['pending'] ?? 0;
    final inProgressCount = _stats['inProgress'] ?? 0;
    final completedCount = _stats['completed'] ?? 0;
    final overdueCount = _stats['overdue'] ?? 0;

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
          'My Tasks',
          style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF4F46E5)),
            onPressed: _fetchTasks,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_task_rounded),
        label: Text('New Task', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        onPressed: _openCreateTaskDialog,
      ),
      body: Column(
        children: [
          // Stats Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('Pending', pendingCount.toString(), const Color(0xFFF59E0B)),
                _buildStatItem('In Progress', inProgressCount.toString(), const Color(0xFF3B82F6)),
                _buildStatItem('Completed', completedCount.toString(), const Color(0xFF10B981)),
                _buildStatItem('Overdue', overdueCount.toString(), const Color(0xFFEF4444)),
              ],
            ),
          ),

          // Filter Chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFFF8FAFC),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('All Tasks', 'ALL'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Pending', 'PENDING'),
                  const SizedBox(width: 8),
                  _buildFilterChip('In Progress', 'IN_PROGRESS'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Completed', 'COMPLETED'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Overdue', 'OVERDUE'),
                ],
              ),
            ),
          ),

          // Tasks List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : _tasks.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.task_alt_rounded, size: 48, color: Color(0xFFCBD5E1)),
                                const SizedBox(height: 12),
                                Text('No tasks found.', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _fetchTasks,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _tasks.length,
                              separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final t = _tasks[index];
                                final id = t['id'].toString();
                                final title = t['title'] ?? 'Task';
                                final desc = t['description'] ?? '';
                                final status = t['status'] ?? 'PENDING';
                                final priority = t['priority'] ?? 'MEDIUM';
                                final category = t['category'] ?? 'COLLEGE_DUTY';
                                final endDate = (t['endDate'] ?? '').toString().split('T')[0];
                                final isCompleted = status == 'COMPLETED';

                                return Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isCompleted ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
                                      width: isCompleted ? 1.5 : 1,
                                    ),
                                    boxShadow: [
                                      BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2)),
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
                                              title,
                                              style: GoogleFonts.outfit(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w700,
                                                decoration: isCompleted ? TextDecoration.lineThrough : null,
                                                color: isCompleted ? const Color(0xFF64748B) : const Color(0xFF0F172A),
                                              ),
                                            ),
                                          ),
                                          _buildPriorityBadge(priority),
                                        ],
                                      ),
                                      if (desc.isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(desc, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                                      ],
                                      const SizedBox(height: 10),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              const Icon(Icons.event_rounded, size: 14, color: Color(0xFF94A3B8)),
                                              const SizedBox(width: 4),
                                              Text('Due: $endDate', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                                            ],
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF1F5F9),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              category.replaceAll('_', ' '),
                                              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (!isCompleted) ...[
                                        const SizedBox(height: 12),
                                        SizedBox(
                                          width: double.infinity,
                                          child: OutlinedButton.icon(
                                            onPressed: () => _markTaskCompleted(id, title),
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: const Color(0xFF059669),
                                              side: const BorderSide(color: Color(0xFF059669)),
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                            ),
                                            icon: const Icon(Icons.check_circle_outline_rounded, size: 16),
                                            label: Text('Mark as Completed', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
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

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedStatus == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        setState(() => _selectedStatus = value);
        _fetchTasks();
      },
      selectedColor: const Color(0xFF4F46E5),
      labelStyle: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        color: isSelected ? Colors.white : const Color(0xFF475569),
      ),
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: isSelected ? const Color(0xFF4F46E5) : const Color(0xFFE2E8F0)),
      ),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    Color bg;
    Color fg;
    switch (priority) {
      case 'URGENT':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFDC2626);
        break;
      case 'HIGH':
        bg = const Color(0xFFFFEDD5);
        fg = const Color(0xFFC2410C);
        break;
      case 'LOW':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF15803D);
        break;
      default:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFB45309);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(priority, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
    );
  }
}
