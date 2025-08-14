

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LessonPlan, CurriculumLevel, LessonDetailLevel, CreativityLevel, PromptMode } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set.");
  // Potentially throw an error or handle this state in the UI
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const LESSON_PLAN_INTERFACE_STRING = `
// Represents a single row in the procedure table from the new template
export interface ProcedureTableRow {
  time: string; // e.g., "5 min"
  stage: string; // e.g., "Warming up", "Install resources", "Assessment"
  procedure: string; // Contains the T./Ls. action lines, each on a new line
  interaction: string; // e.g., "T-Ls", "Individual work"
}

// The main LessonPlan type, redesigned to match the new user's template.
export interface LessonPlan {
  // --- Header Information ---
  school: string;
  teacher: string;
  level: string;
  sequence: string;
  section: string;
  numberOfLearners: string;
  session: string;
  sessionFocus: string;
  domain: string;
  targetedCompetency: string;
  sessionObjectives: string;
  subsidiaryObjective: string;
  anticipatedProblems: string;
  solutions: string;
  materials: string[]; // e.g., ["Whiteboard", "Markers", "Textbook"]
  crossCurricularCompetence: string;

  // --- Procedure Table ---
  procedureTable: ProcedureTableRow[];
}
`;


export const generateLessonPlanWithGemini = async (
  curriculum: CurriculumLevel,
  topicForAI: string, // This is the detailed instruction for the AI's focus
  customCurriculumContent: string | null,
  lessonDetailLevel: LessonDetailLevel,
  creativityLevel: CreativityLevel,
  selectedMaterials: string[],
  promptMode: PromptMode,
  customPrompt: string
): Promise<LessonPlan> => {

  const temperatureMap: Record<CreativityLevel, number> = {
    focused: 0.2,
    balanced: 0.5,
    creative: 0.9,
  };
  const temperature = temperatureMap[creativityLevel];

  const materialsInstruction = selectedMaterials.length > 0
    ? `Based on the curriculum document's "Resources" section for the relevant domain, list the required materials as an array of strings. You MUST prioritize and include items from the user's provided list if they are relevant to the lesson activities. User's available materials: [${selectedMaterials.map(m => `"${m}"`).join(', ')}].`
    : `Based on the curriculum document's "Resources" section for the relevant domain, suggest a list of required materials as an array of strings. If none are explicitly mentioned but are implied by the activities, suggest common classroom materials. If no materials are needed at all, return an empty array [].`;

  let userInstructions: string;

  if (promptMode === 'custom' && customPrompt.trim()) {
    userInstructions = `
      The user has provided a custom prompt. Generate a complete lesson plan based ONLY on these instructions, but ensure the final output strictly adheres to the JSON structure.
      --- CUSTOM PROMPT START ---
      ${customPrompt.trim()}
      --- CUSTOM PROMPT END ---
    `;
  } else {
    // Structured mode
    userInstructions = `
      **LESSON CONTEXT:**
      - Grade Level: "${curriculum}"
      - User Request: "${topicForAI}"
      - Requested Detail Level: "${lessonDetailLevel}". Adjust the length and depth of all text fields accordingly. 'Concise' should be brief. 'Detailed' should be very descriptive and elaborate.

      **PROVIDED CURRICULUM DOCUMENT:**
      --- START ---
      ${customCurriculumContent || 'No additional curriculum provided.'}
      --- END ---
    `;
  }

  const prompt = `
You are an expert curriculum designer for the Algerian primary school system. Your task is to create a highly detailed lesson plan based on a user's request.
The output MUST be a single, valid JSON object that strictly conforms to the following TypeScript interface. Do NOT include any text or markdown formatting before or after the JSON object.

\`\`\`typescript
${LESSON_PLAN_INTERFACE_STRING}
\`\`\`

**USER INSTRUCTIONS & CONTEXT:**
${userInstructions}

**INSTRUCTIONS FOR GENERATING THE JSON (Apply these rules to the user's instructions):**

1.  **Header Information:**
    *   'school', 'teacher', 'numberOfLearners': Use placeholders: "[School Name]", "[Teacher's Name]", "[Number]".
    *   'level': Use the provided Grade Level: "${curriculum}".
    *   'sequence', 'section', 'session': Extract these directly from the "User Request" if available in structured mode. If in custom mode, infer them from the context or use placeholders.
    *   'sessionFocus': Analyze the session name and curriculum to determine the main focus (e.g., 'Phonics', 'Handwriting', 'Vocabulary Building').
    *   'domain': Analyze the session name and curriculum to determine the primary domain (e.g., Oral comprehension, Oral production, Written comprehension, Written production).
    *   'targetedCompetency': Find the "Target competences" section in the curriculum and select the most relevant one (e.g., "Interact / Interpret / Produce").
    *   'sessionObjectives': Formulate a full, clear sentence stating the main goal of the lesson.
    *   'subsidiaryObjective': Find a relevant, specific objective from the "Communicative objectives" within the corresponding domain and section of the curriculum document if available.
    *   'anticipatedProblems': Generate a concise, realistic problem learners might face (e.g., "Learners may struggle with the pronunciation of the new phoneme.").
    *   'solutions': Provide a brief, practical solution to the anticipated problem (e.g., "Use drilling and repetition, provide clear examples.").
    *   'materials': ${materialsInstruction}
    *   'crossCurricularCompetence': Carefully read the "Cross-curricular competences" section in the curriculum document if available. Summarize the most relevant points for this specific lesson into a single, well-written paragraph.

2.  'procedureTable' (Array of Stages):
    *   Create exactly three objects in this array, for the stages: "Warming up", "Install resources", and "Assessment".
    *   For each stage object, fill in the following:
        *   'time': Allocate a logical duration (e.g., "5 min", "20 min", "15 min").
        *   'stage': The name of the stage ("Warming up", "Install resources", "Assessment").
        *   'procedure': This is crucial. Provide a step-by-step description of teacher and learner actions. Each action MUST be a separate sentence on its own line. Each sentence MUST start with a hyphen '-', followed by 'T.' for a teacher action or 'Ls.' for a learner action, and MUST end with a period '.'.
        *   'interaction': Describe the classroom interaction (e.g., "T-Ls", "Ls-Ls", "Individual work", "Pair work").

Ensure the final output is ONLY the raw, valid JSON object.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: temperature, 
      },
    });

    let jsonStr = response.text.trim();
    // In case the model still wraps the output in markdown
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as LessonPlan;
    
    // Rigorous validation of the new structure
    if (!parsedData.level || !parsedData.sequence || !parsedData.session || !parsedData.procedureTable) {
        throw new Error("Generated lesson plan is missing one or more essential fields.");
    }
    if (!Array.isArray(parsedData.procedureTable) || parsedData.procedureTable.length === 0) {
        throw new Error("Procedure table must be a non-empty array.");
    }
    if (!parsedData.procedureTable[0].stage || !parsedData.procedureTable[0].procedure) {
        throw new Error("Procedure table rows are missing required fields.");
    }

    return parsedData;

  } catch (error) {
    console.error("Error generating lesson plan with Gemini:", error);
    if (error instanceof Error) {
        let userMessage = `Failed to generate or parse lesson plan.`;
        if (error.message.includes("SAFETY")) {
            userMessage += " The content might have triggered safety filters. Please try selecting a different topic or rephrasing if applicable."
        } else if (error.message.includes("JSON") || error.message.includes("missing one or more essential")) {
            userMessage += " The AI's response was not in the expected format or was incomplete. Please try again."
        } else {
            userMessage += ` Details: ${error.message}`;
        }
        throw new Error(userMessage);
    }
    throw new Error("An unknown error occurred while generating the lesson plan.");
  }
};


export const generateFlashcardImageWithGemini = async (prompt: string, aspectRatio: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: { 
        numberOfImages: 1, 
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio // Pass the aspectRatio string here
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image data received from API.");
    }
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
     if (error instanceof Error) {
        let userMessage = `Failed to generate image.`;
        if (error.message.includes("SAFETY")) { // This is a common cause for image generation failure
            userMessage += " The prompt might have triggered safety filters. Please try a different prompt."
        } else if (error.message.includes("No image data")) {
             userMessage += " The AI did not return image data. Please try again."
        }
        else {
            userMessage += ` Details: ${error.message}`;
        }
        throw new Error(userMessage);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
};
