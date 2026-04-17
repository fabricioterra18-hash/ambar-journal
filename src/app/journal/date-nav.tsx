'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { todayISO, addDays } from '@/lib/utils'

interface Props {
  currentDate: string
}

export function DateNav({ currentDate }: Props) {
  const today = todayISO()

  const prevStr = addDays(currentDate, -1)
  const nextStr = addDays(currentDate, 1)
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
