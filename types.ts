// This is the standard, recursive type for JSON data. Using `any` to avoid
// a TypeScript issue with deep type instantiation in Supabase's auto-generated types.
export type Json = any;

export enum CurriculumLevel {
  SELECT_YEAR = "Select Year", // Added for UI consistency if a default "unselected" state is needed
  PRIMARY_3 = "Primary Year 3",
  PRIMARY_4 = "Primary Year 4",
  PRIMARY_5 = "Primary Year 5",
}

// Represents a single row in the procedure table from the new template
export interface ProcedureTableRow {
  time: string; // e.g., "5 min"
  stage: string; // e.g., "Warming up", "Install resources", "Assessment"
  procedure: string; // Contains the T./Ls. action lines
  interaction: string; // e.g., "T-Ls", "Individual work"
}

// The main LessonPlan type, matching the AI's expected JSON output.
export interface LessonPlan {
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
  materials: string[];
  crossCurricularCompetence: string;
  procedureTable: ProcedureTableRow[];
}

// Props for UI components
export interface SelectOption<T> {
  value: T;
  label: string;
}

export interface BookActivity {
  page: number;
  activityNumber?: string; // e.g., "1", "2.a", "My phonics 1"
  description: string;
  taskType?: string; // e.g., "Listening & Speaking", "Reading & Writing", "Phonics"
}

// Types for displaying structured curriculum from Planning Learning Canvas
export interface CanvasLesson {
  name: string;
  timing?: string;
  isMajorPauseEvent?: boolean; // To flag items like "PAUSE 1: ASSESSMENT..." when they occupy a lesson slot
  details?: string; // For extra details like "Learning to integrate"
  bookActivities?: BookActivity[]; // Activities from the official textbook
}

export interface CanvasSection {
  id: string; // e.g., "S1.1" or "FAMILY"
  name: string;
  lessons: CanvasLesson[];
  detailedContent?: string; // New field for section-specific objectives, resources, etc.
}

export interface CanvasSequence {
  id:string; // e.g., "SEQ1"
  title: string; // e.g., "SEQUENCE 1: FAMILY & FRIENDS"
  sections: CanvasSection[];
  objectives?: string[]; // New field for sequence-level objectives
  isPause?: boolean; // To flag if the whole sequence is a PAUSE event
  pauseTitle?: string; // e.g., "PAUSE 1: ASSESSMENT / REMEDIATION & STANDARDISATION"
  pauseDuration?: string; // e.g., "2 hours"
  pauseDetails?: string[]; // For "Group work", "Individual work" descriptions
}

// For App Navigation
export type AppView = 'dashboard' | 'lessonPlanner' | 'timetableEditor' | 'curriculumOverview' | 'schoolCalendar' | 'adminDashboard' | 'savedPlans' | 'examGenerator' | 'savedExams' | 'flashcardGenerator' | 'savedFlashcards' | 'pricing' | 'creatorStudio' | 'savedCanvas' | 'bulkGenerator' | 'wordGameGenerator' | 'reviews' | 'digitalSpinner' | 'certificateGenerator';

// Timetable Editor Types
export interface User {
  uid: string;
  name: string;
  email: string | null;
  avatar: string | null;
  // Professional fields
  title: string | null;
  primarySchool: string | null;
  specialization: string | null;
  bio: string | null;
  // Preference fields
  defaultCurriculum: CurriculumLevel | null;
  // --- NEW Subscription & Credit Fields ---
  plan: 'free' | 'pro';
  subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'trialing';
  // Feature-specific credits
  lessonPlannerCredits: number;
  flashcardGeneratorCredits: number;
  examGeneratorCredits: number;
  wordGameGeneratorCredits: number;
  
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  // App-specific fields
  hasCompletedTour: boolean;
  role: 'user' | 'admin';
}

// Extended user type for admin view, including join date
export interface AdminUserView extends User {
  createdAt: string;
}


export interface School {
  id: string;
  name: string;
  userId: string; // This will be the user's uid
}

export interface ClassEntry {
  id: string;
  name: string;
  subject: string;
  schoolId: string;
  userId: string; // This will be the user's uid
}

export type TimePeriod = 
  "8:00 - 08:45" | 
  "08:45 - 09:30" | 
  "09:30 - 09:45" | // Pause
  "09:45 - 10:30" | 
  "10:30 - 11:15" |
  "11:15 - 13:00" | // Lunch Break
  "13:00 - 13:45" | 
  "13:45 - 14:15" |
  "14:15 - 15:00";

export type Day = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday";

export interface TimetableSlotInfo {
  day: Day;
  timePeriod: TimePeriod;
  classEntry: ClassEntry | null;
  school: School | null;
}

// Represents the schedule for a single day
// An array where each element is a class ID or null, corresponding to a TimePeriod
export type TimetableDaySchedule = (string | null)[]; 

// Stores the entire timetable. Key is the Day, value is the schedule for that day.
export type TimetableData = Record<Day, TimetableDaySchedule>;

// For Curriculum Overview
export type CurriculumOverviewSubView = 'yearly' | 'monthly' | 'detailedMonthly';
export interface MonthlyDistribution {
  [month: string]: CanvasSequence[];
}

export interface EnrichedLessonInfo {
  lesson: CanvasLesson;
  sectionName: string;
  sectionId: string;
  sequenceTitle: string;
  sequenceId: string;
  isExam?: boolean; // For special slots like exams
  customTitle?: string; // For exam title or other custom text
  isHoliday?: boolean; // For holiday slots
  holidayName?: string; // e.g., "Winter Holiday", "Spring Holiday"
  lessonIndexInSequenceForMonth?: number; // Index of this lesson within its sequence for this month's plan
}

export interface DetailedMonthlyPlanViewProps {
  lessonsForMonth: EnrichedLessonInfo[];
  selectedMonth: string;
  selectedYear: CurriculumLevel;
  currentYearCanvasData: CanvasSequence[]; // Added to access full curriculum details
}

// Theme Types
export type AccentColor = 'indigo' | 'emerald' | 'sky' | 'rose';

export interface ThemeSettings {
  id: number; // usually just 1 for the single settings object
  mode: 'light' | 'dark';
  accentColor: AccentColor;
}

// Calendar Types
export enum CalendarEventType {
  SCHOOL_EVENT = 'School Event',
  NATIONAL_HOLIDAY = 'National Day',
  RELIGIOUS_HOLIDAY = 'Religious Day',
  OTHER_HOLIDAY = 'Holiday',
}

export interface CalendarEvent {
  id: string;
  name: string;
  date: string; // e.g., "September 4, 2025" or "December 21, 2025 - January 4, 2026"
  type: CalendarEventType;
}

export interface CalendarData {
  lastUpdated: string;
  events: CalendarEvent[];
}

// App State Type
export type AppState = 'landing' | 'app';

// AI Settings Types
export type LessonDetailLevel = 'concise' | 'standard' | 'detailed';
export type CreativityLevel = 'focused' | 'balanced' | 'creative';
export type PromptMode = 'structured' | 'custom';

// Review Type (for use within the application)
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: Date; // Converted to a Date object for easy use in the UI
}

// DB Review Type (matches the Supabase table)
export interface DbReview {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Saved Lesson Plan Types
export interface SavedLessonPlanContext {
    curriculumLevel: string;
    sequenceName: string;
    sectionName: string;
    lessonName: string;
}

export interface SavedLessonPlan {
    id: string;
    userId: string;
    name: string;
    planData: LessonPlan;
    createdAt: string;
    curriculumContext: SavedLessonPlanContext;
}

export interface DbSavedLessonPlan {
    id: string;
    user_id: string;
    name: string;
    plan_data: any;
    created_at: string;
    curriculum_context: any;
}

// Exam Generator Types
export type ExamSource = 'curriculum' | 'topic' | 'custom';
export type ExamDifficulty = 'Easy' | 'Medium' | 'Hard';
export type QuestionType =
  | 'Multiple Choice'
  | 'Short Answer'
  | 'Essay'
  | 'True/False'
  | 'Fill in the Blanks'
  | 'Matching'
  | 'Complete the Table'
  | 'Reorder the Words'
  | 'Guided Writing'
  | 'Handwriting Practice';

export interface MatchingPair {
  prompt: string;
  match: string;
}

export interface GuidedWritingNote {
  key: string;
  value: string;
}

export interface ExamQuestion {
  questionText: string;
  options?: string[]; // For 'Multiple Choice'
  matchingPairs?: MatchingPair[]; // For 'Matching'
  wordBank?: string[]; // For 'Fill in the Blanks'
  jumbledWords?: string[]; // For 'Reorder the Words'
  guidedWritingNotes?: GuidedWritingNote[]; // For 'Guided Writing'
  tableToComplete?: { // For 'Complete the Table'
    headers: string[];
    rows: (string | null)[][]; // null represents a cell for the student to fill
  };
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
  answerKey: string[][]; // Array of arrays of strings
}


export interface SavedExam {
  id: string;
  userId: string;
  name: string;
  examData: Exam;
  createdAt: string;
}

export interface DbSavedExam {
  id: string;
  user_id: string;
  name: string;
  exam_data: any;
  created_at: string;
}

export interface FlashcardIdea {
  term: string;
  description: string;
}

export interface SavedFlashcard {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  imageData: string; // base64 string
  createdAt: string;
}

export interface DbSavedFlashcard {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  style: string;
  aspect_ratio: string;
  image_data: string;
  created_at: string;
}

// Creator Studio Types
interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  letterSpacing: number;
  lineHeight: number;
  stroke?: string;
  strokeWidth?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  crop?: {
    x: number; // percentage
    y: number; // percentage
    width: number; // percentage
    height: number; // percentage
  };
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'line';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export type CanvasElement = TextElement | ImageElement | ShapeElement;

export interface CanvasData {
    elements: CanvasElement[];
    width: number;
    height: number;
    backgroundColor: string;
}

export interface SavedCanvas {
  id: string;
  userId: string;
  name: string;
  canvasData: CanvasData;
  createdAt: string;
}

// Chatbot types
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Word Game Generator Types
export type WordGameType = 'Riddle' | 'Word Scramble' | 'Sentence Builder' | 'Odd One Out' | 'Hidden Word' | 'Crossword';

export interface Riddle {
  clues: string[];
  answer: string;
}

export interface WordScramble {
  scrambled: string;
  answer: string;
}

export interface SentenceBuilder {
  jumbled: string[];
  answer: string;
}

export interface OddOneOut {
  words: string[];
  answer: string;
  category: string;
}

export interface HiddenWord {
  grid: string[][];
  words: string[];
}

export interface CrosswordClue {
  number: number;
  direction: 'Across' | 'Down';
  clue: string;
  answer: string;
  row: number;
  col: number;
}

export interface CrosswordData {
  grid: (string | null)[][];
  clues: CrosswordClue[];
}

export type WordGameData = Riddle[] | WordScramble[] | SentenceBuilder[] | OddOneOut[] | HiddenWord | CrosswordData;

export interface SavedWordGame {
  id: string;
  userId: string;
  name: string;
  gameType: WordGameType;
  level: CurriculumLevel;
  topic: string;
  gameData: WordGameData;
  createdAt: string;
}

export interface DbSavedWordGame {
  id: string;
  user_id: string;
  name: string;
  game_type: string;
  level: string;
  topic: string;
  game_data: any;
  created_at: string;
}


// Supabase Types
export interface Database {
  public: {
    Tables: {
      calendars: {
        Row: {
          data: any | null
          id: number
          user_id: string
        }
        Insert: {
          data?: any | null
          user_id: string
        }
        Update: {
          data?: any | null
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          school_id: string
          subject: string
          user_id: string
        }
        Insert: {
          name: string
          school_id: string
          subject: string
          user_id: string
        }
        Update: {
          name?: string
          school_id?: string
          subject?: string
        }
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          rating: number
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          comment: string
          rating: number
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          comment?: string
          rating?: number
        }
      }
      saved_canvases: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          canvas_data: any;
          created_at: string;
        }
        Insert: {
          user_id: string;
          name: string;
          canvas_data: any;
        }
        Update: {
          name?: string;
          canvas_data?: any;
        }
      }
      saved_flashcards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          prompt: string;
          style: string;
          aspect_ratio: string;
          image_data: string;
          created_at: string;
        }
        Insert: {
          user_id: string;
          name: string;
          prompt: string;
          style: string;
          aspect_ratio: string;
          image_data: string;
        }
        Update: {
          name?: string;
          prompt?: string;
          style?: string;
          aspect_ratio?: string;
          image_data?: string;
        }
      }
      saved_exams: {
        Row: {
          created_at: string
          exam_data: any | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          exam_data?: any | null
          name: string
          user_id: string
        }
        Update: {
          exam_data?: any | null
          name?: string
        }
      }
      saved_lesson_plans: {
        Row: {
          created_at: string
          curriculum_context: any | null
          id: string
          name: string
          plan_data: any | null
          user_id: string
        }
        Insert: {
          curriculum_context?: any | null
          name: string
          plan_data?: any | null
          user_id: string
        }
        Update: {
          curriculum_context?: any | null
          name?: string
          plan_data?: any | null
        }
      }
      saved_word_games: {
        Row: {
          created_at: string
          game_data: Json | null
          game_type: string
          id: string
          level: string
          name: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_data?: Json | null
          game_type: string
          id?: string
          level: string
          name: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_data?: Json | null
          game_type?: string
          id?: string
          level?: string
          name?: string
          topic?: string
          user_id?: string
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          user_id: string
        }
        Insert: {
          name: string
          user_id: string
        }
        Update: {
          name?: string
        }
      }
      timetables: {
        Row: {
          data: any | null
          id: number
          user_id: string
        }
        Insert: {
          data?: any | null
          user_id: string
        }
        Update: {
          data?: any | null
        }
      }
      users: {
        Row: {
          name: string
          avatar: string | null
          bio: string | null
          created_at: string
          default_curriculum: string | null
          email: string | null
          has_completed_tour: boolean
          plan: "free" | "pro"
          role: "user" | "admin"
          specialization: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: "active" | "expired" | "cancelled" | "trialing"
          title: string | null
          primary_school: string | null
          uid: string
          // New Credits
          lesson_planner_credits: number
          flashcard_generator_credits: number
          exam_generator_credits: number
          word_game_generator_credits: number
        }
        Insert: {
          name: string
          avatar?: string | null
          bio?: string | null
          created_at?: string
          default_curriculum?: string | null
          email?: string | null
          has_completed_tour?: boolean
          plan?: "free" | "pro"
          role?: "user" | "admin"
          specialization?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: "active" | "expired" | "cancelled" | "trialing"
          title?: string | null
          primary_school?: string | null
          uid: string
          // New Credits
          lesson_planner_credits?: number
          flashcard_generator_credits?: number
          exam_generator_credits?: number
          word_game_generator_credits?: number
        }
        Update: {
          name?: string
          avatar?: string | null
          bio?: string | null
          created_at?: string
          default_curriculum?: string | null
          email?: string | null
          has_completed_tour?: boolean
          plan?: "free" | "pro"
          role?: "user" | "admin"
          specialization?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: "active" | "expired" | "cancelled" | "trialing"
          title?: string | null
          primary_school?: string | null
          uid?: string
          // New Credits
          lesson_planner_credits?: number
          flashcard_generator_credits?: number
          exam_generator_credits?: number
          word_game_generator_credits?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      delete_user_admin: {
        Args: { target_uid: string }
        Returns: undefined
      }
      get_all_user_details_admin: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_update_user_details: {
        Args: { p_target_uid: string, p_updates: Json }
        Returns: undefined
      }
      admin_bulk_upgrade_users: {
        Args: { p_user_ids: string[] }
        Returns: undefined
      }
      admin_bulk_add_credits: {
        Args: { p_user_ids: string[], p_credits_to_add: Json }
        Returns: undefined
      }
      atomic_decrement_lesson_planner_credits: {
        Args: { p_user_id: string, p_amount: number }
        Returns: undefined
      }
      atomic_decrement_flashcard_generator_credits: {
        Args: { p_user_id: string, p_amount: number }
        Returns: undefined
      }
       atomic_decrement_exam_generator_credits: {
        Args: { p_user_id: string, p_amount: number }
        Returns: undefined
      }
       atomic_decrement_word_game_generator_credits: {
        Args: { p_user_id: string, p_amount: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}