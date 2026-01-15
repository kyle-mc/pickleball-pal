-- Add owner/hosts to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS host_ids uuid[] DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description text;

-- Add event_id to games table for linking
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id);

-- Add video_date to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS video_date text;

-- Update RLS policy for events - only owner/hosts can edit future events
DROP POLICY IF EXISTS "Anyone can update events" ON public.events;

CREATE POLICY "Owners and hosts can update future events"
ON public.events FOR UPDATE
USING (
  date >= to_char(now(), 'YYYY-MM-DD') AND (
    owner_id IS NULL OR
    owner_id = auth.uid() OR
    auth.uid() = ANY(host_ids)
  )
);

-- Allow anyone to insert events (they become the owner)
DROP POLICY IF EXISTS "Anyone can insert events" ON public.events;
CREATE POLICY "Anyone can insert events"
ON public.events FOR INSERT
WITH CHECK (true);

-- Create index for faster event lookups by date
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_games_event_id ON public.games(event_id);