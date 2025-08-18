import React, { useState, useEffect } from 'react';
import { User, Review } from '../types';
import { getReviews } from '../services/dbService';
import AuthModal from './AuthModal';
import { 
    SparklesIcon, HeroAppPreview,
    LessonPlanIcon, TimetableIcon, CurriculumOverviewIcon, StarIcon, UserCircleIcon, FlashcardIcon
} from './constants';

interface LandingPageProps {
  // onLogin prop is no longer needed, App.tsx's auth listener handles it.
}

const LandingPage: React.FC<LandingPageProps> = () => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');
    const [authError, setAuthError] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        // Check for any auth errors passed via sessionStorage (e.g., from OAuth redirect)
        const error = sessionStorage.getItem('authError');
        if (error) {
            setAuthError(error);
            sessionStorage.removeItem('authError');
            openAuthModal('login'); // Open modal to show the error
        }

        const fetchReviews = async () => {
            try {
                const fetchedReviews = await getReviews(3);
                setReviews(fetchedReviews);
            } catch (e) {
                console.error("Could not fetch reviews", e);
            }
        };
        fetchReviews();
    }, []);
    
    const openAuthModal = (view: 'login' | 'signup') => {
        setAuthError(null); // Clear previous errors when opening manually
        setAuthModalView(view);
        setIsAuthModalOpen(true);
    };

    const features = [
        {
            title: "AI Lesson Planner",
            description: "Go from a curriculum objective to a detailed, creative lesson plan in seconds.",
            Icon: LessonPlanIcon,
        },
        {
            title: "Flashcard Generator",
            description: "Create beautiful, styled images for your flashcards instantly with AI.",
            Icon: FlashcardIcon,
        },
        {
            title: "Timetable Editor",
            description: "Build and manage your entire school schedule with a powerful, persistent database.",
            Icon: TimetableIcon,
        },
        {
            title: "Curriculum & Calendar",
            description: "Navigate the complete curriculum and personalize the school calendar with ease.",
            Icon: CurriculumOverviewIcon,
        },
    ];

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-amber-400' : 'text-slate-600'}`} />
                ))}
            </div>
        );
    };

  return (
    <>
      <div className="min-h-screen w-full text-slate-300 overflow-x-hidden">
        <header className="fixed top-0 left-0 w-full p-4 z-50 bg-[#0B0F19]/80 backdrop-blur-sm border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                  <SparklesIcon className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
                  <h1 className="text-lg font-bold ml-2 text-slate-100">AI Teacher Assistant</h1>
              </div>
              <nav className="hidden md:flex items-center space-x-4">
                  <button onClick={() => openAuthModal('login')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                      Log In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="blueprint-button text-sm py-2 px-5 rounded-lg"
                  >
                    Sign Up
                  </button>
              </nav>
               <div className="md:hidden">
                    <button
                        onClick={() => openAuthModal('login')}
                        className="blueprint-button text-sm py-2 px-5 rounded-lg"
                    >
                        Log In / Sign Up
                    </button>
                </div>
          </div>
        </header>

        <main className="w-full">
          {/* Hero Section */}
          <section className="relative flex flex-col items-center justify-center min-h-screen p-6 pt-32">
              <div className="relative z-20 w-full max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-white">
                            Reclaim Your Time, Reignite Your Passion
                        </h1>
                        <p className="text-lg sm:text-xl max-w-xl mx-auto md:mx-0 text-slate-300 mb-10">
                            AI Teacher Assistant is your intelligent partner in education, designed to streamline planning. Generate lesson plans, create flashcards, manage timetables, and explore curriculum—all in one place.
                        </p>
                        <button
                          onClick={() => openAuthModal('signup')}
                          className="blueprint-button text-lg font-semibold py-4 px-10 rounded-lg"
                        >
                          Try It Now
                        </button>
                    </div>
                    <div className="hidden md:block">
                         <HeroAppPreview className="w-full h-auto" />
                    </div>
                </div>
              </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 px-6">
              <div className="max-w-7xl mx-auto">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                       <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need to Excel</h2>
                       <p className="text-lg text-slate-300">A comprehensive suite of tools designed to support modern teaching workflows, from planning to production.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {features.map((feature, index) => (
                          <div key={index} className="feature-card p-6 rounded-lg">
                              <div className="p-2 rounded-lg inline-block mb-4" style={{backgroundColor: 'rgba(var(--color-accent-rgb), 0.1)', border: '1px solid rgba(var(--color-accent-rgb), 0.3)'}}>
                                  <feature.Icon className="w-6 h-6" style={{color: 'var(--color-accent)'}}/>
                              </div>
                              <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                              <p className="text-sm text-slate-400">{feature.description}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </section>

          {/* Testimonials Section */}
          {reviews.length > 0 && (
              <section className="py-20 px-6">
                  <div className="max-w-7xl mx-auto">
                      <div className="text-center max-w-3xl mx-auto mb-16">
                          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What Teachers Are Saying</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {reviews.map((review) => (
                              <div key={review.id} className="feature-card p-6 rounded-lg flex flex-col">
                                  <div className="flex-grow mb-4">
                                      {renderStars(review.rating)}
                                      <p className="text-slate-300 mt-4 italic">"{review.comment}"</p>
                                  </div>
                                  <div className="flex items-center mt-auto pt-4 border-t border-slate-700">
                                      {review.userAvatar ? (
                                          <img src={review.userAvatar} alt={review.userName} className="w-10 h-10 rounded-full object-cover" />
                                      ) : (
                                          <UserCircleIcon className="w-10 h-10 text-slate-500" />
                                      )}
                                      <div className="ml-3">
                                          <p className="font-semibold text-white">{review.userName}</p>
                                          <p className="text-xs text-slate-400">Verified Teacher</p>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </section>
          )}
          
          {/* Final CTA */}
          <section id="about" className="py-20 px-6">
               <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
                  <p className="text-lg text-slate-300 mb-10">
                      Join a growing community of educators who are leveraging AI to create more dynamic and efficient classrooms. Get started for free today.
                  </p>
                  <button
                      onClick={() => openAuthModal('signup')}
                      className="blueprint-button text-lg font-semibold py-4 px-10 rounded-lg"
                  >
                      Start Planning Now
                  </button>
               </div>
          </section>

        </main>
        
        <footer id="contact" className="w-full text-slate-400 text-center p-6 mt-16 text-sm border-t border-slate-800">
            <p>&copy; {new Date().getFullYear()} Designed and made by MKS. Powered by Gemini.</p>
            <p className="mt-2">Contact: <a href="mailto:dz.ai.teacher.assistant@gmail.com" className="hover:text-white underline">dz.ai.teacher.assistant@gmail.com</a></p>
        </footer>
      </div>

      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialView={authModalView}
          initialError={authError}
        />
      )}
    </>
  );
};

export default LandingPage;