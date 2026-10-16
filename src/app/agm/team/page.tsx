'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  School,
  CheckCircle2,
  Clock,
  Phone,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Award,
  ChevronRight,
  Filter,
  Calendar,
  Star,
  FileText,
  X,
  Sparkles,
  TrendingUp,
  MapPin,
  GraduationCap
} from 'lucide-react';

export default function AgmTeamPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FIELD' | 'TELECALLER'>('ALL');



  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agm/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);



  const staffStats: any[] = data?.staffStats || [];

  const filtered = staffStats.filter(s => {
    if (roleFilter === 'FIELD' && s.role !== 'EMPLOYEE') return false;
    if (roleFilter === 'TELECALLER' && s.role !== 'TELECALLER') return false;
    if (search) {
      const q = search.toLowerCase();
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
        .agm-team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 1.25rem;
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
        .agm-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }
        .agm-metric-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.85rem;
        }

        /* Mobile Adjustments */
        @media (max-width: 767px) {
          .agm-page-container {
            padding: 0.85rem 0.75rem !important;
            gap: 1rem !important;
          }
          .agm-header-banner {
            display: none !important;
          }
          .agm-team-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .agm-staff-card {
            padding: 1.15rem 1rem !important;
          }
          .agm-modal-card {
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
          }
          .agm-summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.65rem !important;
          }
          .agm-metric-strip {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem 0.5rem !important;
          }
          .agm-metric-strip > div {
            border-left: none !important;
          }
        }
      `}} />
      
      {/* Header Banner */}
      <div className="agm-header-banner" style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem 1.75rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#0F2B47',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
            boxShadow: '0 4px 12px rgba(15, 43, 71, 0.2)',
            flexShrink: 0,
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F2B47' }}>
                My Assigned Team ({staffStats.length})
              </h1>
              <span style={{
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                padding: '0.15rem 0.55rem',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                👔 AGM: {data?.agm?.name || 'Area Manager'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Field Staff & Telecallers under your supervision in <strong>{data?.agm?.collegeName || 'College'}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchTeamData}
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
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '0.85rem 1.15rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem',
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by staff name or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.3rem',
              fontSize: '0.85rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '0.2rem', borderRadius: '8px', overflowX: 'auto', maxWidth: '100%' }}>
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: roleFilter === 'ALL' ? 700 : 500,
              backgroundColor: roleFilter === 'ALL' ? '#ffffff' : 'transparent',
              color: roleFilter === 'ALL' ? '#0F2B47' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: roleFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            All Roles ({staffStats.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('FIELD')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: roleFilter === 'FIELD' ? 700 : 500,
              backgroundColor: roleFilter === 'FIELD' ? '#ffffff' : 'transparent',
              color: roleFilter === 'FIELD' ? '#0F2B47' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: roleFilter === 'FIELD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Field Staff ({staffStats.filter(s => s.role === 'EMPLOYEE').length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('TELECALLER')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: roleFilter === 'TELECALLER' ? 700 : 500,
              backgroundColor: roleFilter === 'TELECALLER' ? '#ffffff' : 'transparent',
              color: roleFilter === 'TELECALLER' ? '#0F2B47' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: roleFilter === 'TELECALLER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Telecallers ({staffStats.filter(s => s.role === 'TELECALLER').length})
          </button>
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div className="agm-team-grid">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', textAlign: 'center', color: '#94A3B8' }}>
            No staff members match your criteria.
          </div>
        ) : (
          filtered.map((staff) => {
            const isField = staff.role === 'EMPLOYEE';
            const schoolsCount = staff.assignedSchools?.length || 0;
            const totalStrength = staff.totalSchoolStrength || 0;
            const collected = staff.totalLeads || 0;
            const remainingToCollect = staff.remainingToCollect ?? Math.max(0, totalStrength - collected);
            const coverageRate = staff.overallCoverageRate ?? (totalStrength > 0 ? Math.round((collected / totalStrength) * 100) : 0);
            const doorstepDone = staff.doorstepDone || 0;
            const doorstepPending = staff.doorstepPending ?? Math.max(0, collected - doorstepDone);

            return (
              <div key={staff.id} className="agm-staff-card" style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '1.35rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  {/* Top Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: isField ? '#ECFDF5' : '#F5F3FF',
                        color: isField ? '#047857' : '#6D28D9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        border: `1px solid ${isField ? '#A7F3D0' : '#DDD6FE'}`,
                        flexShrink: 0,
                      }}>
                        {(staff.name || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F2B47' }}>
                          {staff.name}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Login ID: <strong style={{ color: '#0F2B47', fontFamily: 'monospace' }}>{staff.employeeId}</strong>
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '8px',
                      backgroundColor: isField ? '#ECFDF5' : '#F5F3FF',
                      color: isField ? '#047857' : '#6D28D9',
                      border: `1px solid ${isField ? '#A7F3D0' : '#DDD6FE'}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {isField ? '🏃 Field Staff' : '📞 Telecaller'}
                    </span>
                  </div>

                  {/* Field Staff Enhanced Catchment Capacity & Progress Panel */}
                  {isField && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      padding: '0.85rem 1rem',
                      marginBottom: '1rem',
                    }}>
                      {/* Metric Header Grid */}
                      <div className="agm-metric-strip">
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F2B47' }}>
                            {totalStrength}
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                            10th Pool
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', borderLeft: '1px solid #CBD5E1' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#047857' }}>
                            {collected}
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                            Collected
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', borderLeft: '1px solid #CBD5E1' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#DC2626' }}>
                            {remainingToCollect}
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                            Pending
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', borderLeft: '1px solid #CBD5E1' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284C7' }}>
                            {coverageRate}%
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                            Coverage
                          </div>
                        </div>
                      </div>

                      {/* Visual Coverage Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          <span>School Data Collection Progress</span>
                          <span style={{ fontWeight: 800, color: '#047857' }}>{collected} of {totalStrength} ({coverageRate}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '7px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${coverageRate}%`,
                            height: '100%',
                            backgroundColor: coverageRate >= 70 ? '#10B981' : coverageRate >= 30 ? '#0D9488' : '#F59E0B',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Doorstep Progress & Admissions Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    backgroundColor: '#FFFFFF',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    marginBottom: '1.25rem',
                    border: '1px solid #E2E8F0',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={15} /> {doorstepDone}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#15803D', fontWeight: 700 }}>Doorstep Done</div>
                    </div>

                    <div style={{ textAlign: 'center', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: doorstepPending > 0 ? '#EA580C' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <Clock size={15} /> {doorstepPending}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: doorstepPending > 0 ? '#C2410C' : '#64748B', fontWeight: 700 }}>Doorstep Pending</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <GraduationCap size={15} /> {staff.admitted || 0}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#6D28D9', fontWeight: 700 }}>Admitted</div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Link
                    href={`/agm/team/schools?staffId=${staff.employeeId}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 1rem',
                      backgroundColor: '#047857',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <School size={16} />
                    <span>View Assigned Schools & Progress</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      

    </div>
  );
}
