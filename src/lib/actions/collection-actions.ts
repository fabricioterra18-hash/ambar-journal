'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspace } from '@/lib/services/workspace'
import { createCollection, updateCollection, deleteCollection } from '@/lib/services/collections'

export async function createNewCollection(formData: FormData) {
  const name = formData.get('name') as string
  if (!name?.trim()) return

  const workspace = await getWorkspace()

  const description = formData.get('description') as string | null
  const color = formData.get('color') as string | null
  const icon = formData.get('icon') as string | null

  await createCollection({
    workspace_id: workspace.id,
    name: name.trim(),
    description: description?.trim() || null,
    color: color || null,
    icon: icon || null,
  })

  revalidatePath('/collections')
}

export async function editCollection(collectionId: string, formData: FormData) {
  const name = formData.get('name') as string
  if (!name?.trim()) return

  const description = formData.get('description') as string | null
  const color = formData.get('color') as string | null

  await updateCollection(collectionId, {
    name: name.trim(),
    description: description?.trim() || null,
    color: color || null,
  })

  revalidatePath('/collections')
}

export async function removeCollection(collectionId: string) {
  await deleteCollection(collectionId)
  revalidatePath('/collections')
}
