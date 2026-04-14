-- Create feedback_requests table
CREATE TABLE public.feedback_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'new',
  screenshot_url text,
  video_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback" ON public.feedback_requests FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create feedback" ON public.feedback_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update feedback" ON public.feedback_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create feedback_comments table
CREATE TABLE public.feedback_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id uuid NOT NULL REFERENCES public.feedback_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their feedback" ON public.feedback_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.feedback_requests fr WHERE fr.id = feedback_id AND (fr.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Authenticated users can add comments" ON public.feedback_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.feedback_comments FOR DELETE USING (user_id = auth.uid());