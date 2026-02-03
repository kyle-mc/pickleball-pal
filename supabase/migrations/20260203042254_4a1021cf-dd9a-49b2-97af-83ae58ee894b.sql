-- Create video_comments table for user comments on videos
CREATE TABLE public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_comments
CREATE POLICY "Anyone can view video comments"
ON public.video_comments
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert video comments"
ON public.video_comments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
ON public.video_comments
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.uid() IS NULL AND session_id = session_id)
);

CREATE POLICY "Users can delete their own comments"
ON public.video_comments
FOR DELETE
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.uid() IS NULL AND session_id = session_id)
);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;

-- Add an update policy for videos (currently users can update but let's ensure anyone authenticated can)
-- The current policy already allows authenticated users to update videos