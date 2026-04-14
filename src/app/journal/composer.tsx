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
    <div className="bg-surface-lowest rounded-2xl p-4 shadow-sm border border-sunlight-200/20 mb-8">
      {/* AI Feedback toast */}
      {feedback && (
        <div className="bg-olive-600/10 border border-olive-600/30 rounded-xl p-3 mb-3 flex items-start gap-3">
          <Check size={14} className="text-olive-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-sans text-ink-900 font-medium">
              Classificado como <span className="text-amber-700">{typeLabels[feedback.type] ?? feedback.type}</span>
            </p>
            {feedback.hasMicrotasks && (
              <p className="text-[10px] font-sans text-amber-700 mt-0.5 flex items-center gap-1">
                <Sparkles size={9} /> Microtarefas geradas automaticamente
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O que esta acontecendo agora?"
          className="flex-1 bg-transparent text-ink-900 text-base placeholder:text-ink-600/50 resize-none outline-none font-sans"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit()
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isPending}
          className="w-10 h-10 bg-ink-900 text-sunlight-50 flex items-center justify-center rounded-full disabled:opacity-30 hover:bg-ink-600 transition-all flex-shrink-0"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-sunlight-50/30 border-t-sunlight-50 rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  )
}
