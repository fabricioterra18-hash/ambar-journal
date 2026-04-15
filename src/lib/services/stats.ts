import { createClient } from '@/lib/supabase/server'
import type { DailyStats } from '@/types/database'

export async function getDailyStatsForDate(workspaceId: string, date: string): Promise<DailyStats | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('stat_date', date)
    .maybeSingle()
  return data
}

export async function getStatsHistory(workspaceId: string, days: number = 7): Promise<DailyStats[]> {
  const supabase = await createClient()
  const from = new Date()
  from.setDate(from.getDate() - days)

  const { data } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('stat_date', from.toISOString().split('T')[0])
    .order('stat_date', { ascending: true })

  return data ?? []
}

export async function computeAndSaveStats(workspaceId: string, date: string): Promise<DailyStats> {
  const supabase = await createClient()

  // Get entries for the date
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('entry_date', date)
    .is('deleted_at', null)

  let tasksCreated = 0, tasksCompleted = 0, tasksMigrated = 0
  let eventsCount = 0, notesCount = 0, insightsCount = 0

  if (entries?.length) {
    const entryIds = entries.map(e => e.id)
    const { data: items } = await supabase
      .from('journal_items')
      .select('bullet_type, status')
      .in('entry_id', entryIds)
      .is('deleted_at', null)

    if (items) {
      for (const item of items) {
        if (item.bullet_type === 'task') {
          tasksCreated++
          if (item.status === 'completed') tasksCompleted++
          if (item.status === 'migrated') tasksMigrated++
        }
        if (item.bullet_type === 'event') eventsCount++
        if (item.bullet_type === 'note') notesCount++
        if (item.bullet_type === 'insight') insightsCount++
      }
    }
  }

  const productiveScore = tasksCreated > 0
    ? Math.round((tasksCompleted / tasksCreated) * 100)
    : 0

  const { data, error } = await supabase
    .from('daily_stats')
    .upsert({
      workspace_id: workspaceId,
      stat_date: date,
      tasks_created: tasksCreated,
      tasks_completed: tasksCompleted,
      tasks_migrated: tasksMigrated,
      events_count: eventsCount,
      notes_count: notesCount,
      insights_count: insightsCount,
      productive_score: productiveScore,
    }, { onConflict: 'workspace_id,stat_date' })
    .select()
    .single()

  if (error) throw error
  return data
}
