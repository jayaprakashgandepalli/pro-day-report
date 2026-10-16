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
  Calendar,
  FileText,
  X
} from 'lucide-react';

export default function AgmDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [staffFilter, setStaffFilter] = useState<'ALL' | 'FIELD' | 'TELECALLER'>('ALL');
  const [searchStaff, setSearchStaff] = useState('');

  // Detailed Modal State
  const [selectedStaffForReport, setSelectedStaffForReport] = useState<any | null>(null);
  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');

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

  const handleOpenStaffReport = (staff: any) => {
    setSelectedStaffForReport(staff);
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
    const from = past.toISOString().split('T')[0];
    setReportToDate(to);
    setReportFromDate(from);
  };

  const setQuickDateRange = (days: number | 'MONTH' | 'ALL') => {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    setReportToDate(to);

    if (days === 'ALL') {
      setReportFromDate('');
      return;
    }
    if (days === 'MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setReportFromDate(startOfMonth.toISOString().split('T')[0]);
      return;
    }
    const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
    setReportFromDate(past.toISOString().split('T')[0]);
  };

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
    total10thStrength: 0,
    remainingToCollect: 0,
    overallCoverageRate: 0,
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

  return (
    <div className="agm-page-container">
      <style dangerouslySetInnerHTML={{__html: `
        .agm-page-container {
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 1440px;
          margin: 0 auto;
        }
        .agm-hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .agm-modal-card {
          background-color: #ffffff;
          border-radius: 18px;
          width: 96%;
          max-width: 1380px;
          max-height: 94vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        @media (max-width: 1024px) {
          .agm-hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 767px) {
          .agm-page-container {
            padding: 0.85rem 0.75rem !important;
            gap: 0.85rem !important;
          }
          .agm-hero-stats {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.65rem !important;
          }
          .agm-modal-card {
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}} />
      
      {error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#991B1B', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* The 4 Focused KPI Cards (Classy Design) */}
      <div className="agm-hero-stats">
        {/* Card 1: 10TH POOL STRENGTH */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #0F2B47',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px -2px rgba(15, 43, 71, 0.06)',
        }}>
          <div style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
            10TH POOL STRENGTH
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0F2B47', margin: '0.35rem 0' }}>
            {kpis.total10thStrength || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
            Across {kpis.catchmentSchoolsCount || 0} Assigned Schools
          </div>
        </div>

        {/* Card 2: COLLECTED STUDENT DATA */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #10B981',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px -2px rgba(16, 185, 129, 0.08)',
        }}>
          <div style={{ fontSize: '0.74rem', color: '#059669', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
            COLLECTED STUDENT DATA
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#059669', margin: '0.35rem 0' }}>
            {kpis.totalLeads}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
            {kpis.totalDoorstepDone} Doorsteps Done
          </div>
        </div>

        {/* Card 3: UNCOLLECTED (PENDING) */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #F43F5E',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px -2px rgba(244, 63, 94, 0.08)',
        }}>
          <div style={{ fontSize: '0.74rem', color: '#E11D48', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
            UNCOLLECTED (PENDING)
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#E11D48', margin: '0.35rem 0' }}>
            {kpis.remainingToCollect || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
            Students yet to be contacted
          </div>
        </div>

        {/* Card 4: OVERALL COLLECTION % */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #3B82F6',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px -2px rgba(59, 130, 246, 0.08)',
        }}>
          <div style={{ fontSize: '0.74rem', color: '#2563EB', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
            OVERALL COLLECTION %
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#2563EB', margin: '0.35rem 0' }}>
            {kpis.overallCoverageRate || 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
            Target Coverage Progress
          </div>
        </div>
      </div>

      {/* Team Performance Matrix (Main Table) */}
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
              Staff Performance Matrix ({staffStats.length})
            </h2>
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
                All Roles
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
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 0.85rem' }}>Staff Member</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Role</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Assigned Schools</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>10th Pool</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Collected Data</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Uncollected (Pending)</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Coverage %</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Doorsteps (Done / Pending)</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Admitted</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                    No staff members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isField = staff.role === 'EMPLOYEE';
                  const totalStr = staff.totalSchoolStrength || 0;
                  const coll = staff.totalLeads || 0;
                  const rem = staff.remainingToCollect ?? Math.max(0, totalStr - coll);
                  const cov = staff.overallCoverageRate ?? (totalStr > 0 ? Math.round((coll / totalStr) * 100) : 0);

                  return (
                    <tr key={staff.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F2B47' }}>{staff.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {staff.employeeId}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          backgroundColor: isField ? '#ECFDF5' : '#F5F3FF',
                          color: isField ? '#047857' : '#6D28D9',
                          border: `1px solid ${isField ? '#A7F3D0' : '#DDD6FE'}`,
                        }}>
                          {isField ? 'Field Staff' : 'Telecaller'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        {staff.assignedSchoolNames && staff.assignedSchoolNames.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontWeight: 700, color: '#0F2B47' }}>
                              {staff.assignedSchoolNames.length} {staff.assignedSchoolNames.length === 1 ? 'School' : 'Schools'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748B', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {staff.assignedSchoolNames.join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                            No Schools Assigned
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2B47' }}>
                        {isField ? totalStr : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                        {coll}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#DC2626' }}>
                        {isField ? rem : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        {isField ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <div style={{ width: '50px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${cov}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2B47' }}>{cov}%</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 700, color: '#16A34A' }}>{staff.doorstepDone} Done</span>
                          <span style={{ color: '#94A3B8' }}>/</span>
                          <span style={{ fontWeight: 600, color: staff.doorstepPending > 0 ? '#EA580C' : '#94A3B8' }}>{staff.doorstepPending} Pend</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#7C3AED' }}>
                        {staff.admitted}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', textAlign: 'right' }}>
                        {isField ? (
                          <button
                            type="button"
                            onClick={() => handleOpenStaffReport(staff)}
                            style={{
                              padding: '0.4rem 0.85rem',
                              backgroundColor: '#047857',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)',
                            }}
                          >
                            <FileText size={13} />
                            <span>View Report</span>
                          </button>
                        ) : (
                          <Link
                            href={`/agm/students?staffId=${staff.employeeId}`}
                            style={{
                              padding: '0.4rem 0.75rem',
                              backgroundColor: '#F1F5F9',
                              color: '#0F2B47',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <span>Leads</span>
                            <ChevronRight size={13} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom Grid: Recent Doorsteps & Catchment Schools */}
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
              href="/agm/students?doorstep=COMPLETED"
              style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentVisits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                No doorstep visits recorded yet.
              </div>
            ) : (
              recentVisits.map((v, i) => (
                <div key={i} style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F2B47' }}>
                      {v.studentName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <span>🏫 {v.schoolName}</span>
                      <span>•</span>
                      <span>📍 {v.village}</span>
                    </div>
                    {v.remarks && (
                      <div style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic', marginTop: '0.2rem' }}>
                        &quot;{v.remarks}&quot;
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                    }}>
                      Visited
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                      by {v.staffName}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card B: Catchment Schools Coverage Summary */}
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
                Catchment Schools Coverage
              </h3>
            </div>
            <Link
              href="/agm/schools"
              style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <span>View All ({catchmentSchools.length})</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {catchmentSchools.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                No schools assigned under this AGM&apos;s team yet.
              </div>
            ) : (
              catchmentSchools.slice(0, 5).map((sch, i) => (
                <div key={i} style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F2B47' }}>
                      {sch.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <span>📍 {sch.mandal || 'N/A'}</span>
                      <span>•</span>
                      <span>10th Pool: <strong>{sch.strength}</strong></span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#2563EB', marginTop: '0.2rem', fontWeight: 600 }}>
                      Assigned to: {sch.staffAssigned?.join(', ') || 'Unassigned'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#047857' }}>
                      {sch.collectedCount} Leads
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 600, marginTop: '0.1rem' }}>
                      {sch.remainingCount} Pending
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FULL-SCREEN 1380px STAFF PROGRESS REPORT MODAL */}
      {selectedStaffForReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            width: '96%',
            maxWidth: '1380px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0F2B47 0%, #173f67 50%, #0d9488 100%)',
              padding: '1.25rem 1.75rem',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FileText size={24} color="#F59E0B" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                      {selectedStaffForReport.name} - Catchment & Daily Progress Report
                    </h3>
                    <span style={{
                      backgroundColor: '#10B981',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                    }}>
                      🏃 FIELD STAFF
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.2rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span>🔑 Login ID: <strong style={{ color: '#fde047' }}>{selectedStaffForReport.employeeId}</strong></span>
                    <span>👔 Reporting AGM: <strong>{data?.agm?.name || 'Area General Manager'}</strong></span>
                    <span>🏫 Catchment Schools: <strong>{selectedStaffForReport.schools?.length || 0} Assigned</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaffForReport(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#f8fafc' }}>
              
              {/* 1. Summary Cards Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
              }}>
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Assigned Schools
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2B47', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.schools?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 600, marginTop: '0.15rem' }}>
                    Catchment Territory
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Total 10th Pool Strength
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2B47', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.totalSchoolStrength || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.15rem' }}>
                    Available Student Pool
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                    Total Collected Leads
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#047857', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.totalLeads || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700, marginTop: '0.15rem' }}>
                    Student Records Received
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                    Uncollected (Pending)
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#DC2626', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.remainingToCollect ?? 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#DC2626', fontWeight: 700, marginTop: '0.15rem' }}>
                    Remaining to Collect
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                    Collection Coverage %
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0284C7', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.overallCoverageRate ?? 0}%
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 700, marginTop: '0.15rem' }}>
                    Collection Efficiency
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>
                    Doorsteps Completed
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16A34A', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.doorstepDone || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 700, marginTop: '0.15rem' }}>
                    Physical Visits Done
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EA580C', textTransform: 'uppercase' }}>
                    Doorsteps Pending
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#EA580C', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.doorstepPending ?? 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#C2410C', fontWeight: 700, marginTop: '0.15rem' }}>
                    Pending Student Visits
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>
                    Admitted to College
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#7C3AED', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.admitted || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#6D28D9', fontWeight: 700, marginTop: '0.15rem' }}>
                    Joined Students
                  </div>
                </div>
              </div>

              {/* 2. Section A: School-Wise Data Collection & Strength Breakdown Table */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <School size={18} color="#047857" /> Assigned Catchment Schools & Data Collection Breakdown ({selectedStaffForReport.schools?.length || 0})
                </h4>

                {(!selectedStaffForReport.schools || selectedStaffForReport.schools.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                    No catchment schools assigned to this staff member yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '0.75rem 0.85rem' }}>SCHOOL NAME</th>
                          <th style={{ padding: '0.75rem 0.85rem' }}>MANDAL</th>
                          <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>10TH STRENGTH</th>
                          <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>COLLECTED DATA</th>
                          <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>UNCOLLECTED (PENDING)</th>
                          <th style={{ padding: '0.75rem 0.85rem' }}>COVERAGE %</th>
                          <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>DOORSTEP DONE</th>
                          <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>DOORSTEP PENDING</th>
                          <th style={{ padding: '0.75rem 0.85rem' }}>HEADMASTER CONTACT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStaffForReport.schools.map((s: any) => (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 0.85rem', fontWeight: 800, color: '#0F2B47' }}>
                              {s.name}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#64748b' }}>
                              📍 {s.mandalName}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2B47' }}>
                              {s.strength}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', color: '#047857', fontWeight: 800 }}>
                              {s.collected}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', color: '#DC2626', fontWeight: 700 }}>
                              {s.remaining}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${s.coverageRate}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2B47' }}>{s.coverageRate}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>
                              {s.doorstepsCompleted}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, color: s.doorstepsPending > 0 ? '#EA580C' : '#94A3B8' }}>
                              {s.doorstepsPending}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#475569', fontSize: '0.8rem' }}>
                              {s.headmasterName ? `${s.headmasterName} (${s.headmasterPhone || 'No Phone'})` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. Section B: Date-Wise Daily Activity History with Date-to-Date Filter */}
              {(() => {
                const filteredDailyActivity = (selectedStaffForReport.dailyActivity || []).filter((day: any) => {
                  if (reportFromDate && day.date < reportFromDate) return false;
                  if (reportToDate && day.date > reportToDate) return false;
                  return true;
                });

                const rangeTotalNewLeads = filteredDailyActivity.reduce((sum: number, d: any) => sum + d.newLeads, 0);
                const rangeTotalDoorsteps = filteredDailyActivity.reduce((sum: number, d: any) => sum + d.doorsteps, 0);
                const rangeTotalAdmissions = filteredDailyActivity.reduce((sum: number, d: any) => sum + d.admissions, 0);

                return (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Calendar size={18} color="#0284c7" /> Date-Wise Daily Activity History & Doorsteps
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                          Filter by date range to see daily doorsteps, new data, and admissions
                        </p>
                      </div>

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {[
                          { label: 'Today', days: 0 },
                          { label: 'Yesterday', days: 1 },
                          { label: 'Last 7 Days', days: 6 },
                          { label: 'Last 14 Days', days: 13 },
                          { label: 'This Month', days: 'MONTH' as const },
                          { label: 'Last 30 Days', days: 29 },
                          { label: 'All Records', days: 'ALL' as const },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setQuickDateRange(preset.days)}
                            style={{
                              padding: '0.28rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              color: '#334155',
                              cursor: 'pointer',
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date-to-Date Selector Bar */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>📅 From Date:</label>
                          <input
                            type="date"
                            value={reportFromDate}
                            onChange={e => setReportFromDate(e.target.value)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>📅 To Date:</label>
                          <input
                            type="date"
                            value={reportToDate}
                            onChange={e => setReportToDate(e.target.value)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                      }}>
                        <span>Range Summary:</span>
                        <span>📥 {rangeTotalNewLeads} New Leads</span>
                        <span>•</span>
                        <span>🚪 {rangeTotalDoorsteps} Doorsteps</span>
                        <span>•</span>
                        <span>🎓 {rangeTotalAdmissions} Admissions</span>
                      </div>
                    </div>

                    {/* Daily Table */}
                    {filteredDailyActivity.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                        No activity recorded within the selected date range.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                              <th style={{ padding: '0.65rem 0.75rem' }}>DATE</th>
                              <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>NEW STUDENTS DATA</th>
                              <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>DOORSTEPS VISITED</th>
                              <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>ADMISSIONS</th>
                              <th style={{ padding: '0.65rem 0.75rem' }}>VISIT REMARKS / ACTIVITY NOTES</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDailyActivity.map((day: any) => (
                              <tr key={day.date} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0F2B47' }}>
                                  {day.dayLabel}
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                                  <span style={{
                                    backgroundColor: day.newLeads > 0 ? '#dcfce7' : '#f1f5f9',
                                    color: day.newLeads > 0 ? '#166534' : '#94a3b8',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                  }}>
                                    +{day.newLeads}
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                                  <span style={{
                                    backgroundColor: day.doorsteps > 0 ? '#e0f2fe' : '#f1f5f9',
                                    color: day.doorsteps > 0 ? '#0369a1' : '#94a3b8',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                  }}>
                                    🚪 {day.doorsteps}
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                                  <span style={{
                                    backgroundColor: day.admissions > 0 ? '#f3e8ff' : '#f1f5f9',
                                    color: day.admissions > 0 ? '#6b21a8' : '#94a3b8',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                  }}>
                                    🎓 {day.admissions}
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', color: '#475569', fontSize: '0.8rem' }}>
                                  {day.notes && day.notes.length > 0 ? day.notes.join(' • ') : 'Standard daily field operation'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.75rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                AGM Cluster Supervisory View • {data?.agm?.name || 'Area General Manager'}
              </span>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  href={`/agm/students?staffId=${selectedStaffForReport.employeeId}`}
                  style={{
                    padding: '0.55rem 1.15rem',
                    backgroundColor: '#0F2B47',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>Open Full Leads Table</span>
                  <ExternalLink size={14} />
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedStaffForReport(null)}
                  style={{
                    padding: '0.55rem 1.15rem',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
