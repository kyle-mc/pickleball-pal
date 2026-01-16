import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  duration: string | null;
  players: string[];
  views: number;
  created_at: string;
  video_date: string | null;
  likes_count?: number;
}

// Generate or get session ID for anonymous likes
const getSessionId = () => {
  let sessionId = localStorage.getItem('pickle_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('pickle_session_id', sessionId);
  }
  return sessionId;
};

export const useVideos = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get likes count for each video
      const { data: likes } = await supabase
        .from('video_likes')
        .select('video_id');

      const likesCount = (likes || []).reduce((acc, like) => {
        acc[like.video_id] = (acc[like.video_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (videos || []).map(v => ({
        ...v,
        players: v.players || [],
        likes_count: likesCount[v.id] || 0,
      })) as Video[];
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('videos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'videos' },
        () => queryClient.invalidateQueries({ queryKey: ['videos'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_likes' },
        () => queryClient.invalidateQueries({ queryKey: ['videos'] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useUserLikes = () => {
  const [sessionId] = useState(getSessionId);

  return useQuery({
    queryKey: ['user-likes', sessionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase.from('video_likes').select('video_id');
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data } = await query;
      return new Set((data || []).map(l => l.video_id));
    },
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();

      if (isLiked) {
        // Unlike
        let query = supabase.from('video_likes').delete();
        if (user) {
          query = query.eq('video_id', videoId).eq('user_id', user.id);
        } else {
          query = query.eq('video_id', videoId).eq('session_id', sessionId);
        }
        const { error } = await query;
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase.from('video_likes').insert({
          video_id: videoId,
          user_id: user?.id || null,
          session_id: user ? null : sessionId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-likes'] });
    },
  });
};

export const useAddVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (video: { title: string; description?: string; youtube_url: string; players?: string[] }) => {
      const { error } = await supabase.from('videos').insert({
        title: video.title,
        description: video.description || null,
        youtube_url: video.youtube_url,
        players: video.players || [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};
