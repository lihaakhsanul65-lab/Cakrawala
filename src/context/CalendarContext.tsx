import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CalendarEvent, CalendarCategory } from '../types';
import { INITIAL_CALENDAR_EVENTS } from '../data/mockData';
import { safeSetItem } from '../utils/safeStorage';

interface CalendarContextType {
  events: CalendarEvent[];
  loading: boolean;
  fetchEvents: (targetClass?: string) => Promise<void>;
  createEvent: (data: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<{ success: boolean; event?: CalendarEvent; message?: string }>;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<{ success: boolean; event?: CalendarEvent; message?: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; message?: string }>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_calendar_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CALENDAR_EVENTS;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    safeSetItem('cakrawala_calendar_events', JSON.stringify(events));
  }, [events]);

  const fetchEvents = useCallback(async (targetClass?: string) => {
    setLoading(true);
    try {
      const query = targetClass && targetClass !== 'Semua' ? `?targetClass=${encodeURIComponent(targetClass)}` : '';
      const res = await fetch(`/api/calendar/events${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEvents(data);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetchEvents fallback to local state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (data: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created: CalendarEvent = await res.json();
        setEvents(prev => [created, ...prev]);
        return { success: true, event: created };
      }
    } catch {
      // offline fallback
    }

    const fallback: CalendarEvent = {
      ...data,
      id: `cal-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setEvents(prev => [fallback, ...prev]);
    return { success: true, event: fallback };
  };

  const updateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    try {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated: CalendarEvent = await res.json();
        setEvents(prev => prev.map(e => e.id === id ? updated : e));
        return { success: true, event: updated };
      }
    } catch {
      // offline fallback
    }

    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    const found = events.find(e => e.id === id);
    return { success: true, event: found ? { ...found, ...data } : undefined };
  };

  const deleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
        return { success: true };
      }
    } catch {
      // offline fallback
    }

    setEvents(prev => prev.filter(e => e.id !== id));
    return { success: true };
  };

  return (
    <CalendarContext.Provider value={{ events, loading, fetchEvents, createEvent, updateEvent, deleteEvent }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
