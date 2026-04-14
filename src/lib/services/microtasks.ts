import { createClient } from '@/lib/supabase/server'
import type { Microtask, MicrotaskInsert } from '@/types/database'

export async function getMicrotasks(parentItemId: string): Promise<Microtask[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('microtasks')
    .select('*')
    .eq('parent_item_id', parentItemId)
    .order('position', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createMicrotasks(microtasks: MicrotaskInsert[]): Promise<Microtask[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('microtasks')
    .insert(microtasks)
    .select()

  if (error) throw error
  return data ?? []
}

export async function updateMicrotask(
  microtaskId: string,
  updates: Partial<Pick<Microtask, 'title' | 'description' | 'status' | 'position'>>
): Promise<Microtask> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('microtasks')
    .update(updates)
    .eq('id', microtaskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMicrotask(microtaskId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('microtasks')
    .delete()
    .eq('id', microtaskId)

  if (error) throw error
}

export async function deleteAllMicrotasks(parentItemId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('microtasks')
    .delete()
    .eq('parent_item_id', parentItemId)

  if (error) throw error
}
