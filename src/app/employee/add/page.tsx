'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, User, Phone, GraduationCap, MapPin, Info, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AddStudentPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    studentName: '',
    gender: '',
    fatherName: '',
    occupation: '',
    phone: '',
    whatsapp: '',
    group: '',
    visitNumber: '',
    schoolName: '',
    schoolArea: '',
    remarks: '',
    district: '',
    mandal: '',
    village: '',
    studyInterestedAt: '',
    educationStage: '',
    ableToBearFee: '',
    schoolDistrict: '',
    schoolMandal: '',
    schoolVillage: '',
    doorstepCompleted: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccessScreen, setIsSuccessScreen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if(data.configs) setConfigs(data.configs);
      });
  }, []);

  const getByType = (t: string) => configs.filter(c => c.type === t);
  const getByParent = (t: string, parentId: string) => configs.filter(c => c.type === t && c.parentId === parentId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        address: '', // Blank since we removed the field but schema still allows it
        // Save the village as the schoolArea string since it's a string in the DB
        schoolArea: formData.schoolVillage || '',
        whatsapp: sameAsPhone ? formData.phone : formData.whatsapp,
      };
      
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg('Student added successfully.');
        if (addAnother) {
          setFormData({
            studentName: '',
            gender: '',
            fatherName: '',
            occupation: '',
            phone: '',
            whatsapp: '',
            group: '',
            visitNumber: '',
            schoolName: '',
            schoolArea: '',
            schoolDistrict: '',
            schoolMandal: '',
            schoolVillage: '',
            remarks: '',
            district: '',
            mandal: '',
            village: '',
            studyInterestedAt: '',
            educationStage: '',
            ableToBearFee: '',
            doorstepCompleted: false,
          });
          window.scrollTo(0, 0);
          setSuccessMsg('Student added successfully! You can add another.');
          setSameAsPhone(true);
        } else {
          setIsSuccessScreen(true);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save student.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" className="btn-icon">
          <ArrowLeft />
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Add Student</h1>
      </header>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {successMsg && !isSuccessScreen && (
        <div style={{ padding: '0.75rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {successMsg}
        </div>
      )}

      {isSuccessScreen ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>Success!</h2>
          <p style={{ color: '#475569', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
            <strong>{formData.studentName}</strong> has been successfully added to the database.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setFormData({
                  studentName: '', gender: '', fatherName: '', occupation: '', phone: '', whatsapp: '', group: '', visitNumber: '', schoolName: '', schoolArea: '', schoolDistrict: '', schoolMandal: '', schoolVillage: '', remarks: '', district: '', mandal: '', village: '', studyInterestedAt: '', educationStage: '', ableToBearFee: '', doorstepCompleted: false
                });
                setIsSuccessScreen(false);
                setSuccessMsg('');
                setSameAsPhone(true);
                window.scrollTo(0, 0);
              }}
            >
              Add Another Student
            </button>
            <Link href="/employee" className="btn btn-outline">
              Go to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => handleSave(e, false)}>
          {/* Section 1: Personal Details */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <User size={18} color="#3b82f6" /> Personal Details
            </h3>
            
            <div className="form-group">
              <label className="form-label" htmlFor="studentName">Student Name *</label>
              <input required type="text" id="studentName" name="studentName" className="form-control" value={formData.studentName} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['Male', 'Female', 'Other'].map(g => (
                  <label key={g} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', border: formData.gender === g ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: formData.gender === g ? '#eff6ff' : '#fff', color: formData.gender === g ? '#1e40af' : '#475569', fontWeight: formData.gender === g ? 600 : 400, transition: 'all 0.2s' }}>
                    <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleChange} style={{ display: 'none' }} />
                    {g}
                  </label>
                ))}
              </div>
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
          </div>

          {/* Section 2: Contact Information */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Phone size={18} color="#10b981" /> Contact Information
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number *</label>
              <input required type="tel" id="phone" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="whatsapp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>WhatsApp Number</span>
                <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'normal', cursor: 'pointer', color: '#3b82f6' }}>
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
                style={sameAsPhone ? { backgroundColor: '#f1f5f9', color: '#94a3b8' } : {}}
              />
            </div>
          </div>

          {/* Section 3: Academic Details */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <GraduationCap size={18} color="#8b5cf6" /> Academic Details
            </h3>

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
              <label className="form-label">Previous School (District) *</label>
              <select required id="schoolDistrict" name="schoolDistrict" className="form-control" value={formData.schoolDistrict} onChange={(e) => setFormData({...formData, schoolDistrict: e.target.value, schoolMandal: '', schoolVillage: '', schoolName: ''})}>
                <option value="">Select District</option>
                {getByType('DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            </div>

            {formData.schoolDistrict && (
              <div className="form-group">
                <label className="form-label">Previous School (Mandal) *</label>
                <select required id="schoolMandal" name="schoolMandal" className="form-control" value={formData.schoolMandal} onChange={(e) => setFormData({...formData, schoolMandal: e.target.value, schoolVillage: '', schoolName: ''})}>
                  <option value="">Select Mandal</option>
                  {getByParent('MANDAL', formData.schoolDistrict).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
                </select>
              </div>
            )}

            {formData.schoolMandal && (
              <div className="form-group">
                <label className="form-label">Previous School (Village) *</label>
                <select required id="schoolVillage" name="schoolVillage" className="form-control" value={formData.schoolVillage} onChange={(e) => setFormData({...formData, schoolVillage: e.target.value, schoolName: ''})}>
                  <option value="">Select Village</option>
                  {getByParent('VILLAGE', formData.schoolMandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
                </select>
              </div>
            )}

            {formData.schoolVillage && (
              <div className="form-group">
                <label className="form-label" htmlFor="schoolName">School Name</label>
                <select id="schoolName" name="schoolName" className="form-control" value={formData.schoolName} onChange={handleChange}>
                  <option value="">Select School</option>
                  {getByParent('SCHOOL', formData.schoolVillage).map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Section 4: Location & Status */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <MapPin size={18} color="#f59e0b" /> Location & Preferences
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="district">Residence District</label>
              <select id="district" name="district" className="form-control" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value, mandal: '', village: ''})}>
                <option value="">Select District</option>
                {getByType('DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            </div>

            {formData.district && (
              <div className="form-group">
                <label className="form-label" htmlFor="mandal">Residence Mandal</label>
                <select id="mandal" name="mandal" className="form-control" value={formData.mandal} onChange={(e) => setFormData({...formData, mandal: e.target.value, village: ''})}>
                  <option value="">Select Mandal</option>
                  {getByParent('MANDAL', formData.district).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
                </select>
              </div>
            )}

            {formData.mandal && (
              <div className="form-group">
                <label className="form-label" htmlFor="village">Residence Village</label>
                <select id="village" name="village" className="form-control" value={formData.village} onChange={handleChange}>
                  <option value="">Select Village</option>
                  {getByParent('VILLAGE', formData.mandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
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
              <label className="form-label" htmlFor="educationStage">Current Education Stage</label>
              <select id="educationStage" name="educationStage" className="form-control" value={formData.educationStage} onChange={handleChange}>
                <option value="">Select Stage</option>
                {getByType('EDUCATION_STAGE').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ableToBearFee">Able to Bear Fee?</label>
              <select id="ableToBearFee" name="ableToBearFee" className="form-control" value={formData.ableToBearFee} onChange={handleChange}>
                <option value="">Select Option</option>
                {getByType('FEE_BEARABLE').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="visitNumber">Visit No.</label>
              <input type="text" id="visitNumber" name="visitNumber" className="form-control" value={formData.visitNumber} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="remarks">Remarks</label>
              <textarea id="remarks" name="remarks" className="form-control" rows={3} value={formData.remarks} onChange={handleChange} placeholder="Any special notes?"></textarea>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem', background: formData.doorstepCompleted ? '#ecfdf5' : '#f8fafc', border: formData.doorstepCompleted ? '1px solid #10b981' : '1px solid #e2e8f0', borderRadius: '12px', transition: 'all 0.2s' }}>
              <input 
                type="checkbox" 
                id="doorstepCompleted" 
                name="doorstepCompleted" 
                checked={formData.doorstepCompleted} 
                onChange={(e) => setFormData({...formData, doorstepCompleted: e.target.checked})} 
                style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer', accentColor: '#10b981' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" htmlFor="doorstepCompleted" style={{ marginBottom: 0, cursor: 'pointer', color: formData.doorstepCompleted ? '#065f46' : '#334155', fontWeight: 600 }}>
                  Doorstep Visit Completed
                </label>
                <span style={{ fontSize: '0.8rem', color: formData.doorstepCompleted ? '#047857' : '#64748b' }}>Check this if the executive has visited the student's home.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading} onClick={(e) => handleSave(e, false)} style={{ padding: '1rem', fontSize: '1.1rem', borderRadius: '12px' }}>
              <Save size={20} /> {isLoading ? 'Saving...' : 'Save Student Details'}
            </button>
            
            <button type="button" className="btn btn-outline" disabled={isLoading} onClick={(e) => handleSave(e, true)} style={{ padding: '1rem', borderRadius: '12px', background: '#fff' }}>
              <Plus size={20} /> Save & Add Another
            </button>

            <Link href="/" className="btn btn-outline" style={{ border: 'none', color: '#64748b', marginTop: '0.5rem' }}>
              Cancel & Go Back
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
