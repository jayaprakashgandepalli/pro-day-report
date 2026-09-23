'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Search, PlusCircle, MapPin, Calendar, Edit } from 'lucide-react';

type Visit = {
  id: string;
  visitDate: string;
  remarks: string;
};

type Student = {
  id: string;
  studentName: string;
  phone: string;
  whatsapp: string | null;
  fatherName: string | null;
  group: string;
  schoolName: string | null;
  schoolArea: string | null;
  village: string | null;
  studyInterestedAt?: string | null;
  ableToBearFee?: string | null;
  visits?: Visit[];
};

export default function VillageVisits() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [configMap, setConfigMap] = useState<Record<string, string>>({});
  const [configParentMap, setConfigParentMap] = useState<Record<string, string>>({});
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMandalId, setSelectedMandalId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, met
  
  // Visit Modal
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [visitRemarks, setVisitRemarks] = useState('');
  const [visitOutcome, setVisitOutcome] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [joinedCollegeId, setJoinedCollegeId] = useState('');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  
  const [colleges, setColleges] = useState<{employeeId: string, name: string}[]>([]);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedStudentId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    fetchConfigs();
    fetchStudents();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        const pMap: Record<string, string> = {};
        data.configs.forEach((c: any) => { 
          map[c.id] = c.value; 
          if (c.parentId) pMap[c.id] = c.parentId;
        });
        setConfigMap(map);
        setConfigParentMap(pMap);
      }
      
      // Fetch colleges
      const colRes = await fetch('/api/colleges/list');
      if (colRes.ok) {
        const colData = await colRes.json();
        setColleges(colData.colleges || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Fetching all students, filtering locally
      const res = await fetch(`/api/students?limit=1000&minimal=true`);
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

  const resolveName = (val: string | null | undefined) => {
    if (!val) return null;
    return configMap[val] || val;
  };

  // Extract unique mandals for the dropdown
  const uniqueMandals = useMemo(() => {
    const mandalsMap = new Map<string, string>();
    students.forEach(s => {
      if (s.village) {
        const mandalId = configParentMap[s.village];
        if (mandalId && resolveName(mandalId)) {
          mandalsMap.set(mandalId, resolveName(mandalId)!);
        }
      }
    });
    return Array.from(mandalsMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [students, configParentMap, configMap]);

  // Extract unique villages for the dropdown (filtered by selected Mandal)
  const uniqueVillages = useMemo(() => {
    const villagesMap = new Map<string, string>();
    students.forEach(s => {
      if (s.village) {
        const mandalId = configParentMap[s.village];
        // If a mandal is selected, only show villages from that mandal
        if (selectedMandalId && mandalId !== selectedMandalId) return;
        
        villagesMap.set(s.village, resolveName(s.village) || s.village);
      }
    });
    return Array.from(villagesMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [students, configMap, configParentMap, selectedMandalId]);

  // Determine if a student was visited on the selected date
  const wasVisitedOnDate = (student: Student, dateStr: string) => {
    if (!student.visits || student.visits.length === 0) return false;
    // Check if any visit matches the selected date
    // Usually the API only returns the latest visit because of take: 1, 
    // but in case it returns more or it's the latest, we check.
    const latestVisit = student.visits[0];
    const visitDate = new Date(latestVisit.visitDate).toISOString().split('T')[0];
    return visitDate === dateStr;
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const isStudentClosed = () => {
        if (s.leadStatus === 'Joined Other College' || s.leadStatus === 'Not Interested') return true;
        if (s.ableToBearFee === 'Not Bearable') return true;
        if (s.studyInterestedAt === 'Local College' || s.studyInterestedAt === 'Other') return true;
        const dropGroups = ['CEC', 'HEC', 'ITI academy', 'Polytechnic', 'Defence academy'];
        if (s.group && dropGroups.includes(s.group)) return true;
        return false;
      };

      if (isStudentClosed()) return false;

      const matchesSearch = s.studentName.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search);
      const matchesMandal = selectedMandalId === '' || (s.village && configParentMap[s.village] === selectedMandalId);
      const matchesVillage = selectedVillageId === '' || s.village === selectedVillageId;
      
      const isMet = wasVisitedOnDate(s, selectedDate);
      
      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = !isMet;
      }
      if (statusFilter === 'met') matchesStatus = isMet;
      
      return matchesSearch && matchesMandal && matchesVillage && matchesStatus;
    });
  }, [students, search, selectedMandalId, selectedVillageId, selectedDate, statusFilter, configParentMap]);

  const handleAddVisit = async () => {
    if (!visitRemarks) return alert("Remarks are required");
    setSavingVisit(true);
    
    // We send the selectedDate to the API so the visit is recorded for that date if they chose a past date
    let apiFollowUpType = null;
    let apiStudentStatus = null;

    if (visitOutcome === 'after_exams') { apiFollowUpType = 'After Exams'; apiStudentStatus = 'Following Up'; }
    if (visitOutcome === 'after_results') { apiFollowUpType = 'After Results'; apiStudentStatus = 'Following Up'; }
    if (visitOutcome === 'specific_date') { apiFollowUpType = 'Date'; apiStudentStatus = 'Following Up'; }
    if (visitOutcome === 'joined_other') { apiStudentStatus = 'Joined Other College'; }
    if (visitOutcome === 'not_interested') { apiStudentStatus = 'Not Interested'; }
    if (visitOutcome === 'following_up') { apiStudentStatus = 'Following Up'; }
    if (visitOutcome === 'admitted') { apiStudentStatus = 'Admitted'; }

    if (visitOutcome === 'admitted' && !joinedCollegeId) {
      alert('Please select the college branch.');
      setSavingVisit(false);
      return;
    }

    try {
      const res = await fetch(`/api/students/${selectedStudentId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          remarks: visitRemarks, 
          visitDate: new Date(selectedDate).toISOString(),
          nextFollowUpType: apiFollowUpType,
          nextFollowUpDate: (apiFollowUpType === 'Date' && nextFollowUpDate) ? nextFollowUpDate : null,
          leadStatus: apiStudentStatus,
          joinedCollegeId: visitOutcome === 'admitted' ? joinedCollegeId : undefined,
          applicationNumber: visitOutcome === 'admitted' ? applicationNumber : undefined
        })
      });
      if (res.ok) {
        alert("Visit added!");
        setVisitModalOpen(false);
        setVisitRemarks('');
        setVisitOutcome('');
        setNextFollowUpDate('');
        setJoinedCollegeId('');
        setApplicationNumber('');
        fetchStudents(); // refresh the list to get new visit date
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
    <div className="container" style={{ padding: 0, paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh', margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
      <header className="app-header-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/employee" className="btn-icon" style={{ color: '#cbd5e1', padding: '0.25rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Village Visits</h1>
            <p style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', color: '#bfdbfe', fontWeight: 500, letterSpacing: '0.05em' }}>Field Survey & Tracking</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 500, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
            Online
          </span>
        </div>
      </header>
      
      <div style={{ padding: '1rem' }}>
        {/* Filters Section */}
        <section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '0.875rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid rgba(226, 232, 240, 0.9)', marginBottom: '1rem' }}>
          
          <div style={{ marginBottom: '0.75rem' }}>
             <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date</label>
             <div style={{ position: 'relative' }}>
               <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
               <input 
                 type="date" 
                 value={selectedDate} 
                 onChange={e => setSelectedDate(e.target.value)}
                 style={{ width: '100%', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.5rem 0.5rem 0.5rem 2rem', fontWeight: 500 }}
               />
             </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Select Mandal</label>
              <select 
                value={selectedMandalId} 
                onChange={e => { setSelectedMandalId(e.target.value); setSelectedVillageId(''); }}
                style={{ width: '100%', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.5rem', fontWeight: 500 }}
              >
                <option value="">All Mandals</option>
                {uniqueMandals.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Select Village</label>
              <select 
                value={selectedVillageId} 
                onChange={e => setSelectedVillageId(e.target.value)}
                style={{ width: '100%', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.5rem', fontWeight: 500 }}
              >
                <option value="">All Villages</option>
                {uniqueVillages.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.7)' }}>
            <button 
              style={{ padding: '0.375rem', fontSize: '0.75rem', fontWeight: statusFilter === 'all' ? 600 : 500, borderRadius: '6px', border: 'none', backgroundColor: statusFilter === 'all' ? '#ffffff' : 'transparent', color: statusFilter === 'all' ? '#0f172a' : '#475569', boxShadow: statusFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setStatusFilter('all')}
            >All</button>
            <button 
              style={{ padding: '0.375rem', fontSize: '0.75rem', fontWeight: statusFilter === 'pending' ? 600 : 500, borderRadius: '6px', border: 'none', backgroundColor: statusFilter === 'pending' ? '#ffffff' : 'transparent', color: statusFilter === 'pending' ? '#0f172a' : '#475569', boxShadow: statusFilter === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setStatusFilter('pending')}
            >Pending</button>
            <button 
              style={{ padding: '0.375rem', fontSize: '0.75rem', fontWeight: statusFilter === 'met' ? 600 : 500, borderRadius: '6px', border: 'none', backgroundColor: statusFilter === 'met' ? '#ffffff' : 'transparent', color: statusFilter === 'met' ? '#0f172a' : '#475569', boxShadow: statusFilter === 'met' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setStatusFilter('met')}
            >Met Today</button>
          </div>
        </section>

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
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>No students found for this filter.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredStudents.map((s, index) => {
              const isMet = wasVisitedOnDate(s, selectedDate);
              const isExpanded = expandedStudentId === s.id;
              
              return (
                <article key={s.id} className={`student-card-ios ${isMet ? 'completed' : ''}`} onClick={(e) => toggleExpand(s.id, e)}>
                  {isMet && <div style={{ height: '4px', backgroundColor: '#10b981', width: '100%' }}></div>}
                  
                  <div className="student-card-ios-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {index + 1}. {s.studentName}
                      </h3>
                      {isMet && (
                        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', backgroundColor: '#059669', color: '#ffffff', borderRadius: '50%' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </span>
                      )}
                      <span className={`ios-badge ${isMet ? 'ios-badge-completed' : 'ios-badge-pending'}`}>
                        {isMet ? 'Completed' : 'Pending'}
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
                          Father: <span style={{ color: '#334155', fontWeight: 600 }}>{s.fatherName || 'N/A'}</span>
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                            {resolveName(s.group)}
                          </span>
                          {s.village && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 500, backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #e0e7ff' }}>
                              <MapPin size={12} style={{ marginRight: '4px' }} />
                              {resolveName(s.village)}
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
                            <button onClick={(e) => { e.stopPropagation(); setViewStudent(s); }} style={{ background: 'transparent', border: 'none', fontSize: '0.6875rem', fontWeight: 600, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: 0 }}>
                              Full Details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Link href={`/students/edit/${s.id}`} className="ios-btn-icon ios-btn-action" onClick={(e) => e.stopPropagation()} title="Edit">
                              <Edit size={14} />
                            </Link>
                            <button 
                              className={`ios-btn-icon ${isMet ? 'ios-btn-success' : 'ios-btn-primary'}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedStudentId(s.id); setVisitModalOpen(true); }}
                              title={isMet ? "Add Another Visit" : "Add Visit"}
                            >
                              {isMet ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              ) : (
                                <PlusCircle size={16} />
                              )}
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
            <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>Record Visit</h2>
            <div style={{ background: '#eff6ff', color: '#1e3a8a', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Recording visit for <strong>{selectedDate}</strong>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks *</label>
              <textarea className="form-control" rows={3} value={visitRemarks} onChange={e => setVisitRemarks(e.target.value)} placeholder="What was discussed?"></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Visit Outcome / Next Action</label>
              <select className="form-control" value={visitOutcome} onChange={e => { setVisitOutcome(e.target.value); setNextFollowUpDate(''); }}>
                <option value="">Select option...</option>
                <option value="following_up">Just Follow-up (No specific date)</option>
                <option value="after_exams">Follow-up After Exams</option>
                <option value="after_results">Follow-up After Results</option>
                <option value="specific_date">Follow-up on Specific Date</option>
                <option value="admitted">Closed - Admitted to Our College</option>
                <option value="joined_other">Closed - Joined Other College</option>
                <option value="not_interested">Closed - Not Interested</option>
              </select>
            </div>
            {visitOutcome === 'specific_date' && (
              <div className="form-group">
                <label className="form-label">Select Follow-up Date</label>
                <input type="date" className="form-control" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} />
              </div>
            )}
            {visitOutcome === 'admitted' && (
              <>
                <div className="form-group">
                  <label className="form-label">Select College Branch *</label>
                  <select className="form-control" value={joinedCollegeId} onChange={e => setJoinedCollegeId(e.target.value)}>
                    <option value="">Select College...</option>
                    {colleges.map(c => (
                      <option key={c.employeeId} value={c.employeeId}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Application Number (Optional)</label>
                  <input type="text" className="form-control" value={applicationNumber} onChange={e => setApplicationNumber(e.target.value)} placeholder="e.g. APP-12345" />
                </div>
              </>
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
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.025em' }}>Field Survey Quick View</span>
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
                  <span style={{ color: '#1e293b', fontWeight: 500, marginLeft: '0.25rem' }}>{resolveName(viewStudent.village) || 'N/A'}</span>
                </div>
              </section>
              
              <hr style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', margin: '0.25rem 0' }} />
              
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>Fee capacity:</span>
                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{resolveName(viewStudent.ableToBearFee) || 'N/A'}</span>
                </div>
              </section>
              
              <footer style={{ paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setViewStudent(null)}
                  style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, borderRadius: '0.75rem', fontSize: '0.9375rem', border: 'none', cursor: 'pointer' }}
                >
                  Close
                </button>
                <Link 
                  href={`/students/edit/${viewStudent.id}`}
                  style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: '#116d66', color: '#ffffff', fontWeight: 600, borderRadius: '0.75rem', fontSize: '0.9375rem', border: 'none', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}
                >
                  Edit Profile
                </Link>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
