'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, FileText, Menu, UserPlus } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Do not show bottom nav on login page
  if (pathname === '/login') return null;

  return (
    <nav className="bottom-nav">
      <Link href="/employee" prefetch={false} className={`nav-item ${pathname === '/employee' ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link href="/employee/add" prefetch={false} className={`nav-item ${pathname === '/employee/add' ? 'active' : ''}`}>
        <UserPlus size={24} />
        <span>Add Student</span>
      </Link>
      <Link href="/reports/generate" prefetch={false} className={`nav-item ${pathname === '/reports/generate' ? 'active' : ''}`}>
        <FileText size={24} />
        <span>Day Report</span>
      </Link>
    </nav>
  );
}
