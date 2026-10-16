'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Briefcase,
  Headset,
  UserCheck,
  Check,
  X,
  Pencil,
  Power,
  MapPin,
  School,
  Building,
  Search,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CollegeTeamPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for creating staff
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TELECALLER');
  const [assignedAgms, setAssignedAgms] = useState<string[]>([]);

  // Metadata for locations (to display names on badges)
  const [locationsData, setLocationsData] = useState<{
    mandals: Array<{ id: string; name: string }>;
    schools: Array<{ id: string; name: string; mandalId: string | null; mandalName: string; villageName: string }>;
  } | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTeam();
    fetchLocations();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/college/team');
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

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/college/locations');
      if (res.ok) {
        const json = await res.json();
        setLocationsData(json);
      }
    } catch (e) {
      console.error('Error fetching locations:', e);
    }
  };

  const quotas = data?.quotas || {
    agms: { used: 0, max: 2 },
    telecallers: { used: 0, max: 5 },
    employees: { used: 0, max: 10 },
  };

  const agms = data?.agms || [];
  const team = data?.team || [];

  const getRemainingSeats = (r: string) => {
    if (r === 'AGM') return quotas.agms.max - quotas.agms.used;
    if (r === 'TELECALLER') return quotas.telecallers.max - quotas.telecallers.used;
    if (r === 'EMPLOYEE') return quotas.employees.max - quotas.employees.used;
    return 0;
  };

  const openAddModal = () => {
    setError('');
    setSuccess('');
    setAssignedAgms([]);
    if (quotas.telecallers.max - quotas.telecallers.used > 0) {
      setRole('TELECALLER');
    } else if (quotas.employees.max - quotas.employees.used > 0) {
      setRole('EMPLOYEE');
    } else if (quotas.agms.max - quotas.agms.used > 0) {
      setRole('AGM');
    } else {
      setRole('TELECALLER');
    }
    setShowAddModal(true);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/college/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          employeeId,
          password,
          role,
          assignedAgms: (role === 'TELECALLER' || role === 'EMPLOYEE') ? assignedAgms : [],
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setSuccess(`Team member "${name}" (${role}) created successfully! Click Edit to assign Mandals & Schools.`);
        setName('');
        setEmployeeId('');
        setPassword('');
        setAssignedAgms([]);
        setShowAddModal(false);
        fetchTeam();
        fetchLocations();
      } else {
        setError(resData.error || 'Failed to create team member');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleToggleStatus = async (member: any) => {
    try {
      const res = await fetch('/api/college/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          isActive: !member.isActive,
        }),
      });
      if (res.ok) {
        fetchTeam();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'AGM':
        return { label: '👔 AGM / Manager', bg: '#fef3c7', color: '#92400e' };
      case 'TELECALLER':
        return { label: '📞 Telecaller', bg: '#e0e7ff', color: '#3730a3' };
      case 'EMPLOYEE':
        return { label: '🏃 Field Employee', bg: '#dcfce7', color: '#166534' };
      default:
        return { label: r, bg: '#f1f5f9', color: '#475569' };
    }
  };

  const getAgmNames = (assignedIds: string[] = []) => {
    if (!assignedIds || assignedIds.length === 0) return null;
    return assignedIds
      .map(id => agms.find((a: any) => a.employeeId === id)?.name || id)
      .join(', ');
  };

  // Helper to get Mandal Names by IDs
  const getMandalNames = (mandalIds: string[] = []) => {
    if (!mandalIds || mandalIds.length === 0) return [];
    return mandalIds.map(id => locationsData?.mandals.find(m => m.id === id)?.name || id);
  };

  // Helper to get School Names by IDs
  const getSchoolNames = (schoolIds: string[] = []) => {
    if (!schoolIds || schoolIds.length === 0) return [];
    return schoolIds.map(id => locationsData?.schools.find(s => s.id === id)?.name || id);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} color="#047857" /> Team & Staff Management
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Create and manage your AGMs, Telecallers, and Field Employees. Click the ✏️ Edit icon on any row to configure full details, reporting hierarchy, and exclusive school assignments.
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(4, 120, 87, 0.25)',
          }}
        >
          <Plus size={18} /> Add Team Member
        </button>
      </div>

      {/* Quotas Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* AGMs Card */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>👔 AGMs & Managers</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '12px',
              backgroundColor: quotas.agms.used >= quotas.agms.max ? '#fee2e2' : '#fef3c7',
              color: quotas.agms.used >= quotas.agms.max ? '#991b1b' : '#92400e',
            }}>
              {quotas.agms.max - quotas.agms.used} seats left
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F2B47' }}>{quotas.agms.used}</span>
            <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>/ {quotas.agms.max} allowed</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (quotas.agms.used / (quotas.agms.max || 1)) * 100)}%`,
              height: '100%',
              backgroundColor: '#f59e0b',
            }} />
          </div>
        </div>

        {/* Telecallers Card */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>📞 Telecallers</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '12px',
              backgroundColor: quotas.telecallers.used >= quotas.telecallers.max ? '#fee2e2' : '#e0e7ff',
              color: quotas.telecallers.used >= quotas.telecallers.max ? '#991b1b' : '#3730a3',
            }}>
              {quotas.telecallers.max - quotas.telecallers.used} seats left
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F2B47' }}>{quotas.telecallers.used}</span>
            <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>/ {quotas.telecallers.max} allowed</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (quotas.telecallers.used / (quotas.telecallers.max || 1)) * 100)}%`,
              height: '100%',
              backgroundColor: '#6366f1',
            }} />
          </div>
        </div>

        {/* Field Employees Card */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>🏃 Field Staff</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '12px',
              backgroundColor: quotas.employees.used >= quotas.employees.max ? '#fee2e2' : '#d1fae5',
              color: quotas.employees.used >= quotas.employees.max ? '#991b1b' : '#065f46',
            }}>
              {quotas.employees.max - quotas.employees.used} seats left
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F2B47' }}>{quotas.employees.used}</span>
            <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>/ {quotas.employees.max} allowed</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (quotas.employees.used / (quotas.employees.max || 1)) * 100)}%`,
              height: '100%',
              backgroundColor: '#10b981',
            }} />
          </div>
        </div>
      </div>

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#166534' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Staff Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F2B47' }}>
              College Staff Members ({team.length})
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Click the ✏️ Edit button on any row to open the full edit page for that staff member.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading team members...</div>
        ) : team.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>No Staff Members Added Yet</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Click "Add Team Member" above to create logins for your AGMs, Telecallers, and Field Employees.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>STAFF NAME</th>
                  <th style={{ padding: '0.75rem 1rem' }}>LOGIN ID (USER ID)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ROLE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ASSIGNED AGM(S)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ASSIGNED SCHOOLS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ASSIGNED LEADS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {team.map((m: any) => {
                  const badge = getRoleBadge(m.role);
                  const agmNames = getAgmNames(m.assignedAgms);
                  const validSchools = (m.assignedSchools || []).filter((sId: string) =>
                    locationsData?.schools.some(s => s.id === sId)
                  );
                  const schoolsCount = validSchools.length;
                  const schoolTitles = getSchoolNames(validSchools);

                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0F2B47' }}>
                        <Link
                          href={`/college/team/${m.id}`}
                          style={{ color: '#0F2B47', textDecoration: 'none' }}
                          title="Click to edit staff details and school assignments"
                        >
                          {m.name}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#334155' }}>
                          {m.employeeId}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {m.role === 'TELECALLER' || m.role === 'EMPLOYEE' ? (
                          agmNames ? (
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                              👔 {agmNames}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None Assigned</span>
                          )
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      {/* Assigned Schools column */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {m.role === 'EMPLOYEE' ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                            {schoolsCount > 0 ? (
                              <span
                                title={`Assigned Schools: ${schoolTitles.join(' | ')}`}
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: '#047857',
                                  background: '#dcfce7',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid #bbf7d0',
                                  cursor: 'default',
                                }}
                              >
                                🏫 {schoolsCount} {schoolsCount === 1 ? 'School' : 'Schools'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                No Schools Assigned
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>
                        {m._count?.students || 0}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: m.isActive ? '#dcfce7' : '#fee2e2',
                          color: m.isActive ? '#166534' : '#991b1b',
                        }}>
                          {m.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {/* ✏️ Direct Link to Dedicated Full Edit Page */}
                          <Link
                            href={`/college/team/${m.id}`}
                            title="Edit Details, Hierarchy & Exclusive Schools"
                            style={{
                              padding: '0.45rem 0.75rem',
                              backgroundColor: '#f1f5f9',
                              color: '#0F2B47',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              textDecoration: 'none',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Pencil size={15} /> Edit
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(m)}
                            title={m.isActive ? 'Disable Member' : 'Activate Member'}
                            style={{
                              padding: '0.45rem 0.65rem',
                              backgroundColor: m.isActive ? '#fee2e2' : '#dcfce7',
                              color: m.isActive ? '#991b1b' : '#166534',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <Power size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal (Quick creation) */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={22} color="#047857" /> Add New Team Member
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>This user will be able to login via Web and Mobile App.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                <X size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Staff Role *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { key: 'AGM', label: '👔 AGM', seats: quotas.agms.max - quotas.agms.used },
                    { key: 'TELECALLER', label: '📞 Telecaller', seats: quotas.telecallers.max - quotas.telecallers.used },
                    { key: 'EMPLOYEE', label: '🏃 Field Staff', seats: quotas.employees.max - quotas.employees.used },
                  ].map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '10px',
                        border: role === r.key ? '2px solid #047857' : '1px solid #cbd5e1',
                        backgroundColor: role === r.key ? '#ecfdf5' : '#ffffff',
                        color: role === r.key ? '#047857' : '#475569',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span style={{ fontSize: '0.95rem' }}>{r.label}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: r.seats <= 0 ? '#991b1b' : '#047857',
                        backgroundColor: r.seats <= 0 ? '#fee2e2' : '#dcfce7',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '10px',
                      }}>
                        {r.seats <= 0 ? 'Quota Full' : `${r.seats} left`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Ramesh Varma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>User ID / Login ID *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. ramesh_field"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Must be unique across the platform.</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Password *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Initial login password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {role === 'TELECALLER' && (
                <div className="form-group" style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0F2B47', marginBottom: '0.3rem' }}>
                    👔 Assign to AGM(s) <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.8rem' }}>(Multiple allowed)</span>
                  </label>
                  {agms.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      No AGMs found. You can assign AGMs later after creating an AGM member.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {agms.map((agm: any) => {
                        const isChecked = assignedAgms.includes(agm.employeeId);
                        return (
                          <label
                            key={agm.employeeId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.4rem 0.6rem',
                              background: isChecked ? '#ecfdf5' : '#ffffff',
                              border: isChecked ? '1.5px solid #047857' : '1px solid #cbd5e1',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setAssignedAgms(assignedAgms.filter(id => id !== agm.employeeId));
                                } else {
                                  setAssignedAgms([...assignedAgms, agm.employeeId]);
                                }
                              }}
                            />
                            <strong>{agm.name}</strong>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {role === 'EMPLOYEE' && (
                <div className="form-group" style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0F2B47', marginBottom: '0.3rem' }}>
                    👔 Reporting AGM <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.8rem' }}>(1 AGM only)</span>
                  </label>
                  {agms.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      No AGMs found. You can assign reporting AGM later after creating an AGM.
                    </div>
                  ) : (
                    <select
                      className="form-control"
                      value={assignedAgms[0] || ''}
                      onChange={(e) => setAssignedAgms(e.target.value ? [e.target.value] : [])}
                    >
                      <option value="">-- Select Reporting AGM --</option>
                      {agms.map((agm: any) => (
                        <option key={agm.employeeId} value={agm.employeeId}>
                          👔 {agm.name} ({agm.employeeId})
                        </option>
                      ))}
                    </select>
                  )}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
                    💡 Note: After creating, click "Edit" on the row to configure Mandals & Schools.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={getRemainingSeats(role) <= 0}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    backgroundColor: getRemainingSeats(role) <= 0 ? '#94a3b8' : '#047857',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: getRemainingSeats(role) <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {getRemainingSeats(role) <= 0 ? 'Quota Full for this Role' : 'Create Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.85rem 1.5rem',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
