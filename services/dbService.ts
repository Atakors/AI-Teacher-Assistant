


import { supabase } from './supabase';
import { User, School, ClassEntry, TimetableData, Day, CalendarData, Review, DbReview, LessonPlan, SavedLessonPlan, SavedLessonPlanContext } from '../types';

// =================================================================================
// SQL function for Atomic Decrements (NEW - MUST BE RUN)
// =================================================================================
// To enable atomic decrements for the new credit system, you need to create
// two new SQL functions in your Supabase project's SQL Editor.
// See the updated README.md for the full script.
// =================================================================================


// --- User Functions ---

export const getUserById = async (uid: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();
    if (error && error.code !== 'PGRST116') throw error; // 'PGRST116' means no rows found
    return data;
};

export const addUser = async (uid: string, userData: Omit<User, 'uid'>): Promise<void> => {
    const newUserPayload = {
      uid,
      ...userData,
    };
    const { error } = await supabase.from('users').insert([newUserPayload]);
    if (error) throw error;
};

export const updateUser = async (uid: string, updates: Partial<Omit<User, 'uid'>>): Promise<void> => {
    const { error } = await supabase.from('users').update(updates).eq('uid', uid);
    if (error) throw error;
};

export const getAllUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
};

export const updateUserByAdmin = async (uid: string, updates: Partial<User>): Promise<void> => {
    const updatePayload: {
        plan?: 'free' | 'premium';
        role?: 'user' | 'admin';
        lesson_credits_remaining?: number;
        image_credits_remaining?: number;
    } = {};

    if (updates.plan !== undefined) {
        updatePayload.plan = updates.plan;
    }
    if (updates.role !== undefined) {
        updatePayload.role = updates.role;
    }
    if (updates.lesson_credits_remaining !== undefined && typeof updates.lesson_credits_remaining === 'number') {
        updatePayload.lesson_credits_remaining = updates.lesson_credits_remaining;
    }
    if (updates.image_credits_remaining !== undefined && typeof updates.image_credits_remaining === 'number') {
        updatePayload.image_credits_remaining = updates.image_credits_remaining;
    }

    if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase.from('users').update(updatePayload).eq('uid', uid);
        if (error) throw error;
    } else {
        console.warn("updateUserByAdmin was called but no valid fields were provided for update.");
    }
};

export const deleteUserAndData = async (uid: string): Promise<void> => {
    console.warn("User data deleted from database. Deleting from Supabase Auth requires a server-side call.");
    const tablesToDeleteFrom = ['schools', 'classes', 'reviews', 'timetables', 'calendars', 'saved_lesson_plans'];
    for (const table of tablesToDeleteFrom) {
        const { error } = await supabase.from(table).delete().eq('userId', uid);
        if (error) console.error(`Error deleting from ${table} for user ${uid}`, error);
    }
    const { error: userError } = await supabase.from('users').delete().eq('uid', uid);
    if (userError) console.error(`Error deleting user profile for ${uid}`, userError);
};


// --- Atomic Credit Decrementors ---
export const decrementLessonCredits = async (uid: string): Promise<void> => {
    const { error } = await supabase.rpc('decrement_lesson_credits', { user_id: uid });
    if (error) throw error;
};

export const decrementImageCredits = async (uid: string): Promise<void> => {
    const { error } = await supabase.rpc('decrement_image_credits', { user_id: uid });
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
    const { data: classesToDelete, error: classError } = await supabase.from('classes').select('id').eq('schoolId', schoolId);
    if (classError) throw classError;
    const classIdsToDelete = classesToDelete.map(c => c.id);
    
    if (classIdsToDelete.length > 0) {
        const { error: deleteClassError } = await supabase.from('classes').delete().in('id', classIdsToDelete);
        if (deleteClassError) throw deleteClassError;
    }

    const { error: deleteSchoolError } = await supabase.from('schools').delete().eq('id', schoolId);
    if (deleteSchoolError) throw deleteSchoolError;

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
export const saveLessonPlan = async (userId: string, name: string, planData: LessonPlan, curriculumContext: SavedLessonPlanContext): Promise<void> => {
    const { error } = await supabase.from('saved_lesson_plans').insert([{
        userId,
        name,
        planData: planData,
        curriculumContext: curriculumContext
    }]);
    if (error) throw error;
};

export const getSavedLessonPlans = async (userId: string): Promise<SavedLessonPlan[]> => {
    const { data, error } = await supabase.from('saved_lesson_plans').select('*').eq('userId', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as SavedLessonPlan[];
};

export const deleteSavedLessonPlan = async (planId: string): Promise<void> => {
    const { error } = await supabase.from('saved_lesson_plans').delete().eq('id', planId);
    if (error) throw error;
};