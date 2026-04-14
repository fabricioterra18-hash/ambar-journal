'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import clsx from 'clsx'
import {
  Check, ChevronRight, ChevronLeft, Star, AlertCircle,
  Trash2, Sparkles, MoreHorizontal, Pencil, ArrowRight,
  Calendar, Folder, X, ListChecks, Minimize2, Maximize2
} from 'lucide-react'
import {
  completeBullet, reopenBullet, removeBullet,
  updateBulletText, updateBulletType, archiveBullet,
  migrateBulletToDate, assignToCollection
} from '@/lib/actions/bullet-actions'
import {
  generateMicrotasksForItem, toggleMicrotask, removeMicrotask,
  regenerateMicrotasks, simplifyMicrotasksAction, expandMicrotaskAction
} from '@/lib/actions/microtask-actions'
import type { JournalItem, Microtask, BulletType as BType, Collection } from '@/types/database'

export type BulletType = 'task' | 'event' | 'note' | 'priority' | 'insight' | 'migrated' | 'completed' | 'scheduled'

interface BulletItemProps {
  item?: JournalItem
  collections?: Collection[]
  type?: BulletType
  content?: string
  onClick?: () => void
}

const bulletConfig = {
  task: { icon: <div className="w-2.5 h-2.5 bg-ink-900 rounded-full" />, color: 'text-ink-900', label: 'Tarefa' },
  event: { icon: <div className="w-3 h-3 border-2 border-ink-900 rounded-full" />, color: 'text-ink-900', label: 'Evento' },
  note: { icon: <div className="w-3 h-0.5 bg-ink-900 rounded-full" />, color: 'text-ink-900', label: 'Nota' },
  priority: { icon: <Star size={14} className="fill-amber-700 text-amber-700" />, color: 'text-amber-700 font-medium', label: 'Prioridade' },
  insight: { icon: <AlertCircle size={14} className="text-ochre-500" />, color: 'text-ochre-500', label: 'Insight' },
  migrated: { icon: <ChevronRight size={16} strokeWidth={3} className="text-clay-600" />, color: 'text-ink-600', label: 'Migrado' },
  completed: { icon: <Check size={16} strokeWidth={3} className="text-olive-600" />, color: 'text-ink-600 line-through', label: 'Concluído' },
  scheduled: { icon: <ChevronLeft size={16} strokeWidth={3} className="text-clay-600" />, color: 'text-ink-600', label: 'Agendado' },
}

const typeOptions: { value: BType; label: string }[] = [
  { value: 'task', label: 'Tarefa' },
  { value: 'event', label: 'Evento' },
  { value: 'note', label: 'Nota' },
  { value: 'insight', label: 'Insight' },
]

export function BulletItem({ item, collections, type, content, onClick }: BulletItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item?.text ?? '')
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [showMigrateMenu, setShowMigrateMenu] = useState(false)
  const [showCollectionMenu, setShowCollectionMenu] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [microtasksLoading, setMicrotasksLoading] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)

  const bulletType = item
    ? (item.status === 'completed' ? 'completed' : item.status === 'migrated' ? 'migrated' : item.bullet_type) as BulletType
    : (type ?? 'note')
  const text = item?.text ?? content ?? ''
  const config = bulletConfig[bulletType]
  const microtasks = item?.microtasks ?? []
  const isTask = item?.bullet_type === 'task'
  const isInteractive = !!item

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus()
      editRef.current.selectionStart = editRef.current.value.length
    }
  }, [isEditing])

  function handleSaveEdit() {
    if (!item || editText.trim() === item.text) {
      setIsEditing(false)
      return
    }
    startTransition(async () => {
      await updateBulletText(item.id, editText.trim())
      setIsEditing(false)
    })
  }

  function handleToggle() {
    if (!item) return
    startTransition(() => {
      item.status === 'completed' ? reopenBullet(item.id) : completeBullet(item.id)
    })
  }

  function handleChangeType(newType: BType) {
    if (!item) return
    startTransition(() => updateBulletType(item.id, newType))
    setShowTypeMenu(false)
  }

  function handleMigrate(daysAhead: number) {
    if (!item) return
    const today = new Date()
    const target = new Date(today)
    target.setDate(today.getDate() + daysAhead)
    const toDate = target.toISOString().split('T')[0]
    const fromDate = new Date().toISOString().split('T')[0]

    startTransition(() => migrateBulletToDate(item.id, item.entry_id, fromDate, toDate))
    setShowMigrateMenu(false)
    setShowActions(false)
  }

  function handleAssignCollection(collectionId: string | null) {
    if (!item) return
    startTransition(() => assignToCollection(item.id, collectionId))
    setShowCollectionMenu(false)
  }

  function handleDelete() {
    if (!item) return
    startTransition(() => removeBullet(item.id))
  }

  function handleArchive() {
    if (!item) return
    startTransition(() => archiveBullet(item.id))
    setShowActions(false)
  }

  function handleGenerateMicrotasks() {
    if (!item) return
    setMicrotasksLoading(true)
    startTransition(async () => {
      try { await generateMicrotasksForItem(item.id) }
      finally { setMicrotasksLoading(false); setExpanded(true) }
    })
  }

  function handleRegenerate() {
    if (!item) return
    setMicrotasksLoading(true)
    startTransition(async () => {
      try { await regenerateMicrotasks(item.id) }
      finally { setMicrotasksLoading(false) }
    })
  }

  function handleSimplify() {
    if (!item) return
    setMicrotasksLoading(true)
    startTransition(async () => {
      try { await simplifyMicrotasksAction(item.id) }
      finally { setMicrotasksLoading(false) }
    })
  }

  return (
    <div className={clsx('rounded-xl transition-colors', isPending && 'opacity-60')}>
      {/* Main row */}
      <div
        className={clsx(
          'flex items-start gap-3 p-4',
          (isInteractive || onClick) && 'cursor-pointer hover:bg-sunlight-50 active:bg-sunlight-200'
        )}
        onClick={() => {
          if (onClick) onClick()
          else if (isInteractive && !isEditing) setShowActions(!showActions)
        }}
      >
        {/* Icon / toggle */}
        {isInteractive && isTask ? (
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle() }}
            className="mt-1 flex-shrink-0 w-6 h-6 flex items-center justify-center"
          >
            {config.icon}
          </button>
        ) : (
          <div className="mt-1 flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {config.icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              ref={editRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit() }
                if (e.key === 'Escape') { setEditText(item?.text ?? ''); setIsEditing(false) }
              }}
              className="w-full bg-sunlight-50 text-ink-900 text-base font-sans rounded-lg p-2 outline-none border border-amber-700/30 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <p className={clsx('text-base leading-relaxed font-sans', config.color)}>{text}</p>
              {/* AI badge */}
              {item?.ai_generated && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 mt-1 opacity-70">
                  <Sparkles size={10} /> classificado por IA
                </span>
              )}
              {/* Collection badge */}
              {item?.collection_id && (
                <span className="inline-flex items-center gap-1 text-[10px] text-ink-600 mt-1">
                  <Folder size={10} /> {collections?.find(c => c.id === item.collection_id)?.name ?? 'Coleção'}
                </span>
              )}
              {/* Microtask counter */}
              {microtasks.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                  className="flex items-center gap-1 text-xs text-amber-700 font-medium mt-1.5"
                >
                  <ListChecks size={12} />
                  {microtasks.filter(m => m.status === 'completed').length}/{microtasks.length} passos
                </button>
              )}
            </>
          )}
        </div>

        {isInteractive && !isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
            className="mt-1 flex-shrink-0 text-ink-600/40 hover:text-ink-600"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>

      {/* Action bar */}
      {showActions && isInteractive && !isEditing && (
        <div className="px-4 pb-3 pl-13">
          {/* Row 1: primary actions */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {isTask && item.status === 'open' && (
              <ActionBtn icon={<Check size={12} />} label="Concluir" color="olive" onClick={handleToggle} />
            )}
            {item.status === 'completed' && (
              <ActionBtn icon={<ChevronLeft size={12} />} label="Reabrir" color="amber" onClick={handleToggle} />
            )}
            <ActionBtn icon={<Pencil size={12} />} label="Editar" color="ink" onClick={() => { setIsEditing(true); setShowActions(false) }} />

            {/* Type change */}
            <div className="relative">
              <ActionBtn icon={<Star size={12} />} label={config.label} color="ink" onClick={() => setShowTypeMenu(!showTypeMenu)} />
              {showTypeMenu && (
                <div className="absolute top-full left-0 mt-1 bg-sunlight-50 border-2 border-ink-900 rounded-xl shadow-lg z-20 py-1 min-w-[120px]">
                  {typeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleChangeType(opt.value)}
                      className={clsx(
                        'w-full text-left px-4 py-2 text-sm font-sans hover:bg-fog-100 flex items-center gap-2',
                        item.bullet_type === opt.value && 'text-amber-700 font-medium'
                      )}
                    >
                      <div className="w-4 flex justify-center">{bulletConfig[opt.value].icon}</div>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: secondary actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Migrate / Postpone */}
            <div className="relative">
              <ActionBtn icon={<Calendar size={12} />} label="Adiar" color="clay" onClick={() => setShowMigrateMenu(!showMigrateMenu)} />
              {showMigrateMenu && (
                <div className="absolute top-full left-0 mt-1 bg-sunlight-50 border-2 border-ink-900 rounded-xl shadow-lg z-20 py-1 min-w-[140px]">
                  <button onClick={() => handleMigrate(1)} className="w-full text-left px-4 py-2 text-sm font-sans hover:bg-fog-100">Amanhã</button>
                  <button onClick={() => handleMigrate(2)} className="w-full text-left px-4 py-2 text-sm font-sans hover:bg-fog-100">Depois de amanhã</button>
                  <button onClick={() => handleMigrate(7)} className="w-full text-left px-4 py-2 text-sm font-sans hover:bg-fog-100">Próxima semana</button>
                  <button onClick={() => handleMigrate(30)} className="w-full text-left px-4 py-2 text-sm font-sans hover:bg-fog-100">Próximo mês</button>
                </div>
              )}
            </div>

            {/* Assign to collection */}
            {collections && collections.length > 0 && (
              <div className="relative">
                <ActionBtn icon={<Folder size={12} />} label="Coleção" color="ink" onClick={() => setShowCollectionMenu(!showCollectionMenu)} />
                {showCollectionMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-sunlight-50 border-2 border-ink-900 rounded-xl shadow-lg z-20 py-1 min-w-[140px]">
                    {item.collection_id && (
                      <button onClick={() => handleAssignCollection(null)} className="w-full text-left px-4 py-2 text-sm font-sans hover:bg-fog-100 text-clay-600">Remover coleção</button>
                    )}
                    {collections.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleAssignCollection(c.id)}
                        className={clsx('w-full text-left px-4 py-2 text-sm font-sans hover:bg-fog-100', item.collection_id === c.id && 'text-amber-700 font-medium')}
                      >{c.name}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Microtasks */}
            {isTask && microtasks.length === 0 && item.status !== 'completed' && (
              <ActionBtn
                icon={<Sparkles size={12} />}
                label={microtasksLoading ? 'Gerando...' : 'Microtarefas'}
                color="amber"
                onClick={handleGenerateMicrotasks}
                disabled={microtasksLoading}
              />
            )}

            <ActionBtn icon={<X size={12} />} label="Arquivar" color="ink" onClick={handleArchive} />
            <button onClick={handleDelete} className="ml-auto text-clay-600/50 hover:text-clay-600 p-1.5">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Microtasks */}
      {expanded && microtasks.length > 0 && (
        <div className="pl-13 pr-4 pb-3 flex flex-col gap-1">
          {microtasks.map((mt) => (
            <MicrotaskRow key={mt.id} microtask={mt} itemId={item!.id} />
          ))}
          <div className="flex gap-3 mt-2 flex-wrap">
            <button onClick={handleRegenerate} disabled={microtasksLoading} className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <Sparkles size={10} /> {microtasksLoading ? 'Regenerando...' : 'Regenerar'}
            </button>
            <button onClick={handleSimplify} disabled={microtasksLoading} className="text-xs text-ink-600 font-medium flex items-center gap-1">
              <Minimize2 size={10} /> Simplificar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ icon, label, color, onClick, disabled }: {
  icon: React.ReactNode; label: string; color: string; onClick: () => void; disabled?: boolean
}) {
  const colors: Record<string, string> = {
    olive: 'bg-olive-600/10 text-olive-600',
    amber: 'bg-amber-700/10 text-amber-700',
    clay: 'bg-clay-600/10 text-clay-600',
    ink: 'bg-ink-900/5 text-ink-600',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-50', colors[color] ?? colors.ink)}
    >
      {icon} {label}
    </button>
  )
}

function MicrotaskRow({ microtask, itemId }: { microtask: Microtask; itemId: string }) {
  const [isPending, startTransition] = useTransition()
  const isDone = microtask.status === 'completed'

  return (
    <div className={clsx('flex items-center gap-3 py-1.5', isPending && 'opacity-50')}>
      <button
        onClick={() => startTransition(() => toggleMicrotask(microtask.id))}
        className={clsx(
          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          isDone ? 'bg-olive-600 border-olive-600' : 'border-ink-900/30'
        )}
      >
        {isDone && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>
      <span className={clsx('text-sm font-sans flex-1', isDone ? 'text-ink-600 line-through' : 'text-ink-900')}>
        {microtask.title}
      </span>
      <button
        onClick={() => startTransition(() => expandMicrotaskAction(itemId, microtask.id))}
        className="text-ink-600/30 hover:text-amber-700 p-0.5" title="Expandir"
      >
        <Maximize2 size={11} />
      </button>
      <button
        onClick={() => startTransition(() => removeMicrotask(microtask.id))}
        className="text-ink-600/30 hover:text-clay-600 p-0.5"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}
