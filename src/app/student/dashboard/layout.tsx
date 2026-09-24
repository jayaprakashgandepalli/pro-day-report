import { getStudentSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/StudentSidebar';
import '../student.css';

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStudentSession();

  if (!session || session.role !== 'STUDENT') {
    redirect('/student/login');
  }

  return (
    <div className="student-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <StudentSidebar sessionName={session.name} />

      {/* Main Content */}
      <main className="student-dashboard-main" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
