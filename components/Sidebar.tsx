import React, { useState } from 'react';
import { AppView, ThemeSettings, AccentColor, User } from '../types';
import { 
  APP_TITLE, APP_VERSION, LessonPlanIcon, TimetableIcon, CurriculumOverviewIcon, SparklesIcon,
  MenuIcon, ChevronLeftIcon, CogIcon, CalendarDaysIcon, UserIcon, LogoutIcon,
  ChevronDownIcon, UserCircleIcon, LockClosedIcon, ChatBubbleOvalLeftEllipsisIcon, ShieldCheckIcon, BookmarkSquareIcon, AcademicCapIcon,
  SaveIcon, PencilIcon as CreatorStudioIcon, FlashcardIcon
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
        <Icon className="w-6 h-6 mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-3 my-1 rounded-lg hover:bg-[var(--color-inset-bg)] text-left"
      >
        <div className="flex items-center">
            <Icon className="w-6 h-6 flex-shrink-0 text-[var(--color-accent)]" />
            <span className="ml-4 font-medium">{title}</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && <div className="ml-6 pl-3 border-l-2 border-[var(--color-border)]">{children}</div>}
    </div>
  );
};


const Sidebar: React.FC<SidebarProps> = ({
  user, onLogout, onEditProfile, onOpenReviewModal, activeView, setActiveView, isOpen, setIsOpen,
  themeSettings, toggleThemeMode, setAccentColor
}) => {
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  const [creationToolsCategoryExpanded, setCreationToolsCategoryExpanded] = useState(['examGenerator', 'creatorStudio'].includes(activeView));
  const [savesCategoryExpanded, setSavesCategoryExpanded] = useState(['savedPlans', 'savedExams', 'savedCanvas', 'savedFlashcards'].includes(activeView));
  
  const isFreePlan = user.plan === 'free';
  
  const topLevelItems = [
    { view: 'lessonPlanner' as AppView, label: 'Lesson Plan', Icon: LessonPlanIcon, isPremium: false },
    { view: 'flashcardGenerator' as AppView, label: 'Flashcard Generator', Icon: FlashcardIcon, isPremium: false },
    { view: 'timetableEditor' as AppView, label: 'Timetable', Icon: TimetableIcon, isPremium: false },
    { view: 'curriculumOverview' as AppView, label: 'Curriculum', Icon: CurriculumOverviewIcon, isPremium: true },
    { view: 'schoolCalendar' as AppView, label: 'School Calendar', Icon: CalendarDaysIcon, isPremium: true },
  ];
  const creationToolsItems = [
    { view: 'examGenerator' as AppView, label: 'Exam Generator', Icon: AcademicCapIcon, isPremium: true },
    { view: 'creatorStudio' as AppView, label: 'Creator Studio', Icon: CreatorStudioIcon, isPremium: false },
  ];
  const saveItems = [
    { view: 'savedPlans' as AppView, label: 'Saved Plans', Icon: BookmarkSquareIcon, isPremium: true },
    { view: 'savedExams' as AppView, label: 'Saved Exams', Icon: BookmarkSquareIcon, isPremium: true },
    { view: 'savedFlashcards' as AppView, label: 'Saved Flashcards', Icon: BookmarkSquareIcon, isPremium: true },
    { view: 'savedCanvas' as AppView, label: 'Saved Canvases', Icon: BookmarkSquareIcon, isPremium: true },
  ];

  return (
    <aside className={`blueprint-card fixed top-0 left-0 h-full !rounded-none text-[var(--color-text-primary)] flex flex-col z-50 transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-20'}`}>
      {/* --- Header (Fixed Top) --- */}
      <div className={`flex items-center p-4 border-b border-[var(--color-border)] ${isOpen ? 'justify-between' : 'justify-center'}`}>
        {isOpen && (
          <div className="flex items-center">
            <SparklesIcon className="w-8 h-8" style={{color: 'var(--color-accent)'}} />
            <span className="text-xl font-bold ml-2">{APP_TITLE}</span>
          </div>
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-[var(--color-inset-bg)]">
          {isOpen ? <ChevronLeftIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>
      
      {/* --- Scrollable Content --- */}
      <div className="flex-grow overflow-y-auto custom-scrollbar-container">
        <div className="p-2 border-b border-[var(--color-border)]">
          <button onClick={onEditProfile} className="flex items-center w-full p-3 rounded-lg hover:bg-[var(--color-inset-bg)] text-left" aria-label="Edit profile">
            <div className="flex-shrink-0">
                {user.avatar ? (
                    <img src={user.avatar} alt="User avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                    <UserCircleIcon className="w-8 h-8 text-[var(--color-accent)]" />
                )}
            </div>
            {isOpen && (
              <div className="ml-3 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{user.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.plan === 'premium' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'}`}>
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
                 {isOpen && user.plan === 'free' && (
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1 space-y-0.5">
                        <p>Lesson Credits: {user.lessonCreditsRemaining}</p>
                        <p>Image Credits: {user.imageCreditsRemaining}</p>
                    </div>
                )}
              </div>
            )}
          </button>
        </div>
        
        <nav id="sidebar-nav" className="p-2">
            {topLevelItems.map(item => (
                <NavLink key={item.view} {...item} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={isFreePlan && item.isPremium} />
            ))}
            <NavCategory title="Creation Tools" isOpen={isOpen} isExpanded={creationToolsCategoryExpanded} onToggle={() => setCreationToolsCategoryExpanded(!creationToolsCategoryExpanded)} Icon={SparklesIcon}>
                {creationToolsItems.map(item => <NavLink key={item.view} {...item} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={isFreePlan && item.isPremium} />)}
            </NavCategory>
            <NavCategory title="My Saves" isOpen={isOpen} isExpanded={savesCategoryExpanded} onToggle={() => setSavesCategoryExpanded(!savesCategoryExpanded)} Icon={SaveIcon}>
                {saveItems.map(item => <NavLink key={item.view} {...item} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={isFreePlan && item.isPremium} />)}
            </NavCategory>
        </nav>
        
        {user.role === 'admin' && (
            <div className="p-2 border-t border-[var(--color-border)]">
                 <button
                    id="nav-adminDashboard"
                    onClick={() => setActiveView('adminDashboard')}
                    className={`flex items-center w-full p-3 my-1 rounded-lg transition-all duration-200 text-left ${activeView === 'adminDashboard' ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_-3px_var(--color-accent)]' : 'hover:bg-[var(--color-inset-bg)]'} interactive-glow`}
                    title={isOpen ? '' : 'Admin Dashboard'}
                >
                    <ShieldCheckIcon className={`w-6 h-6 flex-shrink-0 ${activeView === 'adminDashboard' ? 'text-white' : 'text-[var(--color-accent)]'}`} />
                    <span className={`ml-4 font-medium transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Admin Dashboard</span>
                </button>
            </div>
        )}

        <div className={`p-2 ${user.role !== 'admin' ? 'border-t border-[var(--color-border)]' : ''}`}>
          <button
            onClick={onOpenReviewModal}
            className="flex items-center w-full p-3 my-1 rounded-lg transition-all duration-200 text-left hover:bg-[var(--color-inset-bg)] interactive-glow"
            title={isOpen ? '' : 'Leave a Review'}
          >
            <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 flex-shrink-0 text-[var(--color-accent)]" />
            <span className={`ml-4 font-medium transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Leave a Review</span>
          </button>
        </div>

        {/* Collapsible Theme Settings in scrollable area */}
        {isOpen && (
          <div className="p-2 border-t border-[var(--color-border)]">
            <button
                onClick={() => setIsThemeSettingsOpen(!isThemeSettingsOpen)}
                className="flex items-center justify-between w-full p-3 my-1 rounded-lg transition-all duration-200 text-left hover:bg-[var(--color-inset-bg)]"
                aria-expanded={isThemeSettingsOpen}
             >
                <div className="flex items-center">
                    <CogIcon className="w-6 h-6 flex-shrink-0 text-[var(--color-accent)]" />
                    <span className={`ml-4 font-medium transition-opacity duration-200`}>Theme Settings</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isThemeSettingsOpen ? 'rotate-180' : ''}`} />
             </button>
             {isThemeSettingsOpen && (
                 <div className="p-2">
                     <ThemeSettingsComponent
                        settings={themeSettings}
                        onModeToggle={toggleThemeMode}
                        onAccentChange={setAccentColor}
                     />
                 </div>
             )}
          </div>
        )}
      </div>

      {/* --- Logout (Fixed Bottom) --- */}
      <div className="p-2 border-t border-[var(--color-border)] mt-auto">
        <div className="flex justify-between items-center">
          <button
              onClick={onLogout}
              className="flex items-center p-3 my-1 rounded-lg transition-all duration-200 text-left hover:bg-[var(--color-inset-bg)]"
              title={isOpen ? '' : 'Log Out'}
          >
              <LogoutIcon className="w-6 h-6 flex-shrink-0 text-rose-500" />
              <span className={`ml-4 font-medium text-rose-500 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Log Out</span>
          </button>
          {isOpen && (
            <span className="text-xs text-[var(--color-text-secondary)] pr-3 font-mono">
              v{APP_VERSION}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;