DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Signed-in users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Event RSVPs are viewable by everyone" ON public.event_rsvps;
CREATE POLICY "Signed-in users can view event RSVPs" ON public.event_rsvps FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert event RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can RSVP as themselves" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert videos" ON public.videos;
CREATE POLICY "Group members or admins can add videos" ON public.videos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id)));

DROP POLICY IF EXISTS "Authenticated users can insert players" ON public.players;
CREATE POLICY "Admins can insert players" ON public.players FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;