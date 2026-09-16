import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserPlus, FileText, CalendarDays, Archive } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch today's students for the employee
  const todayStudents = await prisma.student.findMany({
    where: {
      employeeId: session.employeeId,
      createdAt: {
        gte: today,
      },
    },
  });

  const mpcCount = todayStudents.filter(s => s.group === 'MPC').length;
  const bipcCount = todayStudents.filter(s => s.group === 'BiPC').length;
  const mecCount = todayStudents.filter(s => s.group === 'MEC').length;
  const cecCount = todayStudents.filter(s => s.group === 'CEC').length;
  const otherCount = todayStudents.length - (mpcCount + bipcCount + mecCount + cecCount);

  return (
    <div className="container">
      {/* Header Info */}
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
        <h1 className="app-brand" style={{ marginBottom: '0.25rem' }}>Sri Vaatsalya</h1>
        <div className="flex justify-between items-center">
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{session.name}</div>
            <div className="text-muted">{session.employeeId}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{today.toLocaleDateString('en-GB')}</div>
            <div className="text-muted">{today.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
          </div>
        </div>
      </header>

      {/* Main Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link href="/students/add" className="btn btn-primary flex-col gap-2" style={{ height: '100px', fontSize: '0.875rem' }}>
          <UserPlus size={28} />
          <span>Add Student</span>
        </Link>
        <Link href="/reports/today" className="btn btn-outline flex-col gap-2" style={{ height: '100px', fontSize: '0.875rem' }}>
          <CalendarDays size={28} />
          <span>Today's Report</span>
        </Link>
        <Link href="/reports/generate" className="btn btn-outline flex-col gap-2" style={{ height: '100px', fontSize: '0.875rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>
          <FileText size={28} />
          <span>Generate PDF</span>
        </Link>
        <Link href="/reports" className="btn btn-outline flex-col gap-2" style={{ height: '100px', fontSize: '0.875rem' }}>
          <Archive size={28} />
          <span>My Reports</span>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Today's Statistics
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Students Entered</span>
          <span className="badge badge-success" style={{ fontSize: '1.1rem' }}>{todayStudents.length}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{mpcCount}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>MPC</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{bipcCount}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>BiPC</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{mecCount}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>MEC</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{cecCount}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>CEC</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{otherCount}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Other</div>
          </div>
        </div>
      </div>
    </div>
  );
}
