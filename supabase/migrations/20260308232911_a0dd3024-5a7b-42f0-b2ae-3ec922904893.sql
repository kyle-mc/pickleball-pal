-- Fix: Require authentication for INSERT on players
DROP POLICY IF EXISTS "Anyone can insert players" ON public.players;
CREATE POLICY "Authenticated users can insert players"
  ON public.players FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix: Require authentication for INSERT on events
DROP POLICY IF EXISTS "Anyone can insert events" ON public.events;
CREATE POLICY "Authenticated users can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix: Require authentication for INSERT on event_rsvps
DROP POLICY IF EXISTS "Anyone can insert event RSVPs" ON public.event_rsvps;
CREATE POLICY "Authenticated users can insert event RSVPs"
  ON public.event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix: Require authentication for DELETE on event_rsvps
DROP POLICY IF EXISTS "Anyone can delete their RSVPs" ON public.event_rsvps;
CREATE POLICY "Authenticated users can delete their RSVPs"
  ON public.event_rsvps FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix: Require authentication for INSERT on video_likes
DROP POLICY IF EXISTS "Anyone can insert video likes" ON public.video_likes;
CREATE POLICY "Authenticated users can insert video likes"
  ON public.video_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix: Require authentication for DELETE on video_likes
DROP POLICY IF EXISTS "Anyone can delete video likes" ON public.video_likes;
CREATE POLICY "Authenticated users can delete video likes"
  ON public.video_likes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix: Require authentication for INSERT on video_comments
DROP POLICY IF EXISTS "Anyone can insert video comments" ON public.video_comments;
CREATE POLICY "Authenticated users can insert video comments"
  ON public.video_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);