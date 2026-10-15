import 'package:flutter_test/flutter_test.dart';
import 'package:pro_mobile_app/main.dart';

void main() {
  testWidgets('App smoke test - renders Login Screen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ProDayReportApp(savedSession: {}));
    await tester.pumpAndSettle();

    // Verify that login screen branding renders
    expect(find.text('PRO Day Report'), findsOneWidget);
    expect(find.text('Student Portal'), findsOneWidget);
    expect(find.text('Employee Portal'), findsOneWidget);
  });
}
