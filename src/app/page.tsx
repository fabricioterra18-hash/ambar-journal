import { getWorkspace, getProfile } from '@/lib/services/workspace'
import { getOrCreateDailyJournal, getOrCreateEntry, getEntriesForDate } from '@/lib/services/journal'
import { getItemsForEntry, getItemsForWorkspace } from '@/lib/services/items'
import { getCollections } from '@/lib/services/collections'
import { getDailySummary } from '@/lib/actions/insight-actions'
import { BulletItem } from '@/components/ui/BulletItem'
import { formatDateBR, todayISO, getGreeting } from '@/lib/utils'
import { Sparkles, ArrowRight, Settings } from 'lucide-react'
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
  const events = todayItems.filter(i => i.bullet_type === 'event' && i.status === 'open')
  const focusItems = todayItems.filter(i => i.status === 'open').slice(0, 5)

  const displayName = profile.full_name?.split(' ')[0] || profile.email?.split('@')[0] || 'você'

  // Try AI daily summary (non-blocking)
  let dailySummary: Awaited<ReturnType<typeof getDailySummary>> = null
  try { dailySummary = await getDailySummary() } catch {}

  return (
    <main className="flex-1 flex flex-col p-6 pb-32">
      <header className="pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-ink-600 font-sans font-medium text-sm tracking-wide uppercase mb-1">
              {formatDateBR(today)}
            </p>
            <h1 className="text-4xl font-heading text-ink-900 tracking-tight leading-tight">
              {getGreeting()},<br />
              {displayName}.
            </h1>
          </div>
          <Link href="/settings" className="p-2 text-ink-600/60 hover:text-ink-900 rounded-xl hover:bg-fog-100 transition-colors mt-1">
            <Settings size={22} />
          </Link>
        </div>
      </header>

      {/* Summary card */}
      <section className="bg-sunlight-50 rounded-2xl p-5 mb-6 shadow-sm border border-sunlight-200/20">
        <p className="text-ink-600 text-sm leading-relaxed font-sans">
          {events.length > 0 || pendingTasks.length > 0 ? (
            <>
              Você tem <strong className="text-ink-900 font-medium">{events.length} evento{events.length !== 1 ? 's' : ''}</strong> hoje e <strong className="text-ink-900 font-medium">{pendingTasks.length} tarefa{pendingTasks.length !== 1 ? 's' : ''}</strong> pendente{pendingTasks.length !== 1 ? 's' : ''}.
            </>
          ) : (
            <>Dia tranquilo. Nenhuma tarefa ou evento registrado ainda.</>
          )}
        </p>
      </section>

      {/* Pending from yesterday - migration prompt */}
      {pendingFromYesterday.length > 0 && (
        <section className="bg-clay-600/5 rounded-2xl p-5 mb-6 border border-clay-600/20">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight size={16} className="text-clay-600" />
            <h3 className="font-heading text-base text-clay-600">Pendente de ontem</h3>
          </div>
          <p className="text-ink-600 text-xs font-sans mb-3">
            {pendingFromYesterday.length} tarefa{pendingFromYesterday.length !== 1 ? 's' : ''} aberta{pendingFromYesterday.length !== 1 ? 's' : ''} de ontem. Migre para hoje ou arquive.
          </p>
          <div className="flex flex-col gap-1">
            {pendingFromYesterday.slice(0, 5).map((item) => (
              <BulletItem key={item.id} item={item} collections={collections} />
            ))}
          </div>
          {pendingFromYesterday.length > 5 && (
            <Link href="/journal" className="text-xs text-amber-700 font-medium mt-2 inline-block">
              Ver todas ({pendingFromYesterday.length})
            </Link>
          )}
        </section>
      )}

      {/* AI Daily Summary */}
      {dailySummary && (
        <section className="bg-sunlight-50 rounded-2xl p-5 mb-6 shadow-sm border border-sunlight-200/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={48} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <Sparkles size={14} />
              <span className="font-sans font-semibold text-xs tracking-wider uppercase">Resumo do dia</span>
            </div>
            <p className="text-ink-900 text-sm leading-relaxed font-sans">{dailySummary.summary}</p>
            {dailySummary.suggestion && (
              <p className="text-amber-700 text-xs font-sans mt-2 italic">{dailySummary.suggestion}</p>
            )}
          </div>
        </section>
      )}

      {/* Focus items */}
      {focusItems.length > 0 ? (
        <section className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl text-ink-900 px-4 mb-2">Em Foco</h2>
          <div className="bg-sunlight-50 rounded-2xl border-2 border-ink-900 shadow-[4px_4px_0_0_#1F1B16] overflow-hidden py-2">
            {focusItems.map((item) => (
              <BulletItem key={item.id} item={item} collections={collections} />
            ))}
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-ink-600 font-sans text-sm mb-1">Nada em foco ainda.</p>
          <p className="text-ink-600/60 font-sans text-xs">Use o botão + para registrar algo.</p>
        </section>
      )}
    </main>
  )
}
