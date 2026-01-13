-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create videos table
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  thumbnail_url text,
  duration text,
  players text[] DEFAULT '{}',
  views integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are viewable by everyone" 
ON public.videos FOR SELECT USING (true);

CREATE POLICY "Anyone can insert videos" 
ON public.videos FOR INSERT WITH CHECK (true);

-- Create video_likes table
CREATE TABLE public.video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id),
  UNIQUE(video_id, session_id)
);

-- Enable RLS on video_likes
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Video likes are viewable by everyone" 
ON public.video_likes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert video likes" 
ON public.video_likes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete video likes" 
ON public.video_likes FOR DELETE USING (true);

-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'open-play',
  date text NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  min_players integer DEFAULT 4,
  max_players integer,
  description text,
  recurrence_type text,
  recurrence_interval integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" 
ON public.events FOR SELECT USING (true);

CREATE POLICY "Anyone can insert events" 
ON public.events FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update events" 
ON public.events FOR UPDATE USING (true);

-- Create event_rsvps table
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  player_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id),
  UNIQUE(event_id, session_id)
);

-- Enable RLS on event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event RSVPs are viewable by everyone" 
ON public.event_rsvps FOR SELECT USING (true);

CREATE POLICY "Anyone can insert event RSVPs" 
ON public.event_rsvps FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete their RSVPs" 
ON public.event_rsvps FOR DELETE USING (true);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;

-- Insert initial video entry
INSERT INTO public.videos (title, description, youtube_url, duration, players, views)
VALUES (
  'Pickleball Highlights',
  'Amazing pickleball rally and plays',
  'https://youtu.be/yNuuk4doHlA',
  '3:45',
  ARRAY['Kyle', 'Chris', 'Brandon', 'Josiah'],
  0
);