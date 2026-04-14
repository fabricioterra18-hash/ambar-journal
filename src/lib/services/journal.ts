import { createClient } from '@/lib/supabase/server'
import type { Journal, JournalEntry, JournalEntryInsert } from '@/types/database'

export async function getOrCreateDailyJournal(workspaceId: string, date: string): Promise<Journal> {
  const supabase = await createClient()

  // Try to find existing daily journal for this date
  const { data: existing } = await supabase
    .from('journals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('kind', 'daily')
    .eq('start_date', date)
    .single()

  if (existing) return existing

  // Create new daily journal
  const { data, error } = await supabase
    .from('journals')
    .insert({
      workspace_id: workspaceId,
      kind: 'daily',
      title: null,
      start_date: date,
      end_date: date,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getOrCreateInbox(workspaceId: string): Promise<Journal> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('journals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('kind', 'inbox')
    .single()

  if (existing) return existing

  const { data, error } = await supabase
    .from('journals')
    .insert({
      workspace_id: workspaceId,
      kind: 'inbox',
      title: 'Inbox',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getOrCreateEntry(
  workspaceId: string,
  journalId: string,
  date: string,
  entryType: string = 'daily_log'
): Promise<JournalEntry> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('journal_id', journalId)
    .eq('entry_date', date)
    .is('deleted_at', null)
    .single()

  if (existing) return existing

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      workspace_id: workspaceId,
      journal_id: journalId,
      entry_type: entryType,
      entry_date: date,
    } satisfies JournalEntryInsert)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEntriesForDate(workspaceId: string, date: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('entry_date', date)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}
