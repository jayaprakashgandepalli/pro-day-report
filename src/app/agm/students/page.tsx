'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Phone,
  School,
  MapPin,
  Calendar,
  UserCheck,
  Star,
  FileSpreadsheet
} from 'lucide-react';

function AgmStudentsContent() {
  const searchParams = useSearchParams();
  const initialStaffId = searchParams.get('staffId') || '';

  const [students, setStudents] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStaff, setSelectedStaff] = useState(initialStaffId);
  const [selectedDoorstep, setSelectedDoorstep] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStaff) params.set('staffId', selectedStaff);
      if (selectedDoorstep !== 'ALL') params.set('doorstep', selectedDoorstep);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (search) params.set('search', search);

      const res = await fetch(`/api/agm/students?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setStudents(json.students || []);
        if (json.staffMembers) {
          setStaffMembers(json.staffMembers);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedStaff, selectedDoorstep, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

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
        @media (max-width: 767px) {
          .agm-page-container {
            padding: 0.85rem 0.75rem !important;
            gap: 1rem !important;
          }
          .agm-filter-box {
            padding: 0.85rem 1rem !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .agm-filter-box > div {
            min-width: 100% !important;
          }
        }
      `}} />
      
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
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F2B47' }}>
              Team Students Registry ({students.length})
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
              All prospective students entered and visited by field staff & telecallers under your supervision.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStudents}
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

      {/* Filters & Search Header */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.25rem',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by student name, phone, or father..."
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
        </form>

        {/* Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Staff Filter */}
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              backgroundColor: '#fff',
            }}
          >
            <option value="">All Team Staff ({staffMembers.length})</option>
            {staffMembers.map((s) => (
              <option key={s.employeeId} value={s.employeeId}>
                {s.name} ({s.role === 'EMPLOYEE' ? 'Field' : 'Telecaller'})
              </option>
            ))}
          </select>

          {/* Doorstep Filter */}
          <select
            value={selectedDoorstep}
            onChange={(e) => setSelectedDoorstep(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              backgroundColor: '#fff',
            }}
          >
            <option value="ALL">All Doorsteps</option>
            <option value="completed">Doorstep Completed</option>
            <option value="pending">Doorstep Pending</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              backgroundColor: '#fff',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Admitted">Admitted Only</option>
            <option value="New">New Leads</option>
            <option value="Prime Lead">Prime Leads</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569', width: '40px' }}>#</th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569' }}>Student & Father</th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569' }}>Phone</th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569' }}>School & Area</th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569' }}>Group / Marks</th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569' }}>Doorstep Status</th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569' }}>Staff Member</th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569' }}>Lead Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    <div>Loading team students...</div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                    No students found matching your selected filters.
                  </td>
                </tr>
              ) : (
                students.map((st, i) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.85rem 0.85rem', color: '#94A3B8', fontWeight: 600 }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '0.85rem 0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#0F2B47' }}>{st.studentName}</div>
                      {st.fatherName && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          S/O {st.fatherName} {st.occupation ? `(${st.occupation})` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.85rem' }}>
                      <div style={{ fontWeight: 600, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={13} style={{ color: '#16A34A' }} />
                        <span>{st.phone || '-'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.85rem' }}>
                      <div style={{ fontWeight: 600, color: '#0F2B47' }}>{st.schoolName || '-'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {st.village || ''} {st.mandal ? `• ${st.mandal}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#0F2B47' }}>{st.group || '-'}</div>
                      {st.marks && (
                        <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>
                          Marks: {st.marks}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.85rem' }}>
                      {st.doorstepCompleted ? (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}>
                          <CheckCircle2 size={12} />
                          Completed
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}>
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                      {st.latestVisit?.remarks && (
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic', marginTop: '0.2rem', maxWidth: '180px' }}>
                          &ldquo;{st.latestVisit.remarks}&rdquo;
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.85rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #BFDBFE',
                      }}>
                        {st.staffName}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.85rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: (st.leadStatus || '').toLowerCase() === 'admitted' ? '#DCFCE7' : '#F1F5F9',
                        color: (st.leadStatus || '').toLowerCase() === 'admitted' ? '#15803D' : '#475569',
                      }}>
                        {st.leadStatus || 'New'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default function AgmStudentsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading...</div>}>
      <AgmStudentsContent />
    </Suspense>
  );
}
