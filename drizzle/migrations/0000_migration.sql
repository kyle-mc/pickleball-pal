DROP POLICY IF EXISTS "Signed-in users can view profiles" ON public.profiles;
CREATE POLICY "Group members can view profiles" ON public.profiles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = profiles.user_id
      AND gm.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Signed-in users can view event RSVPs" ON public.event_rsvps;
CREATE POLICY "Group members can view event RSVPs" ON public.event_rsvps FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can view players" ON public.players;
CREATE POLICY "Group members can view players" ON public.players FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Group members can view events" ON public.events FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Video likes are viewable by everyone" ON public.video_likes;
CREATE POLICY "Group members can view video likes" ON public.video_likes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.id = video_likes.video_id
      AND (v.group_id IS NULL AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.user_id = auth.uid())
           OR public.is_group_member(auth.uid(), v.group_id))
  )
);

DROP POLICY IF EXISTS "Anyone can view video comments" ON public.video_comments;
CREATE POLICY "Group members can view video comments" ON public.video_comments FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.id = video_comments.video_id
      AND (v.group_id IS NULL AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.user_id = auth.uid())
           OR public.is_group_member(auth.uid(), v.group_id))
  )
);