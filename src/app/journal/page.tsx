import { getWorkspace } from '@/lib/services/workspace'
import { getOrCreateDailyJournal, getOrCreateEntry } from '@/lib/services/journal'
import { getItemsForEntry } from '@/lib/services/items'
import { getCollections } from '@/lib/services/collections'
import { getMoodHistory } from '@/lib/services/mood'
import { BulletItem } from '@/components/ui/BulletItem'
import { CalendarWidget } from '@/components/ui/CalendarWidget'
import { JournalComposer } from './composer'
import { DateNav } from './date-nav'
import { formatDateBR, todayISO } from '@/lib/utils'

export default async function JournalPage(props: { searchParams: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams
  const dateParam = searchParams.date
  const today = todayISO()
  const currentDate = dateParam || today
  const isToday = currentDate === today

  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)

  const journal = await getOrCreateDailyJournal(workspace.id, currentDate)
  const entry = await getOrCreateEntry(workspace.id, journal.id, currentDate)
  const items = await getItemsForEntry(entry.id)

  // Mood history for calendar
  let moodHistory: Awaited<ReturnType<typeof getMoodHistory>> = []
  try { moodHistory = await getMoodHistory(workspace.id, 60) } catch {}

  const tasks = items.filter(i => i.bullet_type === 'task')
  const events = items.filter(i => i.bullet_type === 'event')
  const notes = items.filter(i => i.bullet_type === 'note' || i.bullet_type === 'insight')

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
        <CalendarWidget moodHistory={moodHistory} />
      </section>

      {/* Composer */}
      {isToday && (
        <section className="mb-5">
          <JournalComposer />
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
          {isToday && <p className="text-charcoal-400 font-sans text-xs mt-1">Use o compositor acima para comecar</p>}
        </div>
      )}
    </main>
  )
}
