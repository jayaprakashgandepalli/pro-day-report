'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, GraduationCap, TrendingUp, Calendar, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    admitted: 0,
    todayFollowups: 0,
    upcomingFollowups: 0,
    addedToday: 0,
  });
  const [groupStats, setGroupStats] = useState<{ name: string; count: number }[]>([]);
  const [interestStats, setInterestStats] = useState<{ name: string; count: number }[]>([]);
  const [collegeStats, setCollegeStats] = useState<{ collegeName: string; count: number }[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchDetailedStats();
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.configs) setConfigs(data.configs);
  };

  const getConfigName = (id: string | null) => {
    if (!id) return id || 'Unknown';
    const conf = configs.find((c: any) => c.id === id || c.value === id);
    return conf ? conf.value : id;
  };

  const fetchDetailedStats = async () => {
    try {
      const res = await fetch('/api/students/stats');
      if (res.ok) {
        const data = await res.json();
        setGroupStats(data.groupStats || []);
        setInterestStats(data.interestStats || []);
        setCollegeStats(data.collegeStats || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [totalRes, admittedRes, todayRes, upcomingRes, addedTodayRes] = await Promise.all([
        fetch('/api/students?page=1&limit=1'),
        fetch('/api/students?page=1&limit=1&admissionStatus=admitted'),
        fetch('/api/students?page=1&limit=1&followup=today'),
        fetch('/api/students?page=1&limit=1&followup=upcoming'),
        fetch(`/api/students?page=1&limit=1&date=${today}`),
      ]);

      const [totalData, admittedData, todayData, upcomingData, addedTodayData] = await Promise.all([
        totalRes.json(), admittedRes.json(), todayRes.json(), upcomingRes.json(), addedTodayRes.json()
      ]);

      setStats({
        total: totalData.total || 0,
        admitted: admittedData.total || 0,
        todayFollowups: todayData.total || 0,
        upcomingFollowups: upcomingData.total || 0,
        addedToday: addedTodayData.total || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Students',
      value: stats.total,
      icon: Users,
      color: '#0F2B47',
      bg: '#e0f2fe',
      link: '/admin/students',
    },
    {
      label: 'Admitted Students',
      value: stats.admitted,
      icon: GraduationCap,
      color: '#166534',
      bg: '#dcfce7',
      link: '/admin/students',
      linkState: 'admitted',
    },
    {
      label: 'Added Today',
      value: stats.addedToday,
      icon: TrendingUp,
      color: '#1e40af',
      bg: '#dbeafe',
      link: '/admin/students',
    },
    {
      label: "Today's Follow-ups",
      value: stats.todayFollowups,
      icon: Calendar,
      color: '#92400e',
      bg: '#fef3c7',
      link: '/employee/followups',
    },
    {
      label: 'Upcoming Follow-ups',
      value: stats.upcomingFollowups,
      icon: Clock,
      color: '#5b21b6',
      bg: '#ede9fe',
      link: '/employee/followups',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Welcome, Admin 👋</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.9rem' }}>Here's a quick overview of your student data.</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card" style={{ height: '110px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.link}
                style={{ textDecoration: 'none' }}
              >
                <div className="card" style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ backgroundColor: card.bg, padding: '0.625rem', borderRadius: '10px', display: 'inline-flex' }}>
                      <Icon size={22} color={card.color} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.375rem', fontWeight: 500 }}>{card.label}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>Quick Links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: '📋 All Students', href: '/admin/students' },
              { label: '✅ Admitted Students', href: '/admin/students' },
              { label: '📅 Follow-ups', href: '/employee/followups' },
              { label: '👤 Manage Users', href: '/admin/users' },
              { label: '📊 Analytics', href: '/analytics' },
            ].map(link => (
              <Link key={link.href + link.label} href={link.href} style={{ display: 'block', padding: '0.625rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#334155', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem', border: '1px solid #e2e8f0', transition: 'background 0.2s' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>Admission Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Admitted</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#166534', marginTop: '0.25rem' }}>{stats.admitted}</div>
            </div>
            <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yet to be Admitted</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e40af', marginTop: '0.25rem' }}>{stats.total - stats.admitted}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Group-wise breakdown */}
      <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>📚 Group-wise Students</h2>
        {groupStats.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {groupStats.map((g) => (
              <div key={g.name} style={{ backgroundColor: '#f8fafc', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>{g.name}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F2B47', lineHeight: 1 }}>{g.count}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>students</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study Interest wise breakdown */}
      {interestStats.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>🎓 Course Interest-wise Students</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {interestStats.map((g) => (
              <div key={g.name} style={{ backgroundColor: '#eff6ff', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>{g.name}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e40af', lineHeight: 1 }}>{g.count}</div>
                <div style={{ fontSize: '0.7rem', color: '#60a5fa', marginTop: '0.2rem' }}>students</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* College-wise breakdown */}
      {collegeStats.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>🏫 College-wise Admitted</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {collegeStats.map((c) => (
              <div key={c.collegeName} style={{ backgroundColor: '#f0fdf4', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginBottom: '0.25rem' }}>{c.collegeName}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#166534', lineHeight: 1 }}>{c.count}</div>
                <div style={{ fontSize: '0.7rem', color: '#4ade80', marginTop: '0.2rem' }}>admitted</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
