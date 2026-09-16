'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AddStudentPage() {
  const router = useRouter();
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
    schoolArea: '',
    remarks: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const groups = ['MPC', 'BiPC', 'MEC', 'CEC', 'Other'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg('Student added successfully.');
        if (addAnother) {
          setFormData({
            studentName: '',
            fatherName: '',
            occupation: '',
            address: '',
            phone: '',
            whatsapp: '',
            group: '',
            visitNumber: '',
            schoolName: '',
            schoolArea: '',
            remarks: '',
          });
          window.scrollTo(0, 0);
        } else {
          setTimeout(() => router.push('/reports/today'), 1000);
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

      {successMsg && (
        <div style={{ padding: '0.75rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {successMsg}
        </div>
      )}

      <form className="card" onSubmit={(e) => handleSave(e, false)}>
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
          <input type="text" id="occupation" name="occupation" className="form-control" value={formData.occupation} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="address">Address</label>
          <input type="text" id="address" name="address" className="form-control" value={formData.address} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">Phone Number *</label>
          <input required type="tel" id="phone" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="whatsapp">WhatsApp Number</label>
          <input type="tel" id="whatsapp" name="whatsapp" className="form-control" value={formData.whatsapp} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="group">Group Opting *</label>
          <select required id="group" name="group" className="form-control" value={formData.group} onChange={handleChange}>
            <option value="">Select Group</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="visitNumber">Visit No.</label>
          <input type="text" id="visitNumber" name="visitNumber" className="form-control" value={formData.visitNumber} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="schoolName">School Name</label>
          <input type="text" id="schoolName" name="schoolName" className="form-control" value={formData.schoolName} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="schoolArea">School Area</label>
          <input type="text" id="schoolArea" name="schoolArea" className="form-control" value={formData.schoolArea} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="remarks">Remarks</label>
          <textarea id="remarks" name="remarks" className="form-control" rows={3} value={formData.remarks} onChange={handleChange}></textarea>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            <Save size={20} /> Save Student
          </button>
          
          <button type="button" className="btn btn-outline" disabled={isLoading} onClick={(e) => handleSave(e, true)}>
            <Plus size={20} /> Save & Add Another
          </button>

          <Link href="/" className="btn btn-outline" style={{ border: 'none', color: 'var(--text-muted)' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
