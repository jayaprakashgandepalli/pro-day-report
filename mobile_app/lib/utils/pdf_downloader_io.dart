import 'dart:typed_data';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';

Future<void> downloadPdfFile(Uint8List bytes, String filename) async {
  try {
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => bytes,
      name: filename,
    );
  } catch (_) {
    await Printing.sharePdf(bytes: bytes, filename: filename);
  }
}
