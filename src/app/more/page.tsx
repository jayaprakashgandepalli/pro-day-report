'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield, Info, X, BarChart2, ChevronRight } from 'lucide-react';

export default function MorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Trigger opening animation on mount
    requestAnimationFrame(() => {
      setIsOpen(true);
    });

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      router.back();
    }, 200);
  };

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
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(15, 23, 42, 0.65)', 
      backdropFilter: 'blur(4px)', 
      zIndex: 9999,
      opacity: isOpen && !isClosing ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '80%', maxWidth: '340px',
        backgroundColor: '#ffffff',
        boxShadow: '4px 0 24px rgba(15, 23, 42, 0.15)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen && !isClosing ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <header style={{ padding: '1.25rem 1.25rem 1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
          <button 
            onClick={handleClose} 
            style={{ width: '2.25rem', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>Menu</h1>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'N'}
            </div>
          </div>
        </header>
        
        <main style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem', overflowY: 'auto' }}>
          <section style={{ backgroundColor: '#f8fafc', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(226, 232, 240, 0.7)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '50%', backgroundColor: '#ecfeff', border: '1px solid rgba(207, 250, 254, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0d9488', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <User size={26} strokeWidth={1.8} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {user?.name || 'Loading...'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.125rem 0 0.375rem 0' }}>ID: {user?.employeeId || '...'}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#ffffff', color: '#475569', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
                {user?.role || 'EMPLOYEE'}
              </span>
            </div>
          </section>

          <section style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid rgba(226, 232, 240, 0.7)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            
            {user?.role === 'ADMIN' && (
              <div 
                onClick={() => router.push('/admin')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <Shield size={20} color="#64748b" strokeWidth={1.9} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Admin Dashboard</span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            )}

            {user?.role === 'TELECALLER' && (
              <div 
                onClick={() => router.push('/telecaller')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <Shield size={20} color="#64748b" strokeWidth={1.9} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Telecaller Dashboard</span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            )}

            <div 
              onClick={() => alert('App version 1.0.4')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <Info size={20} color="#64748b" strokeWidth={1.9} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>About App</span>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>

            <div 
              onClick={() => router.push('/analytics')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <BarChart2 size={20} color="#0d9488" strokeWidth={1.9} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Analytics</span>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>

            <button 
              onClick={handleLogout}
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <LogOut size={20} color="#ef4444" strokeWidth={1.9} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444' }}>{isLoading ? 'Logging out...' : 'Log Out'}</span>
              </div>
              <ChevronRight size={16} color="#fca5a5" />
            </button>
            
          </section>
          
          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', paddingBottom: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, margin: 0 }}>v1.0.4 - Field Portal</p>
          </div>
        </main>
      </div>
    </div>
  );
}
