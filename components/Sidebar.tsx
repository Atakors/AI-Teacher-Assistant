
import React, { useState } from 'react';
import { AppView, ThemeSettings, AccentColor, User, AppState } from '../types';
import { 
  APP_TITLE, APP_VERSION, LessonPlanIcon, TimetableIcon, CurriculumOverviewIcon, SparklesIcon,
  MenuIcon, ChevronLeftIcon, CogIcon, CalendarDaysIcon, UserIcon, LogoutIcon,
  ChevronDownIcon, UserCircleIcon, LockClosedIcon, ChatBubbleOvalLeftEllipsisIcon, ShieldCheckIcon, BookmarkSquareIcon, AcademicCapIcon,
  SaveIcon, FlashcardIcon, CurrencyDollarIcon, BookOpenIcon, LightBulbIcon, PencilIcon
} from './constants';
import ThemeSettingsComponent from './ThemeSettings';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  onEditProfile: () => void;
  onOpenReviewModal: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  themeSettings: ThemeSettings;
  toggleThemeMode: () => void;
  setAccentColor: (color: AccentColor) => void;
}

const NavLink: React.FC<{ view: AppView; label: string; Icon: React.ElementType; activeView: AppView; setActiveView: (view: AppView) => void; isOpen: boolean; isLocked: boolean; }> = ({ view, label, Icon, activeView, setActiveView, isOpen, isLocked }) => {
  return (
    <button
      id={`nav-${view}`}
      onClick={() => setActiveView(view)}
      disabled={isLocked && isOpen}
      className={`flex items-center w-full p-3 my-1 rounded-lg transition-all duration-200 text-left ${activeView === view ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_-3px_var(--color-accent)]' : 'hover:bg-[var(--color-inset-bg)]'} ${isLocked && isOpen ? 'opacity-60 cursor-not-allowed' : ''}`}
      title={isOpen ? '' : label}
    >
      <Icon className={`w-6 h-6 flex-shrink-0 ${activeView === view ? 'text-white' : 'text-[var(--color-accent)]'}`} />
      <span className={`ml-4 font-medium transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 whitespace-nowrap'}`}>{label}</span>
      {isLocked && isOpen && <LockClosedIcon className="w-4 h-4 ml-auto text-yellow-500" />}
    </button>
  );
};

const NavCategory: React.FC<{ title: string; isOpen: boolean; children: React.ReactNode; isExpanded: boolean; onToggle: () => void; Icon: React.ElementType; }> = ({ title, isOpen, children, isExpanded, onToggle, Icon }) => {
  if (!isOpen) {
    return (
      <div className="p-3 my-1 rounded-lg text-left text-[var(--color-text-secondary)]" title={title}>
        <Icon className="w-6 h-6 mx-auto"/>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onToggle} className="flex items-center w-full p-3 my-1 rounded-lg hover:bg-[var(--color-inset-bg)] text-left">
        <Icon className="w-6 h-6 flex-shrink-0 text-[var(--color-text-secondary)]"/>
        <span className="ml-4 font-semibold text-sm uppercase tracking-wider text-[var(--color-text-secondary)]">{title}</span>
        <ChevronDownIcon className={`w-5 h-5 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && <div className="pl-4">{children}</div>}
    </div>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, onEditProfile, onOpenReviewModal, activeView, setActiveView, isOpen, setIsOpen, themeSettings, toggleThemeMode, setAccentColor }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['core', 'creative', 'library']);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    };

    return (
        <div className={`fixed top-0 left-0 h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transition-all duration-300 z-40 ${isOpen ? 'w-80' : 'w-20'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 flex-shrink-0 h-20 border-b border-[var(--color-border)]">
                <div className={`flex items-center transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <SparklesIcon className="w-7 h-7 text-[var(--color-accent)]"/>
                    <h1 className="text-lg font-bold ml-2 whitespace-nowrap">{APP_TITLE}</h1>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-[var(--color-inset-bg)]">
                    {isOpen ? <ChevronLeftIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-grow p-2 overflow-y-auto custom-scrollbar-container">
                 <NavCategory title="Core Tools" isOpen={isOpen} isExpanded={expandedCategories.includes('core')} onToggle={() => toggleCategory('core')} Icon={SparklesIcon}>
                    <NavLink view="lessonPlanner" label="Lesson Planner" Icon={LessonPlanIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="flashcardGenerator" label="Flashcard Generator" Icon={FlashcardIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="flashcardWizard" label="Flashcard Wizard" Icon={LightBulbIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="timetableEditor" label="Timetable Editor" Icon={TimetableIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="examGenerator" label="Exam Generator" Icon={AcademicCapIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="creatorStudio" label="Creator Studio" Icon={PencilIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.role !== 'admin'} />
                </NavCategory>

                 <NavCategory title="Resources" isOpen={isOpen} isExpanded={expandedCategories.includes('resources')} onToggle={() => toggleCategory('resources')} Icon={BookOpenIcon}>
                    <NavLink view="curriculumOverview" label="Curriculum Overview" Icon={CurriculumOverviewIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="schoolCalendar" label="School Calendar" Icon={CalendarDaysIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="pricing" label="Pricing & Plans" Icon={CurrencyDollarIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                </NavCategory>

                 <NavCategory title="My Library" isOpen={isOpen} isExpanded={expandedCategories.includes('library')} onToggle={() => toggleCategory('library')} Icon={BookmarkSquareIcon}>
                    <NavLink view="savedPlans" label="Saved Plans" Icon={SaveIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="savedExams" label="Saved Exams" Icon={SaveIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="savedFlashcards" label="Saved Flashcards" Icon={SaveIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="savedCanvas" label="Saved Canvases" Icon={SaveIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                </NavCategory>
                
                {user.role === 'admin' && (
                     <NavCategory title="Admin" isOpen={isOpen} isExpanded={expandedCategories.includes('admin')} onToggle={() => toggleCategory('admin')} Icon={ShieldCheckIcon}>
                         <NavLink view="adminDashboard" label="Admin Dashboard" Icon={ShieldCheckIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    </NavCategory>
                )}
            </nav>

            {/* Footer / User Area */}
            <div className="p-3 border-t border-[var(--color-border)] flex-shrink-0">
                {isSettingsOpen && isOpen && (
                    <div className="mb-2">
                        <ThemeSettingsComponent settings={themeSettings} onModeToggle={toggleThemeMode} onAccentChange={setAccentColor} />
                    </div>
                )}
                 <div className="relative">
                    {isUserMenuOpen && isOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg">
                           <button onClick={onEditProfile} className="w-full text-left flex items-center p-3 hover:bg-[var(--color-inset-bg)]"><UserIcon className="w-5 h-5 mr-3"/>Profile</button>
                           <button onClick={onOpenReviewModal} className="w-full text-left flex items-center p-3 hover:bg-[var(--color-inset-bg)]"><ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 mr-3"/>Leave a Review</button>
                           <button onClick={onLogout} className="w-full text-left flex items-center p-3 hover:bg-[var(--color-inset-bg)] text-rose-500"><LogoutIcon className="w-5 h-5 mr-3"/>Logout</button>
                        </div>
                    )}
                    <button onClick={() => isOpen && setIsUserMenuOpen(o => !o)} className="flex items-center w-full p-2 rounded-lg hover:bg-[var(--color-inset-bg)]">
                        {user.avatar ? <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full object-cover" /> : <UserCircleIcon className="w-10 h-10 text-[var(--color-border)]" />}
                        <div className={`ml-3 text-left overflow-hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="font-semibold text-sm truncate">{user.name}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] capitalize">{user.plan} Plan</p>
                        </div>
                    </button>
                </div>
                 <div className="flex items-center justify-between mt-2">
                    <button onClick={() => setIsSettingsOpen(s => !s)} className={`p-2 rounded-lg hover:bg-[var(--color-inset-bg)] ${isOpen ? '' : 'mx-auto'}`}>
                        <CogIcon className="w-6 h-6" />
                    </button>
                    {isOpen && <p className="text-xs text-[var(--color-text-secondary)]">v{APP_VERSION}</p>}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
