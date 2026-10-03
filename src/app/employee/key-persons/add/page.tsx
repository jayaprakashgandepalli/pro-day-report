'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

export default function AddKeyPerson() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: '',
    district: '',
    mandal: '',
    village: '',
    address: ''
  });
  const [configs, setConfigs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.configs) {
        setConfigs(data.configs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getByType = (type: string) => configs.filter(c => c.type === type);
  const getByParent = (type: string, parentId: string) => configs.filter(c => c.type === type && c.parentId === parentId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Name and Phone are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/key-persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/employee/key-persons');
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
        <button onClick={() => router.back()} className="btn-icon" style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Add Key Person</h1>
      </header>

      <form className="card" onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input required type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} placeholder="Enter name" />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input required type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />
        </div>

        <div className="form-group">
          <label className="form-label">Designation</label>
          <input type="text" name="designation" className="form-control" value={formData.designation} onChange={handleChange} placeholder="e.g. Principal, Private Agent" />
        </div>

        <div className="form-group">
          <label className="form-label">District</label>
          <select name="district" className="form-control" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value, mandal: '', village: ''})}>
            <option value="">Select District</option>
            {getByType('DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
          </select>
        </div>

        {formData.district && (
          <div className="form-group">
            <label className="form-label">Mandal</label>
            <select name="mandal" className="form-control" value={formData.mandal} onChange={(e) => setFormData({...formData, mandal: e.target.value, village: ''})}>
              <option value="">Select Mandal</option>
              {getByParent('MANDAL', formData.district).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          </div>
        )}

        {formData.mandal && (
          <div className="form-group">
            <label className="form-label">Village</label>
            <select name="village" className="form-control" value={formData.village} onChange={handleChange}>
              <option value="">Select Village</option>
              {getByParent('VILLAGE', formData.mandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          </div>
        )}

        {formData.village && (
          <div className="form-group">
            <label className="form-label">Landmark / Address</label>
            <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} placeholder="e.g. Near Temple, Main Road" />
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', padding: '0.875rem' }}>
            <Save size={20} /> {saving ? 'Saving...' : 'Save Imp Person'}
          </button>
        </div>
      </form>
    </div>
  );
}
