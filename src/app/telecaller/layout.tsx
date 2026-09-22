import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import TelecallerSidebar from '@/components/TelecallerSidebar';
import TelecallerBottomNav from '@/components/TelecallerBottomNav';

export default async function TelecallerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'TELECALLER') {
    if (session?.role === 'ADMIN') redirect('/admin');
    if (session?.role === 'EMPLOYEE') redirect('/employee');
    if (session?.role === 'COLLEGE') redirect('/college');
    redirect('/login');
  }

  return (
    <div className="admin-layout">
      <TelecallerSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <TelecallerBottomNav />
      </div>
    </div>
  );
}
