import { getWorkspace } from '@/lib/services/workspace'
import { getPreferences } from '@/lib/services/preferences'
import { getOrCreateDailyJournal, getOrCreateEntry } from '@/lib/services/journal'
import { getItemsForEntry, getItemsForDate, getActiveDatesForMonth, getPendingTasksBefore, getMigrationCountsForItems } from '@/lib/services/items'
import { getCollections } from '@/lib/services/collections'
import { getMoodHistory } from '@/lib/services/mood'
import { BulletItem } from '@/components/ui/BulletItem'
import { CalendarWidget } from '@/components/ui/CalendarWidget'
import { Hint } from '@/components/ui/Hint'
import { JournalComposer } from './composer'
import { DateNav } from './date-nav'
import { formatDateBR, parseLocalDateKey, todayISO, isPast } from '@/lib/utils'

export default async function JournalPage(props: { searchParams: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams
  const today = todayISO()
  const currentDate = searchParams.date || today
  const isToday = currentDate === today

  const workspace = await getWorkspace()
  const viewed = parseLocalDateKey(currentDate)
  const viewedYear = viewed.getFullYear()
  const viewedMonth = viewed.getMonth() + 1

  const [collections, moodHistory, activeDates, items, pending, preferences] = await Promise.all([
    getCollections(workspace.id),
    getMoodHistory(workspace.id, 60).catch(() => []),
    // Apenas o mês visualizado — o calendário pagina o resto sob demanda
    getActiveDatesForMonth(workspace.id, viewedYear, viewedMonth).catch(() => []),
    isToday
      ? (async () => {
          const journal = await getOrCreateDailyJournal(workspace.id, today)
          const entry = await getOrCreateEntry(workspace.id, journal.id, today)
          return getItemsForEntry(entry.id)
        })()
      // Leitura pura: NÃO cria journal/entry quando apenas visualizando outro dia
      : getItemsForDate(workspace.id, currentDate),
    isToday ? getPendingTasksBefore(workspace.id, today, 10).catch(() => []) : Promise.resolve([]),
    getPreferences().catch(() => null),
  ])
  const hintsDismissed = preferences?.hints_dismissed ?? []

  // Em Foco inteligente: prioridade + atrasado/vence hoje + microtarefas
  const focusScore = (i: typeof items[number]) => {
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
  const emFocoCandidates = items.filter(i =>
    i.status === 'open' && (i.priority === 1 || i.priority === 2 || (i.bullet_type === 'task' && focusScore(i) >= 25))
  )
  const emFoco = [...emFocoCandidates].sort((a, b) => focusScore(b) - focusScore(a)).slice(0, 5)
  const emFocoIds = new Set(emFoco.map(i => i.id))
  // Tarefas regulares (excluindo as "Em Foco")
  const tasks = items.filter(i => i.bullet_type === 'task' && !emFocoIds.has(i.id))
  const events = items.filter(i => i.bullet_type === 'event' && !emFocoIds.has(i.id))
  const notes = items.filter(i => i.bullet_type === 'note' || i.bullet_type === 'insight')
  // Pendências: tarefas abertas de dias anteriores que não já aparecem em "today"
  const todayItemIds = new Set(items.map(i => i.id))
  const pendingItems = pending.filter(i => !todayItemIds.has(i.id))
  const pendingMigrationCounts = isToday && pendingItems.length
    ? await getMigrationCountsForItems(workspace.id, pendingItems.map(p => p.id)).catch(() => ({} as Record<string, number>))
    : ({} as Record<string, number>)

  return (
    <main className="flex-1 flex flex-col p-5 pb-32">
      <header className="pt-6 pb-4">
        <p className="text-charcoal-400 font-sans font-medium text-xs tracking-widest uppercase mb-1">
          Bullet Journal
        </p>
        <h1 className="text-2xl font-heading text-charcoal-900 mb-4">
          {isToday ? 'Hoje' : formatDateBR(currentDate)}
        </h1>
        <DateNav currentDate={currentDate} />
      </header>

      {/* Calendar */}
      <section className="mb-5">
        <CalendarWidget moodHistory={moodHistory} activeDates={activeDates} collections={collections} />
      </section>

      {/* Composer — available for all dates */}
      <section className="mb-5">
        {!hintsDismissed.includes('composer') && (
          <div className="mb-2">
            <Hint hintKey="composer" dismissed={hintsDismissed} tone="lavender">
              Escreva livremente. Organize manualmente escolhendo o tipo, ou use a IA para transformar em tarefas e quebrar em passos.
            </Hint>
          </div>
        )}
        <JournalComposer date={isToday ? null : currentDate} />
      </section>

      {/* Em Foco */}
      {emFoco.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-sm">🎯</span>
            <h3 className="font-sans font-semibold text-sm text-charcoal-700">Em Foco</h3>
          </div>
          <div className="bg-coral-50 rounded-2xl border border-coral-100 overflow-hidden">
            {emFoco.map((item, i) => (
              <div key={item.id} className={i < emFoco.length - 1 ? 'border-b border-coral-100' : ''}>
                <BulletItem item={item} collections={collections} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pendências (apenas hoje) */}
      {pendingItems.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="font-sans font-semibold text-sm text-charcoal-700">
              Pendências ({pendingItems.length})
            </h3>
          </div>
          <div className="bg-surface rounded-2xl card-shadow border border-amber-100 overflow-hidden">
            {pendingItems.map((item, i) => (
              <div key={item.id} className={i < pendingItems.length - 1 ? 'border-b border-sand-100' : ''}>
                <BulletItem
                  item={item}
                  collections={collections}
                  pendingFromDate={item.entry_date}
                  migrationCount={pendingMigrationCounts[item.id] ?? 0}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 rounded-full bg-coral-500" />
            <h3 className="font-sans font-semibold text-sm text-charcoal-700">{tasks.length} Tarefa{tasks.length !== 1 ? 's' : ''}</h3>
          </div>
          <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 overflow-hidden">
            {tasks.map((item, i) => (
              <div key={item.id} className={i < tasks.length - 1 ? 'border-b border-sand-100' : ''}>
                <BulletItem item={item} collections={collections} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Events */}
      {events.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 rounded-full bg-sky-500" />
            <h3 className="font-sans font-semibold text-sm text-charcoal-700">{events.length} Evento{events.length !== 1 ? 's' : ''}</h3>
          </div>
          <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 overflow-hidden">
            {events.map((item, i) => (
              <div key={item.id} className={i < events.length - 1 ? 'border-b border-sand-100' : ''}>
                <BulletItem item={item} collections={collections} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 rounded-full bg-lavender-500" />
            <h3 className="font-sans font-semibold text-sm text-charcoal-700">{notes.length} Nota{notes.length !== 1 ? 's' : ''}</h3>
          </div>
          <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 overflow-hidden">
            {notes.map((item, i) => (
              <div key={item.id} className={i < notes.length - 1 ? 'border-b border-sand-100' : ''}>
                <BulletItem item={item} collections={collections} />
              </div>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="bg-surface rounded-2xl p-8 card-shadow border border-sand-200/40 flex flex-col items-center text-center">
          <span className="text-3xl mb-3">📓</span>
          <p className="text-charcoal-600 font-sans text-sm font-medium">Nenhum registro neste dia</p>
          <p className="text-charcoal-400 font-sans text-xs mt-1">Use o compositor acima para adicionar</p>
        </div>
      )}
    </main>
  )
}
