import React, { useState } from 'react';
import { User, Review } from '../types';
import { addReview } from '../services/dbService';
import { XIcon, StarIcon, ChatBubbleOvalLeftEllipsisIcon, CheckIcon } from './constants';
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
    if (rating === 0 || !comment.trim()) {
      setError("Please select a rating and leave a comment.");
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
    const fill = (hoverRating || rating) >= index ? 'rgb(251 191 36)' : 'var(--color-border)'; // amber-400
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
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold">Thank You!</h3>
                <p className="text-[var(--color-text-secondary)] mt-2">Your feedback has been received.</p>
            </div>
        );
    }
    return (
        <form onSubmit={handleSubmit}>
            <div className="text-center mb-6">
                <ChatBubbleOvalLeftEllipsisIcon className="w-12 h-12 mx-auto text-[var(--color-accent)]" />
                <h2 className="text-2xl font-bold mt-2">
                    Leave a Review
                </h2>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    Your feedback helps us improve the app for everyone.
                </p>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-center text-[var(--color-text-secondary)] mb-2">
                        How would you rate your experience?
                    </label>
                    <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} index={i} />)}
                    </div>
                </div>
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        Your Comment
                    </label>
                    <textarea
                        id="comment"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us what you liked or what could be improved..."
                        className="w-full p-3 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] border border-[var(--color-border)] bg-[var(--color-input-bg)] resize-y"
                    />
                </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="zenith-button-secondary py-2 px-4 rounded-lg text-sm">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={rating === 0 || !comment.trim()}
                    className="zenith-button py-2 px-4 rounded-lg text-sm"
                >
                    Submit Review
                </button>
            </div>
        </form>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-md bg-[var(--color-surface)] rounded-xl shadow-2xl text-[var(--color-text-primary)] overflow-hidden" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors z-20">
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