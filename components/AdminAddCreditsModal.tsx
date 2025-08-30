import React, { useState } from 'react';
import { XIcon, PlusIcon } from './constants';

interface AdminAddCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCredits: (creditsToAdd: { [key: string]: number }) => void;
  selectedUserCount: number;
  isProcessing: boolean;
}

const AdminAddCreditsModal: React.FC<AdminAddCreditsModalProps> = ({ isOpen, onClose, onAddCredits, selectedUserCount, isProcessing }) => {
  const [credits, setCredits] = useState({
    lessonPlannerCredits: 0,
    flashcardGeneratorCredits: 0,
    examGeneratorCredits: 0,
    wordGameGeneratorCredits: 0,
  });

  if (!isOpen) return null;

  const handleCreditChange = (key: keyof typeof credits, value: string) => {
    setCredits(prev => ({ ...prev, [key]: Math.max(0, parseInt(value) || 0) }));
  };

  const handleSubmit = () => {
    onAddCredits(credits);
  };

  const inputClasses = "w-full p-3";
  const labelClasses = "text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block";

  const CreditInput: React.FC<{ label: string; value: number; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
    <div>
      <label className={labelClasses}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} className={inputClasses} min="0" />
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
            <h3 className="text-xl font-semibold mb-1">Add Credits</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">
              You are adding credits to {selectedUserCount} selected user(s). The amount you enter will be added to each user's current balance.
            </p>

            <div className="space-y-4">
              <div className="pt-4 border-t border-[var(--color-outline)]">
                <h4 className="text-md font-semibold mb-2 text-[var(--color-on-surface-variant)]">Credits to Add</h4>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <CreditInput label="Lesson" value={credits.lessonPlannerCredits} onChange={(val) => handleCreditChange('lessonPlannerCredits', val)} />
                  <CreditInput label="Flashcard" value={credits.flashcardGeneratorCredits} onChange={(val) => handleCreditChange('flashcardGeneratorCredits', val)} />
                  <CreditInput label="Exam" value={credits.examGeneratorCredits} onChange={(val) => handleCreditChange('examGeneratorCredits', val)} />
                  <CreditInput label="Word Game" value={credits.wordGameGeneratorCredits} onChange={(val) => handleCreditChange('wordGameGeneratorCredits', val)} />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--color-outline)]">
              <button type="button" onClick={onClose} className="material-button material-button-secondary text-sm">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={isProcessing} className="material-button material-button-primary text-sm flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                {isProcessing ? 'Adding...' : 'Add Credits'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAddCreditsModal;