'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  Search,
  ArrowLeft,
  RefreshCw,
  MapPin
} from 'lucide-react';

function StaffSchoolsContent() {
  const searchParams = useSearchParams();
  const staffId = searchParams.get('staffId') || '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStaffData = async () => {
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
    fetchStaffData();
  }, []);

  const staffStats: any[] = data?.staffStats || [];
  const staff = staffStats.find(
    (s: any) => s.employeeId === staffId || s.id === staffId
  );

  const schools: any[] = staff?.schools || [];

  const filteredSchools = schools.filter((sc: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchName = (sc.name || '').toLowerCase().includes(q);
    const matchMandal = (sc.mandalName || '').toLowerCase().includes(q);
    return matchName || matchMandal;
  });

  return (
    <div style={{ padding: '1.25rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/agm/team"
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
            marginBottom: '0.85rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to My Team</span>
        </Link>

        {/* Staff Header Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.15rem 1.35rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              flexShrink: 0,
            }}>
              {staff?.name ? staff.name.charAt(0).toUpperCase() : <School size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2B47' }}>
                  {staff ? staff.name : (loading ? 'Loading...' : 'Staff Member')}
                </h1>
                <span style={{
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                }}>
                  Field Staff
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', gap: '0.75rem' }}>
                <span>Login ID: <strong style={{ color: '#0F2B47' }}>{staff?.employeeId || staffId}</strong></span>
                <span>•</span>
                <span>Assigned Schools: <strong style={{ color: '#047857' }}>{schools.length}</strong></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStaffData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {schools.length > 0 && (
        <div style={{
          position: 'relative',
          marginBottom: '1rem',
        }}>
          <Search size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder={`Search from ${schools.length} assigned schools by name or mandal...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.88rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              outline: 'none',
              color: '#0F2B47',
            }}
          />
        </div>
      )}

      {/* Schools List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
          <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#047857' }} />
          <p style={{ margin: 0, fontWeight: 700 }}>Loading assigned schools...</p>
        </div>
      ) : !staff ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
            Staff member with ID &quot;{staffId}&quot; not found.
          </p>
          <Link
            href="/agm/team"
            style={{
              display: 'inline-flex',
              padding: '0.55rem 1.15rem',
              backgroundColor: '#047857',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
            }}
          >
            Back to Team List
          </Link>
        </div>
      ) : filteredSchools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <School size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ color: '#64748b', fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>
            {search ? 'No schools match your search query.' : 'No schools assigned to this staff member yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredSchools.map((s: any) => {
            const strength = s.strength || 0;
            const collected = s.collected || 0;
            const percentage = strength > 0 ? Math.round((collected / strength) * 100) : (s.coverageRate || 0);

            return (
              <div
                key={s.id || s.name}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '1.1rem 1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.02rem', color: '#0F2B47' }}>
                      {s.name}
                    </h3>
                    {s.mandalName && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} color="#047857" />
                        <span>{s.mandalName}</span>
                      </div>
                    )}
                  </div>

                  {/* Small Percentage Badge */}
                  <span style={{
                    backgroundColor: percentage >= 50 ? '#dcfce7' : percentage > 0 ? '#e0f2fe' : '#f1f5f9',
                    color: percentage >= 50 ? '#15803d' : percentage > 0 ? '#0284c7' : '#64748b',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                  }}>
                    {percentage}%
                  </span>
                </div>

                {/* Number Display & Slim Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Collected Data:</span>
                    <span style={{ fontWeight: 800, color: '#0F2B47' }}>
                      <strong style={{ color: '#047857', fontSize: '1.05rem' }}>{collected}</strong>
                      <span style={{ color: '#94a3b8', margin: '0 0.25rem' }}>/</span>
                      <span>{strength}</span>
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                        height: '100%',
                        backgroundColor: '#047857',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AgmStaffSchoolsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#047857' }} />
        <p style={{ margin: 0, fontWeight: 700 }}>Loading assigned schools...</p>
      </div>
    }>
      <StaffSchoolsContent />
    </Suspense>
  );
}
