'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { X, Plus, ExternalLink, Loader2 } from 'lucide-react'
import { BulletItem } from './BulletItem'
import { JournalComposer } from '@/app/journal/composer'
import { fetchAgendaForDate } from '@/lib/actions/agenda-actions'
import { formatDateBR, todayISO } from '@/lib/utils'
import type { JournalItem, Collection } from '@/types/database'

interface DayAgendaSheetProps {
  date: string | null
  collections: Collection[]
  onClose: () => void
}

export function DayAgendaSheet({ date, collections, onClose }: DayAgendaSheetProps) {
  const [items, setItems] = useState<JournalItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [version, setVersion] = useState(0)
  const [, startTransition] = useTransition()

  // Fechar com ESC
  useEffect(() => {
    if (!date) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [date, onClose])

  // Carregar itens sempre que a data abrir ou que haja mutação
  useEffect(() => {
    if (!date) {
      setItems([])
      setShowComposer(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchAgendaForDate(date)
      .then(data => { if (!cancelled) setItems(data) })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [date, version])

  if (!date) return null

  const isToday = date === todayISO()
  const tasks = items.filter(i => i.bullet_type === 'task')
  const events = items.filter(i => i.bullet_type === 'event')
  const notes = items.filter(i => i.bullet_type === 'note' || i.bullet_type === 'insight')

  function refresh() {
    startTransition(() => setVersion(v => v + 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm animate-fade-in"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl bg-surface shadow-elevated max-h-[85vh] flex flex-col animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sand-100">
          <div>
            <p className="text-charcoal-400 font-sans text-[10px] font-medium uppercase tracking-widest">
              {isToday ? 'Hoje' : 'Agenda do dia'}
            </p>
            <h2 className="font-heading text-xl text-charcoal-900">{formatDateBR(date)}</h2>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/journal?date=${date}`}
              className="p-2 rounded-xl hover:bg-sand-100 text-charcoal-500 transition-colors"
              title="Abrir página completa"
              onClick={onClose}
            >
              <ExternalLink size={16} />
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-sand-100 text-charcoal-500 transition-colors"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-8 text-charcoal-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}

          {!loading && items.length === 0 && !showComposer && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-3xl mb-2">🗓️</span>
              <p className="text-charcoal-600 font-sans text-sm font-medium">Nenhum registro neste dia</p>
              <p className="text-charcoal-400 font-sans text-xs mt-1">Toque em &ldquo;Adicionar&rdquo; para criar</p>
            </div>
          )}

          {!loading && events.length > 0 && (
            <Section title="Eventos" dotClass="bg-sky-500" count={events.length}>
              {events.map((it, i) => (
                <div key={it.id} className={i < events.length - 1 ? 'border-b border-sand-100' : ''}>
                  <BulletItem item={it} collections={collections} onAction={refresh} />
                  {it.start_at && (
                    <p className="text-[11px] font-sans text-sky-500 pl-12 -mt-2 pb-2">
                      {formatTime(it.start_at)}
                    </p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {!loading && tasks.length > 0 && (
            <Section title="Tarefas" dotClass="bg-coral-500" count={tasks.length}>
              {tasks.map((it, i) => (
                <div key={it.id} className={i < tasks.length - 1 ? 'border-b border-sand-100' : ''}>
                  <BulletItem item={it} collections={collections} onAction={refresh} />
                </div>
              ))}
            </Section>
          )}

          {!loading && notes.length > 0 && (
            <Section title="Notas" dotClass="bg-lavender-500" count={notes.length}>
              {notes.map((it, i) => (
                <div key={it.id} className={i < notes.length - 1 ? 'border-b border-sand-100' : ''}>
                  <BulletItem item={it} collections={collections} onAction={refresh} />
                </div>
              ))}
            </Section>
          )}

          {showComposer && (
            <div className="animate-scale-in">
              <JournalComposer
                date={date}
                onCreated={() => { refresh(); setShowComposer(false) }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sand-100">
          <button
            onClick={() => setShowComposer(s => !s)}
            className="w-full flex items-center justify-center gap-2 gradient-coral text-white text-sm font-semibold py-3 rounded-2xl active:scale-98 transition-transform shadow-md"
          >
            <Plus size={16} />
            {showComposer ? 'Fechar compositor' : 'Adicionar neste dia'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title, dotClass, count, children,
}: { title: string; dotClass: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
        <h3 className="font-sans font-semibold text-sm text-charcoal-700">
          {count} {title}
        </h3>
      </div>
      <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 overflow-hidden">
        {children}
      </div>
    </section>
  )
}

function formatTime(iso: string): string {
  // iso vem como "YYYY-MM-DDTHH:MM:SS" (sem timezone); tratar como local.
  const m = /T(\d{2}):(\d{2})/.exec(iso)
  if (!m) return ''
  return `${m[1]}:${m[2]}`
}
