import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './provider'
import { todayISO } from '@/lib/utils'

// ── Schema for multi-item classification ──

const classifiedItemSchema = z.object({
  bullet_type: z.enum(['task', 'event', 'note', 'insight']).describe('Tipo do bullet'),
  clean_text: z.string().describe('Texto limpo e organizado do item'),
  suggested_date: z.string().nullable().describe('Data sugerida YYYY-MM-DD, se mencionada ou inferida'),
  suggested_time: z.string().nullable().describe('Horário sugerido HH:MM, se mencionado'),
  priority: z.number().min(0).max(3).nullable().describe('0=nenhuma, 1=baixa, 2=média, 3=alta'),
  suggested_collection: z.string().nullable().describe('Nome de coleção sugerida, se aplicável'),
  should_break_into_microtasks: z.boolean().describe('Se é complexa o suficiente para quebrar em passos'),
})

const classificationResultSchema = z.object({
  items: z.array(classifiedItemSchema).describe('Lista de itens extraídos do texto'),
  needs_clarification: z.boolean().describe('Se falta contexto importante para organizar melhor'),
  clarifying_questions: z.array(z.string()).describe('Perguntas curtas e diretas para esclarecer, se necessário'),
})

export type ClassifiedItem = z.infer<typeof classifiedItemSchema>
export type ClassificationResult = z.infer<typeof classificationResultSchema>

// Keep legacy type for backward compat
export type Classification = ClassifiedItem

export async function classifyInput(
  text: string,
  existingCollections: string[] = [],
): Promise<ClassificationResult> {
  const today = todayISO()

  const { object } = await generateObject({
    model: getModel(),
    schema: classificationResultSchema,
    prompt: `Você é um assistente de Bullet Journal. Analise o texto abaixo e extraia TODOS os itens distintos.

Data de hoje: ${today}

Coleções existentes: ${existingCollections.length > 0 ? existingCollections.join(', ') : 'nenhuma'}

## Regras de tipo
- "task": algo que precisa ser feito (ação, compra, to-do)
- "event": compromisso com data/hora definida (reunião, consulta, salão)
- "note": observação, pensamento, registro, anotação
- "insight": reflexão, aprendizado, padrão percebido

## Regras de extração
- Se o texto contém MÚLTIPLAS ações/itens separados por vírgula, "e", ponto, ou lista, extraia CADA UM como item separado
- Detecte datas mencionadas (amanhã, sexta, dia 23, etc.) e converta para YYYY-MM-DD relativo a hoje (${today})
- Detecte horários (às 15h, 10:30, meio-dia) e converta para HH:MM
- Sugira coleção apenas se houver correspondência clara com as existentes
- Sugira microtarefas para tarefas complexas com múltiplos passos internos
- Limpe o texto: corrija ortografia leve, organize, mas preserve a voz do usuário
- NÃO invente informações que não estejam no texto

## Perguntas de clarificação
Faça perguntas CURTAS e DIRETAS quando:
- Evento sem data → "Qual dia?"
- Evento sem horário → "Tem horário?"
- Prazo ambíguo → "Qual sexta?" ou "Até quando?"
- Tarefa complexa → "Quer dividir em passos?"
- Objetivo grande → "Quer criar um plano?"

Máximo 2-3 perguntas. Só pergunte se realmente faltar contexto crítico.

Texto: "${text}"`,
  })

  return object
}

/**
 * Legacy single-item classify (backward compat).
 * Returns first item from multi-item result.
 */
export async function classifySingleInput(
  text: string,
  existingCollections: string[] = [],
): Promise<Classification> {
  const result = await classifyInput(text, existingCollections)
  return result.items[0] ?? {
    bullet_type: 'note' as const,
    clean_text: text.trim(),
    suggested_date: null,
    suggested_time: null,
    priority: null,
    suggested_collection: null,
    should_break_into_microtasks: false,
  }
}
