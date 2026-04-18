import { Suspense } from 'react'
import { getWorkspace, getProfile } from '@/lib/services/workspace'
import { getPreferences } from '@/lib/services/preferences'
import { getOrCreateDailyJournal, getOrCreateEntry } from '@/lib/services/journal'
import { getItemsForEntry, getPendingTasksBefore, getMigrationCountsForItems } from '@/lib/services/items'
import { getCollections } from '@/lib/services/collections'
import { getMoodForDate, getWeekMoods } from '@/lib/services/mood'
import { BulletItem } from '@/components/ui/BulletItem'
import { MoodWidget } from '@/components/ui/MoodWidget'
import { Hint } from '@/components/ui/Hint'
import { DailySummaryCard } from './_components/DailySummaryCard'
import { formatDateBR, todayISO, getGreeting, isPast } from '@/lib/utils'
import { ArrowRight, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function Home() {
  // Workspace + profile em paralelo (ambos cacheados)
  const [workspace, profile, preferences] = await Promise.all([
    getWorkspace(),
    getProfile(),
    getPreferences().catch(() => null),
  ])
  const hintsDismissed = preferences?.hints_dismissed ?? []
  const today = todayISO()

  // Journal + entry de hoje (sequenciais, mas só em Home)
  const journal = await getOrCreateDailyJournal(workspace.id, today)
  const entry = await getOrCreateEntry(workspace.id, journal.id, today)

  // Items de hoje, pendências de dias anteriores, collections, mood — em paralelo
  const [collections, todayItems, pending, todayMood, weekMoods] = await Promise.all([
    getCollections(workspace.id),
    getItemsForEntry(entry.id),
    getPendingTasksBefore(workspace.id, today, 15).catch(() => [] as Awaited<ReturnType<typeof getPendingTasksBefore>>),
    getMoodForDate(workspace.id, today).catch(() => null),
    getWeekMoods(workspace.id).catch(() => []),
  ])

  // Contagem de migrações para detectar adiamento recorrente
  const pendingIds = pending.map(p => p.id)
  const migrationCounts = pendingIds.length
    ? await getMigrationCountsForItems(workspace.id, pendingIds).catch(() => ({} as Record<string, number>))
    : {}

  const pendingTasks = todayItems.filter(i => i.bullet_type === 'task' && i.status === 'open')
  const completedTasks = todayItems.filter(i => i.bullet_type === 'task' && i.status === 'completed')
  const events = todayItems.filter(i => i.bullet_type === 'event' && i.status === 'open')
  const totalTasks = pendingTasks.length + completedTasks.length

  // "Em Foco" inteligente: prioridade explícita > atrasado/vence hoje > com microtarefas > ordem natural
  // Critério de foco: apenas tarefas/eventos abertos de hoje. Limite 5.
  const focusCandidates = todayItems.filter(i =>
    i.status === 'open' && (i.bullet_type === 'task' || i.bullet_type === 'event')
  )
  const focusScore = (i: typeof focusCandidates[number]) => {
    let s = 0
    if (i.priority === 1) s += 100
    else if (i.priority === 2) s += 60
    const dueKey = i.due_at?.slice(0, 10)
    if (dueKey === today) s += 30
    if (dueKey && isPast(dueKey)) s += 25
    if ((i.microtasks?.length ?? 0) > 0) s += 8
    if (i.bullet_type === 'event') s += 5
    return s
  }
  const focusItems = [...focusCandidates]
    .sort((a, b) => focusScore(b) - focusScore(a))
    .slice(0, 5)

  const displayName = profile.full_name?.split(' ')[0] || profile.email?.split('@')[0] || 'voce'

  return (
    <main className="flex-1 flex flex-col p-5 pb-32">
      {/* Header */}
      <header className="pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-charcoal-400 font-sans font-medium text-xs tracking-widest uppercase mb-1.5">
              {formatDateBR(today)}
            </p>
            <h1 className="title-display text-[34px] text-charcoal-900 leading-[1.02]">
              {getGreeting()},<br />
              <span className="title-italic text-amber-500">{displayName}.</span>
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

      {/* Hint inicial (home) */}
      {!hintsDismissed.includes('home') && (
        <div className="mb-4">
          <Hint hintKey="home" dismissed={hintsDismissed} tone="coral">
            Toque no <b>+</b> para capturar algo rapidamente. A IA é opcional — você decide quando usar.
          </Hint>
        </div>
      )}

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

      {/* Pendências de dias anteriores */}
      {pending.length > 0 && (
        <section className="bg-coral-50 rounded-2xl p-4 mb-5 border border-coral-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-coral-500 flex items-center justify-center">
              <ArrowRight size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-sm text-charcoal-900">Pendências</h3>
              <p className="text-xs text-charcoal-500">{pending.length} tarefa{pending.length !== 1 ? 's' : ''} de dias anteriores</p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 bg-surface/60 rounded-xl overflow-hidden">
            {pending.slice(0, 3).map((item) => (
              <BulletItem
                key={item.id}
                item={item}
                collections={collections}
                pendingFromDate={item.entry_date}
                migrationCount={migrationCounts[item.id] ?? 0}
              />
            ))}
          </div>
          {pending.length > 3 && (
            <Link href="/journal" className="flex items-center gap-1 text-xs text-coral-600 font-semibold mt-3 hover:text-coral-700 transition-colors">
              Ver todas ({pending.length}) <ChevronRight size={12} />
            </Link>
          )}
        </section>
      )}

      {/* AI Summary — Suspense permite streaming sem bloquear página */}
      <Suspense fallback={null}>
        <DailySummaryCard />
      </Suspense>

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
