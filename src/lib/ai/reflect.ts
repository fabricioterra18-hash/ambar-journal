import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './provider'

const dailySummarySchema = z.object({
  summary: z.string().describe('Resumo curto e humano do dia'),
  completed_count: z.number(),
  pending_count: z.number(),
  migrated_count: z.number(),
  stuck_items: z.array(z.string()).describe('Itens que parecem travados ou migrados várias vezes'),
  suggestion: z.string().nullable().describe('Uma sugestão leve, se houver algo útil a dizer'),
})

export type DailySummary = z.infer<typeof dailySummarySchema>

const weeklySummarySchema = z.object({
  summary: z.string().describe('Resumo da semana em tom leve e humano'),
  patterns: z.array(z.string()).describe('Padrões observados na semana'),
  stuck_items: z.array(z.string()).describe('Itens que aparecem repetidamente sem conclusão'),
  wins: z.array(z.string()).describe('Conquistas e itens relevantes concluídos'),
  suggestion: z.string().nullable().describe('Sugestão de reorganização, se aplicável'),
})

export type WeeklySummary = z.infer<typeof weeklySummarySchema>

export async function generateDailySummary(items: { text: string; status: string; bullet_type: string }[]): Promise<DailySummary> {
  const itemsList = items.map(i => `[${i.bullet_type}/${i.status}] ${i.text}`).join('\n')

  const { object } = await generateObject({
    model: getModel(),
    schema: dailySummarySchema,
    prompt: `Você é um assistente de Bullet Journal. Analise os itens do dia e gere um resumo.

Regras:
- Tom calmo, humano, sem ser coach
- Não use jargão corporativo
- Identifique itens que parecem travados
- Sugira algo apenas se for genuinamente útil
- Seja breve

Itens do dia:
${itemsList}`,
  })

  return object
}

export async function generateWeeklySummary(
  dailyItems: { date: string; items: { text: string; status: string; bullet_type: string }[] }[]
): Promise<WeeklySummary> {
  const days = dailyItems.map(d => {
    const items = d.items.map(i => `  [${i.bullet_type}/${i.status}] ${i.text}`).join('\n')
    return `${d.date}:\n${items}`
  }).join('\n\n')

  const { object } = await generateObject({
    model: getModel(),
    schema: weeklySummarySchema,
    prompt: `Você é um assistente de Bullet Journal. Analise a semana e gere um resumo reflexivo.

Regras:
- Tom calmo e empático
- Identifique padrões (temas recorrentes, áreas de foco)
- Destaque conquistas sem exagero
- Aponte itens que parecem travados
- Sugira reorganização apenas se fizer sentido claro
- Sem jargão corporativo ou tom de coaching

Semana:
${days}`,
  })

  return object
}
