-- Function to automatically set updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NULL,
  email text NULL,
  avatar_url text NULL,
  ai_enabled boolean DEFAULT true,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. workspaces
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Meu Journal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own workspaces" ON public.workspaces FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER trigger_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. journals
CREATE TABLE public.journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('inbox', 'daily', 'weekly', 'monthly', 'future')),
  title text NULL,
  start_date date NULL,
  end_date date NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access journals via workspace" ON public.journals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
);
CREATE TRIGGER trigger_journals_updated_at BEFORE UPDATE ON public.journals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. collections
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NULL,
  color text NULL,
  icon text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access collections via workspace" ON public.collections FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
);
CREATE TRIGGER trigger_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. journal_entries
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  journal_id uuid NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  entry_type text NOT NULL,
  entry_date date NOT NULL,
  title text NULL,
  content_raw text NULL,
  content_rendered text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz NULL
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access entries via workspace" ON public.journal_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
);
CREATE TRIGGER trigger_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. journal_items (bullets)
CREATE TABLE public.journal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  parent_item_id uuid NULL REFERENCES public.journal_items(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  bullet_type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  text text NOT NULL,
  due_at timestamptz NULL,
  start_at timestamptz NULL,
  duration_min integer NULL,
  priority smallint NULL,
  collection_id uuid NULL REFERENCES public.collections(id) ON DELETE SET NULL,
  ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz NULL
);
ALTER TABLE public.journal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access items via workspace" ON public.journal_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
);
CREATE TRIGGER trigger_journal_items_updated_at BEFORE UPDATE ON public.journal_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. item_migrations
CREATE TABLE public.item_migrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.journal_items(id) ON DELETE CASCADE,
  from_entry_id uuid NULL REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  to_entry_id uuid NULL REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  from_date date NULL,
  to_date date NULL,
  reason text NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.item_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access migrations via workspace" ON public.item_migrations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
);

-- 8. microtasks
CREATE TABLE public.microtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_item_id uuid NOT NULL REFERENCES public.journal_items(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NULL,
  status text NOT NULL DEFAULT 'open',
  position integer NOT NULL DEFAULT 0,
  ai_generated boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.microtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access microtasks via workspace" ON public.microtasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
);
CREATE TRIGGER trigger_microtasks_updated_at BEFORE UPDATE ON public.microtasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. ai_runs
CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_type text NOT NULL,
  target_type text NULL,
  target_id uuid NULL,
  provider text NOT NULL DEFAULT 'qwen',
  status text NOT NULL,
  input_summary text NULL,
  output jsonb NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access ai_runs via mapping" ON public.ai_runs FOR ALL USING (auth.uid() = user_id);

-- 10. user_preferences
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled boolean DEFAULT true,
  ai_operational_enabled boolean DEFAULT true,
  ai_reflective_enabled boolean DEFAULT true,
  theme text DEFAULT 'amber-paper',
  reduce_motion boolean DEFAULT false,
  week_starts_on integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER trigger_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. integrations
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access integrations via workspace" ON public.integrations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
);
CREATE TRIGGER trigger_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Core Indexes
CREATE INDEX idx_profiles_user ON public.profiles(id);
CREATE INDEX idx_workspaces_user ON public.workspaces(user_id);
CREATE INDEX idx_journals_workspace ON public.journals(workspace_id);
CREATE INDEX idx_entries_journal_date ON public.journal_entries(journal_id, entry_date);
CREATE INDEX idx_items_entry ON public.journal_items(entry_id);
CREATE INDEX idx_items_collection ON public.journal_items(collection_id);
CREATE INDEX idx_items_status ON public.journal_items(status);
CREATE INDEX idx_microtasks_parent ON public.microtasks(parent_item_id);

-- Trigger to create profile and default workspace on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.workspaces (user_id, name)
  VALUES (NEW.id, 'Meu Journal')
  RETURNING id INTO v_workspace_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
