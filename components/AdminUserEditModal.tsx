import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { XIcon } from './constants';

interface AdminUserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (userId: string, updates: Partial<User>) => void;
}

// Helper to format Date object or ISO string to 'YYYY-MM-DD' for date input
const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
};


const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [plan, setPlan] = useState<'free' | 'pro'>(user.plan);
  const [role, setRole] = useState<'user' | 'admin'>(user.role);
  const [startDate, setStartDate] = useState(formatDateForInput(user.subscriptionStartDate));
  const [endDate, setEndDate] = useState(formatDateForInput(user.subscriptionEndDate));

  // State for all five new credit types
  const [lessonPlannerCredits, setLessonPlannerCredits] = useState(user.lessonPlannerCredits);
  const [flashcardGeneratorCredits, setFlashcardGeneratorCredits] = useState(user.flashcardGeneratorCredits);
  const [examGeneratorCredits, setExamGeneratorCredits] = useState(user.examGeneratorCredits);
  const [wordGameGeneratorCredits, setWordGameGeneratorCredits] = useState(user.wordGameGeneratorCredits);

  // Auto-calculate end date when start date changes
  useEffect(() => {
    if (startDate) {
        const newStartDate = new Date(startDate);
        if (!isNaN(newStartDate.getTime())) {
            const newEndDate = new Date(newStartDate);
            newEndDate.setMonth(newStartDate.getMonth() + 1);
            setEndDate(formatDateForInput(newEndDate.toISOString()));
        }
    } else {
        setEndDate('');
    }
  }, [startDate]);
  
  // Auto-populate Pro credits when plan is changed to 'pro'
  useEffect(() => {
    if (plan === 'pro') {
      setLessonPlannerCredits(50);
      setFlashcardGeneratorCredits(50);
      setExamGeneratorCredits(10);
      setWordGameGeneratorCredits(20);
    }
  }, [plan]);


  const handleSave = () => {
    const updates: Partial<User> = {
      plan,
      role,
      subscriptionStartDate: startDate ? new Date(startDate).toISOString() : null,
      subscriptionEndDate: endDate ? new Date(endDate).toISOString() : null,
      lessonPlannerCredits: Number(lessonPlannerCredits),
      flashcardGeneratorCredits: Number(flashcardGeneratorCredits),
      examGeneratorCredits: Number(examGeneratorCredits),
      wordGameGeneratorCredits: Number(wordGameGeneratorCredits),
    };
    onSave(user.uid, updates);
  };
  
  if (!isOpen) return null;
  const inputClasses = "w-full p-3";
  const labelClasses = "text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block";

  const CreditInput: React.FC<{ label: string; value: number; onChange: (val: number) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className={labelClasses}>{label}</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className={inputClasses} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="relative material-card text-[var(--color-on-surface)] overflow-hidden">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors z-20">
            <XIcon className="w-6 h-6" />
          </button>
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-1">Edit User</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">{user.name} ({user.email})</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Plan</label>
                  <select value={plan} onChange={e => setPlan(e.target.value as 'free' | 'pro')} className={inputClasses}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Role</label>
                  <select value={role} onChange={e => setRole(e.target.value as any)} className={inputClasses}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-outline)]">
                <h4 className="text-md font-semibold mb-2 text-[var(--color-on-surface-variant)]">Feature Credits</h4>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                    <CreditInput label="Lesson" value={lessonPlannerCredits} onChange={setLessonPlannerCredits} />
                    <CreditInput label="Flashcard" value={flashcardGeneratorCredits} onChange={setFlashcardGeneratorCredits} />
                    <CreditInput label="Exam" value={examGeneratorCredits} onChange={setExamGeneratorCredits} />
                    <CreditInput label="Word Game" value={wordGameGeneratorCredits} onChange={setWordGameGeneratorCredits} />
                </div>
              </div>
              
               <div className="pt-4 border-t border-[var(--color-outline)]">
                 <h4 className="text-md font-semibold mb-2 text-[var(--color-on-surface-variant)]">Subscription Dates</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Subscription Start</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Subscription End</label>
                    <input type="date" value={endDate} readOnly className={`${inputClasses} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--color-outline)]">
              <button type="button" onClick={onClose} className="material-button material-button-secondary text-sm">Cancel</button>
              <button type="button" onClick={handleSave} className="material-button material-button-primary text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserEditModal;