import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './provider'
import { todayISO } from '@/lib/utils'

// ── Schema for multi-item classification ──

const classifiedItemSchema = z.object({
  bullet_type: z.enum(['task', 'event', 'note', 'insight']).describe('Tipo do bullet'),
  clean_text: z.string().describe('Texto limpo e organizado do item'),
  suggested_date: z.string().nullable().describe('Data sugerida YYYY-MM-DD. NULL se ambígua ou não mencionada.'),
  suggested_time: z.string().nullable().describe('Horário sugerido HH:MM, se mencionado'),
  priority: z.number().min(0).max(3).nullable().describe('0=nenhuma, 1=baixa, 2=média, 3=alta'),
  suggested_collection: z.string().nullable().describe('Nome de coleção sugerida, se aplicável'),
  should_break_into_microtasks: z.boolean().describe('Se é complexa o suficiente para quebrar em passos'),
  rationale: z.string().nullable().describe('Motivo curto (1 frase) para classificar assim. Opcional.'),
})

const classificationResultSchema = z.object({
  items: z.array(classifiedItemSchema).describe('Lista de itens extraídos do texto'),
  needs_clarification: z.boolean().describe('Se falta contexto importante que impeça uma boa organização'),
  clarifying_questions: z.array(z.string()).describe('Perguntas curtas (máx. 3). Vazio se needs_clarification=false.'),
})

export type ClassifiedItem = z.infer<typeof classifiedItemSchema>
export type ClassificationResult = z.infer<typeof classificationResultSchema>

// Keep legacy type for backward compat
export type Classification = ClassifiedItem

const DAY_BR = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function nextWeekdayHint(today: string): string {
  const d = new Date(today + 'T12:00:00')
  const dow = d.getDay()
  return `Hoje é ${DAY_BR[dow]} (${today}).`
}

export async function classifyInput(
  text: string,
  existingCollections: string[] = [],
  previousAnswers?: { question: string; answer: string }[],
): Promise<ClassificationResult> {
  const today = todayISO()
  const dayHint = nextWeekdayHint(today)

  const answersBlock = previousAnswers?.length
    ? `\n\nRespostas do usuário a perguntas anteriores (use para resolver ambiguidades):\n${previousAnswers
        .map(a => `- "${a.question}" → "${a.answer}"`)
        .join('\n')}`
    : ''

  const { object } = await generateObject({
    model: getModel(),
    schema: classificationResultSchema,
    prompt: `Você é um assistente de Bullet Journal. Analise o texto e extraia TODOS os itens distintos, organizando melhor do que o usuário digitou.

${dayHint}
Coleções existentes: ${existingCollections.length > 0 ? existingCollections.join(', ') : 'nenhuma'}

## Tipos
- "task": algo a fazer (ação, compra, to-do, objetivo com prazo)
- "event": compromisso com data/hora definida (reunião, casamento, consulta, aula)
- "note": observação, registro, "comecei X", "li Y"
- "insight": reflexão, padrão percebido, aprendizado

## Extração
- Texto com múltiplas ações separadas por vírgula, "e", ponto, ";" ou lista → extraia cada uma como item separado
- Sentenças do tipo "comecei X e quero terminar até Y" → gere DOIS itens: uma NOTA ("comecei X") e uma TASK ("terminar X até Y"), com should_break_into_microtasks=true se fizer sentido um plano
- Livro/leitura/curso/estudo com prazo → task + should_break_into_microtasks=true (plano de leitura/estudo)
- Item com horário (HH:MM, "às 15h", "meio-dia") → bullet_type="event" e preencha suggested_time
- Projeto/entrega grande → task, should_break_into_microtasks=true

## Datas
- Resolva "amanhã", "depois de amanhã", "dia 23", "23 de abril" para YYYY-MM-DD relativo a hoje (${today}).
- AMBIGUIDADE: se o usuário disser apenas um dia da semana ("sexta", "terça"), ou um dia numérico sem mês claro, NÃO invente. Deixe suggested_date=null e adicione a pergunta em clarifying_questions (ex: "Qual sexta?").
- Ignore ambiguidade SE já houver respostas do usuário resolvendo-a.

## Horários
- Evento sem horário explícito → suggested_time=null e pergunte "Tem horário?" se for realmente um compromisso.
- Tarefa sem horário → não pergunte horário.

## Perguntas de clarificação (curtas, máx. 3)
Pergunte quando:
- Data de dia-da-semana ambígua → "Qual sexta?"
- Evento sem horário → "Tem horário?"
- Tarefa grande sem plano → "Quer dividir em passos?"
- "Objetivo com prazo" → "Quer um plano de leitura/execução?"
- Ação indefinida ("tenho que resolver aquilo") → "O que exatamente precisa ser feito?"

NÃO pergunte se: a informação não afeta o salvamento, ou o texto já é claro.
Máximo 3 perguntas. needs_clarification=true APENAS se houver pelo menos uma pergunta.

## Coleção
Sugira apenas se houver correspondência forte com uma coleção existente. Case-insensitive.

## Limpeza
- Corrija ortografia leve, remova "hoje eu", "tô pensando", mas preserve a voz
- NÃO invente detalhes, datas ou horários

## Prioridade
- 3 (alta): urgência explícita ("urgente", "o quanto antes", prazo curto)
- 2 (média): prazo nos próximos dias, importante mencionado
- 1 (baixa): genérico
- null: sem indicação

## Exemplos

Entrada: "Comecei o livro Devoradores de Estrelas e quero terminar até 23 de abril"
Saída:
  items: [
    { bullet_type: "note", clean_text: "Comecei o livro Devoradores de Estrelas", suggested_date: null, ... should_break_into_microtasks: false },
    { bullet_type: "task", clean_text: "Terminar Devoradores de Estrelas", suggested_date: "2026-04-23", priority: 2, should_break_into_microtasks: true, rationale: "prazo + livro → plano de leitura ajuda" }
  ]
  needs_clarification: true
  clarifying_questions: ["Quantas páginas faltam ou quanto pretende ler por dia?"]

Entrada: "na sexta tenho casamento"
Saída:
  items: [{ bullet_type: "event", clean_text: "Casamento", suggested_date: null, suggested_time: null, ... }]
  needs_clarification: true
  clarifying_questions: ["Qual sexta?", "Tem horário?"]

Entrada: "buscar o pedrinho na escola, comprar ovos carne e queijo, tirar roupa do varal, ir ao salão às 15:45"
Saída:
  items: [
    { bullet_type: "task", clean_text: "Buscar o Pedrinho na escola", ... },
    { bullet_type: "task", clean_text: "Comprar ovos, carne e queijo", ... },
    { bullet_type: "task", clean_text: "Tirar roupa do varal", ... },
    { bullet_type: "event", clean_text: "Salão", suggested_time: "15:45", suggested_date: "${today}", ... }
  ]
  needs_clarification: false
  clarifying_questions: []
${answersBlock}

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
    rationale: null,
  }
}
