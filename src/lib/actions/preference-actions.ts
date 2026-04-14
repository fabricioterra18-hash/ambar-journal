'use server'

import { revalidatePath } from 'next/cache'
import { updatePreferences } from '@/lib/services/preferences'

export async function toggleAI(enabled: boolean) {
  await updatePreferences({ ai_enabled: enabled })
  revalidatePath('/settings')
}

export async function toggleOperationalAI(enabled: boolean) {
  await updatePreferences({ ai_operational_enabled: enabled })
  revalidatePath('/settings')
}

export async function toggleReflectiveAI(enabled: boolean) {
  await updatePreferences({ ai_reflective_enabled: enabled })
  revalidatePath('/settings')
}

export async function setWeekStartDay(day: number) {
  await updatePreferences({ week_starts_on: day })
  revalidatePath('/settings')
}

export async function toggleReduceMotion(enabled: boolean) {
  await updatePreferences({ reduce_motion: enabled })
  revalidatePath('/settings')
}
