import BottomNav from '@/components/BottomNav';
import EmployeeSidebar from '@/components/EmployeeSidebar';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'EMPLOYEE') {
    if (session?.role === 'ADMIN') redirect('/admin');
    if (session?.role === 'TELECALLER') redirect('/telecaller');
    redirect('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <EmployeeSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
