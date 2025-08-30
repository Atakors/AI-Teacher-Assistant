
import React, { useState, useEffect } from 'react';
import { User, SavedCanvas } from '../types';
import { getSavedCanvases, deleteSavedCanvas } from '../services/dbService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { SparklesIcon, TrashIcon, PencilIcon } from './constants';

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
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to load saved canvases: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCanvases();
  }, [currentUser.uid]);

  const handleDelete = async (canvasId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this canvas? This action cannot be undone.")) {
      try {
        await deleteSavedCanvas(canvasId);
        setSavedCanvases(prev => prev.filter(c => c.id !== canvasId));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to delete the canvas: ${errorMessage}`);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading saved canvases..." />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
          My Saved Canvases
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
        </h2>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Access and manage your previously saved designs from the Creator Studio.</p>
      </div>
      
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && (
        savedCanvases.length === 0 ? (
          <div className="material-card text-center py-16">
            <PencilIcon className="w-16 h-16 mx-auto text-[var(--color-on-surface-variant)] opacity-50" />
            <p className="mt-4 text-lg font-medium text-[var(--color-on-surface)]">No Saved Canvases Yet</p>
            <p className="text-sm max-w-md mx-auto text-[var(--color-on-surface-variant)]">
              When you save a design in the Creator Studio, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCanvases.map(canvas => (
              <div key={canvas.id} className="material-card p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="w-full aspect-[1/1.414] bg-[var(--color-surface-variant)] rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    <PencilIcon className="w-24 h-24 text-[var(--color-outline)]" />
                  </div>
                  <h3 className="font-semibold text-lg text-[var(--color-on-surface)] truncate" title={canvas.name}>{canvas.name}</h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Saved on: {new Date(canvas.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 w-full">
                  <button onClick={() => onLoadCanvas(canvas)} className="material-button material-button-primary text-sm w-full">Load</button>
                  <button onClick={() => handleDelete(canvas.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full" aria-label={`Delete ${canvas.name}`}>
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
