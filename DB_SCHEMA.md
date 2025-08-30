# AI Teacher Assistant - Supabase Database Schema

This document contains all the necessary SQL scripts to set up and manage the Supabase database for the AI Teacher Assistant application. It reflects the latest feature-specific credit system.

---

## 1. `users` Table

This table stores all user profile information and is linked to the `auth.users` table.

### For New Setups:
Run the following script in your Supabase SQL Editor to create the `users` table from scratch.

```sql
-- Create the users table with feature-specific credits
CREATE TABLE public.users (
  uid uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  avatar text,
  plan text NOT NULL DEFAULT 'free'::text,
  subscription_status text NOT NULL DEFAULT 'active'::text,
  
  -- New Feature-Specific Credits
  lesson_planner_credits integer NOT NULL DEFAULT 5,
  flashcard_generator_credits integer NOT NULL DEFAULT 10,
  exam_generator_credits integer NOT NULL DEFAULT 3,
  word_game_generator_credits integer NOT NULL DEFAULT 5,

  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  has_completed_tour boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'user'::text,
  title text,
  primary_school text,
  specialization text,
  bio text,
  default_curriculum text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments for clarity
COMMENT ON COLUMN public.users.lesson_planner_credits IS 'Credits for the main lesson planner.';
COMMENT ON COLUMN public.users.flashcard_generator_credits IS 'Credits for the flashcard image generator.';
COMMENT ON COLUMN public.users.exam_generator_credits IS 'Credits for the exam generator.';
COMMENT ON COLUMN public.users.word_game_generator_credits IS 'Credits for the word game generator.';


-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Allow authenticated users to read their own data" ON public.users FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "Allow users to update their own data" ON public.users FOR UPDATE USING (auth.uid() = uid);
CREATE POLICY "Allow admins to read all user data" ON public.users FOR SELECT USING (public.is_admin(auth.uid()));
```

### For existing setups:
If you have an existing `users` table, run this script to migrate to the new credit system **without losing data**.

```sql
-- Drop the old credit columns and the obsolete bulk generator credit column
ALTER TABLE public.users
DROP COLUMN IF EXISTS lesson_credits_remaining,
DROP COLUMN IF EXISTS image_credits_remaining,
DROP COLUMN IF EXISTS bulk_generator_credits;

-- Add/update the new feature-specific credit columns with default values for existing users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS lesson_planner_credits integer NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS flashcard_generator_credits integer NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS exam_generator_credits integer NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS word_game_generator_credits integer NOT NULL DEFAULT 5;
```

---

## 2. `is_admin` Helper Function

This function checks if a user has the 'admin' role. It should be created or updated.

```sql
-- Create or replace the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM public.users WHERE uid = p_user_id;
  RETURN v_user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Trigger to Create User Profile on Sign-up

This function automatically creates a new row in `public.users` when a new user signs up. **You must re-run this to update it for the new credit system.**

```sql
-- Function to create a user profile with new default credits
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    uid, 
    name, 
    email, 
    avatar,
    -- Set initial credits for new 'free' plan users
    lesson_planner_credits,
    flashcard_generator_credits,
    exam_generator_credits,
    word_game_generator_credits
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    5,  -- Default lesson_planner_credits
    10, -- Default flashcard_generator_credits
    3,  -- Default exam_generator_credits
    5   -- Default word_game_generator_credits
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger if it exists, then create the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_user_profile();
```

---

## 4. Admin Functions (RPC)

These functions allow administrators to perform privileged actions. **You must re-run these scripts to update them for the new credit system.**

```sql
-- Drop the old functions first to avoid errors
DROP FUNCTION IF EXISTS public.admin_update_user_details(uuid, jsonb);
DROP FUNCTION IF EXISTS public.get_all_user_details_admin();
DROP FUNCTION IF EXISTS public.delete_user_admin(uuid);
DROP FUNCTION IF EXISTS public.admin_bulk_upgrade_users(uuid[]);
DROP FUNCTION IF EXISTS public.admin_bulk_add_credits(uuid[], jsonb);

-- Function for admins to update any user's details
CREATE OR REPLACE FUNCTION public.admin_update_user_details(p_target_uid uuid, p_updates jsonb)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  UPDATE public.users
  SET
    name = COALESCE(p_updates->>'name', name),
    plan = COALESCE(p_updates->>'plan', plan),
    subscription_status = COALESCE(p_updates->>'subscription_status', subscription_status),
    lesson_planner_credits = COALESCE((p_updates->>'lesson_planner_credits')::integer, lesson_planner_credits),
    flashcard_generator_credits = COALESCE((p_updates->>'flashcard_generator_credits')::integer, flashcard_generator_credits),
    exam_generator_credits = COALESCE((p_updates->>'exam_generator_credits')::integer, exam_generator_credits),
    word_game_generator_credits = COALESCE((p_updates->>'word_game_generator_credits')::integer, word_game_generator_credits),
    role = COALESCE(p_updates->>'role', role),
    subscription_start_date = COALESCE((p_updates->>'subscription_start_date')::timestamptz, subscription_start_date),
    subscription_end_date = COALESCE((p_updates->>'subscription_end_date')::timestamptz, subscription_end_date)
  WHERE uid = p_target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admins to bulk upgrade users to Pro
CREATE OR REPLACE FUNCTION public.admin_bulk_upgrade_users(p_user_ids uuid[])
RETURNS void AS $$
DECLARE
  v_start_date timestamptz := now();
  v_end_date timestamptz := now() + interval '1 month';
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  UPDATE public.users
  SET
    plan = 'pro',
    subscription_status = 'active',
    subscription_start_date = v_start_date,
    subscription_end_date = v_end_date,
    -- New Pro Credit Bundle
    lesson_planner_credits = 50,
    flashcard_generator_credits = 50,
    exam_generator_credits = 10,
    word_game_generator_credits = 20
  WHERE uid = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admins to bulk add credits to users
CREATE OR REPLACE FUNCTION public.admin_bulk_add_credits(p_user_ids uuid[], p_credits_to_add jsonb)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  UPDATE public.users
  SET
    lesson_planner_credits = lesson_planner_credits + COALESCE((p_credits_to_add->>'lessonPlannerCredits')::integer, 0),
    flashcard_generator_credits = flashcard_generator_credits + COALESCE((p_credits_to_add->>'flashcardGeneratorCredits')::integer, 0),
    exam_generator_credits = exam_generator_credits + COALESCE((p_credits_to_add->>'examGeneratorCredits')::integer, 0),
    word_game_generator_credits = word_game_generator_credits + COALESCE((p_credits_to_add->>'wordGameGeneratorCredits')::integer, 0)
  WHERE uid = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admins to delete a user
CREATE OR REPLACE FUNCTION public.delete_user_admin(target_uid uuid)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;
  
  DELETE FROM auth.users WHERE id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user details for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_user_details_admin()
RETURNS TABLE(
    uid uuid,
    name text,
    email text,
    avatar text,
    plan text,
    subscription_status text,
    lesson_planner_credits integer,
    flashcard_generator_credits integer,
    exam_generator_credits integer,
    word_game_generator_credits integer,
    subscription_start_date timestamptz,
    subscription_end_date timestamptz,
    has_completed_tour boolean,
    role text,
    title text,
    primary_school text,
    specialization text,
    bio text,
    default_curriculum text,
    created_at timestamptz
) AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT
    u.uid, u.name, u.email, u.avatar, u.plan, u.subscription_status,
    u.lesson_planner_credits, u.flashcard_generator_credits, u.exam_generator_credits,
    u.word_game_generator_credits,
    u.subscription_start_date, u.subscription_end_date,
    u.has_completed_tour, u.role, u.title, u.primary_school, u.specialization,
    u.bio, u.default_curriculum, u.created_at
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Atomic Decrement Functions (RPC)

These RPC functions ensure that credit counts are decremented safely. **Run these new functions to replace the old ones.**

```sql
-- Drop old functions
DROP FUNCTION IF EXISTS public.atomic_decrement_lesson_credits(uuid);
DROP FUNCTION IF EXISTS public.atomic_decrement_image_credits(uuid);
DROP FUNCTION IF EXISTS public.atomic_decrement_bulk_generator_credits(uuid, integer);

-- Create new feature-specific decrement functions
CREATE OR REPLACE FUNCTION public.atomic_decrement_lesson_planner_credits(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET lesson_planner_credits = lesson_planner_credits - p_amount
    WHERE uid = p_user_id AND lesson_planner_credits >= p_amount;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.atomic_decrement_flashcard_generator_credits(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET flashcard_generator_credits = flashcard_generator_credits - p_amount
    WHERE uid = p_user_id AND flashcard_generator_credits >= p_amount;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.atomic_decrement_exam_generator_credits(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET exam_generator_credits = exam_generator_credits - p_amount
    WHERE uid = p_user_id AND exam_generator_credits >= p_amount;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.atomic_decrement_word_game_generator_credits(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET word_game_generator_credits = word_game_generator_credits - p_amount
    WHERE uid = p_user_id AND word_game_generator_credits >= p_amount;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Other Tables
Ensure these tables exist in your project with appropriate Row Level Security policies.

### `schools`, `classes`, `timetables`, `calendars`
These tables store user-specific data for the Timetable and Calendar features. RLS policies should restrict access to the owner (`auth.uid() = user_id`).

### `saved_lesson_plans`, `saved_exams`, `saved_flashcards`, `saved_canvases`, `saved_word_games`
These tables store user-created content. RLS policies should restrict access to the owner (`auth.uid() = user_id`).

### `reviews` Table Setup
Run the following SQL to create the `reviews` table and its security policies.

```sql
-- Create the reviews table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_avatar text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL
);

-- Comments for clarity
COMMENT ON TABLE public.reviews IS 'Stores user-submitted reviews and ratings for the application.';
COMMENT ON COLUMN public.reviews.user_id IS 'Links to the user who wrote the review.';

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for the reviews table
CREATE POLICY "Allow public read access" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert their own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own review" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own review" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Allow admins full access to all reviews" ON public.reviews FOR ALL USING (public.is_admin(auth.uid()));
```