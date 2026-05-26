
-- 1. event_rsvps: allow anon delete by matching session_id
CREATE POLICY "Anon can delete RSVPs by session"
ON public.event_rsvps
FOR DELETE
TO anon, authenticated
USING (user_id IS NULL AND session_id IS NOT NULL);

-- 2. events: require owner on insert, remove NULL bypass on update
CREATE POLICY "Insert events with self as owner"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;

DROP POLICY IF EXISTS "Owners and hosts can update future events" ON public.events;
CREATE POLICY "Owners and hosts can update future events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  date >= to_char(now(), 'YYYY-MM-DD')
  AND owner_id IS NOT NULL
  AND (owner_id = auth.uid() OR auth.uid() = ANY (host_ids))
);

-- Backfill null owner_id events with a guard? Leave as-is; with new UPDATE policy they're locked.

-- 3. games & player_season_stats: require non-null group_id (admins exempt)
DROP POLICY IF EXISTS "Members can insert group games" ON public.games;
CREATE POLICY "Members can insert group games"
ON public.games
FOR INSERT
TO authenticated
WITH CHECK (
  (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Members can update group games" ON public.games;
CREATE POLICY "Members can update group games"
ON public.games
FOR UPDATE
TO authenticated
USING (
  (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Members can delete group games" ON public.games;
CREATE POLICY "Members can delete group games"
ON public.games
FOR DELETE
TO authenticated
USING (
  (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Members can insert group season stats" ON public.player_season_stats;
CREATE POLICY "Members can insert group season stats"
ON public.player_season_stats
FOR INSERT
TO authenticated
WITH CHECK (
  (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Members can update group season stats" ON public.player_season_stats;
CREATE POLICY "Members can update group season stats"
ON public.player_season_stats
FOR UPDATE
TO authenticated
USING (
  (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4. video_comments: require user_id matches auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert video comments" ON public.video_comments;
CREATE POLICY "Authenticated users can insert video comments"
ON public.video_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 5. video_likes: require user_id matches auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert video likes" ON public.video_likes;
CREATE POLICY "Authenticated users can insert video likes"
ON public.video_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
