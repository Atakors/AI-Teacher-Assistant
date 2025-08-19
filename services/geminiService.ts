
import { GoogleGenAI } from '@google/genai';
import { LessonPlan, CurriculumLevel, LessonDetailLevel, CreativityLevel, PromptMode, Exam, ExamSource, ExamDifficulty, QuestionType, FlashcardIdea } from '../types';

// Pre-flight check for the API key to provide a clearer, more immediate error message.
// A valid API key is a long string, so we check for a minimum length.
if (!process.env.API_KEY || process.env.API_KEY.length < 10) {
  // This is a critical error. The application cannot function without the API key.
  // The error message is directed to the developer/deployer of the application.
  throw new Error("CRITICAL: Gemini API Key is missing or invalid. Please ensure the API_KEY environment variable is set correctly in your deployment environment. A valid key is a long string of characters.");
}

// Initialize the Google GenAI client, ensuring the API key is read from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  topicForAI: string,
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
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: temperature,
            responseMimeType: "application/json",
        }
    });

    const generatedText = response.text;

    if (!generatedText) {
        throw new Error("The AI returned an empty response. This may be due to the safety policy or an internal error.");
    }
    
    // Clean potential markdown fences from the response
    let jsonStr = generatedText.trim();
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as LessonPlan;
    
    // Basic validation of the parsed structure
    if (!parsedData.level || !parsedData.sequence || !parsedData.session || !parsedData.procedureTable || !Array.isArray(parsedData.procedureTable)) {
        throw new Error("Generated lesson plan is missing one or more essential fields.");
    }

    return parsedData;

  } catch (error) {
    console.error("Error generating lesson plan with @google/genai:", error);
    if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid'))) {
      throw new Error("Configuration Error: The application's API key is invalid or missing. Please contact the administrator to configure the deployment environment variables.");
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to generate lesson plan. The AI service reported an error: ${errorMessage}`);
  }
};

const FLASHCARD_IDEAS_INTERFACE_STRING = `
export interface FlashcardIdea {
  term: string; // The specific word or concept for the flashcard (e.g., "Lion", "Apple", "Triangle").
  description: string; // A very brief, child-friendly description of the term.
}
`;

export const generateFlashcardIdeasWithGemini = async (topic: string): Promise<FlashcardIdea[]> => {
    const prompt = `
You are a creative assistant for a primary school teacher. Your task is to generate a list of 10 simple, concrete, and visually distinct flashcard ideas based on a given topic.
The output MUST be a single, valid JSON object that is an array of objects strictly conforming to the following TypeScript interface. Do NOT include any text or markdown formatting before or after the JSON object.

\`\`\`typescript
${FLASHCARD_IDEAS_INTERFACE_STRING}
\`\`\`

**Topic:** "${topic}"

**Instructions:**
1.  Generate exactly 10 ideas.
2.  Each 'term' should be a single, concrete noun or concept that is easy to illustrate.
3.  Each 'description' should be very simple, one short sentence, suitable for a young child.
4.  Ensure the ideas are diverse within the topic. For "Jungle Animals", don't list 10 types of monkeys.

Generate ONLY the raw, valid JSON array.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        });

        const generatedText = response.text;
        if (!generatedText) {
            throw new Error("The AI returned an empty response for flashcard ideas.");
        }

        let jsonStr = generatedText.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        
        const parsedData = JSON.parse(jsonStr) as FlashcardIdea[];
        if (!Array.isArray(parsedData) || parsedData.length === 0 || !parsedData[0].term || !parsedData[0].description) {
            throw new Error("Generated flashcard ideas have an invalid structure.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error generating flashcard ideas with @google/genai:", error);
        if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid'))) {
          throw new Error("Configuration Error: The application's API key is invalid or missing.");
        }
        const userMessage = error instanceof Error ? `Failed to generate ideas: ${error.message}` : "An unknown error occurred during idea generation.";
        throw new Error(userMessage);
    }
};

const EXAM_INTERFACE_STRING = `
export type QuestionType = 'Multiple Choice' | 'Short Answer' | 'Essay';

export interface ExamQuestion {
  questionText: string;
  options?: string[]; // Only for 'Multiple Choice'
}

export interface ExamSection {
  title: string;
  questions: ExamQuestion[];
  questionType: QuestionType;
}

export interface Exam {
  title: string;
  instructions: string;
  sections: ExamSection[];
  answerKey: string[][]; // A 2D array. First index for section, second for question.
}
`;

export const generateExamWithGemini = async (
    source: ExamSource,
    context: { curriculum: CurriculumLevel | null; sectionContent: string | null; topic: string; customPrompt: string },
    sections: { id: number; title: string; questionType: QuestionType; numberOfQuestions: number }[],
    difficulty: ExamDifficulty,
    title: string,
    instructions: string
): Promise<Exam> => {
    let sourceInstruction = '';
    if (source === 'curriculum') {
        sourceInstruction = `Base the exam on the following curriculum content for ${context.curriculum}:\n${context.sectionContent || 'No content provided.'}`;
    } else if (source === 'topic') {
        sourceInstruction = `Base the exam on the following topic: "${context.topic}" for ${context.curriculum} level students.`;
    } else { // custom
        sourceInstruction = `Base the exam on the following user prompt:\n${context.customPrompt}`;
    }

    const sectionsJSON = JSON.stringify(sections.map(({ id, ...rest }) => rest));

    const prompt = `
You are an expert educator creating an exam for Algerian primary school students.
The output MUST be a single, valid JSON object that strictly conforms to the following TypeScript interface. Do NOT include any text or markdown formatting before or after the JSON object.

\`\`\`typescript
${EXAM_INTERFACE_STRING}
\`\`\`

**INSTRUCTIONS FOR GENERATING THE EXAM:**

1.  **Source Material**: ${sourceInstruction}
2.  **Difficulty Level**: The overall difficulty of questions and vocabulary should be '${difficulty}'.
3.  **Exam Structure**: The exam must have sections matching this structure exactly: ${sectionsJSON}.
    *   For each section, generate the specified number of questions of the specified type.
    *   For 'Multiple Choice' questions, provide 4 plausible options.
    *   For 'Short Answer', the question should elicit a brief response (a few words to a sentence).
    *   For 'Essay', the question should require a paragraph-level response.
4.  **Title and Instructions**:
    *   If the user provided a title, use it: "${title}". Otherwise, create a suitable title based on the source material.
    *   If the user provided instructions, use them: "${instructions}". Otherwise, create clear and simple instructions for the students.
5.  **Answer Key**: This is critical. You MUST provide a complete answer key.
    *   It must be a 2D array of strings: \`string[][] \`.
    *   The outer array corresponds to the sections. The inner array corresponds to the questions in that section.
    *   For 'Multiple Choice', the answer must be the full text of the correct option (e.g., "Paris").
    *   For 'Short Answer', provide a concise, correct answer.
    *   For 'Essay', provide a model answer or a bulleted list of key points that should be included.
6.  **Content**: Ensure all questions are relevant to the source material, age-appropriate for primary school students, and grammatically correct.

Generate ONLY the raw, valid JSON object.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.4,
                responseMimeType: "application/json",
            }
        });

        const generatedText = response.text;
        if (!generatedText) {
            throw new Error("The AI returned an empty response.");
        }
        
        let jsonStr = generatedText.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        
        const parsedData = JSON.parse(jsonStr) as Exam;
        if (!parsedData.title || !parsedData.sections || !parsedData.answerKey || parsedData.sections.length !== parsedData.answerKey.length) {
            throw new Error("Generated exam is missing essential fields or has a structural mismatch.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error generating exam with @google/genai:", error);
        if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid'))) {
          throw new Error("Configuration Error: The application's API key is invalid or missing. Please contact the administrator to configure the deployment environment variables.");
        }
        const userMessage = error instanceof Error ? `Failed to generate exam: ${error.message}` : "An unknown error occurred during exam generation.";
        throw new Error(userMessage);
    }
};

export const generateFlashcardImageWithGemini = async (prompt: string, aspectRatio: string): Promise<string> => {
  console.log("Attempting to generate image with Imagen 3 SDK...");
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
      console.error("Imagen 3 API returned no image data. Response:", response);
      throw new Error("The AI service did not return any image data. This could be due to a safety filter or an internal API error.");
    }
    console.log("Successfully generated image with Imagen 3 SDK.");
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Detailed error in generateFlashcardImageWithGemini:", error);
    if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid'))) {
      throw new Error("Configuration Error: The application's API key is invalid or missing. Please contact the administrator to configure the deployment environment variables.");
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`SDK Error: Failed to generate image via @google/genai. Details: ${errorMessage}`);
  }
};