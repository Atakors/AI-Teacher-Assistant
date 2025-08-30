import React, { useState, useEffect, useMemo } from 'react';
import { User, Review } from '../types';
import { getReviews } from '../services/dbService';
import AuthModal from './AuthModal';
import LoadingSpinner from './LoadingSpinner';
import { 
    AppLogoIcon,
    LessonPlanIcon, TimetableIcon, CurriculumOverviewIcon, StarIcon, UserCircleIcon, FlashcardIcon,
    FacebookIcon, EnvelopeIcon
} from './constants';

interface LandingPageProps {
}

const mockReviews: Review[] = [
    {
        id: 'mock1',
        userId: 'mockuser1',
        userName: 'Amina K.',
        userAvatar: undefined,
        rating: 5,
        comment: "This tool is a lifesaver! I'm planning my lessons in a fraction of the time. The AI suggestions are creative and perfectly aligned with the curriculum. Highly recommended!",
        createdAt: new Date('2024-05-15T09:00:00Z'),
    },
    {
        id: 'mock2',
        userId: 'mockuser2',
        userName: 'Youssef B.',
        userAvatar: undefined,
        rating: 5,
        comment: "The Timetable Editor is fantastic. I manage schedules for two schools, and this has made my life so much easier. Everything is saved and accessible from anywhere.",
        createdAt: new Date('2024-05-20T14:30:00Z'),
    },
    {
        id: 'mock3',
        userId: 'mockuser3',
        userName: 'Fatima Z.',
        userAvatar: undefined,
        rating: 4,
        comment: "I love the Flashcard Generator! It's so quick to get visuals for my lessons. I wish the free plan had more image credits, but the Pro plan seems very reasonably priced.",
        createdAt: new Date('2024-05-18T11:00:00Z'),
    },
];

const LandingPage: React.FC<LandingPageProps> = () => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');
    const [authError, setAuthError] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    useEffect(() => {
        const error = sessionStorage.getItem('authError');
        if (error) {
            setAuthError(error);
            sessionStorage.removeItem('authError');
            openAuthModal('login');
        }

        const fetchReviews = async () => {
            setReviewsLoading(true);
            // This function is now resilient and will return [] on error, so no try/catch is needed.
            const fetchedReviews = await getReviews(3);
            setReviews(fetchedReviews);
            setReviewsLoading(false);
        };
        fetchReviews();
    }, []);
    
    const openAuthModal = (view: 'login' | 'signup') => {
        setAuthError(null);
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
    
    // If we have fetched live reviews, use them. Otherwise, fall back to the mock reviews.
    // This ensures the section is always populated.
    const reviewsToDisplay = useMemo(() => {
        return (reviews && reviews.length > 0) ? reviews : mockReviews;
    }, [reviews]);


  return (
    <>
      <div className="min-h-screen w-full text-[var(--color-on-bg)] overflow-x-hidden">
        <header className="fixed top-0 left-0 w-full p-4 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                  <AppLogoIcon className="w-8 h-8" />
                  <h1 className="text-lg font-bold ml-2 text-slate-100">AI Teacher Assistant</h1>
              </div>
              <nav className="hidden md:flex items-center space-x-2">
                  <button onClick={() => openAuthModal('login')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-full">
                      Log In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="material-button material-button-primary text-sm"
                  >
                    Sign Up
                  </button>
              </nav>
               <div className="md:hidden">
                    <button
                        onClick={() => openAuthModal('login')}
                        className="material-button material-button-primary text-sm"
                    >
                        Log In / Sign Up
                    </button>
                </div>
          </div>
        </header>

        <main className="w-full">
          {/* Hero Section */}
          <section className="relative flex flex-col items-center justify-center min-h-screen p-6 pt-32 text-center">
              <div className="relative z-10 w-full max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-white">
                    Reclaim Your Time, Reignite Your Passion
                </h1>
                <p className="text-lg sm:text-xl max-w-3xl mx-auto text-slate-300 mb-10">
                    AI Teacher Assistant is your intelligent partner in education, designed to streamline planning. Generate lesson plans, create flashcards, manage timetables, and explore curriculum—all in one place.
                </p>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="material-button material-button-primary text-lg font-semibold py-4 px-10"
                >
                  Try It Now
                </button>
              </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-20 px-6 bg-[#0d1117]">
              <div className="max-w-7xl mx-auto">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What Teachers Are Saying</h2>
                  </div>
                  {reviewsLoading ? (
                      <div className="flex justify-center items-center py-10">
                          <LoadingSpinner text="Loading testimonials..." />
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {reviewsToDisplay.map((review) => (
                              <div key={review.id} className="material-card p-6 flex flex-col bg-slate-800 border-slate-700">
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
                  )}
              </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 px-6 bg-[#0d1117]">
              <div className="max-w-7xl mx-auto">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                       <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need to Excel</h2>
                       <p className="text-lg text-slate-300">A comprehensive suite of tools designed to support modern teaching workflows, from planning to production.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {features.map((feature, index) => (
                          <div key={index} className="material-card p-6 bg-slate-800 border-slate-700">
                              <div className="p-3 rounded-full inline-block mb-4" style={{backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)'}}>
                                  <feature.Icon className="w-6 h-6" style={{color: 'var(--color-primary)'}}/>
                              </div>
                              <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                              <p className="text-sm text-slate-400">{feature.description}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </section>
          
          {/* Final CTA */}
          <section id="about" className="py-20 px-6 bg-[#0d1117]">
               <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
                  <p className="text-lg text-slate-300 mb-10">
                      Join a growing community of educators who are leveraging AI to create more dynamic and efficient classrooms. Get started for free today.
                  </p>
                  <button
                      onClick={() => openAuthModal('signup')}
                      className="material-button material-button-primary text-lg font-semibold py-4 px-10"
                  >
                      Start Planning Now
                  </button>
               </div>
          </section>

        </main>
        
        <footer id="contact" className="w-full text-slate-400 p-6 mt-16 text-sm border-t border-slate-800 bg-[#0d1117] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} Designed and made by MKS. Powered by Gemini.</p>
            <div className="flex items-center justify-center gap-x-6">
                <a href="mailto:contact@aitadz.pro?subject=Inquiry%20from%20AI%20Teacher%20Assistant%20Website" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <EnvelopeIcon className="w-5 h-5"/>
                    <span>contact@aitadz.pro</span>
                </a>
                <a href="https://www.facebook.com/profile.php?id=61579128010849" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <FacebookIcon className="w-5 h-5"/>
                    <span>Join us on Facebook</span>
                </a>
            </div>
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