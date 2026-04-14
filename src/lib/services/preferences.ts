import { createClient } from '@/lib/supabase/server'
import type { UserPreferences } from '@/types/database'

export async function getPreferences(): Promise<UserPreferences> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function updatePreferences(
  updates: Partial<Pick<UserPreferences, 'ai_enabled' | 'ai_operational_enabled' | 'ai_reflective_enabled' | 'theme' | 'reduce_motion' | 'week_starts_on'>>
): Promise<UserPreferences> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}
