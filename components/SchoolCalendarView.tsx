import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, CalendarEventType, CalendarData } from '../types';
import { SparklesIcon, CalendarDaysIcon, FlagIcon, MoonIcon, AcademicCapIcon, PencilIcon, TrashIcon, PlusIcon } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { getCustomCalendar, saveCustomCalendar } from '../services/dbService';
import { CALENDAR_EVENTS } from '../constants_calendar';

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

const SchoolCalendarView: React.FC<SchoolCalendarViewProps> = ({ userId }) => {
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
    
    const eventsByMonth = useMemo(() => {
        const eventsToDisplay = isEditMode ? editableEvents : calendarData?.events;
        if (!eventsToDisplay) return [];
        const grouped: { [month: string]: CalendarEvent[] } = {};
        [...eventsToDisplay].sort((a, b) => new Date(a.date.split(' - ')[0]).getTime() - new Date(b.date.split(' - ')[0]).getTime()).forEach(event => {
            const month = new Date(event.date.split(' - ')[0]).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            if (!grouped[month]) {
                grouped[month] = [];
            }
            grouped[month].push(event);
        });
        return Object.entries(grouped);
    }, [calendarData, isEditMode, editableEvents]);
    

    if (isLoading) return <LoadingSpinner text="Loading Calendar..." />;
    
    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
                School Calendar
                <SparklesIcon className="w-7 h-7 ml-2" style={{color: 'var(--color-accent)'}} />
                </h2>
                <p className="text-[var(--color-text-secondary)] mt-2 px-4">
                Official holidays and school events for the 2025-2026 academic year.
                </p>
            </div>

            <div className="aurora-card p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Events Timeline</h3>
                        {calendarData && <p className="text-xs text-[var(--color-text-secondary)]">Last updated: {new Date(calendarData.lastUpdated).toLocaleDateString()}</p>}
                    </div>
                    <div>
                        {isEditMode ? (
                            <div className="flex gap-2">
                                <button onClick={handleSaveChanges} className="blueprint-button py-2 px-4 rounded-lg text-sm">Save Changes</button>
                                <button onClick={() => setIsEditMode(false)} className="blueprint-button-secondary py-2 px-4 rounded-lg text-sm">Cancel</button>
                            </div>
                        ) : (
                            <button onClick={handleToggleEditMode} className="blueprint-button-secondary py-2 px-4 rounded-lg text-sm flex items-center gap-2">
                                <PencilIcon className="w-4 h-4" /> Customize
                            </button>
                        )}
                    </div>
                </div>

                {error && <ErrorMessage message={error} />}
                
                {isEditMode ? (
                    <div className="space-y-4">
                        {editableEvents.map(event => (
                            <div key={event.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 rounded-lg bg-[var(--color-inset-bg)]">
                                <input type="text" value={event.name} onChange={e => handleEventChange(event.id, 'name', e.target.value)} className="md:col-span-4 p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]"/>
                                <input type="text" value={event.date} onChange={e => handleEventChange(event.id, 'date', e.target.value)} className="md:col-span-4 p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]"/>
                                <select value={event.type} onChange={e => handleEventChange(event.id, 'type', e.target.value as CalendarEventType)} className="md:col-span-3 p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                                    {Object.values(CalendarEventType).map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <button onClick={() => handleDeleteEvent(event.id)} className="md:col-span-1 p-2 flex justify-center items-center text-rose-500 hover:bg-rose-500/10 rounded-full">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 rounded-lg border-2 border-dashed border-[var(--color-border)]">
                            <input type="text" placeholder="New Event Name" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="md:col-span-4 p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]"/>
                            <input type="text" placeholder="Date (e.g., July 10, 2026)" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="md:col-span-4 p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]"/>
                            <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as CalendarEventType})} className="md:col-span-3 p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                                {Object.values(CalendarEventType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                            <button onClick={handleAddNewEvent} className="md:col-span-1 p-2 flex justify-center items-center text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-full">
                                <PlusIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                    {eventsByMonth.map(([month, events]) => (
                        <div key={month}>
                            <h4 className="font-semibold text-lg text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2 mb-3">{month}</h4>
                            <ul className="space-y-3">
                                {events.map(event => (
                                    <li key={event.id} className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: getEventColor(event.type) + '20' }}>
                                            <EventIcon type={event.type} className="w-6 h-6" style={{ color: getEventColor(event.type) }}/>
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--color-text-primary)]">{event.name}</p>
                                            <p className="text-sm text-[var(--color-text-secondary)]">{event.date}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolCalendarView;