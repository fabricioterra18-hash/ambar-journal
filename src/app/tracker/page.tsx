import { Suspense } from 'react'
import { getWorkspace } from '@/lib/services/workspace'
import { getItemsForWorkspace } from '@/lib/services/items'
import { getMoodHistory } from '@/lib/services/mood'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Sparkles, Target, Heart } from 'lucide-react'
import { toLocalDateKey } from '@/lib/utils'
import Link from 'next/link'
import { WeeklyInsight } from './_components/WeeklyInsight'

export default async function TrackerPage() {
  const workspace = await getWorkspace()

  const [allItems, moodHistory] = await Promise.all([
    getItemsForWorkspace(workspace.id, { limit: 200 }),
    getMoodHistory(workspace.id, 30).catch(() => []),
  ])

  const totalTasks = allItems.filter(i => i.bullet_type === 'task')
  const completedTasks = totalTasks.filter(i => i.status === 'completed')
  const openTasks = totalTasks.filter(i => i.status === 'open')

  const completionRate = totalTasks.length > 0
    ? Math.round((completedTasks.length / totalTasks.length) * 100)
    : 0

  const avgMood = moodHistory.length > 0
    ? (moodHistory.reduce((sum, m) => sum + m.mood_score, 0) / moodHistory.length)
    : 0

  // Week stats (last 7 days)
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
  const dayOfWeek = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  // Calculate daily tasks for bar chart (mock from items created_at)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return toLocalDateKey(d)
  })

  const dailyCounts = last7.map(date => {
    const dayItems = allItems.filter(i => i.created_at?.startsWith(date))
    return {
      date,
      total: dayItems.length,
      completed: dayItems.filter(i => i.status === 'completed').length,
    }
  })

  const maxCount = Math.max(...dailyCounts.map(d => d.total), 1)

  // Category stats
  const categories = [
    {
      label: 'Produtividade',
      emoji: '🎯',
      value: completionRate,
      color: 'text-coral-500',
      bg: 'bg-coral-50',
    },
    {
      label: 'Bem-estar',
      emoji: '💚',
      value: Math.round(avgMood * 20),
      color: 'text-sage-500',
      bg: 'bg-sage-50',
    },
    {
      label: 'Consistencia',
      emoji: '🔥',
      value: Math.min(moodHistory.length * 3, 100),
      color: 'text-honey-500',
      bg: 'bg-honey-50',
    },
  ]

  return (
    <main className="flex-1 flex flex-col p-5 pb-32">
      <header className="pt-6 pb-5">
        <p className="text-charcoal-400 font-sans font-medium text-xs tracking-widest uppercase mb-1">
          Acompanhamento
        </p>
        <h1 className="text-2xl font-heading text-charcoal-900">
          Meu Tracker
        </h1>
      </header>

      {/* Main progress ring */}
      <section className="bg-surface rounded-2xl p-6 card-shadow border border-sand-200/40 mb-5 flex flex-col items-center">
        <p className="text-charcoal-400 font-sans text-xs font-medium uppercase tracking-wider mb-4">Progresso Geral</p>
        <ProgressRing
          percentage={completionRate}
          size={140}
          strokeWidth={12}
          sublabel="concluido"
        />
        <div className="flex items-center gap-6 mt-5">
          <div className="text-center">
            <p className="text-xl font-heading text-charcoal-900">{totalTasks.length}</p>
            <p className="text-[10px] text-charcoal-400 font-medium">Total</p>
          </div>
          <div className="w-px h-8 bg-sand-200" />
          <div className="text-center">
            <p className="text-xl font-heading text-sage-500">{completedTasks.length}</p>
            <p className="text-[10px] text-charcoal-400 font-medium">Feitas</p>
          </div>
          <div className="w-px h-8 bg-sand-200" />
          <div className="text-center">
            <p className="text-xl font-heading text-coral-500">{openTasks.length}</p>
            <p className="text-[10px] text-charcoal-400 font-medium">Abertas</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="grid grid-cols-3 gap-3 mb-5">
        {categories.map((cat) => (
          <div key={cat.label} className={`${cat.bg} rounded-2xl p-4 flex flex-col items-center text-center border border-sand-200/20`}>
            <span className="text-2xl mb-1">{cat.emoji}</span>
            <p className={`text-lg font-heading ${cat.color}`}>{cat.value}%</p>
            <p className="text-[10px] text-charcoal-500 font-medium mt-0.5">{cat.label}</p>
          </div>
        ))}
      </section>

      {/* Week bar chart */}
      <section className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans font-semibold text-sm text-charcoal-700">Ultima Semana</h3>
          <span className="text-xs text-charcoal-400 font-medium">
            {dailyCounts.reduce((s, d) => s + d.total, 0)} registros
          </span>
        </div>
        <div className="flex items-end gap-2 h-24">
          {dailyCounts.map((day, i) => {
            const isCurrentDay = i === dailyCounts.length - 1
            const height = (day.total / maxCount) * 100
            const completedHeight = day.total > 0 ? (day.completed / day.total) * height : 0
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-20 flex items-end justify-center relative">
                  {/* Total bar */}
                  <div
                    className="w-full rounded-t-md bg-sand-200 absolute bottom-0 transition-all duration-500"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  {/* Completed overlay */}
                  <div
                    className={`w-full rounded-t-md absolute bottom-0 transition-all duration-500 ${isCurrentDay ? 'gradient-coral' : 'bg-coral-400'}`}
                    style={{ height: `${Math.max(completedHeight, 0)}%` }}
                  />
                  {day.total > 0 && (
                    <span className="absolute -top-4 text-[9px] font-medium text-charcoal-400">{day.total}</span>
                  )}
                </div>
                <span className={`text-[9px] font-medium ${isCurrentDay ? 'text-coral-500' : 'text-charcoal-400'}`}>
                  {weekDays[(new Date(day.date + 'T12:00:00').getDay() + 6) % 7]}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Mood Evolution */}
      {moodHistory.length > 0 && (
        <section className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={16} className="text-rose-400" />
            <h3 className="font-sans font-semibold text-sm text-charcoal-700">Evolucao do Humor</h3>
          </div>
          <div className="flex items-end gap-1 h-16">
            {moodHistory.slice(-14).map((m, i) => {
              const moodColors = ['bg-rose-400', 'bg-coral-400', 'bg-honey-400', 'bg-sage-400', 'bg-sage-500']
              const height = (m.mood_score / 5) * 100
              return (
                <div key={m.id} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full h-14 flex items-end justify-center">
                    <div
                      className={`w-full rounded-t-sm ${moodColors[m.mood_score - 1]} transition-all`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[9px] text-charcoal-400">14 dias atras</span>
            <span className="text-[9px] text-charcoal-400">Hoje</span>
          </div>
        </section>
      )}

      {/* AI Weekly Insight em Suspense — não bloqueia render da página */}
      <Suspense fallback={null}>
        <WeeklyInsight />
      </Suspense>

      {/* Navigate links */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/collections" className="bg-sky-50 rounded-2xl p-4 border border-sky-100 active:scale-98 transition-transform">
          <Target size={20} className="text-sky-500 mb-2" />
          <p className="font-sans font-semibold text-sm text-charcoal-800">Colecoes</p>
          <p className="text-[10px] text-charcoal-400 mt-0.5">Organizar por tema</p>
        </Link>
        <Link href="/insights" className="bg-lavender-50 rounded-2xl p-4 border border-lavender-100 active:scale-98 transition-transform">
          <Sparkles size={20} className="text-lavender-500 mb-2" />
          <p className="font-sans font-semibold text-sm text-charcoal-800">Insights</p>
          <p className="text-[10px] text-charcoal-400 mt-0.5">Resumos da IA</p>
        </Link>
      </section>
    </main>
  )
}
