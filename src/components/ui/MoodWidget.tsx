'use client'

import { useState, useTransition } from 'react'
import clsx from 'clsx'
import { logMoodQuick } from '@/lib/actions/mood-actions'
import type { MoodEntry, MoodScore } from '@/types/database'

const moods: { score: MoodScore; emoji: string; label: string; color: string; bg: string }[] = [
  { score: 1, emoji: '😞', label: 'Ruim', color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200' },
  { score: 2, emoji: '😕', label: 'Meh', color: 'text-coral-500', bg: 'bg-coral-50 border-coral-200' },
  { score: 3, emoji: '😐', label: 'Ok', color: 'text-honey-500', bg: 'bg-honey-50 border-honey-200' },
  { score: 4, emoji: '😊', label: 'Bem', color: 'text-sage-500', bg: 'bg-sage-50 border-sage-200' },
  { score: 5, emoji: '😄', label: 'Otimo', color: 'text-sage-600', bg: 'bg-sage-50 border-sage-300' },
]

interface Props {
  todayMood: MoodEntry | null
  weekMoods: MoodEntry[]
}

export function MoodWidget({ todayMood, weekMoods }: Props) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<MoodScore | null>(todayMood?.mood_score ?? null)

  function handleSelect(score: MoodScore) {
    setSelected(score)
    startTransition(() => logMoodQuick(score))
  }

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1

  return (
    <div className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-charcoal-900">Como voce esta?</h3>
        {selected && (
          <span className="text-2xl animate-scale-in">{moods.find(m => m.score === selected)?.emoji}</span>
        )}
      </div>

      {/* Mood selector */}
      <div className={clsx('flex items-center justify-between gap-2 mb-5', isPending && 'opacity-50')}>
        {moods.map((mood) => (
          <button
            key={mood.score}
            onClick={() => handleSelect(mood.score)}
            disabled={isPending}
            className={clsx(
              'flex flex-col items-center gap-1 py-2 px-3 rounded-xl border transition-all',
              selected === mood.score
                ? `${mood.bg} scale-110 shadow-sm`
                : 'bg-sand-50 border-transparent hover:bg-sand-100 active:scale-95'
            )}
          >
            <span className="text-xl">{mood.emoji}</span>
            <span className={clsx('text-[10px] font-medium', selected === mood.score ? mood.color : 'text-charcoal-400')}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>

      {/* Week mini-chart */}
      <div className="flex items-end gap-1 px-1">
        {weekDays.map((day, i) => {
          const moodForDay = weekMoods.find(m => {
            const d = new Date(m.entry_date + 'T12:00:00')
            const dIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
            return dIdx === i
          })
          const isToday = i === dayOfWeek
          const height = moodForDay ? `${(moodForDay.mood_score / 5) * 100}%` : '0%'
          const moodColor = moodForDay
            ? moodForDay.mood_score >= 4 ? 'bg-sage-400' : moodForDay.mood_score >= 3 ? 'bg-honey-400' : 'bg-coral-400'
            : 'bg-sand-200'

          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-10 flex items-end justify-center">
                <div
                  className={clsx(
                    'w-full rounded-t-md transition-all duration-500',
                    moodForDay ? moodColor : 'bg-sand-200',
                    isToday && 'ring-2 ring-coral-300 ring-offset-1'
                  )}
                  style={{ height: moodForDay ? height : '4px', minHeight: '4px' }}
                />
              </div>
              <span className={clsx(
                'text-[9px] font-medium',
                isToday ? 'text-coral-500' : 'text-charcoal-400'
              )}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
