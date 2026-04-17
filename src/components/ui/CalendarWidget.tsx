'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import { todayISO } from '@/lib/utils'
import type { MoodEntry } from '@/types/database'

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

interface Props {
  moodHistory: MoodEntry[]
  activeDates?: string[] // dates that have journal entries
}

function getMoodColor(score: number): string {
  if (score >= 4) return 'bg-sage-400'
  if (score >= 3) return 'bg-honey-400'
  if (score >= 2) return 'bg-coral-400'
  return 'bg-rose-400'
}

export function CalendarWidget({ moodHistory, activeDates = [] }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // First day of month (adjusted for Monday start)
  const firstDay = new Date(year, month, 1)
  const startIdx = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const todayStr = todayISO()

  // Build mood map for this month
  const moodMap = new Map<string, MoodEntry>()
  moodHistory.forEach(m => moodMap.set(m.entry_date, m))

  const activeSet = new Set(activeDates)

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  function goToToday() {
    setCurrentMonth(new Date())
  }

  // Build calendar grid
  const cells: (number | null)[] = []
  for (let i = 0; i < startIdx; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Fill remaining row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-sand-50 text-charcoal-500 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <button onClick={goToToday} className="font-heading text-lg text-charcoal-900 hover:text-coral-500 transition-colors">
          {MONTHS_PT[month]} {year}
        </button>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-sand-50 text-charcoal-500 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-charcoal-400 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} className="aspect-square" />

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const mood = moodMap.get(dateStr)
          const hasEntry = activeSet.has(dateStr)

          return (
            <Link
              key={idx}
              href={`/journal?date=${dateStr}`}
              className={clsx(
                'aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all relative',
                isToday
                  ? 'bg-coral-500 text-white shadow-md'
                  : hasEntry
                    ? 'bg-sand-100 text-charcoal-800 hover:bg-sand-200'
                    : 'text-charcoal-500 hover:bg-sand-50',
              )}
            >
              {day}
              {/* Mood dot */}
              {mood && !isToday && (
                <div className={clsx('absolute bottom-1 w-1.5 h-1.5 rounded-full', getMoodColor(mood.mood_score))} />
              )}
              {mood && isToday && (
                <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-sand-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-sage-400" />
          <span className="text-[10px] text-charcoal-400">Bom</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-honey-400" />
          <span className="text-[10px] text-charcoal-400">Ok</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-coral-400" />
          <span className="text-[10px] text-charcoal-400">Meh</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-[10px] text-charcoal-400">Ruim</span>
        </div>
      </div>
    </div>
  )
}
