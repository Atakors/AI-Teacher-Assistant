import { GoogleGenAI, Chat, GenerateContentResponse, Type } from '@google/genai';
import { LessonPlan, CurriculumLevel, LessonDetailLevel, CreativityLevel, PromptMode, Exam, ExamSource, ExamDifficulty, QuestionType, WordGameType, WordGameData, CrosswordData, ExamQuestion, ExamSection, MatchingPair, GuidedWritingNote } from '../types';

// --- API Key Management ---
const apiKeys = (process.env.API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
let currentApiKeyIndex = 0;

// Helper function for lazy initialization of the AI client with a specific key.
const getAiClient = (keyIndex: number): GoogleGenAI | null => {
  const apiKey = apiKeys[keyIndex];
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};


// Centralized error handler for Gemini API calls
const handleGeminiError = (error: unknown, context: string): Error => {
    console.error(`Error in ${context} with @google/genai:`, error);
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('quota')) {
            // Specific, identifiable error for quota issues
            return new Error("QUOTA_EXCEEDED");
        }
        if (message.includes('api_key_invalid') || message.includes('api key not valid')) {
            return new Error("Configuration Error: The application's API key is invalid or missing. Please contact the administrator to configure the deployment environment variables.");
        }
        return new Error(`The AI service reported an error: ${error.message}`);
    }
    return new Error("An unknown error occurred with the AI service.");
};

// Wrapper for API calls with retry logic
async function withApiKeyRotation<T>(apiCall: (client: GoogleGenAI) => Promise<T>): Promise<T> {
    if (apiKeys.length === 0) {
        throw new Error("Configuration Error: The application's API key is invalid or missing. Please configure the API_KEY environment variable.");
    }

    const initialKeyIndex = currentApiKeyIndex;
    let attempts = 0;

    while (attempts < apiKeys.length) {
        const client = getAiClient(currentApiKeyIndex);
        if (!client) {
            throw new Error("Failed to initialize AI client with a valid key.");
        }

        try {
            // Attempt the API call
            return await apiCall(client);
        } catch (error) {
            const processedError = handleGeminiError(error, "API call");
            if (processedError.message === "QUOTA_EXCEEDED") {
                console.warn(`API key at index ${currentApiKeyIndex} exhausted. Trying next key.`);
                currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
                attempts++;

                // If we've tried all keys and returned to where we started, fail.
                if (currentApiKeyIndex === initialKeyIndex && attempts > 0) {
                    console.error("All API keys have been tried and failed due to quota exhaustion.");
                    throw processedError; // Re-throw the original error after all retries
                }
            } else {
                // Not a quota error, throw it immediately
                throw processedError;
            }
        }
    }
    
    // This point is reached if all keys failed with quota errors
    console.error("All available API keys are exhausted.");
    throw new Error("QUOTA_EXCEEDED");
}


const getYear5StaticPlan = (sequenceTitle: string, sessionName: string, teacherName: string): LessonPlan | null => {
    if (sessionName.includes("I Get Ready")) {
        // --- SEQUENCE 1: I GET READY ---
        if (sequenceTitle.toLowerCase().includes('jobs')) {
            return {
                school: "", teacher: teacherName, level: "Primary Year 5", sequence: "SEQUENCE 1: Jobs, Occupations and Hobbies", section: "Jobs, Occupations and Hobbies", numberOfLearners: "", session: "I Get Ready", sessionFocus: "Initial Assessment", domain: "Oral & Written Comprehension",
                targetedCompetency: "Assess learners' ability to interpret and produce basic information about jobs, occupations, and hobbies.",
                sessionObjectives: "To diagnose learners' prior knowledge and skills related to jobs, occupations, hobbies, and places of work.",
                subsidiaryObjective: "Name/identify common jobs, hobbies, and related vocabulary.",
                anticipatedProblems: "Learners may struggle to recall specific vocabulary or form simple descriptive sentences.",
                solutions: "Encourage use of any known words and provide scaffolding through visual aids without giving direct answers.",
                materials: ["Worksheets", "Pictures of jobs and hobbies", "Audio player"],
                crossCurricularCompetence: "Learners will demonstrate initial understanding of oral messages and written texts related to jobs and hobbies, using their existing linguistic repertoire.",
                procedureTable: [
                    { time: "5 min", stage: "Warmer", procedure: "T. Greets learners and shows pictures of various occupations.\nT. Asks 'Who are these people?' to activate prior knowledge.", interaction: "T-Ls" },
                    { time: "10 min", stage: "Presentation", procedure: "T. Introduces the listening script context: 'This is my father Djaouad...'.\nT. Explains Task 1: 'Tick the right answer about Djamila's father.'\nT. Explains Task 2: 'Find Djamila's father from the pictures.'\nT. Introduces the reading text about 'Uncle Sofiane'.\nT. Explains the subsequent tasks: True/False, completing a form, and writing a paragraph about Sophia.", interaction: "T-Ls" },
                    { time: "25 min", stage: "Practice", procedure: "Ls. Listen to the script about Djaouad and complete Task 1 & 2.\nLs. Read the text about Sofiane and answer the True/False question.\nLs. Complete the form about Sofiane based on the text.\nLs. Use the information in the form about Sophia to write a short paragraph.\nT. Circulates and observes without providing answers.", interaction: "Individual work" },
                    { time: "5 min", stage: "Assessment", procedure: "T. Collects the worksheets for diagnostic evaluation.\nT. Makes notes of common difficulties observed.", interaction: "T-Ls" },
                    { time: "5 min", stage: "Exit Ticket", procedure: "T. Asks a quick question: 'Tell me one job and one hobby in English.'\nLs. Individually share one job or hobby they know.", interaction: "T-Ls" }
                ]
            };
        }
        // --- SEQUENCE 2: I GET READY ---
        if (sequenceTitle.toLowerCase().includes('hometown')) {
             return {
                school: "", teacher: teacherName, level: "Primary Year 5", sequence: "SEQUENCE 2: Hometown/City/Village", section: "Amenities, Directions & Signs", numberOfLearners: "", session: "I Get Ready", sessionFocus: "Initial Assessment", domain: "Oral & Written Comprehension",
                targetedCompetency: "Assess learners' ability to understand and use language related to places, directions, and signs.",
                sessionObjectives: "To diagnose learners' prior knowledge of vocabulary for amenities and understanding of simple directions.",
                subsidiaryObjective: "Identify amenities and follow basic directional instructions.",
                anticipatedProblems: "Learners may have difficulty understanding prepositions of place or directional phrases.",
                solutions: "Use gestures and maps to support comprehension. Encourage guessing from context.",
                materials: ["Worksheets", "Simple city maps", "Pictures of amenities"],
                crossCurricularCompetence: "Learners will attempt to interpret oral and written directions, relating them to spatial awareness.",
                procedureTable: [
                    { time: "5 min", stage: "Warmer", procedure: "T. Greets learners and asks 'What can you find in a city?' showing pictures of a park, school, etc.", interaction: "T-Ls" },
                    { time: "10 min", stage: "Presentation", procedure: "T. Introduces the listening script (Akram & Razane) and explains the 'True/False' and 'Locate the hotel' tasks.\nT. Introduces the reading text (Mohamed & Ania) and the questions about directions.\nT. Presents the final map-based conversation task (Meriem & Nazim).", interaction: "T-Ls" },
                    { time: "25 min", stage: "Practice", procedure: "Ls. Listen to the script and complete the 'True/False' and map tasks.\nLs. Read the text about the bookshop and answer the comprehension questions.\nLs. Use the map to complete the conversation about the toy shop.\nT. Observes learners' strategies for completing the tasks.", interaction: "Individual work" },
                    { time: "5 min", stage: "Assessment", procedure: "T. Collects all completed worksheets to assess learners' initial understanding.", interaction: "T-Ls" },
                    { time: "5 min", stage: "Exit Ticket", procedure: "T. Points to a place on a simple map and asks 'Is this the school or the park?'\nLs. Respond with their answer.", interaction: "T-Ls" }
                ]
            };
        }
        // --- SEQUENCE 3: I GET READY ---
        if (sequenceTitle.toLowerCase().includes('holidays')) {
            return {
                school: "", teacher: teacherName, level: "Primary Year 5", sequence: "SEQUENCE 3: Holidays and Travelling", section: "Holidays & Travelling", numberOfLearners: "", session: "I Get Ready", sessionFocus: "Initial Assessment", domain: "Oral & Written Comprehension",
                targetedCompetency: "Assess learners' ability to understand language related to holidays, seasons, and transportation.",
                sessionObjectives: "To diagnose learners' prior knowledge of vocabulary for travel, seasons, and activities.",
                subsidiaryObjective: "Identify means of transport and relate activities to seasons.",
                anticipatedProblems: "Learners may not know vocabulary for different seasons or means of transport.",
                solutions: "Use pictures and gestures to provide context without giving away answers.",
                materials: ["Worksheets", "Pictures of transport/seasons", "Charts"],
                crossCurricularCompetence: "Learners will engage with texts about personal experiences (holidays), connecting language to real-world concepts.",
                procedureTable: [
                    { time: "5 min", stage: "Warmer", procedure: "T. Greets learners and asks 'What do you do in the summer?' or 'Do you like to travel?'.", interaction: "T-Ls" },
                    { time: "10 min", stage: "Presentation", procedure: "T. Introduces the listening script (Sami & Asma) and the 'Tick the right answer' and 'Circle the transport' tasks.\nT. Presents the reading text about the winter holiday trip.\nT. Explains the question, the chart completion task, and the final paragraph writing task.", interaction: "T-Ls" },
                    { time: "25 min", stage: "Practice", procedure: "Ls. Listen to the script and complete the first two tasks.\nLs. Read the text about the winter trip and answer the question.\nLs. Complete the chart based on the reading text.\nLs. Use the final chart to write a short paragraph about the autumn activity.\nT. Monitors and notes areas of difficulty.", interaction: "Individual work" },
                    { time: "5 min", stage: "Assessment", procedure: "T. Collects all papers for diagnostic review of students' vocabulary and comprehension skills.", interaction: "T-Ls" },
                    { time: "5 min", stage: "Exit Ticket", procedure: "T. Shows a picture of a plane and a car and asks 'Which one is for the sky?'\nLs. Point to or name the correct vehicle.", interaction: "T-Ls" }
                ]
            };
        }

    } else if (sessionName.includes("I Check my Progress")) {
        // --- SEQUENCE 1: I CHECK MY PROGRESS ---
        if (sequenceTitle.toLowerCase().includes('jobs')) {
            return {
                school: "", teacher: teacherName, level: "Primary Year 5", sequence: "SEQUENCE 1: Jobs, Occupations and Hobbies", section: "Jobs, Occupations and Hobbies", numberOfLearners: "", session: "I Check my Progress", sessionFocus: "Correction and Review", domain: "Oral & Written Comprehension",
                targetedCompetency: "Review and consolidate understanding of vocabulary and structures related to jobs, occupations, and hobbies.",
                sessionObjectives: "To provide learners with the correct answers to the 'I Get Ready' assessment and clarify any misunderstandings.",
                subsidiaryObjective: "Correctly identify jobs, hobbies, and complete sentences and forms related to the topic.",
                anticipatedProblems: "Learners might be hesitant to share their mistakes.",
                solutions: "Create a positive and supportive atmosphere, emphasizing that mistakes are part of learning. Correct as a whole class.",
                materials: ["Completed worksheets from 'I Get Ready'", "Whiteboard", "Markers"],
                crossCurricularCompetence: "Learners will self-assess their initial understanding and correct their work, developing metacognitive skills.",
                procedureTable: [
                    { time: "5 min", stage: "Warmer", procedure: "T. Greets learners and reminds them of the assessment tasks from the 'I Get Ready' session.", interaction: "T-Ls" },
                    { time: "10 min", stage: "Presentation", procedure: "T. Displays the tasks from the previous session one by one.\nT. Provides the correct answer for each task clearly on the board.\n T. For Task 1, states 'The correct answer is job and hobbies'.\nT. For Task 2, points to the picture of the surgeon.\nT. Shows the correct answer for the True/False question ('False').\nT. Displays the completed form for Sofiane and the model paragraph for Sophia.", interaction: "T-Ls" },
                    { time: "25 min", stage: "Practice", procedure: "Ls. Look at their own worksheets.\nLs. Compare their answers with the correct ones shown by the teacher.\nLs. Use a different colored pen to make corrections on their work.\nT. Asks learners if they have any questions about the answers.", interaction: "Individual work" },
                    { time: "5 min", stage: "Assessment", procedure: "T. Asks comprehension check questions like 'So, what is Djaouad's job?' and 'What are his hobbies?'.\nLs. Respond orally to confirm their understanding.", interaction: "T-Ls" },
                    { time: "5 min", stage: "Exit Ticket", procedure: "T. Asks: 'Write one correct sentence about Sophia on your copybook.'\nLs. Write the sentence and show it to the teacher.", interaction: "T-Ls" }
                ]
            };
        }
         // --- SEQUENCE 2: I CHECK MY PROGRESS ---
        if (sequenceTitle.toLowerCase().includes('hometown')) {
             return {
                school: "", teacher: teacherName, level: "Primary Year 5", sequence: "SEQUENCE 2: Hometown/City/Village", section: "Amenities, Directions & Signs", numberOfLearners: "", session: "I Check my Progress", sessionFocus: "Correction and Review", domain: "Oral & Written Comprehension",
                targetedCompetency: "Review and consolidate understanding of language related to places and directions.",
                sessionObjectives: "To provide learners with the correct answers for the initial assessment and clarify directional language.",
                subsidiaryObjective: "Correctly answer questions about directions and complete dialogues based on maps.",
                anticipatedProblems: "Some learners may still be confused by prepositions like 'next to' and 'between'.",
                solutions: "Use physical objects in the classroom or draw simple diagrams on the board to demonstrate the meaning of prepositions.",
                materials: ["Completed worksheets", "Whiteboard", "Markers", "Maps from previous session"],
                crossCurricularCompetence: "Learners will correct their understanding of spatial and directional language, improving both linguistic and logical skills.",
                procedureTable: [
                    { time: "5 min", stage: "Warmer", procedure: "T. Greets learners and displays the map from the 'I Get Ready' session, asking them to recall the tasks.", interaction: "T-Ls" },
                    { time: "15 min", stage: "Presentation", procedure: "T. Presents the correct answer for each task.\nT. States the 'True/False' answer is 'True'.\nT. Clearly indicates the correct location of the hotel on the map (next to the park).\nT. Provides the correct answers for the bookshop questions ('Yes, she is' and 'Between the primary school and the cybercafé').\nT. Displays the completed conversation for the toy shop.", interaction: "T-Ls" },
                    { time: "20 min", stage: "Practice", procedure: "Ls. Review their own worksheets and make corrections.\nLs. Practice reading the completed conversation (Meriem & Nazim) in pairs.\nT. Listens to pairs and provides pronunciation feedback.", interaction: "Individual work / Pair work" },
                    { time: "5 min", stage: "Assessment", procedure: "T. Asks 'Where is the toy shop?' and 'Where is the bookshop?'.\nLs. Respond orally using the correct prepositions.", interaction: "T-Ls" },
                    { time: "5 min", stage: "Exit Ticket", procedure: "T. Asks learners to write one sentence describing a location on the map, e.g., 'The school is next to the police station'.\nLs. Write and show their sentence.", interaction: "T-Ls" }
                ]
            };
        }
         // --- SEQUENCE 3: I CHECK MY PROGRESS ---
        if (sequenceTitle.toLowerCase().includes('holidays')) {
            return {
                school: "", teacher: teacherName, level: "Primary Year 5", sequence: "SEQUENCE 3: Holidays and Travelling", section: "Holidays & Travelling", numberOfLearners: "", session: "I Check my Progress", sessionFocus: "Correction and Review", domain: "Oral & Written Comprehension",
                targetedCompetency: "Review and consolidate vocabulary for holidays, seasons, and transport.",
                sessionObjectives: "To provide correct answers for the initial assessment, ensuring learners can connect seasons, activities, and transport.",
                subsidiaryObjective: "Correctly fill in charts and write descriptive sentences based on provided information.",
                anticipatedProblems: "Learners might have forgotten some vocabulary since the initial assessment.",
                solutions: "Quickly drill the key vocabulary (seasons, transport) with pictures before starting the correction.",
                materials: ["Completed worksheets", "Whiteboard", "Markers"],
                crossCurricularCompetence: "Learners will reinforce their understanding of how to categorize information and structure a simple descriptive paragraph.",
                procedureTable: [
                    { time: "5 min", stage: "Warmer", procedure: "T. Greets learners and asks 'Do you remember the story about the winter holiday?'.", interaction: "T-Ls" },
                    { time: "15 min", stage: "Presentation", procedure: "T. Displays the correct answers for each task.\nT. Shows the correct ticked answer is 'Holidays and travelling'.\nT. Circles the 'car' and 'plane'.\nT. Gives the answer to the question ('No, it is not.').\nT. Displays the correctly completed charts on the board.\nT. Reads aloud the model paragraph about the autumn activity.", interaction: "T-Ls" },
                    { time: "20 min", stage: "Practice", procedure: "Ls. Check their worksheets and make corrections with a different color.\nLs. Read the model paragraph and compare it with their own writing.\nT. Asks learners to read parts of the corrected texts aloud.", interaction: "Individual work" },
                    { time: "5 min", stage: "Assessment", procedure: "T. Asks 'What do you do in winter?' and 'How do you travel to the mountains?'.\nLs. Respond orally based on the corrected texts.", interaction: "T-Ls" },
                    { time: "5 min", stage: "Exit Ticket", procedure: "T. Asks learners to write: 'In autumn, I _______'.\nLs. Complete the sentence and show the teacher.", interaction: "T-Ls" }
                ]
            };
        }
    }
    
    // If it's Year 5 but not a special session, this will be null and the AI will generate it.
    return null; 
};


const LESSON_PLAN_INTERFACE_STRING = `
// Represents a single row in the procedure table from the new template
export interface ProcedureTableRow {
  time: string; // e.g., "5 min"
  stage: string; // e.g., "Warmer", "Presentation", "Practice", "Assessment", "Exit Ticket"
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
  teacherName: string,
  curriculum: CurriculumLevel,
  topicForAI: string,
  customCurriculumContent: string | null,
  lessonDetailLevel: LessonDetailLevel,
  creativityLevel: CreativityLevel,
  selectedMaterials: string[],
  promptMode: PromptMode,
  customPrompt: string,
  sequenceTitle: string | null // Pass the full sequence title for context
): Promise<LessonPlan> => {

  let sessionName = '';
  if (promptMode === 'structured' && topicForAI) {
    const sessionMatch = topicForAI.match(/session: "([^"]+)"/);
    if (sessionMatch) sessionName = sessionMatch[1];
  }
  
  // Check for Year 5 special sessions first
  if (curriculum === CurriculumLevel.PRIMARY_5 && sequenceTitle && (sessionName.includes("I Get Ready") || sessionName.includes("I Check my Progress"))) {
      const staticPlan = getYear5StaticPlan(sequenceTitle, sessionName, teacherName);
      if (staticPlan) {
          console.log("Returning static plan for Year 5 special session.");
          return staticPlan;
      }
  }
  
  return withApiKeyRotation(async (ai) => {
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
    
    let procedureInstructions: string;

    if (curriculum === CurriculumLevel.PRIMARY_5) {
        procedureInstructions = `*   Create a procedure table with a logical lesson flow, including the following key stages in order.
      *   **Stage 1: Warmer**: A brief, engaging activity (e.g., a quick game, song, or question) to start the lesson. The stage name must be "Warmer".
      *   **Stage 2: Presentation**: This stage is for introducing new concepts. The stage name must be "Presentation".
      *   **Stage 3: Practice**: A distinct stage for learners to apply the new knowledge through activities. The stage name must be "Practice".
      *   **Stage 4: Assessment**: A stage to check for understanding of the lesson's objectives. The stage name must be "Assessment".
      *   **Stage 5: Exit Ticket**: A final, quick activity (1-2 questions) to wrap up the lesson and gauge individual comprehension. The stage name must be "Exit Ticket".`;
    } else { // For Year 3 and Year 4
        procedureInstructions = `*   Create a procedure table with a logical lesson flow, including the following four key stages in order. Do NOT include an 'Exit Ticket' stage.
      *   **Stage 1: Warmer**: A brief, engaging activity to start the lesson. The stage name must be "Warmer".
      *   **Stage 2: Presentation**: This stage is for introducing new concepts. The stage name must be "Presentation".
      *   **Stage 3: Practice**: A distinct stage for learners to apply the new knowledge. The stage name must be "Practice".
      *   **Stage 4: Assessment**: A stage to check for understanding of the lesson's objectives. The stage name must be "Assessment".`;
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
      *   'school', 'numberOfLearners': Use an empty string "".
      *   'teacher': Use the provided teacher's name: "${teacherName}".
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
      ${procedureInstructions}
      *   **Total Duration Constraint:** The sum of all 'time' allocations in the 'procedureTable' MUST equal exactly **60 minutes** for Primary Year 3 lessons and **45 minutes** for Primary Year 4 and Primary Year 5 lessons. Adjust the duration of each stage (Warmer, Presentation, Practice, Assessment, etc.) to meet this total.
      *   For each stage object, fill in the following:
          *   'time': Allocate a logical duration (e.g., "5 min", "15 min", "10 min").
          *   'stage': The name of the stage as described above.
          *   'procedure': Provide a step-by-step description of teacher and learner actions. Each action MUST be a separate sentence on its own line. Each sentence MUST start with either 'T.' for a teacher action or 'Ls.' for a learner action, and MUST end with a period '.'.
          *   'interaction': Describe the classroom interaction (e.g., "T-Ls", "Individual work", "Pair work").

  Ensure the final output is ONLY the raw, valid JSON object.
  `;
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
    
    let jsonStr = generatedText.trim();
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as LessonPlan;
    
    if (!parsedData.level || !parsedData.sequence || !parsedData.session || !parsedData.procedureTable || !Array.isArray(parsedData.procedureTable)) {
        throw new Error("Generated lesson plan is missing one or more essential fields.");
    }

    return parsedData;
  });
};

const EXAM_INTERFACE_STRING = `
export interface MatchingPair { prompt: string; match: string; }
export interface GuidedWritingNote { key: string; value: string; }

export interface ExamQuestion {
  questionText: string;
  options?: string[];
  matchingPairs?: MatchingPair[];
  wordBank?: string[];
  jumbledWords?: string[];
  guidedWritingNotes?: GuidedWritingNote[];
  tableToComplete?: { headers: string[]; rows: (string | null)[][]; };
}

export interface ExamSection {
  title: string;
  points?: number;
  instructions?: string;
  questions: ExamQuestion[];
  questionType: QuestionType;
}

export interface Exam {
  title: string;
  instructions: string;
  readingPassage?: string;
  sections: ExamSection[];
  answerKey: string[][];
}
`;

export const generateExamWithGemini = async (
    source: ExamSource,
    context: { 
        curriculum: CurriculumLevel | null; 
        sectionContent: string | null; 
        topic: string; 
        customPrompt: string;
        sequenceIds?: string[];
    },
    examConfig: {
        sections: { title: string; questionType: QuestionType; numberOfQuestions: number; points: number }[];
        difficulty: ExamDifficulty;
        title: string;
        instructions: string;
        includeReadingPassage: boolean;
        readingPassageTopic: string;
    }
): Promise<Exam> => {
  return withApiKeyRotation(async (ai) => {
    const { sections, difficulty, title, instructions, includeReadingPassage, readingPassageTopic } = examConfig;
    
    let sourceInstruction = '';
    if (source === 'curriculum') {
        sourceInstruction = `Base the exam on the following curriculum content for ${context.curriculum}:\n${context.sectionContent || 'No content provided.'}`;
    } else if (source === 'topic') {
        sourceInstruction = `Base the exam on the following topic: "${context.topic}" for ${context.curriculum} level students.`;
    } else { // custom
        sourceInstruction = `Base the exam on the following user prompt:\n${context.customPrompt}`;
    }

    let passageInstruction = 'Do NOT include a reading passage.';
    if (includeReadingPassage) {
        let wordCountInstruction = "The passage should be a suitable length for the specified curriculum level, generally between 20-40 words.";
        
        if (context.curriculum && context.sequenceIds && context.sequenceIds.length > 0) {
            const firstSequenceId = context.sequenceIds[0];
            
            if (context.curriculum === CurriculumLevel.PRIMARY_4) {
                if (firstSequenceId.includes('SEQ1') || firstSequenceId.includes('SEQ2')) {
                    wordCountInstruction = "The passage should be about 30 words long.";
                } else if (firstSequenceId.includes('SEQ3') || firstSequenceId.includes('SEQ4')) {
                    wordCountInstruction = "The passage should be about 35 words long.";
                } else if (firstSequenceId.includes('SEQ5')) {
                    wordCountInstruction = "The passage should be about 40 words long.";
                }
            } else if (context.curriculum === CurriculumLevel.PRIMARY_5) {
                if (firstSequenceId.includes('SEQ1')) {
                    wordCountInstruction = "The passage should be about 20 words long.";
                } else if (firstSequenceId.includes('SEQ2')) {
                    wordCountInstruction = "The passage should be about 30 words long.";
                } else if (firstSequenceId.includes('SEQ3')) {
                    wordCountInstruction = "The passage should be about 40 words long.";
                }
            }
        }

        passageInstruction = `
        **Reading Passage**: You MUST generate an age-appropriate reading passage.
        - If the user provided a topic for it ("${readingPassageTopic}"), base the passage on that topic.
        - Otherwise, base the passage on the main exam source material.
        - ${wordCountInstruction}
        - The reading comprehension questions MUST be based on this generated passage.
        `;
    }

    const sectionsJSON = JSON.stringify(sections);

    const prompt = `
  You are an expert educator creating an exam for Algerian primary school students.
  The output MUST be a single, valid JSON object that strictly conforms to the following TypeScript interface. Do NOT include any text or markdown formatting before or after the JSON object.

  \`\`\`typescript
  ${EXAM_INTERFACE_STRING}
  \`\`\`

  **INSTRUCTIONS FOR GENERATING THE EXAM:**

  1.  **Source Material**: ${sourceInstruction}
  2.  **Difficulty Level**: The overall difficulty of questions and vocabulary should be '${difficulty}'.
  3.  **Reading Passage**: ${passageInstruction}
  4.  **Exam Structure**: The exam must have sections matching this structure exactly: ${sectionsJSON}.
      *   For each section, generate the specified number of questions of the specified type.
      *   **Crucially, every question MUST have only one, single, unambiguously correct answer.**
      *   For 'Multiple Choice', provide 4 plausible options, where only one is correct and the others are clearly incorrect distractors.
      *   For 'Matching', create pairs of related items (e.g., word and definition).
      *   For 'Fill in the Blanks', ensure that only one word from the word bank can logically and grammatically complete the sentence. The question text MUST use "____" for blanks if a word bank is provided.
      *   For 'Complete the Table', create a table designed to extract information from the reading passage. The table should have headers and rows. Some cells in the rows should be pre-filled with prompts (e.g., a name), and the cells the student needs to fill must be set to \`null\`.
  5.  **Title and Instructions**:
      *   If the user provided a title, use it: "${title}". Otherwise, create a suitable title.
      *   If the user provided instructions, use them: "${instructions}". Otherwise, create clear instructions.
  6.  **Answer Key**: This is critical. You MUST provide a complete answer key as a 2D array of strings (\`string[][]\`).
      *   The outer array corresponds to sections, the inner to questions.
      *   For 'Matching', provide the correct pairs, e.g., "A - 3, B - 1, C - 2".
      *   For 'Fill in the Blanks', provide the completed sentence or just the missing words in order.

  Generate ONLY the raw, valid JSON object.
  `;

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
  });
};

export const generateFlashcardImageWithGemini = async (prompt: string, aspectRatio: string): Promise<string> => {
  return withApiKeyRotation(async (ai) => {
    console.log("Attempting to generate image with Imagen SDK...");
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '9:16',
        },
    });

    const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
      console.error("Imagen API returned no image data. Response:", response);
      throw new Error("The AI service did not return any image data. This could be due to a safety filter or an internal API error.");
    }
    console.log("Successfully generated image with Imagen SDK.");
    return `data:image/png;base64,${base64ImageBytes}`;
  });
};

export const generateWordGameWithGemini = async (
  gameType: WordGameType,
  level: CurriculumLevel,
  topic: string,
  count: number,
  gridSize: number = 12
): Promise<WordGameData> => {
  return withApiKeyRotation(async (ai) => {
    let responseSchema;
    let gameInstructions;

    switch (gameType) {
      case 'Riddle':
        gameInstructions = `Generate ${count} 'What am I?' riddles about '${topic}'. Each riddle should have 2-3 simple clues appropriate for a ${level} student.`;
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              clues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 2 to 3 simple clues." },
              answer: { type: Type.STRING, description: "The single-word answer to the riddle." }
            },
            required: ["clues", "answer"]
          }
        };
        break;
      case 'Word Scramble':
        gameInstructions = `Generate ${count} scrambled words (jumbles) based on the topic '${topic}'. The words should be appropriate for a ${level} student. Provide both the scrambled word and the correct answer.`;
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scrambled: { type: Type.STRING, description: "The scrambled word." },
              answer: { type: Type.STRING, description: "The correct, unscrambled word." }
            },
            required: ["scrambled", "answer"]
          }
        };
        break;
      case 'Sentence Builder':
        gameInstructions = `Generate ${count} jumbled sentences related to the topic '${topic}'. The sentences should be grammatically simple and appropriate for a ${level} student. Provide the jumbled words as an array and the correct sentence as a string.`;
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              jumbled: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of words in a jumbled order." },
              answer: { type: Type.STRING, description: "The correctly formed sentence." }
            },
            required: ["jumbled", "answer"]
          }
        };
        break;
      case 'Odd One Out':
        gameInstructions = `Generate ${count} 'Odd One Out' puzzles related to the topic '${topic}'. Each puzzle should have a group of 4 words where 3 belong to a clear category and one is the outlier. The vocabulary should be suitable for a ${level} student. Provide the list of words, the answer, and the category name.`;
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              words: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 words." },
              answer: { type: Type.STRING, description: "The word that is the odd one out." },
              category: { type: Type.STRING, description: "The category the other 3 words belong to." }
            },
            required: ["words", "answer", "category"]
          }
        };
        break;
      case 'Hidden Word':
          gameInstructions = `Generate a ${gridSize}x${gridSize} grid of letters for a word search puzzle about '${topic}'. The grid must contain ${count} hidden words related to the topic. Provide the 2D array for the grid and the list of hidden words.`;
          responseSchema = {
              type: Type.OBJECT,
              properties: {
                  grid: { 
                      type: Type.ARRAY, 
                      items: { type: Type.ARRAY, items: { type: Type.STRING } },
                      description: `A ${gridSize}x${gridSize} 2D array of single, uppercase letters.`
                  },
                  words: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "The list of words hidden in the grid."
                  }
              },
              required: ["grid", "words"]
          };
          break;
      case 'Crossword':
          gameInstructions = `Generate an interlocking crossword puzzle about '${topic}' suitable for a ${level} student. Generate approximately ${count} words. The grid should be as compact as possible.
        You must provide:
        1. The final grid as a 2D array of strings. Each string is a single uppercase letter. Use null for black/empty squares.
        2. A list of clues. For each clue, provide its number, direction ('Across' or 'Down'), the clue text, the answer word, and the 0-indexed starting row and column.`;
          responseSchema = {
              type: Type.OBJECT,
              properties: {
                grid: {
                  type: Type.ARRAY,
                  description: "The 2D crossword grid. Use single letters for answers and null for black squares.",
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                      nullable: true,
                    }
                  }
                },
                clues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      direction: { type: Type.STRING, enum: ['Across', 'Down'] },
                      clue: { type: Type.STRING },
                      answer: { type: Type.STRING },
                      row: { type: Type.INTEGER, description: "0-indexed starting row" },
                      col: { type: Type.INTEGER, description: "0-indexed starting column" }
                    },
                    required: ["number", "direction", "clue", "answer", "row", "col"]
                  }
                }
              },
              required: ["grid", "clues"]
          };
          break;
      default:
        throw new Error("Invalid game type specified.");
    }

    const prompt = `
      You are an educational content creator specializing in word games for primary school children.
      Your task is to generate a set of word games based on user specifications.
      The output MUST be a single, valid JSON object that strictly conforms to the provided response schema.
      Do NOT include any text or markdown formatting before or after the JSON object.

      **Game Request:**
      - Game Type: ${gameType}
      - Curriculum Level: ${level}
      - Topic: ${topic}
      - Number of items to generate: ${count}
      - Specific Instructions: ${gameInstructions}

      Generate ONLY the raw, valid JSON object.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const generatedText = response.text;
    if (!generatedText) {
      throw new Error("The AI returned an empty response. This may be due to the safety policy or an internal error.");
    }

    let jsonStr = generatedText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    }
    
    if (gameType === 'Crossword' && jsonStr.startsWith('[')) {
        console.warn("AI returned an array for Crossword, expected object. Attempting to use first element.");
        const parsedArray = JSON.parse(jsonStr);
        if (Array.isArray(parsedArray) && parsedArray.length > 0) {
            return parsedArray[0] as CrosswordData;
        }
    }
    
    const parsedData = JSON.parse(jsonStr) as WordGameData;
    return parsedData;
  });
};


// --- Chatbot Service ---
let chatbotSession: Chat | null = null;
let chatKeyIndex: number | null = null;

const getChatbotSystemInstruction = (): string => {
    return `You are "Co-Pilot", an expert AI assistant for a web application called 'AI Teacher Assistant'. Your sole purpose is to provide clear, detailed, and accurate guidance on how to use the app's features.

    You have been trained on the complete functionality of the application. Here are the details you must use to answer user questions:

    **Core Application Features:**

    *   **Dashboard:**
        *   **Function:** The main landing page after login.
        *   **Content:** It shows a welcome message, user stats (Subscription Plan, Lesson Credits, Image Credits), and for Pro users, a count of saved items.
        *   **Actions:** It has "Quick Action" links to the Lesson Planner, Exam Generator, and Timetable Editor. It also has buttons to edit the user's profile and change the application's theme (light/dark mode and accent color).

    *   **Lesson Planner:**
        *   **Function:** Generates detailed lesson plans based on the official curriculum.
        *   **Process:**
            1.  **Select Year:** Choose Primary Year 3, 4, or 5.
            2.  **Select Lesson:** Use the accordion to navigate through Sequences, Sections, and finally pick a specific Lesson. The planner will show relevant curriculum details for your selection.
            3.  **Customize AI:** Use the "AI Settings" to control the **Detail Level** (Concise, Standard, Detailed) and **Creativity Level** (Focused, Balanced, Creative).
            4.  **Options:** Choose to include official textbook activities and select from a list of available classroom materials.
        *   **Prompt Modes:** 'Structured' for the guided process above, or 'Custom' to write your own detailed prompt.
        *   **Output:** The generated plan can be exported as a Word (.docx) or PDF file. Pro users can save the plan to their library.

    *   **Bulk Generator (Pro Feature):**
        *   **Function:** Generates ALL lesson plans for an entire sequence at once.
        *   **Process:** Select the Year and the Sequence, enter the teacher's name, and click generate.
        *   **Cost:** This consumes a lesson credit for *each* lesson in the sequence.
        *   **Output:** A single, combined Word document containing all the generated plans.

    *   **Flashcard Generator:**
        *   **Function:** Creates a single image for a flashcard.
        *   **Process:** Type a description in the "Image Prompt" box, select an "Image Style" (like Cartoon or Watercolor), and choose an "Aspect Ratio" (e.g., 1:1 for square).
        *   **Output:** An image that can be downloaded. Pro users can save it to their library.

    *   **Exam Generator (Pro Feature):**
        *   **Function:** Creates complete exams with questions and an answer key.
        *   **Sources:** You can base the exam on 'Curriculum' (by selecting one or more sections), a specific 'Topic' you type in, or a 'Custom' detailed prompt.
        *   **Customization:** You define the exam structure by adding sections, choosing the question type (Multiple Choice, Short Answer), and setting the number of questions for each. You can also set the difficulty level.
        *   **Output:** An exam paper with a separate answer key, which can be exported to Word/PDF and saved to the library.

    *   **Timetable Editor:**
        *   **Function:** Manages the user's weekly teaching schedule.
        *   **Process:**
            1.  Go to "Manage Schools" to add the names of your schools.
            2.  Go to "Manage Classes" to create your classes (e.g., "4P1 - English") and assign them to a school.
            3.  Select a class from the "Assign Class" list, then click on an empty slot in the timetable grid to place it. Click again to remove it.
        *   **Output:** The timetable is saved automatically and can be exported to Word or PDF.

    *   **Curriculum Overview (Pro Feature):**
        *   **Function:** Lets you view and explore the entire curriculum for any year.
        *   **Views:** Includes a "Yearly Plan", a "Monthly Distribution" of sequences, and a "Detailed Monthly Plan" showing lessons week-by-week.

    *   **School Calendar (Pro Feature):**
        *   **Function:** View and manage important school year dates.
        *   **Features:** It comes pre-loaded with official holidays. Pro users can edit, add, or delete their own custom events.

    *   **My Library (Pro Feature):**
        *   **Function:** A central hub to access all your saved items.
        *   **Sections:** Contains "Saved Plans", "Saved Exams", "Saved Flashcards", and "Saved Canvases". You can load any item from here to view, use, or export it again.

    *   **Creator Studio (Admin-Only Feature):**
        *   **Function:** An advanced, canvas-based tool for creating worksheets and documents from scratch. Admins can add text, images, and shapes to an A4 page.

    **PLANS & PRICING:**

    *   **Explorer Plan (Free):** Users get a limited number of monthly lesson and image credits (e.g., 10 lesson credits, 15 image credits). Credits reset each month. Saving is limited.
    *   **Pro Co-Pilot Plan (Premium):** Users get many more credits (or unlimited), access to all Pro features (Bulk Generator, Exam Generator, etc.), and unlimited saving to their library.
    *   **Upgrading:** To upgrade, users must contact support via the email provided in the Pricing page or Profile modal.

    **YOUR RULES OF ENGAGEMENT:**
    1.  **STAY ON TOPIC:** You ONLY answer questions about using the 'AI Teacher Assistant' application.
    2.  **DECLINE OFF-TOPIC QUESTIONS:** If asked about anything else (general knowledge, your nature as an AI, etc.), you MUST politely decline and redirect. Use a friendly response like: "I'm the Co-Pilot for the AI Teacher Assistant, and my expertise is limited to helping you with the app's features. How can I assist you with lesson planning or creating resources today?"
    3.  **BE CONCISE AND CLEAR:** Use simple language. Use bullet points or numbered lists to make instructions easy to follow.
    4.  **DO NOT GUESS:** If you are unsure about a feature, say that you can only provide information based on your training.
    5.  **DO NOT ENGAGE IN CASUAL CHAT:** Be friendly and helpful, but always guide the conversation back to using the application.
    `;
};

export const getChatbotResponseStream = async (message: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (apiKeys.length === 0) {
        throw new Error("Configuration Error: API key is not configured.");
    }
    
    // If the main key index has changed since the chat was started, invalidate the session
    if (chatbotSession && chatKeyIndex !== currentApiKeyIndex) {
        chatbotSession = null;
    }

    const initialKeyIndex = currentApiKeyIndex;
    let attempts = 0;

    while (attempts < apiKeys.length) {
        try {
            if (!chatbotSession) {
                const client = getAiClient(currentApiKeyIndex);
                if (!client) {
                    throw new Error("Failed to initialize AI client for chat.");
                }
                chatbotSession = client.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: getChatbotSystemInstruction(),
                    },
                });
                chatKeyIndex = currentApiKeyIndex; // Store the key index used for this session
            }
            // Attempt to send the message
            const result = await chatbotSession.sendMessageStream({ message });
            return result;
        } catch (error) {
            // Invalidate session on any error
            chatbotSession = null;
            const processedError = handleGeminiError(error, "getChatbotResponseStream");
            if (processedError.message === "QUOTA_EXCEEDED") {
                console.warn(`Chatbot API key at index ${currentApiKeyIndex} exhausted. Trying next key.`);
                currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
                attempts++;
                if (currentApiKeyIndex === initialKeyIndex && attempts > 0) {
                    console.error("All API keys have been exhausted for chatbot.");
                    throw processedError;
                }
            } else {
                throw processedError;
            }
        }
    }

    // This should only be reached if all keys failed due to quota
    throw new Error("QUOTA_EXCEEDED");
};

export const generateSpinnerItemsForLesson = async (
  context: { level: CurriculumLevel; sequence: string; section: string; lesson: string },
  contentType: 'questions' | 'vocabulary' | 'prompts'
): Promise<string[]> => {
  return withApiKeyRotation(async (ai) => {
    let contentTypeDescription = '';
    switch (contentType) {
      case 'questions':
        contentTypeDescription = 'short, engaging review questions';
        break;
      case 'vocabulary':
        contentTypeDescription = 'key vocabulary words or short phrases';
        break;
      case 'prompts':
        contentTypeDescription = 'open-ended discussion prompts';
        break;
    }

    const prompt = `
      Based on the following lesson context for Algerian primary school students, generate a list of exactly 8 ${contentTypeDescription}.
      The items should be concise and suitable for a classroom spinner game.

      - Level: ${context.level}
      - Sequence: ${context.sequence}
      - Section: ${context.section}
      - Lesson: ${context.lesson}

      The output MUST be a single, valid JSON object that strictly conforms to the provided response schema, containing an array of 8 strings.
      Do NOT include any text or markdown formatting before or after the JSON object.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              description: "An array of exactly 8 strings, each being a question, vocabulary word, or prompt.",
              items: { type: Type.STRING }
            }
          },
          required: ["items"]
        }
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

    const parsedData = JSON.parse(jsonStr) as { items: string[] };

    if (!parsedData.items || !Array.isArray(parsedData.items)) {
      throw new Error("AI returned data in an unexpected format.");
    }

    return parsedData.items;
  });
};

export const generateCertificateIdeas = async (topic: string): Promise<string[]> => {
  return withApiKeyRotation(async (ai) => {
    const prompt = `
      You are an expert educator who is great at motivating students.
      Based on the following topic, generate a list of 5 creative, encouraging, and unique award titles for a primary school student certificate.
      Topic: "${topic}"

      The output MUST be a single, valid JSON object that strictly conforms to the provided response schema, containing an array of 5 strings.
      Do NOT include any text or markdown formatting before or after the JSON object.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              description: "An array of exactly 5 creative award titles.",
              items: { type: Type.STRING }
            }
          },
          required: ["titles"]
        }
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

    const parsedData = JSON.parse(jsonStr) as { titles: string[] };
    if (!parsedData.titles || !Array.isArray(parsedData.titles)) {
      throw new Error("AI returned data in an unexpected format.");
    }

    return parsedData.titles;
  });
};