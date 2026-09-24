'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import logoImg from '../../../public/logo.png';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', // Deep Teal background
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '2.5rem 2rem',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <Image 
              src={logoImg} 
              alt="Naaguru Logo" 
              style={{ width: '240px', height: '80px', objectFit: 'contain', mixBlendMode: 'multiply' }}
            />
          </div>
          <p style={{ color: '#004d40', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Premium College Leads
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#b91c1c', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="employeeId" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#004d40' }}>Login ID</label>
            <input
              id="employeeId"
              type="text"
              placeholder="Enter your ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                backgroundColor: '#f8fafc'
              }}
              onFocus={e => { e.target.style.borderColor = '#004d40'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 77, 64, 0.1)'; e.target.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#f8fafc'; }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#004d40' }}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                backgroundColor: '#f8fafc'
              }}
              onFocus={e => { e.target.style.borderColor = '#004d40'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 77, 64, 0.1)'; e.target.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#f8fafc'; }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            style={{ 
              width: '100%', 
              padding: '0.875rem', 
              background: 'linear-gradient(135deg, #004d40 0%, #065f46 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '1rem', 
              fontWeight: 600, 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.1s, box-shadow 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0, 77, 64, 0.2), 0 2px 4px -1px rgba(0, 77, 64, 0.1)',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseOver={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseOut={e => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseDown={e => !isLoading && (e.currentTarget.style.transform = 'translateY(1px)')}
            onMouseUp={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Are you a Student?</p>
          <a
            href="/student/login"
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#f1f5f9',
              color: '#3b82f6',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#2563eb'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#3b82f6'; }}
          >
            Go to Student Portal
          </a>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', color: '#cbd5e1', fontSize: '0.75rem', zIndex: 10 }}>
        &copy; {new Date().getFullYear()} Naaguru. All rights reserved.
      </div>
    </div>
  );
}
