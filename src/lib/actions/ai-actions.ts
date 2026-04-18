'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspace } from '@/lib/services/workspace'
import { getCollections } from '@/lib/services/collections'
import { getOrCreateDailyJournal, getOrCreateEntry } from '@/lib/services/journal'
import { createItem, updateItem, deleteItem } from '@/lib/services/items'
import { createClient } from '@/lib/supabase/server'
import { classifyInput, type ClassificationResult, type ClassifiedItem } from '@/lib/ai/classify'
import { analyzeItem, type AnalyzeSuggestion } from '@/lib/ai/analyze'
import { todayISO } from '@/lib/utils'
import type { BulletType } from '@/types/database'

// ── Captura com IA (composer) ──

export async function classifyText(
  text: string,
  previousAnswers?: { question: string; answer: string }[],
): Promise<ClassificationResult> {
  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)
  const collectionNames = collections.map(c => c.name)
  return classifyInput(text, collectionNames, previousAnswers)
}

/**
 * Salva itens confirmados pelo usuário (após tela de review).
 * Cada item pode ter sido editado inline antes da confirmação.
 */
export async function saveClassifiedItems(items: ClassifiedItem[]): Promise<number> {
  if (!items.length) return 0

  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)
  let count = 0

  for (const item of items) {
    const targetDate = item.suggested_date || todayISO()
    const journal = await getOrCreateDailyJournal(workspace.id, targetDate)
    const entry = await getOrCreateEntry(workspace.id, journal.id, targetDate)

    const hasDate = !!item.suggested_date
    const dueAt: string | null = hasDate
      ? (item.suggested_time
        ? `${item.suggested_date}T${item.suggested_time}:00`
        : `${item.suggested_date}T00:00:00`)
      : null
    const startAt: string | null = item.suggested_time && item.suggested_date
      ? `${item.suggested_date}T${item.suggested_time}:00`
      : null

    let collectionId: string | null = null
    if (item.suggested_collection) {
      const match = collections.find(c =>
        c.name.toLowerCase() === item.suggested_collection!.toLowerCase(),
      )
      if (match) collectionId = match.id
    }

    const saved = await createItem({
      workspace_id: workspace.id,
      entry_id: entry.id,
      parent_item_id: null,
      position: 0,
      bullet_type: item.bullet_type,
      status: 'open',
      text: item.clean_text,
      due_at: dueAt,
      start_at: startAt,
      duration_min: null,
      priority: item.priority,
      collection_id: collectionId,
      ai_generated: true,
    })

    // Gera microtarefas quando sugerido
    if (item.should_break_into_microtasks && saved.id) {
      try {
        const { generateMicrotasks } = await import('@/lib/ai/microtasks')
        const { createMicrotasks } = await import('@/lib/services/microtasks')
        const result = await generateMicrotasks(item.clean_text)
        await createMicrotasks(result.microtasks.map((mt, i) => ({
          workspace_id: workspace.id,
          parent_item_id: saved.id,
          title: mt.title,
          description: mt.description,
          status: 'open',
          position: i,
          ai_generated: true,
        })))
      } catch { /* fail silent */ }
    }

    count++
  }

  revalidatePath('/')
  revalidatePath('/journal')
  return count
}

// ── Análise pós-criação ──

export async function analyzeExistingItem(itemId: string): Promise<AnalyzeSuggestion> {
  const supabase = await createClient()
  const workspace = await getWorkspace()

  const { data: item, error } = await supabase
    .from('journal_items')
    .select('text, bullet_type, due_at, start_at, priority')
    .eq('id', itemId)
    .single()

  if (error || !item) throw new Error('Item not found')

  const collections = await getCollections(workspace.id)
  const suggestion = await analyzeItem({
    text: item.text,
    bullet_type: item.bullet_type,
    due_at: item.due_at,
    start_at: item.start_at,
    priority: item.priority,
    existingCollections: collections.map(c => c.name),
  })

  // Log
  try {
    await supabase.from('ai_runs').insert({
      workspace_id: workspace.id,
      user_id: (await supabase.auth.getUser()).data.user!.id,
      run_type: 'suggest',
      target_type: 'journal_item',
      target_id: itemId,
      provider: 'gemini',
      status: 'completed',
      input_summary: item.text,
      output: suggestion as unknown as Record<string, unknown>,
    })
  } catch { /* ignore log errors */ }

  return suggestion
}

export async function applyReclassify(
  itemId: string,
  reclassify: NonNullable<AnalyzeSuggestion['reclassify']>,
) {
  const workspace = await getWorkspace()
  const hasDate = !!reclassify.suggested_date
  const dueAt: string | null = hasDate
    ? (reclassify.suggested_time
      ? `${reclassify.suggested_date}T${reclassify.suggested_time}:00`
      : `${reclassify.suggested_date}T00:00:00`)
    : null
  const startAt: string | null = reclassify.suggested_time && reclassify.suggested_date
    ? `${reclassify.suggested_date}T${reclassify.suggested_time}:00`
    : null

  let collectionId: string | null | undefined = undefined
  if (reclassify.suggested_collection) {
    const collections = await getCollections(workspace.id)
    const match = collections.find(c =>
      c.name.toLowerCase() === reclassify.suggested_collection!.toLowerCase(),
    )
    if (match) collectionId = match.id
  }

  const updates: Parameters<typeof updateItem>[1] = {
    text: reclassify.clean_text,
    bullet_type: reclassify.bullet_type as BulletType,
    priority: reclassify.priority,
  }
  if (hasDate) updates.due_at = dueAt
  if (startAt !== null) updates.start_at = startAt
  if (collectionId !== undefined) updates.collection_id = collectionId

  await updateItem(itemId, updates)

  revalidatePath('/')
  revalidatePath('/journal')
}

export async function applySplit(
  itemId: string,
  parts: NonNullable<AnalyzeSuggestion['split_into']>,
) {
  if (!parts.length) return

  const workspace = await getWorkspace()

  for (const part of parts) {
    const targetDate = part.suggested_date || todayISO()
    const journal = await getOrCreateDailyJournal(workspace.id, targetDate)
    const entry = await getOrCreateEntry(workspace.id, journal.id, targetDate)

    const hasDate = !!part.suggested_date
    const dueAt: string | null = hasDate
      ? (part.suggested_time
        ? `${part.suggested_date}T${part.suggested_time}:00`
        : `${part.suggested_date}T00:00:00`)
      : null
    const startAt: string | null = part.suggested_time && part.suggested_date
      ? `${part.suggested_date}T${part.suggested_time}:00`
      : null

    await createItem({
      workspace_id: workspace.id,
      entry_id: entry.id,
      parent_item_id: null,
      position: 0,
      bullet_type: part.bullet_type,
      status: 'open',
      text: part.clean_text,
      due_at: dueAt,
      start_at: startAt,
      duration_min: null,
      priority: part.priority,
      collection_id: null,
      ai_generated: true,
    })
  }

  // Remove o item original — foi "quebrado"
  await deleteItem(itemId)

  revalidatePath('/')
  revalidatePath('/journal')
}
