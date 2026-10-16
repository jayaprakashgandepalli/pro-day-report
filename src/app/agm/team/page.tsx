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

  // Modal State for Detailed Staff Progress Report
  const [selectedStaffForReport, setSelectedStaffForReport] = useState<any | null>(null);
  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');

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
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Header Banner */}
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: '#0F2B47',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
            boxShadow: '0 4px 12px rgba(15, 43, 71, 0.2)',
          }}>
            <Users size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0F2B47' }}>
                My Assigned Team ({staffStats.length})
              </h1>
              <span style={{
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                👔 AGM: {data?.agm?.name || 'Area General Manager'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B' }}>
              Field Executives & Telecallers working directly under your jurisdiction in <strong>{data?.agm?.collegeName || 'College'}</strong>.
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
            padding: '0.6rem 1.15rem',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            color: '#334155',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by staff name or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.4rem',
              fontSize: '0.86rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: roleFilter === 'ALL' ? 700 : 500,
              backgroundColor: roleFilter === 'ALL' ? '#ffffff' : 'transparent',
              color: roleFilter === 'ALL' ? '#0F2B47' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              boxShadow: roleFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            All Roles ({staffStats.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('FIELD')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: roleFilter === 'FIELD' ? 700 : 500,
              backgroundColor: roleFilter === 'FIELD' ? '#ffffff' : 'transparent',
              color: roleFilter === 'FIELD' ? '#0F2B47' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              boxShadow: roleFilter === 'FIELD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Field Staff ({staffStats.filter(s => s.role === 'EMPLOYEE').length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('TELECALLER')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: roleFilter === 'TELECALLER' ? 700 : 500,
              backgroundColor: roleFilter === 'TELECALLER' ? '#ffffff' : 'transparent',
              color: roleFilter === 'TELECALLER' ? '#0F2B47' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              boxShadow: roleFilter === 'TELECALLER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Telecallers ({staffStats.filter(s => s.role === 'TELECALLER').length})
          </button>
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.25rem',
      }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '16px', textAlign: 'center', color: '#94A3B8' }}>
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
              <div key={staff.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '1.5rem',
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
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        backgroundColor: isField ? '#ECFDF5' : '#F5F3FF',
                        color: isField ? '#047857' : '#6D28D9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        border: `1px solid ${isField ? '#A7F3D0' : '#DDD6FE'}`,
                      }}>
                        {(staff.name || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F2B47' }}>
                          {staff.name}
                        </h3>
                        <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          Login ID: <strong style={{ color: '#0F2B47', fontFamily: 'monospace' }}>{staff.employeeId}</strong>
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      backgroundColor: isField ? '#ECFDF5' : '#F5F3FF',
                      color: isField ? '#047857' : '#6D28D9',
                      border: `1px solid ${isField ? '#A7F3D0' : '#DDD6FE'}`,
                    }}>
                      {isField ? '🏃 Field Staff' : '📞 Telecaller'}
                    </span>
                  </div>

                  {/* Assigned Schools & Territory Badges */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Assigned Catchment Territory ({schoolsCount} Schools)
                      </span>
                    </div>
                    {staff.assignedSchoolNames && staff.assignedSchoolNames.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {staff.assignedSchoolNames.map((scName: string, i: number) => (
                          <span key={i} style={{
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}>
                            <School size={12} /> {scName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        No schools assigned yet
                      </span>
                    )}
                  </div>

                  {/* Field Staff Enhanced Catchment Capacity & Progress Panel */}
                  {isField && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      padding: '1rem',
                      marginBottom: '1rem',
                    }}>
                      {/* Metric Header Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F2B47' }}>
                            {totalStrength}
                          </div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                            10th Pool
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', borderLeft: '1px solid #CBD5E1' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                            {collected}
                          </div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                            Collected
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', borderLeft: '1px solid #CBD5E1' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>
                            {remainingToCollect}
                          </div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                            Pending
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', borderLeft: '1px solid #CBD5E1' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7' }}>
                            {coverageRate}%
                          </div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                            Coverage
                          </div>
                        </div>
                      </div>

                      {/* Visual Coverage Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          <span>School Data Collection Progress</span>
                          <span style={{ fontWeight: 800, color: '#047857' }}>{collected} of {totalStrength} Students ({coverageRate}%)</span>
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
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={16} /> {doorstepDone}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#15803D', fontWeight: 700 }}>Doorstep Done</div>
                    </div>

                    <div style={{ textAlign: 'center', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: doorstepPending > 0 ? '#EA580C' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <Clock size={16} /> {doorstepPending}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: doorstepPending > 0 ? '#C2410C' : '#64748B', fontWeight: 700 }}>Doorstep Pending</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <GraduationCap size={16} /> {staff.admitted || 0}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#6D28D9', fontWeight: 700 }}>Admitted</div>
                    </div>
                  </div>
                </div>

                {/* Two Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {isField && (
                    <button
                      type="button"
                      onClick={() => handleOpenStaffReport(staff)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 1rem',
                        backgroundColor: '#047857',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <FileText size={16} />
                      <span>View School & Daily Progress Report</span>
                    </button>
                  )}

                  <Link
                    href={`/agm/students?staffId=${staff.employeeId}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1rem',
                      backgroundColor: '#0F2B47',
                      color: '#ffffff',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <span>View {staff.name}&apos;s Leads Registry</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
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
