import React, { useState, useEffect } from 'react';
import { SavedCanvas, User } from '../types';
import { getSavedCanvases, deleteSavedCanvas } from '../services/dbService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { SparklesIcon, TrashIcon, BookOpenIcon } from './constants';

interface SavedCanvasViewProps {
  currentUser: User;
  onLoadCanvas: (canvas: SavedCanvas) => void;
}

const SavedCanvasView: React.FC<SavedCanvasViewProps> = ({ currentUser, onLoadCanvas }) => {
  const [savedCanvases, setSavedCanvases] = useState<SavedCanvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCanvases = async () => {
    setIsLoading(true);
    try {
      const canvases = await getSavedCanvases(currentUser.uid);
      setSavedCanvases(canvases);
    } catch (e) {
      setError("Failed to load saved canvases.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCanvases();
  }, [currentUser.uid]);

  const handleDelete = async (canvasId: string) => {
    if (window.confirm("Are you sure you want to delete this saved canvas? This action cannot be undone.")) {
      try {
        await deleteSavedCanvas(canvasId);
        setSavedCanvases(prev => prev.filter(p => p.id !== canvasId));
      } catch (e) {
        setError("Failed to delete the canvas.");
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
          My Saved Canvases
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
        </h2>
        <p className="text-[var(--color-text-secondary)] mt-2">Access and manage your previously saved designs from the Creator Studio.</p>
      </div>

      {isLoading && <LoadingSpinner text="Loading saved designs..." />}
      {error && <ErrorMessage message={error} />}
      
      {!isLoading && !error && (
        savedCanvases.length === 0 ? (
          <div className="aurora-card text-center py-16">
            <BookOpenIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] opacity-50" />
            <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">No Saved Designs Yet</p>
            <p className="text-sm max-w-md mx-auto text-[var(--color-text-secondary)]">
              When you create a design in the Creator Studio, you'll be able to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCanvases.map(canvas => (
              <div key={canvas.id} className="aurora-card p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="w-full aspect-video bg-[var(--color-inset-bg)] rounded-md mb-3 flex items-center justify-center">
                    <p className="text-xs text-[var(--color-text-secondary)]">Preview</p>
                  </div>
                  <h3 className="font-semibold text-lg text-[var(--color-text-primary)] truncate">{canvas.name}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">Saved on: {new Date(canvas.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 w-full">
                  <button onClick={() => onLoadCanvas(canvas)} className="blueprint-button py-2 px-4 rounded-lg text-sm w-full">Load</button>
                  <button onClick={() => handleDelete(canvas.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full">
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

export default SavedCanvasView;
