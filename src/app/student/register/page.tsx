'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Phone, School, ArrowRight, UserPlus, CheckCircle, BookOpen } from 'lucide-react';
import '../student.css';

export default function StudentRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentName: '',
    phone: '',
    password: '',
    schoolName: '',
    studentClass: '10th Class',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [preRegisteredMessage, setPreRegisteredMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/student/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      setIsLoading(false);

      if (res.ok) {
        setIsSuccess(true);
        if (data.isPreRegistered) {
          setPreRegisteredMessage(data.message);
        }
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="student-auth-container">
        <div className="student-auth-card" style={{ textAlign: 'center' }}>
          <div className="icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle size={40} color="#fff" />
          </div>
          <h2 style={{ color: '#ffffff' }}>Registration Successful!</h2>
          <p style={{ marginTop: '1rem', marginBottom: '2rem', lineHeight: '1.6', color: '#f1f5f9' }}>
            {preRegisteredMessage ? (
              <span style={{ fontSize: '1.1rem' }}>{preRegisteredMessage}</span>
            ) : (
              <>
                Your account has been created successfully. However, it is currently <strong style={{color: '#f59e0b'}}>PENDING</strong> approval from the Naaguru admin. 
                <br/><br/>
                You will receive a call from our team shortly for verification and approval. You will be able to login once your account is approved.
                <br/><br/>
                For immediate assistance, contact us at: <strong style={{color: '#10b981'}}>7013559518</strong>
              </>
            )}
          </p>
          <button onClick={() => router.push('/student/login')} className="student-btn-primary" style={{ width: '100%' }}>
            Go to Login
          </button>
        </div>
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
    );
  }

  return (
    <div className="student-auth-container">
      <div className="student-auth-card" style={{ maxWidth: '500px' }}>
        <div className="student-auth-header">
          <div className="icon-wrapper">
            <UserPlus size={40} color="#fff" />
          </div>
          <h2>Create Account</h2>
          <p>Join the student portal to get your career guidance</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="student-auth-form">
          <div className="input-group">
            <label htmlFor="studentName">Full Name</label>
            <div className="input-with-icon">
              <User size={20} className="input-icon" />
              <input 
                type="text" 
                id="studentName" 
                name="studentName"
                value={formData.studentName} 
                onChange={handleChange} 
                placeholder="Enter your full name"
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-with-icon">
              <Phone size={20} className="input-icon" />
              <input 
                type="tel" 
                id="phone" 
                name="phone"
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="10-digit mobile number"
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="studentClass">Select Class</label>
            <div className="input-with-icon">
              <BookOpen size={20} className="input-icon" />
              <select 
                id="studentClass" 
                name="studentClass"
                value={formData.studentClass} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                required 
              >
                <option value="10th Class" style={{ color: '#0f172a' }}>10th Class</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="schoolName">School / College Name</label>
            <div className="input-with-icon">
              <School size={20} className="input-icon" />
              <input 
                type="text" 
                id="schoolName" 
                name="schoolName"
                value={formData.schoolName} 
                onChange={handleChange} 
                placeholder="Where are you studying?"
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Create Password</label>
            <div className="input-with-icon">
              <Lock size={20} className="input-icon" />
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Set a strong password"
                required 
              />
            </div>
          </div>

          <button type="submit" className="student-btn-primary" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? (
              <span className="loader"></span>
            ) : (
              <>
                Register Account <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="student-auth-footer">
          <p>Already have an account?</p>
          <Link href="/student/login" className="register-link">
            Sign In here
          </Link>
        </div>
      </div>
      
      {/* Dynamic Background Elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>
    </div>
  );
}
