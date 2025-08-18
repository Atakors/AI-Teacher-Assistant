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
- **Save & Download**: Save your creations to your account or download them directly to your device.

### 3. Creator Studio (New!)
A professional, canvas-based tool that gives you complete creative control to build worksheets, exams, and other educational materials from scratch.
- **Interactive A4 Canvas**: Design on a digital A4 paper with a snap-to-grid system for perfect alignment.
- **Essential Tools**: Includes a toolbar with a select tool, text tool, image uploader, and shape tool.
- **Drag & Drop**: Freely move and position any element on the canvas for a fully customized layout.

### 4. Timetable Editor
A powerful, database-backed tool for complete schedule management.
- **CRUD Operations**: Full Create, Read, Update, and Delete functionality for all your **Schools** and **Classes**.
- **Interactive Timetable**: Click to assign your created classes to a persistent weekly timetable grid.
- **Data Persistence**: All timetable data, schools, and classes are securely saved to your user account in the Supabase database.
- **Professional Export**: Export the final timetable as a **Microsoft Word (.docx)** or **PDF** document.

### 5. Curriculum & Calendar (Premium Features)
- **Curriculum Overview**: A premium feature that allows teachers to explore the entire academic year's curriculum. It offers multiple views: a high-level **Yearly Plan**, a month-by-month **Distribution View**, and a **Detailed Monthly Plan** that breaks down sessions week by week.
- **School Calendar**: Comes pre-loaded with official national and religious holidays for the academic year. Premium users can customize their calendar by adding, editing, or deleting events, which are saved to their profile.

### 6. User Authentication & Profiles
- **Secure Sign-Up & Login**: Full authentication powered by Supabase, supporting both email/password and Google OAuth.
- **User Profiles**: A dedicated modal where users can update their professional details, name, and avatar.
- **App Preferences**: Users can set a default curriculum and manage theme settings (Light/Dark mode and accent color).

### 7. Admin Dashboard
- **Role-Based Access**: The dashboard is only visible and accessible to users with the `admin` role.
- **Full User Management**: View a table of all registered users in the application.
- **Edit User Details**: Admins can click "Edit" on any user to modify their subscription plan (`free`/`premium`), role (`user`/`admin`), and reset their AI generation credits.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend-as-a-Service**: Supabase (Authentication, PostgreSQL Database, Storage)
- **AI Integration**: Google Gemini API (`gemini-2.5-flash` for text, `imagen-3.0-generate-002` for images)
- **Document Generation**: `jspdf` & `jspdf-autotable` for PDF exports, `docx` for Microsoft Word exports.

## Database Setup (IMPORTANT)

---
### **IMPORTANT: Final Fix for All Database Errors**
All recent sign-in errors, admin panel issues, and data saving problems are caused by an inconsistent database schema from previous setup attempts.

**To fix all issues permanently, you MUST run the complete SQL script below.**

This script is **idempotent**, meaning it is safe to run multiple times. It will completely reset your database to the correct, final schema that works with the latest application code. This is the definitive solution.
---

**Instructions:**
1.  **Create a Supabase Project**: If you haven't already, create one at [supabase.com](https://supabase.com/).
2.  **Get API Credentials**: Navigate to **Project Settings > API**. Find your **Project URL** and **anon public key**.
3.  **Update App Code**: In `services/supabase.ts`, replace the placeholder `supabaseUrl` and `supabaseAnonKey` with your credentials.
4.  **Run SQL Script**: Go to the **SQL Editor** in your Supabase dashboard, click **+ New query**, and paste the **entire script below**. Click **RUN** to create all tables, functions, and fix the security policies.

---

### Full Database Setup & Fix Script

```sql
-- Full Database Setup SQL Script
-- Run this entire script in your Supabase SQL Editor. It is idempotent (safe to run multiple times).

-- =================================================================
-- TEARDOWN PHASE: Drop existing objects in reverse order of dependency
-- =================================================================

-- Step 1: Drop tables. CASCADE will handle policies, etc.
DROP TABLE IF EXISTS public.calendars CASCADE;
DROP TABLE IF EXISTS public.timetables CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.saved_lesson_plans CASCADE;
DROP TABLE IF EXISTS public.saved_exams CASCADE;
DROP TABLE IF EXISTS public.saved_canvases CASCADE;
DROP TABLE IF EXISTS public.saved_flashcards CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Drop the trigger from auth.users before dropping the function it depends on.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Drop functions now that policies and triggers are gone.
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.atomic_decrement_lesson_credits(uuid);
DROP FUNCTION IF EXISTS public.atomic_decrement_image_credits(uuid);
DROP FUNCTION IF EXISTS public.get_all_user_details_admin();
DROP FUNCTION IF EXISTS public.delete_user_admin(uuid);
DROP FUNCTION IF EXISTS public.admin_update_user_details(uuid, jsonb);
DROP FUNCTION IF EXISTS public.handle_new_user();


-- =================================================================
-- BUILD PHASE: Create objects in correct order of dependency
-- =================================================================

-- Step 4: Create Tables first, as functions and policies depend on them.
CREATE TABLE public.users (
    uid uuid NOT NULL,
    name text NOT NULL,
    email text,
    avatar text,
    title text,
    primary_school text,
    specialization text,
    bio text,
    default_curriculum text,
    plan text NOT NULL DEFAULT 'free'::text,
    subscription_status text NOT NULL DEFAULT 'active'::text,
    lesson_credits_remaining integer NOT NULL DEFAULT 4,
    image_credits_remaining integer NOT NULL DEFAULT 8,
    has_completed_tour boolean NOT NULL DEFAULT false,
    role text NOT NULL DEFAULT 'user'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (uid),
    CONSTRAINT users_uid_fkey FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.users IS 'Stores user profile data linked to Supabase auth.';

CREATE TABLE public.schools (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT schools_pkey PRIMARY KEY (id),
    CONSTRAINT "schools_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.classes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    subject text NOT NULL,
    school_id uuid NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT classes_pkey PRIMARY KEY (id),
    CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE,
    CONSTRAINT "classes_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.timetables (
    user_id uuid NOT NULL,
    data jsonb NOT NULL,
    CONSTRAINT timetables_pkey PRIMARY KEY (user_id),
    CONSTRAINT "timetables_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.calendars (
    user_id uuid NOT NULL,
    data jsonb NOT NULL,
    CONSTRAINT calendars_pkey PRIMARY KEY (user_id),
    CONSTRAINT "calendars_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    user_name text NOT NULL,
    user_avatar text,
    rating integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT reviews_pkey PRIMARY KEY (id),
    CONSTRAINT "reviews_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.saved_lesson_plans (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    plan_data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    curriculum_context jsonb NOT NULL,
    CONSTRAINT saved_lesson_plans_pkey PRIMARY KEY (id),
    CONSTRAINT "saved_lesson_plans_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.saved_exams (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    exam_data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT saved_exams_pkey PRIMARY KEY (id),
    CONSTRAINT "saved_exams_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.saved_canvases (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    canvas_data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT saved_canvases_pkey PRIMARY KEY (id),
    CONSTRAINT "saved_canvases_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.saved_flashcards (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    prompt text NOT NULL,
    style text NOT NULL,
    aspect_ratio text NOT NULL,
    image_data text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT saved_flashcards_pkey PRIMARY KEY (id),
    CONSTRAINT "saved_flashcards_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Step 5: Create Functions that depend on the tables.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE uid = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.atomic_decrement_lesson_credits(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update public.users
  set lesson_credits_remaining = lesson_credits_remaining - 1
  where uid = p_user_id and lesson_credits_remaining > 0;
end;
$function$;

CREATE OR REPLACE FUNCTION public.atomic_decrement_image_credits(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update public.users
  set image_credits_remaining = image_credits_remaining - 1
  where uid = p_user_id and image_credits_remaining > 0;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_user_details_admin()
RETURNS TABLE (
    uid uuid, name text, email text, avatar text, title text, primary_school text, specialization text, bio text, default_curriculum text, plan text, subscription_status text, lesson_credits_remaining integer, image_credits_remaining integer, has_completed_tour boolean, role text, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF get_my_role() <> 'admin' THEN
    RAISE EXCEPTION 'Permission denied: You must be an admin to access this data.';
  END IF;
  RETURN QUERY
  SELECT u.uid, u.name, u.email, u.avatar, u.title, u.primary_school, u.specialization, u.bio, u.default_curriculum, u.plan, u.subscription_status, u.lesson_credits_remaining, u.image_credits_remaining, u.has_completed_tour, u.role, u.created_at
  FROM public.users u;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_admin(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF get_my_role() <> 'admin' THEN
    RAISE EXCEPTION 'Permission denied: You must be an admin to delete users.';
  END IF;
  DELETE FROM auth.users WHERE id = target_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_details(p_target_uid uuid, p_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_query text;
BEGIN
  IF get_my_role() <> 'admin' THEN
    RAISE EXCEPTION 'Permission denied: You must be an admin to update users.';
  END IF;

  update_query := 'UPDATE public.users SET ';
  update_query := update_query || (
    SELECT string_agg(
      format('%I = %L', key, value),
      ', '
    )
    FROM jsonb_each_text(p_updates)
  );
  update_query := update_query || ' WHERE uid = $1';

  EXECUTE update_query USING p_target_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (uid, name, email, avatar)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Step 6: Create Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Step 7: Enable RLS and create policies for each table.

-- Policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = uid);
CREATE POLICY "Admins have full access to user data" ON public.users FOR ALL USING (get_my_role() = 'admin');

-- Policies for schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own schools" ON public.schools FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to schools" ON public.schools FOR ALL USING (get_my_role() = 'admin');

-- Policies for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own classes" ON public.classes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to classes" ON public.classes FOR ALL USING (get_my_role() = 'admin');

-- Policies for timetables
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own timetables" ON public.timetables FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to timetables" ON public.timetables FOR ALL USING (get_my_role() = 'admin');

-- Policies for calendars
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own calendars" ON public.calendars FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to calendars" ON public.calendars FOR ALL USING (get_my_role() = 'admin');

-- Policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to reviews" ON public.reviews FOR ALL USING (get_my_role() = 'admin');

-- Policies for saved_lesson_plans
ALTER TABLE public.saved_lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved plans" ON public.saved_lesson_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to saved plans" ON public.saved_lesson_plans FOR ALL USING (get_my_role() = 'admin');

-- Policies for saved_exams
ALTER TABLE public.saved_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved exams" ON public.saved_exams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to saved exams" ON public.saved_exams FOR ALL USING (get_my_role() = 'admin');

-- Policies for saved_canvases
ALTER TABLE public.saved_canvases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved canvases" ON public.saved_canvases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to saved canvases" ON public.saved_canvases FOR ALL USING (get_my_role() = 'admin');

-- Policies for saved_flashcards
ALTER TABLE public.saved_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved flashcards" ON public.saved_flashcards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to saved flashcards" ON public.saved_flashcards FOR ALL USING (get_my_role() = 'admin');

```
---

## Getting Started

1.  **Clone the repository**: `git clone <repository-url>`
2.  **Install dependencies**: `npm install`
3.  **Set up environment variables**: Create a `.env` file in the root and add your Supabase and Gemini API keys:
    ```
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GEMINI_API_KEY=your_google_ai_studio_api_key
    ```
4.  **Run the development server**: `npm run dev`

Your application should now be running locally and connected to your Supabase backend.
