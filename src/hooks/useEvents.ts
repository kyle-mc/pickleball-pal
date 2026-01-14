import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Event = Tables<'events'>;
type EventInsert = TablesInsert<'events'>;
type EventRsvp = Tables<'event_rsvps'>;

// Generate a session ID for anonymous users
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('event_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('event_session_id', sessionId);
  }
  return sessionId;
};

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  const addEvent = async (event: EventInsert) => {
    const { error } = await supabase
      .from('events')
      .insert(event);
    
    if (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  return { events, loading, addEvent, updateEvent, refetch: fetchEvents };
}

export function useEventRsvps(eventId?: string) {
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [userRsvps, setUserRsvps] = useState<Set<string>>(new Set());
  const sessionId = getSessionId();

  const fetchRsvps = useCallback(async () => {
    // Fetch all RSVPs (or for a specific event)
    let query = supabase.from('event_rsvps').select('*');
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching RSVPs:', error);
    } else {
      setRsvps(data || []);
    }

    // Fetch user's RSVPs
    const { data: { user } } = await supabase.auth.getUser();
    let userQuery = supabase.from('event_rsvps').select('event_id');
    
    if (user) {
      userQuery = userQuery.eq('user_id', user.id);
    } else {
      userQuery = userQuery.eq('session_id', sessionId);
    }
    
    const { data: userRsvpData, error: userError } = await userQuery;
    if (userError) {
      console.error('Error fetching user RSVPs:', userError);
    } else {
      setUserRsvps(new Set(userRsvpData?.map(r => r.event_id) || []));
    }
  }, [eventId, sessionId]);

  useEffect(() => {
    fetchRsvps();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('event-rsvps-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_rsvps' },
        () => {
          fetchRsvps();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRsvps]);

  const toggleRsvp = async (eventId: string, playerName?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const hasRsvp = userRsvps.has(eventId);

    if (hasRsvp) {
      // Remove RSVP
      let query = supabase.from('event_rsvps').delete().eq('event_id', eventId);
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }
      
      const { error } = await query;
      if (error) console.error('Error removing RSVP:', error);
    } else {
      // Add RSVP
      const { error } = await supabase.from('event_rsvps').insert({
        event_id: eventId,
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        player_name: playerName || null,
      });
      if (error) console.error('Error adding RSVP:', error);
    }
  };

  const getRsvpCountForEvent = (eventId: string): number => {
    return rsvps.filter(r => r.event_id === eventId).length;
  };

  return { rsvps, userRsvps, toggleRsvp, getRsvpCountForEvent };
}
