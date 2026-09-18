'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Edit, CalendarClock, PlusCircle } from 'lucide-react';

type Student = {
  id: string;
  studentName: string;
  gender: string | null;
  fatherName: string | null;
  phone: string;
  whatsapp: string | null;
  group: string;
  schoolName: string | null;
  nextFollowUpType: string | null;
  nextFollowUpDate: string | null;
  remarks: string | null;
  schoolArea: string | null;
  occupation: string | null;
  address: string | null;
  district: string | null;
  mandal: string | null;
  village: string | null;
  doorstepCompleted: boolean;
  studyInterestedAt: string | null;
  educationStage: string | null;
  ableToBearFee: string | null;
};

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'action' | 'upcoming'>('today');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchStudents(activeTab);
    fetchConfigs();
  }, [activeTab]);

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

  const fetchStudents = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?followup=${tab}&limit=100`);
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
        fetchStudents(activeTab); // refresh the list
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
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" className="btn-icon">
          <ArrowLeft />
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarClock size={20} /> Follow-ups
        </h1>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-color)', padding: '0.25rem', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('today')}
          style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            background: activeTab === 'today' ? '#ef4444' : 'transparent',
            color: activeTab === 'today' ? '#fff' : 'var(--text-color)',
            transition: 'all 0.2s'
          }}
        >
          Today & Overdue
        </button>
        <button 
          onClick={() => setActiveTab('action')}
          style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            background: activeTab === 'action' ? '#3b82f6' : 'transparent',
            color: activeTab === 'action' ? '#fff' : 'var(--text-color)',
            transition: 'all 0.2s'
          }}
        >
          Exams/Results
        </button>
        <button 
          onClick={() => setActiveTab('upcoming')}
          style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            background: activeTab === 'upcoming' ? '#10b981' : 'transparent',
            color: activeTab === 'upcoming' ? '#fff' : 'var(--text-color)',
            transition: 'all 0.2s'
          }}
        >
          Upcoming
        </button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>Total: {students.length}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading students...</div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CalendarClock size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.2 }} />
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>No follow-ups found here.</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>You're all caught up!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {students.map((s, index) => (
            <div key={s.id} className="card" style={{ marginBottom: 0, padding: '1rem', borderLeft: '4px solid ' + (activeTab === 'today' ? '#ef4444' : activeTab === 'action' ? '#3b82f6' : '#10b981') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div 
                  style={{ cursor: 'pointer', flex: 1 }} 
                  onClick={() => setViewStudent(s)}
                >
                  <div className="student-title" style={{ color: 'var(--primary-color)' }}>
                    {index + 1}. {s.studentName}
                  </div>
                  <div className="student-subtitle">
                    {s.phone} • {resolveName(s.group)}
                  </div>
                  
                  {/* Status badge */}
                  <div style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.25rem 0.5rem', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                    {activeTab === 'action' && s.nextFollowUpType && s.nextFollowUpType !== 'Date' ? (
                      `Waiting for: ${s.nextFollowUpType}`
                    ) : s.nextFollowUpDate ? (
                      `Follow-up Date: ${new Date(s.nextFollowUpDate).toLocaleDateString('en-GB')}`
                    ) : (
                      'Needs Follow-up'
                    )}
                  </div>
                  
                  {s.remarks && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Last remark:</span> {s.remarks}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-action-icon add-visit" onClick={() => { setSelectedStudentId(s.id); setVisitModalOpen(true); }} title="Add Visit">
                    <PlusCircle size={18} />
                  </button>
                  <Link href={`/students/edit/${s.id}`} className="btn-action-icon edit" title="Edit">
                    <Edit size={18} />
                  </Link>
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

      {/* Add Visit Modal */}
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
