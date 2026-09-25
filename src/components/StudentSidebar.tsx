'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, Home, Compass, BookOpen, Menu, X, Settings, Map, Library, MessageCircle } from 'lucide-react';

export default function StudentSidebar({ sessionName }: { sessionName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/student/login'; // Force a full page reload to clear cache
  };

  return (
    <>
      {/* Mobile Top Bar with Hamburger */}
      <div className="student-mobile-header" style={{ display: 'none', padding: '1rem', background: '#1e1b4b', color: 'white', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setIsOpen(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}>
            <Menu size={24} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Student Portal</h2>
        </div>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="student-drawer-overlay"
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={`student-sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={32} color="#a5b4fc" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: 'white' }}>{sessionName}</h2>
            <p style={{ fontSize: '0.875rem', color: '#a5b4fc', margin: 0 }}>Student</p>
          </div>
          <button 
            className="student-drawer-close"
            onClick={() => setIsOpen(false)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}
          >
            <X size={24} />
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link 
                href="/student/dashboard" 
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 500,
                  background: pathname === '/student/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: pathname === '/student/dashboard' ? 'white' : '#cbd5e1'
                }}>
                <Home size={20} color={pathname === '/student/dashboard' ? '#a855f7' : '#cbd5e1'} /> Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/student/dashboard/test" 
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s',
                  background: pathname.includes('/student/dashboard/test') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: pathname.includes('/student/dashboard/test') ? 'white' : '#cbd5e1'
                }}>
                <Compass size={20} color={pathname.includes('/student/dashboard/test') ? '#a855f7' : '#cbd5e1'} /> Career Test
              </Link>
            </li>
            <li>
              <Link 
                href="/student/dashboard/report" 
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s',
                  background: pathname.includes('/student/dashboard/report') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: pathname.includes('/student/dashboard/report') ? 'white' : '#cbd5e1'
                }}>
                <BookOpen size={20} color={pathname.includes('/student/dashboard/report') ? '#a855f7' : '#cbd5e1'} /> My Report
              </Link>
            </li>
            <li>
              <Link 
                href="/student/dashboard/career-guidance" 
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s',
                  background: pathname.includes('/student/dashboard/career-guidance') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: pathname.includes('/student/dashboard/career-guidance') ? 'white' : '#cbd5e1'
                }}>
                <Map size={20} color={pathname.includes('/student/dashboard/career-guidance') ? '#a855f7' : '#cbd5e1'} /> Career Pathways
              </Link>
            </li>
            <li>
              <Link 
                href="/student/dashboard/resources" 
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s',
                  background: pathname.includes('/student/dashboard/resources') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: pathname.includes('/student/dashboard/resources') ? 'white' : '#cbd5e1'
                }}>
                <Library size={20} color={pathname.includes('/student/dashboard/resources') ? '#a855f7' : '#cbd5e1'} /> Resources
              </Link>
            </li>
            <li>
              <Link 
                href="/student/dashboard/ask-expert" 
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s',
                  background: pathname.includes('/student/dashboard/ask-expert') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: pathname.includes('/student/dashboard/ask-expert') ? 'white' : '#cbd5e1'
                }}>
                <MessageCircle size={20} color={pathname.includes('/student/dashboard/ask-expert') ? '#a855f7' : '#cbd5e1'} /> Ask an Expert
              </Link>
            </li>
            <li>
              <Link 
                href="/student/dashboard/profile" 
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s',
                  background: pathname.includes('/student/dashboard/profile') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: pathname.includes('/student/dashboard/profile') ? 'white' : '#cbd5e1'
                }}>
                <Settings size={20} color={pathname.includes('/student/dashboard/profile') ? '#a855f7' : '#cbd5e1'} /> My Profile
              </Link>
            </li>
          </ul>
        </nav>

        <button 
          onClick={handleLogout}
          style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 500 }}
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>
    </>
  );
}
