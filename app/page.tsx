import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getSession();

  if (user) {
    if (user.role === 'DOCTOR') {
      redirect('/doctor/dashboard');
    } else {
      redirect('/patient/dashboard');
    }
  } else {
    redirect('/login');
  }
}
