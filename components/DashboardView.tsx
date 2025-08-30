import React, { useState, useEffect, useRef } from 'react';
import { User, AppView, ThemeSettings, AccentColor } from '../types';
import { getSavedLessonPlans, getSavedExams, getSavedFlashcards } from '../services/dbService';
import { SparklesIcon, CheckBadgeIcon, LessonPlanIcon, PhotoIcon, AcademicCapIcon, BookmarkSquareIcon, ChevronRightIcon, PencilIcon, TimetableIcon, CogIcon, ChatBubbleOvalLeftEllipsisIcon, DocumentDuplicateIcon, PuzzlePieceIcon } from './constants';
import LoadingSpinner from './LoadingSpinner';
import ThemeSettingsComponent from './ThemeSettings';

interface DashboardViewProps {
  currentUser: User;
  onOpenPremiumModal: (featureName?: string) => void;
  setActiveView: (view: AppView) => void;
  onEditProfile: () => void;
  onOpenReviewModal: () => void;
  themeSettings: ThemeSettings;
  toggleThemeMode: () => void;
  setAccentColor: (color: AccentColor) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; description: string; Icon: React.ElementType; action?: () => void; actionLabel?: string; }> = ({ title, value, description, Icon, action, actionLabel }) => (
  <div className="material-card p-6 flex flex-col justify-between">
    <div>
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">{title}</p>
        <div className="p-2 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}>
          <Icon className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
      </div>
      <p className="text-3xl font-bold text-[var(--color-on-surface)] mt-2">{value}</p>
      <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{description}</p>
    </div>
    {action && actionLabel && (
      <button onClick={action} className="material-button material-button-secondary text-sm mt-4 w-full">
        {actionLabel}
      </button>
    )}
  </div>
);

const QuickLink: React.FC<{ title: string; description: string; Icon: React.ElementType; onClick: () => void }> = ({ title, description, Icon, onClick }) => (
    <button onClick={onClick} className="material-card p-6 text-left w-full hover:border-[var(--color-primary)] transition-colors">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="p-3 rounded-full mr-4" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}>
                    <Icon className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div>
                    <h4 className="font-semibold text-lg text-[var(--color-on-surface)]">{title}</h4>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">{description}</p>
                </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-[var(--color-on-surface-variant)]" />
        </div>
    </button>
);

const CreditBalanceGrid: React.FC<{ user: User, onUpgradeClick: () => void }> = ({ user, onUpgradeClick }) => {
    const credits = [
        { name: "Lesson Planner", value: user.lessonPlannerCredits, Icon: LessonPlanIcon },
        { name: "Flashcards", value: user.flashcardGeneratorCredits, Icon: PhotoIcon },
        { name: "Exam Gen", value: user.examGeneratorCredits, Icon: AcademicCapIcon },
        { name: "Word Games", value: user.wordGameGeneratorCredits, Icon: PuzzlePieceIcon },
    ];

    return (
        <div className="material-card p-6">
            <h3 className="text-lg font-semibold text-[var(--color-on-surface)] mb-4">Your Credit Balances</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {credits.map(credit => (
                    <div key={credit.name} className="p-4 rounded-lg text-center bg-[var(--color-surface-variant)]">
                        <credit.Icon className="w-8 h-8 mx-auto text-[var(--color-primary)]" />
                        <p className="text-2xl font-bold mt-2 text-[var(--color-on-surface)]">{credit.value}</p>
                        <p className="text-xs font-medium text-[var(--color-on-surface-variant)]">{credit.name}</p>
                    </div>
                ))}
            </div>
            <button onClick={onUpgradeClick} className="material-button material-button-secondary text-sm mt-6 w-full">
                Buy More Credits or Upgrade Plan
            </button>
        </div>
    );
};


const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onOpenPremiumModal, setActiveView, onEditProfile, onOpenReviewModal, themeSettings, toggleThemeMode, setAccentColor }) => {
    const [counts, setCounts] = useState<{ plans: number; exams: number; flashcards: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
    const themeSettingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCounts = async () => {
            setIsLoading(true);
            try {
                if (currentUser.plan !== 'free') { 
                    const [plans, exams, flashcards] = await Promise.all([
                        getSavedLessonPlans(currentUser.uid),
                        getSavedExams(currentUser.uid),
                        getSavedFlashcards(currentUser.uid)
                    ]);
                    setCounts({ plans: plans.length, exams: exams.length, flashcards: flashcards.length });
                } else {
                    setCounts(null); 
                }
            } catch (error) {
                console.error("Failed to fetch dashboard counts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();
    }, [currentUser.uid, currentUser.plan]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeSettingsRef.current && !themeSettingsRef.current.contains(event.target as Node)) {
                setIsThemeSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [themeSettingsRef]);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-on-bg)]">
                        Welcome back, {currentUser.name.split(' ')[0]}!
                    </h1>
                    <p className="text-[var(--color-on-surface-variant)] mt-2">Here's a summary of your account and quick access to your tools.</p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button onClick={onEditProfile} className="material-button material-button-secondary text-sm flex items-center gap-2">
                        <PencilIcon className="w-4 h-4" /> Edit Profile
                    </button>
                    <div className="relative" ref={themeSettingsRef}>
                        <button onClick={() => setIsThemeSettingsOpen(p => !p)} className="material-button material-button-secondary text-sm flex items-center gap-2">
                            <CogIcon className="w-4 h-4" /> Theme Settings
                        </button>
                        {isThemeSettingsOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 z-20">
                                <ThemeSettingsComponent settings={themeSettings} onModeToggle={toggleThemeMode} onAccentChange={setAccentColor} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isLoading ? <LoadingSpinner text="Loading dashboard..." /> :
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">
                        <StatCard 
                            title="Subscription Plan"
                            value={currentUser.plan === 'pro' ? 'Pro Co-Pilot' : 'Explorer Plan'}
                            description={currentUser.plan === 'pro' ? "You have access to all features." : "Free plan with starter credits."}
                            Icon={CheckBadgeIcon}
                        />
                         {counts && currentUser.plan !== 'free' && (
                            <StatCard 
                                title="Saved Items in Library"
                                value={counts.plans + counts.exams + counts.flashcards}
                                description={`${counts.plans} Plans, ${counts.exams} Exams, ${counts.flashcards} Flashcards`}
                                Icon={BookmarkSquareIcon}
                                action={() => setActiveView('savedPlans')}
                                actionLabel="View My Library"
                            />
                        )}
                    </div>
                    <CreditBalanceGrid user={currentUser} onUpgradeClick={() => setActiveView('pricing')} />
                </div>
            }

            <div className="pt-8">
                <h2 className="text-2xl font-bold text-[var(--color-on-bg)] mb-4">Quick Actions</h2>
                <div className="space-y-4">
                    <QuickLink 
                        title="Create a New Lesson Plan"
                        description="Generate a detailed lesson plan from curriculum objectives."
                        Icon={LessonPlanIcon}
                        onClick={() => setActiveView('lessonPlanner')}
                    />
                    <QuickLink 
                        title="Create a New Exam"
                        description="Build custom exams from curriculum content or your own topics."
                        Icon={AcademicCapIcon}
                        onClick={() => setActiveView('examGenerator')}
                    />
                     <QuickLink 
                        title="Manage My Timetable"
                        description="Organize your schools, classes, and weekly schedule."
                        Icon={TimetableIcon}
                        onClick={() => setActiveView('timetableEditor')}
                    />
                    <QuickLink 
                        title="Leave a Review"
                        description="Share your feedback to help us improve."
                        Icon={ChatBubbleOvalLeftEllipsisIcon}
                        onClick={onOpenReviewModal}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardView;