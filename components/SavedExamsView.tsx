import React, { useState, useEffect } from 'react';
import { SavedExam, User } from '../types';
import { getSavedExams, deleteSavedExam } from '../services/dbService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { SparklesIcon, TrashIcon, BookOpenIcon } from './constants';

interface SavedExamsViewProps {
  currentUser: User;
  onLoadExam: (exam: SavedExam) => void;
}

const SavedExamsView: React.FC<SavedExamsViewProps> = ({ currentUser, onLoadExam }) => {
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExams = async () => {
    setIsLoading(true);
    try {
      const exams = await getSavedExams(currentUser.uid);
      setSavedExams(exams);
    } catch (e) {
      setError("Failed to load saved exams.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [currentUser.uid]);

  const handleDelete = async (examId: string) => {
    if (window.confirm("Are you sure you want to delete this saved exam? This action cannot be undone.")) {
      try {
        await deleteSavedExam(examId);
        setSavedExams(prevExams => prevExams.filter(p => p.id !== examId));
      } catch (e) {
        setError("Failed to delete the exam.");
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
          My Saved Exams
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
        </h2>
        <p className="text-[var(--color-text-secondary)] mt-2">Access and manage your previously saved exams.</p>
      </div>

      {isLoading && <LoadingSpinner text="Loading saved exams..." />}
      {error && <ErrorMessage message={error} />}
      
      {!isLoading && !error && (
        savedExams.length === 0 ? (
          <div className="aurora-card text-center py-16">
            <BookOpenIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] opacity-50" />
            <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">No Saved Exams Yet</p>
            <p className="text-sm max-w-md mx-auto text-[var(--color-text-secondary)]">
              When you generate an exam, you'll see an option to save it here for later use.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedExams.map(exam => (
              <div key={exam.id} className="aurora-card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">{exam.name}</h3>
                   <p className="text-xs text-[var(--color-text-secondary)] mt-1 italic">
                    Title: "{exam.examData.title}"
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">Saved on: {new Date(exam.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 mt-4 sm:mt-0">
                  <button onClick={() => onLoadExam(exam)} className="blueprint-button py-2 px-4 rounded-lg text-sm">Load</button>
                  <button onClick={() => handleDelete(exam.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full">
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

export default SavedExamsView;
