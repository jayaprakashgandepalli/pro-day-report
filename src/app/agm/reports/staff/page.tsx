'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  GraduationCap,
  MapPin,
  School,
  Clock,
  Phone,
  RefreshCw,
  FileText,
  Filter,
  Search,
  Eye,
  X
} from 'lucide-react';

function StaffReportDetailContent() {
  const searchParams = useSearchParams();
  const staffId = searchParams.get('staffId') || '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);

  // Default date: TODAY
  const getTodayStr = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const [fromDate, setFromDate] = useState<string>(getTodayStr());
  const [toDate, setToDate] = useState<string>(getTodayStr());
  const [activePreset, setActivePreset] = useState<'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL' | ''>('');

  const fetchReportData = async () => {
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
    fetchReportData();
  }, []);

  const handlePreset = (preset: 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL') => {
    setActivePreset(preset);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (preset === 'YESTERDAY') {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setFromDate(yStr);
      setToDate(yStr);
    } else if (preset === 'WEEK') {
      const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(today);
    } else if (preset === 'MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(startOfMonth.toISOString().split('T')[0]);
      setToDate(today);
    } else if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    }
  };

  const staffStats: any[] = data?.staffStats || [];
  const staff = staffStats.find(
    (s: any) => s.employeeId === staffId || s.id === staffId
  );

  const todayStr = getTodayStr();

  // Find Today's stats specifically
  const todayActivity = (staff?.dailyActivity || []).find((d: any) => d.date === todayStr);
  const todayDoorsteps = todayActivity?.doorsteps || 0;
  const todayAdmissions = todayActivity?.admissions || 0;
  const todayNewLeads = todayActivity?.newLeads || 0;

  // Filter daily activity by selected Date-to-Date range
  const filteredDailyActivity = (staff?.dailyActivity || []).filter((day: any) => {
    if (fromDate && day.date < fromDate) return false;
    if (toDate && day.date > toDate) return false;
    return true;
  });

  // Calculate totals for selected range
  const rangeDoorsteps = filteredDailyActivity.reduce((sum: number, d: any) => sum + (d.doorsteps || 0), 0);
  const rangeAdmissions = filteredDailyActivity.reduce((sum: number, d: any) => sum + (d.admissions || 0), 0);
  const rangeNewLeads = filteredDailyActivity.reduce((sum: number, d: any) => sum + (d.newLeads || 0), 0);

  const isTodayOnly = fromDate === todayStr && toDate === todayStr;

  // Flatten all visits across filtered days
  const visitedStudentsList = filteredDailyActivity.flatMap((day: any) =>
    (day.visitsList || []).map((v: any) => ({
      ...v,
      visitDate: v.date || day.date,
      dayLabel: day.dayLabel || day.date,
    }))
  );

  return (
    <div style={{ padding: '1.25rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          href="/agm/reports"
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
          <span>Back to Team Reports</span>
        </Link>
      </div>

      {/* Compact Staff Profile Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '0.75rem 1rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.85rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            backgroundColor: staff?.role === 'TELECALLER' ? '#f3e8ff' : '#ecfdf5',
            border: `1px solid ${staff?.role === 'TELECALLER' ? '#d8b4fe' : '#a7f3d0'}`,
            color: staff?.role === 'TELECALLER' ? '#7c3aed' : '#047857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem',
            flexShrink: 0,
          }}>
            {staff?.name ? staff.name.charAt(0).toUpperCase() : <Users size={18} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2B47' }}>
                {staff ? staff.name : (loading ? 'Loading...' : 'Staff Member')}
              </span>
              <span style={{
                backgroundColor: staff?.role === 'TELECALLER' ? '#f3e8ff' : '#ecfdf5',
                color: staff?.role === 'TELECALLER' ? '#7c3aed' : '#047857',
                border: `1px solid ${staff?.role === 'TELECALLER' ? '#d8b4fe' : '#a7f3d0'}`,
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.05rem 0.35rem',
                borderRadius: '5px',
              }}>
                {staff?.role === 'TELECALLER' ? 'Tele' : 'Field'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.1rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span>Login: <strong style={{ color: '#0F2B47' }}>{staff?.employeeId || staffId}</strong></span>
              <span>•</span>
              <span>Doorsteps: <strong style={{ color: '#16a34a' }}>{staff?.doorstepDone || 0}</strong></span>
              <span>•</span>
              <span>Admitted: <strong style={{ color: '#7c3aed' }}>{staff?.admitted || 0}</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchReportData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#475569',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Simple Compact Today Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        marginBottom: '0.85rem',
      }}>
        {/* Today Village Visits */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          padding: '0.65rem 0.5rem',
          textAlign: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
            Today Visits
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803d', marginTop: '0.15rem' }}>
            {todayDoorsteps}
          </div>
        </div>

        {/* Today Admissions */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e9d5ff',
          padding: '0.65rem 0.5rem',
          textAlign: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>
            Today Admissions
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#6b21a8', marginTop: '0.15rem' }}>
            {todayAdmissions}
          </div>
        </div>

        {/* Today Data Collected */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          padding: '0.65rem 0.5rem',
          textAlign: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
            Today Leads
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d4ed8', marginTop: '0.15rem' }}>
            {todayNewLeads}
          </div>
        </div>
      </div>

      {/* DATE-TO-DATE FILTER SECTION */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '0.85rem 1rem',
        marginBottom: '0.85rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}>
        {/* Row 1: Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
          <Calendar size={16} color="#047857" />
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F2B47' }}>
            Date to Date Filter
          </span>
        </div>

        {/* Row 2: Preset Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '0.25rem',
          marginBottom: '0.65rem',
          scrollbarWidth: 'none',
        }}>
          {[
            { id: 'YESTERDAY' as const, label: 'Yesterday' },
            { id: 'WEEK' as const, label: 'Last 7 Days' },
            { id: 'MONTH' as const, label: 'This Month' },
            { id: 'ALL' as const, label: 'All Dates' },
          ].map(p => {
            const active = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePreset(p.id)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '7px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  border: active ? '1px solid #047857' : '1px solid #e2e8f0',
                  backgroundColor: active ? '#047857' : '#f8fafc',
                  color: active ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Row 3: From and To Date Inputs (Balanced 2-column grid) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          marginBottom: '0.65rem',
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.4rem 0.55rem',
          }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
              From Date
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setActivePreset('ALL');
              }}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#0F2B47',
                outline: 'none',
                padding: '0',
              }}
            />
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.4rem 0.55rem',
          }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
              To Date
            </div>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setActivePreset('ALL');
              }}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#0F2B47',
                outline: 'none',
                padding: '0',
              }}
            />
          </div>
        </div>

        {/* Row 4: Summary Result Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.45rem 0.6rem',
          fontSize: '0.78rem',
          fontWeight: 800,
        }}>
          <span style={{ color: '#16a34a' }}>
            Visits: <strong>{rangeDoorsteps}</strong>
          </span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ color: '#7c3aed' }}>
            Admissions: <strong>{rangeAdmissions}</strong>
          </span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ color: '#2563eb' }}>
            Data: <strong>{rangeNewLeads}</strong>
          </span>
        </div>
      </div>

      {/* VISITED STUDENTS LIST (DATE RANGE FILTERED) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F2B47' }}>
              Visited Students List
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {visitedStudentsList.length} Students visited in selected date range
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
            <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#047857' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>Loading visited students...</p>
          </div>
        ) : visitedStudentsList.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}>
            <Calendar size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ color: '#0F2B47', fontSize: '0.98rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
              No Visited Students in Selected Range
            </p>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
              {isTodayOnly
                ? 'No visits recorded yet today. Use the date filter above to view past dates.'
                : 'No visits recorded between ' + (fromDate || 'start') + ' and ' + (toDate || 'today') + '.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visitedStudentsList.map((st: any, idx: number) => {
              const isAdmission = st.type === 'ADMISSION' || (st.leadStatus || '').toLowerCase() === 'admitted';

              return (
                <div
                  key={st.id || `${st.studentId}-${idx}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: isAdmission ? '1px solid #d8b4fe' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  {/* Top Line: Badges + Student Name + Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Visit Number Badge */}
                      <span style={{
                        backgroundColor: '#0F2B47',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.18rem 0.55rem',
                        borderRadius: '6px',
                      }}>
                        Visit #{st.visitNumber || '1'}
                      </span>

                      {/* Type Badge */}
                      <span style={{
                        backgroundColor: isAdmission ? '#7c3aed' : '#047857',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                      }}>
                        {isAdmission ? 'ADMISSION' : 'DOORSTEP VISIT'}
                      </span>

                      {/* Student Name */}
                      <strong style={{ fontSize: '0.98rem', color: '#0F2B47' }}>
                        {st.studentName}
                      </strong>
                    </div>

                    {/* Date Label */}
                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#64748b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}>
                      <Calendar size={13} color="#94a3b8" />
                      <span>{st.dayLabel || st.visitDate}</span>
                    </span>
                  </div>

                  {/* Location & School */}
                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {(st.village || st.mandal) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={13} color="#047857" />
                        <span>{[st.village, st.mandal].filter(Boolean).join(', ')}</span>
                      </span>
                    )}
                    {st.schoolName && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <School size={13} color="#0284c7" />
                        <span>{st.schoolName}</span>
                      </span>
                    )}
                  </div>

                  {/* Remark Box - Clearly displayed */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    borderLeft: '3px solid #047857',
                    padding: '0.4rem 0.65rem',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '0.8rem',
                    color: '#1e293b',
                  }}>
                    <strong style={{ color: '#047857' }}>Remark: </strong>
                    <span>{st.remarks || 'No remarks provided'}</span>
                  </div>

                  {/* Bottom Actions Row: Phone & Full Details Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    paddingTop: '0.35rem',
                    borderTop: '1px solid #f1f5f9',
                  }}>
                    {st.phone ? (
                      <a
                        href={`tel:${st.phone}`}
                        style={{
                          fontSize: '0.78rem',
                          color: '#047857',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: '#ecfdf5',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        <Phone size={12} />
                        <span>{st.phone}</span>
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No phone</span>
                    )}

                    {/* Full Details Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForDetails(st)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        backgroundColor: '#0F2B47',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      }}
                    >
                      <Eye size={13} />
                      <span>Full Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULL DETAILS MODAL */}
      {selectedStudentForDetails && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedStudentForDetails(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#0F2B47',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                }}>
                  {(selectedStudentForDetails.studentName || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F2B47' }}>
                    {selectedStudentForDetails.studentName}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Student Full Details
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentForDetails(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Visit Badges Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                padding: '0.55rem 0.85rem',
                borderRadius: '10px',
                flexWrap: 'wrap',
                gap: '0.4rem',
              }}>
                <span style={{
                  backgroundColor: '#0F2B47',
                  color: '#ffffff',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                }}>
                  Visit #{selectedStudentForDetails.visitNumber || '1'}
                </span>
                <span style={{
                  backgroundColor: selectedStudentForDetails.type === 'ADMISSION' ? '#7c3aed' : '#047857',
                  color: '#ffffff',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                }}>
                  {selectedStudentForDetails.type === 'ADMISSION' ? 'ADMISSION' : 'DOORSTEP VISIT'}
                </span>
                <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 700 }}>
                  📅 {selectedStudentForDetails.dayLabel || selectedStudentForDetails.visitDate}
                </span>
              </div>

              {/* Remark Box */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '0.75rem',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  💬 Visit Remark / Notes
                </div>
                <div style={{ fontSize: '0.86rem', color: '#14532d', fontWeight: 600 }}>
                  {selectedStudentForDetails.remarks || 'No remarks recorded'}
                </div>
              </div>

              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.65rem',
              }}>
                {/* Phone */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Phone Number</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    {selectedStudentForDetails.phone ? (
                      <a href={`tel:${selectedStudentForDetails.phone}`} style={{ color: '#047857', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Phone size={13} /> {selectedStudentForDetails.phone}
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Not provided</span>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>WhatsApp</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    {selectedStudentForDetails.whatsapp ? (
                      <a href={`https://wa.me/91${selectedStudentForDetails.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none' }}>
                        {selectedStudentForDetails.whatsapp}
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>
                    )}
                  </div>
                </div>

                {/* Father's Name */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Father&apos;s Name</div>
                  <div style={{ fontSize: '0.86rem', color: '#0F2B47', fontWeight: 700, marginTop: '0.2rem' }}>
                    {selectedStudentForDetails.fatherName || '-'}
                  </div>
                </div>

                {/* Father Occupation */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Father&apos;s Occupation</div>
                  <div style={{ fontSize: '0.86rem', color: '#0F2B47', fontWeight: 700, marginTop: '0.2rem' }}>
                    {selectedStudentForDetails.occupation || '-'}
                  </div>
                </div>

                {/* School */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>School Name</div>
                  <div style={{ fontSize: '0.86rem', color: '#0F2B47', fontWeight: 700, marginTop: '0.2rem' }}>
                    {selectedStudentForDetails.schoolName || '-'}
                  </div>
                </div>

                {/* Group & Marks */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Group / Marks</div>
                  <div style={{ fontSize: '0.86rem', color: '#0F2B47', fontWeight: 700, marginTop: '0.2rem' }}>
                    {[selectedStudentForDetails.group, selectedStudentForDetails.marks ? `${selectedStudentForDetails.marks} Marks` : ''].filter(Boolean).join(' • ') || '-'}
                  </div>
                </div>

                {/* Village & Mandal */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Village & Mandal</div>
                  <div style={{ fontSize: '0.86rem', color: '#0F2B47', fontWeight: 700, marginTop: '0.2rem' }}>
                    {[selectedStudentForDetails.village, selectedStudentForDetails.mandal].filter(Boolean).join(', ') || '-'}
                  </div>
                </div>

                {/* District */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>District</div>
                  <div style={{ fontSize: '0.86rem', color: '#0F2B47', fontWeight: 700, marginTop: '0.2rem' }}>
                    {selectedStudentForDetails.district || '-'}
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedStudentForDetails.address && (
                <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Full Address</div>
                  <div style={{ fontSize: '0.84rem', color: '#334155' }}>
                    {selectedStudentForDetails.address}
                  </div>
                </div>
              )}

              {/* Status Row */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.8rem',
              }}>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 700 }}>Status: </span>
                  <strong style={{ color: '#0F2B47' }}>{selectedStudentForDetails.leadStatus || 'Visited'}</strong>
                </div>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 700 }}>Doorstep Visit: </span>
                  <strong style={{ color: selectedStudentForDetails.doorstepCompleted ? '#16a34a' : '#d97706' }}>
                    {selectedStudentForDetails.doorstepCompleted ? 'Completed' : 'Pending'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              backgroundColor: '#f8fafc',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
            }}>
              {selectedStudentForDetails.phone && (
                <a
                  href={`tel:${selectedStudentForDetails.phone}`}
                  style={{
                    padding: '0.45rem 0.85rem',
                    backgroundColor: '#047857',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Phone size={14} /> Call Student
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedStudentForDetails(null)}
                style={{
                  padding: '0.45rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgmStaffReportDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#047857' }} />
        <p style={{ margin: 0, fontWeight: 700 }}>Loading staff report...</p>
      </div>
    }>
      <StaffReportDetailContent />
    </Suspense>
  );
}
