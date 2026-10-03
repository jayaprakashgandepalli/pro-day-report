'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, PlusCircle, Trash2, Edit } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

type KeyPerson = {
  id: string;
  name: string;
  phone: string;
  designation: string | null;
  district: string | null;
  mandal: string | null;
  village: string | null;
  address: string | null;
  employee?: { name: string } | null;
};

export default function KeyPersonsPage() {
  const [keyPersons, setKeyPersons] = useState<KeyPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<any[]>([]);

  useEffect(() => {
    fetchConfigs();
    fetchKeyPersons();
  }, []);

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
      const res = await fetch('/api/key-persons');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this key person?')) return;
    try {
      const res = await fetch(`/api/key-persons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKeyPersons(keyPersons.filter(kp => kp.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resolveConfigName = (id: string | null) => {
    if (!id) return '';
    const config = configs.find(c => c.id === id);
    return config ? config.value : id;
  };

  return (
    <div className="container" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header className="app-header-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/" className="btn-icon" style={{ color: '#cbd5e1' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Imp Persons</h1>
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#bfdbfe', textTransform: 'uppercase' }}>Private Admissions Contacts</p>
          </div>
        </div>
        <Link href="/employee/key-persons/add" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', gap: '0.25rem' }}>
          <PlusCircle size={14} /> Add
        </Link>
      </header>

      <div style={{ padding: '1rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Loading...</p>
        ) : keyPersons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <p>No important persons found.</p>
            <Link href="/employee/key-persons/add" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Add Imp Person</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {keyPersons.map(kp => (
              <div key={kp.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a' }}>{kp.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <Phone size={14} /> {kp.phone}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={`tel:${kp.phone}`} className="btn-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '50%', padding: '0.5rem' }}>
                      <Phone size={16} />
                    </a>
                    <button onClick={() => handleDelete(kp.id)} className="btn-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '50%', padding: '0.5rem', border: 'none' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                  {kp.designation && (
                    <div><span style={{ fontWeight: 600, color: '#475569' }}>Designation:</span> {kp.designation}</div>
                  )}
                  {(kp.district || kp.mandal || kp.village || kp.address) && (
                    <div>
                      <span style={{ fontWeight: 600, color: '#475569' }}>Location:</span>{' '}
                      {[kp.address, resolveConfigName(kp.village), resolveConfigName(kp.mandal), resolveConfigName(kp.district)].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div><span style={{ fontWeight: 600, color: '#475569' }}>Added By:</span> {kp.employee?.name || 'Unknown'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
