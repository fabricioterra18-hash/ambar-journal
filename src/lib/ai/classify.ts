import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './provider'

const classificationSchema = z.object({
  bullet_type: z.enum(['task', 'event', 'note', 'insight']).describe('Tipo do bullet'),
  priority: z.number().min(0).max(3).nullable().describe('0=sem prioridade, 1=baixa, 2=média, 3=alta'),
  suggested_date: z.string().nullable().describe('Data sugerida no formato YYYY-MM-DD, se aplicável'),
  suggested_collection: z.string().nullable().describe('Nome de coleção sugerida, se aplicável'),
  should_break_into_microtasks: z.boolean().describe('Se a tarefa é complexa o suficiente para quebrar em microtarefas'),
  clean_text: z.string().describe('Texto limpo e organizado do bullet'),
})

export type Classification = z.infer<typeof classificationSchema>

export async function classifyInput(text: string, existingCollections: string[] = []): Promise<Classification> {
  const { object } = await generateObject({
    model: getModel(),
    schema: classificationSchema,
    prompt: `Você é um assistente de Bullet Journal. Analise o texto abaixo e classifique.

Coleções existentes do usuário: ${existingCollections.length > 0 ? existingCollections.join(', ') : 'nenhuma ainda'}

Regras:
- "task": algo que precisa ser feito (ação, to-do)
- "event": algo com data/hora definida (reunião, compromisso)
- "note": observação, pensamento, registro
- "insight": reflexão, aprendizado, padrão percebido
- Detecte datas mencionadas e converta para YYYY-MM-DD
- Sugira coleção apenas se fizer sentido claro
- Sugira microtarefas apenas para tarefas complexas com múltiplos passos
- Limpe o texto: corrija ortografia leve, organize, mas preserve a voz do usuário

Texto: "${text}"`,
  })

  return object
}
