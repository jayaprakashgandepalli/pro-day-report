'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  FileText,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';

export default function AgmSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [agmUser, setAgmUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setAgmUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', path: '/agm', icon: LayoutDashboard },
    { name: 'My Team', path: '/agm/team', icon: Users },
    { name: 'Team Students', path: '/agm/students', icon: GraduationCap },
    { name: 'Catchment Schools', path: '/agm/schools', icon: School },
    { name: 'Team Reports', path: '/agm/reports', icon: FileText },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .agm-mobile-header {
          display: none;
        }
        @media (max-width: 767px) {
          .agm-mobile-header {
            display: flex;
            padding: 1rem 1.25rem;
            background-color: #0F2B47;
            align-items: center;
            justify-content: space-between;
            color: #fff;
            position: sticky;
            top: 0;
            z-index: 30;
          }
          .agm-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px !important;
            height: 100vh !important;
            z-index: 50;
            transform: translateX(var(--sidebar-translate, -100%));
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex !important;
          }
          .agm-sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            z-index: 40;
            opacity: var(--overlay-opacity, 0);
            pointer-events: var(--overlay-pointer, none);
            transition: opacity 0.3s ease-in-out;
          }
        }
      `}} />

      {/* Mobile Top App Bar */}
      <div className="agm-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }}
          >
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              AGM
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                AGM Portal
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {agmUser?.name || 'Area Manager'}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      <div
        className="agm-sidebar-overlay"
        onClick={() => setIsOpen(false)}
        style={{
          '--overlay-opacity': isOpen ? 1 : 0,
          '--overlay-pointer': isOpen ? 'auto' : 'none'
        } as React.CSSProperties}
      />

      {/* Sidebar Container */}
      <aside
        className="agm-sidebar"
        style={{
          '--sidebar-translate': isOpen ? '0%' : '-100%',
          width: '260px',
          minWidth: '260px',
          height: '100vh',
          backgroundColor: '#0F2B47',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          borderRight: '1px solid #1e3a5f',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
        } as React.CSSProperties}
      >
        {/* Brand / Logo Area */}
        <div style={{
          padding: '1.5rem 1.25rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                AGM Portal
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#FBBF24',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  AREA MANAGER
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'none',
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div style={{
          margin: '1rem 1rem 0.5rem',
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#1E3A8A',
            color: '#60A5FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: '2px solid rgba(96, 165, 250, 0.3)'
          }}>
            {(agmUser?.name || 'A')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {agmUser?.name || 'Loading...'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>ID: {agmUser?.employeeId || '-'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '0.75rem 0.85rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem 0.5rem' }}>
            Operations & Oversight
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/agm' && pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      backgroundColor: isActive ? '#D97706' : 'transparent',
                      transition: 'all 0.15s ease-in-out',
                      boxShadow: isActive ? '0 4px 12px rgba(217, 119, 6, 0.35)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Icon size={18} style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={14} style={{ opacity: 0.8 }} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Area with Logout */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
        }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
