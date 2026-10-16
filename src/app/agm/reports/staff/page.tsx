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
  Search
} from 'lucide-react';

function StaffReportDetailContent() {
  const searchParams = useSearchParams();
  const staffId = searchParams.get('staffId') || '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      {/* DATE-WISE VILLAGE VISITS & ADMISSIONS TIMELINE */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F2B47' }}>
            Date-Wise Village Visits & Activity History
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {filteredDailyActivity.length} Days with Recorded Activity
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
            <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#047857' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>Loading activity history...</p>
          </div>
        ) : filteredDailyActivity.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}>
            <Calendar size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ color: '#0F2B47', fontSize: '0.98rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
              No Village Visits or Activity Recorded
            </p>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
              {isTodayOnly
                ? 'No visits recorded yet today. Use the date filter above to view past dates.'
                : 'No visits or admissions recorded between ' + (fromDate || 'start') + ' and ' + (toDate || 'today') + '.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredDailyActivity.map((day: any) => {
              const isDayToday = day.date === todayStr;

              return (
                <div
                  key={day.date}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: isDayToday ? '2px solid #10b981' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Day Header */}
                  <div style={{
                    padding: '0.85rem 1.15rem',
                    backgroundColor: isDayToday ? '#ecfdf5' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>📅</span>
                      <strong style={{ fontSize: '0.94rem', color: '#0F2B47' }}>
                        {day.dayLabel || day.date}
                      </strong>
                      {isDayToday && (
                        <span style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                        }}>
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* Day Badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        backgroundColor: day.doorsteps > 0 ? '#dcfce7' : '#f1f5f9',
                        color: day.doorsteps > 0 ? '#15803d' : '#94a3b8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}>
                        <CheckCircle2 size={13} />
                        <span>{day.doorsteps} Village Visits</span>
                      </span>

                      <span style={{
                        backgroundColor: day.admissions > 0 ? '#f3e8ff' : '#f1f5f9',
                        color: day.admissions > 0 ? '#6b21a8' : '#94a3b8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}>
                        <GraduationCap size={13} />
                        <span>{day.admissions} Admissions</span>
                      </span>

                      <span style={{
                        backgroundColor: day.newLeads > 0 ? '#e0f2fe' : '#f1f5f9',
                        color: day.newLeads > 0 ? '#0369a1' : '#94a3b8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                      }}>
                        +{day.newLeads} Leads
                      </span>
                    </div>
                  </div>

                  {/* Day Visits List */}
                  <div style={{ padding: '0.85rem 1.15rem' }}>
                    {day.visitsList && day.visitsList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {day.visitsList.map((v: any, vIdx: number) => (
                          <div
                            key={v.id || vIdx}
                            style={{
                              padding: '0.7rem 0.85rem',
                              backgroundColor: v.type === 'ADMISSION' ? '#faf5ff' : '#f8fafc',
                              border: `1px solid ${v.type === 'ADMISSION' ? '#e9d5ff' : '#e2e8f0'}`,
                              borderRadius: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <span style={{
                                  backgroundColor: v.type === 'ADMISSION' ? '#7c3aed' : '#047857',
                                  color: '#ffffff',
                                  fontSize: '0.66rem',
                                  fontWeight: 800,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '4px',
                                }}>
                                  {v.type === 'ADMISSION' ? 'ADMISSION' : 'DOORSTEP VISIT'}
                                </span>
                                <strong style={{ color: '#0F2B47', fontSize: '0.88rem' }}>
                                  {v.studentName}
                                </strong>
                              </div>

                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                {(v.village || v.mandal) && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <MapPin size={12} color="#047857" />
                                    <span>{[v.village, v.mandal].filter(Boolean).join(', ')}</span>
                                  </span>
                                )}
                                {v.schoolName && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <School size={12} color="#0284c7" />
                                    <span>{v.schoolName}</span>
                                  </span>
                                )}
                              </div>

                              {v.remarks && (
                                <div style={{ fontSize: '0.76rem', color: '#334155', marginTop: '0.3rem', fontStyle: 'italic' }}>
                                  💬 {v.remarks}
                                </div>
                              )}
                            </div>

                            {v.phone && (
                              <a
                                href={`tel:${v.phone}`}
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#047857',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  backgroundColor: '#ffffff',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                }}
                              >
                                <Phone size={11} />
                                <span>{v.phone}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {day.notes && day.notes.length > 0 ? day.notes.join(' • ') : 'Standard daily village operation completed.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
