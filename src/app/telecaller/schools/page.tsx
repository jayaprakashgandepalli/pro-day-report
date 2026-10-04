'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, School, Phone, MessageSquare } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RemarksModal from '@/components/RemarksModal';

export default function TelecallerSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');

  // Remarks Modal
  const [selectedSchool, setSelectedSchool] = useState<any>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
        
        // Filter out schools
        const allSchools = (data.configs || []).filter((c: any) => c.type === 'SCHOOL');
        setSchools(allSchools);
      }
    } catch (e) {
      console.error(e);
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

  const resolveName = (id: string | null) => {
    if (!id) return '';
    const config = configs.find(c => c.id === id);
    return config ? config.value : id;
  };

  // Find the hierarchy for a school to filter properly
  const getSchoolHierarchy = (schoolId: string) => {
    const school = configs.find(c => c.id === schoolId);
    if (!school) return { village: null, mandal: null, district: null };
    
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

  const filteredSchools = schools.filter(school => {
    const hier = getSchoolHierarchy(school.id);
    
    if (district && hier.district !== district) return false;
    if (mandal && hier.mandal !== mandal) return false;
    if (village && hier.village !== village) return false;
    
    if (search) {
      const q = search.toLowerCase();
      const matchName = school.value.toLowerCase().includes(q);
      const matchHmName = school.headmasterName?.toLowerCase().includes(q);
      const matchHmPhone = school.headmasterPhone?.toLowerCase().includes(q);
      const matchKpName = school.keyPersonName?.toLowerCase().includes(q);
      const matchKpPhone = school.keyPersonPhone?.toLowerCase().includes(q);
      
      return matchName || matchHmName || matchHmPhone || matchKpName || matchKpPhone;
    }
    
    return true;
  });

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

  return (
    <div className="container" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header className="app-header-dark" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/telecaller" className="btn-icon" style={{ color: '#cbd5e1' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>School Directory</h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#bfdbfe' }}>HM & Key Person Contacts</p>
        </div>
      </header>

      <div style={{ padding: '1rem' }}>
        {/* Search & Filters */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by school, HM, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <select className="form-control" value={district} onChange={e => { setDistrict(e.target.value); setMandal(''); setVillage(''); }}>
              <option value="">All Districts</option>
              {getOptions('DISTRICT').map(d => (
                <option key={d.id} value={d.id}>{d.value}</option>
              ))}
            </select>
            
            <select className="form-control" value={mandal} onChange={e => { setMandal(e.target.value); setVillage(''); }} disabled={!district}>
              <option value="">All Mandals</option>
              {getOptions('MANDAL', district).map(m => (
                <option key={m.id} value={m.id}>{m.value}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Loading schools...</p>
        ) : filteredSchools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <School size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No schools found matching your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Showing {filteredSchools.length} schools</p>
            {filteredSchools.map(school => {
              const hier = getSchoolHierarchy(school.id);
              const remarksCount = Array.isArray(school.remarks) ? school.remarks.length : 0;
              
              return (
                <div key={school.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
                        {school.value}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <School size={12} /> {hier.villageName}, {hier.mandalName}
                      </p>
                    </div>
                  </div>
                  
                  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Headmaster</h4>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>{school.headmasterName || 'N/A'}</div>
                      {school.headmasterPhone && (
                        <a href={`tel:${school.headmasterPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          <Phone size={12} /> {school.headmasterPhone}
                        </a>
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Person</h4>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>{school.keyPersonName || 'N/A'}</div>
                      {school.keyPersonPhone && (
                        <a href={`tel:${school.keyPersonPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          <Phone size={12} /> {school.keyPersonPhone}
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
                    <button 
                      onClick={() => setSelectedSchool(school)}
                      className="btn" 
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                    >
                      <MessageSquare size={16} /> 
                      {remarksCount > 0 ? `Remarks (${remarksCount})` : 'Add Remarks'}
                    </button>
                  </div>
                </div>
              );
            })}
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
