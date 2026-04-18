'use server'

import { createClient } from '@/lib/supabase/server'

const FEEDBACK_TO = 'fabricioterra20@gmail.com'

export type FeedbackResult =
  | { ok: true; channel: 'email' | 'db' }
  | { ok: false; error: string }

/**
 * Recebe feedback do usuário. Sempre grava em `feedbacks` (registro oficial);
 * adicionalmente tenta enviar por email via Resend se RESEND_API_KEY estiver setado.
 * Nunca envia do client.
 */
export async function submitFeedback(message: string): Promise<FeedbackResult> {
  const trimmed = message?.trim() ?? ''
  if (trimmed.length < 10) {
    return { ok: false, error: 'Mensagem muito curta (mínimo 10 caracteres).' }
  }
  if (trimmed.length > 4000) {
    return { ok: false, error: 'Mensagem muito longa (máximo 4000 caracteres).' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada.' }

  const email = user.email ?? null

  // 1) Gravação no Supabase (fallback confiável)
  const { error: dbError } = await supabase.from('feedbacks').insert({
    user_id: user.id,
    email,
    message: trimmed,
  })
  if (dbError) {
    return { ok: false, error: 'Não foi possível salvar seu feedback agora. Tente novamente.' }
  }

  // 2) Envio opcional por email via Resend
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM ?? 'Âmbar Feedback <onboarding@resend.dev>'
  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: FEEDBACK_TO,
          reply_to: email ?? undefined,
          subject: `[Âmbar] Feedback de ${email ?? user.id}`,
          text: `De: ${email ?? '(sem email)'}\nUser ID: ${user.id}\nData: ${new Date().toISOString()}\n\n${trimmed}`,
        }),
      })
      if (res.ok) return { ok: true, channel: 'email' }
    } catch {
      // silencioso — já temos o fallback no DB
    }
  }

  return { ok: true, channel: 'db' }
}
