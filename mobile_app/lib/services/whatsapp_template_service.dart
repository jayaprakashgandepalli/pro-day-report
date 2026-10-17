import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class WhatsAppTemplateItem {
  final String id;
  final String title;
  final String message;
  final bool isDefault;

  WhatsAppTemplateItem({
    required this.id,
    required this.title,
    required this.message,
    this.isDefault = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'isDefault': isDefault,
    };
  }

  factory WhatsAppTemplateItem.fromMap(Map<String, dynamic> map) {
    return WhatsAppTemplateItem(
      id: map['id']?.toString() ?? 'tpl_${DateTime.now().millisecondsSinceEpoch}',
      title: map['title']?.toString() ?? 'Template',
      message: map['message']?.toString() ?? '',
      isDefault: map['isDefault'] == true,
    );
  }
}

class WhatsAppTemplateService {
  WhatsAppTemplateService._();

  static const String _keyTemplates = 'custom_whatsapp_templates_v1';
  static const String _keyPamphletUrl = 'custom_whatsapp_pamphlet_url_v1';

  static const String defaultPamphletUrl = 'https://sri.uniknaturals.in/pamphlet';
  static const String defaultCollegeName = 'శ్రీ వాత్సల్య జూనియర్ కళాశాల';

  static final List<WhatsAppTemplateItem> _defaultTemplates = [
    WhatsAppTemplateItem(
      id: 'default_met_parents',
      title: 'ఇంట్లో కలిసి మాట్లాడినప్పుడు (Met Parents)',
      isDefault: true,
      message: '''నమస్కారం {parentName} గారూ! 🙏

ఈరోజు మీ ఇంటికి వచ్చినప్పుడు మీ అమూల్యమైన సమయాన్ని కేటాయించి మాతో మాట్లాడినందుకు మా *{collegeName}* యాజమాన్యం తరపున హృదయపూర్వక ధన్యవాదాలు.

మీ అబ్బాయి/అమ్మాయి {studentName} గారి బంగారు భవిష్యత్తు కోసం మా {collegeName} ప్రత్యేకతలు, గ్రూపులు మరియు సదుపాయాల సమగ్ర సమాచారంతో కూడిన 4-పేజీల పాంప్లెట్‌ను క్రింది లింక్ ద్వారా చూడగలరు:

📄 కాలేజీ పూర్తి వివరాల పాంప్లెట్:
👉 {pamphletLink}

మీ పిల్లల చదువు పట్ల మీరు తీసుకునే మంచి నిర్ణయానికి మేము ఎల్లప్పుడూ తోడుగా ఉంటాము.

గౌరవంతో,
👤 *{employeeName}* (PRO)
🏫 *{collegeName}*
📞 {employeePhone}''',
    ),
    WhatsAppTemplateItem(
      id: 'default_house_locked',
      title: 'ఇంట్లో లేనప్పుడు / తాళం వేసి ఉన్నప్పుడు (Missed)',
      isDefault: true,
      message: '''నమస్కారం {parentName} గారూ! 🙏

మీ అబ్బాయి/అమ్మాయి {studentName} గారి 10వ తరగతి తర్వాతి ఉన్నత విద్య & *{collegeName}* అడ్మిషన్ల గురించి మాట్లాడటానికి ఈరోజు మా కాలేజీ ప్రతినిధి మీ ఇంటికి రావడం జరిగింది. అయితే ఆ సమయంలో మీరు అందుబాటులో లేకపోవడం వల్ల మిమ్మల్ని కలవలేకపోయాము.

మీ పిల్లల భవిష్యత్తు కోసం మా {collegeName} కి సంబంధించిన పూర్తి వివరాల 4-పేజీల పాంప్లెట్‌ను క్రింది లింక్ ద్వారా పంపిస్తున్నాము:

📄 కాలేజీ సమాచార పాంప్లెట్:
👉 {pamphletLink}

దయచేసి ఈ వివరాలు పరిశీలించి, మీకు వీలైనప్పుడు క్రింది నంబర్‌కు తిరిగి కాల్ చేయగలరు.

కృతజ్ఞతలతో,
👤 *{employeeName}* (PRO)
🏫 *{collegeName}*
📞 {employeePhone}''',
    ),
    WhatsAppTemplateItem(
      id: 'default_followup',
      title: 'అడ్మిషన్ ఫాలో-అప్ (Follow-Up Reminder)',
      isDefault: true,
      message: '''నమస్కారం {parentName} గారూ! 🙏

{studentName} గారి ఇంటర్మీడియట్ అడ్మిషన్ల విషయమై గతంలో మనం మాట్లాడుకున్నాము కదా. ప్రస్తుతం మా *{collegeName}* లో అడ్మిషన్లు వేగంగా జరుగుతున్నాయి. మంచి మార్కులు సాధించిన విద్యార్థులకు ప్రత్యేక ఫీజు రాయితీలు మరియు హాస్టల్ సీట్లు త్వరగా భర్తీ అవుతున్నాయి.

📄 పూర్తి పాంప్లెట్ & వివరాలు:
👉 {pamphletLink}

సీటు కన్ఫర్మ్ చేసుకోవడానికి లేదా కాలేజీ విజిట్ చేయడానికి వెంటనే నన్ను సంప్రదించగలరు:
👤 *{employeeName}* (PRO)
🏫 *{collegeName}*
📞 {employeePhone}''',
    ),
  ];

  // In-memory cache
  static List<WhatsAppTemplateItem>? _cachedList;
  static String? _cachedPamphletUrl;

  /// Get employee's assigned or profile college name
  static Future<String> getCollegeName() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString('employee_college');
      if (stored != null && stored.trim().isNotEmpty) {
        return stored.trim();
      }
    } catch (_) {}
    return defaultCollegeName;
  }

  /// Get current pamphlet URL
  static Future<String> getPamphletUrl() async {
    if (_cachedPamphletUrl != null) return _cachedPamphletUrl!;
    try {
      final prefs = await SharedPreferences.getInstance();
      _cachedPamphletUrl = prefs.getString(_keyPamphletUrl) ?? defaultPamphletUrl;
    } catch (_) {
      _cachedPamphletUrl = defaultPamphletUrl;
    }
    return _cachedPamphletUrl!;
  }

  /// Save pamphlet URL
  static Future<void> savePamphletUrl(String url) async {
    _cachedPamphletUrl = url.trim().isEmpty ? defaultPamphletUrl : url.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyPamphletUrl, _cachedPamphletUrl!);
  }

  /// Get all templates (defaults + user created)
  static Future<List<WhatsAppTemplateItem>> getTemplates() async {
    if (_cachedList != null) return List.from(_cachedList!);
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyTemplates);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        _cachedList = decoded
            .map((e) => WhatsAppTemplateItem.fromMap(Map<String, dynamic>.from(e as Map)))
            .toList();

        // Auto-upgrade existing templates to include {collegeName} if missing
        bool needsSave = false;
        for (int i = 0; i < _cachedList!.length; i++) {
          final t = _cachedList![i];
          if (!t.message.contains('{collegeName}')) {
            String updatedMsg = t.message
                .replaceAll('మా కాలేజీ యాజమాన్యం', 'మా *{collegeName}* యాజమాన్యం')
                .replaceAll('మా కాలేజీ ప్రత్యేకతలు', 'మా {collegeName} ప్రత్యేకతలు')
                .replaceAll('మా కాలేజీలో', 'మా *{collegeName}* లో')
                .replaceAll('మా కాలేజీకి', 'మా {collegeName} కి')
                .replaceAll('కాలేజీ అడ్మిషన్ల', '*{collegeName}* అడ్మిషన్ల');

            if (!updatedMsg.contains('{collegeName}')) {
              updatedMsg = updatedMsg.replaceAll(
                '👤 {employeeName} (PRO)',
                '👤 *{employeeName}* (PRO)\n🏫 *{collegeName}*',
              );
            }

            if (updatedMsg != t.message) {
              _cachedList![i] = WhatsAppTemplateItem(
                id: t.id,
                title: t.title,
                message: updatedMsg,
                isDefault: t.isDefault,
              );
              needsSave = true;
            }
          }
        }

        if (needsSave) {
          await _persist();
        }

        return List.from(_cachedList!);
      }
    } catch (_) {}

    _cachedList = List.from(_defaultTemplates);
    await _persist();
    return List.from(_cachedList!);
  }

  /// Save a new or edited template
  static Future<void> saveTemplate({
    String? id,
    required String title,
    required String message,
  }) async {
    final list = await getTemplates();
    final cleanTitle = title.trim().isEmpty ? 'WhatsApp Message' : title.trim();
    final cleanMsg = message.trim();

    if (id != null && id.isNotEmpty) {
      final index = list.indexWhere((t) => t.id == id);
      if (index >= 0) {
        list[index] = WhatsAppTemplateItem(
          id: id,
          title: cleanTitle,
          message: cleanMsg,
          isDefault: list[index].isDefault,
        );
      } else {
        list.add(WhatsAppTemplateItem(
          id: id,
          title: cleanTitle,
          message: cleanMsg,
        ));
      }
    } else {
      final newId = 'custom_${DateTime.now().millisecondsSinceEpoch}';
      list.add(WhatsAppTemplateItem(
        id: newId,
        title: cleanTitle,
        message: cleanMsg,
      ));
    }

    _cachedList = list;
    await _persist();
  }

  /// Delete a template
  static Future<void> deleteTemplate(String id) async {
    final list = await getTemplates();
    list.removeWhere((t) => t.id == id);
    _cachedList = list;
    await _persist();
  }

  /// Reset all templates to original defaults
  static Future<void> resetToDefaults() async {
    _cachedList = List.from(_defaultTemplates);
    _cachedPamphletUrl = defaultPamphletUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyTemplates);
    await prefs.remove(_keyPamphletUrl);
    await _persist();
  }

  static Future<void> _persist() async {
    if (_cachedList == null) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final maps = _cachedList!.map((e) => e.toMap()).toList();
      await prefs.setString(_keyTemplates, jsonEncode(maps));
    } catch (_) {}
  }

  /// Replaces {studentName}, {parentName}, {collegeName}, {pamphletLink}, {employeeName}, {employeePhone}
  static String formatMessage(
    String rawTemplate, {
    required String studentName,
    required String parentName,
    required String employeeName,
    required String employeePhone,
    String? collegeName,
    String? pamphletUrl,
  }) {
    final sName = studentName.trim().isEmpty ? 'విద్యార్థి' : studentName.trim();
    final pName = parentName.trim().isEmpty ? 'తల్లిదండ్రులు' : parentName.trim();
    final eName = employeeName.trim().isEmpty ? 'PRO' : employeeName.trim();
    final ePhone = employeePhone.trim().isEmpty ? '' : employeePhone.trim();
    final cName = (collegeName != null && collegeName.trim().isNotEmpty)
        ? collegeName.trim()
        : defaultCollegeName;
    final pLink = (pamphletUrl != null && pamphletUrl.isNotEmpty)
        ? pamphletUrl
        : (_cachedPamphletUrl ?? defaultPamphletUrl);

    return rawTemplate
        .replaceAll('{collegeName}', cName)
        .replaceAll('{studentName}', sName)
        .replaceAll('{parentName}', pName)
        .replaceAll('{pamphletLink}', pLink)
        .replaceAll('{employeeName}', eName)
        .replaceAll('{employeePhone}', ePhone);
  }

  /// Launch WhatsApp with phone and optional message
  static Future<void> launchWhatsApp(String phone, {String? text}) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.isEmpty) return;

    final number = clean.length == 10 ? '91$clean' : clean;
    final textParam = (text != null && text.isNotEmpty)
        ? '?text=${Uri.encodeComponent(text)}'
        : '';

    final nativeUri = Uri.parse('whatsapp://send?phone=$number${textParam.replaceFirst('?', '&')}');
    final webUri = Uri.parse('https://wa.me/$number$textParam');

    try {
      if (await canLaunchUrl(nativeUri)) {
        await launchUrl(nativeUri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      await launchUrl(webUri, mode: LaunchMode.externalApplication);
    }
  }

  /// Shows the Smart WhatsApp Template Selector BottomSheet
  static Future<void> showTemplateSelector(
    BuildContext context, {
    required Map<String, dynamic> student,
    required String employeeName,
    required String employeePhone,
    String? collegeName,
  }) async {
    final phone = (student['whatsapp']?.toString().trim().isNotEmpty == true)
        ? student['whatsapp'].toString().trim()
        : (student['phone']?.toString().trim() ?? '');

    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No WhatsApp or Phone number available for this student.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      return;
    }

    final effectiveCollege = (collegeName != null && collegeName.trim().isNotEmpty)
        ? collegeName.trim()
        : await getCollegeName();
    final studentName = student['studentName']?.toString() ?? 'Student';
    final parentName = student['fatherName']?.toString() ?? 'Parent';
    final templates = await getTemplates();
    final pamphletUrl = await getPamphletUrl();

    if (!context.mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle pill
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.chat_bubble_rounded, color: Color(0xFF16A34A), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'WhatsApp Message',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          '$studentName • $phone',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFC7D2FE)),
                          ),
                          child: Text(
                            '🏫 $effectiveCollege',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF4338CA),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF94A3B8)),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              Text(
                'ఏ మెసేజ్ పంపించాలో సెలెక్ట్ చేయండి:',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 12),

              // Scrollable list of templates
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      // Option 0: Direct Chat (No Template)
                      _buildSelectorOption(
                        context: ctx,
                        icon: Icons.chat_outlined,
                        iconColor: const Color(0xFF64748B),
                        iconBg: const Color(0xFFF1F5F9),
                        title: 'సాధారణ చాట్ (Direct Chat without template)',
                        subtitle: 'మెసేజ్ లేకుండా నేరుగా వాట్సాప్ చాట్ ఓపెన్ అవుతుంది',
                        onTap: () {
                          Navigator.pop(ctx);
                          launchWhatsApp(phone);
                        },
                      ),
                      const SizedBox(height: 8),

                      // User Templates
                      ...templates.asMap().entries.map((entry) {
                        final index = entry.key;
                        final tpl = entry.value;

                        final colors = [
                          const Color(0xFF16A34A), // Green
                          const Color(0xFFD97706), // Amber
                          const Color(0xFF2563EB), // Blue
                          const Color(0xFF9333EA), // Purple
                          const Color(0xFF0D9488), // Teal
                        ];
                        final bgColors = [
                          const Color(0xFFDCFCE7),
                          const Color(0xFFFEF3C7),
                          const Color(0xFFDBEAFE),
                          const Color(0xFFF3E8FF),
                          const Color(0xFFCCFBF1),
                        ];

                        final color = colors[index % colors.length];
                        final bg = bgColors[index % bgColors.length];

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: _buildSelectorOption(
                            context: ctx,
                            icon: Icons.send_rounded,
                            iconColor: color,
                            iconBg: bg,
                            title: tpl.title,
                            subtitle: tpl.message.replaceAll('\n', ' ').length > 60
                                ? '${tpl.message.replaceAll('\n', ' ').substring(0, 60)}...'
                                : tpl.message.replaceAll('\n', ' '),
                            onTap: () {
                              final formatted = formatMessage(
                                tpl.message,
                                studentName: studentName,
                                parentName: parentName,
                                employeeName: employeeName,
                                employeePhone: employeePhone,
                                collegeName: effectiveCollege,
                                pamphletUrl: pamphletUrl,
                              );
                              Navigator.pop(ctx);
                              launchWhatsApp(phone, text: formatted);
                            },
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  static Widget _buildSelectorOption({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 22),
          ],
        ),
      ),
    );
  }
}
