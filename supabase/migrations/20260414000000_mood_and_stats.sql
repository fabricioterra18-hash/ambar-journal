-- =============================================
-- Mood entries and daily stats for Âmbar Journal
-- =============================================

-- Mood entries: daily mood logging
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  mood_score smallint NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  -- 1=bad, 2=meh, 3=okay, 4=good, 5=great
  mood_label text NOT NULL DEFAULT 'okay',
  note text,
  energy_level smallint CHECK (energy_level BETWEEN 1 AND 5),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, entry_date)
);

-- Daily stats: aggregated stats per day
CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  tasks_created int DEFAULT 0,
  tasks_completed int DEFAULT 0,
  tasks_migrated int DEFAULT 0,
  events_count int DEFAULT 0,
  notes_count int DEFAULT 0,
  insights_count int DEFAULT 0,
  productive_score smallint DEFAULT 0 CHECK (productive_score BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, stat_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mood_entries_workspace_date ON mood_entries(workspace_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_workspace_date ON daily_stats(workspace_id, stat_date DESC);

-- RLS
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own moods" ON mood_entries
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users see own stats" ON daily_stats
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- Triggers
CREATE TRIGGER mood_entries_updated_at
  BEFORE UPDATE ON mood_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER daily_stats_updated_at
  BEFORE UPDATE ON daily_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
