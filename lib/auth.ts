import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SESSION_COOKIE_NAME = 'rpms_session';

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    return null;
  }
}

export async function requireUser() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function loginUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  return user;
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}
