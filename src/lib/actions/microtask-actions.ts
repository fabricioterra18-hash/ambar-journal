'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspace } from '@/lib/services/workspace'
import { createMicrotasks, updateMicrotask, deleteMicrotask, deleteAllMicrotasks, getMicrotasks } from '@/lib/services/microtasks'
import { generateMicrotasks, expandMicrotask, simplifyMicrotasks, getNextStep, type NextStep } from '@/lib/ai/microtasks'
import { createClient } from '@/lib/supabase/server'

export async function generateMicrotasksForItem(itemId: string) {
  const supabase = await createClient()
  const workspace = await getWorkspace()

  // Get the parent item text
  const { data: item, error } = await supabase
    .from('journal_items')
    .select('text')
    .eq('id', itemId)
    .single()

  if (error || !item) throw new Error('Item not found')

  // Get existing microtasks to avoid duplicates
  const existing = await getMicrotasks(itemId)
  const existingTitles = existing.map(m => m.title)

  // Generate with AI
  const result = await generateMicrotasks(item.text, {
    existingMicrotasks: existingTitles,
  })

  // Save to database
  const startPosition = existing.length
  const microtaskInserts = result.microtasks.map((mt, i) => ({
    workspace_id: workspace.id,
    parent_item_id: itemId,
    title: mt.title,
    description: mt.description,
    status: 'open',
    position: startPosition + i,
    ai_generated: true,
  }))

  await createMicrotasks(microtaskInserts)

  // Log AI run
  await supabase.from('ai_runs').insert({
    workspace_id: workspace.id,
    user_id: (await supabase.auth.getUser()).data.user!.id,
    run_type: 'microtasks',
    target_type: 'journal_item',
    target_id: itemId,
    provider: 'qwen',
    status: 'completed',
    input_summary: item.text,
    output: result as unknown as Record<string, unknown>,
  })

  revalidatePath('/')
  revalidatePath('/journal')

  return result.microtasks
}

export async function expandMicrotaskAction(itemId: string, microtaskId: string) {
  const supabase = await createClient()
  const workspace = await getWorkspace()

  const { data: item } = await supabase
    .from('journal_items')
    .select('text')
    .eq('id', itemId)
    .single()

  const { data: microtask } = await supabase
    .from('microtasks')
    .select('title')
    .eq('id', microtaskId)
    .single()

  if (!item || !microtask) throw new Error('Not found')

  const result = await expandMicrotask(item.text, microtask.title)

  const existing = await getMicrotasks(itemId)
  const startPosition = existing.length

  const inserts = result.microtasks.map((mt, i) => ({
    workspace_id: workspace.id,
    parent_item_id: itemId,
    title: mt.title,
    description: mt.description,
    status: 'open',
    position: startPosition + i,
    ai_generated: true,
  }))

  await createMicrotasks(inserts)
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function simplifyMicrotasksAction(itemId: string) {
  const supabase = await createClient()
  const workspace = await getWorkspace()

  const { data: item } = await supabase
    .from('journal_items')
    .select('text')
    .eq('id', itemId)
    .single()

  if (!item) throw new Error('Item not found')

  const existing = await getMicrotasks(itemId)
  const titles = existing.map(m => m.title)

  const result = await simplifyMicrotasks(item.text, titles)

  // Replace all existing microtasks
  await deleteAllMicrotasks(itemId)

  const inserts = result.microtasks.map((mt, i) => ({
    workspace_id: workspace.id,
    parent_item_id: itemId,
    title: mt.title,
    description: mt.description,
    status: 'open',
    position: i,
    ai_generated: true,
  }))

  await createMicrotasks(inserts)
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function toggleMicrotask(microtaskId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('microtasks')
    .select('status')
    .eq('id', microtaskId)
    .single()

  if (!data) throw new Error('Microtask not found')

  const newStatus = data.status === 'completed' ? 'open' : 'completed'
  await updateMicrotask(microtaskId, { status: newStatus })

  revalidatePath('/')
  revalidatePath('/journal')
}

export async function removeMicrotask(microtaskId: string) {
  await deleteMicrotask(microtaskId)
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function regenerateMicrotasks(itemId: string) {
  await deleteAllMicrotasks(itemId)
  return generateMicrotasksForItem(itemId)
}

export async function getNextStepAction(itemId: string): Promise<NextStep> {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('journal_items')
    .select('text')
    .eq('id', itemId)
    .single()

  if (!item) throw new Error('Item not found')

  const microtasks = await getMicrotasks(itemId)
  const open = microtasks.filter(m => m.status === 'open').map(m => m.title)
  const done = microtasks.filter(m => m.status === 'completed').map(m => m.title)

  return getNextStep(item.text, open, done)
}
