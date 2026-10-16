import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/api_service.dart';

class EmployeeProfileScreen extends StatefulWidget {
  final String employeeId;
  final String employeeName;
  final String employeeRole;

  const EmployeeProfileScreen({
    super.key,
    required this.employeeId,
    required this.employeeName,
    required this.employeeRole,
  });

  @override
  State<EmployeeProfileScreen> createState() => _EmployeeProfileScreenState();
}

class _EmployeeProfileScreenState extends State<EmployeeProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _collegeController;
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.employeeName);
    _phoneController = TextEditingController();
    _collegeController = TextEditingController();
    _loadProfileData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _collegeController.dispose();
    super.dispose();
  }

  Future<void> _loadProfileData() async {
    setState(() => _isLoading = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      
      // 1. Load from local cache first for instant display
      final storedPhone = prefs.getString('employee_phone');
      if (storedPhone != null && storedPhone.isNotEmpty) {
        _phoneController.text = storedPhone;
      } else {
        final cleanId = widget.employeeId.replaceAll(RegExp(r'\D'), '');
        if (cleanId.length == 10) {
          _phoneController.text = cleanId;
        }
      }

      final storedName = prefs.getString('user_name');
      if (storedName != null && storedName.isNotEmpty) {
        _nameController.text = storedName;
      }

      final storedCollege = prefs.getString('employee_college');
      if (storedCollege != null && storedCollege.isNotEmpty) {
        _collegeController.text = storedCollege;
      }

      if (mounted) {
        setState(() => _isLoading = false);
      }

      // 2. Fetch latest from Server Database (Cloud Sync)
      final cloudProfile = await ApiService.getEmployeeProfile(widget.employeeId);
      if (cloudProfile != null) {
        final cloudCollege = cloudProfile['collegeName']?.toString().trim() ?? '';
        final cloudPhone = cloudProfile['phone']?.toString().trim() ?? '';
        final cloudName = cloudProfile['name']?.toString().trim() ?? '';

        if (cloudCollege.isNotEmpty) {
          _collegeController.text = cloudCollege;
          await prefs.setString('employee_college', cloudCollege);
        }
        if (cloudPhone.isNotEmpty) {
          _phoneController.text = cloudPhone;
          await prefs.setString('employee_phone', cloudPhone);
        }
        if (cloudName.isNotEmpty) {
          _nameController.text = cloudName;
          await prefs.setString('user_name', cloudName);
        }

        if (mounted) setState(() {});
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final college = _collegeController.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your full name')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      // 1. Save locally
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_name', name);
      await prefs.setString('employee_phone', phone);
      await prefs.setString('employee_college', college);

      // 2. Sync to Server Database so it appears in Browser & all devices
      await ApiService.saveEmployeeProfile(
        employeeId: widget.employeeId,
        name: name,
        phone: phone,
        collegeName: college,
      );

      if (!mounted) return;

      setState(() => _isSaving = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF10B981),
          content: Text('Profile details updated & synced successfully! 🎉'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save profile: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final empName = widget.employeeName.trim();
    final initialLetter = empName.isNotEmpty ? empName[0].toUpperCase() : 'E';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F2B47),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Employee Profile',
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF0F2B47)),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Profile Badge Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F2B47), Color(0xFF1E3A8A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F2B47).withValues(alpha: 0.25),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 38,
                          backgroundColor: Colors.white.withValues(alpha: 0.2),
                          child: CircleAvatar(
                            radius: 34,
                            backgroundColor: Colors.white,
                            child: Text(
                              initialLetter,
                              style: GoogleFonts.outfit(
                                fontSize: 32,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF0F2B47),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _nameController.text.isNotEmpty ? _nameController.text : widget.employeeName,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Employee ID: ${widget.employeeId}',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: const Color(0xFF94A3B8),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFF10B981)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.verified_rounded, size: 14, color: Color(0xFF10B981)),
                              const SizedBox(width: 6),
                              Text(
                                widget.employeeRole.toUpperCase(),
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF10B981),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Section Title
                  Text(
                    'Profile Details',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Your official information recorded for student day reports',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                  ),

                  const SizedBox(height: 14),

                  // Profile Form Card
                  Container(
                    padding: const EdgeInsets.all(18),
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
                        // Name Field
                        _buildFieldLabel(Icons.person_outline_rounded, 'Employee Full Name'),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _nameController,
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
                          decoration: _inputDecoration('Enter full name'),
                        ),

                        const SizedBox(height: 18),

                        // Mobile Number Field
                        _buildFieldLabel(Icons.phone_iphone_rounded, 'Mobile Number'),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
                          decoration: _inputDecoration('Enter 10-digit mobile number'),
                        ),

                        const SizedBox(height: 18),

                        // College Name Field
                        _buildFieldLabel(Icons.account_balance_rounded, 'College Name'),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _collegeController,
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
                          decoration: _inputDecoration('Enter your college name (e.g. Sri Vaatsalya Junior College)'),
                        ),

                        const SizedBox(height: 18),

                        // Employee ID (Read-only)
                        _buildFieldLabel(Icons.badge_outlined, 'Employee Login ID'),
                        const SizedBox(height: 6),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFCBD5E1)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                widget.employeeId,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF334155),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE2E8F0),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'System ID',
                                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Save Profile Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F2B47),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 2,
                      ),
                      icon: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Icon(Icons.save_rounded, size: 20),
                      label: Text(
                        _isSaving ? 'Saving Changes...' : 'Save Profile Details',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                      onPressed: _isSaving ? null : _saveProfile,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Info Note Box
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline_rounded, color: Color(0xFF2563EB), size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Your Name, College, and Mobile Number will be used when generating reports and contacting prospective students and headmasters.',
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF1E40AF), height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildFieldLabel(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF4F46E5)),
        const SizedBox(width: 6),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF334155),
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
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
        borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5),
      ),
    );
  }
}
