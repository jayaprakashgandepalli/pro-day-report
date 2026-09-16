'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, FileText, Menu } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Do not show bottom nav on login page
  if (pathname === '/login') return null;

  return (
    <nav className="bottom-nav">
      <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link href="/students" className={`nav-item ${pathname === '/students' ? 'active' : ''}`}>
        <Users size={24} />
        <span>Students</span>
      </Link>
      <Link href="/reports" className={`nav-item ${pathname === '/reports' ? 'active' : ''}`}>
        <FileText size={24} />
        <span>Reports</span>
      </Link>
      <Link href="/more" className={`nav-item ${pathname === '/more' ? 'active' : ''}`}>
        <Menu size={24} />
        <span>More</span>
      </Link>
    </nav>
  );
}
