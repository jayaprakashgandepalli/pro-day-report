import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  } else if (session.role === 'TELECALLER') {
    redirect('/telecaller');
  } else {
    redirect('/employee');
  }
}
