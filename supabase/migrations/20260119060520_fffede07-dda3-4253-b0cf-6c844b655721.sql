-- Add game_id column to videos table to link highlights to games
ALTER TABLE public.videos ADD COLUMN game_id uuid REFERENCES public.games(id) ON DELETE SET NULL;
ALTER TABLE public.videos ADD COLUMN video_type text DEFAULT 'other' CHECK (video_type IN ('highlight', 'other'));
ALTER TABLE public.videos ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_videos_game_id ON public.videos(game_id);
CREATE INDEX idx_videos_group_id ON public.videos(group_id);
CREATE INDEX idx_videos_video_type ON public.videos(video_type);

-- Update RLS policies for videos to support group filtering
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Anyone can insert videos" ON public.videos;

-- Videos are viewable by group members or if group_id is null
CREATE POLICY "Videos are viewable by group members or public"
ON public.videos FOR SELECT
USING (group_id IS NULL OR is_group_member(auth.uid(), group_id));

-- Authenticated users can insert videos
CREATE POLICY "Authenticated users can insert videos"
ON public.videos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow updates for video creators (for now, anyone authenticated)
CREATE POLICY "Authenticated users can update videos"
ON public.videos FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add active_group_id to profiles for tracking current group
ALTER TABLE public.profiles ADD COLUMN active_group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;