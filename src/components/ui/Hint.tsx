'use client'

import { useState, useTransition } from 'react'
import { X, Sparkles } from 'lucide-react'
import { dismissHint, type HintKey } from '@/lib/actions/hint-actions'

interface HintProps {
  hintKey: HintKey
  dismissed: string[]
  children: React.ReactNode
  tone?: 'coral' | 'lavender' | 'sky' | 'honey'
}

const tones = {
  coral: 'bg-coral-50 border-coral-100 text-coral-700',
  lavender: 'bg-lavender-50 border-lavender-100 text-lavender-700',
  sky: 'bg-sky-50 border-sky-100 text-sky-700',
  honey: 'bg-honey-50 border-honey-100 text-honey-700',
}

/** Dica contextual leve. Mostra uma vez; ao dispensar some para sempre. */
export function Hint({ hintKey, dismissed, children, tone = 'coral' }: HintProps) {
  const initiallyDismissed = dismissed.includes(hintKey)
  const [hidden, setHidden] = useState(initiallyDismissed)
  const [isPending, startTransition] = useTransition()

  if (hidden) return null

  function handleClose() {
    setHidden(true)
    startTransition(() => dismissHint(hintKey))
  }

  return (
    <div className={`relative rounded-xl border p-2.5 pr-8 flex items-start gap-2 text-[11px] leading-snug font-sans ${tones[tone]}`}>
      <Sparkles size={12} className="flex-shrink-0 mt-0.5 opacity-70" />
      <div className="flex-1 min-w-0">{children}</div>
      <button
        onClick={handleClose}
        disabled={isPending}
        aria-label="Dispensar dica"
        className="absolute top-1.5 right-1.5 p-1 rounded-md hover:bg-black/5 transition-colors"
      >
        <X size={11} />
      </button>
    </div>
  )
}
