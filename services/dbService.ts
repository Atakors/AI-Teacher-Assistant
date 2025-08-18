


import { supabase } from './supabase';
import { Database, User, School, ClassEntry, TimetableData, Day, CalendarData, Review, DbReview, LessonPlan, SavedLessonPlan, SavedLessonPlanContext, AdminUserView, DbSavedLessonPlan, Exam, SavedExam, DbSavedExam, Json, CurriculumLevel, CanvasElement, SavedCanvas, SavedFlashcard } from '../types';

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
    if (!data) return null;
    
    const userRow = data as any;

    // Manual mapping from snake_case to camelCase
    return {
        uid: userRow.uid,
        name: userRow.name,
        email: userRow.email,
        avatar: userRow.avatar,
        plan: userRow.plan,
        subscriptionStatus: userRow.subscription_status,
        lessonCreditsRemaining: userRow.lesson_credits_remaining,
        imageCreditsRemaining: userRow.image_credits_remaining,
        hasCompletedTour: userRow.has_completed_tour,
        role: userRow.role,
        title: userRow.title,
        primarySchool: userRow.primary_school,
        specialization: userRow.specialization,
        bio: userRow.bio,
        defaultCurriculum: userRow.default_curriculum as CurriculumLevel | undefined
    };
};

export const addUser = async (uid: string, userData: Omit<User, 'uid'>): Promise<void> => {
    const payload: Database['public']['Tables']['users']['Insert'] = {
        uid,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        plan: userData.plan,
        subscription_status: userData.subscriptionStatus,
        lesson_credits_remaining: userData.lessonCreditsRemaining,
        image_credits_remaining: userData.imageCreditsRemaining,
        has_completed_tour: userData.hasCompletedTour,
        role: userData.role,
        title: userData.title,
        primary_school: userData.primarySchool,
        specialization: userData.specialization,
        bio: userData.bio,
        default_curriculum: userData.defaultCurriculum,
    };
    
    const { error } = await supabase.from('users').insert([payload]);
    if (error) {
        console.error("Supabase addUser error:", error);
        throw error;
    }
};


export const updateUser = async (uid: string, updates: Partial<Omit<User, 'uid'>>): Promise<void> => {
    const dbUpdates: Partial<Database['public']['Tables']['users']['Update']> = {};

    for (const key of Object.keys(updates) as Array<keyof typeof updates>) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`) as keyof Database['public']['Tables']['users']['Update'];
        (dbUpdates as any)[snakeKey] = updates[key];
    }
    
    if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('users').update(dbUpdates).eq('uid', uid);
        if (error) throw error;
    }
};

export const getAllUsers = async (): Promise<AdminUserView[]> => {
    const { data, error } = await supabase.rpc('get_all_user_details_admin');
    if (error) {
        console.error("Error fetching all users with RPC:", error);
        throw error;
    }
    
    if (!data || !Array.isArray(data)) {
        return [];
    }

    // Manually map snake_case from DB/RPC to camelCase for the application AdminUserView type
    return (data as any[]).map((user: any) => ({
        uid: user.uid,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        subscriptionStatus: user.subscription_status,
        lessonCreditsRemaining: user.lesson_credits_remaining,
        imageCreditsRemaining: user.image_credits_remaining,
        hasCompletedTour: user.has_completed_tour,
        role: user.role,
        title: user.title,
        primarySchool: user.primary_school,
        specialization: user.specialization,
        bio: user.bio,
        defaultCurriculum: user.default_curriculum,
        createdAt: user.created_at, // map snake_case to camelCase
    }));
};

export const updateUserByAdmin = async (uid: string, updates: Partial<User>): Promise<void> => {
    // Convert camelCase keys from the app to snake_case for the JSONB payload.
    const snakeCaseUpdates: { [key: string]: any } = {};
    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseUpdates[snakeKey] = (updates as any)[key];
        }
    }
    
    const { error } = await supabase.rpc('admin_update_user_details', {
        p_target_uid: uid,
        p_updates: snakeCaseUpdates as unknown as Json,
    });

    if (error) {
        console.error("Error updating user with RPC:", error);
        throw error;
    }
};

export const deleteUserByAdmin = async (uid: string): Promise<void> => {
    const { error } = await supabase.rpc('delete_user_admin', { target_uid: uid });
    if (error) {
        console.error("Error deleting user with RPC:", error);
        throw error;
    }
};


// --- Atomic Credit Decrementors ---
export const decrementLessonCredits = async (uid: string): Promise<void> => {
    const { error } = await supabase.rpc('atomic_decrement_lesson_credits', { p_user_id: uid });
    if (error) throw error;
};

export const decrementImageCredits = async (uid: string): Promise<void> => {
    const { error } = await supabase.rpc('atomic_decrement_image_credits', { p_user_id: uid });
    if (error) throw error;
};

// --- Timetable Functions (User-Specific) ---

export const getSchools = async (userId: string): Promise<School[]> => {
    const { data, error } = await supabase.from("schools").select('*').eq("user_id", userId);
    if (error) throw error;
    return (data || []).map(schoolRow => {
        return { id: schoolRow.id, name: schoolRow.name, userId: schoolRow.user_id };
    });
};

export const addSchool = async (schoolData: Omit<School, 'id'>): Promise<string> => {
    const payload: Database['public']['Tables']['schools']['Insert'] = { user_id: schoolData.userId, name: schoolData.name };
    const { data, error } = await supabase.from('schools').insert([payload]).select('id').single();
    if (error) throw error;
    if (!data) throw new Error("Could not add school, no data returned.");
    return data.id;
};

export const updateSchool = async (schoolId: string, name: string): Promise<void> => {
    const payload: Database['public']['Tables']['schools']['Update'] = { name };
    const { error } = await supabase.from('schools').update(payload).eq('id', schoolId);
    if (error) throw error;
};

export const getClasses = async (userId: string): Promise<ClassEntry[]> => {
    const { data, error } = await supabase.from("classes").select('*').eq("user_id", userId);
    if (error) throw error;
    return (data || []).map(classRow => {
        return { id: classRow.id, name: classRow.name, subject: classRow.subject, schoolId: classRow.school_id, userId: classRow.user_id };
    });
};

export const addClass = async (classData: Omit<ClassEntry, 'id'>): Promise<string> => {
     const payload: Database['public']['Tables']['classes']['Insert'] = {
        user_id: classData.userId,
        school_id: classData.schoolId,
        name: classData.name,
        subject: classData.subject,
    };
    const { data, error } = await supabase.from('classes').insert([payload]).select('id').single();
    if (error) throw error;
    if (!data) throw new Error("Could not add class, no data returned.");
    return data.id;
};

export const updateClass = async (classId: string, updates: Partial<Omit<ClassEntry, 'id' | 'userId'>>): Promise<void> => {
    const payload: Database['public']['Tables']['classes']['Update'] = {};
    if (updates.name) payload.name = updates.name;
    if (updates.subject) payload.subject = updates.subject;
    if (updates.schoolId) payload.school_id = updates.schoolId;

    if(Object.keys(payload).length > 0) {
        const { error } = await supabase.from('classes').update(payload).eq('id', classId);
        if (error) throw error;
    }
};

export const deleteSchoolAndRelatedData = async (schoolId: string, userId: string): Promise<void> => {
    const { data: classesToDelete, error: classError } = await supabase.from('classes').select('id').eq('school_id', schoolId);
    if (classError) throw classError;
    const classIdsToDelete = (classesToDelete || []).map(c => c.id);
    
    if (classIdsToDelete.length > 0) {
        const { error: deleteClassError } = await supabase.from('classes').delete().in('id', classIdsToDelete);
        if (deleteClassError) throw deleteClassError;
    }

    const { error: deleteSchoolError } = await supabase.from('schools').delete().eq('id', schoolId);
    if (deleteSchoolError) throw deleteSchoolError;

    const timetable = await getTimetable(userId);
    if (timetable && classIdsToDelete.length > 0) {
        let timetableModified = false;
        (Object.keys(timetable) as Day[]).forEach(day => {
            timetable[day] = timetable[day].map(slotClassId => {
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
         (Object.keys(timetable) as Day[]).forEach(day => {
            if (timetable[day].includes(classId)) {
                timetableModified = true;
                timetable[day] = timetable[day].map(slotClassId => slotClassId === classId ? null : slotClassId);
            }
         });
         if (timetableModified) {
             await saveTimetable(userId, timetable);
         }
    }
};

export const getTimetable = async (userId: string): Promise<TimetableData | null> => {
    const { data, error } = await supabase.from('timetables').select('data').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.data as TimetableData | null : null;
};

export const saveTimetable = async (userId: string, data: TimetableData): Promise<void> => {
    const payload = { user_id: userId, data: data as unknown as Json };
    const { error } = await supabase.from('timetables').upsert([payload]);
    if (error) throw error;
};

// --- Calendar Functions (User-Specific) ---
export const getCustomCalendar = async (userId: string): Promise<CalendarData | null> => {
    const { data, error } = await supabase.from('calendars').select('data').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.data as CalendarData | null : null;
};

export const saveCustomCalendar = async (userId: string, data: CalendarData): Promise<void> => {
    const payload = { user_id: userId, data: data as unknown as Json };
    const { error } = await supabase.from('calendars').upsert([payload]);
    if (error) throw error;
};


// --- Review Functions ---
export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<void> => {
    const reviewData: Database['public']['Tables']['reviews']['Insert'] = {
      user_id: review.userId,
      user_name: review.userName,
      user_avatar: review.userAvatar,
      rating: review.rating,
      comment: review.comment,
    };
    const { error } = await supabase.from('reviews').insert([reviewData]);
    if (error) throw error;
};

export const getReviews = async (limitCount: number = 5): Promise<Review[]> => {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(limitCount);
    if (error) throw error;
    const reviewsWithDateObjects: Review[] = (data || []).map(review => {
        const reviewRow = review;
        return {
            id: reviewRow.id,
            userId: reviewRow.user_id,
            userName: reviewRow.user_name,
            userAvatar: reviewRow.user_avatar,
            rating: reviewRow.rating,
            comment: reviewRow.comment,
            createdAt: new Date(reviewRow.created_at),
        }
    });
    return reviewsWithDateObjects;
};

// --- Saved Lesson Plan Functions ---
export const saveLessonPlan = async (userId: string, name: string, planData: LessonPlan, curriculumContext: SavedLessonPlanContext): Promise<void> => {
    const payload: Database['public']['Tables']['saved_lesson_plans']['Insert'] = {
        user_id: userId,
        name: name,
        plan_data: planData as unknown as Json,
        curriculum_context: curriculumContext as unknown as Json
    };
    const { error } = await supabase.from('saved_lesson_plans').insert([payload]);
    if (error) {
        console.error("Supabase insert error in saveLessonPlan:", error);
        throw error;
    }
};

export const getSavedLessonPlans = async (userId: string): Promise<SavedLessonPlan[]> => {
    const { data, error } = await supabase
        .from('saved_lesson_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase select error in getSavedLessonPlans:", error);
        throw error;
    }
    
    return (data || []).map((dbItem) => {
        return {
            id: dbItem.id,
            userId: dbItem.user_id,
            name: dbItem.name,
            planData: dbItem.plan_data as LessonPlan,
            createdAt: dbItem.created_at,
            curriculumContext: dbItem.curriculum_context as SavedLessonPlanContext
        };
    });
};

export const deleteSavedLessonPlan = async (planId: string): Promise<void> => {
    const { error } = await supabase.from('saved_lesson_plans').delete().eq('id', planId);
    if (error) {
        console.error("Supabase delete error in deleteSavedLessonPlan:", error);
        throw error;
    }
};

// --- Saved Exam Functions ---
export const saveExam = async (userId: string, name: string, examData: Exam): Promise<void> => {
    const payload: Database['public']['Tables']['saved_exams']['Insert'] = {
        user_id: userId,
        name: name,
        exam_data: examData as unknown as Json,
    };
    const { error } = await supabase.from('saved_exams').insert([payload]);
    if (error) throw error;
};

export const getSavedExams = async (userId: string): Promise<SavedExam[]> => {
    const { data, error } = await supabase
        .from('saved_exams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((dbItem) => {
        return {
            id: dbItem.id,
            userId: dbItem.user_id,
            name: dbItem.name,
            examData: dbItem.exam_data as Exam,
            createdAt: dbItem.created_at,
        };
    });
};

export const deleteSavedExam = async (examId: string): Promise<void> => {
    const { error } = await supabase.from('saved_exams').delete().eq('id', examId);
    if (error) throw error;
};

// --- Saved Canvas Functions ---
export const saveCanvas = async (userId: string, name: string, canvasData: SavedCanvas['canvasData']): Promise<void> => {
    const payload: Database['public']['Tables']['saved_canvases']['Insert'] = {
        user_id: userId,
        name: name,
        canvas_data: canvasData as unknown as Json,
    };
    const { error } = await supabase.from('saved_canvases').insert([payload]);
    if (error) throw error;
};

export const getSavedCanvases = async (userId: string): Promise<SavedCanvas[]> => {
    const { data, error } = await supabase
        .from('saved_canvases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((dbItem) => ({
        id: dbItem.id,
        userId: dbItem.user_id,
        name: dbItem.name,
        canvasData: dbItem.canvas_data as SavedCanvas['canvasData'],
        createdAt: dbItem.created_at,
    }));
};

export const deleteSavedCanvas = async (canvasId: string): Promise<void> => {
    const { error } = await supabase.from('saved_canvases').delete().eq('id', canvasId);
    if (error) throw error;
};

// --- Saved Flashcard Functions ---
export const saveFlashcard = async (userId: string, name: string, flashcardData: Omit<SavedFlashcard, 'id' | 'userId' | 'createdAt' | 'name'>): Promise<void> => {
    const payload: Database['public']['Tables']['saved_flashcards']['Insert'] = {
        user_id: userId,
        name: name,
        prompt: flashcardData.prompt,
        style: flashcardData.style,
        aspect_ratio: flashcardData.aspectRatio,
        image_data: flashcardData.imageData,
    };
    const { error } = await supabase.from('saved_flashcards').insert([payload]);
    if (error) {
        console.error("Supabase insert error in saveFlashcard:", error);
        throw error;
    }
};

export const getSavedFlashcards = async (userId: string): Promise<SavedFlashcard[]> => {
    const { data, error } = await supabase
        .from('saved_flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase select error in getSavedFlashcards:", error);
        throw error;
    }
    
    return (data || []).map((dbItem) => {
        return {
            id: dbItem.id,
            userId: dbItem.user_id,
            name: dbItem.name,
            prompt: dbItem.prompt,
            style: dbItem.style,
            aspectRatio: dbItem.aspect_ratio,
            imageData: dbItem.image_data,
            createdAt: dbItem.created_at,
        };
    });
};

export const deleteSavedFlashcard = async (flashcardId: string): Promise<void> => {
    const { error } = await supabase.from('saved_flashcards').delete().eq('id', flashcardId);
    if (error) {
        console.error("Supabase delete error in deleteSavedFlashcard:", error);
        throw error;
    }
};