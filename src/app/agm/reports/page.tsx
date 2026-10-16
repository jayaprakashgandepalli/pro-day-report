'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  Download,
  Users,
  GraduationCap,
  School,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Building2,
  Calendar,
  Filter,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function AgmReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'TEAM' | 'SCHOOLS'>('TEAM');
  const [filterRole, setFilterRole] = useState<'ALL' | 'FIELD' | 'TELECALLER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/agm/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load report data');
      }
    } catch (e) {
      console.error(e);
      setError('Connection error loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const agmUser = data?.agm;
  const college = data?.college;
  const kpis = data?.kpis || {};
  const staffList = (data?.team || []).filter((s: any) => {
    if (filterRole === 'FIELD' && s.role !== 'EMPLOYEE') return false;
    if (filterRole === 'TELECALLER' && s.role !== 'TELECALLER') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchId = s.employeeId?.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  const schools = (data?.schools || []).filter((sch: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = sch.name?.toLowerCase().includes(q);
      const matchMandal = sch.mandal?.toLowerCase().includes(q);
      const matchEmp = sch.assignedEmployeeName?.toLowerCase().includes(q);
      if (!matchName && !matchMandal && !matchEmp) return false;
    }
    return true;
  });

  const completionPct = kpis.totalLeads > 0 
    ? Math.round((kpis.doorstepsCompleted / kpis.totalLeads) * 100) 
    : 0;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .no-print, .agm-sidebar, .agm-mobile-header, nav, button {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .report-card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            break-inside: avoid;
          }
          .print-header {
            margin-bottom: 2rem !important;
            border-bottom: 2px solid #0F2B47 !important;
            padding-bottom: 1rem !important;
          }
        }
      `}} />

      {/* Header Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0d9488', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            <FileText size={16} />
            <span>EXECUTIVE REPORTING PORTAL</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F2B47', margin: 0, letterSpacing: '-0.025em' }}>
            AGM Performance & Coverage Report
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Comprehensive performance matrix and catchment school progress for {agmUser?.name || 'Area General Manager'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={fetchStats}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              backgroundColor: '#0F2B47',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(15, 43, 71, 0.2)'
            }}
          >
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Official Print Header */}
      <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F2B47', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F2B47' }}>
            <Building2 size={24} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {college?.name || 'Navanidhi Group of Institutions'}
            </h2>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', color: '#475569', fontSize: '0.875rem' }}>
            AGM Cluster Management & Progress Report | Date Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#e6fffa', color: '#0d9488', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
            <ShieldCheck size={16} />
            <span>AGM: {agmUser?.name || 'rama krishna'} ({agmUser?.employeeId || 'rama'})</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Total Staff Supervised: {kpis.teamCount || 0} Members
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="report-card" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Users size={18} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL SUPERVISED TEAM</span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F2B47' }}>{kpis.teamCount || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {kpis.fieldStaffCount || 0} Field Staff • {kpis.telecallerCount || 0} Telecallers
          </div>
        </div>

        <div className="report-card" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <GraduationCap size={18} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL TEAM LEADS</span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F2B47' }}>{kpis.totalLeads || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>
            {kpis.admittedCount || 0} Admitted to College
          </div>
        </div>

        <div className="report-card" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c026d3' }}>
              <CheckCircle2 size={18} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>DOORSTEP PROGRESS</span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F2B47' }}>
            {kpis.doorstepsCompleted || 0} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>({completionPct}%)</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#eab308', marginTop: '0.25rem', fontWeight: 600 }}>
            {kpis.doorstepPending || 0} Doorsteps Pending
          </div>
        </div>

        <div className="report-card" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <School size={18} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>CATCHMENT SCHOOLS</span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F2B47' }}>{kpis.catchmentSchoolsCount || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Estimated 10th Pool: {kpis.total10thStrength || 0} Students
          </div>
        </div>
      </div>

      {/* Tabs and Filter Bar (no-print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedTab('TEAM')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedTab === 'TEAM' ? '#0F2B47' : '#f1f5f9',
              color: selectedTab === 'TEAM' ? '#fff' : '#475569',
            }}
          >
            Staff Performance Matrix
          </button>
          <button
            onClick={() => setSelectedTab('SCHOOLS')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedTab === 'SCHOOLS' ? '#0F2B47' : '#f1f5f9',
              color: selectedTab === 'SCHOOLS' ? '#fff' : '#475569',
            }}
          >
            Catchment Schools Coverage
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedTab === 'TEAM' && (
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f8fafc', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {(['ALL', 'FIELD', 'TELECALLER'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: filterRole === role ? '#fff' : 'transparent',
                    color: filterRole === role ? '#0F2B47' : '#64748b',
                    boxShadow: filterRole === role ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {role === 'ALL' ? 'All Roles' : role === 'FIELD' ? 'Field Staff' : 'Telecallers'}
                </button>
              ))}
            </div>
          )}

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={selectedTab === 'TEAM' ? 'Search employee...' : 'Search school or mandal...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab Content 1: Team Staff Performance Matrix */}
      {selectedTab === 'TEAM' && (
        <div className="report-card" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F2B47' }}>
              Staff Performance & Doorstep Completion Matrix ({staffList.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Showing supervised team members
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Employee Name & Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Login ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Catchment</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Total Leads</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Doorsteps Done</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Doorsteps Pending</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Completion %</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  staffList.map((s: any, idx: number) => {
                    const total = s.leadsCount || 0;
                    const done = s.doorstepDone || 0;
                    const pending = s.doorstepPending || 0;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                    return (
                      <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0F2B47' }}>{s.name}</div>
                          <span style={{
                            display: 'inline-block',
                            marginTop: '0.2rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: s.role === 'EMPLOYEE' ? '#e0f2fe' : '#fce7f3',
                            color: s.role === 'EMPLOYEE' ? '#0369a1' : '#be185d'
                          }}>
                            {s.role === 'EMPLOYEE' ? '🏃 FIELD STAFF' : '📞 TELECALLER'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                          {s.employeeId}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontWeight: 600, color: '#0F2B47' }}>
                            {s.role === 'EMPLOYEE' ? `${s.schoolsCount || 0} Schools` : 'Across Assigned Leads'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#0F2B47' }}>
                          {total}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                          {done}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: pending > 0 ? '#ea580c' : '#94a3b8' }}>
                          {pending}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ width: '45px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 80 ? '#16a34a' : pct >= 40 ? '#0d9488' : '#f59e0b' }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155' }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: s.isActive ? '#dcfce7' : '#fee2e2',
                            color: s.isActive ? '#15803d' : '#b91c1c'
                          }}>
                            {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Catchment Schools Coverage */}
      {selectedTab === 'SCHOOLS' && (
        <div className="report-card" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F2B47' }}>
              Assigned Catchment Schools Coverage ({schools.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Coverage across supervised field staff
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>School Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mandal</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Field Staff</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>10th Pool Strength</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Leads Collected</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Doorsteps Done</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Headmaster Contact</th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No catchment schools found for supervised staff.
                    </td>
                  </tr>
                ) : (
                  schools.map((sch: any, idx: number) => (
                    <tr key={sch.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#0F2B47' }}>
                        {sch.name}
                      </td>
                      <td style={{ padding: '1rem', color: '#475569' }}>
                        {sch.mandal || 'N/A'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 600, color: '#0284c7' }}>
                          {sch.assignedEmployeeName || 'Unassigned'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#0F2B47' }}>
                        {sch.strength || 0}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#0d9488' }}>
                        {sch.leadsCount || 0}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                        {sch.doorstepsCompleted || 0}
                      </td>
                      <td style={{ padding: '1rem', color: '#475569', fontSize: '0.8rem' }}>
                        {sch.headmasterName ? `${sch.headmasterName} (${sch.headmasterPhone || 'No Phone'})` : 'Not recorded'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Sign-off Block for Printouts */}
      <div className="print-only" style={{ display: 'none', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed #94a3b8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem' }}>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '30px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>AGM Signature</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{agmUser?.name || 'rama krishna'}</div>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '30px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>College Principal / Director</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{college?.name || 'Navanidhi Group'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
