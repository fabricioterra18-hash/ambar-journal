'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import clsx from 'clsx'
import {
  Check, ChevronRight, ChevronLeft, Star, AlertCircle,
  Trash2, Sparkles, MoreHorizontal, Pencil,
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
  task: {
    icon: <div className="w-4 h-4 rounded-md border-2 border-charcoal-700 flex items-center justify-center" />,
    color: 'text-charcoal-900',
    label: 'Tarefa',
    bgPill: 'bg-coral-50 text-coral-600',
  },
  event: {
    icon: <div className="w-4 h-4 rounded-full border-2 border-sky-500" />,
    color: 'text-charcoal-900',
    label: 'Evento',
    bgPill: 'bg-sky-50 text-sky-500',
  },
  note: {
    icon: <div className="w-4 h-0.5 bg-charcoal-400 rounded-full mt-2" />,
    color: 'text-charcoal-700',
    label: 'Nota',
    bgPill: 'bg-sand-100 text-charcoal-600',
  },
  priority: {
    icon: <Star size={16} className="fill-honey-400 text-honey-400" />,
    color: 'text-charcoal-900 font-medium',
    label: 'Prioridade',
    bgPill: 'bg-honey-50 text-honey-500',
  },
  insight: {
    icon: <AlertCircle size={16} className="text-lavender-500" />,
    color: 'text-lavender-500',
    label: 'Insight',
    bgPill: 'bg-lavender-50 text-lavender-500',
  },
  migrated: {
    icon: <ChevronRight size={16} strokeWidth={2.5} className="text-coral-400" />,
    color: 'text-charcoal-400',
    label: 'Migrado',
    bgPill: 'bg-coral-50 text-coral-400',
  },
  completed: {
    icon: <Check size={16} strokeWidth={2.5} className="text-sage-500" />,
    color: 'text-charcoal-400 line-through',
    label: 'Concluido',
    bgPill: 'bg-sage-50 text-sage-500',
  },
  scheduled: {
    icon: <ChevronLeft size={16} strokeWidth={2.5} className="text-sky-400" />,
    color: 'text-charcoal-400',
    label: 'Agendado',
    bgPill: 'bg-sky-50 text-sky-400',
  },
}

const typeOptions: { value: BType; label: string; emoji: string }[] = [
  { value: 'task', label: 'Tarefa', emoji: '✅' },
  { value: 'event', label: 'Evento', emoji: '📅' },
  { value: 'note', label: 'Nota', emoji: '📝' },
  { value: 'insight', label: 'Insight', emoji: '💡' },
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
    <div className={clsx(
      'rounded-2xl transition-all duration-200',
      isPending && 'opacity-50',
      showActions && 'bg-sand-50'
    )}>
      {/* Main row */}
      <div
        className={clsx(
          'flex items-start gap-3 p-4',
          (isInteractive || onClick) && 'cursor-pointer active:bg-sand-100/50 transition-colors rounded-2xl'
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
            className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center"
          >
            {item.status === 'completed' ? (
              <div className="w-5 h-5 rounded-md bg-sage-500 flex items-center justify-center">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-md border-2 border-charcoal-300 hover:border-coral-400 transition-colors" />
            )}
          </button>
        ) : (
          <div className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center">
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
              className="w-full bg-surface text-charcoal-900 text-[15px] font-sans rounded-xl p-3 outline-none border border-coral-200 focus:border-coral-400 resize-none transition-colors"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <p className={clsx('text-[15px] leading-relaxed font-sans', config.color)}>{text}</p>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {/* AI badge */}
                {item?.ai_generated && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-lavender-50 text-lavender-500 font-medium">
                    <Sparkles size={9} /> IA
                  </span>
                )}
                {/* Collection badge */}
                {item?.collection_id && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-500 font-medium">
                    <Folder size={9} /> {collections?.find(c => c.id === item.collection_id)?.name ?? 'Colecao'}
                  </span>
                )}
                {/* Microtask counter */}
                {microtasks.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-coral-50 text-coral-500 font-medium"
                  >
                    <ListChecks size={9} />
                    {microtasks.filter(m => m.status === 'completed').length}/{microtasks.length}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {isInteractive && !isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
            className="mt-0.5 flex-shrink-0 text-charcoal-300 hover:text-charcoal-500 transition-colors p-1 rounded-lg"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>

      {/* Action bar */}
      {showActions && isInteractive && !isEditing && (
        <div className="px-4 pb-3 pl-12 animate-fade-in">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isTask && item.status === 'open' && (
              <ActionBtn icon={<Check size={12} />} label="Concluir" variant="sage" onClick={handleToggle} />
            )}
            {item.status === 'completed' && (
              <ActionBtn icon={<ChevronLeft size={12} />} label="Reabrir" variant="coral" onClick={handleToggle} />
            )}
            <ActionBtn icon={<Pencil size={12} />} label="Editar" variant="default" onClick={() => { setIsEditing(true); setShowActions(false) }} />

            {/* Type change */}
            <div className="relative">
              <ActionBtn icon={<Star size={12} />} label={config.label} variant="default" onClick={() => setShowTypeMenu(!showTypeMenu)} />
              {showTypeMenu && (
                <div className="absolute top-full left-0 mt-1 bg-surface rounded-xl shadow-elevated z-20 py-1 min-w-[140px] border border-sand-200 animate-scale-in">
                  {typeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleChangeType(opt.value)}
                      className={clsx(
                        'w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 flex items-center gap-2.5 transition-colors',
                        item.bullet_type === opt.value && 'text-coral-500 font-medium'
                      )}
                    >
                      <span>{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Migrate */}
            <div className="relative">
              <ActionBtn icon={<Calendar size={12} />} label="Adiar" variant="sky" onClick={() => setShowMigrateMenu(!showMigrateMenu)} />
              {showMigrateMenu && (
                <div className="absolute top-full left-0 mt-1 bg-surface rounded-xl shadow-elevated z-20 py-1 min-w-[160px] border border-sand-200 animate-scale-in">
                  <button onClick={() => handleMigrate(1)} className="w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 transition-colors">Amanha</button>
                  <button onClick={() => handleMigrate(2)} className="w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 transition-colors">Depois de amanha</button>
                  <button onClick={() => handleMigrate(7)} className="w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 transition-colors">Proxima semana</button>
                  <button onClick={() => handleMigrate(30)} className="w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 transition-colors">Proximo mes</button>
                </div>
              )}
            </div>

            {/* Collection */}
            {collections && collections.length > 0 && (
              <div className="relative">
                <ActionBtn icon={<Folder size={12} />} label="Colecao" variant="default" onClick={() => setShowCollectionMenu(!showCollectionMenu)} />
                {showCollectionMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-surface rounded-xl shadow-elevated z-20 py-1 min-w-[160px] border border-sand-200 animate-scale-in">
                    {item.collection_id && (
                      <button onClick={() => handleAssignCollection(null)} className="w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 text-rose-500 transition-colors">Remover colecao</button>
                    )}
                    {collections.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleAssignCollection(c.id)}
                        className={clsx('w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 transition-colors', item.collection_id === c.id && 'text-coral-500 font-medium')}
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
                label={microtasksLoading ? 'Gerando...' : 'IA Steps'}
                variant="lavender"
                onClick={handleGenerateMicrotasks}
                disabled={microtasksLoading}
              />
            )}

            <ActionBtn icon={<X size={12} />} label="Arquivar" variant="default" onClick={handleArchive} />
            <button onClick={handleDelete} className="ml-auto text-rose-400/60 hover:text-rose-500 p-1.5 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Microtasks */}
      {expanded && microtasks.length > 0 && (
        <div className="pl-12 pr-4 pb-3 flex flex-col gap-1 animate-slide-up">
          {microtasks.map((mt) => (
            <MicrotaskRow key={mt.id} microtask={mt} itemId={item!.id} />
          ))}
          <div className="flex gap-3 mt-2 flex-wrap">
            <button onClick={handleRegenerate} disabled={microtasksLoading} className="text-xs text-coral-500 font-medium flex items-center gap-1 hover:text-coral-600 transition-colors">
              <Sparkles size={10} /> {microtasksLoading ? 'Regenerando...' : 'Regenerar'}
            </button>
            <button onClick={handleSimplify} disabled={microtasksLoading} className="text-xs text-charcoal-400 font-medium flex items-center gap-1 hover:text-charcoal-600 transition-colors">
              <Minimize2 size={10} /> Simplificar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ icon, label, variant = 'default', onClick, disabled }: {
  icon: React.ReactNode; label: string; variant?: string; onClick: () => void; disabled?: boolean
}) {
  const variants: Record<string, string> = {
    default: 'bg-sand-100 text-charcoal-600 hover:bg-sand-200',
    sage: 'bg-sage-50 text-sage-600 hover:bg-sage-100',
    coral: 'bg-coral-50 text-coral-600 hover:bg-coral-100',
    sky: 'bg-sky-50 text-sky-500 hover:bg-sky-100',
    lavender: 'bg-lavender-50 text-lavender-500 hover:bg-lavender-100',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors',
        variants[variant] ?? variants.default
      )}
    >
      {icon} {label}
    </button>
  )
}

function MicrotaskRow({ microtask, itemId }: { microtask: Microtask; itemId: string }) {
  const [isPending, startTransition] = useTransition()
  const isDone = microtask.status === 'completed'

  return (
    <div className={clsx('flex items-center gap-3 py-1.5 rounded-lg px-2 hover:bg-sand-50 transition-colors', isPending && 'opacity-50')}>
      <button
        onClick={() => startTransition(() => toggleMicrotask(microtask.id))}
        className={clsx(
          'w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
          isDone ? 'bg-sage-500 border-sage-500' : 'border-charcoal-300 hover:border-coral-400'
        )}
      >
        {isDone && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>
      <span className={clsx('text-sm font-sans flex-1', isDone ? 'text-charcoal-400 line-through' : 'text-charcoal-800')}>
        {microtask.title}
      </span>
      <button
        onClick={() => startTransition(() => expandMicrotaskAction(itemId, microtask.id))}
        className="text-charcoal-300 hover:text-coral-500 p-0.5 transition-colors" title="Expandir"
      >
        <Maximize2 size={11} />
      </button>
      <button
        onClick={() => startTransition(() => removeMicrotask(microtask.id))}
        className="text-charcoal-300 hover:text-rose-500 p-0.5 transition-colors"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}
