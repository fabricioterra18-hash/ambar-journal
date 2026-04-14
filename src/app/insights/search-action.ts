'use server'

import { searchItems } from '@/lib/services/items'
import type { JournalItem } from '@/types/database'

export async function searchItemsAction(workspaceId: string, query: string): Promise<JournalItem[]> {
  return searchItems(workspaceId, query)
}
