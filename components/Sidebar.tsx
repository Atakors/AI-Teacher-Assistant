import React, { useState, useRef, useEffect } from 'react';
import { AppView, ThemeSettings, AccentColor, User, AppState } from '../types';
import { 
  APP_TITLE, APP_VERSION, LessonPlanIcon, TimetableIcon, CurriculumOverviewIcon, AppLogoIcon,
  MenuIcon, ChevronLeftIcon, CogIcon, CalendarDaysIcon, UserIcon, LogoutIcon,
  ChevronDownIcon, UserCircleIcon, LockClosedIcon, ChatBubbleOvalLeftEllipsisIcon, ShieldCheckIcon, BookmarkSquareIcon, AcademicCapIcon,
  SaveIcon, FlashcardIcon, CurrencyDollarIcon, BookOpenIcon, PencilIcon, XIcon, Squares2x2Icon, DocumentDuplicateIcon, PuzzlePieceIcon, StarOutlineIcon, SparklesIcon, TicketIcon, TrophyIcon
} from './constants';
import ThemeSettingsComponent from './ThemeSettings';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{ view: AppView; label: string; Icon: React.ElementType; activeView: AppView; setActiveView: (view: AppView) => void; isOpen: boolean; isLocked: boolean; }> = ({ view, label, Icon, activeView, setActiveView, isOpen, isLocked }) => {
  const isActive = activeView === view;
  
  const activeStyle: React.CSSProperties = isActive ? {
    backgroundColor: 'var(--color-primary)',
    color: document.documentElement.classList.contains('dark') ? '#111' : 'var(--color-on-primary)',
    boxShadow: 'var(--shadow-elevation-1)'
  } : {};

  const iconClasses = `w-6 h-6 flex-shrink-0 ${isActive ? 'icon-on-primary-color' : 'icon-primary-color'}`;

  return (
    <button
      id={`nav-${view}`}
      onClick={() => setActiveView(view)}
      className={`flex items-center w-full p-3 my-1 rounded-full transition-all duration-200 text-left hover:bg-[var(--color-surface-variant)]`}
      style={activeStyle}
      title={isOpen ? '' : label}
    >
      <Icon className={iconClasses} />
      <span className={`ml-4 font-medium transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 whitespace-nowrap'}`}>{label}</span>
      {isLocked && isOpen && <LockClosedIcon className="w-4 h-4 ml-auto text-amber-500" />}
    </button>
  );
};

const NavCategory: React.FC<{ title: string; isOpen: boolean; children: React.ReactNode; isExpanded: boolean; onToggle: () => void; Icon: React.ElementType; }> = ({ title, isOpen, children, isExpanded, onToggle, Icon }) => {
  if (!isOpen) {
    return (
      <div className="p-3 my-1 rounded-lg text-left text-[var(--color-on-surface-variant)]" title={title}>
        <Icon className="w-6 h-6 mx-auto"/>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onToggle} className="flex items-center w-full p-3 my-1 rounded-lg hover:bg-[var(--color-surface-variant)] text-left">
        <Icon className="w-6 h-6 flex-shrink-0 text-[var(--color-secondary)]"/>
        <span className="ml-4 font-semibold text-sm uppercase tracking-wider text-[var(--color-secondary)]">{title}</span>
        <ChevronDownIcon className={`w-5 h-5 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && <div className="pl-4">{children}</div>}
    </div>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, activeView, setActiveView, isOpen, setIsOpen }) => {
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['core', 'aids', 'library']);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    };

    return (
        <>
        {/* Backdrop for mobile overlay */}
        {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 z-[100] lg:hidden" />}

        <div className={`fixed lg:static top-0 left-0 h-full bg-[var(--color-surface)] border-r border-[var(--color-outline)] flex flex-col z-[110] transition-transform lg:transition-[width] duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`} style={{ width: isOpen ? 'var(--sidebar-width)' : 'var(--sidebar-width-collapsed)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 flex-shrink-0 h-16 border-b border-[var(--color-outline)]">
                <div className={`flex items-center transition-opacity duration-200 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <AppLogoIcon className="w-8 h-8 flex-shrink-0"/>
                    <h1 className="text-lg font-bold ml-2 whitespace-nowrap">{APP_TITLE}</h1>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-[var(--color-surface-variant)]">
                    {isOpen ? <ChevronLeftIcon className="w-6 h-6 hidden lg:block" /> : <MenuIcon className="w-6 h-6 hidden lg:block" />}
                    <XIcon className="w-6 h-6 lg:hidden" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-grow p-2 overflow-y-auto custom-scrollbar-container">
                 <NavCategory title="Core Tools" isOpen={isOpen} isExpanded={expandedCategories.includes('core')} onToggle={() => toggleCategory('core')} Icon={Squares2x2Icon}>
                    <NavLink view="dashboard" label="Dashboard" Icon={Squares2x2Icon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="lessonPlanner" label="Lesson Planner" Icon={LessonPlanIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="flashcardGenerator" label="Flashcard Generator" Icon={FlashcardIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="timetableEditor" label="Timetable Editor" Icon={TimetableIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="examGenerator" label="Exam Generator" Icon={AcademicCapIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="wordGameGenerator" label="Word Game Generator" Icon={PuzzlePieceIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="creatorStudio" label="Creator Studio" Icon={PencilIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                </NavCategory>

                 <NavCategory title="Teaching Aids" isOpen={isOpen} isExpanded={expandedCategories.includes('aids')} onToggle={() => toggleCategory('aids')} Icon={SparklesIcon}>
                    <NavLink view="digitalSpinner" label="Digital Spinner" Icon={TicketIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="certificateGenerator" label="Certificate Generator" Icon={TrophyIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                 </NavCategory>

                 <NavCategory title="Resources" isOpen={isOpen} isExpanded={expandedCategories.includes('resources')} onToggle={() => toggleCategory('resources')} Icon={BookOpenIcon}>
                    <NavLink view="curriculumOverview" label="Curriculum Overview" Icon={CurriculumOverviewIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="schoolCalendar" label="School Calendar" Icon={CalendarDaysIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="pricing" label="Pricing & Plans" Icon={CurrencyDollarIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                    <NavLink view="reviews" label="Testimonials" Icon={StarOutlineIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                </NavCategory>

                 <NavCategory title="My Library" isOpen={isOpen} isExpanded={expandedCategories.includes('library')} onToggle={() => toggleCategory('library')} Icon={BookmarkSquareIcon}>
                    <NavLink view="savedPlans" label="Saved Plans" Icon={SaveIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="savedExams" label="Saved Exams" Icon={SaveIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="savedFlashcards" label="Saved Flashcards" Icon={SaveIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                    <NavLink view="savedCanvas" label="Saved Canvases" Icon={SaveIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.plan === 'free'} />
                </NavCategory>
                
                {user.role === 'admin' && (
                     <NavCategory title="Admin" isOpen={isOpen} isExpanded={expandedCategories.includes('admin')} onToggle={() => toggleCategory('admin')} Icon={ShieldCheckIcon}>
                        <NavLink view="adminDashboard" label="Dashboard" Icon={ShieldCheckIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={false} />
                        <NavLink view="bulkGenerator" label="Bulk Generator" Icon={DocumentDuplicateIcon} activeView={activeView} setActiveView={setActiveView} isOpen={isOpen} isLocked={user.role !== 'admin'} />
                     </NavCategory>
                )}
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-[var(--color-outline)] flex-shrink-0">
                <div className={`w-full flex items-center text-left ${isOpen ? 'p-2' : 'justify-center p-2'}`}>
                    {user.avatar ? <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <UserCircleIcon className="w-10 h-10 text-[var(--color-outline)] flex-shrink-0" />}
                    <div className={`flex-grow ml-3 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <p className="font-semibold text-sm truncate text-[var(--color-on-surface)]">{user.name}</p>
                        <p className={`text-xs ${user.plan === 'pro' ? 'text-emerald-500' : 'text-[var(--color-on-surface-variant)]'}`}>{user.plan === 'pro' ? 'Pro Plan' : 'Explorer Plan'}</p>
                    </div>
                </div>
                 <div className="p-2">
                    <button 
                        onClick={onLogout} 
                        className={`w-full flex items-center p-3 rounded-lg transition-colors text-rose-500 hover:bg-rose-500/10 ${isOpen ? '' : 'justify-center'}`}
                        title={isOpen ? '' : 'Log Out'}
                    >
                        <LogoutIcon className="w-6 h-6 flex-shrink-0" />
                        <span className={`ml-4 font-medium transition-opacity duration-200 ${isOpen ? 'opacity-100 whitespace-nowrap' : 'opacity-0'}`}>Log Out</span>
                    </button>
                 </div>
            </div>
        </div>
        </>
    );
};