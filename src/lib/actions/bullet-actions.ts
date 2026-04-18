'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspace } from '@/lib/services/workspace'
import { getOrCreateDailyJournal, getOrCreateEntry, getOrCreateInbox } from '@/lib/services/journal'
import { createItem, updateItem, deleteItem, migrateItem } from '@/lib/services/items'
import { classifyInput, type ClassifiedItem, type ClassificationResult } from '@/lib/ai/classify'
import { getCollections } from '@/lib/services/collections'
import { getPreferences } from '@/lib/services/preferences'
import type { BulletType } from '@/types/database'
import { todayISO } from '@/lib/utils'

// ── Manual capture (no AI) ──

export async function captureManualBullet(data: {
  text: string
  bullet_type: BulletType
  date?: string | null
  time?: string | null
  priority?: number | null
  collection_id?: string | null
}) {
  if (!data.text?.trim()) return null

  const workspace = await getWorkspace()
  const targetDate = data.date || todayISO()

  const journal = await getOrCreateDailyJournal(workspace.id, targetDate)
  const entry = await getOrCreateEntry(workspace.id, journal.id, targetDate)

  let dueAt: string | null = null
  if (data.date) {
    dueAt = data.time
      ? `${data.date}T${data.time}:00`
      : `${data.date}T00:00:00`
  }

  const item = await createItem({
    workspace_id: workspace.id,
    entry_id: entry.id,
    parent_item_id: null,
    position: 0,
    bullet_type: data.bullet_type,
    status: 'open',
    text: data.text.trim(),
    due_at: dueAt,
    start_at: data.time && data.date ? `${data.date}T${data.time}:00` : null,
    duration_min: null,
    priority: data.priority ?? null,
    collection_id: data.collection_id ?? null,
    ai_generated: false,
  })

  revalidatePath('/')
  revalidatePath('/journal')

  return { id: item.id, bullet_type: data.bullet_type, text: data.text.trim() }
}

// ── AI-assisted classification (returns suggestions, does NOT save) ──

export async function classifyWithAI(text: string): Promise<ClassificationResult> {
  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)
  const collectionNames = collections.map(c => c.name)
  return classifyInput(text, collectionNames)
}

// ── Confirm and save AI suggestions (saves all items) ──

export async function confirmAISuggestions(items: ClassifiedItem[]) {
  if (!items.length) return []

  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)
  const savedItems = []

  for (const item of items) {
    const targetDate = item.suggested_date || todayISO()
    const journal = await getOrCreateDailyJournal(workspace.id, targetDate)
    const entry = await getOrCreateEntry(workspace.id, journal.id, targetDate)

    let dueAt: string | null = null
    if (item.suggested_date) {
      dueAt = item.suggested_time
        ? `${item.suggested_date}T${item.suggested_time}:00`
        : `${item.suggested_date}T00:00:00`
    }

    let collectionId: string | null = null
    if (item.suggested_collection) {
      const match = collections.find(c =>
        c.name.toLowerCase() === item.suggested_collection!.toLowerCase()
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
      start_at: item.suggested_time && item.suggested_date
        ? `${item.suggested_date}T${item.suggested_time}:00`
        : null,
      duration_min: null,
      priority: item.priority,
      collection_id: collectionId,
      ai_generated: true,
    })

    // Auto-generate microtasks if AI suggests
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
      } catch {
        // Microtask generation failed silently
      }
    }

    savedItems.push({
      id: saved.id,
      bullet_type: item.bullet_type,
      text: item.clean_text,
      has_microtasks: item.should_break_into_microtasks,
    })
  }

  revalidatePath('/')
  revalidatePath('/journal')

  return savedItems
}

// ── Legacy: capture with auto-AI (kept for JournalComposer inline) ──

export async function captureBulletWithFeedback(formData: FormData) {
  const text = formData.get('text') as string
  if (!text?.trim()) return null

  const workspace = await getWorkspace()
  const today = todayISO()

  const journal = await getOrCreateDailyJournal(workspace.id, today)
  const entry = await getOrCreateEntry(workspace.id, journal.id, today)

  let bulletType: BulletType = 'note'
  let priority: number | null = null
  let dueAt: string | null = null
  let collectionId: string | null = null
  let cleanText = text.trim()
  let shouldBreakIntoMicrotasks = false
  let aiUsed = false

  try {
    const prefs = await getPreferences()

    if (prefs.ai_operational_enabled) {
      const collections = await getCollections(workspace.id)
      const collectionNames = collections.map(c => c.name)
      const classification = await classifyInput(text, collectionNames)

      // Use first item from multi-item result
      const first = classification.items[0]
      if (first) {
        bulletType = first.bullet_type
        priority = first.priority
        cleanText = first.clean_text
        dueAt = first.suggested_date ? `${first.suggested_date}T00:00:00` : null
        shouldBreakIntoMicrotasks = first.should_break_into_microtasks
        aiUsed = true

        if (first.suggested_collection) {
          const match = collections.find(c =>
            c.name.toLowerCase() === first.suggested_collection!.toLowerCase()
          )
          if (match) collectionId = match.id
        }
      }
    }
  } catch {
    // AI failed — fall back to plain note
  }

  const item = await createItem({
    workspace_id: workspace.id,
    entry_id: entry.id,
    parent_item_id: null,
    position: 0,
    bullet_type: bulletType,
    status: 'open',
    text: cleanText,
    due_at: dueAt,
    start_at: null,
    duration_min: null,
    priority,
    collection_id: collectionId,
    ai_generated: aiUsed,
  })

  if (shouldBreakIntoMicrotasks && item.id) {
    try {
      const { generateMicrotasks } = await import('@/lib/ai/microtasks')
      const { createMicrotasks } = await import('@/lib/services/microtasks')
      const result = await generateMicrotasks(cleanText)
      await createMicrotasks(result.microtasks.map((mt, i) => ({
        workspace_id: workspace.id,
        parent_item_id: item.id,
        title: mt.title,
        description: mt.description,
        status: 'open',
        position: i,
        ai_generated: true,
      })))
    } catch {
      // Microtask generation failed silently
    }
  }

  revalidatePath('/')
  revalidatePath('/journal')

  return {
    bullet_type: bulletType,
    clean_text: cleanText,
    should_break_into_microtasks: shouldBreakIntoMicrotasks,
    ai_used: aiUsed,
  }
}

// ── Quick capture to inbox (no AI, no classification) ──

export async function captureToInbox(formData: FormData) {
  const text = formData.get('text') as string
  if (!text?.trim()) return

  const workspace = await getWorkspace()
  const today = todayISO()
  const inbox = await getOrCreateInbox(workspace.id)
  const entry = await getOrCreateEntry(workspace.id, inbox.id, today, 'inbox')

  await createItem({
    workspace_id: workspace.id,
    entry_id: entry.id,
    parent_item_id: null,
    position: 0,
    bullet_type: 'note',
    status: 'open',
    text: text.trim(),
    due_at: null,
    start_at: null,
    duration_min: null,
    priority: null,
    collection_id: null,
    ai_generated: false,
  })

  revalidatePath('/')
  revalidatePath('/journal')
}

// ── Item mutations ──

export async function completeBullet(itemId: string) {
  await updateItem(itemId, { status: 'completed' })
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function reopenBullet(itemId: string) {
  await updateItem(itemId, { status: 'open' })
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function updateBulletText(itemId: string, text: string) {
  await updateItem(itemId, { text })
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function updateBulletType(itemId: string, bulletType: BulletType) {
  await updateItem(itemId, { bullet_type: bulletType })
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function updateBulletPriority(itemId: string, priority: number | null) {
  await updateItem(itemId, { priority })
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function updateBulletDue(itemId: string, dueAt: string | null) {
  await updateItem(itemId, { due_at: dueAt })
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function archiveBullet(itemId: string) {
  await updateItem(itemId, { status: 'archived' })
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function removeBullet(itemId: string) {
  await deleteItem(itemId)
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function migrateBulletToDate(
  itemId: string,
  fromEntryId: string,
  fromDate: string,
  toDate: string,
  reason?: string,
) {
  const workspace = await getWorkspace()
  const journal = await getOrCreateDailyJournal(workspace.id, toDate)
  const entry = await getOrCreateEntry(workspace.id, journal.id, toDate)

  await migrateItem(itemId, entry.id, fromEntryId, fromDate, toDate, reason)

  // Reabrir no destino: migração deve resultar em uma tarefa acionável,
  // não um item histórico. O rastreio fica na tabela item_migrations.
  await updateItem(itemId, { status: 'open' })

  revalidatePath('/')
  revalidatePath('/journal')
}

/**
 * Atalho para mover um item de um dia anterior para hoje.
 * Mantém histórico em item_migrations. Ideal para o botão de pendências.
 */
export async function moveBulletToToday(
  itemId: string,
  fromEntryId: string,
  fromDate: string,
  reason?: string,
) {
  const toDate = todayISO()
  if (fromDate === toDate) return
  return migrateBulletToDate(itemId, fromEntryId, fromDate, toDate, reason ?? 'move_to_today')
}

export async function assignToCollection(itemId: string, collectionId: string | null) {
  await updateItem(itemId, { collection_id: collectionId })
  revalidatePath('/')
  revalidatePath('/collections')
}
