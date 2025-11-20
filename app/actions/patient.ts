'use server';

import { requireUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { processPatientAnswerFlow } from '@/genkit';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function submitDailyLog(formData: FormData) {
  const user = await requireUser();
  if (user.role !== 'PATIENT') throw new Error('Unauthorized');

  const carePlanId = formData.get('carePlanId') as string;
  const patientNote = formData.get('patientNote') as string;
  
  // Extract all question/answer pairs
  const responses: { question: string; answer: string }[] = [];
  
  // Iterate through FormData keys to find answers
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('answer_')) {
      const index = key.split('_')[1];
      const question = formData.get(`question_${index}`) as string;
      const answer = value as string;
      
      if (question && answer) {
        responses.push({ question, answer });
      }
    }
  }

  if (!carePlanId || responses.length === 0) {
    throw new Error('Missing required fields or no answers provided');
  }

  // 1. Call Genkit Flow for Extraction (Bulk)
  const extraction = await processPatientAnswerFlow({
    responses,
  });

  // Format raw input for display
  const formattedRawInput = responses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n');

  // 2. Save to Database
  await prisma.dailyLog.create({
    data: {
      carePlanId,
      patientRawInput: formattedRawInput,
      patientNote: patientNote || null,
      structuredData: JSON.stringify(extraction.structuredData),
      riskLevel: extraction.riskLevel,
      status: 'PENDING',
    },
  });

  redirect('/patient/dashboard?success=true');
}
