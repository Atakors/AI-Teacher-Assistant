

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
export type AppView = 'lessonPlanner' | 'flashcardGenerator' | 'timetableEditor' | 'curriculumOverview' | 'schoolCalendar' | 'adminDashboard' | 'savedPlans';
export type CurriculumOverviewSubView = 'yearly' | 'monthly' | 'detailedMonthly';


// Timetable Editor Types
export interface User {
  uid: string; // Changed from id to uid for Firebase
  name: string;
  email: string | null; // Firebase can have null email
  avatar?: string;
  // Professional fields
  title?: string;
  primarySchool?: string;
  specialization?: string;
  bio?: string;
  // Preference fields
  defaultCurriculum?: CurriculumLevel;
  // Subscription fields
  plan: 'free' | 'premium';
  lessonGenerations: number;
  flashcardGenerations: number;
  hasCompletedTour: boolean;
  role: 'user' | 'admin';
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

// DB Review Type (matches the Supabase table, where createdAt is a string)
export interface DbReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string; // The database timestamp is a string
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
    userId: string;
    name: string;
    planData: LessonPlan;
    createdAt: string;
    curriculumContext: SavedLessonPlanContext;
}
