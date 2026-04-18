import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './provider'
import { todayISO } from '@/lib/utils'

/**
 * Análise pós-criação de um item existente (criado manualmente ou com IA).
 * Objetivo: oferecer melhorias sem trocar o item automaticamente.
 * Retorna sugestões estruturadas — o usuário decide o que aplicar.
 */

const suggestionSchema = z.object({
  summary: z.string().describe('Em 1 frase: o que a IA entendeu deste item'),
  reclassify: z.object({
    bullet_type: z.enum(['task', 'event', 'note', 'insight']),
    clean_text: z.string(),
    suggested_date: z.string().nullable(),
    suggested_time: z.string().nullable(),
    priority: z.number().min(0).max(3).nullable(),
    suggested_collection: z.string().nullable(),
  }).nullable().describe('Proposta de reclassificação/ajuste. NULL se o item já está bom como está.'),
  split_into: z.array(z.object({
    bullet_type: z.enum(['task', 'event', 'note', 'insight']),
    clean_text: z.string(),
    suggested_date: z.string().nullable(),
    suggested_time: z.string().nullable(),
    priority: z.number().min(0).max(3).nullable(),
  })).nullable().describe('Se o item contém múltiplas ações, sugira dividir. NULL se for um único item.'),
  should_generate_microtasks: z.boolean().describe('Se vale quebrar em passos (tarefa grande, projeto, plano)'),
  suggested_plan: z.string().nullable().describe('Quando for objetivo com prazo, sugestão curta de plano (1 frase). NULL caso contrário.'),
  next_step_hint: z.string().nullable().describe('Se aplicável, o primeiro passo concreto a dar (frase curta, começa com verbo). NULL se não fizer sentido.'),
  needs_clarification: z.boolean(),
  clarifying_questions: z.array(z.string()),
})

export type AnalyzeSuggestion = z.infer<typeof suggestionSchema>

export async function analyzeItem(params: {
  text: string
  bullet_type: string
  due_at?: string | null
  start_at?: string | null
  priority?: number | null
  existingCollections?: string[]
}): Promise<AnalyzeSuggestion> {
  const today = todayISO()
  const collections = params.existingCollections ?? []

  const { object } = await generateObject({
    model: getModel(),
    schema: suggestionSchema,
    prompt: `Você é um assistente de Bullet Journal analisando um item JÁ EXISTENTE que o usuário criou (manualmente ou com IA).
Seu trabalho é propor melhorias claras e úteis. NÃO reescreva sem necessidade.

Hoje: ${today}
Coleções existentes: ${collections.length ? collections.join(', ') : 'nenhuma'}

## Item existente
- tipo atual: ${params.bullet_type}
- texto: "${params.text}"
- due_at: ${params.due_at ?? 'null'}
- start_at: ${params.start_at ?? 'null'}
- priority: ${params.priority ?? 'null'}

## Regras
1. Se o item já é claro, atômico e bem classificado → reclassify=null, split_into=null, should_generate_microtasks=false.
2. Se o item mistura várias ações → split_into = lista separada; caso contrário split_into=null.
3. Reclassify somente se mudar tipo/data/coleção/priority/texto melhorar de verdade. Se apenas confirma o que já está → null.
4. should_generate_microtasks=true quando:
   - é uma tarefa grande / projeto / plano
   - é um objetivo com prazo (ex: "terminar livro até 23/4")
   - exige 3+ passos não óbvios
5. suggested_plan: UMA frase curta quando houver objetivo com prazo. Caso contrário null.
6. next_step_hint: primeira ação física concreta se fizer sentido (uma frase, começa com verbo). Caso contrário null.
7. Perguntas só se realmente faltar contexto que impeça organizar (data ambígua, horário ausente em evento importante). Máximo 3.
8. Datas ambíguas ("sexta" sem mês, "dia 23" sem mês) → deixe null e pergunte.
9. Linguagem direta, sem jargão, sem coach. Português do Brasil.

Devolva apenas sugestões que agreguem valor. Quando em dúvida, prefira deixar null/false.`,
  })

  return object
}
