// ── Core entity types matching the Supabase schema ──

export type BulletType = 'task' | 'event' | 'note' | 'priority' | 'insight' | 'migrated' | 'completed' | 'scheduled'
export type BulletStatus = 'open' | 'completed' | 'migrated' | 'scheduled' | 'archived'
export type JournalKind = 'inbox' | 'daily' | 'weekly' | 'monthly' | 'future'
export type AIRunType = 'classify' | 'microtasks' | 'summary_daily' | 'summary_weekly' | 'suggest' | 'reflect'
export type AIRunStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  ai_enabled: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Journal {
  id: string
  workspace_id: string
  kind: JournalKind
  title: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  workspace_id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  workspace_id: string
  journal_id: string
  entry_type: string
  entry_date: string
  title: string | null
  content_raw: string | null
  content_rendered: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface JournalItem {
  id: string
  workspace_id: string
  entry_id: string
  parent_item_id: string | null
  position: number
  bullet_type: BulletType
  status: BulletStatus
  text: string
  due_at: string | null
  start_at: string | null
  duration_min: number | null
  priority: number | null
  collection_id: string | null
  ai_generated: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  // joined
  microtasks?: Microtask[]
  collection?: Collection | null
}

export interface ItemMigration {
  id: string
  workspace_id: string
  item_id: string
  from_entry_id: string | null
  to_entry_id: string | null
  from_date: string | null
  to_date: string | null
  reason: string | null
  created_at: string
}

export interface Microtask {
  id: string
  workspace_id: string
  parent_item_id: string
  title: string
  description: string | null
  status: string
  position: number
  ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface AIRun {
  id: string
  workspace_id: string
  user_id: string
  run_type: AIRunType
  target_type: string | null
  target_id: string | null
  provider: string
  status: AIRunStatus
  input_summary: string | null
  output: Record<string, unknown> | null
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  ai_enabled: boolean
  ai_operational_enabled: boolean
  ai_reflective_enabled: boolean
  theme: string
  reduce_motion: boolean
  week_starts_on: number
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  workspace_id: string
  provider: string
  status: string
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ── Mood & Stats ──

export type MoodScore = 1 | 2 | 3 | 4 | 5
export type MoodLabel = 'bad' | 'meh' | 'okay' | 'good' | 'great'

export interface MoodEntry {
  id: string
  workspace_id: string
  user_id: string
  entry_date: string
  mood_score: MoodScore
  mood_label: MoodLabel
  note: string | null
  energy_level: MoodScore | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface DailyStats {
  id: string
  workspace_id: string
  stat_date: string
  tasks_created: number
  tasks_completed: number
  tasks_migrated: number
  events_count: number
  notes_count: number
  insights_count: number
  productive_score: number
  created_at: string
  updated_at: string
}

// ── Insert types (omit auto-generated fields) ──

export type JournalItemInsert = Omit<JournalItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'microtasks' | 'collection'>
export type MicrotaskInsert = Omit<Microtask, 'id' | 'created_at' | 'updated_at'>
export type CollectionInsert = Omit<Collection, 'id' | 'created_at' | 'updated_at'>
export type JournalEntryInsert = Pick<JournalEntry, 'workspace_id' | 'journal_id' | 'entry_type' | 'entry_date'> & Partial<Pick<JournalEntry, 'title' | 'content_raw' | 'content_rendered'>>
