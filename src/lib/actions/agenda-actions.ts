'use server'

import { getWorkspace } from '@/lib/services/workspace'
import {
  getItemsForDate,
  getActiveDatesForMonth,
} from '@/lib/services/items'
import type { JournalItem } from '@/types/database'

/**
 * Read-only: busca itens de uma data específica SEM criar journal/entry.
 * Usado pelo sheet do calendário ao clicar num dia qualquer.
 */
export async function fetchAgendaForDate(dateKey: string): Promise<JournalItem[]> {
  const workspace = await getWorkspace()
  return getItemsForDate(workspace.id, dateKey)
}

/**
 * Retorna as datas do mês que têm itens. Chamado pelo calendário
 * sempre que o usuário navega para outro mês.
 */
export async function fetchActiveDatesForMonth(year: number, month: number): Promise<string[]> {
  const workspace = await getWorkspace()
  return getActiveDatesForMonth(workspace.id, year, month)
}
