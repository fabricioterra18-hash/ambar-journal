import { createOpenAI } from '@ai-sdk/openai'

export function getAIProvider() {
  return createOpenAI({
    apiKey: process.env.QWEN_API_KEY!,
    baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  })
}

export function getModel() {
  const provider = getAIProvider()
  return provider(process.env.QWEN_MODEL || 'qwen-turbo')
}
