import { supabase } from './supabase';
import { Database, User, School, ClassEntry, TimetableData, Day, CalendarData, Review, DbReview, LessonPlan, SavedLessonPlan, SavedLessonPlanContext, AdminUserView, DbSavedLessonPlan, Exam, SavedExam, DbSavedExam, Json, CurriculumLevel, SavedFlashcard, SavedCanvas, CanvasData, WordGameType, WordGameData } from '../types';

// --- User Functions ---

export const getUserById = async (uid: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();
    if (error && error.code !== 'PGRST116') throw error; // 'PGRST116' means no rows found
    if (!data) return null;
    
    return {
        uid: data.uid,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        plan: data.plan,
        subscriptionStatus: data.subscription_status,
        // New credits
        lessonPlannerCredits: data.lesson_planner_credits,
        flashcardGeneratorCredits: data.flashcard_generator_credits,
        examGeneratorCredits: data.exam_generator_credits,
        wordGameGeneratorCredits: data.word_game_generator_credits,
        
        subscriptionStartDate: data.subscription_start_date,
        subscriptionEndDate: data.subscription_end_date,
        hasCompletedTour: data.has_completed_tour,
        role: data.role,
        title: data.title,
        primarySchool: data.primary_school,
        specialization: data.specialization,
        bio: data.bio,
        defaultCurriculum: data.default_curriculum as CurriculumLevel | null
    };
};

export const updateUser = async (uid: string, updates: Partial<Omit<User, 'uid'>>): Promise<void> => {
    const dbUpdates: Partial<Database['public']['Tables']['users']['Update']> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
    if (updates.subscriptionStatus !== undefined) dbUpdates.subscription_status = updates.subscriptionStatus;
    // New credits
    if (updates.lessonPlannerCredits !== undefined) dbUpdates.lesson_planner_credits = updates.lessonPlannerCredits;
    if (updates.flashcardGeneratorCredits !== undefined) dbUpdates.flashcard_generator_credits = updates.flashcardGeneratorCredits;
    if (updates.examGeneratorCredits !== undefined) dbUpdates.exam_generator_credits = updates.examGeneratorCredits;
    if (updates.wordGameGeneratorCredits !== undefined) dbUpdates.word_game_generator_credits = updates.wordGameGeneratorCredits;
    
    if (updates.subscriptionStartDate !== undefined) dbUpdates.subscription_start_date = updates.subscriptionStartDate;
    if (updates.subscriptionEndDate !== undefined) dbUpdates.subscription_end_date = updates.subscriptionEndDate;
    if (updates.hasCompletedTour !== undefined) dbUpdates.has_completed_tour = updates.hasCompletedTour;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.primarySchool !== undefined) dbUpdates.primary_school = updates.primarySchool;
    if (updates.specialization !== undefined) dbUpdates.specialization = updates.specialization;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.defaultCurriculum !== undefined) dbUpdates.default_curriculum = updates.defaultCurriculum;

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

    return (data as any[]).map((user: any) => ({
        uid: user.uid,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        subscriptionStatus: user.subscription_status,
        // New credits
        lessonPlannerCredits: user.lesson_planner_credits,
        flashcardGeneratorCredits: user.flashcard_generator_credits,
        examGeneratorCredits: user.exam_generator_credits,
        wordGameGeneratorCredits: user.word_game_generator_credits,

        subscriptionStartDate: user.subscription_start_date,
        subscriptionEndDate: user.subscription_end_date,
        hasCompletedTour: user.has_completed_tour,
        role: user.role,
        title: user.title,
        primarySchool: user.primary_school,
        specialization: user.specialization,
        bio: user.bio,
        defaultCurriculum: user.default_curriculum,
        createdAt: user.created_at,
    }));
};

export const updateUserByAdmin = async (uid: string, updates: Partial<User>): Promise<void> => {
    const snakeCaseUpdates: { [key: string]: any } = {};
    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseUpdates[snakeKey] = (updates as any)[key];
        }
    }
    
    const { error } = await supabase.rpc('admin_update_user_details', {
        p_target_uid: uid,
        p_updates: snakeCaseUpdates,
    });

    if (error) {
        console.error("Error updating user with RPC:", error);
        throw error;
    }
};

export const bulkUpgradeUsersByAdmin = async (uids: string[]): Promise<void> => {
    const { error } = await supabase.rpc('admin_bulk_upgrade_users', { p_user_ids: uids });
    if (error) {
        console.error("Error bulk upgrading users with RPC:", error);
        throw error;
    }
};

export const bulkAddCreditsByAdmin = async (uids: string[], creditsToAdd: { [key: string]: number }): Promise<void> => {
    const { error } = await supabase.rpc('admin_bulk_add_credits', {
        p_user_ids: uids,
        p_credits_to_add: creditsToAdd,
    });
    if (error) {
        console.error("Error bulk adding credits with RPC:", error);
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
export const decrementLessonPlannerCredits = async (uid: string, amount: number = 1): Promise<void> => {
    const { error } = await supabase.rpc('atomic_decrement_lesson_planner_credits', { p_user_id: uid, p_amount: amount });
    if (error) throw error;
};

export const decrementFlashcardGeneratorCredits = async (uid: string, amount: number = 1): Promise<void> => {
    const { error } = await supabase.rpc('atomic_decrement_flashcard_generator_credits', { p_user_id: uid, p_amount: amount });
    if (error) throw error;
};

export const decrementExamGeneratorCredits = async (uid: string, amount: number = 1): Promise<void> => {
    const { error } = await supabase.rpc('atomic_decrement_exam_generator_credits', { p_user_id: uid, p_amount: amount });
    if (error) throw error;
};

export const decrementWordGameGeneratorCredits = async (uid: string, amount: number = 1): Promise<void> => {
    const { error } = await supabase.rpc('atomic_decrement_word_game_generator_credits', { p_user_id: uid, p_amount: amount });
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
    const { data, error } = await supabase.from('schools').insert(payload).select('id').single();
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
    const { data, error } = await supabase.from('classes').insert(payload).select('id').single();
    if (error) throw error;
    if (!data) throw new Error("Could not add class, no data returned.");
    return data.id;
};

export const updateClass = async (classId: string, updates: Partial<Omit<ClassEntry, 'id' | 'userId'>>): Promise<void> => {
    const payload: Partial<Database['public']['Tables']['classes']['Update']> = {};
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
    return data ? data.data as unknown as TimetableData | null : null;
};

export const saveTimetable = async (userId: string, data: TimetableData): Promise<void> => {
    const payload: Database['public']['Tables']['timetables']['Insert'] = { user_id: userId, data: data as Json };
    const { error } = await supabase.from('timetables').upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
};

// --- Calendar Functions (User-Specific) ---
export const getCustomCalendar = async (userId: string): Promise<CalendarData | null> => {
    const { data, error } = await supabase.from('calendars').select('data').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.data as unknown as CalendarData | null : null;
};

export const saveCustomCalendar = async (userId: string, data: CalendarData): Promise<void> => {
    const payload: Database['public']['Tables']['calendars']['Insert'] = { user_id: userId, data: data as Json };
    const { error } = await supabase.from('calendars').upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
};


// --- Review Functions ---
export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<void> => {
    const reviewData: Database['public']['Tables']['reviews']['Insert'] = {
      user_id: review.userId,
      user_name: review.userName,
      user_avatar: review.userAvatar || null,
      rating: review.rating,
      comment: review.comment,
    };
    const { error } = await supabase.from('reviews').insert(reviewData);
    if (error) throw error;
};

export const getReviews = async (limitCount: number = 5): Promise<Review[]> => {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(limitCount);
    if (error) {
        console.error("Failed to fetch reviews from Supabase:", error);
        return []; // Gracefully return an empty array instead of crashing the app
    }
    const reviewsWithDateObjects: Review[] = (data || []).map((review: DbReview) => {
        return {
            id: review.id,
            userId: review.user_id,
            userName: review.user_name,
            userAvatar: review.user_avatar || undefined,
            rating: review.rating,
            comment: review.comment,
            createdAt: new Date(review.created_at),
        }
    });
    return reviewsWithDateObjects;
};

// --- Saved Lesson Plan Functions ---
export const saveLessonPlan = async (userId: string, name: string, planData: LessonPlan, curriculumContext: SavedLessonPlanContext): Promise<void> => {
    const payload: Database['public']['Tables']['saved_lesson_plans']['Insert'] = {
        user_id: userId,
        name: name,
        plan_data: planData as Json,
        curriculum_context: curriculumContext as Json
    };
    const { error } = await supabase.from('saved_lesson_plans').insert(payload);
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
    
    return (data as DbSavedLessonPlan[] || []).map((dbItem) => {
        return {
            id: dbItem.id,
            userId: dbItem.user_id,
            name: dbItem.name,
            planData: dbItem.plan_data as unknown as LessonPlan,
            createdAt: dbItem.created_at,
            curriculumContext: dbItem.curriculum_context as unknown as SavedLessonPlanContext
        };
    });
};

export const deleteSavedLessonPlan = async (planId: string): Promise<void> => {
    const { error } = await supabase.from('saved_lesson_plans').delete().eq('id', planId);
    if (error) throw error;
};

// --- Saved Exam Functions ---
export const saveExam = async (userId: string, name: string, examData: Exam): Promise<void> => {
    const payload: Database['public']['Tables']['saved_exams']['Insert'] = {
        user_id: userId,
        name,
        exam_data: examData as Json,
    };
    const { error } = await supabase.from('saved_exams').insert(payload);
    if (error) throw error;
};

export const getSavedExams = async (userId: string): Promise<SavedExam[]> => {
    const { data, error } = await supabase.from('saved_exams').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbSavedExam[] || []).map(dbItem => ({
        id: dbItem.id,
        userId: dbItem.user_id,
        name: dbItem.name,
        examData: dbItem.exam_data as unknown as Exam,
        createdAt: dbItem.created_at,
    }));
};

export const deleteSavedExam = async (examId: string): Promise<void> => {
    const { error } = await supabase.from('saved_exams').delete().eq('id', examId);
    if (error) throw error;
};

// --- Saved Flashcard Functions ---
export const saveFlashcard = async (userId: string, name: string, flashcardData: Omit<SavedFlashcard, 'id' | 'userId' | 'createdAt' | 'name'>): Promise<void> => {
    const { error } = await supabase.from('saved_flashcards').insert({
        user_id: userId,
        name,
        prompt: flashcardData.prompt,
        style: flashcardData.style,
        aspect_ratio: flashcardData.aspectRatio,
        image_data: flashcardData.imageData,
    });
    if (error) throw error;
};

export const getSavedFlashcards = async (userId: string): Promise<SavedFlashcard[]> => {
    const { data, error } = await supabase.from('saved_flashcards').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(dbItem => ({
        id: dbItem.id,
        userId: dbItem.user_id,
        name: dbItem.name,
        prompt: dbItem.prompt,
        style: dbItem.style,
        aspectRatio: dbItem.aspect_ratio,
        imageData: dbItem.image_data,
        createdAt: dbItem.created_at,
    }));
};

export const deleteSavedFlashcard = async (flashcardId: string): Promise<void> => {
    const { error } = await supabase.from('saved_flashcards').delete().eq('id', flashcardId);
    if (error) throw error;
};


// --- Saved Canvas Functions ---
export const saveCanvas = async (userId: string, name: string, canvasData: CanvasData): Promise<string> => {
    const { data, error } = await supabase.from('saved_canvases').insert({
        user_id: userId,
        name,
        canvas_data: canvasData as Json,
    }).select('id').single();
    if (error) throw error;
    return data.id;
};

export const updateCanvas = async (canvasId: string, canvasData: CanvasData): Promise<void> => {
    const { error } = await supabase.from('saved_canvases').update({
        canvas_data: canvasData as Json,
    }).eq('id', canvasId);
    if (error) throw error;
};

export const getSavedCanvases = async (userId: string): Promise<SavedCanvas[]> => {
    const { data, error } = await supabase.from('saved_canvases').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(dbItem => ({
        id: dbItem.id,
        userId: dbItem.user_id,
        name: dbItem.name,
        canvasData: dbItem.canvas_data as unknown as CanvasData,
        createdAt: dbItem.created_at,
    }));
};

export const deleteSavedCanvas = async (canvasId: string): Promise<void> => {
    const { error } = await supabase.from('saved_canvases').delete().eq('id', canvasId);
    if (error) throw error;
};

// --- Saved Word Game Functions ---
export const saveWordGame = async (userId: string, name: string, gameType: WordGameType, level: CurriculumLevel, topic: string, gameData: WordGameData): Promise<void> => {
    const { error } = await supabase.from('saved_word_games').insert({
        user_id: userId,
        name,
        game_type: gameType,
        level,
        topic,
        game_data: gameData as Json,
    });
    if (error) throw error;
};