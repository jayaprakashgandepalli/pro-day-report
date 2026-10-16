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
  Filter
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
            <Users size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F2B47' }}>
              My Assigned Team ({staffStats.length})
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
              Field Executives and Telecallers working directly under your jurisdiction in <strong>{data?.agm?.collegeName || 'College'}</strong>.
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
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by staff name or user ID..."
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

        <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '8px' }}>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '16px', textAlign: 'center', color: '#94A3B8' }}>
            No staff members match your criteria.
          </div>
        ) : (
          filtered.map((staff) => (
            <div key={staff.id} style={{
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
                {/* Top Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: staff.role === 'EMPLOYEE' ? '#ECFDF5' : '#F5F3FF',
                      color: staff.role === 'EMPLOYEE' ? '#047857' : '#6D28D9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      border: `1px solid ${staff.role === 'EMPLOYEE' ? '#A7F3D0' : '#DDD6FE'}`,
                    }}>
                      {(staff.name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F2B47' }}>
                        {staff.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Login ID: <strong>{staff.employeeId}</strong>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: staff.role === 'EMPLOYEE' ? '#ECFDF5' : '#F5F3FF',
                    color: staff.role === 'EMPLOYEE' ? '#047857' : '#6D28D9',
                    border: `1px solid ${staff.role === 'EMPLOYEE' ? '#A7F3D0' : '#DDD6FE'}`,
                  }}>
                    {staff.role === 'EMPLOYEE' ? 'Field Staff' : 'Telecaller'}
                  </span>
                </div>

                {/* Assigned Schools */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.35rem' }}>
                    Assigned Schools & Territory:
                  </div>
                  {staff.assignedSchoolNames.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {staff.assignedSchoolNames.map((scName: string, i: number) => (
                        <span key={i} style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #BFDBFE',
                        }}>
                          {scName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                      No schools assigned yet
                    </span>
                  )}
                </div>

                {/* Performance Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  backgroundColor: '#F8FAFC',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  border: '1px solid #F1F5F9',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F2B47' }}>
                      {staff.totalLeads}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>Total Leads</div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16A34A' }}>
                      {staff.doorstepDone}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>Doorstep Done</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706' }}>
                      {staff.admitted}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>Admitted</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/agm/students?staffId=${staff.employeeId}`}
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
                  transition: 'background-color 0.15s',
                }}
              >
                <span>View {staff.name}&apos;s Leads</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
