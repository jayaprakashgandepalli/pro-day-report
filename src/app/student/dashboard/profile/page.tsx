'use client';
import { useState, useEffect } from 'react';
import { User, Phone, School, Info, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState({
    studentName: '',
    phone: '',
    group: '',
    schoolName: '',
    fatherName: '',
    gender: '',
    schoolArea: '', // School Town/City
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  useEffect(() => {
    // Fetch existing profile data
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/student/profile');
        const data = await res.json();
        if (data.student) {
          // Check if village is a CUID (25 chars starting with c) to avoid showing weird IDs in text field
          let townValue = data.student.schoolArea || data.student.village || '';
          if (townValue.length >= 20 && townValue.startsWith('c')) {
            townValue = ''; // Clear it so they can enter the actual text name
          }

          setProfile({
            studentName: data.student.studentName || '',
            phone: data.student.phone || '',
            group: data.student.group || '',
            schoolName: data.student.schoolName || '',
            fatherName: data.student.fatherName || '',
            gender: data.student.gender || '',
            schoolArea: townValue,
          });
        }
      } catch (err) {
        setMessage({ text: 'Failed to load profile', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
        // Map frontend fields back to backend
        village: profile.schoolArea,
        schoolArea: profile.schoolArea,
      };

      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ text: 'Profile updated successfully! Redirecting...', type: 'success' });
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

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6366f1' }}>Loading your details...</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '3rem' }}>
      <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e1b4b', margin: '0 0 0.5rem 0' }}>Complete Your Profile</h1>
        <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
          Please verify your basic details to start taking tests.
        </p>
      </header>
      
      <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Info size={24} color="#4338ca" />
        <p style={{ margin: 0, color: '#4338ca', fontSize: '0.95rem', lineHeight: 1.5 }}>
          <strong>Trust Note:</strong> Your data is highly secure. We only collect basic information required to provide you with the right educational tests and career guidance.
        </p>
      </div>

      {message.text && (
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', marginBottom: '2rem', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Section: Basic Details */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            
            {/* Disabled Fields (From Registration) */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Student Name *</label>
              <input type="text" name="studentName" value={profile.studentName} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Phone Number *</label>
              <input type="tel" name="phone" value={profile.phone} disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Class / Group *</label>
              <input type="text" name="group" value={profile.group} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>School / College Name *</label>
              <input type="text" name="schoolName" value={profile.schoolName} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>

            {/* New Additional Fields */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Father's Name *</label>
              <input type="text" name="fatherName" value={profile.fatherName} onChange={handleChange} required placeholder="Enter Father's Name" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Gender *</label>
              <select name="gender" value={profile.gender} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>School Town/City *</label>
              <input type="text" name="schoolArea" value={profile.schoolArea} onChange={handleChange} required placeholder="e.g. Vijayawada, Guntur" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>

          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            type="submit" 
            disabled={isSaving}
            style={{ 
              background: 'linear-gradient(135deg, #6366f1, #4338ca)', color: 'white', padding: '1rem 3rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', transition: 'all 0.2s', width: '100%'
            }}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
