'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getPreferences } from '@/lib/services/preferences'

export const HINT_KEYS = ['fab', 'composer', 'ai', 'task', 'home'] as const
export type HintKey = (typeof HINT_KEYS)[number]

/** Marca um hint como dispensado para este usuário. Idempotente. */
export async function dismissHint(key: HintKey) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const prefs = await getPreferences().catch(() => null)
  const current = Array.isArray(prefs?.hints_dismissed) ? prefs!.hints_dismissed : []
  if (current.includes(key)) return

  const next = Array.from(new Set([...current, key]))
  await supabase
    .from('user_preferences')
    .update({ hints_dismissed: next })
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
}

/** Limpa todos os hints dispensados — usado pelo "Ver tutorial novamente". */
export async function resetHints() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('user_preferences')
    .update({ hints_dismissed: [] })
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
}

/** Reativa o onboarding inicial. */
export async function resetOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('profiles')
    .update({ onboarding_completed: false })
    .eq('id', user.id)
  revalidatePath('/', 'layout')
}
