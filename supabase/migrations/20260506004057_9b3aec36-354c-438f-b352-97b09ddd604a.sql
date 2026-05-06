
-- event_rsvps: only owner can delete
DROP POLICY IF EXISTS "Authenticated users can delete their RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can delete their own RSVPs"
ON public.event_rsvps
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- video_likes: only owner can delete
DROP POLICY IF EXISTS "Authenticated users can delete video likes" ON public.video_likes;
CREATE POLICY "Users can delete their own video likes"
ON public.video_likes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- videos: restrict UPDATE to admins (no owner column on videos)
DROP POLICY IF EXISTS "Authenticated users can update videos" ON public.videos;
CREATE POLICY "Admins can update videos"
ON public.videos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- player_season_stats: tighten role to authenticated
DROP POLICY IF EXISTS "Members can insert group season stats" ON public.player_season_stats;
DROP POLICY IF EXISTS "Members can update group season stats" ON public.player_season_stats;
CREATE POLICY "Members can insert group season stats"
ON public.player_season_stats
FOR INSERT
TO authenticated
WITH CHECK ((group_id IS NULL) OR public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Members can update group season stats"
ON public.player_season_stats
FOR UPDATE
TO authenticated
USING ((group_id IS NULL) OR public.is_group_member(auth.uid(), group_id))
WITH CHECK ((group_id IS NULL) OR public.is_group_member(auth.uid(), group_id));

-- Storage: add UPDATE policy for the videos bucket scoped to owner folder
CREATE POLICY "Users can update their own videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);
