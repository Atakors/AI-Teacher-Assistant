# AI Teacher Assistant

Welcome to the AI Teacher Assistant, a comprehensive web application designed to empower primary school educators by streamlining their planning and resource creation workflows. This application leverages the power of the Google Gemini API to provide intelligent tools for lesson planning, image generation, and schedule management.

## Core Features

This application is a fully-featured, production-ready tool with a robust set of features designed for daily use by teachers.

### 1. AI Lesson Planner
The cornerstone of the application, the Lesson Planner transforms curriculum objectives into detailed, ready-to-use lesson plans in seconds.
- **Curriculum Integration**: Select from pre-loaded official curriculums for Primary Years 3, 4, and 5.
- **Detailed Selection**: Use a cascading accordion to navigate from broad sequences down to specific sections and individual lessons.
- **Contextual Information**: View curriculum objectives, key vocabulary, and official textbook activities directly within the planner.
- **Customizable AI**: Adjust the AI's **Detail Level** (from concise to highly detailed) and **Creativity Level** (from strictly curriculum-focused to more creative interpretations).
- **Structured & Custom Prompts**: Use the guided "Structured" mode or take full control with a "Custom" prompt.
- **Professional Export**: Export the final generated lesson plan as a polished **Microsoft Word (.docx)** or **PDF** document.
- **Save for Later**: Save generated lesson plans to your account to access them anytime.

### 2. AI Flashcard Generator
Instantly create visuals for classroom activities, presentations, or flashcards.
- **Simple Prompting**: Generate an image from a simple text description (e.g., "a smiling cartoon apple").
- **Style Control**: Choose from various artistic styles like Cartoon, Watercolor, Line Art, and Photorealistic to maintain consistency.
- **Aspect Ratios**: Select the perfect image dimensions, from square (1:1) to portrait (3:4) or widescreen (16:9).

### 3. Timetable Editor
A powerful, database-backed tool for complete schedule management.
- **CRUD Operations**: Full Create, Read, Update, and Delete functionality for all your **Schools** and **Classes**.
- **Interactive Timetable**: Click to assign your created classes to a persistent weekly timetable grid.
- **Data Persistence**: All timetable data, schools, and classes are securely saved to your user account in the Supabase database.
- **Professional Export**: Export the final timetable as a **Microsoft Word (.docx)** or **PDF** document.

### 4. Curriculum & Calendar (Premium Features)
- **Curriculum Overview**: A premium feature that allows teachers to explore the entire academic year's curriculum. It offers multiple views: a high-level **Yearly Plan**, a month-by-month **Distribution View**, and a **Detailed Monthly Plan** that breaks down sessions week by week.
- **School Calendar**: Comes pre-loaded with official national and religious holidays for the academic year. Premium users can customize their calendar by adding, editing, or deleting events, which are saved to their profile.

### 5. User Authentication & Profiles
- **Secure Sign-Up & Login**: Full authentication powered by Supabase, supporting both email/password and Google OAuth.
- **User Profiles**: A dedicated modal where users can update their professional details, name, and avatar.
- **App Preferences**: Users can set a default curriculum and manage theme settings (Light/Dark mode and accent color).

### 6. Admin Dashboard
- **Role-Based Access**: The dashboard is only visible and accessible to users with the `admin` role.
- **Full User Management**: View a table of all registered users in the application.
- **Edit User Details**: Admins can click "Edit" on any user to modify their subscription plan (`free`/`premium`), role (`user`/`admin`), and reset their AI generation usage counts.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend-as-a-Service**: Supabase (Authentication, PostgreSQL Database, Storage)
- **AI Integration**: Google Gemini API (`gemini-2.5-flash` for text, `imagen-3.0-generate-002` for images)
- **Document Generation**: `jspdf` & `jspdf-autotable` for PDF exports, `docx` for Microsoft Word exports.

## Project Setup & Configuration

To run this project locally or deploy it, you need to configure the following services:

**1. Supabase Backend:**
   - Create a project at [supabase.com](https://supabase.com/).
   - In `services/supabase.ts`, replace the placeholder `supabaseUrl` and `supabaseAnonKey` with your project's API credentials.
   - In your Supabase project dashboard, navigate to the **SQL Editor**. You will need to create several tables. If you are starting a new project, you can ask me to "generate the full SQL setup script for all tables". If you are adding a feature to an existing project, see the migration scripts below. The required tables are: `users`, `schools`, `classes`, `timetables`, `calendars`, `reviews`, and `saved_lesson_plans`.
   - In the **SQL Editor**, create the two required RPC functions for atomically incrementing usage counts. **Run these corrected scripts to fix the generation counting bug:**
     ```sql
     -- Function to increment lesson generations (CORRECTED)
     create or replace function increment_lesson_generations(user_id uuid)
     returns void
     language plpgsql
     as $$
     begin
       update public.users
       set lesson_generations = lesson_generations + 1
       where uid = user_id;
     end;
     $$;

     -- Function to increment flashcard generations (CORRECTED)
     create or replace function increment_flashcard_generations(user_id uuid)
     returns void
     language plpgsql
     as $$
     begin
       update public.users
       set flashcard_generations = flashcard_generations + 1
       where uid = user_id;
     end;
     $$;
     ```
   - Under **Authentication > Providers**, enable the Google provider and configure it with your Google Cloud OAuth credentials.
   - Under **Authentication > URL Configuration**, set the **Site URL** to your development URL (e.g., `http://localhost:3000`) and add your deployed site URL.

**2. Google Gemini API Key:**
   - Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
   - The application is configured to read this key from the environment variable `API_KEY`. You will need to set this up in your development/deployment environment.

## Feature Update: Admin RLS Policy

If you find that updates from the **Admin Dashboard** are not saving, it is because your database is missing a required **Row Level Security (RLS) policy**. This policy allows users with the `admin` role to modify other users' records. Run the following SQL script in your Supabase project's **SQL Editor** to fix this.

```sql
-- This policy allows users with the 'admin' role to update rows in the users table.
CREATE POLICY "Allow admins to update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'
);
```

## Feature Update: Database Migration for "Saved Plans"

If you are updating an existing project to include the **Saved Lesson Plans** feature, you must run the following SQL script in your Supabase project's **SQL Editor**. The 404 error you are seeing is because this table does not exist in your database yet.

```sql
-- 1. Create the saved_lesson_plans table
CREATE TABLE public.saved_lesson_plans (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "userId" uuid NOT NULL,
    name text NOT NULL,
    plan_data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    curriculum_context jsonb NOT NULL,
    CONSTRAINT saved_lesson_plans_pkey PRIMARY KEY (id),
    CONSTRAINT "saved_lesson_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security (RLS) on the new table
ALTER TABLE public.saved_lesson_plans ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for users to manage their own saved plans
CREATE POLICY "Enable read access for own plans" ON public.saved_lesson_plans FOR SELECT TO authenticated USING (auth.uid() = "userId");
CREATE POLICY "Enable insert for own plans" ON public.saved_lesson_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Enable update for own plans" ON public.saved_lesson_plans FOR UPDATE TO authenticated USING (auth.uid() = "userId");
CREATE POLICY "Enable delete for own plans" ON public.saved_lesson_plans FOR DELETE TO authenticated USING (auth.uid() = "userId");
```

**Project Status:**
This is a complete, feature-rich application ready for deployment and use. All core features described above are fully implemented.