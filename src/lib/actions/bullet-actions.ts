'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspace } from '@/lib/services/workspace'
import { getOrCreateDailyJournal, getOrCreateEntry, getOrCreateInbox } from '@/lib/services/journal'
import { createItem, updateItem, deleteItem, migrateItem } from '@/lib/services/items'
import { classifyInput } from '@/lib/ai/classify'
import { getCollections } from '@/lib/services/collections'
import { getPreferences } from '@/lib/services/preferences'
import type { BulletType, BulletStatus } from '@/types/database'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export async function captureBullet(formData: FormData) {
  const result = await captureBulletWithFeedback(formData)
  return result
}

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

      bulletType = classification.bullet_type
      priority = classification.priority
      cleanText = classification.clean_text
      dueAt = classification.suggested_date ? `${classification.suggested_date}T00:00:00Z` : null
      shouldBreakIntoMicrotasks = classification.should_break_into_microtasks
      aiUsed = true

      if (classification.suggested_collection) {
        const match = collections.find(c =>
          c.name.toLowerCase() === classification.suggested_collection!.toLowerCase()
        )
        if (match) collectionId = match.id
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

  // Auto-generate microtasks if AI suggests it
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
  reason?: string
) {
  const workspace = await getWorkspace()
  const journal = await getOrCreateDailyJournal(workspace.id, toDate)
  const entry = await getOrCreateEntry(workspace.id, journal.id, toDate)

  await migrateItem(itemId, entry.id, fromEntryId, fromDate, toDate, reason)
  revalidatePath('/')
  revalidatePath('/journal')
}

export async function assignToCollection(itemId: string, collectionId: string | null) {
  await updateItem(itemId, { collection_id: collectionId })
  revalidatePath('/')
  revalidatePath('/collections')
}
