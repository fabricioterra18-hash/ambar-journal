import { getWorkspace } from '@/lib/services/workspace'
import { getOrCreateDailyJournal, getOrCreateEntry } from '@/lib/services/journal'
import { getItemsForEntry } from '@/lib/services/items'
import { getCollections } from '@/lib/services/collections'
import { BulletItem } from '@/components/ui/BulletItem'
import { formatDateBR, todayISO } from '@/lib/utils'
import { JournalComposer } from './composer'
import { DateNav } from './date-nav'

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: dateParam } = await searchParams
  const today = todayISO()
  const currentDate = dateParam || today
  const isToday = currentDate === today

  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)
  const journal = await getOrCreateDailyJournal(workspace.id, currentDate)
  const entry = await getOrCreateEntry(workspace.id, journal.id, currentDate)
  const items = await getItemsForEntry(entry.id)

  return (
    <main className="flex-1 flex flex-col p-6 pb-32">
      <header className="pt-8 pb-6 flex items-center justify-between border-b border-fog-100/50 mb-6">
        <div>
          <p className="text-ink-600 font-sans font-medium text-xs tracking-wide uppercase mb-1">
            {isToday ? 'Hoje — Daily Log' : 'Daily Log'}
          </p>
          <h1 className="text-3xl font-heading text-ink-900 tracking-tight">
            {formatDateBR(currentDate)}
          </h1>
        </div>
      </header>

      <DateNav currentDate={currentDate} today={today} />

      {isToday && <JournalComposer />}

      <section className="flex flex-col gap-1">
        <h3 className="font-heading text-xl text-ink-900 mb-2">Timeline</h3>

        {items.length > 0 ? (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <BulletItem key={item.id} item={item} collections={collections} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-ink-600 font-sans text-sm mb-1">
              {isToday ? 'Nenhum registro hoje.' : 'Nenhum registro neste dia.'}
            </p>
            <p className="text-ink-600/60 font-sans text-xs">
              {isToday ? 'Escreva algo acima ou use o botão +.' : ''}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
