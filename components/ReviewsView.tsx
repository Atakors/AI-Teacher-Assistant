import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import { getReviews } from '../services/dbService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { StarIcon, UserCircleIcon, SparklesIcon, ChatBubbleOvalLeftEllipsisIcon } from './constants';

const ReviewsView: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true);
            try {
                const fetchedReviews = await getReviews(20); // Get more reviews for this page
                setReviews(fetchedReviews);
            } catch (e) {
                setError("Could not fetch reviews at this time. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-amber-400' : 'text-[var(--color-outline)]'}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
                    What Our Users Say
                    <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
                </h2>
                <p className="text-[var(--color-on-surface-variant)] mt-2">
                    Feedback from teachers using the AI Assistant.
                </p>
            </div>

            {isLoading && <LoadingSpinner text="Loading testimonials..." />}
            {error && <ErrorMessage message={error} />}

            {!isLoading && !error && (
                reviews.length === 0 ? (
                    <div className="material-card text-center py-16">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 mx-auto text-[var(--color-on-surface-variant)] opacity-50" />
                        <p className="mt-4 text-lg font-medium text-[var(--color-on-surface)]">No Reviews Yet</p>
                        <p className="text-sm max-w-md mx-auto text-[var(--color-on-surface-variant)]">
                            Be the first to leave a review! You can do so from your dashboard.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="material-card p-6 flex flex-col">
                                <div className="flex-grow mb-4">
                                    {renderStars(review.rating)}
                                    <p className="text-[var(--color-on-surface)] mt-4 italic">"{review.comment}"</p>
                                </div>
                                <div className="flex items-center mt-auto pt-4 border-t border-[var(--color-outline)]">
                                    {review.userAvatar ? (
                                        <img src={review.userAvatar} alt={review.userName} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <UserCircleIcon className="w-10 h-10 text-[var(--color-on-surface-variant)]" />
                                    )}
                                    <div className="ml-3">
                                        <p className="font-semibold text-[var(--color-on-surface)]">{review.userName}</p>
                                        <p className="text-xs text-[var(--color-on-surface-variant)]">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default ReviewsView;