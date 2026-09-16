'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditStudent() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    occupation: '',
    address: '',
    phone: '',
    whatsapp: '',
    group: '',
    visitNumber: '',
    schoolName: '',
    remarks: '',
    district: '',
    mandal: '',
    village: '',
    studyInterestedAt: '',
    ableToBearFee: '',
    schoolDistrict: '',
    schoolMandal: '',
    schoolVillage: '',
    doorstepCompleted: false,
  });

  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);

  useEffect(() => {
    fetchConfigs();
    fetchStudent();
  }, [studentId]);

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

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        const s = data.student;
        setFormData({
          studentName: s.studentName || '',
          fatherName: s.fatherName || '',
          occupation: s.occupation || '',
          address: s.address || '',
          phone: s.phone || '',
          whatsapp: s.whatsapp || '',
          group: s.group || '',
          visitNumber: s.visitNumber || '',
          schoolName: s.schoolName || '',
          remarks: s.remarks || '',
          district: s.district || '',
          mandal: s.mandal || '',
          village: s.village || '',
          studyInterestedAt: s.studyInterestedAt || '',
          ableToBearFee: s.ableToBearFee || '',
          schoolDistrict: '',
          schoolMandal: '',
          schoolVillage: '',
          doorstepCompleted: s.doorstepCompleted || false,
        });
        if (s.phone && s.phone === s.whatsapp) {
          setSameAsPhone(true);
        }
      } else {
        alert("Failed to load student details");
        router.back();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Reverse engineer school location for pre-filling dropdowns if possible when configs load
  useEffect(() => {
    if (configs.length > 0 && formData.schoolName && !formData.schoolVillage) {
      const schoolConfig = configs.find(c => c.type === 'SCHOOL' && c.value === formData.schoolName);
      if (schoolConfig && schoolConfig.parentId) {
        const villageConfig = configs.find(c => c.id === schoolConfig.parentId);
        if (villageConfig && villageConfig.parentId) {
          const mandalConfig = configs.find(c => c.id === villageConfig.parentId);
          if (mandalConfig) {
            setFormData(prev => ({
              ...prev,
              schoolVillage: villageConfig.id,
              schoolMandal: mandalConfig.id,
              schoolDistrict: mandalConfig.parentId || ''
            }));
          }
        }
      }
    }
  }, [configs, formData.schoolName]);

  const getByType = (type: string) => configs.filter(c => c.type === type);
  const getByParent = (type: string, parentId: string) => configs.filter(c => c.type === type && c.parentId === parentId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.phone || !formData.group) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    const submitData = {
      ...formData,
      whatsapp: sameAsPhone ? formData.phone : formData.whatsapp
    };

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert('Student updated successfully!');
        router.back();
      } else {
        alert(data.error || 'Failed to update student');
      }
    } catch (error) {
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn-icon" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <ArrowLeft />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Student</h1>
      </header>

      {loading ? (
        <p>Loading student data...</p>
      ) : (
        <form className="card" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="studentName">Student Name *</label>
            <input required type="text" id="studentName" name="studentName" className="form-control" value={formData.studentName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fatherName">Father's Name</label>
            <input type="text" id="fatherName" name="fatherName" className="form-control" value={formData.fatherName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="occupation">Occupation</label>
            <select id="occupation" name="occupation" className="form-control" value={formData.occupation} onChange={handleChange}>
              <option value="">Select Occupation</option>
              {getByType('OCCUPATION').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">Address</label>
            <textarea id="address" name="address" className="form-control" rows={2} value={formData.address} onChange={handleChange}></textarea>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number *</label>
            <input required type="tel" id="phone" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              WhatsApp Number
              <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'normal', cursor: 'pointer' }}>
                <input type="checkbox" checked={sameAsPhone} onChange={(e) => setSameAsPhone(e.target.checked)} style={{ margin: 0, cursor: 'pointer' }} />
                Same as Phone
              </label>
            </label>
            <input 
              type="tel" 
              id="whatsapp" 
              name="whatsapp" 
              className="form-control" 
              value={sameAsPhone ? formData.phone : formData.whatsapp} 
              onChange={handleChange} 
              disabled={sameAsPhone}
              style={sameAsPhone ? { backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' } : {}}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="group">Group Opting *</label>
            <select required id="group" name="group" className="form-control" value={formData.group} onChange={handleChange}>
              <option value="">Select Group</option>
              {getByType('GROUP').map(g => (
                <option key={g.id} value={g.value}>{g.value}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="district">District</label>
            <select id="district" name="district" className="form-control" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value, mandal: '', village: ''})}>
              <option value="">Select District</option>
              {getByType('DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          </div>

          {formData.district && (
            <div className="form-group">
              <label className="form-label" htmlFor="mandal">Mandal</label>
              <select id="mandal" name="mandal" className="form-control" value={formData.mandal} onChange={(e) => setFormData({...formData, mandal: e.target.value, village: ''})}>
                <option value="">Select Mandal</option>
                {getByParent('MANDAL', formData.district).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            </div>
          )}

          {formData.mandal && (
            <div className="form-group">
              <label className="form-label" htmlFor="village">Village</label>
              <select id="village" name="village" className="form-control" value={formData.village} onChange={handleChange}>
                <option value="">Select Village</option>
                {getByParent('VILLAGE', formData.mandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="visitNumber">Visit No.</label>
            <input type="text" id="visitNumber" name="visitNumber" className="form-control" value={formData.visitNumber} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">School Area (District) *</label>
            <select id="schoolDistrict" name="schoolDistrict" className="form-control" value={formData.schoolDistrict} onChange={(e) => setFormData({...formData, schoolDistrict: e.target.value, schoolMandal: '', schoolVillage: '', schoolName: ''})}>
              <option value="">Select School District</option>
              {getByType('DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          </div>

          {formData.schoolDistrict && (
            <div className="form-group">
              <label className="form-label">School Area (Mandal) *</label>
              <select id="schoolMandal" name="schoolMandal" className="form-control" value={formData.schoolMandal} onChange={(e) => setFormData({...formData, schoolMandal: e.target.value, schoolVillage: '', schoolName: ''})}>
                <option value="">Select School Mandal</option>
                {getByParent('MANDAL', formData.schoolDistrict).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            </div>
          )}

          {formData.schoolMandal && (
            <div className="form-group">
              <label className="form-label">School Area (Village) *</label>
              <select id="schoolVillage" name="schoolVillage" className="form-control" value={formData.schoolVillage} onChange={(e) => setFormData({...formData, schoolVillage: e.target.value, schoolName: ''})}>
                <option value="">Select School Village</option>
                {getByParent('VILLAGE', formData.schoolMandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            </div>
          )}

          {(formData.schoolVillage || formData.schoolName) && (
            <div className="form-group">
              <label className="form-label" htmlFor="schoolName">School Name</label>
              <select id="schoolName" name="schoolName" className="form-control" value={formData.schoolName} onChange={handleChange}>
                <option value="">Select School Name</option>
                {getByParent('SCHOOL', formData.schoolVillage).map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
                {!formData.schoolVillage && formData.schoolName && <option value={formData.schoolName}>{formData.schoolName}</option>}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="studyInterestedAt">Study Interested At</label>
            <select id="studyInterestedAt" name="studyInterestedAt" className="form-control" value={formData.studyInterestedAt} onChange={handleChange}>
              <option value="">Select Interest</option>
              {getByType('STUDY_INTEREST').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ableToBearFee">Able to Bear Fee?</label>
            <select id="ableToBearFee" name="ableToBearFee" className="form-control" value={formData.ableToBearFee} onChange={handleChange}>
              <option value="">Select option</option>
              {getByType('FEE_BEARABLE').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="remarks">Remarks</label>
            <textarea id="remarks" name="remarks" className="form-control" rows={3} value={formData.remarks} onChange={handleChange}></textarea>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
              <input 
                type="checkbox" 
                id="doorstepCompleted" 
                name="doorstepCompleted" 
                checked={formData.doorstepCompleted} 
                onChange={(e) => setFormData({...formData, doorstepCompleted: e.target.checked})} 
                style={{ width: '1.2rem', height: '1.2rem' }}
              />
              <label className="form-label" htmlFor="doorstepCompleted" style={{ marginBottom: 0, cursor: 'pointer' }}>
                Doorstep completed?
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={20} /> {saving ? 'Updating...' : 'Update Student'}
            </button>
            
            <button type="button" onClick={() => router.back()} className="btn btn-outline" style={{ border: 'none', color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
