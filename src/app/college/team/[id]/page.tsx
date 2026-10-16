'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Save,
  Check,
  X,
  MapPin,
  School,
  Building,
  Search,
  Lock,
  Power,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Plus
} from 'lucide-react';

export default function EditStaffMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const memberId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Member form state
  const [member, setMember] = useState<any>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [assignedAgms, setAssignedAgms] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);

  // Metadata
  const [agms, setAgms] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolAssignments, setSchoolAssignments] = useState<Record<string, { employeeId: string; employeeName: string; isActive: boolean }>>({});

  // Cascading Selection State
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedMandal, setSelectedMandal] = useState<string>('');
  const [schoolSearch, setSchoolSearch] = useState('');

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  const fetchMemberData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/college/team/${memberId}`);
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to load staff details');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMember(data.member);
      setName(data.member.name || '');
      setIsActive(data.member.isActive ?? true);
      setAssignedAgms(data.member.assignedAgms || []);
      setSelectedSchools(data.member.assignedSchools || []);

      setAgms(data.agms || []);
      setDistricts(data.districts || []);
      setMandals(data.mandals || []);
      setSchools(data.schools || []);
      setSchoolAssignments(data.schoolAssignments || {});

      // Pre-select first district and mandal if available
      if (data.districts && data.districts.length > 0) {
        const firstDist = data.districts[0].id;
        setSelectedDistrict(firstDist);
        const firstMandal = (data.mandals || []).find((m: any) => m.districtId === firstDist);
        if (firstMandal) {
          setSelectedMandal(firstMandal.id);
        }
      }
    } catch (e: any) {
      setError('An error occurred while loading staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        id: memberId,
        name: name.trim(),
        isActive,
        assignedAgms: (member.role === 'TELECALLER' || member.role === 'EMPLOYEE') ? assignedAgms : undefined,
      };

      if (newPassword.trim()) {
        payload.newPassword = newPassword.trim();
      }

      if (member.role === 'EMPLOYEE') {
        payload.assignedSchools = selectedSchools;
        // Derive mandals directly from assigned schools to keep data clean
        const derivedMandals = Array.from(
          new Set(
            selectedSchools
              .map(sId => schools.find(s => s.id === sId)?.mandalId)
              .filter(Boolean)
          )
        );
        payload.assignedMandals = derivedMandals;
      }

      const res = await fetch('/api/college/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || 'Failed to save staff changes');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSuccess('All changes saved successfully! Returning to team list...');
        setTimeout(() => {
          router.push('/college/team');
        }, 1200);
      }
    } catch (e: any) {
      setError('Failed to save changes. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '3rem auto', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: '1.1rem' }}>Loading staff setup...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontWeight: 700, fontSize: '1.2rem' }}>Staff member not found.</p>
        <Link
          href="/college/team"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: '#047857',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            marginTop: '1rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Team List
        </Link>
      </div>
    );
  }

  // Filter Mandals by selected District
  const availableMandals = selectedDistrict
    ? mandals.filter(m => m.districtId === selectedDistrict)
    : [];

  // Filter Schools by selected District & Mandal
  const visibleSchools = schools.filter(s => {
    if (selectedMandal) {
      return s.mandalId === selectedMandal;
    }
    if (selectedDistrict) {
      return s.districtId === selectedDistrict;
    }
    return true;
  });

  const searchedSchools = visibleSchools.filter(s => {
    if (!schoolSearch.trim()) return true;
    const q = schoolSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.villageName && s.villageName.toLowerCase().includes(q)) ||
      (s.mandalName && s.mandalName.toLowerCase().includes(q))
    );
  });

  const isFieldStaff = member.role === 'EMPLOYEE';
  const isTelecaller = member.role === 'TELECALLER';
  const isAgm = member.role === 'AGM';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/college/team"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.9rem',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <ArrowLeft size={16} /> Back to Team
          </Link>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0F2B47' }}>
                Edit Staff: {member.name}
              </h1>
              <span style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: isFieldStaff ? '#dcfce7' : isTelecaller ? '#e0e7ff' : '#fef3c7',
                color: isFieldStaff ? '#166534' : isTelecaller ? '#3730a3' : '#92400e',
              }}>
                {isFieldStaff ? '🏃 Field Staff' : isTelecaller ? '📞 Telecaller' : '👔 AGM / Manager'}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Login ID: <strong style={{ fontFamily: 'monospace' }}>{member.employeeId}</strong> &bull; Total Leads: {member._count?.students || 0}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
            fontSize: '0.95rem',
          }}
        >
          <Save size={18} /> {saving ? 'Saving Changes...' : 'Save All Changes'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 }}>
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Card 1: Basic Profile & Credentials */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="#047857" /> 1. Staff Profile & Login Credentials
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Staff full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>User ID / Login ID</label>
              <input
                type="text"
                disabled
                className="form-control"
                value={member.employeeId}
                style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Login ID is fixed and cannot be changed.</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Account Status</label>
              <select
                className="form-control"
                value={isActive ? 'true' : 'false'}
                onChange={e => setIsActive(e.target.value === 'true')}
              >
                <option value="true">✅ Active (Can log in)</option>
                <option value="false">❌ Disabled / Inactive (Login blocked)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Reset Password <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Leave blank to keep current)</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Type new password..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Reporting Hierarchy (AGMs) */}
        {(isTelecaller || isFieldStaff) && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#f59e0b" /> 2. Reporting AGM Hierarchy
            </h2>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              {isTelecaller
                ? 'Telecallers can be assigned to one or multiple AGMs.'
                : 'Field Staff report to exactly 1 AGM.'}
            </p>

            {agms.length === 0 ? (
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
                No AGMs created in this college yet. Create an AGM first to assign hierarchy.
              </div>
            ) : isTelecaller ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
                {agms.map((agm: any) => {
                  const isChecked = assignedAgms.includes(agm.employeeId);
                  return (
                    <label
                      key={agm.employeeId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 0.9rem',
                        background: isChecked ? '#ecfdf5' : '#ffffff',
                        border: isChecked ? '1.5px solid #047857' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
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
                      <div>
                        <strong>{agm.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{agm.employeeId}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div style={{ maxWidth: '420px' }}>
                <select
                  className="form-control"
                  value={assignedAgms[0] || ''}
                  onChange={e => setAssignedAgms(e.target.value ? [e.target.value] : [])}
                >
                  <option value="">-- None Assigned --</option>
                  {agms.map((agm: any) => (
                    <option key={agm.employeeId} value={agm.employeeId}>
                      👔 {agm.name} ({agm.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Card 3: Schools Assignment (Only for Field Staff) */}
        {isFieldStaff && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <School size={22} color="#047857" /> 3. Assign Catchment Schools
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                  Select <strong>District</strong> and <strong>Mandal</strong> below to view high schools and assign them to this employee. Schools are <strong>strictly exclusive (1 staff per school)</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 700, color: '#047857', background: '#dcfce7', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  🏫 {selectedSchools.length} Schools Assigned
                </span>
              </div>
            </div>

            {/* Currently Assigned Schools Pills (across all mandals) */}
            {selectedSchools.length > 0 && (
              <div style={{ marginBottom: '1.25rem', backgroundColor: '#f0fdf4', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                    Currently Assigned Schools ({selectedSchools.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSchools([])}
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear All Assigned
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedSchools.map(schId => {
                    const sch = schools.find(s => s.id === schId);
                    if (!sch) return null;
                    return (
                      <span
                        key={schId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#ffffff',
                          border: '1px solid #86efac',
                          color: '#166534',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        🏫 {sch.name} {sch.mandalName ? `(${sch.mandalName})` : ''}
                        <button
                          type="button"
                          onClick={() => setSelectedSchools(selectedSchools.filter(id => id !== schId))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: 0,
                            marginLeft: '0.2rem',
                          }}
                          title="Remove school assignment"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cascading District & Mandal Dropdowns */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    🏛️ 1. Select District
                  </label>
                  <select
                    className="form-control"
                    value={selectedDistrict}
                    onChange={e => {
                      const newDist = e.target.value;
                      setSelectedDistrict(newDist);
                      const firstM = mandals.find(m => m.districtId === newDist);
                      setSelectedMandal(firstM ? firstM.id : '');
                    }}
                    style={{ fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    <option value="">-- Choose District --</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    📍 2. Select Mandal
                  </label>
                  <select
                    className="form-control"
                    value={selectedMandal}
                    onChange={e => setSelectedMandal(e.target.value)}
                    disabled={!selectedDistrict}
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      backgroundColor: selectedDistrict ? '#ffffff' : '#f1f5f9',
                      cursor: selectedDistrict ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <option value="">
                      {selectedDistrict ? '-- Choose Mandal --' : '-- First Select District --'}
                    </option>
                    {availableMandals.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    🔍 Filter Schools
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search school name or village..."
                      className="form-control"
                      style={{ paddingLeft: '2rem', fontSize: '0.88rem' }}
                      value={schoolSearch}
                      onChange={e => setSchoolSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step: Schools in Selected Mandal */}
            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <School size={16} color="#047857" />
                    {selectedMandal
                      ? `Schools in ${mandals.find(m => m.id === selectedMandal)?.name || 'Selected Mandal'} (${visibleSchools.length})`
                      : 'Schools'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                    🔒 Each school is exclusive (locked to 1 staff member).
                  </span>
                </div>

                {selectedMandal && visibleSchools.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const availableIds = visibleSchools
                          .filter(s => {
                            const assign = schoolAssignments[s.id];
                            return !assign || assign.employeeId === member.id;
                          })
                          .map(s => s.id);
                        setSelectedSchools(Array.from(new Set([...selectedSchools, ...availableIds])));
                      }}
                      style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.35rem 0.75rem', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Select All in this Mandal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const mandalSchoolIds = new Set(visibleSchools.map(s => s.id));
                        setSelectedSchools(selectedSchools.filter(id => !mandalSchoolIds.has(id)));
                      }}
                      style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.35rem 0.75rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Deselect Mandal Schools
                    </button>
                  </div>
                )}
              </div>

              {/* Schools Grid */}
              <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.65rem', paddingRight: '0.25rem' }}>
                {!selectedDistrict ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <Building size={36} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.98rem', color: '#0F2B47' }}>
                      Please select a District above to view mandals and schools.
                    </p>
                  </div>
                ) : !selectedMandal ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <MapPin size={36} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.98rem', color: '#0F2B47' }}>
                      Please select a Mandal above to view schools in that mandal.
                    </p>
                  </div>
                ) : schools.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <School size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#0F2B47' }}>
                      No Catchment Schools Added for Your College Yet
                    </p>
                    <p style={{ margin: '0.4rem auto 1rem auto', fontSize: '0.88rem', maxWidth: '440px' }}>
                      Please go to the <strong>Schools</strong> page to add high schools with HM and contact details, then return here to assign them to your staff.
                    </p>
                    <Link
                      href="/college/schools"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.55rem 1.1rem',
                        backgroundColor: '#047857',
                        color: '#fff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                      }}
                    >
                      <Plus size={16} /> Go to Schools Management
                    </Link>
                  </div>
                ) : searchedSchools.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    No schools found in this mandal matching your search.
                  </div>
                ) : (
                  searchedSchools.map(s => {
                    const assignment = schoolAssignments[s.id];
                    const isAssignedToOther = assignment && assignment.employeeId !== member.id;
                    const isSelected = selectedSchools.includes(s.id);

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (isAssignedToOther) return;
                          if (isSelected) {
                            setSelectedSchools(selectedSchools.filter(id => id !== s.id));
                          } else {
                            setSelectedSchools([...selectedSchools, s.id]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '10px',
                          border: isAssignedToOther
                            ? '1.5px dashed #fca5a5'
                            : isSelected
                            ? '2px solid #047857'
                            : '1px solid #e2e8f0',
                          backgroundColor: isAssignedToOther
                            ? '#fef2f2'
                            : isSelected
                            ? '#f0fdf4'
                            : '#ffffff',
                          cursor: isAssignedToOther ? 'not-allowed' : 'pointer',
                          opacity: isAssignedToOther ? 0.75 : 1,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAssignedToOther}
                            onChange={() => {}}
                            style={{ width: '16px', height: '16px', cursor: isAssignedToOther ? 'not-allowed' : 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: isAssignedToOther ? '#991b1b' : isSelected ? '#047857' : '#0F2B47', fontSize: '0.88rem' }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                              📍 {s.mandalName} {s.villageName ? `• ${s.villageName}` : ''} {s.strength ? `• Strength: ${s.strength}` : ''}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isAssignedToOther ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', backgroundColor: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Lock size={12} /> {assignment.employeeName}
                            </span>
                          ) : isSelected ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', backgroundColor: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                              ✓ Assigned
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.2rem 0.45rem', borderRadius: '12px' }}>
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Save Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        boxShadow: '0 -4px 15px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: '0.9rem', color: '#475569' }}>
          Editing Staff: <strong>{member.name}</strong> ({member.employeeId}) &bull;{' '}
          {isFieldStaff && (
            <span><strong>{selectedSchools.length} Schools</strong> assigned</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href="/college/team"
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.5rem',
              backgroundColor: '#047857',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 10px rgba(4, 120, 87, 0.25)',
            }}
          >
            <Save size={18} /> {saving ? 'Saving Changes...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
