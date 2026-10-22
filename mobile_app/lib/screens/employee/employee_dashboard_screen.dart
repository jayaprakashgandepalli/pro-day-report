import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/api_service.dart';
import '../../services/offline_service.dart';
import '../login_screen.dart';
import 'add_student_screen.dart';
import 'students_list_screen.dart';
import 'village_visits_screen.dart';
import 'followups_screen.dart';
import 'tasks_screen.dart';
import 'telecaller_updates_screen.dart';
import 'key_persons_screen.dart';
import 'village_relatives_screen.dart';
import 'pdf_report_screen.dart';
import 'analytics_screen.dart';
import 'employee_profile_screen.dart';
import 'whatsapp_templates_screen.dart';

class EmployeeDashboardScreen extends StatefulWidget {
  final String employeeName;
  final String employeeId;

  const EmployeeDashboardScreen({
    super.key,
    required this.employeeName,
    required this.employeeId,
  });

  @override
  State<EmployeeDashboardScreen> createState() => _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState extends State<EmployeeDashboardScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _totalStudents = 0;
  int _pendingTasks = 0;
  int _pendingFollowups = 0;
  int _unreadUpdates = 0;
  int _starLeads = 0;
  int _relativesCount = 0;
  bool _isLoading = false;
  String _userRole = 'EMPLOYEE';
  String? _displayName;

  String get _currentEmployeeName {
    try {
      final name = _displayName;
      if (name != null && name.trim().isNotEmpty) {
        return name.trim();
      }
    } catch (_) {}
    return widget.employeeName;
  }

  // Breakdown of groups
  Map<String, int> _groupCounts = {
    'BIPC': 0,
    'MPC': 0,
    'Other Groups': 0,
    'Doorstep Pending': 0,
  };

  int _getCount(String key) {
    try {
      return _groupCounts[key] ?? 0;
    } catch (_) {
      return 0;
    }
  }

  @override
  void initState() {
    super.initState();
    _displayName = widget.employeeName;
    _groupCounts = {
      'BIPC': 0,
      'MPC': 0,
      'Other Groups': 0,
      'Doorstep Pending': 0,
    };
    _loadCachedStats();
    _fetchDashboardData();
  }

  Future<void> _loadCachedStats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final total = prefs.getInt('dash_total_${widget.employeeId}');
      final savedName = prefs.getString('user_name');
      if (total != null && mounted) {
        setState(() {
          _totalStudents = total;
          _pendingTasks = prefs.getInt('dash_tasks_${widget.employeeId}') ?? 0;
          _pendingFollowups = prefs.getInt('dash_followups_${widget.employeeId}') ?? 0;
          _unreadUpdates = prefs.getInt('dash_unread_${widget.employeeId}') ?? 0;
          _starLeads = prefs.getInt('dash_star_${widget.employeeId}') ?? 0;
          _relativesCount = prefs.getInt('dash_relatives_${widget.employeeId}') ?? 0;
          _groupCounts = {
            'BIPC': prefs.getInt('dash_grp_bipc_${widget.employeeId}') ?? 0,
            'MPC': prefs.getInt('dash_grp_mpc_${widget.employeeId}') ?? 0,
            'Other Groups': prefs.getInt('dash_grp_others_${widget.employeeId}') ?? 0,
            'Doorstep Pending': prefs.getInt('dash_grp_doorstep_${widget.employeeId}') ?? 0,
          };
          _isLoading = false;
          _userRole = prefs.getString('user_role') ?? 'EMPLOYEE';
          if (savedName != null && savedName.isNotEmpty) {
            _displayName = savedName;
          }
        });
      } else if (mounted) {
        setState(() {
          _userRole = prefs.getString('user_role') ?? 'EMPLOYEE';
          if (savedName != null && savedName.isNotEmpty) {
            _displayName = savedName;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _saveCachedStats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('dash_total_${widget.employeeId}', _totalStudents);
      await prefs.setInt('dash_tasks_${widget.employeeId}', _pendingTasks);
      await prefs.setInt('dash_followups_${widget.employeeId}', _pendingFollowups);
      await prefs.setInt('dash_unread_${widget.employeeId}', _unreadUpdates);
      await prefs.setInt('dash_star_${widget.employeeId}', _starLeads);
      await prefs.setInt('dash_relatives_${widget.employeeId}', _relativesCount);
      await prefs.setInt('dash_grp_bipc_${widget.employeeId}', _groupCounts['BIPC'] ?? 0);
      await prefs.setInt('dash_grp_mpc_${widget.employeeId}', _groupCounts['MPC'] ?? 0);
      await prefs.setInt('dash_grp_others_${widget.employeeId}', _groupCounts['Other Groups'] ?? 0);
      await prefs.setInt('dash_grp_doorstep_${widget.employeeId}', _groupCounts['Doorstep Pending'] ?? 0);
    } catch (_) {}
  }

  Future<void> _fetchDashboardData({bool forceRefresh = false}) async {
    if (_totalStudents == 0) {
      setState(() => _isLoading = true);
    }
    try {
      final configFuture = ApiService.getConfigMap();
      final results = await Future.wait([
        ApiService.getStudents(limit: 1000, minimal: false, forceRefresh: forceRefresh),
        ApiService.getTasks(forceRefresh: forceRefresh),
        ApiService.getFollowups('today', forceRefresh: forceRefresh),
        ApiService.getRelatives(forceRefresh: forceRefresh),
        ApiService.getTelecallerUpdates(limit: 10, forceRefresh: forceRefresh),
        configFuture,
      ]);

      if (!mounted) return;

      final studentsRes = results[0];
      final tasksRes = results[1];
      final followupsRes = results[2];
      final relativesRes = results[3];
      final updatesRes = results[4];

      int total = 0;
      int bipc = 0;
      int mpc = 0;
      int others = 0;
      int doorstepPending = 0;
      int starLeads = 0;

      if (studentsRes['success'] == true && studentsRes['students'] is List) {
        final list = studentsRes['students'] as List<dynamic>;
        final apiTotal = (studentsRes['total'] as num?)?.toInt();
        total = apiTotal ?? list.length;
        for (final s in list) {
          if (s is Map) {
            final group = (s['group'] ?? '').toString().toUpperCase();
            if (group.contains('BIPC')) {
              bipc++;
            } else if (group.contains('MPC')) {
              mpc++;
            } else {
              others++;
            }
            if (s['doorstepCompleted'] != true) {
              doorstepPending++;
            }
            final status = (s['leadStatus'] ?? '').toString().toLowerCase();
            if (status.contains('star') || status.contains('prime')) {
              starLeads++;
            }
          }
        }
      }

      int tasks = 0;
      if (tasksRes['success'] == true && tasksRes['stats'] is Map) {
        final stats = tasksRes['stats'] as Map<String, dynamic>;
        tasks = (stats['pending'] as num?)?.toInt() ?? 0;
      }

      int followups = 0;
      if (followupsRes['success'] == true && followupsRes['students'] is List) {
        final list = followupsRes['students'] as List<dynamic>;
        followups = list.length;
      }

      int relatives = 0;
      if (relativesRes['success'] == true && relativesRes['relatives'] is List) {
        relatives = (relativesRes['total'] as num?)?.toInt() ?? (relativesRes['relatives'] as List).length;
      }

      int unread = 0;
      if (updatesRes['success'] == true && updatesRes['updates'] is List) {
        unread = (updatesRes['updates'] as List).length;
      }

      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _totalStudents = total;
        _pendingTasks = tasks;
        _pendingFollowups = followups;
        _relativesCount = relatives;
        _unreadUpdates = unread;
        _starLeads = starLeads;
        _groupCounts = {
          'BIPC': bipc,
          'MPC': mpc,
          'Other Groups': others,
          'Doorstep Pending': doorstepPending,
        };
      });
      _saveCachedStats();

      // Sync employee profile from cloud (College Name, Phone, Name)
      ApiService.getEmployeeProfile(widget.employeeId).then((profile) async {
        if (profile != null) {
          final prefs = await SharedPreferences.getInstance();
          final c = profile['collegeName']?.toString().trim() ?? '';
          final p = profile['phone']?.toString().trim() ?? '';
          final n = profile['name']?.toString().trim() ?? '';
          if (c.isNotEmpty) await prefs.setString('employee_college', c);
          if (p.isNotEmpty) await prefs.setString('employee_phone', p);
          if (n.isNotEmpty) {
            await prefs.setString('user_name', n);
            if (mounted) setState(() => _displayName = n);
          }
        }
      }).catchError((_) {});
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Logout', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to log out from PRO Field Portal?', style: GoogleFonts.inter()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444), foregroundColor: Colors.white),
            onPressed: () async {
              await ApiService.logout();
              if (ctx.mounted) {
                Navigator.pop(ctx);
                Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
              }
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dayStr = now.day.toString().padLeft(2, '0');
    final monthStr = now.month.toString().padLeft(2, '0');
    final yearStr = now.year.toString();
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final weekdayStr = weekdays[(now.weekday - 1).clamp(0, 6)];

    return Scaffold(
      key: _scaffoldKey,
      drawer: _buildDrawer(context),
      backgroundColor: const Color(0xFFF8FAFC),
      body: RefreshIndicator(
        onRefresh: _fetchDashboardData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Curved Dark Blue Hero Header (Exact match to old UI)
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF312E81)],
                  ),
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(36)),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x330F172A),
                      blurRadius: 25,
                      offset: Offset(0, 10),
                    ),
                  ],
                ),
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Top Row: Menu, Refresh & Date Card
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Action Buttons (Left Menu & Live Refresh)
                            Row(
                              children: [
                                InkWell(
                                  onTap: () => _scaffoldKey.currentState?.openDrawer(),
                                  borderRadius: BorderRadius.circular(24),
                                  child: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.15),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                                    ),
                                    child: const Icon(Icons.menu_rounded, color: Colors.white, size: 22),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                InkWell(
                                  onTap: _fetchDashboardData,
                                  borderRadius: BorderRadius.circular(24),
                                  child: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.15),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                                    ),
                                    child: _isLoading
                                        ? const SizedBox(
                                            width: 22,
                                            height: 22,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                            ),
                                          )
                                        : const Icon(Icons.refresh_rounded, color: Colors.white, size: 22),
                                  ),
                                ),
                              ],
                            ),

                          // Date Card (Glassmorphism)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '$dayStr/$monthStr/$yearStr',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  weekdayStr,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFFCBD5E1),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Welcome Back Text in Cyan
                      Text(
                        'Welcome back,',
                        style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF38BDF8),
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Employee Name in White Bold
                      Text(
                        widget.employeeName,
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Employee ID
                      Text(
                        'Employee ID: ${widget.employeeId}',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF94A3B8),
                        ),
                      ),
                      if (OfflineService.pendingActionsCount > 0) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF59E0B)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.cloud_upload_outlined, size: 14, color: Color(0xFFFBBF24)),
                              const SizedBox(width: 6),
                              Text(
                                '${OfflineService.pendingActionsCount} items saved offline (syncs automatically)',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFFFBBF24),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // 2. 3x3 App Icons Grid (Exact match to old UI, tight compact spacing)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Column(
                children: [
                  // Row 1: My Tasks, Telecaller Updates, Add Student
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 1. My Tasks (Purple with red badge)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'My\nTasks',
                          gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4338CA)]),
                          icon: Icons.checklist_rounded,
                          iconColor: Colors.white,
                          badgeCount: _pendingTasks,
                          badgeColor: const Color(0xFFEF4444),
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen()));
                          },
                        ),
                      ),
                      const SizedBox(width: 12),

                      // 2. Telecaller Updates (Pink-Red with bell)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'Telecaller\nUpdates',
                          gradient: const LinearGradient(colors: [Color(0xFFF43F5E), Color(0xFFE11D48)]),
                          icon: Icons.notifications_rounded,
                          iconColor: Colors.white,
                          badgeCount: _unreadUpdates > 0 ? _unreadUpdates : null,
                          badgeColor: Colors.white,
                          badgeTextColor: const Color(0xFFE11D48),
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const TelecallerUpdatesScreen()));
                          },
                        ),
                      ),
                      const SizedBox(width: 12),

                      // 3. Add Student (Cyan-Blue with student)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'Add\nStudent',
                          gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF2563EB)]),
                          icon: Icons.school_rounded,
                          iconColor: Colors.white,
                          onTap: () async {
                            final added = await Navigator.push(context, MaterialPageRoute(builder: (_) => const AddStudentScreen()));
                            if (added == true) _fetchDashboardData();
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Row 2: All Students, Follow-ups, Village Visits
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 4. All Students (White with group icon)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'All\nStudents',
                          isWhite: true,
                          icon: Icons.groups_rounded,
                          iconColor: const Color(0xFF2563EB),
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentsListScreen()));
                          },
                        ),
                      ),
                      const SizedBox(width: 12),

                      // 5. Follow-ups (White with calendar icon)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'Follow-ups',
                          isWhite: true,
                          icon: Icons.calendar_month_rounded,
                          iconColor: const Color(0xFF0284C7),
                          badgeCount: _pendingFollowups > 0 ? _pendingFollowups : null,
                          badgeColor: const Color(0xFFEF4444),
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const FollowupsScreen()));
                          },
                        ),
                      ),
                      const SizedBox(width: 12),

                      // 6. Village Visits (White with red house icon)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'Village\nVisits',
                          isWhite: true,
                          icon: Icons.home_work_rounded,
                          iconColor: const Color(0xFFEF4444),
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const VillageVisitsScreen()));
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Row 3: Village Relatives, Star Leads, Gen PDF
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 7. Village Relatives (Cyan-Blue with heart handshake)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'Village\nRelatives',
                          gradient: const LinearGradient(colors: [Color(0xFF0284C7), Color(0xFF0369A1)]),
                          icon: Icons.handshake_rounded,
                          iconColor: Colors.white,
                          badgeCount: _relativesCount,
                          badgeColor: Colors.white,
                          badgeTextColor: const Color(0xFF0369A1),
                          onTap: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const VillageRelativesScreen()),
                            );
                            _fetchDashboardData(forceRefresh: true);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),

                      // 8. Star Leads (Orange with star)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'Star\nLeads',
                          gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]),
                          icon: Icons.star_rounded,
                          iconColor: Colors.white,
                          badgeCount: _starLeads,
                          badgeColor: Colors.white,
                          badgeTextColor: const Color(0xFFD97706),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const StudentsListScreen(isStarLeads: true)),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 12),

                      // 9. Gen PDF (White with document icon)
                      Expanded(
                        child: _buildSquircleAction(
                          label: 'Gen\nPDF',
                          isWhite: true,
                          icon: Icons.picture_as_pdf_rounded,
                          iconColor: const Color(0xFF38BDF8),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const PdfReportScreen()),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // 3. Overall Statistics Section (Exact match to old UI)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Overall Statistics',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Real-time enrollment metrics',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      // Pill badge with total
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '$_totalStudents Total',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF059669),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Statistics Group Rows Card
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
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
                      children: [
                        _buildGroupRow(
                          abbr: 'BI',
                          title: 'BIPC',
                          subtitle: 'Biology & Physical Science',
                          count: _getCount('BIPC'),
                          circleBg: const Color(0xFFEFF6FF),
                          circleColor: const Color(0xFF3B82F6),
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildGroupRow(
                          abbr: 'MP',
                          title: 'MPC',
                          subtitle: 'Mathematics, Physics, Chemistry',
                          count: _getCount('MPC'),
                          circleBg: const Color(0xFFFFFBEB),
                          circleColor: const Color(0xFFD97706),
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildGroupRow(
                          abbr: 'OT',
                          title: 'OTHER GROUPS',
                          subtitle: 'CEC, HEC & Miscellaneous groups',
                          count: _getCount('Other Groups'),
                          circleBg: const Color(0xFFF1F5F9),
                          circleColor: const Color(0xFF475569),
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildGroupRow(
                          abbr: 'DP',
                          title: 'DOORSTEP PENDING',
                          subtitle: 'Action required',
                          count: _getCount('Doorstep Pending'),
                          circleBg: const Color(0xFFFFF1F2),
                          circleColor: const Color(0xFFE11D48),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
  }

  Widget _buildSquircleAction({
    required String label,
    LinearGradient? gradient,
    bool isWhite = false,
    required IconData icon,
    required Color iconColor,
    int? badgeCount,
    Color badgeColor = const Color(0xFFEF4444),
    Color badgeTextColor = Colors.white,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Squircle Box
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 66,
                height: 66,
                decoration: BoxDecoration(
                  gradient: gradient,
                  color: isWhite ? Colors.white : null,
                  borderRadius: BorderRadius.circular(22),
                  border: isWhite ? Border.all(color: const Color(0xFFE2E8F0)) : null,
                  boxShadow: [
                    BoxShadow(
                      color: isWhite ? Colors.black.withValues(alpha: 0.05) : (gradient?.colors.first ?? Colors.black).withValues(alpha: 0.28),
                      blurRadius: 12,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Center(
                  child: Icon(icon, color: iconColor, size: 32),
                ),
              ),

              // Notification Badge
              if (badgeCount != null)
                Positioned(
                  top: -4,
                  right: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: badgeColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
                    child: Center(
                      child: Text(
                        badgeCount.toString(),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: badgeTextColor,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),

          // Label
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF334155),
              height: 1.15,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroupRow({
    required String abbr,
    required String title,
    required String subtitle,
    required int count,
    required Color circleBg,
    required Color circleColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: circleBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: circleColor.withValues(alpha: 0.3)),
                ),
                child: Center(
                  child: Text(
                    abbr,
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: circleColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Count Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: circleBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              count.toString(),
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: circleColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    final initial = widget.employeeName.isNotEmpty ? widget.employeeName[0].toUpperCase() : 'N';

    return Drawer(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // 1. Header matching web mobile menu (/more)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF475569), size: 22),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text(
                    'Menu',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: Color(0xFF1E293B),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        initial,
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),

            // 2. Main Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // User Profile Box (Tappable to open Profile page)
                  InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () async {
                      Navigator.pop(context);
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => EmployeeProfileScreen(
                            employeeId: widget.employeeId,
                            employeeName: _currentEmployeeName,
                            employeeRole: _userRole,
                          ),
                        ),
                      );
                      _loadCachedStats();
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFEFF),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFCFFAFE)),
                            ),
                            child: const Icon(
                              Icons.person_outline_rounded,
                              size: 28,
                              color: Color(0xFF0D9488),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _currentEmployeeName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'ID: ${widget.employeeId}',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Text(
                                    _userRole.toUpperCase(),
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF475569),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 14,
                            color: Color(0xFF94A3B8),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Menu Items Section (Exact match to /more options)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        _buildMobileMenuItem(
                          icon: Icons.badge_outlined,
                          iconColor: const Color(0xFF4F46E5),
                          title: 'Employee Profile',
                          onTap: () async {
                            Navigator.pop(context);
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => EmployeeProfileScreen(
                                  employeeId: widget.employeeId,
                                  employeeName: _currentEmployeeName,
                                  employeeRole: _userRole,
                                ),
                              ),
                            );
                            _loadCachedStats();
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMobileMenuItem(
                          icon: Icons.info_outline_rounded,
                          iconColor: const Color(0xFF64748B),
                          title: 'About App',
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                title: Row(
                                  children: [
                                    const Icon(Icons.info_outline_rounded, color: Color(0xFF6366F1), size: 22),
                                    const SizedBox(width: 8),
                                    Text('About App', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                                  ],
                                ),
                                content: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('App Version 1.0.4', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                                    const SizedBox(height: 4),
                                    Text('Field Portal • Sri Vaatsalya Educational Society', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 13)),
                                  ],
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx),
                                    child: const Text('OK'),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMobileMenuItem(
                          icon: Icons.handshake_rounded,
                          iconColor: const Color(0xFF0284C7),
                          title: 'Village Relatives (గ్రామ బంధువులు)',
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const VillageRelativesScreen()));
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMobileMenuItem(
                          icon: Icons.school_rounded,
                          iconColor: const Color(0xFFD97706),
                          title: 'School Key Persons (Non-HM Staff)',
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const KeyPersonsScreen()));
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMobileMenuItem(
                          icon: Icons.chat_bubble_outline_rounded,
                          iconColor: const Color(0xFF16A34A),
                          title: 'WhatsApp Templates & Pamphlet',
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => WhatsAppTemplatesScreen(
                                  employeeName: _currentEmployeeName,
                                  employeePhone: widget.employeeId,
                                ),
                              ),
                            );
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMobileMenuItem(
                          icon: Icons.bar_chart_rounded,
                          iconColor: const Color(0xFF0D9488),
                          title: 'Analytics',
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen()));
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMobileMenuItem(
                          icon: Icons.logout_rounded,
                          iconColor: const Color(0xFFEF4444),
                          title: 'Log Out',
                          titleColor: const Color(0xFFEF4444),
                          chevronColor: const Color(0xFFFCA5A5),
                          onTap: () {
                            Navigator.pop(context);
                            _confirmLogout(context);
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // 3. Footer matching web /more page ("v1.0.4 - Field Portal")
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'v1.0.4 - Field Portal',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF94A3B8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileMenuItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    required VoidCallback onTap,
    Color? titleColor,
    Color? chevronColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: iconColor),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: titleColor != null ? FontWeight.w700 : FontWeight.w500,
                  color: titleColor ?? const Color(0xFF334155),
                ),
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: chevronColor ?? const Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }
}


