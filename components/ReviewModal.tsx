import React, { useState } from 'react';
import { User, Review } from '../types';
import { addReview } from '../services/dbService';
import { XIcon, StarIcon, ChatBubbleOvalLeftEllipsisIcon, CheckIcon } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      setError("Please leave a comment.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const newReview: Omit<Review, 'id' | 'createdAt'> = {
        userId: currentUser.uid,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        rating: rating,
        comment: comment.trim(),
      };
      await addReview(newReview);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state for next time
        setRating(0);
        setComment('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError("Failed to submit review. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const Star = ({ index }: { index: number }) => {
    const fill = (hoverRating || rating) >= index ? 'rgb(251 191 36)' : '#d1d5db'; // amber-400 : gray-300
    return (
      <button
        type="button"
        onMouseEnter={() => setHoverRating(index)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => setRating(index)}
        className="focus:outline-none"
        aria-label={`Rate ${index} star${index > 1 ? 's' : ''}`}
      >
        <StarIcon className="w-8 h-8 transition-colors" style={{ color: fill }} />
      </button>
    );
  };
  
  const modalContent = () => {
    if (isLoading) {
        return <LoadingSpinner text="Submitting your review..." />;
    }
    if (success) {
        return (
            <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Thank You!</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Your feedback has been received.</p>
            </div>
        );
    }
    return (
        <form onSubmit={handleSubmit}>
            <div className="text-center mb-6">
                <ChatBubbleOvalLeftEllipsisIcon className="w-12 h-12 mx-auto text-[var(--color-accent)]" />
                <h2 className="text-2xl font-bold mt-2 text-slate-800 dark:text-white">
                    Leave a Review
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Your feedback helps us improve the app for everyone.
                </p>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-center text-slate-700 dark:text-slate-300 mb-2">
                        How would you rate your experience?
                    </label>
                    <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} index={i} />)}
                    </div>
                </div>
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Your Comment
                    </label>
                    <textarea
                        id="comment"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us what you liked or what could be improved..."
                        className="w-full p-3 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 resize-y"
                    />
                </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg text-sm blueprint-button-secondary">
                    Cancel
                </button>
                <button type="submit" className="py-2 px-4 rounded-lg text-sm text-white blueprint-button">
                    Submit Review
                </button>
            </div>
        </form>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl text-slate-900 dark:text-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors z-20">
          <XIcon className="w-6 h-6" />
        </button>
        <div className="p-8">
            {modalContent()}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;