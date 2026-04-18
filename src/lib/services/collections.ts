import { createClient } from '@/lib/supabase/server'
import type { Collection, CollectionInsert } from '@/types/database'

export async function getCollections(workspaceId: string): Promise<Collection[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getCollection(collectionId: string): Promise<Collection> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .single()

  if (error) throw error
  return data
}

export async function createCollection(collection: CollectionInsert): Promise<Collection> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .insert(collection)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCollection(
  collectionId: string,
  updates: Partial<Pick<Collection, 'name' | 'description' | 'color' | 'icon'>>
): Promise<Collection> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', collectionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)

  if (error) throw error
}

export async function getCollectionItemCount(collectionId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('journal_items')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', collectionId)
    .is('deleted_at', null)

  if (error) throw error
  return count ?? 0
}

/**
 * Retorna contagem de itens por coleção em UMA query.
 * Evita N+1 quando a página precisa exibir muitas coleções.
 */
export async function getCollectionItemCounts(
  workspaceId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_items')
    .select('collection_id')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .not('collection_id', 'is', null)

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const cid = (row as { collection_id: string | null }).collection_id
    if (!cid) continue
    counts[cid] = (counts[cid] ?? 0) + 1
  }
  return counts
}
