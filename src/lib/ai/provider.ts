import { createGoogleGenerativeAI } from '@ai-sdk/google'

export function getAIProvider() {
  const apiKey = process.env.GEMINI_API_KEY
    || process.env.GOOGLE_API_KEY
    || process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable')
  }

  return createGoogleGenerativeAI({ apiKey })
}

export function getModel() {
  const provider = getAIProvider()
  return provider(process.env.GEMINI_MODEL || 'gemini-2.5-flash')
}
