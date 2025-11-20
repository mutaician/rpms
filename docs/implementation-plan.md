# Remote Patient Monitoring System - Implementation Plan

## 1. Project Overview
**Goal:** Build a web application where doctors can create AI-generated care plans from natural language instructions, and patients can submit daily updates which are structured by AI for doctor review.

**Core Philosophy:** "Simple UI, Heavy AI". The complexity is handled by Genkit flows, keeping the user interface minimal and easy to use.

## 2. Tech Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **AI/LLM:** Genkit with Google Vertex AI (Gemini Models)
- **Database:** PostgreSQL (Recommended) with Prisma ORM
- **Authentication:** Auth.js (NextAuth) v5
- **Runtime:** Bun

## 3. Architecture & Data Flow

### A. Database Schema (Conceptual)
We need to store users, plans, and daily logs.

1.  **User**
    -   `id`, `email`, `name`, `role` (DOCTOR | PATIENT)
2.  **CarePlan**
    -   `id`, `patientId`, `doctorId`
    -   `originalInstructions` (The doctor's raw text)
    -   `schedule` (JSON - The AI generated structure: frequency, duration, specific questions to ask)
    -   `status` (ACTIVE | COMPLETED)
    -   `createdAt`
3.  **DailyLog**
    -   `id`, `carePlanId`, `date`
    -   `patientRawInput` (Text - what the patient typed)
    -   `structuredData` (JSON - AI extracted vitals/symptoms)
    -   `riskLevel` (LOW | MEDIUM | HIGH - AI determined)
    -   `status` (PENDING | REVIEWED)

### B. Genkit Flows
We will define these in a dedicated Genkit entry point (e.g., `genkit/index.ts`).

#### Flow 1: `createFollowupPlanFlow`
-   **Trigger:** Doctor submits "Follow-up Template" form.
-   **Input:** `doctorInstructions` (string), `patientContext` (optional string).
-   **Model:** `gemini-2.5-pro` (Reasoning model for planning).
-   **Output Schema (JSON):**
    ```json
    {
      "summary": "Monitor BP and symptoms for 7 days",
      "durationDays": 7,
      "dailyTasks": [
        {
          "type": "vital_check",
          "label": "Measure Blood Pressure",
          "frequency": "2x daily"
        },
        {
          "type": "question",
          "text": "Do you have any dizziness or headaches?",
          "expectedAnswerType": "boolean_text"
        }
      ]
    }
    ```

#### Flow 2: `processPatientAnswerFlow`
-   **Trigger:** Patient submits daily update.
-   **Input:** `patientResponse` (string), `questionContext` (string).
-   **Model:** `gemini-2.5-flash` (Fast model for extraction).
-   **Output Schema (JSON):**
    ```json
    {
      "vitals": { "systolic": 120, "diastolic": 80 },
      "symptoms": ["dizziness"],
      "medicationTaken": true,
      "sentiment": "anxious",
      "urgentAttentionNeeded": true
    }
    ```

## 4. Frontend Structure (App Router)

-   `/app/login` - Simple login for Doctor/Patient.
-   `/app/doctor/dashboard` - List of patients & Triage Board (High risk items first).
-   `/app/doctor/patient/[id]` - Patient details & "Create Plan" interface.
-   `/app/patient/dashboard` - Daily To-Do list.
-   `/app/api/genkit` - Endpoint to expose Genkit flows (if needed for dev UI) or Server Actions to call flows directly.

## 5. Implementation Roadmap

### Phase 1: Setup & Infrastructure
1.  **Database Setup:** Initialize Prisma with SQLite (for dev) or Postgres.
2.  **Auth Setup:** Configure Auth.js for simple email/password or magic links.
3.  **Genkit Config:** Set up `genkit/index.ts` and ensure `genkit start` works.

### Phase 2: The Doctor's Workflow (Plan Generation)
1.  Create the "Create Plan" UI.
2.  Implement `createFollowupPlanFlow` with a strong system prompt.
3.  Connect the UI to the Flow via a Server Action.
4.  Save the generated JSON to the `CarePlan` table.

### Phase 3: The Patient's Workflow (Data Collection)
1.  Create the Patient Dashboard (render the JSON plan as a UI).
2.  Create the Input Form for patients.
3.  Implement `processPatientAnswerFlow` to extract data from Swahili/English text.
4.  Save the result to `DailyLog`.

### Phase 4: Triage Dashboard
1.  Build the Doctor's view to show `DailyLog` data.
2.  Highlight logs where `urgentAttentionNeeded` is true.

## 6. Questions for You
1.  **Database:** Do you have a preference for the database? (I recommend starting with SQLite for simplicity, then moving to Postgres).
2.  **Auth:** Is a simple mock auth okay for now, or do you want real email integration immediately?
3.  **Language:** The plan mentions Swahili/Sheng. We should ensure the system prompt for the extraction flow explicitly handles these languages.

---
**Next Steps:**
If this plan looks good, I will start by setting up the **Database Schema** and **Genkit Configuration**.
