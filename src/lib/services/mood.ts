import { createClient } from '@/lib/supabase/server'
import type { MoodEntry, MoodScore, MoodLabel } from '@/types/database'

const MOOD_LABELS: Record<MoodScore, MoodLabel> = {
  1: 'bad',
  2: 'meh',
  3: 'okay',
  4: 'good',
  5: 'great',
}

export async function getMoodForDate(workspaceId: string, date: string): Promise<MoodEntry | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('entry_date', date)
    .maybeSingle()
  return data
}

export async function getMoodHistory(workspaceId: string, days: number = 30): Promise<MoodEntry[]> {
  const supabase = await createClient()
  const from = new Date()
  from.setDate(from.getDate() - days)

  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('entry_date', from.toISOString().split('T')[0])
    .order('entry_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function upsertMood(
  workspaceId: string,
  userId: string,
  date: string,
  score: MoodScore,
  note?: string | null,
  energyLevel?: MoodScore | null,
  tags?: string[]
): Promise<MoodEntry> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mood_entries')
    .upsert({
      workspace_id: workspaceId,
      user_id: userId,
      entry_date: date,
      mood_score: score,
      mood_label: MOOD_LABELS[score],
      note: note ?? null,
      energy_level: energyLevel ?? null,
      tags: tags ?? [],
    }, { onConflict: 'workspace_id,entry_date' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWeekMoods(workspaceId: string): Promise<MoodEntry[]> {
  const supabase = await createClient()
  const from = new Date()
  from.setDate(from.getDate() - 6)

  const { data } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('entry_date', from.toISOString().split('T')[0])
    .order('entry_date', { ascending: true })

  return data ?? []
}
