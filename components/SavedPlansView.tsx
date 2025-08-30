import React, { useState, useEffect } from 'react';
import { SavedLessonPlan, User } from '../types';
import { getSavedLessonPlans, deleteSavedLessonPlan } from '../services/dbService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { SparklesIcon, TrashIcon, BookOpenIcon } from './constants';

interface SavedPlansViewProps {
  currentUser: User;
  onLoadPlan: (plan: SavedLessonPlan) => void;
}

const SavedPlansView: React.FC<SavedPlansViewProps> = ({ currentUser, onLoadPlan }) => {
  const [savedPlans, setSavedPlans] = useState<SavedLessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const plans = await getSavedLessonPlans(currentUser.uid);
      setSavedPlans(plans);
    } catch (e) {
      setError("Failed to load saved plans.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [currentUser.uid]);

  const handleDelete = async (planId: string) => {
    if (window.confirm("Are you sure you want to delete this saved plan? This action cannot be undone.")) {
      try {
        await deleteSavedLessonPlan(planId);
        setSavedPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
      } catch (e) {
        setError("Failed to delete the plan.");
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
          My Saved Plans
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
        </h2>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Access and manage your previously saved lesson plans.</p>
      </div>

      {isLoading && <LoadingSpinner text="Loading saved plans..." />}
      {error && <ErrorMessage message={error} />}
      
      {!isLoading && !error && (
        savedPlans.length === 0 ? (
          <div className="material-card text-center py-16">
            <BookOpenIcon className="w-16 h-16 mx-auto text-[var(--color-on-surface-variant)] opacity-50" />
            <p className="mt-4 text-lg font-medium text-[var(--color-on-surface)]">No Saved Plans Yet</p>
            <p className="text-sm max-w-md mx-auto text-[var(--color-on-surface-variant)]">
              When you generate a lesson plan, you'll see an option to save it here for later use.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPlans.map(plan => (
              <div key={plan.id} className="material-card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg text-[var(--color-on-surface)]">{plan.name}</h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                    {plan.curriculumContext.curriculumLevel} &gt; {plan.curriculumContext.sequenceName} &gt; {plan.curriculumContext.sectionName}
                  </p>
                   <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 italic">
                    Lesson: "{plan.curriculumContext.lessonName}"
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Saved on: {new Date(plan.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 mt-4 sm:mt-0">
                  <button onClick={() => onLoadPlan(plan)} className="material-button material-button-primary text-sm">Load</button>
                  <button onClick={() => handleDelete(plan.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default SavedPlansView;
