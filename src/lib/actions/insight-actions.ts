'use server'

import { getWorkspace } from '@/lib/services/workspace'
import { getPreferences } from '@/lib/services/preferences'
import { getItemsForWorkspace } from '@/lib/services/items'
import { generateDailySummary, generateWeeklySummary } from '@/lib/ai/reflect'
import { createClient } from '@/lib/supabase/server'
import { todayISO, toLocalDateKey, daysAgoISO } from '@/lib/utils'

export async function getDailySummary() {
  const prefs = await getPreferences()
  if (!prefs.ai_reflective_enabled) return null

  const workspace = await getWorkspace()
  const supabase = await createClient()
  const today = todayISO()

  // Get today's items
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('entry_date', today)
    .is('deleted_at', null)

  if (!entries?.length) return null

  const entryIds = entries.map(e => e.id)
  const { data: items } = await supabase
    .from('journal_items')
    .select('text, status, bullet_type')
    .in('entry_id', entryIds)
    .is('deleted_at', null)

  if (!items?.length) return null

  const summary = await generateDailySummary(items)

  // Log AI run
  await supabase.from('ai_runs').insert({
    workspace_id: workspace.id,
    user_id: (await supabase.auth.getUser()).data.user!.id,
    run_type: 'summary_daily',
    target_type: 'journal',
    target_id: null,
    provider: 'gemini',
    status: 'completed',
    input_summary: `${items.length} items for ${today}`,
    output: summary as unknown as Record<string, unknown>,
  })

  return summary
}

export async function getWeeklySummary() {
  const prefs = await getPreferences()
  if (!prefs.ai_reflective_enabled) return null

  const workspace = await getWorkspace()
  const supabase = await createClient()

  // Get last 7 days
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(toLocalDateKey(d))
  }

  const dailyItems: { date: string; items: { text: string; status: string; bullet_type: string }[] }[] = []

  for (const date of dates) {
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('entry_date', date)
      .is('deleted_at', null)

    if (!entries?.length) continue

    const entryIds = entries.map(e => e.id)
    const { data: items } = await supabase
      .from('journal_items')
      .select('text, status, bullet_type')
      .in('entry_id', entryIds)
      .is('deleted_at', null)

    if (items?.length) {
      dailyItems.push({ date, items })
    }
  }

  if (!dailyItems.length) return null

  const summary = await generateWeeklySummary(dailyItems)

  await supabase.from('ai_runs').insert({
    workspace_id: workspace.id,
    user_id: (await supabase.auth.getUser()).data.user!.id,
    run_type: 'summary_weekly',
    target_type: 'journal',
    target_id: null,
    provider: 'gemini',
    status: 'completed',
    input_summary: `${dailyItems.length} days, week review`,
    output: summary as unknown as Record<string, unknown>,
  })

  return summary
}
