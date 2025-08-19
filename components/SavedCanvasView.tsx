
import React from 'react';
import { User, SavedCanvas } from '../types';

interface SavedCanvasViewProps {
  currentUser: User;
  onLoadCanvas: (canvas: SavedCanvas) => void;
}

const SavedCanvasView: React.FC<SavedCanvasViewProps> = ({ currentUser, onLoadCanvas }) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text-primary)]">
          My Saved Canvases
        </h2>
        <p className="text-[var(--color-text-secondary)] mt-2">
          This feature is under construction. Your saved worksheets and designs will appear here.
        </p>
      </div>
    </div>
  );
};

export default SavedCanvasView;
