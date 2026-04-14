import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './provider'

const microtasksSchema = z.object({
  microtasks: z.array(z.object({
    title: z.string().describe('Título curto e claro da microtarefa'),
    description: z.string().nullable().describe('Descrição opcional com mais contexto'),
  })).describe('Lista ordenada de microtarefas'),
})

export type GeneratedMicrotasks = z.infer<typeof microtasksSchema>

export async function generateMicrotasks(
  taskText: string,
  context?: { existingMicrotasks?: string[] }
): Promise<GeneratedMicrotasks> {
  const { object } = await generateObject({
    model: getModel(),
    schema: microtasksSchema,
    prompt: `Você é um assistente de produtividade. Quebre a tarefa abaixo em passos menores, simples e concretos.

Regras:
- Gere entre 3 e 8 microtarefas
- Ordene logicamente (o que fazer primeiro → último)
- Cada passo deve ser simples o suficiente para fazer sem pensar muito
- Use linguagem direta, sem jargão corporativo
- Não repita passos que já existem
- Comece pelo passo mais fácil/rápido (baixa fricção)

${context?.existingMicrotasks?.length ? `Microtarefas já existentes (não repetir): ${context.existingMicrotasks.join(', ')}` : ''}

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
