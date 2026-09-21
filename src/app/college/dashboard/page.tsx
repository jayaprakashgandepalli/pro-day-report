'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, GraduationCap, Calendar, Clock, CheckCircle } from 'lucide-react';

export default function CollegeDashboard() {
  const [collegeName, setCollegeName] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    admitted: 0,
    todayFollowups: 0,
    upcomingFollowups: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.user?.name) setCollegeName(data.user.name); })
      .catch(console.error);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [totalRes, admittedRes, todayRes, upcomingRes] = await Promise.all([
        fetch('/api/students?page=1&limit=1'),
        fetch('/api/students?page=1&limit=1&admissionStatus=admitted'),
        fetch('/api/students?page=1&limit=1&followup=today'),
        fetch('/api/students?page=1&limit=1&followup=upcoming'),
      ]);

      const [totalData, admittedData, todayData, upcomingData] = await Promise.all([
        totalRes.json(), admittedRes.json(), todayRes.json(), upcomingRes.json()
      ]);

      const total = totalData.total || 0;
      const admitted = admittedData.total || 0;
      setStats({
        total,
        admitted,
        todayFollowups: todayData.total || 0,
        upcomingFollowups: upcomingData.total || 0,
        pending: total - admitted,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Leads', value: stats.total, icon: Users, color: '#0F2B47', bg: '#e0f2fe', link: '/college/students' },
    { label: 'Admitted', value: stats.admitted, icon: CheckCircle, color: '#166534', bg: '#dcfce7', link: '/college/students' },
    { label: 'Pending', value: stats.pending, icon: GraduationCap, color: '#9a3412', bg: '#ffedd5', link: '/college/students' },
    { label: "Today's Follow-ups", value: stats.todayFollowups, icon: Calendar, color: '#92400e', bg: '#fef3c7', link: '/college/followups' },
    { label: 'Upcoming Follow-ups', value: stats.upcomingFollowups, icon: Clock, color: '#5b21b6', bg: '#ede9fe', link: '/college/followups' },
  ];

  return (
    <div style={{ padding: '0.5rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
          Welcome 👋
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          {collegeName || 'College Portal'} — Student Overview
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '100px', backgroundColor: '#f1f5f9', borderRadius: '12px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.link} style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)')}
                >
                  <div style={{ backgroundColor: card.bg, padding: '0.5rem', borderRadius: '8px', display: 'inline-flex', marginBottom: '0.75rem' }}>
                    <Icon size={20} color={card.color} />
                  </div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>{card.label}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Summary Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>⚡ Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { label: '📋 View All Student Leads', href: '/college/students' },
              { label: '✅ View Admitted Students', href: '/college/students' },
              { label: '📅 Today\'s Follow-ups', href: '/college/followups' },
              { label: '⏰ Upcoming Follow-ups', href: '/college/followups' },
            ].map(link => (
              <Link key={link.label} href={link.href} style={{ display: 'block', padding: '0.625rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#334155', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem', border: '1px solid #e2e8f0' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>🎓 Admission Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admitted</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#166534', marginTop: '0.25rem', lineHeight: 1 }}>{stats.admitted}</div>
            </div>
            <div style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: '0.7rem', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9a3412', marginTop: '0.25rem', lineHeight: 1 }}>{stats.pending}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
