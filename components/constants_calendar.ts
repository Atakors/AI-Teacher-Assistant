import { CalendarEvent, CalendarEventType } from '../types';

export const CALENDAR_EVENTS: CalendarEvent[] = [
  // --- 2025 ---
  { id: "evt_2025_09_03", name: "Beginning of the School Year", date: "September 3, 2025", type: CalendarEventType.SCHOOL_EVENT },
  { id: "evt_2025_09_26", name: "Mawlid al-Nabi (Prophet's Birthday)", date: "September 26, 2025", type: CalendarEventType.RELIGIOUS_HOLIDAY },
  { id: "evt_2025_11_01", name: "Revolution Day", date: "November 1, 2025", type: CalendarEventType.NATIONAL_HOLIDAY },
  { id: "evt_2025_12_19", name: "Winter Holiday", date: "December 19, 2025 - January 4, 2026", type: CalendarEventType.OTHER_HOLIDAY },

  // --- 2026 ---
  { id: "evt_2026_01_12", name: "Yennayer (Amazigh New Year)", date: "January 12, 2026", type: CalendarEventType.NATIONAL_HOLIDAY },
  { id: "evt_2026_03_30", name: "Eid al-Fitr (End of Ramadan)", date: "March 30, 2026", type: CalendarEventType.RELIGIOUS_HOLIDAY },
  { id: "evt_2026_03_19", name: "Spring Holiday", date: "March 19, 2026 - April 4, 2026", type: CalendarEventType.OTHER_HOLIDAY },
  { id: "evt_2026_05_01", name: "Labour Day", date: "May 1, 2026", type: CalendarEventType.NATIONAL_HOLIDAY },
  { id: "evt_2026_06_06", name: "Eid al-Adha (Feast of Sacrifice)", date: "June 6, 2026", type: CalendarEventType.RELIGIOUS_HOLIDAY },
  { id: "evt_2026_06_27", name: "Muharram (Islamic New Year)", date: "June 27, 2026", type: CalendarEventType.RELIGIOUS_HOLIDAY },
  { id: "evt_2026_07_04", name: "End of the School Year", date: "July 4, 2026", type: CalendarEventType.SCHOOL_EVENT },
  { id: "evt_2026_07_05_ind", name: "Independence Day", date: "July 5, 2026", type: CalendarEventType.NATIONAL_HOLIDAY },
  { id: "evt_2026_07_05_ash", name: "Day of Ashura", date: "July 5, 2026", type: CalendarEventType.RELIGIOUS_HOLIDAY },
];