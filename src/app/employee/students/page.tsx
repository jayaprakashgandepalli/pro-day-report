'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Edit, Trash2, Search, FileText, PlusCircle } from 'lucide-react';

type Student = {
  id: string;
  studentName: string;
  gender: string | null;
  fatherName: string | null;
  phone: string;
  whatsapp: string | null;
  group: string;
  schoolName: string | null;
  schoolArea: string | null;
  occupation: string | null;
  address: string | null;
  district: string | null;
  mandal: string | null;
  village: string | null;
  remarks: string | null;
  doorstepCompleted: boolean;
  studyInterestedAt: string | null;
  educationStage: string | null;
  ableToBearFee: string | null;
  nextFollowUpType: string | null;
  nextFollowUpDate: string | null;
};

export default function AllStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState<string | null>(null);

  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [visitRemarks, setVisitRemarks] = useState('');
  const [nextFollowUpType, setNextFollowUpType] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);

  // View Modal State
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [configMap, setConfigMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPreset(params.get('preset'));
    fetchStudents();
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        data.configs.forEach((c: any) => { map[c.id] = c.value; });
        setConfigMap(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resolveName = (val: string | null | undefined) => {
    if (!val) return null;
    return configMap[val] || val;
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    // In a real app, you'd call a DELETE API endpoint here.
    // For now, we'll just remove from state to simulate.
    // const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    setStudents(students.filter(s => s.id !== id));
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search);
    
    if (preset === 'prime') {
      const interest = resolveName(s.studyInterestedAt)?.toLowerCase() || '';
      const fee = resolveName(s.ableToBearFee)?.toLowerCase() || '';
      const g = resolveName(s.group)?.toUpperCase() || '';
      
      const isVizag = interest.includes('vizag') || interest.includes('visakhapatnam');
      const isBearable = fee.includes('yes') || fee.includes('bearable');
      const isTargetGroup = g.includes('MPC') || g.includes('BIPC');
      
      return matchesSearch && isVizag && isBearable && isTargetGroup;
    }
    
    return matchesSearch;
  });

  const handleAddVisit = async () => {
    if (!visitRemarks) return alert("Remarks are required");
    setSavingVisit(true);
    try {
      const res = await fetch(`/api/students/${selectedStudentId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          remarks: visitRemarks, 
          nextFollowUpType: nextFollowUpType || null,
          nextFollowUpDate: (nextFollowUpType === 'Date' && nextFollowUpDate) ? nextFollowUpDate : null 
        })
      });
      if (res.ok) {
        alert("Visit added!");
        setVisitModalOpen(false);
        setVisitRemarks('');
        setNextFollowUpType('');
        setNextFollowUpDate('');
        fetchStudents(); // refresh the list
      } else {
        alert("Failed to add visit");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingVisit(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" className="btn-icon">
            <ArrowLeft />
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>
            {preset === 'prime' ? '🔥 Hot Prospects' : 'All Students'}
          </h1>
        </div>
        <Link href="/reports/generate" className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <FileText size={16} /> PDF
        </Link>
      </header>
      
      {preset === 'prime' && (
        <div style={{ background: '#fffbeb', color: '#d97706', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #fde68a' }}>
          Showing students interested in Vizag, can bear fee, and studying MPC/BIPC.
        </div>
      )}

      <div className="form-group" style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search name or phone..." 
          style={{ paddingLeft: '2.5rem' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>Total: {filteredStudents.length}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No students found. <br/><br/>
          <Link href="/employee/add" className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>Add Student</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredStudents.map((s, index) => (
            <div key={s.id} className="card" style={{ marginBottom: 0, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div 
                  style={{ cursor: 'pointer', flex: 1 }} 
                  onClick={() => setViewStudent(s)}
                >
                  <div className="student-title" style={{ color: 'var(--primary-color)' }}>
                    {index + 1}. {s.studentName}
                  </div>
                  <div className="student-subtitle">
                    {s.fatherName ? `Father: ${s.fatherName}` : 'No Father Name'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <span className="badge badge-neutral">{resolveName(s.group)}</span>
                    {s.schoolName && <span className="badge badge-neutral" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>{resolveName(s.schoolName)}</span>}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-action-icon add-visit" onClick={() => { setSelectedStudentId(s.id); setVisitModalOpen(true); }} title="Add Visit">
                    <PlusCircle size={18} />
                  </button>
                  <Link href={`/students/edit/${s.id}`} className="btn-action-icon edit" title="Edit">
                    <Edit size={18} />
                  </Link>
                  <button className="btn-action-icon delete" onClick={() => handleDelete(s.id)} title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="card-actions">
                <a href={`tel:${s.phone}`} className="btn-call">
                  <Phone size={18} /> Call
                </a>
                {s.whatsapp && (
                  <a href={`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {visitModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 0 }}>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>Add Visit</h2>
            <div className="form-group">
              <label className="form-label">Remarks *</label>
              <textarea className="form-control" rows={3} value={visitRemarks} onChange={e => setVisitRemarks(e.target.value)} placeholder="What was discussed?"></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Next Follow-up Action</label>
              <select className="form-control" value={nextFollowUpType} onChange={e => { setNextFollowUpType(e.target.value); setNextFollowUpDate(''); }}>
                <option value="">Select option</option>
                <option value="After Exams">After Exams</option>
                <option value="After Results">After Results</option>
                <option value="Date">Specific Date</option>
              </select>
            </div>
            {nextFollowUpType === 'Date' && (
              <div className="form-group">
                <label className="form-label">Select Date</label>
                <input type="date" className="form-control" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setVisitModalOpen(false)} disabled={savingVisit}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddVisit} disabled={savingVisit}>{savingVisit ? 'Saving...' : 'Save Visit'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {viewStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-color)' }}>Student Details</h2>
              <button className="btn-icon" onClick={() => setViewStudent(null)} style={{ background: '#f1f5f9', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong style={{ color: '#475569' }}>Name:</strong> <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{viewStudent.studentName}</span> {viewStudent.gender ? `(${viewStudent.gender})` : ''}</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}><strong style={{ color: '#475569' }}>Phone:</strong> {viewStudent.phone}</div>
                <div style={{ flex: 1 }}><strong style={{ color: '#475569' }}>WhatsApp:</strong> {viewStudent.whatsapp || 'N/A'}</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}><strong style={{ color: '#475569' }}>Father:</strong> {viewStudent.fatherName || 'N/A'}</div>
                <div style={{ flex: 1 }}><strong style={{ color: '#475569' }}>Occupation:</strong> {viewStudent.occupation || 'N/A'}</div>
              </div>
              
              <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }}></div>
              
              <div><strong style={{ color: '#475569' }}>Group:</strong> <span className="badge badge-neutral">{resolveName(viewStudent.group)}</span></div>
              <div><strong style={{ color: '#475569' }}>School:</strong> {resolveName(viewStudent.schoolName) || 'N/A'} {viewStudent.schoolArea ? `(${resolveName(viewStudent.schoolArea)})` : ''}</div>
              
              <div><strong style={{ color: '#475569' }}>Location:</strong> {[resolveName(viewStudent.village), resolveName(viewStudent.mandal), resolveName(viewStudent.district)].filter(Boolean).join(', ') || 'N/A'}</div>
              {viewStudent.address && (
                <div><strong style={{ color: '#475569' }}>Landmark:</strong> {viewStudent.address}</div>
              )}
              
              <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }}></div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}><strong style={{ color: '#475569' }}>Doorstep Completed:</strong> {viewStudent.doorstepCompleted ? '✅ Yes' : '❌ No'}</div>
                <div style={{ flex: 1 }}><strong style={{ color: '#475569' }}>Fee capacity:</strong> {viewStudent.ableToBearFee || 'N/A'}</div>
              </div>
              
              {(viewStudent.nextFollowUpType || viewStudent.nextFollowUpDate || viewStudent.remarks) && (
                <>
                  <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }}></div>
                  <div><strong style={{ color: '#475569' }}>Follow-up:</strong> {viewStudent.nextFollowUpType === 'Date' ? new Date(viewStudent.nextFollowUpDate!).toLocaleDateString('en-GB') : (viewStudent.nextFollowUpType || 'None')}</div>
                  {viewStudent.remarks && <div><strong style={{ color: '#475569' }}>Remarks:</strong> {viewStudent.remarks}</div>}
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setViewStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
