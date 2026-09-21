'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UserPlus, Users, CalendarDays, MapPin, Star, FileText, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmployeeSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { name: 'Dashboard', path: '/employee', icon: Home },
    { name: 'Add Student', path: '/employee/add', icon: UserPlus },
    { name: 'All Students', path: '/employee/students', icon: Users },
    { name: 'Follow-ups', path: '/employee/followups', icon: CalendarDays },
    { name: 'Village Visits', path: '/employee/village-visits', icon: MapPin },
    { name: 'Star Leads', path: '/employee/students?preset=prime', icon: Star },
    { name: 'Day Report (PDF)', path: '/reports/generate', icon: FileText },
  ];

  return (
    <aside className="desktop-only" style={{
      width: '260px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
    }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>Sri Vaatsalya</h2>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>Employee Portal</div>
      </div>

      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            // Precise active matching
            const isActive = pathname === item.path || 
                             (pathname.startsWith(item.path) && item.path !== '/employee') ||
                             (item.path.includes('preset=prime') && typeof window !== 'undefined' && window.location.search.includes('preset=prime'));
            
            return (
              <li key={item.path}>
                <Link 
                  href={item.path} 
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
    </aside>
  );
}
