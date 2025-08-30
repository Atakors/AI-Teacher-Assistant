
import React, { useState, useEffect } from 'react';
import { SavedFlashcard, User } from '../types';
import { getSavedFlashcards, deleteSavedFlashcard } from '../services/dbService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { SparklesIcon, TrashIcon, BookOpenIcon } from './constants';

interface SavedFlashcardsViewProps {
  currentUser: User;
  onLoadFlashcard: (flashcard: SavedFlashcard) => void;
}

const SavedFlashcardsView: React.FC<SavedFlashcardsViewProps> = ({ currentUser, onLoadFlashcard }) => {
  const [savedFlashcards, setSavedFlashcards] = useState<SavedFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFlashcards = async () => {
    setIsLoading(true);
    try {
      const flashcards = await getSavedFlashcards(currentUser.uid);
      setSavedFlashcards(flashcards);
    } catch (e) {
      setError("Failed to load saved flashcards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, [currentUser.uid]);

  const handleDelete = async (flashcardId: string) => {
    if (window.confirm("Are you sure you want to delete this saved flashcard? This action cannot be undone.")) {
      try {
        await deleteSavedFlashcard(flashcardId);
        setSavedFlashcards(prev => prev.filter(p => p.id !== flashcardId));
      } catch (e) {
        setError("Failed to delete the flashcard.");
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
          My Saved Flashcards
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
        </h2>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Access and manage your previously generated flashcards.</p>
      </div>

      {isLoading && <LoadingSpinner text="Loading saved flashcards..." />}
      {error && <ErrorMessage message={error} />}
      
      {!isLoading && !error && (
        savedFlashcards.length === 0 ? (
          <div className="material-card text-center py-16">
            <BookOpenIcon className="w-16 h-16 mx-auto text-[var(--color-on-surface-variant)] opacity-50" />
            <p className="mt-4 text-lg font-medium text-[var(--color-on-surface)]">No Saved Flashcards Yet</p>
            <p className="text-sm max-w-md mx-auto text-[var(--color-on-surface-variant)]">
              When you generate a flashcard, you'll see an option to save it here for later use.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedFlashcards.map(flashcard => (
              <div key={flashcard.id} className="material-card p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="w-full aspect-square bg-[var(--color-surface-variant)] rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    <img src={flashcard.imageData} alt={flashcard.name} className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-semibold text-lg text-[var(--color-on-surface)] truncate">{flashcard.name}</h3>
                   <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 italic truncate">
                    Prompt: "{flashcard.prompt}"
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Saved on: {new Date(flashcard.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 w-full">
                  <button onClick={() => onLoadFlashcard(flashcard)} className="material-button material-button-primary text-sm w-full">Load</button>
                  <button onClick={() => handleDelete(flashcard.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full">
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

export default SavedFlashcardsView;
