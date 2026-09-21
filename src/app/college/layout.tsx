import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import CollegeSidebar from './CollegeSidebar';

export default async function CollegeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'COLLEGE') {
    if (session?.role === 'ADMIN') redirect('/admin');
    if (session?.role === 'TELECALLER') redirect('/telecaller');
    if (session?.role === 'EMPLOYEE') redirect('/employee');
    redirect('/login');
  }

  return (
    <div className="admin-layout">
      <CollegeSidebar />
      <main style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
