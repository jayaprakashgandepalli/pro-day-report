'use client';
import { useState, useEffect } from 'react';
import { User, MapPin, Phone, GraduationCap, Users, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState({
    studentName: '',
    fatherName: '',
    phone: '',
    whatsapp: '',
    gender: '',
    occupation: '',
    group: '',
    schoolDistrict: '',
    schoolMandal: '',
    schoolVillage: '',
    schoolName: '',
    marks: '',
    district: '',
    mandal: '',
    village: '',
    address: '',
    studyInterestedAt: '',
    educationStage: '',
    ableToBearFee: '',
  });
  
  const [configs, setConfigs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch configs for dropdowns
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if(data.configs) setConfigs(data.configs);
      });

    // Fetch existing profile data
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/student/profile');
        const data = await res.json();
        if (data.student) {
          const loaded = {
            studentName: data.student.studentName || '',
            fatherName: data.student.fatherName || '',
            phone: data.student.phone || '',
            whatsapp: data.student.whatsapp || '',
            gender: data.student.gender || '',
            occupation: data.student.occupation || '',
            group: data.student.group || '',
            schoolName: data.student.schoolName || '',
            marks: data.student.marks || '',
            district: data.student.district || '',
            mandal: data.student.mandal || '',
            village: data.student.village || '',
            address: data.student.address || '',
            studyInterestedAt: data.student.studyInterestedAt || '',
            educationStage: data.student.educationStage || '',
            ableToBearFee: data.student.ableToBearFee || '',
          };
          setProfile(loaded as any);
          if (loaded.whatsapp !== loaded.phone && loaded.whatsapp) {
            setSameAsPhone(false);
          }
        }
      } catch (err) {
        setMessage({ text: 'Failed to load profile', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getByType = (t: string) => configs.filter(c => c.type === t);
  const getByParent = (t: string, parentId: string) => configs.filter(c => c.type === t && c.parentId === parentId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const payload = {
        ...profile,
        whatsapp: sameAsPhone ? profile.phone : profile.whatsapp,
      };

      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ text: 'Profile updated successfully! Redirecting to test...', type: 'success' });
        router.refresh();
        setTimeout(() => {
          router.push('/student/dashboard/test');
        }, 1500);
      } else {
        setMessage({ text: 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'An error occurred.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e1b4b', margin: '0 0 0.5rem 0' }}>My Profile</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>Update your complete details</p>
      </header>

      {message.text && (
        <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '2rem', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`}}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Section 1: Personal Details */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <User size={20} color="#6366f1" /> Personal Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Full Name *</label>
              <input type="text" name="studentName" value={profile.studentName} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Gender</label>
              <select name="gender" value={profile.gender} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Father's Name</label>
              <input type="text" name="fatherName" value={profile.fatherName} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Father's Occupation</label>
              <select name="occupation" value={profile.occupation} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
                <option value="">Select Occupation</option>
                {getByType('OCCUPATION').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <Phone size={20} color="#10b981" /> Contact Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Phone Number *</label>
              <input type="tel" name="phone" value={profile.phone} disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#94a3b8' }} />
              <small style={{ color: '#94a3b8' }}>Phone cannot be changed.</small>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 500, color: '#475569' }}>WhatsApp Number</label>
                <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3b82f6', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sameAsPhone} onChange={(e) => setSameAsPhone(e.target.checked)} style={{ cursor: 'pointer' }} />
                  Same as Phone
                </label>
              </div>
              <input 
                type="tel" name="whatsapp" 
                value={sameAsPhone ? profile.phone : profile.whatsapp} 
                onChange={handleChange} 
                disabled={sameAsPhone}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: sameAsPhone ? '#f8fafc' : 'white', color: sameAsPhone ? '#94a3b8' : 'inherit' }} 
              />
            </div>
          </div>
        </div>

        {/* Section 3: Academic Details */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <GraduationCap size={20} color="#8b5cf6" /> Academic Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Group Opting *</label>
              <select required name="group" value={profile.group} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
                <option value="">Select Group</option>
                {getByType('GROUP').map(g => <option key={g.id} value={g.value}>{g.value}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>School/College Name *</label>
              <input type="text" name="schoolName" value={profile.schoolName} onChange={handleChange} required placeholder="Enter your school name" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Marks / Grade / GPA</label>
              <input type="text" name="marks" value={profile.marks} onChange={handleChange} placeholder="e.g., 95%, 9.5" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>School District *</label>
              <select required name="schoolDistrict" value={profile.schoolDistrict} onChange={(e) => setProfile({...profile, schoolDistrict: e.target.value, schoolMandal: '', schoolVillage: '', schoolName: ''})} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="">Select District</option>
                {getByType('DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            </div>

            {profile.schoolDistrict && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>School Mandal *</label>
                <select required name="schoolMandal" value={profile.schoolMandal} onChange={(e) => setProfile({...profile, schoolMandal: e.target.value, schoolVillage: '', schoolName: ''})} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                  <option value="">Select Mandal</option>
                  {getByParent('MANDAL', profile.schoolDistrict).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
                </select>
              </div>
            )}

            {profile.schoolMandal && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>School Village *</label>
                <select required name="schoolVillage" value={profile.schoolVillage} onChange={(e) => setProfile({...profile, schoolVillage: e.target.value, schoolName: ''})} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                  <option value="">Select Village</option>
                  {getByParent('VILLAGE', profile.schoolMandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
                </select>
              </div>
            )}

            {profile.schoolVillage && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>School/College Name *</label>
                <select required name="schoolName" value={profile.schoolName} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                  <option value="">Select School</option>
                  {getByParent('SCHOOL', profile.schoolVillage).map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Location & Preferences */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <MapPin size={20} color="#f59e0b" /> Location & Preferences
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>District</label>
              <select name="district" value={profile.district} onChange={(e) => setProfile({...profile, district: e.target.value, mandal: '', village: ''})} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="">Select District</option>
                {getByType('DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            </div>
            {profile.district && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Mandal</label>
                <select name="mandal" value={profile.mandal} onChange={(e) => setProfile({...profile, mandal: e.target.value, village: ''})} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                  <option value="">Select Mandal</option>
                  {getByParent('MANDAL', profile.district).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
                </select>
              </div>
            )}
            {profile.mandal && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Village / City</label>
                <select name="village" value={profile.village} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                  <option value="">Select Village</option>
                  {getByParent('VILLAGE', profile.mandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Landmark / Address</label>
            <input type="text" name="address" value={profile.address} onChange={handleChange} placeholder="Enter your full address" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Study Interested At</label>
              <select name="studyInterestedAt" value={profile.studyInterestedAt} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="">Select Interest</option>
                {getByType('STUDY_INTEREST').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Education Stage</label>
              <select name="educationStage" value={profile.educationStage} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="">Select Stage</option>
                {getByType('EDUCATION_STAGE').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Able to Bear Fee?</label>
              <select name="ableToBearFee" value={profile.ableToBearFee} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="">Select Option</option>
                {getByType('FEE_BEARABLE').map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            type="submit" 
            disabled={isSaving}
            style={{ 
              background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', padding: '1rem 3rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)', transition: 'all 0.2s'
            }}
          >
            {isSaving ? 'Saving Changes...' : 'Save Complete Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
