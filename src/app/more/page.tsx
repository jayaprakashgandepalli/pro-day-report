'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield, Info } from 'lucide-react';

export default function MorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center' }}>Menu</h1>
      </header>

      {user && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
            <User size={32} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{user.name}</h2>
            <p className="text-muted" style={{ margin: 0 }}>ID: {user.employeeId}</p>
            <p className="badge badge-neutral" style={{ marginTop: '0.25rem' }}>{user.role}</p>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0.5rem' }}>
        {user?.role === 'ADMIN' && (
          <button 
            className="btn btn-outline" 
            style={{ border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, justifyContent: 'flex-start', color: 'var(--text-color)' }}
            onClick={() => router.push('/admin')}
          >
            <Shield size={20} className="text-muted" /> Admin Dashboard
          </button>
        )}
        <button 
          className="btn btn-outline" 
          style={{ border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, justifyContent: 'flex-start', color: 'var(--text-color)' }}
          onClick={() => alert('App version 1.0.0')}
        >
          <Info size={20} className="text-muted" /> About App
        </button>
        <button 
          className="btn btn-outline" 
          style={{ border: 'none', borderRadius: 0, justifyContent: 'flex-start', color: 'var(--danger)' }}
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOut size={20} /> {isLoading ? 'Logging out...' : 'Log Out'}
        </button>
      </div>
    </div>
  );
}
