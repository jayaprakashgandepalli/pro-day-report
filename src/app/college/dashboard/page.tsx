'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin,
  School,
  Building,
  RefreshCw,
  PhoneCall,
  UserCheck,
  ChevronRight,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  X,
  Sparkles,
  FileText,
  Star
} from 'lucide-react';

export default function CollegeDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Active Tab for Team Performance
  const [activeTeamTab, setActiveTeamTab] = useState<'FIELD' | 'TELECALLER' | 'AGM'>('FIELD');

  // School breakdown modal state
  const [showSchoolsModal, setShowSchoolsModal] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');

  // Staff full progress report modal state
  const [selectedStaffForReport, setSelectedStaffForReport] = useState<any | null>(null);
  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');

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

  // Hovered day tooltip for SVG chart
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/college/dashboard/stats');
      if (!res.ok) {
        throw new Error('Failed to load dashboard data');
      }
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) {
      console.error(e);
      setError('Could not load dashboard statistics. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ maxWidth: '1200px', margin: '3rem auto', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={36} className="spin-animation" style={{ color: '#047857', marginBottom: '1rem' }} />
        <p style={{ fontSize: '1.15rem', fontWeight: 600 }}>Loading College Dashboard Analytics...</p>
        <p style={{ fontSize: '0.88rem' }}>Aggregating school strength, leads, doorsteps, and team performance...</p>
      </div>
    );
  }

  const schoolsStats = data?.schoolsStats || {
    totalSchools: 0,
    totalSchoolStrength: 0,
    totalCollectedData: 0,
    remainingToCollect: 0,
    overallCollectionRate: 0,
    schoolsList: [],
  };

  const core = data?.coreStats || {
    totalLeads: 0,
    doorstepsCompleted: 0,
    todayNewData: 0,
    admittedStudents: 0,
    pendingAdmissions: 0,
    todayFollowups: 0,
    upcomingFollowups: 0,
    doorstepRate: 0,
    admissionRate: 0,
  };

  const dailyTrend = data?.dailyTrend || [];
  const fieldStaff = data?.fieldStaffProgress || [];
  const telecallers = data?.telecallerProgress || [];
  const agms = data?.agmProgress || [];

  // Filter schools for breakdown modal
  const filteredSchools = (schoolsStats.schoolsList || []).filter((s: any) => {
    if (!schoolSearch.trim()) return true;
    const q = schoolSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.mandalName.toLowerCase().includes(q);
  });

  // Calculate SVG Chart dimensions
  const maxTrendValue = Math.max(
    ...dailyTrend.map((d: any) => Math.max(d.newLeads, d.doorsteps)),
    5 // Minimum height scale
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* 1. Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.75rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0F2B47' }}>
              {data?.collegeName || 'College'} Operations Command Center
            </h1>
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}>
              <Sparkles size={14} /> Live Analytics
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Real-time tracking of Catchment School Strength, Doorstep Visits, Leads, and Team Work Progress
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastRefreshed && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Refreshed at {lastRefreshed}
            </span>
          )}
          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* 2. HERO FEATURE: Total School Strength & Data Collection Progress (User's Special Request) */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2B47 0%, #1e3a5f 100%)',
        color: '#ffffff',
        padding: '1.75rem',
        borderRadius: '16px',
        marginBottom: '1.75rem',
        boxShadow: '0 8px 24px rgba(15, 43, 71, 0.18)',
        border: '1px solid #2d4a6f',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <School size={24} color="#6ee7b7" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                Catchment Schools: Total Strength vs Collected Data
              </h2>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              10th Class Pool Capacity from your assigned schools vs actual student data collected.
            </p>
          </div>

          <button
            onClick={() => setShowSchoolsModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.15rem',
              backgroundColor: '#047857',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Eye size={16} /> View School-Wise Breakdown ({schoolsStats.totalSchools})
          </button>
        </div>

        {/* 4-Box Metric Counter */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              🏛️ Total 10th Pool Strength
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem' }}>
              {schoolsStats.totalSchoolStrength.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
              From {schoolsStats.totalSchools} Catchment Schools
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              📥 Collected Data
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#4ade80', marginTop: '0.35rem' }}>
              {schoolsStats.totalCollectedData.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#86efac', marginTop: '0.2rem' }}>
              Leads successfully entered
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              ⏳ Yet to Collect (Pending)
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f87171', marginTop: '0.35rem' }}>
              {schoolsStats.remainingToCollect.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '0.2rem' }}>
              Uncollected students remaining
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              📊 Coverage Achieved
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.35rem' }}>
              {schoolsStats.overallCollectionRate}%
            </div>
            <div style={{ fontSize: '0.78rem', color: '#93c5fd', marginTop: '0.2rem' }}>
              Of total 10th student pool
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
            <span>Collection Progress: <strong>{schoolsStats.totalCollectedData}</strong> of <strong>{schoolsStats.totalSchoolStrength}</strong> students</span>
            <span><strong>{schoolsStats.overallCollectionRate}% Completed</strong></span>
          </div>
          <div style={{ width: '100%', height: '12px', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, schoolsStats.overallCollectionRate)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
              borderRadius: '10px',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      {/* 3. Core KPI Statistics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '1.15rem',
        marginBottom: '1.75rem',
      }}>
        {/* Card 1: Total Leads */}
        <Link href="/college/students" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0F2B47', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>TOTAL LEADS</span>
              <div style={{ background: '#e0f2fe', padding: '0.45rem', borderRadius: '8px' }}>
                <Users size={18} color="#0F2B47" />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.5rem', lineHeight: 1 }}>
              {core.totalLeads}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Click to view all leads <ArrowUpRight size={13} />
            </div>
          </div>
        </Link>

        {/* Card 2: Doorsteps Completed */}
        <Link href="/college/students" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>DOORSTEPS DONE</span>
              <div style={{ background: '#e0f2fe', padding: '0.45rem', borderRadius: '8px' }}>
                <Target size={18} color="#0284c7" />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7', marginTop: '0.5rem', lineHeight: 1 }}>
              {core.doorstepsCompleted}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.45rem' }}>
              <strong>{core.doorstepRate}%</strong> of leads visited
            </div>
          </div>
        </Link>

        {/* Card 3: Today's New Data */}
        <Link href="/college/students" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#047857' }}>TODAY'S NEW DATA</span>
              <div style={{ background: '#dcfce7', padding: '0.45rem', borderRadius: '8px' }}>
                <TrendingUp size={18} color="#047857" />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857', marginTop: '0.5rem', lineHeight: 1 }}>
              {core.todayNewData}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '0.45rem' }}>
              New entries collected today
            </div>
          </div>
        </Link>

        {/* Card 4: Admitted Students */}
        <Link href="/college/students" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #7c3aed', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6d28d9' }}>ADMITTED</span>
              <div style={{ background: '#ede9fe', padding: '0.45rem', borderRadius: '8px' }}>
                <GraduationCap size={18} color="#6d28d9" />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6d28d9', marginTop: '0.5rem', lineHeight: 1 }}>
              {core.admittedStudents}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#5b21b6', marginTop: '0.45rem' }}>
              <strong>{core.admissionRate}%</strong> conversion rate
            </div>
          </div>
        </Link>

        {/* Card 5: Today's Follow-ups */}
        <Link href="/college/followups" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #d97706', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>TODAY'S CALLS</span>
              <div style={{ background: '#fef3c7', padding: '0.45rem', borderRadius: '8px' }}>
                <Calendar size={18} color="#b45309" />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#b45309', marginTop: '0.5rem', lineHeight: 1 }}>
              {core.todayFollowups}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '0.45rem' }}>
              Scheduled for today
            </div>
          </div>
        </Link>
      </div>

      {/* 4. Day-by-Day Interactive Graphs Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.75rem',
      }}>
        {/* Graph 1: Day-by-Day Leads & Doorsteps Activity */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <TrendingUp size={18} color="#047857" /> Day-by-Day Activity Trend (Last 14 Days)
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Daily New Leads vs Doorstep Visits Completed
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.78rem', fontWeight: 700 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#047857' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} /> New Leads
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#0284c7', borderRadius: '2px' }} /> Doorsteps
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ position: 'relative', height: '220px', width: '100%', marginTop: '1rem' }}>
            {dailyTrend.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No activity data recorded yet
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '175px', padding: '0 0.5rem', borderBottom: '2px solid #e2e8f0' }}>
                {dailyTrend.map((day: any, idx: number) => {
                  const leadHeight = Math.max(4, (day.newLeads / maxTrendValue) * 150);
                  const doorstepHeight = Math.max(4, (day.doorsteps / maxTrendValue) * 150);

                  return (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        flex: 1,
                        cursor: 'pointer',
                        padding: '0 2px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', width: '100%', justifyContent: 'center' }}>
                        {/* New Leads Bar */}
                        <div
                          style={{
                            width: '42%',
                            maxWidth: '14px',
                            height: `${leadHeight}px`,
                            backgroundColor: '#10b981',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                          title={`New Leads: ${day.newLeads}`}
                        />
                        {/* Doorsteps Bar */}
                        <div
                          style={{
                            width: '42%',
                            maxWidth: '14px',
                            height: `${doorstepHeight}px`,
                            backgroundColor: '#0284c7',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                          title={`Doorsteps: ${day.doorsteps}`}
                        />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.4rem', whiteSpace: 'nowrap' }}>
                        {idx % 2 === 0 ? day.dayLabel.split(' ')[1] : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tooltip on Hover */}
            {hoveredDay && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: '1rem',
                backgroundColor: '#0F2B47',
                color: '#ffffff',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                gap: '0.75rem',
                zIndex: 10,
              }}>
                <strong>{hoveredDay.dayLabel}</strong>:
                <span>🟢 New Leads: <strong>{hoveredDay.newLeads}</strong></span>
                <span>🔵 Doorsteps: <strong>{hoveredDay.doorsteps}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Graph 2: Pipeline Funnel / Doorstep Coverage */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Target size={18} color="#0284c7" /> Outreach & Admission Pipeline
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Step-by-step conversion funnel from Leads to Doorstep to Admission
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Stage 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: '#0F2B47' }}>1. Total Leads Registered</span>
                <span><strong>{core.totalLeads}</strong> (100%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#0F2B47', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Stage 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: '#0284c7' }}>2. Doorstep Visits Completed</span>
                <span><strong>{core.doorstepsCompleted}</strong> ({core.doorstepRate}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ width: `${Math.min(100, core.doorstepRate)}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Stage 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: '#7c3aed' }}>3. Confirmed Admissions</span>
                <span><strong>{core.admittedStudents}</strong> ({core.admissionRate}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ width: `${Math.min(100, core.admissionRate)}%`, height: '100%', backgroundColor: '#7c3aed', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem', border: '1px solid #e2e8f0' }}>
              💡 <strong>Pending Outreach:</strong> You have <strong>{Math.max(0, core.totalLeads - core.doorstepsCompleted)}</strong> leads waiting for Doorstep Visits and <strong>{core.pendingAdmissions}</strong> pending admissions.
            </div>
          </div>
        </div>
      </div>

      {/* 5. Team Role Work Progress (AGM, Field Staff, Telecallers) */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={22} color="#047857" /> Team Work Progress & Performance
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              Individual accountability and daily output for Field Staff, Telecallers, and AGMs
            </p>
          </div>

          {/* Role Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#f1f5f9', padding: '0.3rem', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTeamTab('FIELD')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTeamTab === 'FIELD' ? '#ffffff' : 'transparent',
                color: activeTeamTab === 'FIELD' ? '#047857' : '#64748b',
                boxShadow: activeTeamTab === 'FIELD' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              🏃 Field Staff ({fieldStaff.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTeamTab('TELECALLER')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTeamTab === 'TELECALLER' ? '#ffffff' : 'transparent',
                color: activeTeamTab === 'TELECALLER' ? '#0284c7' : '#64748b',
                boxShadow: activeTeamTab === 'TELECALLER' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              📞 Telecallers ({telecallers.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTeamTab('AGM')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTeamTab === 'AGM' ? '#ffffff' : 'transparent',
                color: activeTeamTab === 'AGM' ? '#b45309' : '#64748b',
                boxShadow: activeTeamTab === 'AGM' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              👔 AGMs ({agms.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Field Staff Progress Table */}
        {activeTeamTab === 'FIELD' && (
          <div style={{ overflowX: 'auto' }}>
            {fieldStaff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <Users size={36} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 700, color: '#0F2B47' }}>No Field Staff Added Yet</p>
                <p style={{ fontSize: '0.85rem', margin: '0.3rem 0 1rem 0' }}>Add field employees from Team Management to assign catchment schools.</p>
                <Link href="/college/team" style={{ padding: '0.5rem 1rem', backgroundColor: '#047857', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                  Manage Team
                </Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>FIELD STAFF</th>
                    <th style={{ padding: '0.75rem 1rem' }}>LOGIN ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ASSIGNED SCHOOLS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>TOTAL LEADS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>TODAY'S NEW DATA</th>
                    <th style={{ padding: '0.75rem 1rem' }}>DOORSTEPS DONE</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ADMITTED</th>
                    <th style={{ padding: '0.75rem 1rem' }}>REPORTING AGM</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldStaff.map((staff: any) => (
                    <tr key={staff.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F2B47' }}>
                        {staff.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#475569' }}>
                        {staff.employeeId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                          🏫 {staff.assignedSchoolsCount} Schools
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0F2B47' }}>
                        {staff.totalLeads}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {staff.todayNewData > 0 ? (
                          <span style={{ backgroundColor: '#bbf7d0', color: '#14532d', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.82rem' }}>
                            +{staff.todayNewData} today
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#0284c7', fontWeight: 700 }}>
                        {staff.doorstepsCompleted}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#7c3aed', fontWeight: 700 }}>
                        {staff.admittedCount}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        👔 {staff.agmName}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenStaffReport(staff)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.9rem',
                            backgroundColor: '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <FileText size={14} /> View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Telecallers Progress Table */}
        {activeTeamTab === 'TELECALLER' && (
          <div style={{ overflowX: 'auto' }}>
            {telecallers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <PhoneCall size={36} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 700, color: '#0F2B47' }}>No Telecallers Added Yet</p>
                <p style={{ fontSize: '0.85rem', margin: '0.3rem 0 1rem 0' }}>Add telecaller accounts from Team Management to handle follow-up calling.</p>
                <Link href="/college/team" style={{ padding: '0.5rem 1rem', backgroundColor: '#0284c7', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                  Manage Team
                </Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>TELECALLER</th>
                    <th style={{ padding: '0.75rem 1rem' }}>LOGIN ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>REPORTING AGM</th>
                    <th style={{ padding: '0.75rem 1rem' }}>UPDATES / CALLS RECORDED</th>
                    <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {telecallers.map((caller: any) => (
                    <tr key={caller.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F2B47' }}>
                        {caller.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#475569' }}>
                        {caller.employeeId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        👔 {caller.agmNames}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0284c7' }}>
                        📞 {caller.totalUpdates}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: caller.isActive ? '#dcfce7' : '#fee2e2', color: caller.isActive ? '#166534' : '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {caller.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <Link
                          href={`/college/team/${caller.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.75rem',
                            backgroundColor: '#f1f5f9',
                            color: '#0F2B47',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          Edit Setup <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: AGM Overview Table */}
        {activeTeamTab === 'AGM' && (
          <div style={{ overflowX: 'auto' }}>
            {agms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <Building size={36} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 700, color: '#0F2B47' }}>No AGMs Configured Yet</p>
                <p style={{ fontSize: '0.85rem', margin: '0.3rem 0 1rem 0' }}>Add AGM / Area General Managers to group Field Staff and Telecallers.</p>
                <Link href="/college/team" style={{ padding: '0.5rem 1rem', backgroundColor: '#b45309', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                  Manage Team
                </Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>AGM NAME</th>
                    <th style={{ padding: '0.75rem 1rem' }}>LOGIN ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>TEAM SIZE (FIELD + TELECALLERS)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>TOTAL GROUP LEADS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>DOORSTEPS COMPLETED</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ADMITTED</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {agms.map((agm: any) => (
                    <tr key={agm.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F2B47' }}>
                        {agm.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#475569' }}>
                        {agm.employeeId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                          👔 {agm.totalTeamMembers} Members ({agm.fieldStaffCount} Field, {agm.telecallersCount} Callers)
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0F2B47' }}>
                        {agm.totalLeads}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#0284c7', fontWeight: 700 }}>
                        {agm.doorstepsCompleted}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#7c3aed', fontWeight: 700 }}>
                        {agm.admittedCount}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <Link
                          href={`/college/team/${agm.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.75rem',
                            backgroundColor: '#f1f5f9',
                            color: '#0F2B47',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          Edit Setup <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* 6. Quick Operations Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[
          { title: 'Student Leads Directory', desc: 'Search and manage all student data', href: '/college/students', icon: Users, color: '#047857', bg: '#dcfce7' },
          { title: 'Schools Management', desc: 'Add high schools, HMs and 10th strength', href: '/college/schools', icon: School, color: '#0284c7', bg: '#e0f2fe' },
          { title: 'Team & School Assignments', desc: 'Assign exclusive schools to staff', href: '/college/team', icon: ShieldCheck, color: '#b45309', bg: '#fef3c7' },
          { title: 'Follow-ups & Calling', desc: 'Manage today and scheduled calls', href: '/college/followups', icon: Calendar, color: '#7c3aed', bg: '#ede9fe' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s', cursor: 'pointer' }}>
                <div style={{ backgroundColor: item.bg, padding: '0.75rem', borderRadius: '12px' }}>
                  <Icon size={22} color={item.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F2B47' }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{item.desc}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* MODAL: School-Wise Strength & Data Collection Breakdown */}
      {showSchoolsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '1250px',
            width: '95%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.35rem 2rem',
              borderBottom: '3px solid #3b82f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #0A192F 0%, #0F2B47 50%, #1e3a8a 100%)',
              color: '#ffffff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.25)',
                  border: '1px solid rgba(147, 197, 253, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  🏫
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#ffffff' }}>
                    School-Wise Strength & Data Collection Status
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#f8fafc', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                      Total 10th Pool: <strong style={{ color: '#93c5fd' }}>{schoolsStats.totalSchoolStrength}</strong>
                    </span>
                    <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86efac', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                      Collected Data: <strong>{schoolsStats.totalCollectedData}</strong>
                    </span>
                    <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                      Pending: <strong>{schoolsStats.remainingToCollect}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSchoolsModal(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
              <input
                type="text"
                placeholder="Search school name or mandal..."
                className="form-control"
                value={schoolSearch}
                onChange={e => setSchoolSearch(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              />
            </div>

            {/* Modal Content Table */}
            <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', flex: 1 }}>
              {filteredSchools.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  No schools found matching your search.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.65rem 0.75rem' }}>SCHOOL NAME</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>MANDAL</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>10TH STRENGTH</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>COLLECTED</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>REMAINING</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>COVERAGE %</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>ASSIGNED STAFF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchools.map((s: any) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0F2B47' }}>
                          {s.name}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#64748b' }}>
                          📍 {s.mandalName}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 800 }}>
                          {s.strength}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#047857', fontWeight: 800 }}>
                          {s.collected}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#dc2626', fontWeight: 700 }}>
                          {s.remaining}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                              <div style={{ width: `${s.coverageRate}%`, height: '100%', backgroundColor: s.coverageRate >= 50 ? '#10b981' : '#f59e0b', borderRadius: '4px' }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{s.coverageRate}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {s.assignedStaffName ? (
                            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                              🏃 {s.assignedStaffName}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setShowSchoolsModal(false)}
                style={{
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#0F2B47',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Employee In-Depth Progress Report */}
      {selectedStaffForReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 25, 47, 0.82)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '1.25rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '1380px',
            width: '96%',
            height: '92vh',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          }}>
            {/* High-Contrast Premium Header */}
            <div style={{
              padding: '1.4rem 2rem',
              background: 'linear-gradient(135deg, #0A192F 0%, #0F2B47 50%, #1e3a8a 100%)',
              borderBottom: '3px solid #3b82f6',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'rgba(59, 130, 246, 0.25)',
                  border: '1px solid rgba(147, 197, 253, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.65rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                }}>
                  📋
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                      {selectedStaffForReport.name}
                    </h3>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#93c5fd' }}>
                      — Field Performance & Work Report
                    </span>
                    <span style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '0.22rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.03em',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                    }}>
                      🏃 FIELD STAFF
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.45rem' }}>
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      color: '#f1f5f9',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      fontWeight: 600,
                    }}>
                      🔑 Login ID: <strong style={{ color: '#fde047', fontFamily: 'monospace', fontSize: '0.9rem' }}>{selectedStaffForReport.employeeId}</strong>
                    </span>

                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      color: '#f1f5f9',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      fontWeight: 600,
                    }}>
                      👔 Reporting AGM: <strong style={{ color: '#ffffff' }}>{selectedStaffForReport.agmName}</strong>
                    </span>

                    <span style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.25)',
                      color: '#bfdbfe',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      border: '1px solid rgba(96, 165, 250, 0.35)',
                      fontWeight: 700,
                    }}>
                      🏫 Catchment Schools: <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{selectedStaffForReport.assignedSchoolsCount}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaffForReport(null)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                title="Close Report"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ overflowY: 'auto', padding: '1.75rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* 1. Top 8-Card Metric Summary Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.85rem',
              }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>🏫 Assigned Schools</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.assignedSchoolsCount}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>Catchment schools</div>
                </div>

                <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>🏛️ Total School Strength</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.totalSchoolStrength}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#1d4ed8', marginTop: '0.15rem' }}>10th pool in their schools</div>
                </div>

                <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>📥 Collected Data</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#166534', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.totalLeads}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.15rem' }}>Student leads entered</div>
                </div>

                <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>⏳ Uncollected (Pending)</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.uncollectedData}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '0.15rem' }}>Pool students remaining</div>
                </div>

                <div style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>🚪 Completed Doorsteps</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0369a1', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.doorstepsCompleted}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: '0.15rem' }}>Homes visited</div>
                </div>

                <div style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase' }}>⌛ Pending Doorsteps</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#c2410c', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.pendingDoorsteps}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#c2410c', marginTop: '0.15rem' }}>Leads waiting visit</div>
                </div>

                <div style={{ backgroundColor: '#faf5ff', padding: '1rem', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>🎓 Admitted Students</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7e22ce', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.admittedCount}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7e22ce', marginTop: '0.15rem' }}>Confirmed admissions</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>📊 Pool Coverage %</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.overallCoverage}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>Of assigned pool</div>
                </div>

                {/* SPECIAL CARD: Employee Star Leads */}
                <div style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fde68a 100%)',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid #f59e0b',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    fontSize: '2.6rem',
                    opacity: 0.18,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}>
                    ⭐
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#b45309',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}>
                    <Star size={15} fill="#f59e0b" color="#f59e0b" />
                    <span>STAR LEADS</span>
                    <span style={{
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      padding: '0.05rem 0.35rem',
                      borderRadius: '4px',
                      letterSpacing: '0.05em',
                    }}>
                      SPECIAL
                    </span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#92400e', marginTop: '0.25rem' }}>
                    {selectedStaffForReport.starLeads ?? 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, marginTop: '0.15rem' }}>
                    Prime / High-Potential Leads
                  </div>
                </div>
              </div>

              {/* 2. Section A: Assigned Schools & Strength Breakdown Table */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <School size={18} color="#047857" /> Assigned Catchment Schools & Data Collection ({selectedStaffForReport.schools?.length || 0})
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
                          <th style={{ padding: '0.65rem 0.75rem' }}>SCHOOL NAME</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>MANDAL</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>10TH STRENGTH</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>COLLECTED</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>UNCOLLECTED (PENDING)</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>COVERAGE %</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>HM CONTACT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStaffForReport.schools.map((s: any) => (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0F2B47' }}>
                              {s.name}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#64748b' }}>
                              📍 {s.mandalName}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800 }}>
                              {s.strength}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#047857', fontWeight: 800 }}>
                              {s.collected}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#dc2626', fontWeight: 700 }}>
                              {s.remaining}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '50px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                                  <div style={{ width: `${s.coverageRate}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{s.coverageRate}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#475569', fontSize: '0.8rem' }}>
                              {s.headmasterName ? `${s.headmasterName} (${s.headmasterPhone || 'No Phone'})` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SPECIAL SECTION: Star Leads Showcase */}
              {selectedStaffForReport.starLeadsList && selectedStaffForReport.starLeadsList.length > 0 && (
                <div style={{
                  backgroundColor: '#fffdf5',
                  borderRadius: '12px',
                  border: '1px solid #fef08a',
                  padding: '1.25rem',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Star size={18} fill="#d97706" color="#d97706" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#92400e' }}>
                          Star Leads Collected by {selectedStaffForReport.name} ({selectedStaffForReport.starLeadsList.length})
                        </h4>
                        <span style={{ fontSize: '0.76rem', color: '#b45309' }}>
                          Prime / High-Potential student leads with positive outreach
                        </span>
                      </div>
                    </div>

                    <span style={{
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: '1px solid #fde68a',
                    }}>
                      ⭐ Top Admission Prospects
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '0.6rem 0.75rem' }}>STUDENT NAME</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>CONTACT PHONE</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>SCHOOL</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>GROUP / MARKS</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>DOORSTEP</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStaffForReport.starLeadsList.map((st: any) => (
                          <tr key={st.id} style={{ borderBottom: '1px solid #fef08a' }}>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#0F2B47' }}>
                              ⭐ {st.studentName}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>
                              {st.phone}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#475569' }}>
                              {st.schoolName || 'N/A'}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                                {st.group || 'General'} {st.marks ? `(${st.marks})` : ''}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              {st.doorstepCompleted ? (
                                <span style={{ color: '#166534', fontWeight: 800, fontSize: '0.78rem' }}>✅ Visited</span>
                              ) : (
                                <span style={{ color: '#c2410c', fontWeight: 700, fontSize: '0.78rem' }}>⏳ Pending</span>
                              )}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              {st.leadStatus === 'Admitted' ? (
                                <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>
                                  🎓 Admitted
                                </span>
                              ) : (
                                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>
                                  ⭐ Star Lead
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Calendar size={18} color="#0284c7" /> Date-Wise Daily Activity History
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
                              padding: '0.25rem 0.65rem',
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
                            className="form-control"
                            value={reportFromDate}
                            onChange={e => setReportFromDate(e.target.value)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', width: 'auto' }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>📅 To Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            value={reportToDate}
                            onChange={e => setReportToDate(e.target.value)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', width: 'auto' }}
                          />
                        </div>

                        {(reportFromDate || reportToDate) && (
                          <button
                            type="button"
                            onClick={() => { setReportFromDate(''); setReportToDate(''); }}
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#dc2626',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            Clear Date Filter
                          </button>
                        )}
                      </div>

                      {/* Selected Range Totals */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        backgroundColor: '#ffffff',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}>
                        <span style={{ color: '#166534' }}>🟢 Leads: +{rangeTotalNewLeads}</span>
                        <span style={{ color: '#0369a1' }}>🔵 Doorsteps: {rangeTotalDoorsteps}</span>
                        <span style={{ color: '#7c3aed' }}>🎓 Admitted: {rangeTotalAdmissions}</span>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      {filteredDailyActivity.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                          No activity records found between <strong>{reportFromDate || 'start'}</strong> and <strong>{reportToDate || 'now'}</strong>.
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                              <th style={{ padding: '0.65rem 0.75rem' }}>DATE</th>
                              <th style={{ padding: '0.65rem 0.75rem' }}>NEW DATA COLLECTED</th>
                              <th style={{ padding: '0.65rem 0.75rem' }}>DOORSTEP VISITS DONE</th>
                              <th style={{ padding: '0.65rem 0.75rem' }}>CONVERTED ADMISSIONS</th>
                              <th style={{ padding: '0.65rem 0.75rem' }}>ACTIVITY STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDailyActivity.map((day: any) => {
                              const totalDayWork = day.newLeads + day.doorsteps + day.admissions;
                              return (
                                <tr key={day.date} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#0F2B47' }}>
                                    {day.dayLabel} ({day.date})
                                  </td>
                                  <td style={{ padding: '0.65rem 0.75rem' }}>
                                    {day.newLeads > 0 ? (
                                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                                        +{day.newLeads} Leads
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1' }}>0</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.65rem 0.75rem' }}>
                                    {day.doorsteps > 0 ? (
                                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                                        🚪 {day.doorsteps} Visits
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1' }}>0</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.65rem 0.75rem' }}>
                                    {day.admissions > 0 ? (
                                      <span style={{ backgroundColor: '#ede9fe', color: '#6d28d9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                                        🎓 {day.admissions} Admitted
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1' }}>0</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.65rem 0.75rem' }}>
                                    {totalDayWork > 0 ? (
                                      <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.78rem' }}>
                                        ⚡ Active ({totalDayWork} actions)
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>No Activity</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
            }}>
              <Link
                href={`/college/team/${selectedStaffForReport.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.55rem 1rem',
                  backgroundColor: '#ffffff',
                  color: '#0F2B47',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                ✏️ Edit Staff & School Setup
              </Link>

              <button
                type="button"
                onClick={() => setSelectedStaffForReport(null)}
                style={{
                  padding: '0.55rem 1.35rem',
                  backgroundColor: '#0F2B47',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
