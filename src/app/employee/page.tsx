import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserPlus, FileText, CalendarDays, Archive, Briefcase, GraduationCap } from 'lucide-react';
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

  // Fetch configured groups
  const groupConfigs = await prisma.configValue.findMany({
    where: { type: 'GROUP' },
    orderBy: { value: 'asc' }
  });

  // Group stats calculation
  const groupStats = groupConfigs.map(config => {
    // We check both config.id and config.value because Add Student form might have saved either depending on when it was added
    const count = todayStudents.filter(s => s.group === config.id || s.group === config.value).length;
    return { name: config.value, count };
  });

  const matchedStudents = groupStats.reduce((sum, g) => sum + g.count, 0);
  const otherCount = todayStudents.length - matchedStudents;

  // Colorful gradients for the stat cards
  const gradients = [
    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // Blue
    'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Purple
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Orange
    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // Red
    'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Cyan
  ];

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      {/* Header Info */}
      <header className="app-header" style={{ margin: '-1rem -1rem 1.5rem -1rem', borderRadius: '0 0 24px 24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '2rem 1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '1.5rem', fontWeight: 700 }}>Welcome back,</h1>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.25rem' }}>{session.name}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Employee ID: {session.employeeId}</div>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{today.toLocaleDateString('en-GB')}</div>
            <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>{today.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
          </div>
        </div>
      </header>

      {/* Main Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/employee/add" prefetch={false} className="btn btn-primary flex-col gap-2" style={{ height: '110px', fontSize: '0.9rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.5)' }}>
          <UserPlus size={32} />
          <span style={{ fontWeight: 600 }}>Add Student</span>
        </Link>
        <Link href="/employee/today" prefetch={false} className="btn btn-outline flex-col gap-2" style={{ height: '110px', fontSize: '0.9rem', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#fff' }}>
          <CalendarDays size={32} color="#64748b" />
          <span style={{ fontWeight: 600, color: '#475569' }}>Today's Report</span>
        </Link>
        <Link href="/reports/generate" prefetch={false} className="btn btn-outline flex-col gap-2" style={{ height: '110px', fontSize: '0.9rem', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#fff' }}>
          <FileText size={32} color="#10b981" />
          <span style={{ fontWeight: 600, color: '#475569' }}>Generate PDF</span>
        </Link>
      </div>

      {/* Quick Stats - Premium UI */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
            Today's Statistics
          </h2>
          <div style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            {todayStudents.length} Total
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
          {groupStats.map((stat, idx) => (
            <div key={stat.name} style={{ 
              padding: '1rem', 
              background: gradients[idx % gradients.length], 
              borderRadius: '16px', 
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease',
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stat.count}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>{stat.name}</div>
            </div>
          ))}
          
          {otherCount > 0 && (
            <div style={{ 
              padding: '1rem', 
              background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', 
              borderRadius: '16px', 
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{otherCount}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Other</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
