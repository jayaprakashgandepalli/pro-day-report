'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Bell, Clock, User, Phone, School, 
  UserCheck, X, ExternalLink, MessageSquare, CheckCircle, 
  Calendar, MapPin, Building2, CheckCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface RemarkItem {
  text: string;
  date?: string;
  addedBy?: string;
}

interface UpdateItem {
  id: string;
  type: 'STUDENT' | 'SCHOOL' | 'IMP_PERSON';
  name: string;
  phone?: string;
  whatsapp?: string | null;
  fatherName?: string | null;
  schoolName?: string;
  group?: string;
  district?: string;
  mandal?: string;
  village?: string;
  address?: string | null;
  leadStatus?: string;
  studyInterestedAt?: string;
  ableToBearFee?: string;
  nextFollowUpDate?: string | null;
  nextFollowUpType?: string | null;
  headmasterName?: string | null;
  headmasterPhone?: string | null;
  keyPersonName?: string | null;
  keyPersonPhone?: string | null;
  grade?: string | null;
  strength?: number | null;
  designation?: string | null;
  updateAt: string;
  details: string;
  allRemarks?: RemarkItem[];
  isNew?: boolean;
}

export default function TelecallerUpdatesPage() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openedKeys, setOpenedKeys] = useState<string[]>([]);
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasMore: false
  });

  useEffect(() => {
    // Load previously opened update keys from localStorage
    try {
      const stored = localStorage.getItem('opened_telecaller_updates_v1');
      if (stored) {
        setOpenedKeys(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse opened keys:', e);
    }

    fetchUpdates(1);
  }, []);

  const fetchUpdates = async (targetPage = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employee/telecaller-updates?page=${targetPage}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates || []);
        if (data.pagination) {
          setPagination(data.pagination);
          setPage(data.pagination.page);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === page) return;
    fetchUpdates(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getUpdateKey = (item: UpdateItem) => {
    return `${item.type}_${item.id}_${new Date(item.updateAt).getTime()}`;
  };

  const isItemOpened = (item: UpdateItem) => {
    return openedKeys.includes(getUpdateKey(item));
  };

  const handleOpenDetails = (item: UpdateItem) => {
    setSelectedUpdate(item);
    const key = getUpdateKey(item);
    
    if (!openedKeys.includes(key)) {
      const updated = [...openedKeys, key];
      setOpenedKeys(updated);
      try {
        localStorage.setItem('opened_telecaller_updates_v1', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save opened key:', e);
      }
      
      // Update server last viewed in background
      fetch('/api/employee/telecaller-updates', { method: 'POST' }).catch(() => {});
    }
  };

  const handleMarkAllOpened = () => {
    const allKeys = updates.map(getUpdateKey);
    const combined = Array.from(new Set([...openedKeys, ...allKeys]));
    setOpenedKeys(combined);
    try {
      localStorage.setItem('opened_telecaller_updates_v1', JSON.stringify(combined));
    } catch (e) {
      console.error(e);
    }
    fetch('/api/employee/telecaller-updates', { method: 'POST' }).catch(() => {});
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'STUDENT': return <User size={22} className="text-blue-500" />;
      case 'SCHOOL': return <School size={22} className="text-emerald-500" />;
      case 'IMP_PERSON': return <UserCheck size={22} className="text-purple-500" />;
      default: return <Bell size={22} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'STUDENT': return 'Student';
      case 'SCHOOL': return 'School';
      case 'IMP_PERSON': return 'Imp Person';
      default: return 'Update';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    if (new Date().toDateString() === d.toDateString()) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = updates.filter(u => !isItemOpened(u)).length;

  return (
    <div className="container" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/employee" className="btn-icon" style={{ color: '#fff' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Telecaller Updates</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.85 }}>
              {unreadCount > 0 ? `${unreadCount} new update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllOpened}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '0.75rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </header>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>Loading updates...</p>
        ) : updates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 0.5rem 0' }}>No Telecaller Updates</p>
            <p style={{ fontSize: '0.85rem', margin: 0, color: '#94a3b8' }}>
              When a telecaller logs remarks or follow-up details, they will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {updates.map((update, idx) => {
              const opened = isItemOpened(update);

              return (
                <div 
                  key={`${update.id}-${idx}`}
                  onClick={() => handleOpenDetails(update)}
                  className="card" 
                  style={{ 
                    padding: '1.1rem 1.25rem', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '0.65rem', 
                    cursor: 'pointer',
                    borderRadius: '16px',
                    borderLeft: opened ? '5px solid #cbd5e1' : '5px solid #f59e0b',
                    backgroundColor: opened ? '#ffffff' : '#fffbeb',
                    boxShadow: opened ? '0 1px 3px rgba(0,0,0,0.05)' : '0 4px 14px rgba(245, 158, 11, 0.12)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Top Bar: Icon, Name, Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ 
                      backgroundColor: opened ? '#f1f5f9' : '#fef3c7', 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '44px',
                      width: '44px',
                      minWidth: '44px'
                    }}>
                      {getIcon(update.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: '1.05rem', 
                          fontWeight: opened ? 600 : 700, 
                          color: opened ? '#334155' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {update.name}
                        </h3>

                        {opened ? (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            backgroundColor: '#f1f5f9', 
                            color: '#64748b', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '6px', 
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            <CheckCircle size={10} color="#10b981" /> Opened
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            backgroundColor: '#f59e0b', 
                            color: '#fff', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '6px', 
                            fontWeight: 700,
                            letterSpacing: '0.5px'
                          }}>
                            NEW
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: opened ? '#64748b' : '#b45309' }}>
                          {getTypeLabel(update.type)}
                        </span>
                        {update.phone && (
                          <>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Phone size={11} /> {update.phone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Written Remark Snippet (prominently displayed) */}
                  <div style={{ 
                    backgroundColor: opened ? '#f8fafc' : '#fef9c3', 
                    border: opened ? '1px solid #e2e8f0' : '1px solid #fde047',
                    borderRadius: '10px',
                    padding: '0.6rem 0.85rem',
                    fontSize: '0.875rem',
                    color: opened ? '#475569' : '#78350f',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}>
                    <MessageSquare size={16} style={{ marginTop: '2px', flexShrink: 0, opacity: 0.7 }} />
                    <div style={{ flex: 1, wordBreak: 'break-word' }}>
                      <span style={{ fontWeight: 600, marginRight: '0.35rem' }}>Remark:</span>
                      {update.details || 'No remarks provided'}
                    </div>
                  </div>

                  {/* Bottom Footer: Timestamp & Action indicator */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', paddingTop: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {formatDate(update.updateAt)}
                    </span>
                    <span style={{ color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      View details ›
                    </span>
                  </div>
                </div>
              );
            })}
            {/* Pagination Controls (Limit 10) */}
            {pagination.totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1.25rem 0.5rem 0.5rem', 
                marginTop: '0.5rem',
                borderTop: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total} updates
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || loading}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff',
                      color: page <= 1 ? '#94a3b8' : '#0f172a',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>

                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', padding: '0 0.35rem' }}>
                    Page {page} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages || loading}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: page >= pagination.totalPages ? '#f1f5f9' : '#ffffff',
                      color: page >= pagination.totalPages ? '#94a3b8' : '#0f172a',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Opens when employee clicks on any card) */}
      {selectedUpdate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)', 
                  padding: '0.5rem', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(selectedUpdate.type)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    {selectedUpdate.name}
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.65rem' }}>
                      {getTypeLabel(selectedUpdate.type).toUpperCase()}
                    </span>
                    <span>Updated {formatDate(selectedUpdate.updateAt)}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedUpdate(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* SECTION: Details based on Entity Type */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  Entity Information
                </h4>

                {/* SCHOOL DETAILS */}
                {selectedUpdate.type === 'SCHOOL' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>School Grade</span>
                        <strong style={{ color: '#0f172a' }}>{selectedUpdate.grade || 'Not assigned'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Strength</span>
                        <strong style={{ color: '#0f172a' }}>{selectedUpdate.strength ? `${selectedUpdate.strength} Students` : 'Not recorded'}</strong>
                      </div>
                    </div>

                    {(selectedUpdate.mandal || selectedUpdate.district) && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Location</span>
                        <strong style={{ color: '#0f172a' }}>
                          {[selectedUpdate.mandal, selectedUpdate.district].filter(Boolean).join(', ')}
                        </strong>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Headmaster</span>
                          <strong style={{ color: '#0f172a' }}>{selectedUpdate.headmasterName || 'Not recorded'}</strong>
                        </div>
                        {selectedUpdate.headmasterPhone ? (
                          <a 
                            href={`tel:${selectedUpdate.headmasterPhone}`} 
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Phone size={13} /> {selectedUpdate.headmasterPhone}
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No phone</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Key Person</span>
                          <strong style={{ color: '#0f172a' }}>{selectedUpdate.keyPersonName || 'Not recorded'}</strong>
                        </div>
                        {selectedUpdate.keyPersonPhone ? (
                          <a 
                            href={`tel:${selectedUpdate.keyPersonPhone}`} 
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Phone size={13} /> {selectedUpdate.keyPersonPhone}
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No phone</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STUDENT DETAILS */}
                {selectedUpdate.type === 'STUDENT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Father Name</span>
                        <strong style={{ color: '#0f172a' }}>{selectedUpdate.fatherName || 'Not recorded'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Group</span>
                        <strong style={{ color: '#0f172a' }}>{selectedUpdate.group || 'Not specified'}</strong>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>School</span>
                      <strong style={{ color: '#0f172a' }}>{selectedUpdate.schoolName || 'Not recorded'}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Location</span>
                      <strong style={{ color: '#0f172a' }}>
                        {[selectedUpdate.village, selectedUpdate.mandal, selectedUpdate.district].filter(Boolean).join(', ') || 'Not recorded'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Student Mobile</span>
                        <strong style={{ color: '#0f172a' }}>{selectedUpdate.phone || 'No phone'}</strong>
                      </div>
                      {selectedUpdate.phone && (
                        <a 
                          href={`tel:${selectedUpdate.phone}`}
                          style={{
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Phone size={13} /> Call Student
                        </a>
                      )}
                    </div>

                    {selectedUpdate.nextFollowUpDate && (
                      <div style={{ backgroundColor: '#eff6ff', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                        <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={13} /> Next Follow-up
                        </span>
                        <strong style={{ color: '#1e3a8a', fontSize: '0.85rem' }}>
                          {new Date(selectedUpdate.nextFollowUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {selectedUpdate.nextFollowUpType ? ` (${selectedUpdate.nextFollowUpType})` : ''}
                        </strong>
                      </div>
                    )}

                    <div style={{ paddingTop: '0.25rem' }}>
                      <Link 
                        href={`/employee/students/${selectedUpdate.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#2563eb',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        Open Full Student Profile <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* IMP PERSON DETAILS */}
                {selectedUpdate.type === 'IMP_PERSON' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Designation</span>
                        <strong style={{ color: '#0f172a' }}>{selectedUpdate.designation || 'Not specified'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Mandal / Area</span>
                        <strong style={{ color: '#0f172a' }}>{selectedUpdate.mandal || 'Not recorded'}</strong>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Full Address</span>
                      <strong style={{ color: '#0f172a' }}>
                        {[selectedUpdate.address, selectedUpdate.village, selectedUpdate.mandal, selectedUpdate.district].filter(Boolean).join(', ') || 'Not recorded'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Mobile Number</span>
                        <strong style={{ color: '#0f172a' }}>{selectedUpdate.phone || 'No phone'}</strong>
                      </div>
                      {selectedUpdate.phone && (
                        <a 
                          href={`tel:${selectedUpdate.phone}`}
                          style={{
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Phone size={13} /> Call
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: Full Remarks History */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={16} color="#3b82f6" /> 
                  Remarks & Communication History
                  {selectedUpdate.allRemarks && selectedUpdate.allRemarks.length > 0 && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                      {selectedUpdate.allRemarks.length}
                    </span>
                  )}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(!selectedUpdate.allRemarks || selectedUpdate.allRemarks.length === 0) ? (
                    <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem', color: '#334155' }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>{selectedUpdate.details}</p>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.35rem' }}>
                        Logged {formatDate(selectedUpdate.updateAt)}
                      </span>
                    </div>
                  ) : (
                    selectedUpdate.allRemarks.map((remark, rIdx) => (
                      <div 
                        key={rIdx}
                        style={{
                          backgroundColor: rIdx === 0 ? '#eff6ff' : '#ffffff',
                          border: rIdx === 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                      >
                        <div style={{ fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.5, fontWeight: 500 }}>
                          "{remark.text}"
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.35rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                            <User size={12} /> {remark.addedBy || 'Telecaller'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {formatDate(remark.date)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              backgroundColor: '#f8fafc'
            }}>
              <button 
                onClick={() => setSelectedUpdate(null)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              {selectedUpdate.phone && (
                <a 
                  href={`tel:${selectedUpdate.phone}`}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Phone size={15} /> Call Now
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
