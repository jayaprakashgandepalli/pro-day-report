import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/whatsapp_template_service.dart';

class WhatsAppTemplatesScreen extends StatefulWidget {
  final String? employeeName;
  final String? employeePhone;

  const WhatsAppTemplatesScreen({
    super.key,
    this.employeeName,
    this.employeePhone,
  });

  @override
  State<WhatsAppTemplatesScreen> createState() => _WhatsAppTemplatesScreenState();
}

class _WhatsAppTemplatesScreenState extends State<WhatsAppTemplatesScreen> {
  List<WhatsAppTemplateItem> _templates = [];
  String _pamphletUrl = WhatsAppTemplateService.defaultPamphletUrl;
  String _collegeName = WhatsAppTemplateService.defaultCollegeName;
  bool _isLoading = true;

  final _pamphletController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _pamphletController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final list = await WhatsAppTemplateService.getTemplates();
    final url = await WhatsAppTemplateService.getPamphletUrl();
    final cName = await WhatsAppTemplateService.getCollegeName();
    _pamphletController.text = url;
    if (mounted) {
      setState(() {
        _templates = list;
        _pamphletUrl = url;
        _collegeName = cName;
        _isLoading = false;
      });
    }
  }

  Future<void> _savePamphletUrl() async {
    final url = _pamphletController.text.trim();
    await WhatsAppTemplateService.savePamphletUrl(url);
    setState(() => _pamphletUrl = url);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('పాంప్లెట్ లింక్ విజయవంతంగా సేవ్ చేయబడింది! 🎉'),
          backgroundColor: Color(0xFF059669),
        ),
      );
    }
  }

  void _openTemplateEditor({WhatsAppTemplateItem? template}) {
    final isEditing = template != null;
    final titleController = TextEditingController(text: template?.title ?? '');
    final msgController = TextEditingController(text: template?.message ?? '');

    void insertTag(String tag) {
      final text = msgController.text;
      final selection = msgController.selection;
      if (selection.start >= 0 && selection.end >= 0) {
        final newText = text.replaceRange(selection.start, selection.end, tag);
        msgController.value = TextEditingValue(
          text: newText,
          selection: TextSelection.collapsed(offset: selection.start + tag.length),
        );
      } else {
        msgController.text = '$text $tag';
      }
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Container(
              height: MediaQuery.of(ctx).size.height * 0.88,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 16,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Drag Handle
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isEditing ? 'Edit Template' : 'Add New Template',
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: Color(0xFF94A3B8)),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. User-defined Template Name
                          Text(
                            'Template Name (టెంప్లేట్ పేరు):',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: titleController,
                            decoration: InputDecoration(
                              hintText: 'ఉదా: హాస్టల్ & ఫీజు వివరాలు',
                              hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Smart Tag Helper Chips
                          Text(
                            'స్మార్ట్ ట్యాగ్స్ (నొక్కితే ఆటోమేటిక్‌గా యాడ్ అవుతాయి):',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              _buildTagChip('+ కాలేజీ పేరు', '{collegeName}', insertTag),
                              _buildTagChip('+ తండ్రి పేరు', '{parentName}', insertTag),
                              _buildTagChip('+ స్టూడెంట్ పేరు', '{studentName}', insertTag),
                              _buildTagChip('+ పాంప్లెట్ లింక్', '{pamphletLink}', insertTag),
                              _buildTagChip('+ నా పేరు', '{employeeName}', insertTag),
                              _buildTagChip('+ నా ఫోన్', '{employeePhone}', insertTag),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // 2. Message Content
                          Text(
                            'Telugu Message Content (తెలుగు మెసేజ్):',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: msgController,
                            maxLines: 10,
                            style: GoogleFonts.inter(fontSize: 13, height: 1.5),
                            decoration: InputDecoration(
                              hintText: 'నమస్కారం {parentName} గారూ! మీ అబ్బాయి/అమ్మాయి {studentName} గారి...',
                              hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5)),
                              contentPadding: const EdgeInsets.all(14),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () async {
                        final title = titleController.text.trim();
                        final msg = msgController.text.trim();
                        if (title.isEmpty || msg.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('దయచేసి టెంప్లేట్ పేరు మరియు మెసేజ్ రెండూ ఎంటర్ చేయండి.'),
                              backgroundColor: Color(0xFFDC2626),
                            ),
                          );
                          return;
                        }

                        await WhatsAppTemplateService.saveTemplate(
                          id: template?.id,
                          title: title,
                          message: msg,
                        );

                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadData();

                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('టెంప్లేట్ "$title" సేవ్ చేయబడింది! 🎉'),
                              backgroundColor: const Color(0xFF059669),
                            ),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: Text(
                        isEditing ? 'Save Changes' : 'Add Template',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildTagChip(String label, String tag, Function(String) onTap) {
    return InkWell(
      onTap: () => onTap(tag),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFEEF2FF),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFC7D2FE)),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF4338CA),
          ),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(WhatsAppTemplateItem tpl) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Delete Template?', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: Text('మీరు నిజంగా "${tpl.title}" టెంప్లేట్‌ను తొలగించాలనుకుంటున్నారా?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await WhatsAppTemplateService.deleteTemplate(tpl.id);
      _loadData();
    }
  }

  Future<void> _confirmReset() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Reset All Templates?', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: const Text('అన్ని టెంప్లేట్‌లను ఒరిజినల్ డీఫాల్ట్ మెసేజ్‌లకు రీసెట్ చేయమంటారా?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5), foregroundColor: Colors.white),
            child: const Text('Reset'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await WhatsAppTemplateService.resetToDefaults();
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('అన్ని టెంప్లేట్‌లు రీసెట్ చేయబడ్డాయి!'),
            backgroundColor: Color(0xFF059669),
          ),
        );
      }
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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'WhatsApp Templates',
              style: GoogleFonts.outfit(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            Text(
              'పాంప్లెట్ లింక్ & మెసేజ్ సెట్టింగ్స్',
              style: GoogleFonts.inter(
                color: const Color(0xFF64748B),
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B)),
            tooltip: 'Reset to Defaults',
            onPressed: _confirmReset,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. 4-Page Pamphlet Link Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEEF2FF),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFF4F46E5), size: 20),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '4-Page College Pamphlet Link',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  Text(
                                    'పేరెంట్స్‌కి వాట్సాప్‌లో వెళ్ళే బ్రోచర్ లింక్',
                                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _pamphletController,
                                style: GoogleFonts.inter(fontSize: 12),
                                decoration: InputDecoration(
                                  hintText: 'https://...',
                                  filled: true,
                                  fillColor: const Color(0xFFF8FAFC),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: _savePamphletUrl,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF4F46E5),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              ),
                              child: const Text('Save'),
                            ),
                            const SizedBox(width: 4),
                            IconButton(
                              icon: const Icon(Icons.open_in_new_rounded, color: Color(0xFF4F46E5), size: 20),
                              tooltip: 'Open Link to Test',
                              onPressed: () async {
                                final uri = Uri.parse(_pamphletController.text.trim());
                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                                }
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Employee Profile College Card
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFC7D2FE)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4F46E5),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'కాలేజీ పేరు (Employee Profile నుండి):',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF6366F1),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _collegeName.isEmpty
                                    ? WhatsAppTemplateService.defaultCollegeName
                                    : _collegeName,
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF1E1B4B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // 3. Templates Section Header + Add Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'మీ మెసేజ్ టెంప్లేట్లు (${_templates.length})',
                            style: GoogleFonts.outfit(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'పేరు మరియు టెక్స్ట్ మీ ఇష్టం వచ్చినట్లు పెట్టుకోవచ్చు',
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () => _openTemplateEditor(),
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text('Add Template'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // 3. List of Template Cards
                  ..._templates.asMap().entries.map((entry) {
                    final index = entry.key;
                    final tpl = entry.value;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Template Title + Edit & Delete
                          Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: Text(
                                    '${index + 1}',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF16A34A),
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  tpl.title,
                                  style: GoogleFonts.outfit(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.edit_outlined, size: 18, color: Color(0xFF4F46E5)),
                                tooltip: 'Edit Template',
                                onPressed: () => _openTemplateEditor(template: tpl),
                              ),
                              if (_templates.length > 1)
                                IconButton(
                                  icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFDC2626)),
                                  tooltip: 'Delete Template',
                                  onPressed: () => _confirmDelete(tpl),
                                ),
                            ],
                          ),
                          const Divider(height: 18, color: Color(0xFFF1F5F9)),

                          // Telugu Message Preview
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFF1F5F9)),
                            ),
                            child: Text(
                              tpl.message,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                height: 1.5,
                                color: const Color(0xFF334155),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Quick Test button
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              onPressed: () {
                                final preview = WhatsAppTemplateService.formatMessage(
                                  tpl.message,
                                  studentName: 'రమేష్ (Sample)',
                                  parentName: 'సురేష్ (Sample)',
                                  employeeName: widget.employeeName ?? 'PRO Officer',
                                  employeePhone: widget.employeePhone ?? '9876543210',
                                  collegeName: _collegeName,
                                  pamphletUrl: _pamphletUrl,
                                );
                                showDialog(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    title: Text(tpl.title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                                    content: SingleChildScrollView(
                                      child: Text(preview, style: GoogleFonts.inter(fontSize: 12, height: 1.5)),
                                    ),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
                                    ],
                                  ),
                                );
                              },
                              icon: const Icon(Icons.visibility_outlined, size: 16, color: Color(0xFF64748B)),
                              label: Text(
                                'Preview with Sample Names',
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }
}
