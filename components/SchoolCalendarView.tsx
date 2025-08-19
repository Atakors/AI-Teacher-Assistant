import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, CalendarEventType, CalendarData } from '../types';
import { SparklesIcon, CalendarDaysIcon, FlagIcon, MoonIcon, AcademicCapIcon, PencilIcon, TrashIcon, PlusIcon } from './constants';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { getCustomCalendar, saveCustomCalendar } from '../services/dbService';
import { CALENDAR_EVENTS } from './constants_calendar';

interface SchoolCalendarViewProps {
    userId: string;
}

const EventIcon: React.FC<{ type: CalendarEventType; className?: string; style?: React.CSSProperties }> = ({ type, className = "w-6 h-6", style }) => {
    switch (type) {
        case CalendarEventType.SCHOOL_EVENT:
            return <AcademicCapIcon className={className} style={style} />;
        case CalendarEventType.NATIONAL_HOLIDAY:
            return <FlagIcon className={className} style={style} />;
        case CalendarEventType.RELIGIOUS_HOLIDAY:
            return <MoonIcon className={className} style={style} />;
        case CalendarEventType.OTHER_HOLIDAY:
            return <CalendarDaysIcon className={className} style={style} />;
        default:
            return <CalendarDaysIcon className={className} style={style} />;
    }
};

const getEventColor = (type: CalendarEventType): string => {
    switch (type) {
        case CalendarEventType.SCHOOL_EVENT: return '#3b82f6'; // blue-500
        case CalendarEventType.NATIONAL_HOLIDAY: return '#10b981'; // emerald-500
        case CalendarEventType.RELIGIOUS_HOLIDAY: return '#8b5cf6'; // violet-500
        case CalendarEventType.OTHER_HOLIDAY: return '#f59e0b'; // amber-500
        default: return '#64748b'; // slate-500
    }
}

export const SchoolCalendarView: React.FC<SchoolCalendarViewProps> = ({ userId }) => {
    const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editableEvents, setEditableEvents] = useState<CalendarEvent[]>([]);
    const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, 'id'>>({ name: '', date: '', type: CalendarEventType.SCHOOL_EVENT });

    useEffect(() => {
        const fetchCalendarData = async () => {
            if (!userId) return;
            setIsLoading(true);
            setError(null);
            try {
                const customData = await getCustomCalendar(userId);
                if (customData) {
                    setCalendarData(customData);
                } else {
                    const defaultData: CalendarData = {
                        lastUpdated: new Date().toISOString(),
                        events: CALENDAR_EVENTS,
                    };
                    setCalendarData(defaultData);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
                setError(`Failed to load calendar data. ${errorMessage}`);
                console.error("Error loading calendar data:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCalendarData();
    }, [userId]);

    const handleToggleEditMode = () => {
        if (!isEditMode && calendarData) {
            setEditableEvents([...calendarData.events].sort((a, b) => new Date(a.date.split(' - ')[0]).getTime() - new Date(b.date.split(' - ')[0]).getTime()));
        }
        setIsEditMode(!isEditMode);
    };

    const handleSaveChanges = async () => {
        if (!calendarData) return;
        const updatedData: CalendarData = {
            ...calendarData,
            lastUpdated: new Date().toISOString(),
            events: editableEvents
        };
        try {
            await saveCustomCalendar(userId, updatedData);
            setCalendarData(updatedData);
            setIsEditMode(false);
        } catch (dbError) {
            console.error("Failed to save calendar", dbError);
            setError("Failed to save your custom calendar.");
        }
    };

    const handleEventChange = (id: string, field: keyof Omit<CalendarEvent, 'id'>, value: string | CalendarEventType) => {
        setEditableEvents(currentEvents =>
            currentEvents.map(event =>
                event.id === id ? { ...event, [field]: value } : event
            )
        );
    };

    const handleDeleteEvent = (idToDelete: string) => {
        setEditableEvents(currentEvents => currentEvents.filter(event => event.id !== idToDelete));
    };

    const handleAddNewEvent = () => {
        if (!newEvent.name.trim() || !newEvent.date.trim()) return;
        const eventToAdd: CalendarEvent = { ...newEvent, id: `evt_${Date.now()}` };
        setEditableEvents(currentEvents => [...currentEvents, eventToAdd].sort((a, b) => new Date(a.date.split(' - ')[0]).getTime() - new Date(b.date.split(' - ')[0]).getTime()));
        setNewEvent({ name: '', date: '', type: CalendarEventType.SCHOOL_EVENT });
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
              School Calendar
              <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2">View and manage important school and holiday dates.</p>
          </div>
    
          {isLoading && <LoadingSpinner text="Loading calendar..." />}
          {error && <ErrorMessage message={error} />}
    
          {!isLoading && !error && calendarData && (
            <div className="aurora-card p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Events</h3>
                <div className="flex gap-2">
                  {isEditMode && <button onClick={handleSaveChanges} className="zenith-button py-2 px-4 rounded-lg text-sm">Save Changes</button>}
                  <button onClick={handleToggleEditMode} className="zenith-button-secondary py-2 px-4 rounded-lg text-sm">
                    {isEditMode ? 'Cancel' : 'Edit Calendar'}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {(isEditMode ? editableEvents : calendarData.events).map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-inset-bg)]">
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${getEventColor(event.type)}20` }}>
                      <EventIcon type={event.type} className="w-6 h-6" style={{ color: getEventColor(event.type) }}/>
                    </div>
                    <div className="flex-grow">
                      {isEditMode ? (
                        <input type="text" value={event.name} onChange={(e) => handleEventChange(event.id, 'name', e.target.value)} className="w-full bg-transparent font-semibold border-b border-transparent focus:border-[var(--color-accent)] outline-none" />
                      ) : (
                        <p className="font-semibold text-[var(--color-text-primary)]">{event.name}</p>
                      )}
                      {isEditMode ? (
                         <input type="text" value={event.date} onChange={(e) => handleEventChange(event.id, 'date', e.target.value)} className="w-full bg-transparent text-sm mt-1 border-b border-transparent focus:border-[var(--color-accent)] outline-none" />
                      ) : (
                        <p className="text-sm text-[var(--color-text-secondary)]">{event.date}</p>
                      )}
                    </div>
                    {isEditMode && (
                      <>
                        <select value={event.type} onChange={(e) => handleEventChange(event.id, 'type', e.target.value as CalendarEventType)} className="bg-transparent text-sm p-1 rounded border border-[var(--color-border)] outline-none focus:ring-1 focus:ring-[var(--color-accent)]" style={{backgroundColor: 'var(--color-input-bg)'}}>
                          {Object.values(CalendarEventType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full">
                          <TrashIcon className="w-5 h-5"/>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {isEditMode && (
                <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                  <h4 className="font-semibold mb-3">Add New Event</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <input type="text" placeholder="Event Name" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="md:col-span-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm"/>
                     <input type="text" placeholder="Date (e.g., July 4, 2026)" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="md:col-span-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm"/>
                     <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as CalendarEventType})} className="md:col-span-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm">
                        {Object.values(CalendarEventType).map(type => <option key={type} value={type}>{type}</option>)}
                     </select>
                  </div>
                  <button onClick={handleAddNewEvent} className="mt-3 zenith-button w-full md:w-auto py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
};