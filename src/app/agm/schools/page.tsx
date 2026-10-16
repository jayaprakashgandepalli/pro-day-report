'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  School,
  Search,
  Phone,
  Users,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function AgmSchoolsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSchools = async () => {
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
    fetchSchools();
  }, []);

  const catchmentSchools: any[] = data?.catchmentSchools || [];

  const filtered = catchmentSchools.filter(sc => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = (sc.name || '').toLowerCase().includes(q);
      const matchHm = (sc.headmasterName || '').toLowerCase().includes(q);
      const matchStaff = (sc.staffAssigned || []).some((s: string) => s.toLowerCase().includes(q));
      if (!matchName && !matchHm && !matchStaff) return false;
    }
    return true;
  });

  const totalStrength = catchmentSchools.reduce((acc, sc) => acc + (sc.strength || 0), 0);
  const totalCollected = catchmentSchools.reduce((acc, sc) => acc + (sc.collectedCount || 0), 0);
  const overallCoverage = totalStrength > 0 ? Math.round((totalCollected / totalStrength) * 100) : 0;

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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#0F2B47',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
          }}>
            <School size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F2B47' }}>
              Catchment Schools Coverage ({catchmentSchools.length})
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
              High schools allocated to your field executives for admissions outreach and doorstep tracking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSchools}
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

      {/* Aggregate KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TOTAL ALLOCATED SCHOOLS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.25rem' }}>{catchmentSchools.length}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TOTAL 10TH STRENGTH</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.25rem' }}>{totalStrength}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>LEADS CAPTURED</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A', marginTop: '0.25rem' }}>{totalCollected}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>OVERALL COVERAGE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB', marginTop: '0.25rem' }}>{overallCoverage}%</div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ backgroundColor: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search school name, headmaster, or assigned staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              fontSize: '0.85rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Schools Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', backgroundColor: '#fff', borderRadius: '16px', textAlign: 'center', color: '#94A3B8' }}>
            No schools found matching your search.
          </div>
        ) : (
          filtered.map((sc) => {
            const coverage = sc.strength > 0 ? Math.min(100, Math.round((sc.collectedCount / sc.strength) * 100)) : 0;
            return (
              <div key={sc.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <School size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0F2B47' }}>
                          {sc.name}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          10th Student Strength: <strong>{sc.strength || 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Headmaster Info */}
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #F1F5F9',
                    fontSize: '0.78rem',
                    color: '#475569',
                    marginBottom: '1rem',
                  }}>
                    <div>Headmaster: <strong>{sc.headmasterName || 'Not Available'}</strong></div>
                    {sc.headmasterPhone && sc.headmasterPhone !== '-' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', color: '#16A34A', fontWeight: 600 }}>
                        <Phone size={12} />
                        <span>{sc.headmasterPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Staff */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>
                      Assigned Field Executive:
                    </div>
                    {sc.staffAssigned.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {sc.staffAssigned.map((st: string, idx: number) => (
                          <span key={idx} style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: '#ECFDF5',
                            color: '#047857',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #A7F3D0',
                          }}>
                            {st}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        No executive assigned
                      </span>
                    )}
                  </div>

                  {/* Coverage Progress */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <span style={{ color: '#64748B' }}>Leads Collected:</span>
                      <span style={{ color: '#0F2B47' }}>{sc.collectedCount} / {sc.strength || 0} ({coverage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${coverage}%`, height: '100%', backgroundColor: '#059669', borderRadius: '999px' }} />
                    </div>
                  </div>
                </div>

                <Link
                  href={`/agm/students?school=${encodeURIComponent(sc.name)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    padding: '0.65rem 1rem',
                    backgroundColor: '#0F2B47',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <span>View Leads from {sc.name}</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
