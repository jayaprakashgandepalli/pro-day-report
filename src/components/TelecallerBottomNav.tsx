'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, CalendarDays } from 'lucide-react';

export default function TelecallerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav mobile-only">
      <Link href="/telecaller" prefetch={false} className={`nav-item ${pathname === '/telecaller' ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link href="/telecaller/students" prefetch={false} className={`nav-item ${pathname === '/telecaller/students' ? 'active' : ''}`}>
        <Users size={24} />
        <span>Students</span>
      </Link>
      <Link href="/telecaller/followups" prefetch={false} className={`nav-item ${pathname === '/telecaller/followups' ? 'active' : ''}`}>
        <CalendarDays size={24} />
        <span>Follow-ups</span>
      </Link>
    </nav>
  );
}
