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
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedStudentId(prev => (prev === id ? null : id));
  };

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
    <div className="container" style={{ padding: 0, paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh', maxWidth: '600px', margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
      <header className="app-header-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/" className="btn-icon" style={{ color: '#cbd5e1', padding: '0.25rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
              {preset === 'prime' ? 'Hot Prospects' : 'All Students'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', color: '#bfdbfe', fontWeight: 500, letterSpacing: '0.05em' }}>Student Database</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href="/reports/generate" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', gap: '0.25rem' }}>
            <FileText size={14} /> PDF
          </Link>
        </div>
      </header>
      
      <div style={{ padding: '1rem' }}>
        {preset === 'prime' && (
          <div style={{ background: '#fffbeb', color: '#d97706', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, border: '1px solid #fde68a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            Showing students interested in Vizag, can bear fee, and studying MPC/BIPC.
          </div>
        )}

        {/* Search Bar */}
        <section style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '0.75rem', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#94a3b8' }}>
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.9)', borderRadius: '12px', padding: '0.625rem 2.5rem 0.625rem 2.25rem', fontSize: '0.75rem', color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            />
            <div style={{ position: 'absolute', right: '0.5rem', top: '0', bottom: '0', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '0.625rem', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 500, padding: '0.125rem 0.375rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Ctrl+K</span>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.125rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', margin: 0 }}>Students Enrolled</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#E1EBF5', color: '#0F2B47' }}>{filteredStudents.length}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
            No students found. <br/><br/>
            <Link href="/employee/add" className="ios-btn-primary" style={{ display: 'inline-flex', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem' }}>Add Student</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredStudents.map((s, index) => {
              const isExpanded = expandedStudentId === s.id;
              
              return (
                <article key={s.id} className="student-card-ios" onClick={(e) => toggleExpand(s.id, e)}>
                  
                  <div className="student-card-ios-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {index + 1}. {s.studentName}
                      </h3>
                      <span className="ios-badge ios-badge-neutral" style={{ flexShrink: 0 }}>
                        {resolveName(s.group)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                      <a href={`tel:${s.phone}`} className="ios-btn-icon ios-btn-call" onClick={(e) => e.stopPropagation()} title="Call">
                        <Phone size={14} />
                      </a>
                      <div className={`chevron-icon ${isExpanded ? 'rotate' : ''}`} style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`accordion-body ${isExpanded ? 'expanded' : ''}`}>
                    <div className="accordion-content">
                      <div style={{ padding: '0 0.875rem 0.875rem 0.875rem' }}>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                          Father: <span style={{ color: '#334155', fontWeight: 600 }}>{s.fatherName || 'No Father Name'}</span>
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem' }}>
                          {s.schoolName && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 500, backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #e0e7ff' }}>
                              {resolveName(s.schoolName)}
                            </span>
                          )}
                        </div>
                        
                        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0.625rem 0' }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {s.whatsapp && (
                              <a href={`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="ios-btn-icon ios-btn-whatsapp" onClick={(e) => e.stopPropagation()} title="WhatsApp">
                                <MessageCircle size={14} />
                              </a>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setViewStudent(s); }} style={{ background: 'transparent', border: 'none', fontSize: '0.6875rem', fontWeight: 600, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                              Full Details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Link href={`/students/edit/${s.id}`} className="ios-btn-icon ios-btn-action" onClick={(e) => e.stopPropagation()} title="Edit">
                              <Edit size={14} />
                            </Link>
                            <button 
                              className="ios-btn-icon ios-btn-primary"
                              onClick={(e) => { e.stopPropagation(); setSelectedStudentId(s.id); setVisitModalOpen(true); }}
                              title="Add Visit"
                            >
                              <PlusCircle size={16} />
                            </button>
                            <button 
                              className="ios-btn-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                              onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #f1f5f9', maxHeight: '90vh' }}>
            <header style={{ paddingTop: '1.25rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#116d66', margin: 0 }}>Student Details</h1>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.025em' }}>స్టూడెంట్ వివరాలు • Field Survey</span>
              </div>
              <button 
                onClick={() => setViewStudent(null)} 
                style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px', border: '1px solid #cbd5e1', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', cursor: 'pointer' }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
              </button>
            </header>
            
            <div style={{ padding: '1.5rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9375rem', overflowY: 'auto' }}>
              
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>Name:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', letterSpacing: '0.025em', textTransform: 'uppercase' }}>{viewStudent.studentName}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>Verified</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>Phone:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{viewStudent.phone}</span>
                    <a href={`tel:${viewStudent.phone}`} style={{ color: '#116d66', padding: '0.25rem' }}>
                      <Phone size={14} />
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>WhatsApp:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{viewStudent.whatsapp || 'N/A'}</span>
                    {viewStudent.whatsapp && (
                      <a href={`https://wa.me/${viewStudent.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', padding: '0.25rem' }}>
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>Father:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500, textTransform: 'capitalize' }}>{viewStudent.fatherName || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>Occupation:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{viewStudent.occupation || 'N/A'}</span>
                  </div>
                </div>
              </section>
              
              <hr style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', margin: '0.25rem 0' }} />
              
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>Group:</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                    {resolveName(viewStudent.group)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#334155', flexShrink: 0 }}>School:</span>
                  <span style={{ color: '#1e293b', fontWeight: 500, marginLeft: '0.25rem' }}>{resolveName(viewStudent.schoolName) || 'N/A'} {viewStudent.schoolArea ? `(${resolveName(viewStudent.schoolArea)})` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#334155', flexShrink: 0 }}>Location:</span>
                  <span style={{ color: '#1e293b', fontWeight: 500, marginLeft: '0.25rem' }}>{[resolveName(viewStudent.village), resolveName(viewStudent.mandal), resolveName(viewStudent.district)].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
                {viewStudent.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155', flexShrink: 0 }}>Landmark:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500, marginLeft: '0.25rem' }}>{viewStudent.address}</span>
                  </div>
                )}
              </section>
              
              <hr style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', margin: '0.25rem 0' }} />
              
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Doorstep Completed:</span>
                      {viewStudent.doorstepCompleted ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.25rem', height: '1.25rem', backgroundColor: '#059669', color: '#ffffff', borderRadius: '0.25rem' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.25rem', height: '1.25rem', backgroundColor: '#e2e8f0', color: '#64748b', borderRadius: '0.25rem' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </span>
                      )}
                    </div>
                    <span style={{ color: '#334155', fontWeight: 500, fontSize: '0.875rem' }}>{viewStudent.doorstepCompleted ? 'Yes' : 'No'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>Fee capacity:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{resolveName(viewStudent.ableToBearFee) || 'N/A'}</span>
                  </div>
                </div>
                
                {(viewStudent.nextFollowUpType || viewStudent.nextFollowUpDate || viewStudent.remarks) && (
                  <>
                    <hr style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', margin: '0.25rem 0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>Follow-up:</span>
                        <span style={{ color: '#475569', fontWeight: 500 }}>{viewStudent.nextFollowUpType === 'Date' ? new Date(viewStudent.nextFollowUpDate!).toLocaleDateString('en-GB') : (viewStudent.nextFollowUpType || 'None')}</span>
                      </div>
                      {viewStudent.remarks && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#334155' }}>Remarks:</span>
                          <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: '#f8fafc', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>{viewStudent.remarks}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
              
              <footer style={{ paddingTop: '0.75rem' }}>
                <button 
                  onClick={() => setViewStudent(null)}
                  style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#116d66', color: '#ffffff', fontWeight: 600, borderRadius: '0.75rem', fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                >
                  Close
                </button>
              </footer>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
