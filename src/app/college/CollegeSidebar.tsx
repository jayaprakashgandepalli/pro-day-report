'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, LogOut, Menu, X, Calendar, LayoutDashboard } from 'lucide-react';

export default function CollegeSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [collegeName, setCollegeName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.name) {
          setCollegeName(data.user.name);
        }
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { name: 'Dashboard', path: '/college/dashboard', icon: LayoutDashboard },
    { name: 'Student Leads', path: '/college/students', icon: GraduationCap },
    { name: 'Follow-ups', path: '/college/followups', icon: Calendar },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .college-mobile-header {
          display: none;
        }
        @media (max-width: 767px) {
          .college-mobile-header {
            display: flex;
            padding: 1rem 1.5rem;
            background-color: #0f172a;
            align-items: center;
            gap: 1rem;
            color: #fff;
          }
          .admin-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px !important;
            height: 100vh !important;
            z-index: 50;
            transform: translateX(var(--sidebar-translate, -100%));
            transition: transform 0.3s ease-in-out;
            display: flex !important;
          }
          .admin-sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            z-index: 40;
            opacity: var(--overlay-opacity, 0);
            pointer-events: var(--overlay-pointer, none);
            transition: opacity 0.3s ease-in-out;
          }
        }
      `}} />

      {/* Mobile Header */}
      <div className="college-mobile-header">
        <button 
          onClick={() => setIsOpen(true)}
          style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
        >
          <Menu size={24} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
            {collegeName || 'College Portal'}
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>College Portal</p>
        </div>
      </div>

      {/* Overlay */}
      <div 
        className="admin-sidebar-overlay"
        onClick={() => setIsOpen(false)}
        style={{ 
          '--overlay-opacity': isOpen ? '1' : '0',
          '--overlay-pointer': isOpen ? 'auto' : 'none'
        } as React.CSSProperties}
      />

      <aside 
        className="admin-sidebar" 
        style={{ 
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
          '--sidebar-translate': isOpen ? '0' : '-100%'
        } as React.CSSProperties}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={collegeName || 'College Portal'}>
              {collegeName || 'College Portal'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>College Portal</p>
          </div>
          <button 
            className="mobile-only"
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }} className="admin-menu-wrapper">
          <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <li key={item.path}>
                    <Link 
                      href={item.path} 
                      onClick={() => setIsOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: isActive ? '#fff' : '#94a3b8',
                        backgroundColor: isActive ? '#1e293b' : 'transparent',
                        borderLeft: isActive ? '4px solid #38bdf8' : '4px solid transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Icon size={20} />
                      <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
            <button 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
