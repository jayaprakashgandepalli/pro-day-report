import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, UserCheck, TrendingUp, ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0,0,0,0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalEmployees, totalStudents, todayLeads, weekLeads, monthLeads] = await Promise.all([
    prisma.user.count({ where: { role: 'EMPLOYEE' } }),
    prisma.student.count(),
    prisma.student.count({ where: { createdAt: { gte: today } } }),
    prisma.student.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.student.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" className="btn-icon">
          <ArrowLeft />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Admin Dashboard</h1>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Overview & Statistics</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Users size={32} style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalEmployees}</div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Employees</div>
        </div>
        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <UserCheck size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalStudents}</div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Students</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} /> Leads Overview
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--bg-color)' }}>
          <span style={{ fontWeight: 500 }}>Today's Leads</span>
          <span className="badge badge-success">{todayLeads}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--bg-color)' }}>
          <span style={{ fontWeight: 500 }}>This Week</span>
          <span className="badge badge-warning">{weekLeads}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
          <span style={{ fontWeight: 500 }}>This Month</span>
          <span className="badge badge-neutral" style={{ backgroundColor: '#e2e8f0' }}>{monthLeads}</span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>Manage Employees (Coming Soon)</button>
          <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>View All Reports (Coming Soon)</button>
          <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>Export Data to CSV (Coming Soon)</button>
        </div>
      </div>
    </div>
  );
}
