'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, School, Phone, MessageSquare, 
  Users, CheckCircle2, Table, LayoutGrid, MessageCircle, 
  AlertCircle, ExternalLink, X, MapPin, TrendingUp 
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RemarksModal from '@/components/RemarksModal';
import SchoolReportModal from '@/components/SchoolReportModal';

export default function TelecallerSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  // View mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filters
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'withPhone' | 'pending' | 'hasRemarks'>('all');

  // Remarks Modal
  const [selectedSchool, setSelectedSchool] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, statsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/schools/stats?all=true')
      ]);

      if (configRes.ok) {
        const data = await configRes.json();
        setConfigs(data.configs || []);
        
        // Filter out schools
        const allSchools = (data.configs || []).filter((c: any) => c.type === 'SCHOOL');
        setSchools(allSchools);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStudentCounts(statsData.counts || {});
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getOptions = (type: string, parentId?: string) => {
    let opts = configs.filter(c => c.type === type);
    if (parentId) {
      opts = opts.filter(c => c.parentId === parentId);
    }
    return opts.sort((a, b) => a.value.localeCompare(b.value));
  };

  // Find the hierarchy for a school to filter properly
  const getSchoolHierarchy = (schoolId: string) => {
    const school = configs.find(c => c.id === schoolId);
    if (!school) return { village: null, mandal: null, district: null, villageName: '', mandalName: '' };
    
    const v = configs.find(c => c.id === school.parentId);
    const m = v ? configs.find(c => c.id === v.parentId) : null;
    const d = m ? configs.find(c => c.id === m.parentId) : null;
    
    return {
      village: v?.id || null,
      mandal: m?.id || null,
      district: d?.id || null,
      villageName: v?.value || '',
      mandalName: m?.value || ''
    };
  };

  const getCollectedCount = (school: any) => {
    return (studentCounts[school.value] || 0) + (studentCounts[school.id] || 0);
  };

  const cleanPhoneForDial = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  };

  const cleanPhoneForWa = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length > 10 ? digits : `91${digits}`;
  };

  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const hier = getSchoolHierarchy(school.id);
      
      if (district && hier.district !== district) return false;
      if (mandal && hier.mandal !== mandal) return false;
      if (village && hier.village !== village) return false;
      
      // Quick filter tabs
      const hasPhone = Boolean(school.headmasterPhone || school.keyPersonPhone);
      const remarksCount = Array.isArray(school.remarks) ? school.remarks.length : 0;
      const strength = school.strength || 0;
      const collected = getCollectedCount(school);

      if (quickFilter === 'withPhone' && !hasPhone) return false;
      if (quickFilter === 'pending' && strength > 0 && collected >= strength) return false;
      if (quickFilter === 'hasRemarks' && remarksCount === 0) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchName = school.value?.toLowerCase().includes(q);
        const matchHmName = school.headmasterName?.toLowerCase().includes(q);
        const matchHmPhone = school.headmasterPhone?.toLowerCase().includes(q);
        const matchKpName = school.keyPersonName?.toLowerCase().includes(q);
        const matchKpPhone = school.keyPersonPhone?.toLowerCase().includes(q);
        const matchMandal = hier.mandalName?.toLowerCase().includes(q);
        const matchVillage = hier.villageName?.toLowerCase().includes(q);
        
        return matchName || matchHmName || matchHmPhone || matchKpName || matchKpPhone || matchMandal || matchVillage;
      }
      
      return true;
    }).sort((a, b) => {
      const hierA = getSchoolHierarchy(a.id);
      const hierB = getSchoolHierarchy(b.id);
      const mandalCompare = (hierA.mandalName || '').localeCompare(hierB.mandalName || '');
      if (mandalCompare !== 0) return mandalCompare;
      const villageCompare = (hierA.villageName || '').localeCompare(hierB.villageName || '');
      if (villageCompare !== 0) return villageCompare;
      return (a.value || '').localeCompare(b.value || '');
    });
  }, [schools, configs, studentCounts, district, mandal, village, search, quickFilter]);

  // Overall Statistics for the filtered view
  const summaryStats = useMemo(() => {
    let totalStrength = 0;
    let totalCollected = 0;
    let schoolsWithPhone = 0;

    filteredSchools.forEach(s => {
      totalStrength += s.strength || 0;
      totalCollected += getCollectedCount(s);
      if (s.headmasterPhone || s.keyPersonPhone) {
        schoolsWithPhone++;
      }
    });

    const progressPct = totalStrength > 0 ? Math.min(100, Math.round((totalCollected / totalStrength) * 100)) : 0;

    return {
      totalSchools: filteredSchools.length,
      totalStrength,
      totalCollected,
      progressPct,
      schoolsWithPhone
    };
  }, [filteredSchools, studentCounts]);

  const handleSaveRemarks = async (newRemarks: any[]) => {
    if (!selectedSchool) return;
    
    const res = await fetch(`/api/config/${selectedSchool.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        value: selectedSchool.value,
        remarks: newRemarks 
      })
    });
    
    if (!res.ok) throw new Error('Failed to save');
    
    // Update local state
    setSchools(schools.map(s => s.id === selectedSchool.id ? { ...s, remarks: newRemarks } : s));
    setSelectedSchool({ ...selectedSchool, remarks: newRemarks });
  };

  const getGradeBadge = (grade?: string) => {
    if (!grade) return null;
    const styles: Record<string, { bg: string, color: string }> = {
      'A+': { bg: '#e0e7ff', color: '#3730a3' },
      'A': { bg: '#dcfce7', color: '#166534' },
      'B': { bg: '#fef3c7', color: '#92400e' },
      'C': { bg: '#f1f5f9', color: '#475569' }
    };
    const s = styles[grade] || { bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ 
        backgroundColor: s.bg, 
        color: s.color, 
        fontSize: '0.7rem', 
        fontWeight: 600, 
        padding: '2px 8px', 
        borderRadius: '999px',
        border: `1px solid ${s.color}20`
      }}>
        Grade {grade}
      </span>
    );
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Header */}
      <header className="app-header-dark" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0.85rem 1rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#0f172a',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/telecaller" className="btn-icon" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>School Directory</h1>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>Calling & Student Progress</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* PDF Report Export */}
          <SchoolReportModal 
            buttonLabel="PDF" 
            buttonClassName=""
            buttonStyle={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              borderRadius: '6px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
            currentSchools={filteredSchools}
            currentDistrictName={district ? configs.find(c => c.id === district)?.value : ''}
            currentMandalName={mandal ? configs.find(c => c.id === mandal)?.value : ''}
            getSchoolHierarchy={getSchoolHierarchy}
            getCollectedCount={getCollectedCount}
          />

          {/* Cards / Table Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '2px', borderRadius: '6px' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#2563eb' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              title="Cards View"
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#2563eb' : 'transparent',
                color: viewMode === 'table' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              title="Table View"
            >
              <Table size={14} /> Table
            </button>
          </div>
        </div>
      </header>

      <div style={{ width: '100%', padding: '1rem 1.5rem', boxSizing: 'border-box' }}>
        
        {/* KPI / Progress Banner */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '0.75rem', 
          marginBottom: '1rem' 
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '0.85rem 1rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Schools</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{summaryStats.totalSchools}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '0.85rem 1rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Total 10th</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2563eb' }}>{summaryStats.totalStrength.toLocaleString()}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '0.85rem 1rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Collected</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>{summaryStats.totalCollected.toLocaleString()}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '0.85rem 1rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Progress %</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f766e' }}>{summaryStats.progressPct}%</div>
          </div>
        </div>

        {/* Search & Location Filters */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          padding: '1rem', 
          marginBottom: '1rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          {/* Controls Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '0.75rem', 
            marginBottom: '0.75rem' 
          }}>
            {/* Search Box */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by school, HM, phone, mandal..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 2.2rem 0.6rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  backgroundColor: '#f8fafc'
                }}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{ 
                    position: 'absolute', 
                    right: '0.6rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    color: '#94a3b8', 
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* District Selection */}
            <select 
              value={district} 
              onChange={e => { setDistrict(e.target.value); setMandal(''); setVillage(''); }}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                backgroundColor: '#f8fafc',
                color: '#334155'
              }}
            >
              <option value="">All Districts</option>
              {getOptions('DISTRICT').map(d => (
                <option key={d.id} value={d.id}>{d.value}</option>
              ))}
            </select>
            
            {/* Mandal Selection */}
            <select 
              value={mandal} 
              onChange={e => { setMandal(e.target.value); setVillage(''); }} 
              disabled={!district}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                backgroundColor: district ? '#f8fafc' : '#f1f5f9',
                color: district ? '#334155' : '#94a3b8'
              }}
            >
              <option value="">All Mandals</option>
              {getOptions('MANDAL', district).map(m => (
                <option key={m.id} value={m.id}>{m.value}</option>
              ))}
            </select>
          </div>

          {/* Quick Filter Pills */}
          <div style={{ 
            display: 'flex', 
            gap: '0.4rem', 
            overflowX: 'auto', 
            paddingBottom: '2px', 
            scrollbarWidth: 'none' 
          }}>
            <button
              onClick={() => setQuickFilter('all')}
              style={{
                whiteSpace: 'nowrap',
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: '999px',
                border: quickFilter === 'all' ? '1px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: quickFilter === 'all' ? '#eff6ff' : '#f8fafc',
                color: quickFilter === 'all' ? '#1d4ed8' : '#64748b',
                fontWeight: quickFilter === 'all' ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              All ({schools.length})
            </button>
            <button
              onClick={() => setQuickFilter('withPhone')}
              style={{
                whiteSpace: 'nowrap',
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: '999px',
                border: quickFilter === 'withPhone' ? '1px solid #16a34a' : '1px solid #e2e8f0',
                backgroundColor: quickFilter === 'withPhone' ? '#f0fdf4' : '#f8fafc',
                color: quickFilter === 'withPhone' ? '#15803d' : '#64748b',
                fontWeight: quickFilter === 'withPhone' ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              📞 With Phone
            </button>
            <button
              onClick={() => setQuickFilter('pending')}
              style={{
                whiteSpace: 'nowrap',
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: '999px',
                border: quickFilter === 'pending' ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                backgroundColor: quickFilter === 'pending' ? '#fffbeb' : '#f8fafc',
                color: quickFilter === 'pending' ? '#b45309' : '#64748b',
                fontWeight: quickFilter === 'pending' ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              ⏳ Pending Collection
            </button>
            <button
              onClick={() => setQuickFilter('hasRemarks')}
              style={{
                whiteSpace: 'nowrap',
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: '999px',
                border: quickFilter === 'hasRemarks' ? '1px solid #8b5cf6' : '1px solid #e2e8f0',
                backgroundColor: quickFilter === 'hasRemarks' ? '#f5f3ff' : '#f8fafc',
                color: quickFilter === 'hasRemarks' ? '#6d28d9' : '#64748b',
                fontWeight: quickFilter === 'hasRemarks' ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              💬 With Remarks
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Loading school data...</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Please wait</div>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <School size={44} style={{ margin: '0 auto 0.75rem', color: '#cbd5e1' }} />
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#334155' }}>No schools found</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Try adjusting your search or filters.</p>
          </div>
        ) : viewMode === 'cards' ? (
          /* =====================================================================
             CARDS VIEW - RESPONSIVE CRM CALLING CARDS
             ===================================================================== */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                Showing Schools: <strong>{filteredSchools.length}</strong>
              </span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
              gap: '1rem' 
            }}>

            {filteredSchools.map(school => {
              const hier = getSchoolHierarchy(school.id);
              const remarksCount = Array.isArray(school.remarks) ? school.remarks.length : 0;
              const lastRemark = remarksCount > 0 ? school.remarks[remarksCount - 1] : null;

              // Student statistics
              const strength = school.strength || 0;
              const collected = getCollectedCount(school);
              const remaining = Math.max(0, strength - collected);
              const percentage = strength > 0 ? Math.min(100, Math.round((collected / strength) * 100)) : 0;

              const hasHmPhone = Boolean(school.headmasterPhone);
              const hasKpPhone = Boolean(school.keyPersonPhone);

              return (
                <div 
                  key={school.id} 
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    padding: '0.85rem'
                  }}
                >
                  {/* Top Bar: School Name, Grade, Location */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                        {school.value}
                      </h3>
                      {getGradeBadge(school.grade)}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.35rem', 
                      fontSize: '0.75rem', 
                      color: '#64748b', 
                      marginTop: '0.25rem' 
                    }}>
                      <MapPin size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span>{hier.villageName ? `${hier.villageName}, ` : ''}{hier.mandalName || 'Unknown Mandal'}</span>
                    </div>
                  </div>

                  {/* =========================================================
                      STUDENT STATISTICS RIBBON
                      ========================================================= */}
                  <div style={{ 
                    backgroundColor: '#f1f5f9', 
                    borderRadius: '8px', 
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '0.35rem',
                      fontSize: '0.78rem'
                    }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Total Students: </span>
                        <strong style={{ color: '#0f172a' }}>{strength > 0 ? strength : 'Not Set'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Collected: </span>
                        <strong style={{ color: collected > 0 ? '#059669' : '#0f172a' }}>{collected}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Remaining: </span>
                        <strong style={{ color: remaining > 0 ? '#b45309' : '#64748b' }}>
                          {strength > 0 ? remaining : '-'}
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          backgroundColor: percentage >= 80 ? '#10b981' : percentage >= 40 ? '#0d9488' : '#f59e0b',
                          borderRadius: '999px',
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: '0.3rem',
                      fontSize: '0.7rem'
                    }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>{percentage}% Collected</span>
                      
                      {collected > 0 ? (
                        <Link 
                          href={`/telecaller/students?schoolName=${encodeURIComponent(school.value)}`}
                          style={{ 
                            color: '#2563eb', 
                            fontWeight: 600, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '2px',
                            textDecoration: 'none'
                          }}
                        >
                          View Students ({collected}) <ExternalLink size={10} />
                        </Link>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No students yet</span>
                      )}
                    </div>
                  </div>

                  {/* =========================================================
                      CONTACTS SECTION (1-Tap Direct Call & WhatsApp)
                      ========================================================= */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {/* Headmaster Contact Row */}
                    {(school.headmasterName || hasHmPhone) && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        backgroundColor: '#f8fafc',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #f1f5f9'
                      }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block', lineHeight: 1 }}>HM:</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                            {school.headmasterName || 'Headmaster'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                          {hasHmPhone ? (
                            <>
                              <a
                                href={`tel:${cleanPhoneForDial(school.headmasterPhone)}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                              >
                                <Phone size={12} /> Call
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhoneForWa(school.headmasterPhone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#25d366',
                                  color: '#ffffff',
                                  padding: '5px 7px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  textDecoration: 'none'
                                }}
                                title="WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </a>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>No phone</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Person Contact Row */}
                    {(school.keyPersonName || hasKpPhone) && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        backgroundColor: '#f8fafc',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #f1f5f9'
                      }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block', lineHeight: 1 }}>Key Person:</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                            {school.keyPersonName || 'Key Person'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                          {hasKpPhone ? (
                            <>
                              <a
                                href={`tel:${cleanPhoneForDial(school.keyPersonPhone)}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                              >
                                <Phone size={12} /> Call
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhoneForWa(school.keyPersonPhone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#25d366',
                                  color: '#ffffff',
                                  padding: '5px 7px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  textDecoration: 'none'
                                }}
                                title="WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </a>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>No phone</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Warning if no contacts exist at all */}
                    {!hasHmPhone && !hasKpPhone && !school.headmasterName && !school.keyPersonName && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        fontSize: '0.75rem', 
                        color: '#94a3b8',
                        padding: '0.25rem 0'
                      }}>
                        <AlertCircle size={13} />
                        <span>No contact numbers available</span>
                      </div>
                    )}
                  </div>

                  {/* =========================================================
                      LAST REMARK PREVIEW (If exists)
                      ========================================================= */}
                  {lastRemark && (
                    <div style={{ 
                      backgroundColor: '#fefce8', 
                      border: '1px solid #fef08a', 
                      borderRadius: '6px', 
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ color: '#713f12', fontWeight: 500, lineHeight: 1.3 }}>
                        💬 &ldquo;{lastRemark.text}&rdquo;
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#a16207', marginTop: '0.25rem' }}>
                        — {lastRemark.addedBy || 'Telecaller'}, {new Date(lastRemark.date).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      CARD FOOTER: REMARKS ACTION
                      ========================================================= */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px dashed #e2e8f0' }}>
                    <button
                      onClick={() => setSelectedSchool(school)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        backgroundColor: remarksCount > 0 ? '#f0fdf4' : '#f8fafc',
                        color: remarksCount > 0 ? '#15803d' : '#475569',
                        border: remarksCount > 0 ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <MessageSquare size={14} />
                      {remarksCount > 0 ? `Remarks (${remarksCount})` : '+ Add Remark'}
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        ) : (
          /* =====================================================================
             TABLE VIEW - HIGH DENSITY FOR LAPTOP / DESKTOP
             ===================================================================== */
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            overflowX: 'auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            width: '100%'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>School & Mandal</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '140px' }}>Total / Collected</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '180px' }}>Headmaster</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '180px' }}>Key Person</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Last Remark</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school, index) => {
                  const hier = getSchoolHierarchy(school.id);
                  const mandalName = hier.mandalName || 'Unknown Mandal';
                  const prevMandal = index > 0 ? (getSchoolHierarchy(filteredSchools[index - 1].id).mandalName || 'Unknown Mandal') : null;
                  const showMandalBanner = index === 0 || prevMandal !== mandalName;

                  const remarksCount = Array.isArray(school.remarks) ? school.remarks.length : 0;
                  const lastRemark = remarksCount > 0 ? school.remarks[remarksCount - 1] : null;

                  const strength = school.strength || 0;
                  const collected = getCollectedCount(school);
                  const remaining = Math.max(0, strength - collected);
                  const percentage = strength > 0 ? Math.min(100, Math.round((collected / strength) * 100)) : 0;

                  const hasHmPhone = Boolean(school.headmasterPhone);
                  const hasKpPhone = Boolean(school.keyPersonPhone);

                  return (
                    <Fragment key={school.id}>
                      {showMandalBanner && (
                        <tr style={{ backgroundColor: '#eff6ff', borderTop: '2px solid #bfdbfe', borderBottom: '1px solid #dbeafe' }}>
                          <td colSpan={6} style={{ padding: '0.65rem 1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#1e40af', fontSize: '0.88rem', letterSpacing: '0.5px' }}>
                              <MapPin size={16} style={{ color: '#2563eb' }} />
                              <span>MANDAL: {mandalName.toUpperCase()}</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      <tr 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fcfcfd',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* 1. School Name & Location */}
                        <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', minWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
                              {school.value}
                            </span>
                            {getGradeBadge(school.grade)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                            <MapPin size={12} style={{ color: '#94a3b8' }} />
                            <span>{hier.villageName ? `${hier.villageName}, ` : ''}{hier.mandalName}</span>
                          </div>
                        </td>

                        {/* 2. Total 10th & Collected Stats */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center', minWidth: '150px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 800, color: collected > 0 ? '#059669' : '#0f172a', fontSize: '1.05rem' }}>
                              {collected}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                              / {strength > 0 ? strength : 'Not set'}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div style={{ width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', margin: '5px auto 4px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${percentage}%`, 
                                height: '100%', 
                                backgroundColor: percentage >= 80 ? '#10b981' : percentage >= 40 ? '#0d9488' : '#f59e0b',
                                borderRadius: '999px' 
                              }} 
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>{percentage}%</span>
                            {collected > 0 ? (
                              <Link 
                                href={`/telecaller/students?schoolName=${encodeURIComponent(school.value)}`}
                                style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1px' }}
                              >
                                View ({collected}) <ExternalLink size={10} />
                              </Link>
                            ) : null}
                          </div>
                        </td>

                        {/* 3. Headmaster Contact */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', minWidth: '190px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
                            {school.headmasterName || 'Headmaster'}
                          </div>
                          {hasHmPhone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '4px' }}>
                              <a 
                                href={`tel:${cleanPhoneForDial(school.headmasterPhone)}`}
                                style={{ 
                                  backgroundColor: '#16a34a', 
                                  color: '#ffffff', 
                                  padding: '4px 8px', 
                                  borderRadius: '6px', 
                                  textDecoration: 'none', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px', 
                                  fontWeight: 600, 
                                  fontSize: '0.78rem' 
                                }}
                              >
                                <Phone size={12} /> {school.headmasterPhone}
                              </a>
                              <a 
                                href={`https://wa.me/${cleanPhoneForWa(school.headmasterPhone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  backgroundColor: '#25d366', 
                                  color: '#ffffff', 
                                  padding: '4px 6px', 
                                  borderRadius: '6px', 
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </a>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No phone</span>
                          )}
                        </td>

                        {/* 4. Key Person Contact */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', minWidth: '190px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
                            {school.keyPersonName || '-'}
                          </div>
                          {hasKpPhone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '4px' }}>
                              <a 
                                href={`tel:${cleanPhoneForDial(school.keyPersonPhone)}`}
                                style={{ 
                                  backgroundColor: '#0284c7', 
                                  color: '#ffffff', 
                                  padding: '4px 8px', 
                                  borderRadius: '6px', 
                                  textDecoration: 'none', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px', 
                                  fontWeight: 600, 
                                  fontSize: '0.78rem' 
                                }}
                              >
                                <Phone size={12} /> {school.keyPersonPhone}
                              </a>
                              <a 
                                href={`https://wa.me/${cleanPhoneForWa(school.keyPersonPhone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  backgroundColor: '#25d366', 
                                  color: '#ffffff', 
                                  padding: '4px 6px', 
                                  borderRadius: '6px', 
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </a>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
                          )}
                        </td>

                        {/* 5. Last Remark */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', minWidth: '200px' }}>
                          {lastRemark ? (
                            <div style={{ 
                              backgroundColor: '#fefce8', 
                              border: '1px solid #fef08a', 
                              borderRadius: '6px', 
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.8rem'
                            }}>
                              <div style={{ color: '#713f12', fontWeight: 500, lineHeight: 1.3 }}>
                                💬 &ldquo;{lastRemark.text}&rdquo;
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#a16207', marginTop: '2px' }}>
                                — {lastRemark.addedBy || 'Telecaller'}, {new Date(lastRemark.date).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No remarks yet</span>
                          )}
                        </td>

                        {/* 6. Action */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedSchool(school)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: remarksCount > 0 ? '1px solid #86efac' : '1px solid #cbd5e1',
                              backgroundColor: remarksCount > 0 ? '#f0fdf4' : '#ffffff',
                              color: remarksCount > 0 ? '#15803d' : '#334155',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                            }}
                          >
                            <MessageSquare size={14} />
                            {remarksCount > 0 ? `Remarks (${remarksCount})` : '+ Add'}
                          </button>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Remarks Modal */}
      <RemarksModal 
        isOpen={!!selectedSchool}
        onClose={() => setSelectedSchool(null)}
        title={selectedSchool?.value || ''}
        remarks={Array.isArray(selectedSchool?.remarks) ? selectedSchool.remarks : []}
        onSave={handleSaveRemarks}
      />
    </div>
  );
}
