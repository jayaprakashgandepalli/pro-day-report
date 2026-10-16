'use client';

import { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Building,
  User,
  Phone,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';

export default function CollegeSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [unassignedCount, setUnassignedCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ASSIGNED, UNASSIGNED

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formMandalId, setFormMandalId] = useState('');
  const [formVillageId, setFormVillageId] = useState('');
  const [formStrength, setFormStrength] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formHmName, setFormHmName] = useState('');
  const [formHmPhone, setFormHmPhone] = useState('');
  const [formKpName, setFormKpName] = useState('');
  const [formKpPhone, setFormKpPhone] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/college/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools || []);
        setMandals(data.mandals || []);
        setVillages(data.villages || []);
        setTotalCount(data.totalCount || 0);
        setAssignedCount(data.assignedCount || 0);
        setUnassignedCount(data.unassignedCount || 0);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormName('');
    setFormMandalId(mandals[0]?.id || '');
    setFormVillageId('');
    setFormStrength('');
    setFormGrade('');
    setFormHmName('');
    setFormHmPhone('');
    setFormKpName('');
    setFormKpPhone('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (sch: any) => {
    setEditId(sch.id);
    setFormName(sch.name || '');
    setFormMandalId(sch.mandalId || '');
    setFormVillageId(sch.parentId && sch.parentId !== sch.mandalId ? sch.parentId : '');
    setFormStrength(sch.strength ? String(sch.strength) : '');
    setFormGrade(sch.grade || '');
    setFormHmName(sch.headmasterName || '');
    setFormHmPhone(sch.headmasterPhone || '');
    setFormKpName(sch.keyPersonName || '');
    setFormKpPhone(sch.keyPersonPhone || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter school name');
      return;
    }
    if (!formMandalId) {
      setFormError('Please select a mandal');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const url = '/api/college/schools';
      const method = editId ? 'PUT' : 'POST';
      const payload: any = {
        name: formName.trim(),
        mandalId: formMandalId,
        villageId: formVillageId || null,
        strength: formStrength,
        grade: formGrade.trim() || null,
        headmasterName: formHmName.trim() || null,
        headmasterPhone: formHmPhone.trim() || null,
        keyPersonName: formKpName.trim() || null,
        keyPersonPhone: formKpPhone.trim() || null,
      };

      if (editId) {
        payload.id = editId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        setFormError(resData.error || 'Failed to save school');
      } else {
        setSuccess(editId ? 'School updated successfully!' : 'New school added successfully!');
        setShowModal(false);
        fetchSchools();
      }
    } catch (e: any) {
      setFormError('An unexpected error occurred');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSchool = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? If assigned to any field staff, it will also be unassigned.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/college/schools?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete school');
      } else {
        setSuccess(`School "${name}" deleted successfully`);
        fetchSchools();
      }
    } catch (e) {
      setError('Failed to delete school');
    }
  };

  // Filter villages by the selected mandal in the modal
  const modalVillages = villages.filter(v => v.mandalId === formMandalId);

  // Filter schools list for the table
  const filteredSchools = schools.filter(s => {
    // Mandal filter
    if (selectedMandal !== 'ALL' && s.mandalId !== selectedMandal) {
      return false;
    }

    // Status filter
    if (statusFilter === 'ASSIGNED' && !s.assignedStaff) return false;
    if (statusFilter === 'UNASSIGNED' && s.assignedStaff) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchVillage = s.villageName?.toLowerCase().includes(q);
      const matchMandal = s.mandalName?.toLowerCase().includes(q);
      const matchHm = s.headmasterName?.toLowerCase().includes(q);
      const matchKp = s.keyPersonName?.toLowerCase().includes(q);
      const matchStaff = s.assignedStaff?.employeeName?.toLowerCase().includes(q);
      return matchName || matchVillage || matchMandal || matchHm || matchKp || matchStaff;
    }

    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <School size={28} color="#047857" /> Catchment Schools Management
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Add your college's target high schools with HM and contact details. These schools will be available to assign to your Field Staff in the Team page.
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
          <Plus size={18} /> Add New School
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #047857' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>🏫 Total Schools Added</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.25rem' }}>{totalCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Target catchment schools for your college</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>🏃 Assigned to Field Staff</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.25rem' }}>{assignedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.25rem' }}>Covered by your field employees</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>⚪ Unassigned Schools</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.25rem' }}>{unassignedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem' }}>Ready to be assigned to staff</div>
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

      {/* Schools Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Search & Filter Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search school name, HM, or village..."
              className="form-control"
              style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={selectedMandal}
              onChange={e => setSelectedMandal(e.target.value)}
              style={{ width: 'auto', fontSize: '0.88rem' }}
            >
              <option value="ALL">All Mandals ({mandals.length})</option>
              {mandals.map(m => (
                <option key={m.id} value={m.id}>📍 {m.name}</option>
              ))}
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.88rem' }}
            >
              <option value="ALL">All Status</option>
              <option value="ASSIGNED">🏃 Assigned to Staff</option>
              <option value="UNASSIGNED">⚪ Unassigned</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading your catchment schools...</div>
        ) : filteredSchools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
            <School size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem', color: '#0F2B47' }}>
              {schools.length === 0 ? 'No Schools Added Yet for Your College' : 'No Schools Matching Your Filter'}
            </p>
            <p style={{ margin: '0.5rem auto 1.25rem auto', fontSize: '0.9rem', maxWidth: '480px' }}>
              {schools.length === 0
                ? 'Click "Add New School" above to enter your catchment schools with HM and contact details.'
                : 'Try clearing your search or mandal filters to view all schools.'}
            </p>
            {schools.length === 0 && (
              <button
                onClick={openAddModal}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: '#047857',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Add Your First School
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>SCHOOL NAME</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MANDAL & VILLAGE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>10TH STRENGTH / GRADE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>HEADMASTER (HM)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>KEY PERSON</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ASSIGNED FIELD STAFF</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((s: any) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F2B47' }}>
                      {s.name}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>📍 {s.mandalName}</span>
                        {s.villageName && (
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>• {s.villageName}</span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {s.strength ? (
                          <span style={{ fontWeight: 700, color: '#0F2B47' }}>{s.strength} students</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                        {s.grade && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8' }}>
                            {s.grade}
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      {s.headmasterName || s.headmasterPhone ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#0F2B47' }}>{s.headmasterName || 'Headmaster'}</span>
                          {s.headmasterPhone && (
                            <span style={{ fontSize: '0.78rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Phone size={11} /> {s.headmasterPhone}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      {s.keyPersonName || s.keyPersonPhone ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#0F2B47' }}>{s.keyPersonName || 'Key Person'}</span>
                          {s.keyPersonPhone && (
                            <span style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Phone size={11} /> {s.keyPersonPhone}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>

                    {/* Assigned Field Staff */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {s.assignedStaff ? (
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '16px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}>
                          <UserCheck size={13} /> {s.assignedStaff.employeeName}
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '16px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                        }}>
                          ⚪ Unassigned
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit School Details"
                          style={{
                            padding: '0.45rem 0.65rem',
                            backgroundColor: '#f1f5f9',
                            color: '#0F2B47',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteSchool(s.id, s.name)}
                          title="Delete School"
                          style={{
                            padding: '0.45rem 0.65rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit School Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '580px', padding: '1.75rem', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <School size={22} color="#047857" /> {editId ? 'Edit Catchment School' : 'Add New Catchment School'}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  This school will belong exclusively to your college portal.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleSaveSchool} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>School Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. ZPHS High School Chodavaram"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Mandal *</label>
                  <select
                    className="form-control"
                    required
                    value={formMandalId}
                    onChange={e => {
                      setFormMandalId(e.target.value);
                      setFormVillageId('');
                    }}
                  >
                    <option value="">-- Select Mandal --</option>
                    {mandals.map(m => (
                      <option key={m.id} value={m.id}>📍 {m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Village (Optional)</label>
                  <select
                    className="form-control"
                    value={formVillageId}
                    onChange={e => setFormVillageId(e.target.value)}
                    disabled={!formMandalId}
                  >
                    <option value="">-- Select Village (Optional) --</option>
                    {modalVillages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>10th Class Student Strength</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="e.g. 85"
                    value={formStrength}
                    onChange={e => setFormStrength(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>School Grade</label>
                  <select
                    className="form-control"
                    value={formGrade}
                    onChange={e => setFormGrade(e.target.value)}
                  >
                    <option value="">-- Select Grade --</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              {/* Headmaster Details */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={16} color="#047857" /> Headmaster (HM) Contact
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>HM Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="HM Full Name"
                      value={formHmName}
                      onChange={e => setFormHmName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>HM Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={formHmPhone}
                      onChange={e => setFormHmPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Key Person Details */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <UserCheck size={16} color="#2563eb" /> Key Contact Person (Teacher / Staff)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Key Person Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Key Person Name"
                      value={formKpName}
                      onChange={e => setFormKpName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Key Person Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={formKpPhone}
                      onChange={e => setFormKpPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#047857',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: formSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {formSubmitting ? 'Saving School...' : editId ? 'Save Changes' : 'Create School'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.75rem 1.25rem',
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
