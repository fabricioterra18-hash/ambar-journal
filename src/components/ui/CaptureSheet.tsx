'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Send, X, Check } from 'lucide-react'
import clsx from 'clsx'
import { captureBulletWithFeedback } from '@/lib/actions/bullet-actions'

interface CaptureSheetProps {
  isOpen: boolean
  onClose: () => void
}

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

export function CaptureSheet({ isOpen, onClose }: CaptureSheetProps) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: string; text: string; hasMicrotasks: boolean } | null>(null)

  if (!isOpen) return null

  function handleSubmit() {
    if (!content.trim()) return
    const formData = new FormData()
    formData.set('text', content)

    startTransition(async () => {
      try {
        const result = await captureBulletWithFeedback(formData)
        if (result) {
          setFeedback({
            type: result.bullet_type,
            text: result.clean_text,
            hasMicrotasks: result.should_break_into_microtasks,
          })
          setContent('')
          setTimeout(() => { setFeedback(null); onClose() }, 2500)
        } else {
          setContent('')
          onClose()
        }
      } catch {
        setContent('')
        onClose()
      }
    })
  }

  function handleClose() {
    setFeedback(null)
    setContent('')
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-charcoal-900/30 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleClose}
      />

      <div className={clsx(
        "fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface z-50 rounded-t-3xl shadow-sheet transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex flex-col p-6">
          {/* Handle */}
          <div className="w-10 h-1 bg-sand-300 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-xl text-charcoal-900">Novo Registro</h3>
            <button onClick={handleClose} className="p-2 text-charcoal-400 hover:text-charcoal-600 transition-colors rounded-xl hover:bg-sand-50">
              <X size={20} />
            </button>
          </div>

          {/* AI Feedback toast */}
          {feedback && (
            <div className="bg-sage-50 border border-sage-100 rounded-2xl p-4 mb-4 flex items-start gap-3 animate-scale-in">
              <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center flex-shrink-0">
                <Check size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-sans text-charcoal-900 font-medium">
                  {typeEmojis[feedback.type] ?? ''} Registrado como <span className="text-coral-500">{typeLabels[feedback.type] ?? feedback.type}</span>
                </p>
                <p className="text-xs font-sans text-charcoal-500 mt-0.5">{feedback.text}</p>
                {feedback.hasMicrotasks && (
                  <p className="text-xs font-sans text-lavender-500 mt-1.5 flex items-center gap-1 font-medium">
                    <Sparkles size={10} /> Microtarefas geradas pela IA
                  </p>
                )}
              </div>
            </div>
          )}

          {!feedback && (
            <>
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="O que esta na sua mente?"
                className="w-full bg-sand-50 text-charcoal-900 text-base placeholder:text-charcoal-400 resize-none outline-none min-h-[120px] font-sans rounded-2xl p-4 border border-sand-200 focus:border-coral-300 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
              />

              <div className="flex items-center justify-between pt-4 mt-2">
                <div className="flex items-center gap-2 text-coral-500">
                  <div className="w-8 h-8 rounded-xl bg-coral-50 flex items-center justify-center">
                    <Sparkles size={14} />
                  </div>
                  <span className="text-xs font-semibold tracking-wide">Auto-classificacao IA</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isPending}
                  className="w-12 h-12 gradient-coral text-white flex items-center justify-center rounded-2xl disabled:opacity-40 active:scale-95 transition-transform shadow-lg"
                >
                  {isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
