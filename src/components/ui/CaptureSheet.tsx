'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Send, X } from 'lucide-react'
import clsx from 'clsx'
import { captureBullet } from '@/lib/actions/bullet-actions'

interface CaptureSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function CaptureSheet({ isOpen, onClose }: CaptureSheetProps) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  function handleSubmit() {
    if (!content.trim()) return
    const formData = new FormData()
    formData.set('text', content)

    startTransition(async () => {
      await captureBullet(formData)
      setContent('')
      onClose()
    })
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-ink-900/20 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      <div className={clsx(
        "fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-sunlight-50 z-50 rounded-t-3xl border-t-4 border-x-2 border-ink-900 shadow-[0_-8px_0_0_#1F1B16] transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex flex-col p-6">
          <div className="w-12 h-[3px] bg-ink-900/10 rounded-full mx-auto mb-6" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl text-ink-900">Novo Registro</h3>
            <button onClick={onClose} className="p-2 text-ink-600 hover:text-ink-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que está na sua mente?"
            className="w-full bg-transparent text-ink-900 text-lg placeholder:text-ink-600/50 resize-none outline-none min-h-[120px] font-sans"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit()
              }
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
        </div>
      </div>
    </>
  )
}
