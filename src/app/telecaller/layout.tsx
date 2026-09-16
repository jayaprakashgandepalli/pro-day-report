import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function TelecallerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'TELECALLER') {
    if (session?.role === 'ADMIN') redirect('/admin');
    if (session?.role === 'EMPLOYEE') redirect('/employee');
    redirect('/login');
  }

  return <>{children}</>;
}
