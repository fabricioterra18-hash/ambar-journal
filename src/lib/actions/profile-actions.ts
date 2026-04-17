'use server'

import { revalidatePath } from 'next/cache'
import { updateProfile } from '@/lib/services/workspace'

export async function updateProfileAction(data: { full_name?: string; avatar_url?: string }) {
  await updateProfile(data)
  revalidatePath('/settings')
}
