import { getWorkspace, getProfile } from '@/lib/services/workspace'
import { getOrCreateDailyJournal, getOrCreateEntry, getEntriesForDate } from '@/lib/services/journal'
import { getItemsForEntry } from '@/lib/services/items'
import { getCollections } from '@/lib/services/collections'
import { getMoodForDate, getWeekMoods } from '@/lib/services/mood'
import { getDailySummary } from '@/lib/actions/insight-actions'
import { BulletItem } from '@/components/ui/BulletItem'
import { MoodWidget } from '@/components/ui/MoodWidget'
import { formatDateBR, todayISO, getGreeting } from '@/lib/utils'
import { Sparkles, ArrowRight, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function Home() {
  const workspace = await getWorkspace()
  const profile = await getProfile()
  const collections = await getCollections(workspace.id)
  const today = todayISO()

  // Today's items
  const journal = await getOrCreateDailyJournal(workspace.id, today)
  const entry = await getOrCreateEntry(workspace.id, journal.id, today)
  const todayItems = await getItemsForEntry(entry.id)

  // Yesterday's pending items
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const yesterdayEntries = await getEntriesForDate(workspace.id, yesterdayStr)
  let pendingFromYesterday: typeof todayItems = []
  for (const e of yesterdayEntries) {
    const items = await getItemsForEntry(e.id)
    pendingFromYesterday.push(...items.filter(i => i.status === 'open' && i.bullet_type === 'task'))
  }

  // Stats
  const pendingTasks = todayItems.filter(i => i.bullet_type === 'task' && i.status === 'open')
  const completedTasks = todayItems.filter(i => i.bullet_type === 'task' && i.status === 'completed')
  const events = todayItems.filter(i => i.bullet_type === 'event' && i.status === 'open')
  const focusItems = todayItems.filter(i => i.status === 'open').slice(0, 5)
  const totalTasks = pendingTasks.length + completedTasks.length

  const displayName = profile.full_name?.split(' ')[0] || profile.email?.split('@')[0] || 'voce'

  // Mood
  let todayMood = null
  let weekMoods: Awaited<ReturnType<typeof getWeekMoods>> = []
  try {
    todayMood = await getMoodForDate(workspace.id, today)
    weekMoods = await getWeekMoods(workspace.id)
  } catch {}

  // AI summary
  let dailySummary: Awaited<ReturnType<typeof getDailySummary>> = null
  try { dailySummary = await getDailySummary() } catch {}

  return (
    <main className="flex-1 flex flex-col p-5 pb-32">
      {/* Header */}
      <header className="pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-charcoal-400 font-sans font-medium text-xs tracking-widest uppercase mb-1.5">
              {formatDateBR(today)}
            </p>
            <h1 className="text-3xl font-heading text-charcoal-900 leading-tight">
              {getGreeting()},<br />
              <span className="text-gradient">{displayName}.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tracker"
              className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500 hover:bg-coral-100 transition-colors"
            >
              <Zap size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* Stats row */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-surface rounded-2xl p-4 card-shadow border border-sand-200/40">
          <p className="text-2xl font-heading text-charcoal-900">{pendingTasks.length}</p>
          <p className="text-xs text-charcoal-400 font-medium mt-0.5">Pendentes</p>
        </div>
        <div className="flex-1 bg-surface rounded-2xl p-4 card-shadow border border-sand-200/40">
          <p className="text-2xl font-heading text-sage-500">{completedTasks.length}</p>
          <p className="text-xs text-charcoal-400 font-medium mt-0.5">Concluidas</p>
        </div>
        <div className="flex-1 bg-surface rounded-2xl p-4 card-shadow border border-sand-200/40">
          <p className="text-2xl font-heading text-sky-500">{events.length}</p>
          <p className="text-xs text-charcoal-400 font-medium mt-0.5">Eventos</p>
        </div>
      </div>

      {/* Mood Widget */}
      <section className="mb-5">
        <MoodWidget todayMood={todayMood} weekMoods={weekMoods} />
      </section>

      {/* Pending from yesterday */}
      {pendingFromYesterday.length > 0 && (
        <section className="bg-coral-50 rounded-2xl p-4 mb-5 border border-coral-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-coral-500 flex items-center justify-center">
              <ArrowRight size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-sm text-charcoal-900">De ontem</h3>
              <p className="text-xs text-charcoal-500">{pendingFromYesterday.length} tarefa{pendingFromYesterday.length !== 1 ? 's' : ''} pendente{pendingFromYesterday.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 bg-surface/60 rounded-xl overflow-hidden">
            {pendingFromYesterday.slice(0, 3).map((item) => (
              <BulletItem key={item.id} item={item} collections={collections} />
            ))}
          </div>
          {pendingFromYesterday.length > 3 && (
            <Link href="/journal" className="flex items-center gap-1 text-xs text-coral-600 font-semibold mt-3 hover:text-coral-700 transition-colors">
              Ver todas ({pendingFromYesterday.length}) <ChevronRight size={12} />
            </Link>
          )}
        </section>
      )}

      {/* AI Summary */}
      {dailySummary && (
        <section className="bg-lavender-50 rounded-2xl p-4 mb-5 border border-lavender-100 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-5">
            <Sparkles size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-lavender-500 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="font-sans font-semibold text-xs text-lavender-500 tracking-wider uppercase">Insight do dia</span>
            </div>
            <p className="text-charcoal-800 text-sm leading-relaxed font-sans">{dailySummary.summary}</p>
            {dailySummary.suggestion && (
              <p className="text-lavender-500 text-xs font-sans mt-2 font-medium italic">{dailySummary.suggestion}</p>
            )}
          </div>
        </section>
      )}

      {/* Focus items */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-heading text-xl text-charcoal-900">Em Foco</h2>
          <Link href="/journal" className="text-xs text-coral-500 font-semibold flex items-center gap-1 hover:text-coral-600 transition-colors">
            Ver tudo <ChevronRight size={12} />
          </Link>
        </div>

        {focusItems.length > 0 ? (
          <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 overflow-hidden">
            {focusItems.map((item, i) => (
              <div key={item.id} className={i < focusItems.length - 1 ? 'border-b border-sand-100' : ''}>
                <BulletItem item={item} collections={collections} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl p-8 card-shadow border border-sand-200/40 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center mb-3">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-charcoal-600 font-sans text-sm font-medium">Nenhuma tarefa em foco</p>
            <p className="text-charcoal-400 font-sans text-xs mt-1">Toque no + para registrar algo</p>
          </div>
        )}
      </section>

      {/* Quick stats footer */}
      {totalTasks > 0 && (
        <section className="mt-5">
          <div className="bg-charcoal-900 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral-500/20 flex items-center justify-center">
                <Zap size={18} className="text-coral-400" />
              </div>
              <div>
                <p className="text-white font-sans font-semibold text-sm">
                  {totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0}% concluido
                </p>
                <p className="text-charcoal-400 text-xs font-sans">
                  {completedTasks.length} de {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link
              href="/tracker"
              className="px-4 py-2 bg-coral-500 text-white text-xs font-semibold rounded-xl hover:bg-coral-600 transition-colors"
            >
              Detalhes
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
