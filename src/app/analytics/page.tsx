'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart2, Loader2, AlertCircle, TrendingUp, Target, CheckCircle2, School, X, Clock } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import SpecificMandalReportModal from '@/components/SpecificMandalReportModal';

export default function AnalyticsPage() {
  const router = useRouter();
  const [mandals, setMandals] = useState<any[]>([]);
  const [mandalsSummary, setMandalsSummary] = useState<any[]>([]);
  const [dropdownMandal, setDropdownMandal] = useState(''); // Filters the cards
  const [selectedMandal, setSelectedMandal] = useState(''); // Shows schools for this mandal
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMandals = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.configs) {
        const mandalsData = data.configs.filter((c: any) => c.type === 'MANDAL');
        setMandals(mandalsData);
      }
    } catch (err) {
      console.error('Failed to fetch mandals', err);
    }
  };

  const fetchMandalsSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/mandals-summary');
      if (res.ok) {
        const data = await res.json();
        setMandalsSummary(data.summaries || []);
      }
    } catch (err) {
      console.error('Failed to fetch mandal summaries', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async (mandalId: string) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ mandalId });
      const res = await fetch(`/api/reports/schools-progress?${query.toString()}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await res.json();
      setReportData(data.report || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Mandals on load
  useEffect(() => {
    fetchMandals();
    fetchMandalsSummary();
  }, []);

  // Fetch report data when a specific mandal is clicked to view schools
  useEffect(() => {
    if (selectedMandal) {
      fetchReportData(selectedMandal);
    } else {
      setReportData([]);
    }
  }, [selectedMandal]);

  const visibleMandals = dropdownMandal 
    ? mandalsSummary.filter(m => m.mandalId === dropdownMandal) 
    : mandalsSummary;

  // Calculate overall summary stats across visible mandals
  const overallStats = useMemo(() => {
    let totalSchools = 0;
    let totalTarget = 0;
    let totalCollected = 0;

    visibleMandals.forEach((m) => {
      totalSchools += Number(m.totalSchools) || 0;
      totalTarget += Number(m.totalTarget) || 0;
      totalCollected += Number(m.totalCollected) || 0;
    });

    const totalRemaining = Math.max(0, totalTarget - totalCollected);

    return {
      totalSchools,
      totalTarget,
      totalCollected,
      totalRemaining,
    };
  }, [visibleMandals]);

  // Calculate stats for drilled-down mandal schools
  const mandalSchoolsStats = useMemo(() => {
    const totalSchools = reportData.length;
    let totalTarget = 0;
    let totalCollected = 0;

    reportData.forEach((s) => {
      totalTarget += Number(s.target) || 0;
      totalCollected += Number(s.collected) || 0;
    });

    const totalRemaining = Math.max(0, totalTarget - totalCollected);

    return {
      totalSchools,
      totalTarget,
      totalCollected,
      totalRemaining,
    };
  }, [reportData]);

  // Render 4 summary KPI cards in a single row for mobile
  const renderStatsRow = (stats: { totalSchools: number; totalTarget: number; totalCollected: number; totalRemaining: number }) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: '0.45rem',
      marginBottom: '1rem',
    }}>
      {/* 1. Total Schools */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '0.65rem 0.2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minWidth: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.25rem',
          color: '#475569'
        }}>
          <School size={13} />
        </div>
        <div style={{
          fontSize: 'clamp(0.9rem, 3.2vw, 1.2rem)',
          fontWeight: 800,
          color: '#0f172a',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {stats.totalSchools.toLocaleString()}
        </div>
        <div style={{
          fontSize: '0.62rem',
          fontWeight: 600,
          color: '#64748b',
          marginTop: '0.2rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          lineHeight: 1.1,
        }} title="Total Schools">
          Total Schools
        </div>
      </div>

      {/* 2. Target */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '10px',
        padding: '0.65rem 0.2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minWidth: 0,
        boxShadow: '0 1px 3px rgba(37,99,235,0.06)',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.25rem',
          color: '#2563eb'
        }}>
          <Target size={13} />
        </div>
        <div style={{
          fontSize: 'clamp(0.9rem, 3.2vw, 1.2rem)',
          fontWeight: 800,
          color: '#1d4ed8',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {stats.totalTarget.toLocaleString()}
        </div>
        <div style={{
          fontSize: '0.62rem',
          fontWeight: 600,
          color: '#2563eb',
          marginTop: '0.2rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          lineHeight: 1.1,
        }} title="Target">
          Target
        </div>
      </div>

      {/* 3. Collected */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '10px',
        padding: '0.65rem 0.2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minWidth: 0,
        boxShadow: '0 1px 3px rgba(22,163,74,0.06)',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.25rem',
          color: '#16a34a'
        }}>
          <CheckCircle2 size={13} />
        </div>
        <div style={{
          fontSize: 'clamp(0.9rem, 3.2vw, 1.2rem)',
          fontWeight: 800,
          color: '#15803d',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {stats.totalCollected.toLocaleString()}
        </div>
        <div style={{
          fontSize: '0.62rem',
          fontWeight: 600,
          color: '#16a34a',
          marginTop: '0.2rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          lineHeight: 1.1,
        }} title="Collected">
          Collected
        </div>
      </div>

      {/* 4. Remaining */}
      <div style={{
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: '10px',
        padding: '0.65rem 0.2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minWidth: 0,
        boxShadow: '0 1px 3px rgba(234,88,12,0.06)',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: '#ffedd5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.25rem',
          color: '#ea580c'
        }}>
          <Clock size={13} />
        </div>
        <div style={{
          fontSize: 'clamp(0.9rem, 3.2vw, 1.2rem)',
          fontWeight: 800,
          color: '#c2410c',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {stats.totalRemaining.toLocaleString()}
        </div>
        <div style={{
          fontSize: '0.62rem',
          fontWeight: 600,
          color: '#ea580c',
          marginTop: '0.2rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          lineHeight: 1.1,
        }} title="Remaining">
          Remaining
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button 
          onClick={() => {
            if (selectedMandal) {
              setSelectedMandal('');
            } else {
              router.back();
            }
          }} 
          className="btn-icon" 
          style={{ position: 'absolute', left: '1rem', border: 'none', background: 'none', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={20} color="var(--primary-color)" /> Analytics
        </h1>
      </header>

      {/* OVERVIEW STATS CARDS AT TOP */}
      {!selectedMandal && mandalsSummary.length > 0 && renderStatsRow(overallStats)}

      {!selectedMandal && (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '0.85rem' }}>
          <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Select Mandal for Analytics</label>
          <select 
            className="form-control" 
            value={dropdownMandal} 
            onChange={(e) => setDropdownMandal(e.target.value)}
            style={{ fontSize: '0.95rem', padding: '0.65rem', borderColor: 'var(--primary-color)' }}
          >
            <option value="">-- All Mandals --</option>
            {mandals.map(m => (
              <option key={m.id} value={m.id}>{m.value}</option>
            ))}
          </select>
        </div>
      )}

      {loading && !selectedMandal && mandalsSummary.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading summary...</p>
        </div>
      )}

      {loading && selectedMandal && reportData.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading schools...</p>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* MANDAL SUMMARY CARDS VIEW */}
      {!selectedMandal && visibleMandals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--primary-color)" /> Mandal Overview
          </h2>
          
          {visibleMandals.map((mandal) => {
            const percentage = mandal.percentage;
            let barColor = '#ef4444'; 
            if (percentage > 80) barColor = '#10b981'; 
            else if (percentage > 30) barColor = '#3b82f6';

            return (
              <div 
                key={mandal.mandalId} 
                className="card" 
                onClick={() => setSelectedMandal(mandal.mandalId)}
                style={{ 
                  padding: '1.25rem', 
                  borderLeft: `5px solid ${barColor}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {mandal.mandalName}
                  </h3>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: barColor, background: `${barColor}15`, padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                    {percentage}%
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><School size={14} /> Total Schools</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{mandal.totalSchools}</span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><BarChart2 size={14} /> Grades</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.1rem' }}>
                      {Object.entries(mandal.gradeCounts || {}).sort(([a],[b]) => a.localeCompare(b)).map(([grade, count]) => (
                        <span key={grade} style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#334155', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                          {grade}: {count as React.ReactNode}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={14} /> Collected</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d' }}>{mandal.totalCollected}</span>
                  </div>
                  <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Target size={14} /> Target</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1d4ed8' }}>{mandal.totalTarget}</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.max(percentage, 0)}%`, 
                    height: '100%', 
                    backgroundColor: barColor, 
                    borderRadius: '4px',
                  }} />
                </div>
                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                  Tap to view {mandal.totalSchools} schools &rarr;
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHOOLS LIST VIEW (When a mandal is clicked) */}
      {!loading && !error && selectedMandal && reportData.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={() => setSelectedMandal('')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, padding: 0 }}
          >
            <ArrowLeft size={16} /> Back to Mandals
          </button>
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <BarChart2 size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <p>No schools found for this Mandal.</p>
          </div>
        </div>
      )}
      {!loading && selectedMandal && reportData.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
            <button 
              onClick={() => setSelectedMandal('')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, padding: 0 }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="badge badge-neutral" style={{ background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <School size={12} /> {reportData[0]?.mandal} ({reportData.length})
              </div>
              <SpecificMandalReportModal 
                mandalId={selectedMandal} 
                mandalName={reportData[0]?.mandal} 
                buttonLabel="PDF"
                buttonClassName="badge badge-neutral"
                buttonStyle={{ background: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', border: 'none' }}
              />
            </div>
          </div>

          {/* MANDAL SCHOOLS SUMMARY STATS CARDS */}
          {renderStatsRow(mandalSchoolsStats)}

          {reportData.map((school, index) => {
            const percentage = school.percentage;
            
            let barColor = '#ef4444'; // Red for 0-30%
            if (percentage > 80) barColor = '#10b981'; // Green for > 80%
            else if (percentage > 30) barColor = '#3b82f6'; // Blue for 31-80%

            return (
              <div key={index} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${barColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {school.schoolName}
                      </h3>
                      {school.grade && (
                        <span style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '1rem', color: '#475569', fontWeight: 600 }}>
                          {school.grade}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {school.village}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: barColor, lineHeight: 1 }}>
                      {percentage}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{school.collected}</span> <span style={{fontSize: '0.65rem'}}>/ {school.target}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '0.75rem', width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.max(percentage, 0)}%`, 
                    height: '100%', 
                    backgroundColor: barColor, 
                    borderRadius: '3px',
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add spin animation to globals if not present */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />

      <BottomNav />
    </div>
  );
}
