

import { createClient } from '@supabase/supabase-js';
import { User, School, ClassEntry, TimetableData, Day, CalendarData, Review, DbReview, CurriculumLevel, CalendarEventType, DbSavedLessonPlan, LessonPlan, SavedLessonPlanContext } from '../types';


// ============================================================================
// IMPORTANT: Supabase Project Setup
// ============================================================================
// 1. Create a new project at https://supabase.com/
// 2. Go to your project's "Project Settings" > "API".
// 3. Find your Project URL and anon public key.
// 4. Replace the placeholder values below with your actual credentials.
// 5. It is highly recommended to use environment variables for these in a
//    production environment, but for this project setup, we'll place them here.
// ============================================================================

const supabaseUrl = 'https://ibjdhcztvnyqavrrazun.supabase.co'; // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliamRoY3p0dm55cWF2cnJhenVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjEwODIsImV4cCI6MjA3MDUzNzA4Mn0.yA-TYszT2ywOjkOv1fKdnrA90F4EtWEXG3jS4CRYcFs'; // Replace with your Supabase anon key

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: User;
        Update: Partial<Omit<User, 'uid'>>;
      };
      schools: {
        Row: School;
        Insert: Omit<School, 'id'>;
        Update: Partial<Omit<School, 'id'>>;
      };
      classes: {
        Row: ClassEntry;
        Insert: Omit<ClassEntry, 'id'>;
        Update: Partial<Omit<ClassEntry, 'id'>>;
      };
      timetables: {
        Row: { userId: string; data: TimetableData };
        Insert: { userId: string; data: TimetableData };
        Update: Partial<{ userId: string; data: TimetableData }>;
      };
      calendars: {
        Row: { userId: string; data: CalendarData };
        Insert: { userId: string; data: CalendarData };
        Update: Partial<{ userId: string; data: CalendarData }>;
      };
      reviews: {
        Row: DbReview;
        Insert: Omit<DbReview, 'id'>;
        Update: Partial<Omit<DbReview, 'id'>>;
      };
      saved_lesson_plans: {
        Row: DbSavedLessonPlan;
        Insert: Omit<DbSavedLessonPlan, 'id' | 'createdAt'>;
        Update: Partial<Omit<DbSavedLessonPlan, 'id' | 'createdAt'>>;
      };
    };
    Functions: {
        increment_lesson_generations: {
            Args: { user_id: string };
            Returns: void;
        };
        increment_flashcard_generations: {
            Args: { user_id: string };
            Returns: void;
        }
    };
    Enums: {};
    CompositeTypes: {};
  };
}


export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ============================================================================
// IMPORTANT: Database Schema
// ============================================================================
// You will need to create tables in your Supabase database that match the
// structures defined in `types.ts`. Here are the recommended table names:
// - users
// - schools
// - classes
// - timetables (columns: userId, data (jsonb))
// - calendars (columns: userId, data (jsonb))
// - reviews
// - saved_lesson_plans (columns: id, userId, name, plan_data (jsonb), created_at, curriculum_context (jsonb))
//
// Ensure you set up Row Level Security (RLS) policies for these tables to
// control which users can access or modify data.
// ============================================================================