import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class PricingRegistrationScreen extends StatefulWidget {
  final int initialTabIndex; // 0 = Pricing, 1 = Registration
  final String? preselectedPlan;

  const PricingRegistrationScreen({
    super.key,
    this.initialTabIndex = 0,
    this.preselectedPlan,
  });

  @override
  State<PricingRegistrationScreen> createState() => _PricingRegistrationScreenState();
}

class _PricingRegistrationScreenState extends State<PricingRegistrationScreen> {
  late int _activeTab;
  String _selectedPlan = 'Pro Campus';

  // Registration Form Controllers
  final _collegeNameController = TextEditingController();
  final _contactPersonController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _cityController = TextEditingController();
  final _proCountController = TextEditingController(text: '5');
  final _notesController = TextEditingController();

  bool _isSubmitting = false;
  String? _formError;

  @override
  void initState() {
    super.initState();
    _activeTab = widget.initialTabIndex;
    if (widget.preselectedPlan != null) {
      _selectedPlan = widget.preselectedPlan!;
    }
  }

  @override
  void dispose() {
    _collegeNameController.dispose();
    _contactPersonController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _cityController.dispose();
    _proCountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _launchWhatsApp(String message) async {
    final encoded = Uri.encodeComponent(message);
    // WhatsApp contact URL for Sales / Support
    final url = Uri.parse('https://wa.me/919848006463?text=$encoded');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _handleSubmitRegistration() async {
    final college = _collegeNameController.text.trim();
    final person = _contactPersonController.text.trim();
    final phone = _phoneController.text.trim();

    if (college.isEmpty || person.isEmpty || phone.isEmpty) {
      setState(() {
        _formError = 'Please fill College Name, Contact Person, and Phone Number.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _formError = null;
    });

    // Formatted message for sales team
    final whatsappMsg = '''
🎓 *NEW COLLEGE REGISTRATION - PRO DIARY*
──────────────────────
🏛️ *College:* $college
👤 *Contact Person:* $person
📞 *Phone:* $phone
📧 *Email:* ${_emailController.text.trim().isEmpty ? 'N/A' : _emailController.text.trim()}
📍 *City/District:* ${_cityController.text.trim().isEmpty ? 'N/A' : _cityController.text.trim()}
👥 *Est. PROs:* ${_proCountController.text.trim()}
💎 *Selected Plan:* $_selectedPlan
📝 *Notes:* ${_notesController.text.trim().isEmpty ? 'None' : _notesController.text.trim()}
──────────────────────
Requesting demo and onboarding credentials.
''';

    await Future.delayed(const Duration(milliseconds: 600));

    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
    });

    // Show Success Dialog with direct WhatsApp option
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 28),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Registration Sent!',
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thank you, $person! Your registration for "$college" has been received.',
              style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF334155)),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Our team will contact you on $phone with your demo credentials & setup details.',
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context); // Return to login
            },
            child: Text(
              'Back to Login',
              style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              _launchWhatsApp(whatsappMsg);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
            label: Text(
              'Instant WhatsApp Connect',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF312E81)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top App Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
                      onPressed: () => Navigator.pop(context),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.1),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'PRO Diary for Institutions',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            'Pricing Plans & Quick College Onboarding',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Segmented Tab Switcher (Pricing vs Registration)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildSegmentTab(
                          title: '🏷️ Pricing Plans',
                          isSelected: _activeTab == 0,
                          onTap: () => setState(() => _activeTab = 0),
                        ),
                      ),
                      Expanded(
                        child: _buildSegmentTab(
                          title: '📝 College Register',
                          isSelected: _activeTab == 1,
                          onTap: () => setState(() => _activeTab = 1),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Content Area
              Expanded(
                child: _activeTab == 0 ? _buildPricingView() : _buildRegistrationView(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSegmentTab({
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF4F46E5) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? Colors.white : const Color(0xFFCBD5E1),
            ),
          ),
        ),
      ),
    );
  }

  // ================= PRICING VIEW =================
  Widget _buildPricingView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Pitch
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Column(
              children: [
                Text(
                  'Empower Your Field PRO Team',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Track village & college visits, collect student admissions leads, and generate daily executive PDF day reports in 1-click.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: const Color(0xFF94A3B8),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Plan 1: Starter
          _buildPlanCard(
            title: 'Starter',
            badge: 'SMALL TEAMS',
            badgeColor: const Color(0xFF64748B),
            priceSubtitle: 'For single branch or beginner PRO team',
            proLimit: '1 - 3 Field PROs',
            features: [
              'Daily Day Work Logging',
              'Instant PDF Day Report Generation',
              'Student & Lead Contact Capture',
              'Offline Cache & Auto-Sync',
              'Standard Email/WhatsApp Support',
            ],
            isPopular: false,
            buttonText: 'Choose Starter Plan',
            onSelect: () {
              setState(() {
                _selectedPlan = 'Starter';
                _activeTab = 1; // Switch to registration
              });
            },
          ),
          const SizedBox(height: 16),

          // Plan 2: Pro Campus (Popular)
          _buildPlanCard(
            title: 'Pro Campus',
            badge: 'MOST POPULAR 🌟',
            badgeColor: const Color(0xFFF59E0B),
            priceSubtitle: 'Best for Degree, Engineering & Medical Colleges',
            proLimit: 'Up to 15 Field PROs',
            features: [
              'Everything in Starter +',
              'Institution & Branch Visits Logging',
              'Village Relatives & Key Persons Tracking',
              'WhatsApp Templates & Direct Sharing',
              'Student Follow-up Tasks & Reminders',
              'Executive PDF Summary with Signatures',
              'Priority 24/7 Phone & WhatsApp Support',
            ],
            isPopular: true,
            buttonText: 'Get Pro Campus Plan',
            onSelect: () {
              setState(() {
                _selectedPlan = 'Pro Campus';
                _activeTab = 1;
              });
            },
          ),
          const SizedBox(height: 16),

          // Plan 3: Enterprise
          _buildPlanCard(
            title: 'Enterprise',
            badge: 'GROUP OF INSTITUTIONS',
            badgeColor: const Color(0xFF10B981),
            priceSubtitle: 'Full multi-campus deployment & customization',
            proLimit: 'Unlimited PROs & Admins',
            features: [
              'Everything in Pro Campus +',
              'Multi-Branch & Campus Central Control',
              'Full Admin Web Management Portal',
              'Telecaller Integration & Lead Pipeline',
              'Custom Institution Branding & Logo',
              'Dedicated Account Manager & On-site Training',
            ],
            isPopular: false,
            buttonText: 'Contact for Enterprise',
            onSelect: () {
              setState(() {
                _selectedPlan = 'Enterprise';
                _activeTab = 1;
              });
            },
          ),
          const SizedBox(height: 24),

          // Direct WhatsApp Assistance Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF25D366).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF25D366).withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFF25D366),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Need a Custom Quote or Demo?',
                        style: GoogleFonts.outfit(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        'Speak directly with our team on WhatsApp',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFFCBD5E1),
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () => _launchWhatsApp('Hello, I am interested in a customized plan for PRO Diary.'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text('Chat', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildPlanCard({
    required String title,
    required String badge,
    required Color badgeColor,
    required String priceSubtitle,
    required String proLimit,
    required List<String> features,
    required bool isPopular,
    required String buttonText,
    required VoidCallback onSelect,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isPopular ? const Color(0xFF1E1B4B) : Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isPopular ? const Color(0xFF6366F1) : Colors.white.withValues(alpha: 0.12),
          width: isPopular ? 2 : 1,
        ),
        boxShadow: isPopular
            ? [
                BoxShadow(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.25),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                )
              ]
            : null,
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: badgeColor.withValues(alpha: 0.6)),
                ),
                child: Text(
                  badge,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: badgeColor,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            priceSubtitle,
            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 12),

          // Capacity Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.people_alt_rounded, color: Color(0xFF818CF8), size: 18),
                const SizedBox(width: 8),
                Text(
                  'Capacity: $proLimit',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Features List
          ...features.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle_rounded, color: Color(0xFF22C55E), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      f,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFFE2E8F0),
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Action Button
          ElevatedButton(
            onPressed: onSelect,
            style: ElevatedButton.styleFrom(
              backgroundColor: isPopular ? const Color(0xFF4F46E5) : Colors.white.withValues(alpha: 0.15),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: isPopular ? 4 : 0,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  buttonText,
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(width: 6),
                const Icon(Icons.arrow_forward_rounded, size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ================= REGISTRATION VIEW =================
  Widget _buildRegistrationView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Registration Card
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.25),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'College / Institute Onboarding',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Fill this form to get instant demo access & customized credentials.',
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                ),
                const SizedBox(height: 20),

                if (_formError != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _formError!,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: const Color(0xFFDC2626),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Selected Plan Selector
                Text(
                  'Target Plan',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedPlan,
                      isExpanded: true,
                      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF6366F1)),
                      items: const [
                        DropdownMenuItem(value: 'Starter', child: Text('Starter Plan (1-3 PROs)')),
                        DropdownMenuItem(value: 'Pro Campus', child: Text('Pro Campus Plan (Up to 15 PROs)')),
                        DropdownMenuItem(value: 'Enterprise', child: Text('Enterprise (Unlimited PROs)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedPlan = val);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Field 1: College Name
                _buildFormField(
                  label: 'College / Institution Name *',
                  hint: 'e.g. Sri Venkateswara Engineering College',
                  controller: _collegeNameController,
                  icon: Icons.account_balance_rounded,
                ),
                const SizedBox(height: 14),

                // Field 2: Contact Person Name
                _buildFormField(
                  label: 'Contact Person Name & Designation *',
                  hint: 'e.g. Dr. Rajesh Kumar (Principal / Director)',
                  controller: _contactPersonController,
                  icon: Icons.person_rounded,
                ),
                const SizedBox(height: 14),

                // Field 3: Mobile Number
                _buildFormField(
                  label: 'WhatsApp / Mobile Number *',
                  hint: 'e.g. 9876543210',
                  controller: _phoneController,
                  icon: Icons.phone_android_rounded,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 14),

                // Field 4: Email
                _buildFormField(
                  label: 'Email Address (Optional)',
                  hint: 'e.g. info@college.edu',
                  controller: _emailController,
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 14),

                // Row: City + Number of PROs
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: _buildFormField(
                        label: 'City / District',
                        hint: 'e.g. Vijayawada',
                        controller: _cityController,
                        icon: Icons.location_on_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: _buildFormField(
                        label: 'No. of PROs',
                        hint: '5',
                        controller: _proCountController,
                        icon: Icons.badge_outlined,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Field 5: Notes
                _buildFormField(
                  label: 'Special Requirements / Notes',
                  hint: 'e.g. Need demo by tomorrow morning',
                  controller: _notesController,
                  icon: Icons.edit_note_rounded,
                  maxLines: 2,
                ),
                const SizedBox(height: 24),

                // Submit Button
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleSubmitRegistration,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 3,
                    shadowColor: const Color(0xFF4F46E5).withValues(alpha: 0.4),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Submit & Request Demo',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward_rounded, size: 18),
                          ],
                        ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildFormField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF0F172A)),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
            prefixIcon: Icon(icon, color: const Color(0xFF6366F1), size: 20),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
            ),
          ),
        ),
      ],
    );
  }
}
