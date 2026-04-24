-- Profiles: name fields, touch settings, account management
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS long_press_duration_ms integer NOT NULL DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS is_blacklisted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_verification boolean NOT NULL DEFAULT false;

-- Players: add last_name (nullable, optional)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS last_name text;

-- Feedback: admin notes for status changes
ALTER TABLE public.feedback_requests
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- RLS: Admins can update players
DROP POLICY IF EXISTS "Admins can update players" ON public.players;
CREATE POLICY "Admins can update players"
  ON public.players FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can delete players
DROP POLICY IF EXISTS "Admins can delete players" ON public.players;
CREATE POLICY "Admins can delete players"
  ON public.players FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can view & manage all feedback comments
DROP POLICY IF EXISTS "Admins can view all feedback comments" ON public.feedback_comments;
CREATE POLICY "Admins can view all feedback comments"
  ON public.feedback_comments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster feedback queries
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback_requests(status);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback_requests(user_id);