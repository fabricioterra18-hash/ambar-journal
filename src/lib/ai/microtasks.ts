import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './provider'

const microtasksSchema = z.object({
  microtasks: z.array(z.object({
    title: z.string().describe('Título curto e claro da microtarefa'),
    description: z.string().nullable().describe('Descrição opcional com mais contexto'),
  })).describe('Lista ordenada de microtarefas'),
})

const nextStepSchema = z.object({
  step: z.string().describe('A próxima ação física concreta a fazer agora (uma frase curta)'),
  why: z.string().describe('Em uma frase: por que este é o próximo passo lógico'),
})

export type GeneratedMicrotasks = z.infer<typeof microtasksSchema>

export async function generateMicrotasks(
  taskText: string,
  context?: { existingMicrotasks?: string[] }
): Promise<GeneratedMicrotasks> {
  const { object } = await generateObject({
    model: getModel(),
    schema: microtasksSchema,
    prompt: `Você é um assistente de produtividade. Quebre a tarefa abaixo em passos menores, concretos e acionáveis.

Regras:
- Gere entre 3 e 8 microtarefas
- Ordene logicamente (o que fazer primeiro → último)
- Cada passo deve começar com um VERBO de ação (Abrir, Escrever, Enviar, Verificar, etc.)
- Cada passo deve ser independente e completável em menos de 30 minutos
- Evite passos vagos como "pesquisar" ou "pensar sobre" — seja específico
- Use linguagem direta, sem jargão corporativo
- Comece pelo passo mais fácil/rápido (baixa fricção para começar)
${context?.existingMicrotasks?.length ? `\nMicrotarefas já existentes (não repetir): ${context.existingMicrotasks.join(', ')}` : ''}

Tarefa: "${taskText}"`,
  })

  return object
}

export async function expandMicrotask(
  parentTaskText: string,
  microtaskTitle: string
): Promise<GeneratedMicrotasks> {
  const { object } = await generateObject({
    model: getModel(),
    schema: microtasksSchema,
    prompt: `Você é um assistente de produtividade. Expanda a microtarefa abaixo em sub-passos ainda menores.

Tarefa principal: "${parentTaskText}"
Microtarefa para expandir: "${microtaskTitle}"

Regras:
- Gere entre 2 e 5 sub-passos
- Cada sub-passo deve ser atômico (uma ação simples)
- Mantenha linguagem direta e clara`,
  })

  return object
}

export async function simplifyMicrotasks(
  taskText: string,
  currentMicrotasks: string[]
): Promise<GeneratedMicrotasks> {
  const { object } = await generateObject({
    model: getModel(),
    schema: microtasksSchema,
    prompt: `Você é um assistente de produtividade. As microtarefas abaixo estão complexas demais. Simplifique.

Tarefa: "${taskText}"
Microtarefas atuais: ${currentMicrotasks.join(' | ')}

Regras:
- Reduza para no máximo 5 passos
- Agrupe o que puder ser feito junto
- Mantenha apenas o essencial
- Linguagem direta e clara`,
  })

  return object
}

export type NextStep = z.infer<typeof nextStepSchema>

export async function getNextStep(
  taskText: string,
  openMicrotasks: string[],
  completedMicrotasks: string[],
): Promise<NextStep> {
  const { object } = await generateObject({
    model: getModel(),
    schema: nextStepSchema,
    prompt: `Você é um coach de produtividade. Analise a tarefa e seu estado atual, e indique o PRÓXIMO passo concreto.

Tarefa: "${taskText}"
${completedMicrotasks.length ? `Já concluído: ${completedMicrotasks.join(', ')}` : 'Nada concluído ainda.'}
${openMicrotasks.length ? `Ainda a fazer: ${openMicrotasks.join(', ')}` : 'Todos os passos concluídos.'}

Retorne a próxima ação física concreta — uma frase curta começando com verbo.
Se tudo está concluído, sugira a revisão ou entrega final.`,
  })

  return object
}
