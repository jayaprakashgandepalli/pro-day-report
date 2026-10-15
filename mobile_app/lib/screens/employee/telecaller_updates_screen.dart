import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';

class TelecallerUpdatesScreen extends StatefulWidget {
  const TelecallerUpdatesScreen({super.key});

  @override
  State<TelecallerUpdatesScreen> createState() => _TelecallerUpdatesScreenState();
}

class _TelecallerUpdatesScreenState extends State<TelecallerUpdatesScreen> {
  List<dynamic> _updates = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchUpdates();
  }

  Future<void> _fetchUpdates({bool forceRefresh = false}) async {
    if (_updates.isEmpty) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    final res = await ApiService.getTelecallerUpdates(forceRefresh: forceRefresh);

    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _updates = res['updates'] as List<dynamic>? ?? [];
        _isLoading = false;
      });
    } else {
      setState(() {
        if (_updates.isEmpty) _error = res['error'] ?? 'Failed to load telecaller updates';
        _isLoading = false;
      });
    }
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
          'Telecaller Updates',
          style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF4F46E5)),
            onPressed: _fetchUpdates,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _updates.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.support_agent_rounded, size: 48, color: Color(0xFFCBD5E1)),
                          const SizedBox(height: 12),
                          Text('No new telecaller updates in the last 7 days.', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () => _fetchUpdates(forceRefresh: true),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _updates.length,
                        separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final u = _updates[index];
                          final type = u['type'] ?? 'STUDENT';
                          final name = u['name'] ?? '';
                          final phone = u['phone'] ?? '';
                          final details = u['details'] ?? '';
                          final updateAt = (u['updateAt'] ?? '').toString().split('T')[0];
                          final leadStatus = u['leadStatus'] ?? '';
                          final schoolName = u['schoolName'] ?? '';

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
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        name,
                                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEC4899).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        type,
                                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFFDB2777)),
                                      ),
                                    ),
                                  ],
                                ),
                                if (phone.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.phone_rounded, size: 14, color: Color(0xFF64748B)),
                                      const SizedBox(width: 4),
                                      Text(phone, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                                      if (schoolName.isNotEmpty) ...[
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text('• $schoolName', overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                                const SizedBox(height: 8),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFFF1F5F9)),
                                  ),
                                  child: Text(
                                    details.isNotEmpty ? details : 'Status: $leadStatus',
                                    style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF334155)),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    if (leadStatus.isNotEmpty)
                                      Text(
                                        'Status: $leadStatus',
                                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF4F46E5)),
                                      )
                                    else
                                      const SizedBox.shrink(),
                                    Text(
                                      'Updated: $updateAt',
                                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                                    ),
                                  ],
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
