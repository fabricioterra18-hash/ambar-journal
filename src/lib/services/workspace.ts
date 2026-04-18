import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Workspace } from '@/types/database'

// React.cache deduplica chamadas por requisição — múltiplas páginas/componentes
// que pedem o workspace no mesmo request compartilham o mesmo resultado.
export const getWorkspace = cache(async (): Promise<Workspace> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
})

export const getProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
})

export async function updateProfile(updates: { full_name?: string; avatar_url?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw error
}
