'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, PlusCircle, Trash2, Edit, Download, X, Save, Search, MapPin, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ImpPersonReportModal from '@/components/ImpPersonReportModal';

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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string, employeeId: string} | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<KeyPerson | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: '',
    district: '',
    mandal: '',
    village: '',
    address: ''
  });

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
        setCurrentUser(data.currentUser || null);
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
      } else {
        alert('Failed to delete key person');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while deleting.');
    }
  };

  const resolveConfigName = (id: string | null) => {
    if (!id) return '';
    const config = configs.find(c => c.id === id || c.value === id);
    return config ? config.value : id;
  };

  const getByType = (type: string) => configs.filter(c => c.type === type).sort((a, b) => a.value.localeCompare(b.value));
  const getByParent = (type: string, parentId: string) => 
    configs.filter(c => c.type === type && (c.parentId === parentId || resolveConfigName(c.parentId) === resolveConfigName(parentId))).sort((a, b) => a.value.localeCompare(b.value));

  const handleOpenEdit = (kp: KeyPerson) => {
    setEditingPerson(kp);

    let dId = kp.district || '';
    let mId = kp.mandal || '';
    let vId = kp.village || '';

    const dConf = configs.find(c => c.type === 'DISTRICT' && (c.id === dId || c.value === dId));
    if (dConf) dId = dConf.id;

    const mConf = configs.find(c => c.type === 'MANDAL' && (c.id === mId || c.value === mId));
    if (mConf) {
      mId = mConf.id;
      if (!dId && mConf.parentId) dId = mConf.parentId;
    }

    const vConf = configs.find(c => c.type === 'VILLAGE' && (c.id === vId || c.value === vId));
    if (vConf) {
      vId = vConf.id;
      if (!mId && vConf.parentId) {
        mId = vConf.parentId;
        const parentM = configs.find(c => c.id === vConf.parentId);
        if (!dId && parentM?.parentId) dId = parentM.parentId;
      }
    }

    setFormData({
      name: kp.name || '',
      phone: kp.phone || '',
      designation: kp.designation || '',
      district: dId,
      mandal: mId,
      village: vId,
      address: kp.address || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDistrictChange = (dId: string) => {
    setFormData(prev => ({
      ...prev,
      district: dId,
      mandal: '',
      village: ''
    }));
  };

  const handleMandalChange = (mId: string) => {
    const mConf = configs.find(c => c.id === mId);
    setFormData(prev => ({
      ...prev,
      mandal: mId,
      village: '',
      district: mConf?.parentId || prev.district
    }));
  };

  const handleVillageChange = (vId: string) => {
    const vConf = configs.find(c => c.id === vId);
    let parentM = formData.mandal;
    let parentD = formData.district;
    if (vConf?.parentId) {
      parentM = vConf.parentId;
      const mConf = configs.find(c => c.id === vConf.parentId);
      if (mConf?.parentId) parentD = mConf.parentId;
    }
    setFormData(prev => ({
      ...prev,
      village: vId,
      mandal: parentM || prev.mandal,
      district: parentD || prev.district
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Name and Phone are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/key-persons/${editingPerson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.keyPerson) {
        setKeyPersons(prev => prev.map(kp => {
          if (kp.id === editingPerson.id) {
            return {
              ...kp,
              ...data.keyPerson,
              employee: data.keyPerson.employee || kp.employee
            };
          }
          return kp;
        }));
        setIsEditModalOpen(false);
        setEditingPerson(null);
      } else {
        alert(data.error || 'Failed to update key person');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const filteredKeyPersons = keyPersons.filter(kp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = kp.name.toLowerCase().includes(q);
    const phoneMatch = kp.phone.includes(q);
    const desMatch = (kp.designation || '').toLowerCase().includes(q);
    const addrMatch = (kp.address || '').toLowerCase().includes(q);
    const vMatch = resolveConfigName(kp.village).toLowerCase().includes(q);
    const mMatch = resolveConfigName(kp.mandal).toLowerCase().includes(q);
    const dMatch = resolveConfigName(kp.district).toLowerCase().includes(q);
    return nameMatch || phoneMatch || desMatch || addrMatch || vMatch || mMatch || dMatch;
  });

  return (
    <div className="container" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header className="app-header-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/employee" className="btn-icon" style={{ color: '#cbd5e1' }} title="Back to Dashboard">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Imp Persons</h1>
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#bfdbfe', textTransform: 'uppercase' }}>Private Admissions Contacts</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setIsReportModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', gap: '0.25rem', border: 'none', cursor: 'pointer' }}
          >
            <Download size={14} /> PDF
          </button>
          <Link href="/employee/key-persons/add" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', gap: '0.25rem' }}>
            <PlusCircle size={14} /> Add
          </Link>
        </div>
      </header>

      <div style={{ padding: '1rem' }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search name, phone, designation, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 2.4rem 0.65rem 2.4rem',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Loading...</p>
        ) : filteredKeyPersons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <p>{searchQuery ? 'No key persons match your search.' : 'No important persons found.'}</p>
            {!searchQuery && (
              <Link href="/employee/key-persons/add" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Add Imp Person</Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredKeyPersons.map(kp => (
              <div key={kp.id} className="card" style={{ padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>{kp.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <Phone size={14} /> {kp.phone}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <a 
                      href={`tel:${kp.phone}`} 
                      className="btn-icon" 
                      title="Call"
                      style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '50%', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                    >
                      <Phone size={16} />
                    </a>
                    <button 
                      onClick={() => handleOpenEdit(kp)} 
                      className="btn-icon" 
                      title="Edit Details"
                      style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '50%', padding: '0.5rem', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(kp.id)} 
                      className="btn-icon" 
                      title="Delete"
                      style={{ backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '50%', padding: '0.5rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    >
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

      {/* Edit Key Person Modal */}
      {isEditModalOpen && (
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
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.1rem 1.3rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit size={18} color="#38bdf8" />
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                  Edit Imp Person
                </h2>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingPerson(null); }}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Name *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Phone Number *
                </label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  placeholder="e.g. School Teacher, Tuition Centre, Principal"
                />
              </div>

              {/* Location Fields */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="#059669" /> Location Details
                </span>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    District
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="">Select District</option>
                    {getByType('DISTRICT').map(c => (
                      <option key={c.id} value={c.id}>{c.value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Mandal
                  </label>
                  <select
                    value={formData.mandal}
                    onChange={(e) => handleMandalChange(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="">Select Mandal</option>
                    {(formData.district 
                      ? getByParent('MANDAL', formData.district) 
                      : getByType('MANDAL')
                    ).map(c => (
                      <option key={c.id} value={c.id}>{c.value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Village
                  </label>
                  <select
                    value={formData.village}
                    onChange={(e) => handleVillageChange(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="">Select Village</option>
                    {(formData.mandal 
                      ? getByParent('VILLAGE', formData.mandal) 
                      : getByType('VILLAGE')
                    ).map(c => (
                      <option key={c.id} value={c.id}>{c.value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Landmark / Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                    placeholder="e.g. Near Temple, Main Road"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingPerson(null); }}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
      
      <ImpPersonReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        keyPersons={keyPersons}
        configs={configs}
        currentUser={currentUser}
      />
    </div>
  );
}

