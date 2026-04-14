'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import clsx from 'clsx'

interface DateNavProps {
  currentDate: string
  today: string
}

function shiftDate(date: string, days: number) {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatShort(date: string) {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
}

export function DateNav({ currentDate, today }: DateNavProps) {
  const prevDate = shiftDate(currentDate, -1)
  const nextDate = shiftDate(currentDate, 1)
  const isToday = currentDate === today
  const isFuture = currentDate > today

  return (
    <div className="flex items-center justify-between mb-6 bg-surface-lowest rounded-2xl p-2 border border-sunlight-200/20">
      <Link
        href={`/journal?date=${prevDate}`}
        className="flex items-center gap-1 text-ink-600 hover:text-ink-900 px-3 py-2 rounded-xl hover:bg-fog-100 transition-colors"
      >
        <ChevronLeft size={18} />
        <span className="text-xs font-sans font-medium">{formatShort(prevDate)}</span>
      </Link>

      {!isToday && (
        <Link
          href="/journal"
          className="flex items-center gap-1.5 text-amber-700 px-3 py-2 rounded-xl bg-amber-700/10 text-xs font-sans font-bold"
        >
          <Calendar size={14} />
          Hoje
        </Link>
      )}

      {isToday && (
        <span className="text-xs font-sans font-bold text-amber-700 px-3 py-2">Hoje</span>
      )}

      {!isFuture && (
        <Link
          href={`/journal?date=${nextDate}`}
          className="flex items-center gap-1 text-ink-600 hover:text-ink-900 px-3 py-2 rounded-xl hover:bg-fog-100 transition-colors"
        >
          <span className="text-xs font-sans font-medium">{formatShort(nextDate)}</span>
          <ChevronRight size={18} />
        </Link>
      )}

      {isFuture && <div className="w-20" />}
    </div>
  )
}
