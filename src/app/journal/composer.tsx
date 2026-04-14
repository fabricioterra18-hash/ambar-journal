'use client'

import { useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { captureBullet } from '@/lib/actions/bullet-actions'

export function JournalComposer() {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!text.trim()) return
    const formData = new FormData()
    formData.set('text', text)

    startTransition(async () => {
      await captureBullet(formData)
      setText('')
    })
  }

  return (
    <div className="bg-surface-lowest rounded-2xl p-4 shadow-sm border border-sunlight-200/20 mb-8">
      <div className="flex items-end gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O que está acontecendo agora?"
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
