import { getWorkspace, getProfile } from '@/lib/services/workspace'
import { getOrCreateDailyJournal, getOrCreateEntry } from '@/lib/services/journal'
import { getItemsForEntry, getItemsForWorkspace } from '@/lib/services/items'
import { BulletItem } from '@/components/ui/BulletItem'
import { formatDateBR, todayISO, getGreeting } from '@/lib/utils'

export default async function Home() {
  const workspace = await getWorkspace()
  const profile = await getProfile()
  const today = todayISO()
  const journal = await getOrCreateDailyJournal(workspace.id, today)
  const entry = await getOrCreateEntry(workspace.id, journal.id, today)
  const items = await getItemsForEntry(entry.id)

  // Count stats
  const pendingTasks = items.filter(i => i.bullet_type === 'task' && i.status === 'open')
  const events = items.filter(i => i.bullet_type === 'event' && i.status === 'open')
  const priorityItems = items.filter(i => i.priority && i.priority >= 2 && i.status === 'open')
  const focusItems = priorityItems.length > 0
    ? priorityItems
    : items.filter(i => i.status === 'open').slice(0, 5)

  const displayName = profile.full_name?.split(' ')[0] || profile.email?.split('@')[0] || 'você'

  return (
    <main className="flex-1 flex flex-col p-6 pb-32">
      <header className="pt-8 pb-6">
        <p className="text-ink-600 font-sans font-medium text-sm tracking-wide uppercase mb-1">
          {formatDateBR(today)}
        </p>
        <h1 className="text-4xl font-heading text-ink-900 tracking-tight leading-tight">
          {getGreeting()},<br />
          {displayName}.
        </h1>
      </header>

      <section className="bg-sunlight-50 rounded-2xl p-5 mb-8 shadow-sm border border-sunlight-200/20">
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

      {focusItems.length > 0 ? (
        <section className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl text-ink-900 px-4 mb-2">Em Foco</h2>
          <div className="bg-sunlight-50 rounded-2xl border-2 border-ink-900 shadow-[4px_4px_0_0_#1F1B16] overflow-hidden py-2">
            {focusItems.map((item) => (
              <BulletItem key={item.id} item={item} />
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
