Title - Remote Patient Monitoring System

The Platform: A simple web application where both the Doctor and the Patient log in.

### Step 1: The Doctor's "Follow-up Template" (Natural Language)

In your web app, the doctor logs in, selects a patient, and instead of a complex form, they see a simple text box labeled: "Describe the follow-up plan."

This is where the doctor writes a natural language instruction.

Doctor's Input: "Patient has hypertension. Needs to monitor BP 2x daily for 7 days. Must also report any dizziness or headaches. Patient must confirm they are taking their medication (Amlodipine 5mg) every morning."

The doctor hits "Generate Plan."

### Step 2: The "Heavy AI" (Part 1 - Genkit Generation Flow)
The web app sends the doctor's text to a Genkit flow you build (let's call it createFollowupPlanFlow).

This flow, using a Vertex AI (Gemini) model and a strong prompt, will:
Parse the doctor's natural language.
Understand the key goals
Generate a detailed, structured JSON schedule of questions.
The AI's JSON Output (which you save to your database):

The doctor gives a simple instruction, and the AI creates the entire multi-day care plan.

### Step 3: The Patient's Web App (Simple UI)
The patient logs into the same web app. They don't see the complex JSON. They see a simple "To-Do" list for the day. Having questions the patient is suposed to answer

They type their answer in a simple text box (in Swahili, English, or Sheng).

### Step 4: The "Heavy AI" (Part 2 - Genkit Extraction Flow)
Each time the patient submits an answer, the web app sends that text (and the question_id) to another Genkit flow (e.g., processPatientAnswerFlow).

This flow uses Vertex AI to perform structured data extraction:
AI's JSON Output (saved to your database):

This flow is crucial because it turns messy, human, Kenyan-context answers into clean data.

### Step 5: The Triage Dashboard (Doctor's View)
The doctor logs in and sees a dashboard. It's not a list of 100 patient chats. It's a triage board built from the structured data generated in Step 4.


The doctor can click on patient then prompt either "Prompt Urgent Revisit" or "further followup"