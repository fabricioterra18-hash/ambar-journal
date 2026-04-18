-- Feedback do usuário
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own feedback" ON public.feedbacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own feedback" ON public.feedbacks FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id, created_at DESC);

-- Hints contextuais dispensados pelo usuário (ex: ["fab", "composer", "ai", "task"])
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS hints_dismissed jsonb DEFAULT '[]'::jsonb;
