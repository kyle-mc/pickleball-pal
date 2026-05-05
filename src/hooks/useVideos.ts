import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useGroupContext } from "@/contexts/GroupContext";

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
  comments_count?: number;
  game_id: string | null;
  video_type: 'highlight' | 'other';
  group_id: string | null;
}

import { getAnonSessionId } from '@/lib/anonSession';

// Generate or get session ID for anonymous likes (rotates after 7 days)
const getSessionId = () => getAnonSessionId('pickle_session');

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Fetch video duration from YouTube oEmbed API
const fetchYouTubeDuration = async (url: string): Promise<string | null> => {
  // YouTube oEmbed doesn't provide duration, so we'll use a placeholder
  // The actual duration would require YouTube Data API with API key
  return null;
};

export const useVideos = () => {
  const queryClient = useQueryClient();
  const { currentGroup } = useGroupContext();

  const query = useQuery({
    queryKey: ['videos', currentGroup?.id],
    queryFn: async () => {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by group if one is selected
      if (currentGroup) {
        query = query.or(`group_id.eq.${currentGroup.id},group_id.is.null`);
      }

      const { data: videos, error } = await query;

      if (error) throw error;

      // Get likes count for each video
      const { data: likes } = await supabase
        .from('video_likes')
        .select('video_id');

      const likesCount = (likes || []).reduce((acc, like) => {
        acc[like.video_id] = (acc[like.video_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get comments count for each video
      const { data: comments } = await supabase
        .from('video_comments')
        .select('video_id');

      const commentsCount = (comments || []).reduce((acc, comment) => {
        acc[comment.video_id] = (acc[comment.video_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (videos || []).map(v => ({
        ...v,
        players: v.players || [],
        likes_count: likesCount[v.id] || 0,
        comments_count: commentsCount[v.id] || 0,
        video_type: v.video_type || 'other',
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_comments' },
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

export interface AddVideoParams {
  title: string;
  description?: string;
  youtube_url: string;
  players?: string[];
  game_id?: string;
  video_type: 'highlight' | 'other';
  group_id?: string;
  duration?: string;
  video_date?: string;
}

export const useAddVideo = () => {
  const queryClient = useQueryClient();
  const { currentGroup } = useGroupContext();

  return useMutation({
    mutationFn: async (video: AddVideoParams) => {
      // game_id might be a composite key like "2025-07-28-1" - only pass if it's a valid UUID
      const isValidUUID = video.game_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(video.game_id);
      
      const { error } = await supabase.from('videos').insert({
        title: video.title,
        description: video.description || null,
        youtube_url: video.youtube_url,
        players: video.players || [],
        game_id: isValidUUID ? video.game_id : null,
        video_type: video.video_type,
        group_id: video.group_id || currentGroup?.id || null,
        duration: video.duration || null,
        video_date: video.video_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

export const useUpdateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Video> & { id: string }) => {
      const { error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

// Hook to check if a game has a video linked to it
export const useGameVideos = () => {
  const { data: videos = [] } = useVideos();
  
  const gameVideoMap = new Map<string, Video>();
  videos.forEach(v => {
    if (v.game_id) {
      gameVideoMap.set(v.game_id, v);
    }
  });
  
  return {
    hasVideoForGame: (gameId: string) => gameVideoMap.has(gameId),
    getVideoForGame: (gameId: string) => gameVideoMap.get(gameId),
    gameVideoMap,
  };
};