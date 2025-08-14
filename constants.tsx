
import React from 'react';
import { CurriculumLevel, SelectOption, Day, TimePeriod, AccentColor } from './types';

export const APP_TITLE = "AI Teacher Assistant";
export const APP_VERSION = "2.5.1";

// IMPORTANT: This is your Google Client ID. It must match the one in your Google Cloud Console project.
export const GOOGLE_CLIENT_ID = "629495093465-p7v2fbrp74dtdb89mgv3auok3a81oosb.apps.googleusercontent.com";

export const CURRICULUM_LEVEL_OPTIONS_FOR_VIEW: SelectOption<CurriculumLevel>[] = [
  { value: CurriculumLevel.PRIMARY_3, label: "Primary Year 3" },
  { value: CurriculumLevel.PRIMARY_4, label: "Primary Year 4" },
  { value: CurriculumLevel.PRIMARY_5, label: "Primary Year 5" },
];


export const CURRICULUM_OPTIONS: SelectOption<CurriculumLevel>[] = [
  { value: CurriculumLevel.PRIMARY_3, label: "Primary Year 3" },
  { value: CurriculumLevel.PRIMARY_4, label: "Primary Year 4" },
  { value: CurriculumLevel.PRIMARY_5, label: "Primary Year 5" },
];

export const ACCENT_COLORS: { name: AccentColor, colorValue: string }[] = [
  { name: 'indigo', colorValue: '#6366f1' },
  { name: 'emerald', colorValue: '#10b981' },
  { name: 'sky', colorValue: '#0ea5e9' },
  { name: 'rose', colorValue: '#f43f5e' },
];

export const TIMETABLE_DAYS: Day[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

export const TIME_PERIODS: TimePeriod[] = [
  "8:00 - 08:45",
  "08:45 - 09:30",
  "09:30 - 09:45",
  "09:45 - 10:30",
  "10:30 - 11:15",
  "11:15 - 13:00",
  "13:00 - 13:45",
  "13:45 - 14:15",
  "14:15 - 15:00",
];

export const ACADEMIC_MONTHS = [
  "September", "October", "November", "December", "January", "February",
  "March", "April", "May", "June"
];

export const COMMON_MATERIALS: string[] = [
  "Whiteboard",
  "Markers / Chalk",
  "Textbook",
  "Copybooks",
  "Projector",
  "Worksheets",
  "Flashcards",
  "Pictures / Posters",
  "Speakers / Audio player",
];


// --- BLUEPRINT ICON SET (SINGLE-COLOR LINE ICONS) ---

export const LessonPlanIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

export const FlashcardIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

export const TimetableIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M12 12.75h.008v.008H12v-.008Z" />
  </svg>
);

export const CurriculumOverviewIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
  </svg>
);

export const CalendarDaysIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M12 12.75h.008v.008H12v-.008Z" />
  </svg>
);

export const BookmarkSquareIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25L7.5 16.5V3.75m9 0H7.5A2.25 2.25 0 0 0 5.25 6v13.5A2.25 2.25 0 0 0 7.5 21.75h9a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 16.5 3.75Z" />
  </svg>
);

export const SparklesIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

export const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.332.193-.72.257-1.076.124l-1.217-.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.193.582-.5.645-.87l.213-1.281Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

export const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const FileWordIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 12.75-8.25 18 6 12.75l-3.75-5.25 8.25 5.25Z" />
    </svg>
);

export const FilePdfIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);


export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
);

export const MoonIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
);

export const ListBulletIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

export const BookOpenIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);


export const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);
export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);
export const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
);
export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
export const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

export const FlagIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6.75L4.5 12.75l-1.5-1.5L3 9.75V3.002zM3 3h13.5A2.25 2.25 0 0 1 18.75 5.25v13.5A2.25 2.25 0 0 1 16.5 21H3.002" />
    </svg>
);

export const AcademicCapIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 0a3.75 3.75 0 0 1-3.75-3.75V4.5a3.75 3.75 0 0 1 3.75-3.75h16.5A3.75 3.75 0 0 1 22.5 4.5v1.897c0 1.406-.526 2.72-1.408 3.703a60.438 60.438 0 0 0-.491 0m-13.732 0a60.437 60.437 0 0 1 13.732 0M12 12.75a2.25 2.25 0 0 0-2.25 2.25v2.25a2.25 2.25 0 0 0 4.5 0v-2.25A2.25 2.25 0 0 0 12 12.75Z" />
    </svg>
);

export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

export const ChatBubbleOvalLeftEllipsisIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.761 9.761 0 0 1-2.542-.382m-3.92-3.82a9.755 9.755 0 0 1-.382-2.542C3 7.444 7.03 3.75 12 3.75c4.97 0 9 3.694 9 8.25Z" />
    </svg>
);

export const StarIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"} style={style}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" clipRule="evenodd" />
  </svg>
);

export const ShieldCheckIcon: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} style={style}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" />
    </svg>
);


// --- NEW PROFESSIONAL UI ASSETS ---

export const HeroAppPreview: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 594 404" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'rgba(var(--color-accent-rgb), 0.8)', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'rgba(var(--color-accent-rgb), 0.5)', stopOpacity:1}} />
            </linearGradient>
        </defs>
        <rect width="594" height="404" rx="16" fill="#1F2937" />
        <rect x="18" y="18" width="558" height="368" rx="8" fill="#111827" />
        
        {/* Header */}
        <rect x="184" y="29" width="226" height="8" rx="4" fill="#374151" />
        <circle cx="40" cy="37" r="6" fill="#374151" />
        <circle cx="60" cy="37" r="6" fill="#374151" />
        <circle cx="80" cy="37" r="6" fill="#374151" />

        {/* Sidebar */}
        <rect x="34" y="60" width="134" height="310" rx="4" fill="#1F2937" />
        <rect x="44" y="70" width="24" height="24" rx="4" fill="#374151" />
        <rect x="76" y="76" width="82" height="12" rx="4" fill="#374151" />
        <rect x="44" y="106" width="114" height="32" rx="4" fill="url(#grad1)" />
        <rect x="44" y="150" width="114" height="8" rx="4" fill="#374151" />
        <rect x="44" y="166" width="94" height="8" rx="4" fill="#374151" />
        <rect x="44" y="182" width="114" height="8" rx="4" fill="#374151" />
        <rect x="44" y="210" width="114" height="8" rx="4" fill="#374151" />
        <rect x="44" y="226" width="84" height="8" rx="4" fill="#374151" />

        {/* Main Content */}
        <rect x="184" y="60" width="372" height="60" rx="4" fill="#1F2937" />
        <rect x="194" y="70" width="120" height="16" rx="4" fill="#374151" />
        <rect x="456" y="70" width="90" height="16" rx="4" fill="#374151" />
        <rect x="194" y="94" width="80" height="16" rx="4" fill="#374151" />
        
        <rect x="184" y="136" width="372" height="234" rx="4" fill="#1F2937" />
        <rect x="194" y="146" width="150" height="12" rx="4" fill="url(#grad1)" />
        <rect x="194" y="172" width="352" height="8" rx="4" fill="#374151" />
        <rect x="194" y="188" width="352" height="8" rx="4" fill="#374151" />
        <rect x="194" y="204" width="302" height="8" rx="4" fill="#374151" />
        <rect x="194" y="232" width="150" height="12" rx="4" fill="url(#grad1)" />
        <rect x="194" y="258" width="352" height="8" rx="4" fill="#374151" />
        <rect x="194" y="274" width="322" height="8" rx="4" fill="#374151" />
        <rect x="194" y="290" width="352" height="8" rx="4" fill="#374151" />
    </svg>
);

export const ProLogo1: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 110 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.238 21.41V2.59h3.72v7.92h5.04V2.59h3.72v18.82h-3.72v-8.22H5.958v8.22H2.238zM26.79 21.41l-5.04-7.56v7.56h-3.72V2.59h3.72l5.04 7.56V2.59h3.72v18.82H26.79zM42.45 21.41V2.59h3.72v18.82h-3.72zM52.05 21.41l-3.3-5.58h-2.22v5.58h-3.72V2.59h5.94c3.3,0,5.34,1.86,5.34,4.98c0,2.22-1.2,3.78-3.06,4.5l3.6,9.34H52.05zM46.47 5.23v5.52h1.8c2.04,0,3.12-1.2,3.12-2.76c0-1.56-1.08-2.76-3.12-2.76H46.47zM69.15 21.41V2.59h10.38v3.12h-6.66v4.62h6.3v3.12h-6.3v4.84h6.66v3.12H69.15zM91.35 21.41V12.95h-4.56V2.59h12.84v10.36h-4.56v8.46H91.35zM95.07 5.71v4.62h4.56V5.71H95.07z" fill="currentColor"/></svg>);
export const ProLogo2: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 102 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.25 18.24c-2.7 0-4.32-1.44-4.32-3.48V2.58h-3.72v12.3c0,3.6,2.34,5.4,6.06,5.4c3.72,0,6.06-1.8,6.06-5.4V2.58h-3.72v12.18c0,1.26.6,2.46,1.92,2.46s1.92-1.2,1.92-2.46V2.58h-3.96v.06zM34.83 20.28c-3.12,0-4.92-1.5-4.92-3.84V8.4h6.9v-3.3h-6.9V2.58h-3.72v2.52h-2.82v3.3h2.82v8.1c0,3.54,2.4,5.82,6.6,5.82c1.98,0,3.48-0.42,4.32-0.9l-0.96-3.06c-0.72,0.36-1.68,0.54-2.82,0.54zM53.19 2.58l-5.46,21.42h-3.48l5.46-21.42H53.19zM67.53 20.28c-3.12,0-4.92-1.5-4.92-3.84V8.4h6.9v-3.3h-6.9V2.58h-3.72v2.52h-2.82v3.3h2.82v8.1c0,3.54,2.4,5.82,6.6,5.82c1.98,0,3.48-0.42,4.32-0.9l-0.96-3.06c-0.72,0.36-1.68,0.54-2.82,0.54zM86.13 20.22c-1.92,0-3.24-0.96-3.9-2.58l6.72-2.82c0.42-0.18,0.6-0.48,0.54-0.84a2.82 2.82 0 00-2.7-2.34c-1.8,0-3.18,1.26-3.18,3.06c0,2.34,2.04,3.9,4.92,3.9c2.34,0,3.9-1.14,4.56-2.76l-2.94-1.26c-0.6,0.9-1.44,1.56-2.28,1.56zM86.73 14.82c0.6,0,1.08-0.3,1.26-0.84l-3.06-1.32c-0.03,0.84,0.54,1.44,1.26,1.8l0.54,0.36zM0 21.42h3.72V2.58H0v18.84z" fill="currentColor"/></svg>);
export const ProLogo3: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 132 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/><path d="M38 2V22M32 2L44 22M50 22V2H62L50 22M68 2L80 22M74 2V22M86 2V22H98V14H86M104 22V2L116 12L104 22Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
export const ProLogo4: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 102 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.238 21.41V2.59h12.54v3.12H5.958v4.62h8.46v3.12H5.958v4.84h8.82v3.12H2.238zM26.79 21.41l-5.04-7.56v7.56h-3.72V2.59h3.72l5.04 7.56V2.59h3.72v18.82H26.79zM42.45 21.41V2.59h3.72v18.82h-3.72zM57.69 21.41l-5.04-7.56v7.56h-3.72V2.59h3.72l5.04 7.56V2.59h3.72v18.82H57.69zM73.35 21.41V2.59h12.54v3.12H77.07v4.62h8.46v3.12H77.07v4.84h8.82v3.12H73.35zM98.85 21.41V12.95h-4.56V2.59h12.84v10.36h-4.56v8.46H98.85zM102.57 5.71v4.62h4.56V5.71h-4.56z" fill="currentColor"/></svg>);
export const ProLogo5: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 114 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.98 21.42c-3.96,0-6.18-2.34-6.18-5.94s2.22-5.94,6.18-5.94c3.96,0,6.18,2.34,6.18,5.94s-2.22,5.94-6.18,5.94zM19.98 12.6c-2.4,0-3.9,1.68-3.9,2.88c0,1.2,1.5,2.88,3.9,2.88c2.4,0,3.9-1.68,3.9-2.88c0-1.2-1.5-2.88-3.9-2.88zM31.2 21.42V2.58h3.72v18.84H31.2zM45.66 21.42l-2.04-3.42H40.2v3.42h-3.72V2.58h5.94c3.3,0,5.34,1.86,5.34,4.98c0,2.22-1.2,3.78-3.06,4.5l3.6,9.36H45.66zM40.2 5.22v5.52h1.8c2.04,0,3.12-1.2,3.12-2.76c0-1.56-1.08-2.76-3.12-2.76H40.2zM62.76 21.42l-2.04-3.42H57.3v3.42h-3.72V2.58h5.94c3.3,0,5.34,1.86,5.34,4.98c0,2.22-1.2,3.78-3.06,4.5l3.6,9.36H62.76zM57.3 5.22v5.52h1.8c2.04,0,3.12-1.2,3.12-2.76c0-1.56-1.08-2.76-3.12-2.76H57.3zM78.6 21.42V9.54h-4.56V2.58h12.84v6.96h-4.56v11.88H78.6zM93.36 21.42l-5.04-7.56v7.56h-3.72V2.58h3.72l5.04,7.56V2.58h3.72v18.84H93.36zM110.4 21.42V2.58h3.72v18.84H110.4z" fill="currentColor"/></svg>);

export const EmptyLessonPlanStructure: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="20" rx="2" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
        <rect x="10" y="35" width="25" height="10" rx="1" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
        <rect x="37.5" y="35" width="25" height="10" rx="1" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
        <rect x="65" y="35" width="25" height="10" rx="1" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
        <rect x="10" y="50" width="80" height="40" rx="2" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
    </svg>
);