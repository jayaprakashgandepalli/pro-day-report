'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart2, Loader2, AlertCircle } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function AnalyticsPage() {
  const router = useRouter();
  const [mandals, setMandals] = useState<any[]>([]);
  const [selectedMandal, setSelectedMandal] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Mandals on load
  useEffect(() => {
    fetchMandals();
  }, []);

  // Fetch report data when mandal changes
  useEffect(() => {
    if (selectedMandal) {
      fetchReportData(selectedMandal);
    } else {
      setReportData([]);
    }
  }, [selectedMandal]);

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

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button onClick={() => router.back()} className="btn-icon" style={{ position: 'absolute', left: '1rem', border: 'none', background: 'none', padding: 0, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={20} color="var(--primary-color)" /> Analytics
        </h1>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Select Mandal for Analytics</label>
        <select 
          className="form-control" 
          value={selectedMandal} 
          onChange={(e) => setSelectedMandal(e.target.value)}
          style={{ fontSize: '1rem', padding: '0.75rem', borderColor: 'var(--primary-color)' }}
        >
          <option value="">-- Choose a Mandal --</option>
          {mandals.map(m => (
            <option key={m.id} value={m.id}>{m.value}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading analytics...</p>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {!loading && !error && selectedMandal && reportData.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <BarChart2 size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
          <p>No schools found for this Mandal.</p>
        </div>
      )}

      {!loading && reportData.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
            <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-muted)' }}>
              Showing {reportData.length} Schools
            </h2>
            <div className="badge badge-neutral" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              Mandal: {reportData[0]?.mandal}
            </div>
          </div>

          {reportData.map((school, index) => {
            const percentage = school.percentage;
            
            // Determine bar color based on percentage
            let barColor = 'linear-gradient(90deg, #ef4444, #dc2626)'; // Red for 0-30%
            if (percentage > 80) barColor = 'linear-gradient(90deg, #10b981, #059669)'; // Green for > 80%
            else if (percentage > 30) barColor = 'linear-gradient(90deg, #3b82f6, #2563eb)'; // Blue for 31-80%

            return (
              <div key={index} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.25rem 0', lineHeight: 1.3 }}>
                      {school.schoolName}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {school.village}
                    </p>
                  </div>
                  {school.grade && (
                    <span className="badge badge-neutral" style={{ whiteSpace: 'nowrap' }}>
                      Grade: {school.grade}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target: {school.target}</span>
                  <span style={{ color: 'var(--primary-color)' }}>Collected: {school.collected}</span>
                </div>

                {/* Progress Bar (గొట్టం) */}
                <div style={{ 
                  width: '100%', 
                  height: '24px', 
                  backgroundColor: '#e2e8f0', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    width: `${Math.max(percentage, 0)}%`, 
                    height: '100%', 
                    background: barColor,
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: percentage > 10 ? '0.5rem' : '0',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    {percentage > 10 ? `${percentage}%` : ''}
                  </div>
                </div>
                {percentage <= 10 && (
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {percentage}%
                  </div>
                )}
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
