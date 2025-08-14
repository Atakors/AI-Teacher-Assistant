import { supabase } from './supabase';
import { User, School, ClassEntry, TimetableData, Day, CalendarData, Review, DbReview, LessonPlan, SavedLessonPlan, SavedLessonPlanContext, DbSavedLessonPlan } from '../types';

// =================================================================================
// SQL function for Atomic Increments
// =================================================================================
// To enable atomic increments for usage counts, you need to create two SQL
// functions in your Supabase project's SQL Editor (Database > SQL Editor).
//
// -- Function to increment lesson generations (CORRECTED & ROBUST)
// create or replace function increment_lesson_generations(user_id uuid)
// returns void
// language plpgsql
// as $$
// begin
//   update public.users
//   set lesson_generations = COALESCE(lesson_generations, 0) + 1
//   where uid = user_id;
// end;
// $$;
//
// -- Function to increment flashcard generations (CORRECTED & ROBUST)
// create or replace function increment_flashcard_generations(user_id uuid)
// returns void
// language plpgsql
// as $$
// begin
//   update public.users
//   set flashcard_generations = COALESCE(flashcard_generations, 0) + 1
//   where uid = user_id;
// end;
// $$;
// =================================================================================


// --- User Functions ---

export const getUserById = async (uid: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();
    if (error && error.code !== 'PGRST116') throw error; // 'PGRST116' means no rows found
    return data;
};

export const addUser = async (uid: string, userData: Omit<User, 'uid'>): Promise<void> => {
    const { error } = await supabase.from('users').insert([{ uid, ...userData }]);
    if (error) throw error;
};

export const updateUser = async (uid: string, updates: Partial<Omit<User, 'uid'>>): Promise<void> => {
    const { error } = await supabase.from('users').update(updates).eq('uid', uid);
    if (error) throw error;
};

export const getUsers = async (page: number, pageSize: number): Promise<User[]> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .range(from, to)
        .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
};

export interface AdminStats {
    totalUsers: number;
    totalLessons: number;
    totalFlashcards: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
    const { data, error } = await supabase.rpc('get_admin_stats');
    if (error) {
        console.error("Error fetching admin stats:", error);
        throw new Error(`Could not fetch admin statistics. Ensure the 'get_admin_stats' function is created in your Supabase SQL Editor. Details: ${error.message}`);
    }
    return data;
};


export const updateUserByAdmin = async (uid: string, updates: Partial<User>): Promise<void> => {
    // This function ensures only admin-editable fields are passed to the database.
    // It explicitly constructs the payload to prevent unintended side-effects.
    const updatePayload: {
        plan?: 'free' | 'premium';
        role?: 'user' | 'admin';
        lessonGenerations?: number;
        flashcardGenerations?: number;
    } = {};

    if (updates.plan !== undefined) {
        updatePayload.plan = updates.plan;
    }
    if (updates.role !== undefined) {
        updatePayload.role = updates.role;
    }
    if (updates.lessonGenerations !== undefined && typeof updates.lessonGenerations === 'number') {
        updatePayload.lessonGenerations = updates.lessonGenerations;
    }
    if (updates.flashcardGenerations !== undefined && typeof updates.flashcardGenerations === 'number') {
        updatePayload.flashcardGenerations = updates.flashcardGenerations;
    }

    if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase.from('users').update(updatePayload).eq('uid', uid);
        if (error) throw error;
    } else {
        console.warn("updateUserByAdmin was called but no valid fields were provided for update.");
    }
};

export const deleteUserAndData = async (uid: string): Promise<void> => {
    // Note: Deleting a user from Supabase Auth requires admin privileges and should be
    // done from a secure server-side environment, so we only delete their data here.
    console.warn("User data deleted from database. Deleting from Supabase Auth requires a server-side call.");

    const tablesToDeleteFrom = ['schools', 'classes', 'reviews', 'timetables', 'calendars', 'saved_lesson_plans'];
    for (const table of tablesToDeleteFrom) {
        const { error } = await supabase.from(table).delete().eq('userId', uid);
        if (error) console.error(`Error deleting from ${table} for user ${uid}`, error);
    }
    const { error: userError } = await supabase.from('users').delete().eq('uid', uid);
    if (userError) console.error(`Error deleting user profile for ${uid}`, userError);
};


// --- Atomic Count Incrementors ---
export const incrementLessonCount = async (uid: string): Promise<void> => {
    const { error } = await supabase.rpc('increment_lesson_generations', { user_id: uid });
    if (error) throw error;
};

export const incrementFlashcardCount = async (uid: string): Promise<void> => {
    const { error } = await supabase.rpc('increment_flashcard_generations', { user_id: uid });
    if (error) throw error;
};

// --- Timetable Functions (User-Specific) ---

export const getSchools = async (userId: string): Promise<School[]> => {
    const { data, error } = await supabase.from("schools").select('*').eq("userId", userId);
    if (error) throw error;
    return data;
};

export const addSchool = async (schoolData: Omit<School, 'id'>): Promise<string> => {
    const { data, error } = await supabase.from('schools').insert([schoolData]).select('id').single();
    if (error) throw error;
    return data.id;
};

export const updateSchool = async (schoolId: string, name: string): Promise<void> => {
    const { error } = await supabase.from('schools').update({ name }).eq('id', schoolId);
    if (error) throw error;
};

export const getClasses = async (userId: string): Promise<ClassEntry[]> => {
    const { data, error } = await supabase.from("classes").select('*').eq("userId", userId);
    if (error) throw error;
    return data;
};

export const addClass = async (classData: Omit<ClassEntry, 'id'>): Promise<string> => {
    const { data, error } = await supabase.from('classes').insert([classData]).select('id').single();
    if (error) throw error;
    return data.id;
};

export const updateClass = async (classId: string, updates: Partial<Omit<ClassEntry, 'id'>>): Promise<void> => {
    const { error } = await supabase.from('classes').update(updates).eq('id', classId);
    if (error) throw error;
};

export const deleteSchoolAndRelatedData = async (schoolId: string, userId: string): Promise<void> => {
    // Get class IDs associated with the school
    const { data: classesToDelete, error: classError } = await supabase.from('classes').select('id').eq('schoolId', schoolId);
    if (classError) throw classError;
    const classIdsToDelete = classesToDelete.map(c => c.id);
    
    // Delete classes
    if (classIdsToDelete.length > 0) {
        const { error: deleteClassError } = await supabase.from('classes').delete().in('id', classIdsToDelete);
        if (deleteClassError) throw deleteClassError;
    }

    // Delete school
    const { error: deleteSchoolError } = await supabase.from('schools').delete().eq('id', schoolId);
    if (deleteSchoolError) throw deleteSchoolError;

    // Clean timetable
    const timetable = await getTimetable(userId);
    if (timetable && classIdsToDelete.length > 0) {
        let timetableModified = false;
        Object.keys(timetable).forEach(day => {
            const dayKey = day as Day;
            timetable[dayKey] = timetable[dayKey].map(slotClassId => {
                if (slotClassId && classIdsToDelete.includes(slotClassId)) {
                    timetableModified = true;
                    return null;
                }
                return slotClassId;
            });
        });
        if (timetableModified) {
            await saveTimetable(userId, timetable);
        }
    }
};

export const deleteClassAndCleanTimetable = async (classId: string, userId: string): Promise<void> => {
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) throw error;
    
    const timetable = await getTimetable(userId);
    if (timetable) {
         let timetableModified = false;
         Object.keys(timetable).forEach(day => {
            const dayKey = day as Day;
            if (timetable[dayKey].includes(classId)) {
                timetableModified = true;
                timetable[dayKey] = timetable[dayKey].map(slotClassId => slotClassId === classId ? null : slotClassId);
            }
         });
         if (timetableModified) {
             await saveTimetable(userId, timetable);
         }
    }
};

export const getTimetable = async (userId: string): Promise<TimetableData | null> => {
    const { data, error } = await supabase.from('timetables').select('data').eq('userId', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.data as TimetableData : null;
};

export const saveTimetable = async (userId: string, data: TimetableData): Promise<void> => {
    const { error } = await supabase.from('timetables').upsert([{ userId, data }], { onConflict: 'userId' });
    if (error) throw error;
};

// --- Calendar Functions (User-Specific) ---
export const getCustomCalendar = async (userId: string): Promise<CalendarData | null> => {
    const { data, error } = await supabase.from('calendars').select('data').eq('userId', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.data as CalendarData : null;
};

export const saveCustomCalendar = async (userId: string, data: CalendarData): Promise<void> => {
    const { error } = await supabase.from('calendars').upsert([{ userId, data }], { onConflict: 'userId' });
    if (error) throw error;
};


// --- Review Functions ---
export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<void> => {
    const reviewData: Omit<DbReview, 'id'> = {
        ...review,
        createdAt: new Date().toISOString()
    };
    const { error } = await supabase.from('reviews').insert([reviewData]);
    if (error) throw error;
};

export const getReviews = async (limitCount: number = 5): Promise<Review[]> => {
    const { data, error } = await supabase.from('reviews').select('*').order('createdAt', { ascending: false }).limit(limitCount);
    if (error) throw error;
    const reviewsWithDateObjects: Review[] = (data || []).map(review => ({
        ...review,
        createdAt: new Date(review.createdAt),
    }));
    return reviewsWithDateObjects;
};

// --- Saved Lesson Plan Functions ---
export const saveLessonPlan = async (userId: string, name: string, planData: LessonPlan, curriculumContext: SavedLessonPlanContext, docxBlob: Blob): Promise<void> => {
    // 1. Insert plan metadata to get an ID
    const { data: newPlan, error: insertError } = await supabase
        .from('saved_lesson_plans')
        .insert([{ user_id: userId, name, plan_data: planData, curriculum_context: curriculumContext }])
        .select('id')
        .single();

    if (insertError) {
        console.error("Failed to save plan metadata", insertError);
        throw insertError;
    }

    const planId = newPlan.id;
    const filePath = `${userId}/${planId}.docx`;

    // 2. Upload the file to storage
    const { error: uploadError } = await supabase.storage
        .from('lesson_plans')
        .upload(filePath, docxBlob, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: true // Overwrite if it exists, good for retries
        });

    if (uploadError) {
        console.error("Failed to upload docx", uploadError);
        // Clean up the created DB entry if upload fails
        await supabase.from('saved_lesson_plans').delete().eq('id', planId);
        throw new Error(`Failed to upload document: ${uploadError.message}`);
    }

    // 3. Update the plan with the file path
    const { error: updateError } = await supabase
        .from('saved_lesson_plans')
        .update({ file_path: filePath })
        .eq('id', planId);

    if (updateError) {
        console.error("Failed to update plan with file path", updateError);
        // Clean up both DB entry and uploaded file
        await supabase.from('saved_lesson_plans').delete().eq('id', planId);
        await supabase.storage.from('lesson_plans').remove([filePath]);
        throw new Error(`Failed to link document to saved plan: ${updateError.message}`);
    }
};

export const getSavedLessonPlans = async (userId: string): Promise<SavedLessonPlan[]> => {
    const { data, error } = await supabase.from('saved_lesson_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    
    const plans: SavedLessonPlan[] = (data || []).map((dbPlan: DbSavedLessonPlan) => ({
        id: dbPlan.id,
        userId: dbPlan.user_id,
        name: dbPlan.name,
        planData: dbPlan.plan_data,
        createdAt: dbPlan.created_at,
        curriculumContext: dbPlan.curriculum_context,
        file_path: dbPlan.file_path,
    }));
    
    return plans;
};

export const deleteSavedLessonPlan = async (plan: SavedLessonPlan): Promise<void> => {
    // 1. Delete the file from storage if a path exists
    if (plan.file_path) {
        const { error: storageError } = await supabase.storage.from('lesson_plans').remove([plan.file_path]);
        if (storageError) {
            // Log the error but don't block DB deletion, as the record is the source of truth
            console.error(`Failed to delete file ${plan.file_path} from storage:`, storageError);
        }
    }

    // 2. Delete the record from the database
    const { error: dbError } = await supabase.from('saved_lesson_plans').delete().eq('id', plan.id);
    if (dbError) throw dbError;
};