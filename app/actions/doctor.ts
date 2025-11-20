'use server';

import { requireUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createFollowupPlanFlow } from '@/genkit';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function createCarePlan(formData: FormData) {
  const user = await requireUser();
  if (user.role !== 'DOCTOR') throw new Error('Unauthorized');

  const patientId = formData.get('patientId') as string;
  const instructions = formData.get('instructions') as string;

  if (!patientId || !instructions) {
    throw new Error('Missing required fields');
  }

  // Fetch patient details for context
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
  });

  if (!patient) throw new Error('Patient not found');

  const patientContext = `
    Name: ${patient.name}
    Age: ${patient.dateOfBirth ? new Date().getFullYear() - patient.dateOfBirth.getFullYear() : 'Unknown'}
    Gender: ${patient.gender || 'Unknown'}
    Medical History: ${patient.medicalHistory || 'None'}
  `;

  // 1. Call Genkit Flow
  const plan = await createFollowupPlanFlow({
    doctorInstructions: instructions,
    patientContext: patientContext.trim(),
  });

  // 2. Save to Database
  await prisma.carePlan.create({
    data: {
      patientId,
      doctorId: user.id,
      originalInstructions: instructions,
      schedule: JSON.stringify(plan),
      status: 'ACTIVE',
    },
  });

  redirect(`/doctor/patient/${patientId}`);
}

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  if (user.role !== 'DOCTOR') throw new Error('Unauthorized');

  const carePlanId = formData.get('carePlanId') as string;
  const content = formData.get('content') as string;
  const patientId = formData.get('patientId') as string;

  if (!carePlanId || !content) throw new Error('Missing fields');

  await prisma.message.create({
    data: {
      content,
      carePlanId,
      senderId: user.id,
    },
  });

  redirect(`/doctor/patient/${patientId}`);
}

export async function updatePlanStatus(formData: FormData) {
  const user = await requireUser();
  if (user.role !== 'DOCTOR') throw new Error('Unauthorized');

  const carePlanId = formData.get('carePlanId') as string;
  const status = formData.get('status') as string;
  const patientId = formData.get('patientId') as string;

  await prisma.carePlan.update({
    where: { id: carePlanId },
    data: { status },
  });

  redirect(`/doctor/patient/${patientId}`);
}
