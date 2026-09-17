import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserPlus, FileText, CalendarDays, Archive, Briefcase, GraduationCap, Users } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all students for the employee
  const allStudents = await prisma.student.findMany({
    where: {
      employeeId: session.employeeId,
    },
  });

  // Fetch all configs to resolve names
  const allConfigs = await prisma.configValue.findMany();
  const configMap = allConfigs.reduce((acc, c) => ({...acc, [c.id]: c.value}), {} as Record<string, string>);
  const resolveName = (id: string | null) => id ? (configMap[id] || id) : '';

  // Prime Students Calculation
  const primeStudentsCount = allStudents.filter(s => {
    const interest = resolveName(s.studyInterestedAt).toLowerCase();
    const fee = resolveName(s.ableToBearFee).toLowerCase();
    const g = resolveName(s.group).toUpperCase();
    
    const isVizag = interest.includes('vizag') || interest.includes('visakhapatnam');
    const isBearable = fee.includes('yes') || fee.includes('bearable');
    const isTargetGroup = g.includes('MPC') || g.includes('BIPC');
    
    return isVizag && isBearable && isTargetGroup;
  }).length;

  // Fetch configured groups
  const groupConfigs = await prisma.configValue.findMany({
    where: { type: 'GROUP' },
    orderBy: { value: 'asc' }
  });

  // Groups to hide from individual rows and merge into "Other"
  const hiddenGroups = ['CEC', 'HEC'];

  // Group stats calculation (only for visible groups)
  const visibleGroupConfigs = groupConfigs.filter(
    config => !hiddenGroups.includes(config.value.toUpperCase())
  );

  const groupStats = visibleGroupConfigs.map(config => {
    // We check both config.id and config.value because Add Student form might have saved either depending on when it was added
    const count = allStudents.filter(s => s.group === config.id || s.group === config.value).length;
    return { name: config.value, count };
  });

  const matchedStudents = groupStats.reduce((sum, g) => sum + g.count, 0);
  const otherCount = allStudents.length - matchedStudents;
  const doorstepsNotCompletedCount = allStudents.filter(s => !s.doorstepCompleted).length;

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const pendingFollowupsCount = await prisma.student.count({
    where: {
      employeeId: session.employeeId,
      AND: [
        {
          OR: [
            { nextFollowUpType: 'Date', nextFollowUpDate: { lte: endOfToday } },
            { nextFollowUpType: null, nextFollowUpDate: { lte: endOfToday } }
          ]
        }
      ]
    }
  });

  // Colorful text colors for the stat cards
  const textColors = [
    '#2563eb', // Blue
    '#059669', // Green
    '#7c3aed', // Purple
    '#d97706', // Orange
    '#dc2626', // Red
    '#0891b2', // Cyan
  ];

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      {/* Header Info */}
      <header className="app-header" style={{ margin: '-1rem -1rem 2rem -1rem', borderRadius: '0 0 32px 32px', background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)', padding: '2.5rem 1.5rem', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-20px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '1.5rem', fontWeight: 700 }}>Welcome back,</h1>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.25rem' }}>{session.name}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Employee ID: {session.employeeId}</div>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{today.toLocaleDateString('en-GB')}</div>
            <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{today.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
          </div>
        </div>
      </header>

      {/* Main Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        <Link href="/employee/add" prefetch={false} className="btn" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: '90px', borderRadius: '24px', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', border: 'none', boxShadow: '0 10px 25px -5px rgba(37,99,235,0.4)', transition: 'transform 0.2s' }}>
          <UserPlus size={28} />
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.02em' }}>Add New Student</span>
        </Link>
        <Link href="/employee/students" prefetch={false} className="btn flex-col gap-2" style={{ height: '120px', borderRadius: '24px', background: '#ffffff', color: '#334155', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)', transition: 'transform 0.2s' }}>
          <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '16px', color: '#64748b' }}><Users size={28} /></div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>All Students</span>
        </Link>
        <Link href="/employee/followups" prefetch={false} className="btn flex-col gap-2" style={{ height: '120px', borderRadius: '24px', background: '#ffffff', color: '#334155', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)', position: 'relative', transition: 'transform 0.2s' }}>
          <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '16px', color: '#ef4444' }}><CalendarDays size={28} /></div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Follow-ups</span>
          {pendingFollowupsCount > 0 && (
            <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#ef4444', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}>
              {pendingFollowupsCount}
            </span>
          )}
        </Link>
        <Link href="/employee/students?preset=prime" prefetch={false} className="btn flex-col gap-2" style={{ height: '120px', borderRadius: '24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none', boxShadow: '0 10px 25px -5px rgba(217,119,6,0.4)', position: 'relative', transition: 'transform 0.2s' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '16px', color: '#fff', fontSize: '1.5rem', lineHeight: 1 }}>🔥</div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Hot Prospects</span>
          <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#fff', color: '#d97706', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {primeStudentsCount}
          </span>
        </Link>
        <Link href="/reports/generate" prefetch={false} className="btn flex-col gap-2" style={{ height: '120px', borderRadius: '24px', background: '#ffffff', color: '#334155', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)', transition: 'transform 0.2s' }}>
          <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '16px', color: '#10b981' }}><FileText size={28} /></div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Generate PDF</span>
        </Link>
      </div>

      {/* Quick Stats - Premium List UI */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              Overall Statistics
            </h2>
            <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Real-time enrollment metrics
            </div>
          </div>
          <div style={{ background: '#ecfdf5', color: '#059669', padding: '0.4rem 0.8rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #a7f3d0' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
            {allStudents.length} Total
          </div>
        </div>
        
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          {/* Helper function to get styling based on group name */}
          {(() => {
            const getStyle = (name: string) => {
              const n = name.toUpperCase();
              if (n.includes('BIPC')) return { abbr: 'BI', sub: 'Biology & Physical Science', bg: '#eff6ff', color: '#3b82f6' };
              if (n.includes('CEC')) return { abbr: 'CE', sub: 'Commerce, Economics, Civics', bg: '#f8fafc', color: '#64748b' };
              if (n.includes('HEC')) return { abbr: 'HE', sub: 'History, Economics, Civics', bg: '#faf5ff', color: '#a855f7' };
              if (n.includes('MPC')) return { abbr: 'MP', sub: 'Mathematics, Physics, Chemistry', bg: '#fffbeb', color: '#d97706' };
              if (n.includes('CLARITY')) return { abbr: '●', sub: 'Awaiting student confirmation', bg: '#fefce8', color: '#eab308' };
              if (n === 'OTHER' || n === 'OTHER GROUPS') return { abbr: 'OT', sub: 'Miscellaneous groups', bg: '#f1f5f9', color: '#475569' };
              if (n === 'DOORSTEP PENDING') return { abbr: 'DP', sub: 'Action required', bg: '#fff1f2', color: '#e11d48' };
              return { abbr: name.substring(0, 2).toUpperCase(), sub: 'Group metrics', bg: '#f0fdf4', color: '#22c55e' };
            };

            const allRows = [
              ...groupStats.map(stat => ({ name: stat.name, count: stat.count })),
              { name: 'Other Groups', count: otherCount },
              { name: 'Doorstep Pending', count: doorstepsNotCompletedCount }
            ];

            return allRows.map((stat, idx) => {
              const style = getStyle(stat.name);
              return (
                <div key={stat.name} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderBottom: idx < allRows.length - 1 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '42px', height: '42px', borderRadius: '50%', 
                      background: style.bg, color: style.color, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.9rem', border: `1px solid ${style.bg.replace('f', 'e')}`
                    }}>
                      {style.abbr}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{stat.name.toUpperCase()}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>{style.sub}</div>
                    </div>
                  </div>
                  <div style={{ 
                    background: style.bg, color: style.color,
                    padding: '0.3rem 0.8rem', borderRadius: '12px',
                    fontWeight: 700, fontSize: '1rem'
                  }}>
                    {stat.count}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
