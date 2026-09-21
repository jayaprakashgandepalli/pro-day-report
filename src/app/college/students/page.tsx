'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageCircle, Search, PlusCircle, LogOut, GraduationCap, FileCheck } from 'lucide-react';

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
  visits?: any[];
  leadStatus?: string | null;
  joinedCollegeId?: string | null;
  applicationNumber?: string | null;
  admissionDate?: Date | string | null;
};

export default function CollegeStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [preset, setPreset] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [visitRemarks, setVisitRemarks] = useState('');
  const [nextFollowUpType, setNextFollowUpType] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);
  
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [savingAdmit, setSavingAdmit] = useState(false);

  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [collegeName, setCollegeName] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'admitted'>('pending');

  const [availableMandals, setAvailableMandals] = useState<string[]>([]);
  const [availableVillages, setAvailableVillages] = useState<string[]>([]);
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.name) {
          setCollegeName(data.user.name);
        }
      })
      .catch(console.error);
  }, []);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedStudentId(prev => (prev === id ? null : id));
  };

  // View Modal State
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [configMap, setConfigMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter) {
      setPreset(filter);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/students/locations');
      if (res.ok) {
        const data = await res.json();
        setAvailableMandals(data.mandals || []);
        setAvailableVillages(data.villages || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, [page, preset, debouncedSearch, tab, selectedMandal, selectedVillage]);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        data.configs.forEach((c: any) => {
          map[c.id] = c.value;
        });
        setConfigMap(map);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resolveName = (id: string | null) => {
    if (!id) return 'N/A';
    return configMap[id] || id;
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        admissionStatus: tab
      });
      if (preset) query.set('preset', preset);
      if (debouncedSearch) query.set('search', debouncedSearch);
      if (selectedMandal) query.set('mandal', selectedMandal);
      if (selectedVillage) query.set('village', selectedVillage);

      const res = await fetch(`/api/students?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotalStudents(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisit = async () => {
    if (!visitRemarks.trim()) return alert('Remarks are required');
    if (nextFollowUpType === 'Date' && !nextFollowUpDate) return alert('Next follow-up date is required');

    setSavingVisit(true);
    try {
      const payload = {
        remarks: visitRemarks,
        nextFollowUpType: nextFollowUpType || null,
        nextFollowUpDate: nextFollowUpType === 'Date' ? nextFollowUpDate : null
      };

      const res = await fetch(`/api/students/${selectedStudentId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setVisitModalOpen(false);
        setVisitRemarks('');
        setNextFollowUpType('');
        setNextFollowUpDate('');
        fetchStudents();
      } else {
        alert("Failed to add visit");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingVisit(false);
    }
  };

  const handleAdmitStudent = async () => {
    if (!applicationNumber.trim()) return alert('Application Number is required');
    setSavingAdmit(true);
    try {
      const res = await fetch(`/api/students/${selectedStudentId}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationNumber })
      });
      if (res.ok) {
        alert("Student admitted successfully!");
        setAdmitModalOpen(false);
        setApplicationNumber('');
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to admit student");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAdmit(false);
    }
  };

  return (
    <div className="container" style={{ padding: 0, paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh', margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
      <header className="app-header-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
              Allocated Student Leads
            </h1>
            <p style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', color: '#bfdbfe', fontWeight: 500, letterSpacing: '0.05em' }}>
              {collegeName || 'College Portal'}
            </p>
          </div>
        </div>
      </header>
      
      <div style={{ padding: '1rem' }}>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <button 
            className={`ios-btn ${tab === 'pending' ? 'ios-btn-primary' : ''}`} 
            style={{ borderRadius: '20px', padding: '0.375rem 1rem', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: tab !== 'pending' ? '#e2e8f0' : undefined, color: tab !== 'pending' ? '#475569' : undefined, border: 'none', transition: 'all 0.2s' }}
            onClick={() => { setTab('pending'); setPage(1); }}
          >
            Pending Leads
          </button>
          <button 
            className={`ios-btn ${tab === 'admitted' ? 'ios-btn-primary' : ''}`} 
            style={{ borderRadius: '20px', padding: '0.375rem 1rem', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: tab !== 'admitted' ? '#e2e8f0' : undefined, color: tab !== 'admitted' ? '#475569' : undefined, border: 'none', transition: 'all 0.2s' }}
            onClick={() => { setTab('admitted'); setPage(1); }}
          >
            Admitted Students
          </button>
        </div>

        {/* Search Bar */}
        <section style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search name or phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.9)', borderRadius: '12px', padding: '0.625rem 2.5rem 0.625rem 2.25rem', fontSize: '0.75rem', color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              />
            </div>
            
            <div style={{ flex: '1 1 150px' }}>
              <select 
                value={selectedMandal} 
                onChange={(e) => { setSelectedMandal(e.target.value); setPage(1); }}
                style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.9)', borderRadius: '12px', padding: '0.625rem 1rem', fontSize: '0.75rem', color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', appearance: 'none' }}
              >
                <option value="">All Mandals</option>
                {availableMandals.map(m => <option key={m} value={m}>{resolveName(m)}</option>)}
              </select>
            </div>
            
            <div style={{ flex: '1 1 150px' }}>
              <select 
                value={selectedVillage} 
                onChange={(e) => { setSelectedVillage(e.target.value); setPage(1); }}
                style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.9)', borderRadius: '12px', padding: '0.625rem 1rem', fontSize: '0.75rem', color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', appearance: 'none' }}
              >
                <option value="">All Villages</option>
                {availableVillages.map(v => <option key={v} value={v}>{resolveName(v)}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.125rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', margin: 0 }}>
              {tab === 'pending' ? 'STUDENTS ENROLLED' : 'ADMITTED STUDENTS'}
            </h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#E1EBF5', color: '#0F2B47' }}>{totalStudents}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
            No students allocated yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {students.map((s, index) => {
              const isExpanded = expandedStudentId === s.id;
              const displayIndex = (page - 1) * itemsPerPage + index + 1;
              
              return (
                <article key={s.id} className="student-card-ios" onClick={(e) => toggleExpand(s.id, e)}>
                  
                  <div className="student-card-ios-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayIndex}. {s.studentName}
                      </h3>
                      {s.leadStatus === 'Admitted' ? (
                        <span className="ios-badge" style={{ backgroundColor: '#dcfce7', color: '#166534', flexShrink: 0 }}>
                          Admitted
                        </span>
                      ) : (
                        <span className="ios-badge ios-badge-neutral" style={{ flexShrink: 0 }}>
                          {resolveName(s.group)}
                        </span>
                      )}
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
                        
                        {(s.visits && s.visits.length > 0 && s.leadStatus !== 'Admitted') && (
                          <div style={{ marginTop: '0.75rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>Follow-up:</span>
                              <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.75rem' }}>
                                {s.visits[0].nextFollowUpType === 'Date' ? new Date(s.visits[0].nextFollowUpDate!).toLocaleDateString('en-GB') : (s.visits[0].nextFollowUpType || 'None')}
                              </span>
                            </div>
                            {s.visits[0].remarks && (
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                                <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>Remarks:</span>
                                <span style={{ color: '#334155', fontSize: '0.75rem' }}>{s.visits[0].remarks}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {s.leadStatus === 'Admitted' && (
                          <div style={{ marginTop: '0.75rem', backgroundColor: '#f0fdf4', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #bbf7d0' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.75rem' }}>Application No:</span>
                              <span style={{ color: '#15803d', fontWeight: 600, fontSize: '0.75rem' }}>{s.applicationNumber || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                              <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.75rem' }}>Admitted On:</span>
                              <span style={{ color: '#15803d', fontSize: '0.75rem' }}>{s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-GB') : 'N/A'}</span>
                            </div>
                          </div>
                        )}
                        
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
                            {s.leadStatus !== 'Admitted' && (
                              <button 
                                className="ios-btn-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                                onClick={(e) => { e.stopPropagation(); setSelectedStudentId(s.id); setAdmitModalOpen(true); }}
                                title="Mark Admitted"
                              >
                                <FileCheck size={16} />
                              </button>
                            )}
                            <button 
                              className="ios-btn-icon ios-btn-primary"
                              onClick={(e) => { e.stopPropagation(); setSelectedStudentId(s.id); setVisitModalOpen(true); }}
                              title="Add Visit"
                            >
                              <PlusCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : '#ffffff', color: page === 1 ? '#94a3b8' : '#334155', fontSize: '0.875rem', fontWeight: 500 }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                  Page {page} of {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : '#ffffff', color: page === totalPages ? '#94a3b8' : '#334155', fontSize: '0.875rem', fontWeight: 500 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
                <label className="form-label">Next Follow-up Date *</label>
                <input type="date" className="form-control" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} required />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn" style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }} onClick={() => setVisitModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddVisit} disabled={savingVisit}>
                {savingVisit ? 'Saving...' : 'Save Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admit Modal */}
      {admitModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 0, animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={20} /> Mark as Admitted
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Please enter the Application Number to confirm this admission. Once admitted, other colleges will no longer see this student.
            </p>
            <div className="form-group">
              <label className="form-label">Application Number *</label>
              <input 
                type="text" 
                className="form-control" 
                value={applicationNumber} 
                onChange={e => setApplicationNumber(e.target.value)} 
                placeholder="e.g. APP-2026-1029"
                required 
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn" style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }} onClick={() => setAdmitModalOpen(false)}>Cancel</button>
              <button className="btn" style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none' }} onClick={handleAdmitStudent} disabled={savingAdmit}>
                {savingAdmit ? 'Saving...' : 'Confirm Admission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
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
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155', minWidth: '3.5rem' }}>Phone:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{viewStudent.phone}</span>
                    <a href={`tel:${viewStudent.phone}`} style={{ color: '#116d66', padding: '0.25rem' }}>
                      <Phone size={14} />
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155', minWidth: '3.5rem' }}>WhatsApp:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap' }}>{viewStudent.whatsapp || viewStudent.phone}</span>
                    <a href={`https://wa.me/${(viewStudent.whatsapp || viewStudent.phone).replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', padding: '0.25rem' }}>
                      <MessageCircle size={14} />
                    </a>
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
                  <span style={{ fontWeight: 700, color: '#334155', flexShrink: 0 }}>Residential:</span>
                  <span style={{ color: '#1e293b', fontWeight: 500, marginLeft: '0.25rem' }}>{[resolveName(viewStudent.village), resolveName(viewStudent.mandal), resolveName(viewStudent.district)].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
                {viewStudent.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155', flexShrink: 0 }}>Landmark:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500, marginLeft: '0.25rem' }}>{viewStudent.address}</span>
                  </div>
                )}
              </section>
              
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {(viewStudent.visits && viewStudent.visits.length > 0) && (
                  <>
                    <hr style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', margin: '0.25rem 0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>Your Latest Follow-up:</span>
                        <span style={{ color: '#475569', fontWeight: 500 }}>{viewStudent.visits[0].nextFollowUpType === 'Date' ? new Date(viewStudent.visits[0].nextFollowUpDate!).toLocaleDateString('en-GB') : (viewStudent.visits[0].nextFollowUpType || 'None')}</span>
                      </div>
                      {viewStudent.visits[0].remarks && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#334155' }}>Your Remarks:</span>
                          <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: '#f8fafc', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>{viewStudent.visits[0].remarks}</span>
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
