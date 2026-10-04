'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, UserCheck, Phone, MessageSquare } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RemarksModal from '@/components/RemarksModal';

export default function TelecallerImpPersonsPage() {
  const [keyPersons, setKeyPersons] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');

  // Remarks Modal
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  useEffect(() => {
    fetchConfigs();
    fetchKeyPersons();
  }, [district, mandal, village, search]);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKeyPersons = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ limit: '100' });
      if (search) query.append('search', search);
      if (district) query.append('district', district);
      if (mandal) query.append('mandal', mandal);
      if (village) query.append('village', village);

      const res = await fetch(`/api/key-persons?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKeyPersons(data.keyPersons || []);
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

  const handleSaveRemarks = async (newRemarks: any[]) => {
    if (!selectedPerson) return;
    
    const res = await fetch(`/api/key-persons/${selectedPerson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        remarks: newRemarks 
      })
    });
    
    if (!res.ok) throw new Error('Failed to save');
    
    // Update local state
    setKeyPersons(keyPersons.map(p => p.id === selectedPerson.id ? { ...p, remarks: newRemarks } : p));
    setSelectedPerson({ ...selectedPerson, remarks: newRemarks });
  };

  return (
    <div className="container" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header className="app-header-dark" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/telecaller" className="btn-icon" style={{ color: '#cbd5e1' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Imp Persons</h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#bfdbfe' }}>Private Contacts Directory</p>
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
                placeholder="Search name or phone..."
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
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Loading contacts...</p>
        ) : keyPersons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <UserCheck size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No contacts found matching your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Showing {keyPersons.length} contacts</p>
            {keyPersons.map(person => {
              const remarksCount = Array.isArray(person.remarks) ? person.remarks.length : 0;
              
              return (
                <div key={person.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
                        {person.name}
                      </h3>
                      <div style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <a href={`tel:${person.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={14} /> {person.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                    {person.designation && (
                      <div><span style={{ fontWeight: 600, color: '#475569' }}>Designation:</span> {person.designation}</div>
                    )}
                    <div>
                      <span style={{ fontWeight: 600, color: '#475569' }}>Location:</span>{' '}
                      {[person.address, resolveName(person.village), resolveName(person.mandal), resolveName(person.district)].filter(Boolean).join(', ')}
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
                    <button 
                      onClick={() => setSelectedPerson(person)}
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
        isOpen={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
        title={selectedPerson?.name || ''}
        remarks={Array.isArray(selectedPerson?.remarks) ? selectedPerson.remarks : []}
        onSave={handleSaveRemarks}
      />
    </div>
  );
}
