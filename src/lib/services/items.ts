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
  updates: Partial<Pick<JournalItem, 'text' | 'bullet_type' | 'status' | 'due_at' | 'priority' | 'collection_id'>>
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
