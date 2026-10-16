'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  Search,
  CheckCircle2,
  GraduationCap,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  School,
  Clock,
  Printer
} from 'lucide-react';

export default function AgmReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FIELD' | 'TELECALLER'>('ALL');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/agm/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load team report data');
      }
    } catch (e) {
      console.error(e);
      setError('Connection error loading team reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const staffList = (data?.staffStats || []).filter((s: any) => {
    if (roleFilter === 'FIELD' && s.role !== 'EMPLOYEE') return false;
    if (roleFilter === 'TELECALLER' && s.role !== 'TELECALLER') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchId = s.employeeId?.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '1.25rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link
          href="/agm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#334155',
            textDecoration: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        <button
          type="button"
          onClick={fetchStats}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#475569',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          <FileText size={16} />
          <span>Team Operations & Visits Tracking</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0F2B47' }}>
          Team Reports ({staffList.length} Members)
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.86rem' }}>
          Select a team member from the list below to view their daily village visits, admissions, and date-to-date activity report.
        </p>
      </div>

      {/* Search & Role Filter Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '0.85rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        {/* Role Pills */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {(['ALL', 'FIELD', 'TELECALLER'] as const).map(role => {
            const active = roleFilter === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                style={{
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: active ? '1px solid #047857' : '1px solid #e2e8f0',
                  backgroundColor: active ? '#047857' : '#f8fafc',
                  color: active ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {role === 'ALL' ? 'All Roles' : role === 'FIELD' ? 'Field Staff' : 'Telecallers'}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '340px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search member by name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              color: '#0F2B47',
            }}
          />
        </div>
      </div>

      {/* Team Members List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
          <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#047857' }} />
          <p style={{ margin: 0, fontWeight: 700 }}>Loading team members list...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <Users size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ color: '#0F2B47', fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
            No Team Members Found
          </p>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
            {searchQuery ? 'Try clearing your search query.' : 'No staff members assigned under your AGM cluster.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {staffList.map((member: any) => {
            const isField = member.role !== 'TELECALLER';

            return (
              <Link
                key={member.id || member.employeeId}
                href={`/agm/reports/staff?staffId=${member.employeeId}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '1.15rem 1.25rem',
                  textDecoration: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                }}
              >
                {/* Left: Avatar & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: isField ? '#ecfdf5' : '#f3e8ff',
                    border: `1px solid ${isField ? '#a7f3d0' : '#e9d5ff'}`,
                    color: isField ? '#047857' : '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}>
                    {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F2B47' }}>
                        {member.name}
                      </span>
                      <span style={{
                        backgroundColor: isField ? '#ecfdf5' : '#f3e8ff',
                        color: isField ? '#047857' : '#7c3aed',
                        border: `1px solid ${isField ? '#a7f3d0' : '#e9d5ff'}`,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '6px',
                      }}>
                        {isField ? '🏃 Field Staff' : '🎧 Telecaller'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span>Login ID: <strong style={{ color: '#0F2B47' }}>{member.employeeId}</strong></span>
                      {member.schools && (
                        <span>• 🏫 <strong>{member.schools.length}</strong> Schools</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                  {/* Metric Badges */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '0.35rem 0.65rem',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.66rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
                        Doorsteps
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#15803d' }}>
                        {member.doorstepDone || 0}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#faf5ff',
                      border: '1px solid #e9d5ff',
                      borderRadius: '8px',
                      padding: '0.35rem 0.65rem',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.66rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>
                        Admitted
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#6b21a8' }}>
                        {member.admitted || 0}
                      </div>
                    </div>
                  </div>

                  {/* Forward Arrow Button */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#047857',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
