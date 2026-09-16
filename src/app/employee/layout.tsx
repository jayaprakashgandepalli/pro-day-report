import BottomNav from '@/components/BottomNav';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function EmployeeLayout({
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
    <>
      <main>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
