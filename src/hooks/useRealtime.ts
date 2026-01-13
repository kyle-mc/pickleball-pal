import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeGames = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('games-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['games'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['players'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

export const useRealtimeEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_rsvps' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['event-rsvps'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
