'use client'

import { useEffect, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { todayISO } from '@/lib/utils'
import { fetchActiveDatesForMonth } from '@/lib/actions/agenda-actions'
import { DayAgendaSheet } from './DayAgendaSheet'
import type { MoodEntry, Collection } from '@/types/database'

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

interface Props {
  moodHistory: MoodEntry[]
  /** Datas ativas pré-carregadas para o mês atual (otimização para o primeiro render). */
  activeDates?: string[]
  collections?: Collection[]
}

function getMoodColor(score: number): string {
  if (score >= 4) return 'bg-sage-400'
  if (score >= 3) return 'bg-honey-400'
  if (score >= 2) return 'bg-coral-400'
  return 'bg-rose-400'
}

export function CalendarWidget({ moodHistory, activeDates = [], collections = [] }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activeSet, setActiveSet] = useState<Set<string>>(() => new Set(activeDates))
  const [, startTransition] = useTransition()

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // First day of month (adjusted for Monday start)
  const firstDay = new Date(year, month, 1)
  const startIdx = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const todayStr = todayISO()

  const moodMap = new Map<string, MoodEntry>()
  moodHistory.forEach(m => moodMap.set(m.entry_date, m))

  // Carrega dinamicamente as datas ativas do mês exibido.
  // Mantém o Set combinando o que já tinha (evita piscar entre navegações).
  useEffect(() => {
    let cancelled = false
    startTransition(() => {
      fetchActiveDatesForMonth(year, month + 1)
        .then(dates => {
          if (cancelled) return
          setActiveSet(prev => {
            const next = new Set(prev)
            // Limpa apenas datas desse mês para refletir remoções
            const mm = String(month + 1).padStart(2, '0')
            const prefix = `${year}-${mm}-`
            for (const d of next) if (d.startsWith(prefix)) next.delete(d)
            for (const d of dates) next.add(d)
            return next
          })
        })
        .catch(() => {})
    })
    return () => { cancelled = true }
  }, [year, month])

  function prevMonth() { setCurrentMonth(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentMonth(new Date(year, month + 1, 1)) }
  function goToToday() { setCurrentMonth(new Date()); setSelectedDate(todayStr) }

  // Build calendar grid
  const cells: (number | null)[] = []
  for (let i = 0; i < startIdx; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Handler que também recarrega o mês quando o sheet fecha (para refletir
  // criação/remoção de itens nos pontos do calendário).
  function handleCloseSheet() {
    setSelectedDate(null)
    startTransition(() => {
      fetchActiveDatesForMonth(year, month + 1)
        .then(dates => {
          setActiveSet(prev => {
            const next = new Set(prev)
            const mm = String(month + 1).padStart(2, '0')
            const prefix = `${year}-${mm}-`
            for (const d of next) if (d.startsWith(prefix)) next.delete(d)
            for (const d of dates) next.add(d)
            return next
          })
        })
        .catch(() => {})
    })
  }

  return (
    <>
      <div className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-sand-50 text-charcoal-500 transition-colors" aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </button>
          <button onClick={goToToday} className="font-heading text-lg text-charcoal-900 hover:text-coral-500 transition-colors">
            {MONTHS_PT[month]} {year}
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-sand-50 text-charcoal-500 transition-colors" aria-label="Próximo mês">
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
            const isTodayCell = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const mood = moodMap.get(dateStr)
            const hasEntry = activeSet.has(dateStr)

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={clsx(
                  'aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all relative cursor-pointer',
                  isTodayCell && 'bg-coral-500 text-white shadow-md ring-2 ring-coral-300',
                  !isTodayCell && isSelected && 'bg-coral-100 text-coral-700 ring-2 ring-coral-400',
                  !isTodayCell && !isSelected && hasEntry && 'bg-sand-100 text-charcoal-800 hover:bg-sand-200',
                  !isTodayCell && !isSelected && !hasEntry && 'text-charcoal-500 hover:bg-sand-50',
                )}
                aria-label={`Abrir agenda de ${dateStr}`}
                aria-pressed={isSelected}
              >
                {day}
                {/* Indicador de conteúdo */}
                {hasEntry && !isTodayCell && !mood && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-coral-400" />
                )}
                {/* Mood dot */}
                {mood && !isTodayCell && (
                  <div className={clsx('absolute bottom-1 w-1.5 h-1.5 rounded-full', getMoodColor(mood.mood_score))} />
                )}
                {mood && isTodayCell && (
                  <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white/70" />
                )}
              </button>
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

      {/* Sheet — agenda do dia */}
      <DayAgendaSheet
        date={selectedDate}
        collections={collections}
        onClose={handleCloseSheet}
      />
    </>
  )
}
