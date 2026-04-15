'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspace } from '@/lib/services/workspace'
import { upsertMood } from '@/lib/services/mood'
import { createClient } from '@/lib/supabase/server'
import type { MoodScore } from '@/types/database'

export async function logMood(formData: FormData) {
  const score = Number(formData.get('score')) as MoodScore
  const note = formData.get('note') as string | null
  const energyLevel = formData.get('energy') ? Number(formData.get('energy')) as MoodScore : null
  const tagsRaw = formData.get('tags') as string | null
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

  if (!score || score < 1 || score > 5) return

  const workspace = await getWorkspace()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = new Date().toISOString().split('T')[0]

  await upsertMood(workspace.id, user.id, today, score, note, energyLevel, tags)
  revalidatePath('/')
}

export async function logMoodQuick(score: MoodScore) {
  const workspace = await getWorkspace()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = new Date().toISOString().split('T')[0]

  await upsertMood(workspace.id, user.id, today, score)
  revalidatePath('/')
}
