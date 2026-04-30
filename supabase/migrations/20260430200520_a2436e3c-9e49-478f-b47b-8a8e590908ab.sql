
-- Chat messages between users and admins on a feedback request
CREATE TABLE public.feedback_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_chat_feedback_id ON public.feedback_chat_messages(feedback_id, created_at);

ALTER TABLE public.feedback_chat_messages ENABLE ROW LEVEL SECURITY;

-- Owner of the feedback request OR an admin can view chat messages
CREATE POLICY "View chat on own feedback or as admin"
ON public.feedback_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.feedback_requests fr
    WHERE fr.id = feedback_chat_messages.feedback_id
      AND (fr.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Insert: must be your own message AND you must either own the feedback, or be admin.
-- Also enforce a max of 200 messages per feedback to prevent spam.
CREATE OR REPLACE FUNCTION public.feedback_chat_within_limit(_feedback_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT COUNT(*) FROM public.feedback_chat_messages WHERE feedback_id = _feedback_id) < 200;
$$;

CREATE POLICY "Insert chat as participant"
ON public.feedback_chat_messages
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND public.feedback_chat_within_limit(feedback_id)
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.feedback_requests fr
      WHERE fr.id = feedback_chat_messages.feedback_id
        AND fr.user_id = auth.uid()
    )
  )
  AND (is_admin = public.has_role(auth.uid(), 'admin'::app_role))
);

-- Authors can delete their own chat messages
CREATE POLICY "Delete own chat messages"
ON public.feedback_chat_messages
FOR DELETE
USING (user_id = auth.uid());
