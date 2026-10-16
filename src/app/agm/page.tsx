'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  DoorClosed,
  CheckCircle2,
  Clock,
  School,
  Star,
  RefreshCw,
  Search,
  ExternalLink,
  Phone,
  MapPin,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';

export default function AgmDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [staffFilter, setStaffFilter] = useState<'ALL' | 'FIELD' | 'TELECALLER'>('ALL');
  const [searchStaff, setSearchStaff] = useState('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/agm/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to load AGM dashboard data.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error loading AGM dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const kpis = data?.kpis || {
    teamCount: 0,
    fieldStaffCount: 0,
    telecallerCount: 0,
    totalLeads: 0,
    totalDoorstepDone: 0,
    totalDoorstepPending: 0,
    totalAdmissions: 0,
    totalStarLeads: 0,
    catchmentSchoolsCount: 0,
  };

  const staffStats: any[] = data?.staffStats || [];
  const recentVisits: any[] = data?.recentVisits || [];
  const catchmentSchools: any[] = data?.catchmentSchools || [];

  const filteredStaff = staffStats.filter(s => {
    if (staffFilter === 'FIELD' && s.role !== 'EMPLOYEE') return false;
    if (staffFilter === 'TELECALLER' && s.role !== 'TELECALLER') return false;
    if (searchStaff) {
      const q = searchStaff.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchId = (s.employeeId || '').toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  const doorstepPercent = kpis.totalLeads > 0
    ? Math.round((kpis.totalDoorstepDone / kpis.totalLeads) * 100)
    : 0;

  return (
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem 1.75rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0F2B47 0%, #1E3A8A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
            boxShadow: '0 4px 14px rgba(15, 43, 71, 0.25)',
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0F2B47' }}>
                Area Operations Command Center
              </h1>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                border: '1px solid #FDE68A',
              }}>
                AGM / AREA MANAGER
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              Welcome back, <strong>{data?.agm?.name || 'Area Manager'}</strong>! Real-time field activities, doorstep tracking, and admissions conversion overview.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={fetchDashboardStats}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#991B1B', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* 2. Executive KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
      }}>
        {/* KPI 1: My Team */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              My Assigned Team
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F2B47' }}>
            {kpis.teamCount}
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>{kpis.fieldStaffCount} Field</span>
            <span>•</span>
            <span style={{ color: '#7C3AED', fontWeight: 600 }}>{kpis.telecallerCount} Telecallers</span>
          </div>
        </div>

        {/* KPI 2: Total Leads */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Team Leads
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F2B47' }}>
            {kpis.totalLeads}
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748B' }}>
            Captured by staff under this AGM
          </div>
        </div>

        {/* KPI 3: Doorstep Visits Done */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Doorstep Visits
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16A34A' }}>
              {kpis.totalDoorstepDone}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              / {kpis.totalLeads} ({doorstepPercent}%)
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '999px', marginTop: '0.6rem', overflow: 'hidden' }}>
            <div style={{ width: `${doorstepPercent}%`, height: '100%', backgroundColor: '#16A34A', borderRadius: '999px' }} />
          </div>
        </div>

        {/* KPI 4: Admissions Converted */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admissions Converted
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#D97706' }}>
            {kpis.totalAdmissions}
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748B' }}>
            Confirmed joined students
          </div>
        </div>

        {/* KPI 5: Star / Prime Leads */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              High-Potential Leads
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FDF4FF', color: '#C026D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#C026D3' }}>
            {kpis.totalStarLeads}
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748B' }}>
            Top marks & prime prospects
          </div>
        </div>
      </div>

      {/* 3. Team Performance Matrix (Main Table) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F2B47' }}>
              Staff Performance & Progress Matrix ({staffStats.length})
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Real-time activity and lead conversions for each staff member assigned to your jurisdiction.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search staff by name or ID..."
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  outline: 'none',
                  minWidth: '220px',
                }}
              />
            </div>

            {/* Role Filter Tabs */}
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '0.2rem', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setStaffFilter('ALL')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: staffFilter === 'ALL' ? 700 : 500,
                  backgroundColor: staffFilter === 'ALL' ? '#ffffff' : 'transparent',
                  color: staffFilter === 'ALL' ? '#0F2B47' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: staffFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                All Staff
              </button>
              <button
                type="button"
                onClick={() => setStaffFilter('FIELD')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: staffFilter === 'FIELD' ? 700 : 500,
                  backgroundColor: staffFilter === 'FIELD' ? '#ffffff' : 'transparent',
                  color: staffFilter === 'FIELD' ? '#0F2B47' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: staffFilter === 'FIELD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Field Staff
              </button>
              <button
                type="button"
                onClick={() => setStaffFilter('TELECALLER')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: staffFilter === 'TELECALLER' ? 700 : 500,
                  backgroundColor: staffFilter === 'TELECALLER' ? '#ffffff' : 'transparent',
                  color: staffFilter === 'TELECALLER' ? '#0F2B47' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: staffFilter === 'TELECALLER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Telecallers
              </button>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Staff Member</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Role</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Assigned Schools</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Total Leads</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Doorsteps (Done / Pending)</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Admitted</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Star Leads</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                    No staff members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0F2B47' }}>{staff.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {staff.employeeId}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: staff.role === 'EMPLOYEE' ? '#ECFDF5' : '#F5F3FF',
                        color: staff.role === 'EMPLOYEE' ? '#047857' : '#6D28D9',
                        border: `1px solid ${staff.role === 'EMPLOYEE' ? '#A7F3D0' : '#DDD6FE'}`,
                      }}>
                        {staff.role === 'EMPLOYEE' ? 'Field Staff' : 'Telecaller'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {staff.assignedSchoolNames.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 600, color: '#0F2B47' }}>
                            {staff.assignedSchoolNames.length} {staff.assignedSchoolNames.length === 1 ? 'School' : 'Schools'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {staff.assignedSchoolNames.join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                          No Schools Assigned
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F2B47' }}>
                      {staff.totalLeads}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, color: '#16A34A' }}>{staff.doorstepDone}</span>
                        <span style={{ color: '#94A3B8' }}>/</span>
                        <span style={{ fontWeight: 600, color: '#EA580C' }}>{staff.doorstepPending}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#D97706' }}>
                      {staff.admitted}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#C026D3' }}>
                      {staff.starLeads}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: staff.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: staff.isActive ? '#15803D' : '#991B1B',
                      }}>
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Grid: Recent Doorsteps & Catchment Schools */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Card A: Recent Doorstep Visits Live Feed */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F2B47' }}>
                Recent Team Doorsteps
              </h3>
            </div>
            <Link
              href="/agm/students"
              style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto' }}>
            {recentVisits.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                No doorstep visits recorded yet by your team.
              </div>
            ) : (
              recentVisits.map((v, i) => (
                <div key={i} style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#0F2B47', fontSize: '0.88rem' }}>{v.studentName}</span>
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                        {v.staffName}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                      {v.schoolName} • {v.village}
                    </div>
                    {v.remarks && (
                      <div style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic', marginTop: '0.2rem' }}>
                        &ldquo;{v.remarks}&rdquo;
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <Calendar size={12} />
                      {v.visitDate ? new Date(v.visitDate).toLocaleDateString() : '-'}
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginTop: '0.25rem',
                    }}>
                      Doorstep Done
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card B: Catchment Schools Coverage */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <School size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F2B47' }}>
                Assigned Catchment Schools ({catchmentSchools.length})
              </h3>
            </div>
            <Link
              href="/agm/schools"
              style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              Manage Schools <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto' }}>
            {catchmentSchools.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                No catchment schools currently assigned to your team members.
              </div>
            ) : (
              catchmentSchools.map((sc) => {
                const coveragePercent = sc.strength > 0
                  ? Math.min(100, Math.round((sc.collectedCount / sc.strength) * 100))
                  : 0;
                return (
                  <div key={sc.id} style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F2B47', fontSize: '0.88rem' }}>{sc.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                          Assigned Staff: <strong>{sc.staffAssigned.join(', ') || 'Unassigned'}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>
                          {sc.collectedCount} <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>/ {sc.strength || 'N/A'}</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                          {coveragePercent}% Covered
                        </div>
                      </div>
                    </div>

                    {sc.strength > 0 && (
                      <div style={{ width: '100%', height: '5px', backgroundColor: '#E2E8F0', borderRadius: '999px', marginTop: '0.6rem', overflow: 'hidden' }}>
                        <div style={{ width: `${coveragePercent}%`, height: '100%', backgroundColor: '#059669', borderRadius: '999px' }} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
