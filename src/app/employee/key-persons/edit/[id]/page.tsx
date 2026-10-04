'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EditKeyPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigsAndPerson();
  }, [id]);

  const fetchConfigsAndPerson = async () => {
    try {
      setLoading(true);
      const [confRes, personRes] = await Promise.all([
        fetch('/api/config'),
        fetch(`/api/key-persons/${id}`)
      ]);

      let confList: any[] = [];
      if (confRes.ok) {
        const cData = await confRes.json();
        confList = cData.configs || [];
        setConfigs(confList);
      }

      if (personRes.ok) {
        const pData = await personRes.json();
        const kp = pData.keyPerson;
        if (kp) {
          let dId = kp.district || '';
          let mId = kp.mandal || '';
          let vId = kp.village || '';

          const dConf = confList.find(c => c.type === 'DISTRICT' && (c.id === dId || c.value === dId));
          if (dConf) dId = dConf.id;

          const mConf = confList.find(c => c.type === 'MANDAL' && (c.id === mId || c.value === mId));
          if (mConf) {
            mId = mConf.id;
            if (!dId && mConf.parentId) dId = mConf.parentId;
          }

          const vConf = confList.find(c => c.type === 'VILLAGE' && (c.id === vId || c.value === vId));
          if (vConf) {
            vId = vConf.id;
            if (!mId && vConf.parentId) {
              mId = vConf.parentId;
              const parentM = confList.find(c => c.id === vConf.parentId);
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
        }
      } else {
        alert('Could not load key person details.');
        router.push('/employee/key-persons');
      }
    } catch (e) {
      console.error(e);
      alert('Error loading details.');
    } finally {
      setLoading(false);
    }
  };

  const getByType = (type: string) => configs.filter(c => c.type === type).sort((a, b) => a.value.localeCompare(b.value));
  const getByParent = (type: string, parentId: string) => configs.filter(c => c.type === type && (c.parentId === parentId || c.parentId === configs.find(x => x.id === parentId)?.id)).sort((a, b) => a.value.localeCompare(b.value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Name and Phone are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/key-persons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/employee/key-persons');
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#2563eb' }} />
        <p>Loading person details...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
        <button onClick={() => router.back()} className="btn-icon" style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Edit Imp Person</h1>
      </header>

      <form className="card" onSubmit={handleSave} style={{ maxWidth: '600px', margin: '0 auto' }}>
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
          <input type="text" name="designation" className="form-control" value={formData.designation} onChange={handleChange} placeholder="e.g. Principal, School Teacher, Tuition Centre" />
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

        <div className="form-group">
          <label className="form-label">Landmark / Address</label>
          <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} placeholder="e.g. Near Temple, Main Road" />
        </div>

        <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary" style={{ flex: 1, padding: '0.875rem' }}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2, padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={20} /> {saving ? 'Saving...' : 'Update Imp Person'}
          </button>
        </div>
      </form>
    </div>
  );
}
