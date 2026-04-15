'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentDate: string
}

export function DateNav({ currentDate }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const current = new Date(currentDate + 'T12:00:00')
  const prev = new Date(current)
  prev.setDate(prev.getDate() - 1)
  const next = new Date(current)
  next.setDate(next.getDate() + 1)

  const prevStr = prev.toISOString().split('T')[0]
  const nextStr = next.toISOString().split('T')[0]
  const isToday = currentDate === today

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/journal?date=${prevStr}`}
        className="w-9 h-9 rounded-xl bg-sand-100 flex items-center justify-center text-charcoal-500 hover:bg-sand-200 active:scale-95 transition-all"
      >
        <ChevronLeft size={16} />
      </Link>

      {!isToday ? (
        <Link
          href="/journal"
          className="px-3 py-1.5 bg-coral-50 text-coral-500 text-xs font-semibold rounded-lg hover:bg-coral-100 transition-colors"
        >
          Hoje
        </Link>
      ) : (
        <span className="px-3 py-1.5 bg-coral-500 text-white text-xs font-semibold rounded-lg">
          Hoje
        </span>
      )}

      <Link
        href={`/journal?date=${nextStr}`}
        className="w-9 h-9 rounded-xl bg-sand-100 flex items-center justify-center text-charcoal-500 hover:bg-sand-200 active:scale-95 transition-all"
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}
