'use server';

import { loginUser, logoutUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function register(formData: FormData) {
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  
  // Patient specific
  const dateOfBirth = formData.get('dateOfBirth') as string;
  const gender = formData.get('gender') as string;
  const medicalHistory = formData.get('medicalHistory') as string;

  if (!email || !name || !role) {
    return { error: 'Missing required fields' };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'User already exists' };
    }

    await prisma.user.create({
      data: {
        email,
        name,
        role,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        medicalHistory,
      },
    });

    // Auto login after register
    await loginUser(email);
    
  } catch (error) {
    console.error(error);
    return { error: 'Registration failed' };
  }

  if (role === 'DOCTOR') {
    redirect('/doctor/dashboard');
  } else {
    redirect('/patient/dashboard');
  }
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  
  if (!email) {
    return { error: 'Email is required' };
  }

  try {
    const user = await loginUser(email);
    if (user.role === 'DOCTOR') {
      redirect('/doctor/dashboard');
    } else {
      redirect('/patient/dashboard');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        throw error;
    }
    return { error: 'Login failed. User not found.' };
  }
}

export async function logout() {
  await logoutUser();
}
