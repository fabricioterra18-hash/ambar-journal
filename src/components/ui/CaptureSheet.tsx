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
          // Auto-dismiss feedback after 3s
          setTimeout(() => { setFeedback(null); onClose() }, 3000)
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
        className="fixed inset-0 bg-ink-900/20 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      <div className={clsx(
        "fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-sunlight-50 z-50 rounded-t-3xl border-t-4 border-x-2 border-ink-900 shadow-[0_-8px_0_0_#1F1B16] transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex flex-col p-6">
          <div className="w-12 h-[3px] bg-ink-900/10 rounded-full mx-auto mb-6" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl text-ink-900">Novo Registro</h3>
            <button onClick={handleClose} className="p-2 text-ink-600 hover:text-ink-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* AI Feedback toast */}
          {feedback && (
            <div className="bg-olive-600/10 border border-olive-600/30 rounded-xl p-3 mb-4 flex items-start gap-3 animate-in fade-in">
              <Check size={16} className="text-olive-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-sans text-ink-900 font-medium">
                  Registrado como <span className="text-amber-700">{typeLabels[feedback.type] ?? feedback.type}</span>
                </p>
                <p className="text-xs font-sans text-ink-600 mt-0.5">{feedback.text}</p>
                {feedback.hasMicrotasks && (
                  <p className="text-xs font-sans text-amber-700 mt-1 flex items-center gap-1">
                    <Sparkles size={10} /> IA sugere quebrar em microtarefas
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
                placeholder="O que está na sua mente?"
                className="w-full bg-transparent text-ink-900 text-lg placeholder:text-ink-600/50 resize-none outline-none min-h-[120px] font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
              />

              <div className="flex items-center justify-between border-t border-fog-100 pt-4 mt-2">
                <div className="flex gap-3">
                  <div className="text-amber-700 p-2 rounded-full bg-sunlight-50/50 flex items-center gap-2">
                    <Sparkles size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wide">IA Auto-Tag</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isPending}
                  className="w-12 h-12 bg-ink-900 text-sunlight-50 flex items-center justify-center rounded-full disabled:opacity-50 hover:bg-ink-600 transition-all"
                >
                  {isPending ? (
                    <div className="w-5 h-5 border-2 border-sunlight-50/30 border-t-sunlight-50 rounded-full animate-spin" />
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
