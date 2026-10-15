import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/student/student_dashboard_screen.dart';
import 'screens/employee/employee_dashboard_screen.dart';

import 'services/offline_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Initialize persistent offline storage & in-memory cache
  await OfflineService.init();
  final session = await ApiService.getSession();

  // Background pre-warm configs & sync any pending offline items
  ApiService.getConfigsList();
  ApiService.syncPendingOfflineActions();

  runApp(ProDayReportApp(savedSession: session));
}

class ProDayReportApp extends StatelessWidget {
  final Map<String, String?> savedSession;

  const ProDayReportApp({super.key, required this.savedSession});

  @override
  Widget build(BuildContext context) {
    Widget initialScreen = const LoginScreen();

    final role = savedSession['role'];
    final name = savedSession['name'] ?? 'User';
    final id = savedSession['identifier'] ?? '';

    if (role == 'STUDENT') {
      initialScreen = StudentDashboardScreen(studentName: name);
    } else if (role != null && role != 'STUDENT' && role.isNotEmpty) {
      initialScreen = EmployeeDashboardScreen(employeeName: name, employeeId: id);
    }

    return MaterialApp(
      title: 'PRO Day Report',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          primary: const Color(0xFF4F46E5),
        ),
        textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme),
      ),
      home: initialScreen,
    );
  }
}
