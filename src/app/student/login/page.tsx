'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, User, Lock, ArrowRight, GraduationCap } from 'lucide-react';
import '../student.css';

export default function StudentLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/student/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        router.push('/student/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="student-auth-container">
      <div className="student-auth-card">
        <div className="student-auth-header">
          <div className="icon-wrapper">
            <GraduationCap size={40} color="#fff" />
          </div>
          <h2>Student Portal</h2>
          <p>Login to view your career guidance and reports</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="student-auth-form">
          <div className="input-group">
            <label htmlFor="phone">Phone Number (Registration ID)</label>
            <div className="input-with-icon">
              <User size={20} className="input-icon" />
              <input 
                type="tel" 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Enter your registered number"
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={20} className="input-icon" />
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password (Default: 123456 or your Phone Number)"
                required 
              />
            </div>
          </div>

          <button type="submit" className="student-btn-primary" disabled={isLoading}>
            {isLoading ? (
              <span className="loader"></span>
            ) : (
              <>
                Login <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="student-auth-footer">
          <p>Not registered yet?</p>
          <Link href="/student/register" className="register-link">
            Create an account
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
