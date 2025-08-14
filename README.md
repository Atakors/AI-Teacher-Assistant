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
- **Save for Later**: Save generated lesson plans to your account. This saves both the plan data for in-app viewing and a ready-to-download `.docx` file in your cloud storage.

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
   - In your Supabase project dashboard, navigate to the **SQL Editor**. You will need to create several tables. If you are starting a new project, you can ask me to "generate the full SQL setup script for all tables". If you are adding a feature to an existing project, see the migration scripts below.
   - **IMPORTANT: FIX FOR USAGE COUNTERS:** To fix the `400 Bad Request` error, you **must run these corrected scripts** in the SQL Editor to create the required RPC functions:
     ```sql
     -- Function to increment lesson generations (CORRECTED & ROBUST)
     create or replace function increment_lesson_generations(user_id uuid)
     returns void
     language plpgsql
     as $$
     begin
       update public.users
       set lesson_generations = COALESCE(lesson_generations, 0) + 1
       where uid = user_id;
     end;
     $$;

     -- Function to increment flashcard generations (CORRECTED & ROBUST)
     create or replace function increment_flashcard_generations(user_id uuid)
     returns void
     language plpgsql
     as $$
     begin
       update public.users
       set flashcard_generations = COALESCE(flashcard_generations, 0) + 1
       where uid = user_id;
     end;
     $$;
     ```
   - Under **Authentication > Providers**, enable the Google provider and configure it with your Google Cloud OAuth credentials.
   - Under **Authentication > URL Configuration**, set the **Site URL** to your development URL (e.g., `http://localhost:3000`) and add your deployed site URL.

**2. Google Gemini API Key:**
   - Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
   - The application is configured to read this key from the environment variable `API_KEY`. You will need to set this up in your development/deployment environment.

---

## NEW: Setup for DOCX Lesson Plan Storage

To enable saving lesson plans as Word documents, you need to perform two one-time setup actions in your Supabase project.

### 1. Database Migration: Add `file_path` Column
Run the following SQL command in your Supabase **SQL Editor** to add the necessary column to your `saved_lesson_plans` table.

```sql
-- Adds a column to store the path to the generated Word document in storage.
ALTER TABLE public.saved_lesson_plans
ADD COLUMN file_path TEXT;
```

### 2. Supabase Storage Setup
You need to create a storage "bucket" where the `.docx` files will be saved.

**A. Create the Bucket:**
1.  Go to the **Storage** section in your Supabase dashboard.
2.  Click **"New bucket"**.
3.  Name the bucket `lesson_plans`.
4.  Turn **OFF** the "Public bucket" toggle. We will use security policies instead.
5.  Click **"Create bucket"**.

**B. Add the Security Policy:**
1.  After creating the bucket, click the three-dot menu on the `lesson_plans` bucket and select **"Policies"**.
2.  If you have any existing policies for this bucket from a previous attempt, **delete them first**.
3.  Click **"New policy"** and choose the **"For full customization"** template.
4.  Give the policy a name, for example: `User can manage their own files`.
5.  Paste the following single, unified SQL command into the policy definition box and save it.

```sql
-- This single policy allows authenticated users to manage files in their own folder.
CREATE POLICY "User can manage their own files"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'lesson_plans' AND (storage.foldername(name))[1] = auth.uid()::text )
WITH CHECK ( bucket_id = 'lesson_plans' AND (storage.foldername(name))[1] = auth.uid()::text );
```
This single policy handles all permissions (upload, download, update, delete) for users on their own files, resolving the setup error.
---

## Admin Dashboard RLS Policy

If updates from the **Admin Dashboard** are not saving, you must add the required **Row Level Security (RLS) policy**. Run the following SQL in your Supabase **SQL Editor**.

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

## Admin Dashboard Performance Update

To improve the loading speed of the Admin Dashboard and support pagination, run the following SQL function in your Supabase **SQL Editor**. This function efficiently calculates all necessary statistics on the database server, avoiding the need to download the entire user list.

```sql
-- Function to get all admin stats in one call for performance
create or replace function get_admin_stats()
returns json
language plpgsql
as $$
declare
    stats json;
begin
    select json_build_object(
        'totalUsers', (select count(*) from public.users),
        'totalLessons', (select sum(COALESCE(lesson_generations, 0)) from public.users),
        'totalFlashcards', (select sum(COALESCE(flashcard_generations, 0)) from public.users)
    ) into stats;
    return stats;
end;
$$;
```