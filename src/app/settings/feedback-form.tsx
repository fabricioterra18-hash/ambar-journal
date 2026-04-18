'use client'

import { useState, useTransition } from 'react'
import { MessageCircle, Check, AlertCircle } from 'lucide-react'
import { submitFeedback } from '@/lib/actions/feedback-actions'

export function FeedbackForm() {
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<null | { type: 'ok' | 'err'; text: string }>(null)

  const tooShort = message.trim().length > 0 && message.trim().length < 10
  const disabled = isPending || message.trim().length < 10

  function handleSubmit() {
    setStatus(null)
    startTransition(async () => {
      const result = await submitFeedback(message)
      if (result.ok) {
        setStatus({ type: 'ok', text: 'Recebido! Obrigado por ajudar a melhorar o Âmbar.' })
        setMessage('')
      } else {
        setStatus({ type: 'err', text: result.error })
      }
    })
  }

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageCircle size={14} className="text-coral-500" />
        <h3 className="font-sans font-semibold text-sm text-charcoal-700">Feedback</h3>
      </div>
      <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 p-4">
        <p className="text-xs text-charcoal-500 mb-3 leading-relaxed">
          Sua opinião guia o que vem a seguir. Seja direto — pode elogiar, reclamar ou sugerir.
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="O que você acha do app? O que falta? O que melhorou na sua rotina?"
          rows={4}
          disabled={isPending}
          className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm font-sans text-charcoal-900 placeholder:text-charcoal-400 outline-none focus:border-coral-300 transition-colors resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[11px] font-sans ${tooShort ? 'text-rose-500' : 'text-charcoal-400'}`}>
            {tooShort ? 'Mínimo 10 caracteres' : `${message.trim().length} caracteres`}
          </span>
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="bg-coral-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-coral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Enviando...' : 'Enviar feedback'}
          </button>
        </div>
        {status && (
          <div
            className={`mt-3 flex items-start gap-2 text-xs font-sans rounded-xl p-2.5 ${
              status.type === 'ok'
                ? 'bg-sage-50 text-sage-700 border border-sage-100'
                : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}
          >
            {status.type === 'ok' ? <Check size={12} className="mt-0.5" /> : <AlertCircle size={12} className="mt-0.5" />}
            <span>{status.text}</span>
          </div>
        )}
      </div>
    </section>
  )
}
