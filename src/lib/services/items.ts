import { createClient } from '@/lib/supabase/server'
import type { JournalItem, JournalItemInsert, BulletStatus } from '@/types/database'

export async function getItemsForEntry(entryId: string): Promise<JournalItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_items')
    .select('*, microtasks(*)')
    .eq('entry_id', entryId)
    .is('deleted_at', null)
    .order('position', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getItemsForWorkspace(workspaceId: string, filters?: {
  status?: BulletStatus
  bullet_type?: string
  collection_id?: string
  limit?: number
}): Promise<JournalItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('journal_items')
    .select('*, microtasks(*)')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.bullet_type) query = query.eq('bullet_type', filters.bullet_type)
  if (filters?.collection_id) query = query.eq('collection_id', filters.collection_id)

  query = query.order('created_at', { ascending: false })

  if (filters?.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createItem(item: JournalItemInsert): Promise<JournalItem> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_items')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateItem(
  itemId: string,
  updates: Partial<Pick<JournalItem, 'text' | 'bullet_type' | 'status' | 'due_at' | 'start_at' | 'priority' | 'collection_id'>>,
): Promise<JournalItem> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteItem(itemId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('journal_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) throw error
}

export async function migrateItem(
  itemId: string,
  toEntryId: string,
  fromEntryId: string,
  fromDate: string,
  toDate: string,
  reason?: string
): Promise<void> {
  const supabase = await createClient()

  // Get the item to find workspace_id
  const { data: item, error: fetchError } = await supabase
    .from('journal_items')
    .select('workspace_id')
    .eq('id', itemId)
    .single()

  if (fetchError || !item) throw fetchError ?? new Error('Item not found')

  // Update item status and entry
  const { error: updateError } = await supabase
    .from('journal_items')
    .update({ status: 'migrated', entry_id: toEntryId })
    .eq('id', itemId)

  if (updateError) throw updateError

  // Record migration
  const { error: migError } = await supabase
    .from('item_migrations')
    .insert({
      workspace_id: item.workspace_id,
      item_id: itemId,
      from_entry_id: fromEntryId,
      to_entry_id: toEntryId,
      from_date: fromDate,
      to_date: toDate,
      reason,
    })

  if (migError) throw migError
}

/**
 * Read-only fetch of items for a specific date (NO auto-create of journal/entry).
 * Single query via inner join.
 */
export async function getItemsForDate(workspaceId: string, dateKey: string): Promise<JournalItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_items')
    .select('*, microtasks(*), journal_entries!inner(entry_date, deleted_at)')
    .eq('workspace_id', workspaceId)
    .eq('journal_entries.entry_date', dateKey)
    .is('deleted_at', null)
    .is('journal_entries.deleted_at', null)
    .order('position', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as JournalItem[]
}

/**
 * Returns distinct YYYY-MM-DD dates that have at least one non-deleted item
 * within [fromKey, toKey] inclusive. Used for calendar dots.
 */
export async function getActiveDatesInRange(
  workspaceId: string,
  fromKey: string,
  toKey: string,
): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_entries')
    .select('entry_date, journal_items!inner(id)')
    .eq('workspace_id', workspaceId)
    .gte('entry_date', fromKey)
    .lte('entry_date', toKey)
    .is('deleted_at', null)
    .is('journal_items.deleted_at', null)

  if (error) throw error
  const set = new Set<string>()
  for (const row of data ?? []) {
    if ((row as { journal_items?: unknown[] }).journal_items?.length) {
      set.add((row as { entry_date: string }).entry_date)
    }
  }
  return Array.from(set)
}

/**
 * Returns pending (open) task items from dates BEFORE a given date.
 * Used for "pendências migram corretamente" and rollover logic.
 */
export async function getPendingTasksBefore(
  workspaceId: string,
  beforeDateKey: string,
  limit = 30,
): Promise<JournalItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_items')
    .select('*, journal_entries!inner(entry_date)')
    .eq('workspace_id', workspaceId)
    .eq('status', 'open')
    .eq('bullet_type', 'task')
    .is('deleted_at', null)
    .lt('journal_entries.entry_date', beforeDateKey)
    .order('journal_entries(entry_date)', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as unknown as JournalItem[]
}

export async function searchItems(workspaceId: string, query: string): Promise<JournalItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .ilike('text', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data ?? []
}
