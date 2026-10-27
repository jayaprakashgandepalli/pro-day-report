'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, UserCheck, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [group, setGroup] = useState('');
  const [interest, setInterest] = useState('');
  const [fee, setFee] = useState('');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [admissionStatus, setAdmissionStatus] = useState<'' | 'admitted'>('');
  
  const [employees, setEmployees] = useState<any[]>([]);

  // Reassignment state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [singleStudentToReassign, setSingleStudentToReassign] = useState<any | null>(null);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchConfigs();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setEmployees(data.users.filter((u: any) => u.role === 'EMPLOYEE' || u.role === 'TEAM_LEADER'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSingleReassign = (student: any) => {
    setSingleStudentToReassign(student);
    setTargetEmployeeId('');
    setReassignModalOpen(true);
  };

  const handleOpenBulkReassign = () => {
    setSingleStudentToReassign(null);
    setTargetEmployeeId('');
    setReassignModalOpen(true);
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length && students.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const handleConfirmReassign = async () => {
    if (!targetEmployeeId) {
      alert('Please select a staff member to assign.');
      return;
    }

    const idsToReassign = singleStudentToReassign 
      ? [singleStudentToReassign.id] 
      : selectedStudentIds;

    if (idsToReassign.length === 0) {
      alert('No students selected.');
      return;
    }

    setIsReassigning(true);
    try {
      const res = await fetch('/api/admin/students/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: idsToReassign,
          newEmployeeId: targetEmployeeId
        })
      });

      const data = await res.json();
      if (res.ok) {
        const assignedEmp = employees.find(e => e.employeeId === targetEmployeeId);
        setStudents(prev => prev.map(s => {
          if (idsToReassign.includes(s.id)) {
            return {
              ...s,
              employeeId: targetEmployeeId,
              employee: assignedEmp ? { employeeId: assignedEmp.employeeId, name: assignedEmp.name } : s.employee
            };
          }
          return s;
        }));

        setFeedbackMessage({
          type: 'success',
          text: data.message || `Successfully reassigned ${idsToReassign.length} student(s)!`
        });
        setTimeout(() => setFeedbackMessage(null), 5000);

        setReassignModalOpen(false);
        setSingleStudentToReassign(null);
        setSelectedStudentIds([]);
      } else {
        alert(data.error || 'Failed to reassign student(s)');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during reassignment.');
    } finally {
      setIsReassigning(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [debouncedSearch, employeeId, group, interest, fee, district, mandal, village, page, admissionStatus]);

  const fetchConfigs = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.configs) setConfigs(data.configs);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (employeeId) params.append('employeeId', employeeId);
      if (group) params.append('group', group);
      if (interest) params.append('interest', interest);
      if (fee) params.append('fee', fee);
      
      const activeLocation = village || mandal || district;
      if (activeLocation) params.append('location', activeLocation);
      if (admissionStatus) params.append('admissionStatus', admissionStatus);

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRemark = async (id: string, remarks: string) => {
    try {
      await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(students.filter(s => s.id !== id));
        setTotal(total - 1);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete student');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const getConfigName = (id: string | null) => {
    if (!id) return '-';
    const conf = configs.find(c => c.id === id || c.value === id);
    return conf ? conf.value : id;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Students Database</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setAdmissionStatus(''); setPage(1); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', backgroundColor: admissionStatus !== 'admitted' ? '#0F2B47' : '#e2e8f0', color: admissionStatus !== 'admitted' ? '#ffffff' : '#475569', transition: 'all 0.2s' }}
          >
            All Students
          </button>
          <button
            onClick={() => { setAdmissionStatus('admitted'); setPage(1); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', backgroundColor: admissionStatus === 'admitted' ? '#16a34a' : '#e2e8f0', color: admissionStatus === 'admitted' ? '#ffffff' : '#475569', transition: 'all 0.2s' }}
          >
            ✓ Admitted
          </button>
          <span style={{ backgroundColor: admissionStatus === 'admitted' ? '#dcfce7' : '#e0f2fe', color: admissionStatus === 'admitted' ? '#166534' : '#0369a1', padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 600 }}>
            {admissionStatus === 'admitted' ? `Admitted: ${total}` : `Total: ${total}`}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0 0.5rem', background: '#fff' }}>
            <Search size={20} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', padding: '0.75rem', width: '100%' }}
            />
          </div>

          <select className="form-control" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setPage(1); }}>
            <option value="">All Employees</option>
            {employees.map(emp => <option key={emp.employeeId} value={emp.employeeId}>{emp.name}</option>)}
          </select>

          <select className="form-control" value={group} onChange={(e) => { setGroup(e.target.value); setPage(1); }}>
            <option value="">All Groups</option>
            {configs.filter(c => c.type === 'GROUP').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
          </select>

          <select className="form-control" value={interest} onChange={(e) => { setInterest(e.target.value); setPage(1); }}>
            <option value="">All Interests</option>
            {configs.filter(c => c.type === 'STUDY_INTEREST').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
          </select>

          <select className="form-control" value={fee} onChange={(e) => { setFee(e.target.value); setPage(1); }}>
            <option value="">All Fee Bearings</option>
            {configs.filter(c => c.type === 'FEE_BEARABLE').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
          </select>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <select className="form-control" value={district} onChange={(e) => { setDistrict(e.target.value); setMandal(''); setVillage(''); setPage(1); }}>
              <option value="">All Districts</option>
              {configs.filter(c => c.type === 'DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
            
            {district && (
              <select className="form-control" value={mandal} onChange={(e) => { setMandal(e.target.value); setVillage(''); setPage(1); }}>
                <option value="">All Mandals</option>
                {configs.filter(c => c.type === 'MANDAL' && c.parentId === district).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            )}

            {mandal && (
              <select className="form-control" value={village} onChange={(e) => { setVillage(e.target.value); setPage(1); }}>
                <option value="">All Villages</option>
                {configs.filter(c => c.type === 'VILLAGE' && c.parentId === mandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div style={{
          backgroundColor: feedbackMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: feedbackMessage.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${feedbackMessage.type === 'success' ? '#86efac' : '#fca5a5'}`,
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <span>{feedbackMessage.text}</span>
          <button 
            onClick={() => setFeedbackMessage(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {selectedStudentIds.length > 0 && (
        <div style={{
          backgroundColor: '#0F2B47',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(15, 43, 71, 0.2)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
            <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
              {selectedStudentIds.length}
            </span>
            <span>student(s) selected</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleOpenBulkReassign}
              style={{
                backgroundColor: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <UserCheck size={16} /> Reassign Selected to Staff
            </button>
            <button
              onClick={() => setSelectedStudentIds([])}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading students...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ width: '40px', padding: '1rem', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={students.length > 0 && selectedStudentIds.length === students.length} 
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    title="Select All Students on this page"
                  />
                </th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Name / Phone</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Location</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Added By</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Interest / Fee</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Admission</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', width: '250px' }}>Remarks</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: selectedStudentIds.includes(student.id) ? '#f0f9ff' : 'transparent' }}>
                  <td style={{ width: '40px', padding: '1rem', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedStudentIds.includes(student.id)} 
                      onChange={() => toggleSelectStudent(student.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{student.studentName}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{student.phone}</div>
                    <span className="badge badge-primary" style={{ marginTop: '0.25rem', display: 'inline-block' }}>{student.group}</span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div>{getConfigName(student.village)}</div>
                    <div style={{ color: '#64748b' }}>{getConfigName(student.mandal)}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: 600, color: '#0F2B47' }}>{student.employee?.name || student.employeeId}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(student.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div><strong>Int:</strong> {getConfigName(student.studyInterestedAt)}</div>
                    <div><strong>Fee:</strong> {getConfigName(student.ableToBearFee)}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {student.leadStatus === 'Admitted' ? (
                      <div>
                        <span style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#166534', padding: '0.125rem 0.5rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>✓ Admitted</span>
                        <div style={{ color: '#166534', fontSize: '0.75rem' }}><strong>College:</strong> {student.joinedCollege?.name || 'N/A'}</div>
                        <div style={{ color: '#166634', fontSize: '0.75rem' }}><strong>App No:</strong> {student.applicationNumber || 'N/A'}</div>
                        <div style={{ color: '#166534', fontSize: '0.75rem' }}><strong>Date:</strong> {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : 'N/A'}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <textarea 
                      className="form-control"
                      rows={2}
                      defaultValue={student.remarks || ''}
                      onBlur={(e) => handleUpdateRemark(student.id, e.target.value)}
                      placeholder="Add remarks..."
                      style={{ fontSize: '0.875rem', padding: '0.5rem', width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleOpenSingleReassign(student)}
                        className="btn btn-outline"
                        title="Reassign to another staff member"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.65rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          borderColor: '#38bdf8',
                          color: '#0284c7',
                          backgroundColor: '#f0f9ff'
                        }}
                      >
                        <UserCheck size={15} /> Reassign
                      </button>
                      <Link href={`/students/edit/${student.id}`} className="btn btn-outline" style={{ display: 'inline-flex', padding: '0.5rem', fontSize: '0.875rem' }}>
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(student.id)} 
                        className="btn btn-outline" 
                        style={{ display: 'inline-flex', padding: '0.5rem', fontSize: '0.875rem', borderColor: '#ef4444', color: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No students match the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => { setPage(p => Math.max(1, p - 1)); setSelectedStudentIds([]); }}
            disabled={page === 1}
          >
            <ChevronLeft size={20} /> Prev
          </button>
          <span style={{ fontWeight: 500 }}>Page {page} of {totalPages}</span>
          <button 
            className="btn btn-outline" 
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setSelectedStudentIds([]); }}
            disabled={page === totalPages}
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={22} color="#0284c7" /> Reassign to Staff Member
              </h3>
              <button
                onClick={() => { setReassignModalOpen(false); setSingleStudentToReassign(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {singleStudentToReassign ? (
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#0f172a' }}>{singleStudentToReassign.studentName}</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.2rem' }}>📞 {singleStudentToReassign.phone}</div>
                <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1' }}>
                  Currently Assigned To: <strong style={{ color: '#0F2B47' }}>{singleStudentToReassign.employee?.name || singleStudentToReassign.employeeId}</strong>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #bae6fd' }}>
                <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '1rem' }}>
                  Bulk Reassign: {selectedStudentIds.length} students selected
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0284c7', marginTop: '0.25rem' }}>
                  All selected students will be safely transferred to the staff member you choose below.
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                Select Target Staff (New Employee) *
              </label>
              <select
                className="form-control"
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              >
                <option value="">-- Choose Staff Member --</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                ℹ️ The student will immediately show up in the new staff member's mobile app and login. All visit history, photos, and remarks are preserved.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setReassignModalOpen(false); setSingleStudentToReassign(null); }}
                className="btn btn-outline"
                disabled={isReassigning}
                style={{ padding: '0.65rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                className="btn btn-primary"
                disabled={isReassigning || !targetEmployeeId}
                style={{
                  padding: '0.65rem 1.5rem',
                  backgroundColor: !targetEmployeeId ? '#94a3b8' : '#0284c7',
                  borderColor: !targetEmployeeId ? '#94a3b8' : '#0284c7',
                  fontWeight: 600
                }}
              >
                {isReassigning ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
