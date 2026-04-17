import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'

type LanguageModelV1 = ReturnType<ReturnType<typeof createGoogleGenerativeAI>>

/**
 * Returns the active AI model based on available env vars.
 * Priority: OPENAI_BASE_URL (Qwen/custom) → OPENAI_API_KEY → GEMINI_API_KEY (default)
 */
export function getModel(): LanguageModelV1 {
  // OpenAI-compatible endpoint (Qwen, Ollama, etc.)
  if (process.env.OPENAI_BASE_URL && process.env.OPENAI_API_KEY) {
    const provider = createOpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    })
    return provider(process.env.AI_MODEL || 'qwen-plus') as unknown as LanguageModelV1
  }

  // Native OpenAI
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_BASE_URL) {
    const provider = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
    return provider(process.env.AI_MODEL || 'gpt-4o-mini') as unknown as LanguageModelV1
  }

  // Google Gemini (default)
  const apiKey = process.env.GEMINI_API_KEY
    || process.env.GOOGLE_API_KEY
    || process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    throw new Error(
      'No AI provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or OPENAI_BASE_URL + OPENAI_API_KEY.',
    )
  }

  const provider = createGoogleGenerativeAI({ apiKey })
  return provider(process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-2.5-flash')
}
