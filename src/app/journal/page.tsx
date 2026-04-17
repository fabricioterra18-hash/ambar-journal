import { getWorkspace } from '@/lib/services/workspace'
import { getOrCreateDailyJournal, getOrCreateEntry } from '@/lib/services/journal'
import { getItemsForEntry, getItemsForDate, getActiveDatesInRange, getPendingTasksBefore } from '@/lib/services/items'
import { getCollections } from '@/lib/services/collections'
import { getMoodHistory } from '@/lib/services/mood'
import { BulletItem } from '@/components/ui/BulletItem'
import { CalendarWidget } from '@/components/ui/CalendarWidget'
import { JournalComposer } from './composer'
import { DateNav } from './date-nav'
import { addDays, formatDateBR, todayISO } from '@/lib/utils'

export default async function JournalPage(props: { searchParams: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams
  const today = todayISO()
  const currentDate = searchParams.date || today
  const isToday = currentDate === today

  const workspace = await getWorkspace()

  const [collections, moodHistory, activeDates, items, pending] = await Promise.all([
    getCollections(workspace.id),
    getMoodHistory(workspace.id, 60).catch(() => []),
    getActiveDatesInRange(workspace.id, addDays(today, -60), addDays(today, 30)),
    isToday
      ? (async () => {
          const journal = await getOrCreateDailyJournal(workspace.id, today)
          const entry = await getOrCreateEntry(workspace.id, journal.id, today)
          return getItemsForEntry(entry.id)
        })()
      : getItemsForDate(workspace.id, currentDate),
    isToday ? getPendingTasksBefore(workspace.id, today, 10).catch(() => []) : Promise.resolve([]),
  ])

  // Em Foco: tarefas com priority=1 e ainda abertas
  const emFoco = items.filter(i => i.priority === 1 && i.status === 'open')
  // Tarefas regulares (excluindo as "Em Foco")
  const tasks = items.filter(i => i.bullet_type === 'task' && !(i.priority === 1 && i.status === 'open'))
  const events = items.filter(i => i.bullet_type === 'event')
  const notes = items.filter(i => i.bullet_type === 'note' || i.bullet_type === 'insight')
  // Pendências: tarefas abertas de dias anteriores que não já aparecem em "today"
  const todayItemIds = new Set(items.map(i => i.id))
  const pendingItems = pending.filter(i => !todayItemIds.has(i.id))

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
        <CalendarWidget moodHistory={moodHistory} activeDates={activeDates} />
      </section>

      {/* Composer — available for all dates */}
      <section className="mb-5">
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
                <BulletItem item={item} collections={collections} />
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
