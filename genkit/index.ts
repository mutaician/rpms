import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with Google AI plugin
export const ai = genkit({
  plugins: [googleAI()],
});

// --- Flow 1: Create Follow-up Plan (Doctor's Workflow) ---
export const createFollowupPlanFlow = ai.defineFlow(
  {
    name: 'createFollowupPlanFlow',
    inputSchema: z.object({
      doctorInstructions: z.string().describe("The doctor's natural language instructions for the care plan."),
      patientContext: z.string().optional().describe("Optional context about the patient (e.g., age, condition)."),
    }),
    outputSchema: z.object({
      summary: z.string().describe("A brief summary of the plan for the patient."),
      durationDays: z.number().describe("The duration of the plan in days."),
      dailyTasks: z.array(
        z.object({
          type: z.enum(['vital_check', 'question', 'medication']).describe("The type of task."),
          label: z.string().describe("The label or question text to display to the patient."),
          frequency: z.string().describe("How often this task should be done (e.g., '2x daily', 'morning')."),
          expectedAnswerType: z.enum(['number', 'boolean', 'text']).optional().describe("The expected format of the patient's answer."),
        })
      ).describe("The list of daily tasks/questions for the patient."),
    }),
  },
  async (input) => {
    const { doctorInstructions, patientContext } = input;

    const prompt = `
      You are an expert medical assistant helping a doctor create a remote patient monitoring plan.
      
      Doctor's Instructions: "${doctorInstructions}"
      ${patientContext ? `Patient Context: "${patientContext}"` : ''}
      
      Your goal is to parse these instructions into a structured daily schedule for the patient.
      
      CRITICAL: You must output valid JSON that EXACTLY matches the following schema structure. Do not use snake_case. Use camelCase keys.
      
      Required Output Structure:
      {
        "summary": "string",
        "durationDays": number,
        "dailyTasks": [
          {
            "type": "vital_check" | "question" | "medication",
            "label": "string",
            "frequency": "string",
            "expectedAnswerType": "number" | "boolean" | "text"
          }
        ]
      }

      - Extract the duration of the plan.
      - Identify specific tasks the patient needs to do.
      - The 'summary' should be encouraging and clear for the patient.
    `;

    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-pro'), // Using a reasoning model for planning
      prompt: prompt,
      config: {
        temperature: 0.2, // Low temperature for structured output
      },
    });

    return response.output;
  }
);

// --- Flow 2: Process Patient Answer (Patient's Workflow) ---
export const processPatientAnswerFlow = ai.defineFlow(
  {
    name: 'processPatientAnswerFlow',
    inputSchema: z.object({
      responses: z.array(z.object({
        question: z.string(),
        answer: z.string()
      })).describe("List of questions and patient's answers."),
    }),
    outputSchema: z.object({
      structuredData: z.record(z.string(), z.any()).describe("Extracted data keyed by question or category."),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe("The AI-assessed risk level based on the answer."),
      sentiment: z.string().optional().describe("The patient's sentiment (e.g., 'anxious', 'calm')."),
      urgentAttentionNeeded: z.boolean().describe("Whether the doctor needs to see this immediately."),
    }),
  },
  async (input) => {
    const { responses } = input;

    const prompt = `
      You are a medical data extraction AI specialized in Kenyan context (Swahili, Sheng, English).
      
      Patient Responses:
      ${JSON.stringify(responses, null, 2)}
      
      Task:
      1. Understand the patient's answers, handling any code-switching (Swahili/English/Sheng).
      2. Extract relevant medical data (numbers, symptoms, confirmation) from ALL answers.
      3. Assess the OVERALL risk level based on all answers.
         - HIGH: Severe symptoms (chest pain, difficulty breathing), very high/low vitals.
         - MEDIUM: Moderate symptoms, slightly abnormal vitals.
         - LOW: Normal range, feeling good.
      4. Determine if urgent attention is needed.

      CRITICAL: You must output valid JSON that EXACTLY matches the following schema structure. Do not use snake_case. Use camelCase keys.

      Required Output Structure:
      {
        "structuredData": {
          "key": "value"
        },
        "riskLevel": "LOW" | "MEDIUM" | "HIGH",
        "sentiment": "string",
        "urgentAttentionNeeded": boolean
      }
    `;

    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'), // Fast model for extraction
      prompt: prompt,
    });

    return response.output;
  }
);
