'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, GraduationCap, School, FileText } from 'lucide-react';

export default function AgmBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/agm', icon: LayoutDashboard },
    { name: 'My Team', path: '/agm/team', icon: Users },
    { name: 'Students', path: '/agm/students', icon: GraduationCap },
    { name: 'Schools', path: '/agm/schools', icon: School },
    { name: 'Reports', path: '/agm/reports', icon: FileText },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .agm-bottom-nav {
          display: none;
        }
        @media (max-width: 767px) {
          .agm-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 62px;
            background: #0F2B47;
            display: flex;
            justify-content: space-around;
            align-items: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
            z-index: 100;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .agm-nav-tab {
            display: flex;
            flex-direction: column;
            align-items: center;
            justifyContent: center;
            color: #94a3b8;
            font-size: 0.68rem;
            font-weight: 600;
            text-decoration: none;
            gap: 0.2rem;
            flex: 1;
            padding: 0.35rem 0;
            transition: all 0.15s ease;
          }
          .agm-nav-tab.active {
            color: #38bdf8;
            font-weight: 800;
          }
          .agm-nav-tab.active svg {
            color: #38bdf8;
            transform: scale(1.1);
          }
        }
      `}} />

      <nav className="agm-bottom-nav" aria-label="AGM Mobile Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/agm' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={false}
              className={`agm-nav-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
