import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  List<dynamic> _mandalsSummary = [];
  bool _isLoading = true;
  String? _error;

  // Dropdown filter: '' means -- All Mandals --
  String _dropdownMandalId = '';

  // Selected Mandal for drill-down schools view (null when on overview list)
  Map<String, dynamic>? _selectedMandal;
  List<dynamic> _schoolReports = [];
  bool _isLoadingSchools = false;
  String? _schoolError;
  String _schoolSearchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchSummary();
  }

  Future<void> _fetchSummary() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final res = await ApiService.getMandalsSummary();
    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _mandalsSummary = (res['summaries'] as List<dynamic>?) ?? [];
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = res['error'] ?? 'Failed to load analytics data';
        _isLoading = false;
      });
    }
  }

  Future<void> _drillDownMandal(Map<String, dynamic> mandal) async {
    final mandalId = mandal['mandalId']?.toString() ?? '';
    setState(() {
      _selectedMandal = mandal;
      _isLoadingSchools = true;
      _schoolError = null;
      _schoolReports = [];
      _schoolSearchQuery = '';
    });

    final res = await ApiService.getSchoolsProgress(mandalId);
    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _schoolReports = (res['report'] as List<dynamic>?) ?? [];
        _isLoadingSchools = false;
      });
    } else {
      setState(() {
        _schoolError = res['error'] ?? 'Failed to load schools for ${mandal['mandalName']}';
        _isLoadingSchools = false;
      });
    }
  }

  void _backToMandals() {
    setState(() {
      _selectedMandal = null;
      _schoolReports = [];
      _schoolError = null;
      _schoolSearchQuery = '';
    });
  }

  Color _getPercentageColor(num pct) {
    if (pct > 80) return const Color(0xFF10B981); // Green
    if (pct > 30) return const Color(0xFF3B82F6); // Blue
    return const Color(0xFFEF4444); // Red
  }

  // Calculate stats for visible mandals
  Map<String, int> _calculateOverallStats(List<dynamic> mandals) {
    int totalSchools = 0;
    int totalTarget = 0;
    int totalCollected = 0;

    for (final m in mandals) {
      totalSchools += ((m['totalSchools'] as num?) ?? 0).toInt();
      totalTarget += ((m['totalTarget'] as num?) ?? 0).toInt();
      totalCollected += ((m['totalCollected'] as num?) ?? 0).toInt();
    }
    final int totalRemaining = (totalTarget - totalCollected) > 0 ? (totalTarget - totalCollected) : 0;
    return {
      'totalSchools': totalSchools,
      'totalTarget': totalTarget,
      'totalCollected': totalCollected,
      'totalRemaining': totalRemaining,
    };
  }

  // Calculate stats for drilled-down schools
  Map<String, int> _calculateMandalSchoolsStats(List<dynamic> schools) {
    final totalSchools = schools.length;
    int totalTarget = 0;
    int totalCollected = 0;

    for (final s in schools) {
      totalTarget += ((s['target'] as num?) ?? 0).toInt();
      totalCollected += ((s['collected'] as num?) ?? 0).toInt();
    }
    final int totalRemaining = (totalTarget - totalCollected) > 0 ? (totalTarget - totalCollected) : 0;
    return {
      'totalSchools': totalSchools,
      'totalTarget': totalTarget,
      'totalCollected': totalCollected,
      'totalRemaining': totalRemaining,
    };
  }

  @override
  Widget build(BuildContext context) {
    final isDrillDown = _selectedMandal != null;

    return PopScope(
      canPop: !isDrillDown,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (isDrillDown) {
          _backToMandals();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
            onPressed: () {
              if (isDrillDown) {
                _backToMandals();
              } else {
                Navigator.pop(context);
              }
            },
          ),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isDrillDown ? (_selectedMandal!['mandalName']?.toString() ?? 'Mandal Schools') : 'Performance Analytics',
                style: GoogleFonts.outfit(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                ),
              ),
              Text(
                isDrillDown ? 'School level admissions breakdown' : 'School admissions & target progress',
                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
              ),
            ],
          ),
          actions: [
            if (!isDrillDown && _mandalsSummary.isNotEmpty)
              IconButton(
                icon: const Icon(Icons.assessment_outlined, color: Color(0xFF0F2B47)),
                tooltip: 'Summary Report',
                onPressed: _showMandalSummarySheet,
              ),
            if (isDrillDown && _schoolReports.isNotEmpty)
              IconButton(
                icon: const Icon(Icons.share_outlined, color: Color(0xFF3B82F6)),
                tooltip: 'Share Mandal Report',
                onPressed: _showSpecificMandalReportSheet,
              ),
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Color(0xFF4F46E5)),
              tooltip: 'Refresh',
              onPressed: isDrillDown ? () => _drillDownMandal(_selectedMandal!) : _fetchSummary,
            ),
          ],
        ),
        body: _isLoading
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
                          ElevatedButton(onPressed: _fetchSummary, child: const Text('Try Again')),
                        ],
                      ),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: isDrillDown ? () => _drillDownMandal(_selectedMandal!) : _fetchSummary,
                    child: isDrillDown ? _buildDrillDownView() : _buildOverviewView(),
                  ),
      ),
    );
  }

  // -------------------------------------------------------------
  // OVERVIEW VIEW (Matching web app's analytics/page.tsx)
  // -------------------------------------------------------------
  Widget _buildOverviewView() {
    final visibleMandals = _dropdownMandalId.isNotEmpty
        ? _mandalsSummary.where((m) => (m['mandalId']?.toString() ?? '') == _dropdownMandalId).toList()
        : _mandalsSummary;

    final overallStats = _calculateOverallStats(visibleMandals);
    final totalTarget = overallStats['totalTarget'] ?? 0;
    final totalCollected = overallStats['totalCollected'] ?? 0;
    final int overallPct = totalTarget > 0 ? ((totalCollected / totalTarget) * 100).round() : 0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Top Overview Header with Export Button
        Padding(
          padding: const EdgeInsets.only(bottom: 8, left: 2, right: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Overview Progress Summary',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
              ),
              InkWell(
                onTap: _showMandalSummarySheet,
                borderRadius: BorderRadius.circular(6),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F2B47),
                    borderRadius: BorderRadius.circular(6),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF0F2B47).withValues(alpha: 0.15), blurRadius: 4, offset: const Offset(0, 1)),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.description_outlined, color: Colors.white, size: 13),
                      const SizedBox(width: 4),
                      Text(
                        'Export Summary',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // 4 KPI Summary Cards Row
        _buildStatsRow(overallStats),

        // Overall Target Completion Progress Card
        Container(
          margin: const EdgeInsets.only(top: 6, bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Overall Target Completion',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF94A3B8),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$overallPct%',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF38BDF8),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: (overallPct / 100.0).clamp(0.0, 1.0),
                  minHeight: 8,
                  backgroundColor: Colors.white.withValues(alpha: 0.15),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                ),
              ),
            ],
          ),
        ),

        // "Select Mandal for Analytics" Dropdown Card (As in web app lines 403-417)
        Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select Mandal for Analytics',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF4F46E5),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF6366F1)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: _dropdownMandalId,
                    icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF4F46E5)),
                    style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF0F172A), fontWeight: FontWeight.w600),
                    items: [
                      const DropdownMenuItem<String>(
                        value: '',
                        child: Text('-- All Mandals --'),
                      ),
                      ..._mandalsSummary.map((m) {
                        final id = m['mandalId']?.toString() ?? '';
                        final name = m['mandalName']?.toString() ?? 'Mandal';
                        return DropdownMenuItem<String>(
                          value: id,
                          child: Text(name),
                        );
                      }),
                    ],
                    onChanged: (val) {
                      setState(() {
                        _dropdownMandalId = val ?? '';
                      });
                    },
                  ),
                ),
              ),
            ],
          ),
        ),

        // Section Title: Mandal Overview
        Row(
          children: [
            const Icon(Icons.trending_up_rounded, color: Color(0xFF4F46E5), size: 20),
            const SizedBox(width: 6),
            Text(
              'Mandal Overview',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Tap on any mandal to view schools and target progress',
          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 12),

        // Visible Mandals Cards
        if (visibleMandals.isEmpty)
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Center(
              child: Text(
                'No mandals match the selected filter.',
                style: GoogleFonts.inter(color: const Color(0xFF64748B)),
              ),
            ),
          )
        else
          ...visibleMandals.map((m) => _buildMandalCard(m)),
      ],
    );
  }

  // -------------------------------------------------------------
  // MANDAL CARD (Matching web app's style with 5px colored border,
  // 2x2 grid with Grade breakdown pills, & Tap to view schools)
  // -------------------------------------------------------------
  Widget _buildMandalCard(dynamic mandalRaw) {
    final mandal = mandalRaw is Map ? mandalRaw : <String, dynamic>{};
    final name = mandal['mandalName']?.toString() ?? 'Mandal';
    final schoolsCount = mandal['totalSchools'] ?? 0;
    final target = mandal['totalTarget'] ?? 0;
    final collected = mandal['totalCollected'] ?? 0;
    final pct = (mandal['percentage'] as num?)?.toInt() ?? 0;
    final rawGradeCounts = mandal['gradeCounts'];
    final Map<String, dynamic> gradeCounts = rawGradeCounts is Map
        ? Map<String, dynamic>.from(rawGradeCounts)
        : <String, dynamic>{};

    final Color barColor = _getPercentageColor(pct);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 5px colored left accent strip
              Container(
                width: 5,
                color: barColor,
              ),
              Expanded(
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _drillDownMandal(Map<String, dynamic>.from(mandal)),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header: Mandal Name & Percentage Pill
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  name,
                                  style: GoogleFonts.outfit(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: barColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(
                                  '$pct%',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    color: barColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // 2x2 Grid: Total Schools, Grades Breakdown, Collected, Target
                          Row(
                            children: [
                              // Total Schools Box
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFF1F5F9)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.school_outlined, size: 13, color: Color(0xFF64748B)),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Total Schools',
                                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$schoolsCount',
                                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Grades Breakdown Box
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFF1F5F9)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.bar_chart_rounded, size: 13, color: Color(0xFF64748B)),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Grades',
                                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      if (gradeCounts.isEmpty)
                                        Text('-', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)))
                                      else
                                        Wrap(
                                          spacing: 4,
                                          runSpacing: 2,
                                          children: (gradeCounts.entries.toList()..sort((a, b) => a.key.compareTo(b.key)))
                                              .map((e) => Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFE2E8F0),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: Text(
                                                      '${e.key}: ${e.value}',
                                                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                                                    ),
                                                  ))
                                              .toList(),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          Row(
                            children: [
                              // Collected Box
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF0FDF4),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFDCFCE7)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.check_circle_outline_rounded, size: 13, color: Color(0xFF166534)),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Collected',
                                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF166534)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$collected',
                                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF15803D)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Target Box
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFDBEAFE)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.track_changes_rounded, size: 13, color: Color(0xFF1E40AF)),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Target',
                                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF1E40AF)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$target',
                                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1D4ED8)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Progress Bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: (pct / 100.0).clamp(0.0, 1.0),
                              minHeight: 8,
                              backgroundColor: const Color(0xFFE2E8F0),
                              valueColor: AlwaysStoppedAnimation<Color>(barColor),
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Tap to view schools label
                          Center(
                            child: Text(
                              'Tap to view $schoolsCount schools →',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF4F46E5),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // DEDICATED DRILL-DOWN VIEW (Matching web app's drill-down)
  // -------------------------------------------------------------
  Widget _buildDrillDownView() {
    final mandalName = _selectedMandal?['mandalName']?.toString() ?? 'Mandal';

    if (_isLoadingSchools) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_schoolError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 40),
              const SizedBox(height: 12),
              Text(_schoolError!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: const Color(0xFF64748B))),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () => _drillDownMandal(_selectedMandal!), child: const Text('Try Again')),
            ],
          ),
        ),
      );
    }

    // Filter schools by search query if any
    final query = _schoolSearchQuery.trim().toLowerCase();
    final filteredSchools = _schoolReports.where((s) {
      if (query.isEmpty) return true;
      final sName = (s['schoolName']?.toString() ?? '').toLowerCase();
      final vName = (s['village']?.toString() ?? '').toLowerCase();
      final gName = (s['grade']?.toString() ?? '').toLowerCase();
      return sName.contains(query) || vName.contains(query) || gName.contains(query);
    }).toList();

    // Calculate aggregate metrics for this mandal's schools
    final mandalSchoolsStats = _calculateMandalSchoolsStats(_schoolReports);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Navigation Bar: "< Back to Mandals" button + Mandal Badge + PDF Share button
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            InkWell(
              onTap: _backToMandals,
              borderRadius: BorderRadius.circular(6),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.arrow_back_rounded, size: 16, color: Color(0xFF4F46E5)),
                    const SizedBox(width: 4),
                    Text(
                      'Back to Mandals',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF4F46E5)),
                    ),
                  ],
                ),
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0E7FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.school_outlined, size: 12, color: Color(0xFF4338CA)),
                      const SizedBox(width: 4),
                      Text(
                        '$mandalName (${_schoolReports.length})',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF4338CA)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                InkWell(
                  onTap: _showSpecificMandalReportSheet,
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.share_outlined, size: 12, color: Colors.white),
                        const SizedBox(width: 3),
                        Text(
                          'Share',
                          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),

        // MANDAL SCHOOLS SUMMARY STATS CARDS ROW (Matching web app line 556)
        _buildStatsRow(mandalSchoolsStats),
        const SizedBox(height: 8),

        // Search schools input
        if (_schoolReports.length > 3)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search schools by name or village...',
                hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                prefixIcon: const Icon(Icons.search_rounded, size: 18, color: Color(0xFF94A3B8)),
                suffixIcon: _schoolSearchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 16),
                        onPressed: () => setState(() => _schoolSearchQuery = ''),
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              onChanged: (val) {
                setState(() {
                  _schoolSearchQuery = val;
                });
              },
            ),
          ),

        // Schools List
        if (_schoolReports.isEmpty)
          Container(
            padding: const EdgeInsets.all(36),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                const Icon(Icons.bar_chart_rounded, size: 48, color: Color(0xFFCBD5E1)),
                const SizedBox(height: 12),
                Text(
                  'No schools found for $mandalName.',
                  style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B)),
                ),
              ],
            ),
          )
        else if (filteredSchools.isEmpty)
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Center(
              child: Text(
                'No schools match "$_schoolSearchQuery".',
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
              ),
            ),
          )
        else
          ...filteredSchools.map((school) => _buildSchoolCard(school)),
      ],
    );
  }

  // -------------------------------------------------------------
  // SCHOOL CARD (Matching web app lines 565-603 with left accent,
  // grade badge, village, percentage, collected/target, & bar)
  // -------------------------------------------------------------
  Widget _buildSchoolCard(dynamic schoolRaw) {
    final school = schoolRaw is Map ? schoolRaw : <String, dynamic>{};
    final sName = school['schoolName']?.toString() ?? 'School';
    final sVillage = school['village']?.toString() ?? '';
    final sGrade = school['grade']?.toString() ?? '';
    final sTarget = (school['target'] as num?)?.toInt() ?? 0;
    final sCollected = (school['collected'] as num?)?.toInt() ?? 0;
    final sPct = (school['percentage'] as num?)?.toInt() ?? 0;
    final hmName = school['headmasterName']?.toString();
    final hmPhone = school['headmasterPhone']?.toString();

    final Color barColor = _getPercentageColor(sPct);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 4px colored left accent strip
              Container(
                width: 4,
                color: barColor,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // School Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        sName,
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF0F172A),
                                        ),
                                      ),
                                    ),
                                    if (sGrade.isNotEmpty && sGrade != 'N/A' && sGrade != '-')
                                      Container(
                                        margin: const EdgeInsets.only(left: 6),
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          sGrade,
                                          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF475569)),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                if (sVillage.isNotEmpty)
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, size: 12, color: Color(0xFF64748B)),
                                      const SizedBox(width: 3),
                                      Text(
                                        sVillage,
                                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                      ),
                                    ],
                                  ),
                                if (hmName != null && hmName.isNotEmpty && hmName != 'N/A')
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      'HM: $hmName ${hmPhone != null && hmPhone != 'N/A' ? '($hmPhone)' : ''}',
                                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Percentage & Collected / Target Numbers
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '$sPct%',
                                style: GoogleFonts.outfit(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: barColor,
                                  height: 1.0,
                                ),
                              ),
                              const SizedBox(height: 4),
                              RichText(
                                text: TextSpan(
                                  text: '$sCollected',
                                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                                  children: [
                                    TextSpan(
                                      text: ' / $sTarget',
                                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: const Color(0xFF94A3B8)),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Horizontal Progress Bar
                      ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: (sPct / 100.0).clamp(0.0, 1.0),
                          minHeight: 6,
                          backgroundColor: const Color(0xFFE2E8F0),
                          valueColor: AlwaysStoppedAnimation<Color>(barColor),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // 4-STAT SUMMARY ROW (Matching renderStatsRow in web app lines 130-353)
  // -------------------------------------------------------------
  Widget _buildStatsRow(Map<String, int> stats) {
    final totalSchools = stats['totalSchools'] ?? 0;
    final totalTarget = stats['totalTarget'] ?? 0;
    final totalCollected = stats['totalCollected'] ?? 0;
    final totalRemaining = stats['totalRemaining'] ?? 0;

    return Row(
      children: [
        // 1. Total Schools
        Expanded(
          child: _buildMiniStatCard(
            title: 'Total Schools',
            value: totalSchools.toString(),
            icon: Icons.school_outlined,
            bgColor: Colors.white,
            borderColor: const Color(0xFFE2E8F0),
            iconBgColor: const Color(0xFFF1F5F9),
            iconColor: const Color(0xFF475569),
            valueColor: const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(width: 6),

        // 2. Target
        Expanded(
          child: _buildMiniStatCard(
            title: 'Target',
            value: totalTarget.toString(),
            icon: Icons.track_changes_rounded,
            bgColor: const Color(0xFFEFF6FF),
            borderColor: const Color(0xFFBFDBFE),
            iconBgColor: const Color(0xFFDBEAFE),
            iconColor: const Color(0xFF2563EB),
            valueColor: const Color(0xFF1D4ED8),
          ),
        ),
        const SizedBox(width: 6),

        // 3. Collected
        Expanded(
          child: _buildMiniStatCard(
            title: 'Collected',
            value: totalCollected.toString(),
            icon: Icons.check_circle_outline_rounded,
            bgColor: const Color(0xFFF0FDF4),
            borderColor: const Color(0xFFBBF7D0),
            iconBgColor: const Color(0xFFDCFCE7),
            iconColor: const Color(0xFF16A34A),
            valueColor: const Color(0xFF15803D),
          ),
        ),
        const SizedBox(width: 6),

        // 4. Remaining
        Expanded(
          child: _buildMiniStatCard(
            title: 'Remaining',
            value: totalRemaining.toString(),
            icon: Icons.access_time_rounded,
            bgColor: const Color(0xFFFFF7ED),
            borderColor: const Color(0xFFFED7AA),
            iconBgColor: const Color(0xFFFFEDD5),
            iconColor: const Color(0xFFEA580C),
            valueColor: const Color(0xFFC2410C),
          ),
        ),
      ],
    );
  }

  Widget _buildMiniStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color bgColor,
    required Color borderColor,
    required Color iconBgColor,
    required Color iconColor,
    required Color valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(color: iconColor.withValues(alpha: 0.05), blurRadius: 3, offset: const Offset(0, 1)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, size: 13, color: iconColor),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: valueColor,
                height: 1.1,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: iconColor,
              height: 1.1,
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // MANDAL SUMMARY REPORT BOTTOM SHEET
  // -------------------------------------------------------------
  void _showMandalSummarySheet() {
    final overallStats = _calculateOverallStats(_mandalsSummary);
    final totalSchools = overallStats['totalSchools'] ?? 0;
    final totalTarget = overallStats['totalTarget'] ?? 0;
    final totalCollected = overallStats['totalCollected'] ?? 0;
    final totalRemaining = overallStats['totalRemaining'] ?? 0;
    final pct = totalTarget > 0 ? ((totalCollected / totalTarget) * 100).round() : 0;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Sheet Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mandal Summary Report',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                        ),
                        Text(
                          'Total Mandals: ${_mandalsSummary.length} | Completion: $pct%',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              // Action buttons (Copy text summary)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F2B47),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                        icon: const Icon(Icons.copy_rounded, size: 16, color: Colors.white),
                        label: Text('Copy Report Summary', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                        onPressed: () {
                          final buffer = StringBuffer();
                          buffer.writeln('📊 *MANDAL PROGRESS REPORT* 📊');
                          buffer.writeln('--------------------------------');
                          buffer.writeln('Total Schools: $totalSchools');
                          buffer.writeln('Target: $totalTarget');
                          buffer.writeln('Collected: $totalCollected');
                          buffer.writeln('Remaining: $totalRemaining');
                          buffer.writeln('Overall Completion: $pct%\n');
                          buffer.writeln('--- Mandal Breakdown ---');
                          for (final m in _mandalsSummary) {
                            buffer.writeln('• ${m['mandalName']}: ${m['totalCollected']}/${m['totalTarget']} (${m['percentage']}%) [Schools: ${m['totalSchools']}]');
                          }
                          Clipboard.setData(ClipboardData(text: buffer.toString()));
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Report copied to clipboard!')),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),

              // Scrollable Table of Mandals
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Table Header
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Expanded(flex: 3, child: Text('Mandal', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF334155)))),
                          Expanded(flex: 2, child: Text('Target', textAlign: TextAlign.right, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF334155)))),
                          Expanded(flex: 2, child: Text('Collected', textAlign: TextAlign.right, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF334155)))),
                          Expanded(flex: 2, child: Text('%', textAlign: TextAlign.right, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF334155)))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Rows
                    ..._mandalsSummary.map((m) {
                      final name = m['mandalName']?.toString() ?? '';
                      final target = m['totalTarget'] ?? 0;
                      final collected = m['totalCollected'] ?? 0;
                      final p = (m['percentage'] as num?)?.toInt() ?? 0;
                      final pColor = _getPercentageColor(p);

                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                        margin: const EdgeInsets.only(bottom: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFF1F5F9)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Text(
                                name,
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Text(
                                '$target',
                                textAlign: TextAlign.right,
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF2563EB), fontWeight: FontWeight.w600),
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Text(
                                '$collected',
                                textAlign: TextAlign.right,
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF059669), fontWeight: FontWeight.w600),
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Text(
                                '$p%',
                                textAlign: TextAlign.right,
                                style: GoogleFonts.inter(fontSize: 12, color: pColor, fontWeight: FontWeight.w800),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // -------------------------------------------------------------
  // SPECIFIC MANDAL REPORT BOTTOM SHEET
  // -------------------------------------------------------------
  void _showSpecificMandalReportSheet() {
    final mandalName = _selectedMandal?['mandalName']?.toString() ?? 'Mandal';
    final stats = _calculateMandalSchoolsStats(_schoolReports);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$mandalName Schools Report',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                        ),
                        Text(
                          'Total Schools: ${_schoolReports.length} | Target: ${stats['totalTarget']} | Collected: ${stats['totalCollected']}',
                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    minimumSize: const Size.fromHeight(40),
                  ),
                  icon: const Icon(Icons.copy_rounded, size: 16, color: Colors.white),
                  label: Text('Copy $mandalName Report', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                  onPressed: () {
                    final buffer = StringBuffer();
                    buffer.writeln('🏫 *$mandalName Mandal Schools Report* 🏫');
                    buffer.writeln('--------------------------------');
                    buffer.writeln('Total Schools: ${stats['totalSchools']}');
                    buffer.writeln('Target: ${stats['totalTarget']}');
                    buffer.writeln('Collected: ${stats['totalCollected']}');
                    buffer.writeln('Remaining: ${stats['totalRemaining']}\n');
                    for (final s in _schoolReports) {
                      final name = s['schoolName'] ?? 'School';
                      final village = s['village'] ?? '';
                      final col = s['collected'] ?? 0;
                      final tar = s['target'] ?? 0;
                      final pct = s['percentage'] ?? 0;
                      buffer.writeln('• $name ($village): $col/$tar ($pct%)');
                    }
                    Clipboard.setData(ClipboardData(text: buffer.toString()));
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Mandal report copied to clipboard!')),
                    );
                  },
                ),
              ),

              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _schoolReports.length,
                  separatorBuilder: (_, i) => const SizedBox(height: 6),
                  itemBuilder: (_, index) {
                    final s = _schoolReports[index];
                    final name = s['schoolName']?.toString() ?? 'School';
                    final village = s['village']?.toString() ?? '';
                    final grade = s['grade']?.toString() ?? '';
                    final col = s['collected'] ?? 0;
                    final tar = s['target'] ?? 0;
                    final pct = (s['percentage'] as num?)?.toInt() ?? 0;
                    final pColor = _getPercentageColor(pct);

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                                Row(
                                  children: [
                                    if (grade.isNotEmpty && grade != 'N/A')
                                      Text('Grade $grade • ', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                                    Text(village, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('$pct%', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w800, color: pColor)),
                              Text('$col / $tar', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
