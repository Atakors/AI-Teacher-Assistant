import { SupabaseClient as Client } from '@supabase/supabase-js';

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
export type AppView = 'lessonPlanner' | 'timetableEditor' | 'curriculumOverview' | 'schoolCalendar' | 'adminDashboard' | 'savedPlans' | 'examGenerator' | 'savedExams' | 'creatorStudio' | 'savedCanvas' | 'flashcardGenerator' | 'savedFlashcards';

// Timetable Editor Types
export interface User {
  uid: string;
  name: string;
  email: string | null;
  avatar?: string;
  // Professional fields
  title?: string;
  primarySchool?: string;
  specialization?: string;
  bio?: string;
  // Preference fields
  defaultCurriculum?: CurriculumLevel;
  // --- NEW Subscription & Credit Fields ---
  plan: 'free' | 'premium';
  subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'trialing';
  lessonCreditsRemaining: number;
  imageCreditsRemaining: number;
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
export type QuestionType = 'Multiple Choice' | 'Short Answer' | 'Essay';

export interface ExamQuestion {
  questionText: string;
  options?: string[]; // For multiple choice
}

export interface ExamSection {
  title: string;
  questions: ExamQuestion[];
  questionType: QuestionType; // To help rendering
}

export interface Exam {
  title: string;
  instructions: string;
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


// --- Creator Studio Types ---
export type CanvasTool = 'select' | 'text' | 'image' | 'rectangle' | 'ellipse';

interface CanvasElementBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface TextElement extends CanvasElementBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
}

export interface ImageElement extends CanvasElementBase {
  type: 'image';
  src: string;
}

export interface ShapeElement extends CanvasElementBase {
  type: 'shape';
  shape: 'rectangle' | 'ellipse';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export type CanvasElement = TextElement | ImageElement | ShapeElement;

export interface SavedCanvas {
    id: string;
    userId: string;
    name: string;
    canvasData: {
        elements: CanvasElement[];
        width: number;
        height: number;
        backgroundColor: string;
    };
    createdAt: string;
}


// Supabase Types
export type Json = any;

export interface Database {
  public: {
    Tables: {
      calendars: {
        Row: {
          data: Json | null
          id: number
          user_id: string
        }
        Insert: {
          data?: Json | null
          id?: number
          user_id: string
        }
        Update: {
          data?: Json | null
          id?: number
          user_id?: string
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
          id?: string
          name: string
          school_id: string
          subject: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          school_id?: string
          subject?: string
          user_id?: string
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
          created_at?: string
          id?: string
          rating: number
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
      }
      saved_canvases: {
        Row: {
          canvas_data: Json
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          canvas_data: Json
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          canvas_data?: Json
          created_at?: string
          id?: string
          name?: string
          user_id?: string
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
          id?: string;
          user_id: string;
          name: string;
          prompt: string;
          style: string;
          aspect_ratio: string;
          image_data: string;
          created_at?: string;
        }
        Update: {
          id?: string;
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
          exam_data: Json | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_data?: Json | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_data?: Json | null
          id?: string
          name?: string
          user_id?: string
        }
      }
      saved_lesson_plans: {
        Row: {
          created_at: string
          curriculum_context: Json | null
          id: string
          name: string
          plan_data: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          curriculum_context?: Json | null
          id?: string
          name: string
          plan_data?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          curriculum_context?: Json | null
          id?: string
          name?: string
          plan_data?: Json | null
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
          id?: string
          name: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
        }
      }
      timetables: {
        Row: {
          data: Json | null
          id: number
          user_id: string
        }
        Insert: {
          data?: Json | null
          id?: number
          user_id: string
        }
        Update: {
          data?: Json | null
          id?: number
          user_id?: string
        }
      }
      users: {
        Row: {
          avatar: string | null
          bio: string | null
          default_curriculum: string | null
          email: string | null
          has_completed_tour: boolean
          image_credits_remaining: number
          lesson_credits_remaining: number
          name: string
          plan: "free" | "premium"
          primary_school: string | null
          role: "user" | "admin"
          specialization: string | null
          subscription_status: "active" | "expired" | "cancelled" | "trialing"
          title: string | null
          uid: string
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          default_curriculum?: string | null
          email?: string | null
          has_completed_tour?: boolean
          image_credits_remaining?: number
          lesson_credits_remaining?: number
          name: string
          plan?: "free" | "premium"
          primary_school?: string | null
          role?: "user" | "admin"
          specialization?: string | null
          subscription_status?: "active" | "expired" | "cancelled" | "trialing"
          title?: string | null
          uid: string
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          default_curriculum?: string | null
          email?: string | null
          has_completed_tour?: boolean
          image_credits_remaining?: number
          lesson_credits_remaining?: number
          name?: string
          plan?: "free" | "premium"
          primary_school?: string | null
          role?: "user" | "admin"
          specialization?: string | null
          subscription_status?: "active" | "expired" | "cancelled" | "trialing"
          title?: string | null
          uid?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_details: {
        Args: {
          p_target_uid: string
          p_updates: Json
        }
        Returns: undefined
      }
      atomic_decrement_image_credits: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      atomic_decrement_lesson_credits: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      delete_user_admin: {
        Args: {
          target_uid: string
        }
        Returns: undefined
      }
      get_all_user_details_admin: {
        Args: Record<PropertyKey, never>
        Returns: Json
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

export type SupabaseClient = Client<Database>;