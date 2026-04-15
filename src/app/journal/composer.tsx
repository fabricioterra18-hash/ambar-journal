'use client'

import { useState, useTransition } from 'react'
import { Send, Sparkles, Check } from 'lucide-react'
import { captureBulletWithFeedback } from '@/lib/actions/bullet-actions'

const typeLabels: Record<string, string> = {
  task: 'Tarefa',
  event: 'Evento',
  note: 'Nota',
  insight: 'Insight',
}

const typeEmojis: Record<string, string> = {
  task: '✅',
  event: '📅',
  note: '📝',
  insight: '💡',
}

export function JournalComposer() {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: string; text: string; hasMicrotasks: boolean } | null>(null)

  function handleSubmit() {
    if (!text.trim()) return
    const formData = new FormData()
    formData.set('text', text)

    startTransition(async () => {
      try {
        const result = await captureBulletWithFeedback(formData)
        setText('')
        if (result?.ai_used) {
          setFeedback({
            type: result.bullet_type,
            text: result.clean_text,
            hasMicrotasks: result.should_break_into_microtasks,
          })
          setTimeout(() => setFeedback(null), 3000)
        }
      } catch {
        setText('')
      }
    })
  }

  return (
    <div className="bg-surface rounded-2xl p-4 card-shadow border border-sand-200/40">
      {/* AI Feedback */}
      {feedback && (
        <div className="bg-sage-50 border border-sage-100 rounded-xl p-3 mb-3 flex items-start gap-2.5 animate-scale-in">
          <div className="w-6 h-6 rounded-lg bg-sage-500 flex items-center justify-center flex-shrink-0">
            <Check size={12} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-sans text-charcoal-900 font-medium">
              {typeEmojis[feedback.type] ?? ''} <span className="text-coral-500">{typeLabels[feedback.type] ?? feedback.type}</span>
            </p>
            {feedback.hasMicrotasks && (
              <p className="text-[10px] font-sans text-lavender-500 mt-0.5 flex items-center gap-1 font-medium">
                <Sparkles size={9} /> Microtarefas geradas
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Registre algo..."
            className="w-full bg-transparent text-charcoal-900 text-[15px] placeholder:text-charcoal-400 resize-none outline-none font-sans"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
          />
          <div className="flex items-center gap-1.5 text-coral-400">
            <Sparkles size={11} />
            <span className="text-[10px] font-medium">Auto-tag IA</span>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isPending}
          className="w-10 h-10 gradient-coral text-white flex items-center justify-center rounded-xl disabled:opacity-30 active:scale-95 transition-transform flex-shrink-0 shadow-md"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    </div>
  )
}
