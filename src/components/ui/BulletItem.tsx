'use client'

import { useState, useTransition } from 'react'
import clsx from 'clsx'
import { Check, ChevronRight, ChevronLeft, Star, AlertCircle, Trash2, Sparkles, MoreHorizontal } from 'lucide-react'
import { completeBullet, reopenBullet, removeBullet } from '@/lib/actions/bullet-actions'
import { generateMicrotasksForItem, toggleMicrotask, removeMicrotask, regenerateMicrotasks } from '@/lib/actions/microtask-actions'
import type { JournalItem, Microtask } from '@/types/database'

export type BulletType = 'task' | 'event' | 'note' | 'priority' | 'insight' | 'migrated' | 'completed' | 'scheduled'

interface BulletItemProps {
  item?: JournalItem
  // Fallback for static usage
  type?: BulletType
  content?: string
  onClick?: () => void
}

const bulletConfig = {
  task: {
    icon: <div className="w-2.5 h-2.5 bg-ink-900 rounded-full" />,
    color: 'text-ink-900'
  },
  event: {
    icon: <div className="w-3 h-3 border-2 border-ink-900 rounded-full" />,
    color: 'text-ink-900'
  },
  note: {
    icon: <div className="w-3 h-0.5 bg-ink-900 rounded-full" />,
    color: 'text-ink-900'
  },
  priority: {
    icon: <Star size={14} className="fill-amber-700 text-amber-700" />,
    color: 'text-amber-700 font-medium'
  },
  insight: {
    icon: <AlertCircle size={14} className="text-ochre-500" />,
    color: 'text-ochre-500'
  },
  migrated: {
    icon: <ChevronRight size={16} strokeWidth={3} className="text-clay-600" />,
    color: 'text-ink-600'
  },
  completed: {
    icon: <Check size={16} strokeWidth={3} className="text-olive-600" />,
    color: 'text-ink-600 line-through'
  },
  scheduled: {
    icon: <ChevronLeft size={16} strokeWidth={3} className="text-clay-600" />,
    color: 'text-ink-600'
  }
}

export function BulletItem({ item, type, content, onClick }: BulletItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [microtasksLoading, setMicrotasksLoading] = useState(false)

  const bulletType = item ? (item.status === 'completed' ? 'completed' : item.status === 'migrated' ? 'migrated' : item.bullet_type) as BulletType : (type ?? 'note')
  const text = item?.text ?? content ?? ''
  const config = bulletConfig[bulletType]
  const microtasks = item?.microtasks ?? []
  const isTask = item?.bullet_type === 'task'
  const isInteractive = !!item

  function handleToggle() {
    if (!item) return
    startTransition(() => {
      if (item.status === 'completed') {
        reopenBullet(item.id)
      } else {
        completeBullet(item.id)
      }
    })
  }

  function handleDelete() {
    if (!item) return
    startTransition(() => {
      removeBullet(item.id)
    })
  }

  function handleGenerateMicrotasks() {
    if (!item) return
    setMicrotasksLoading(true)
    startTransition(async () => {
      try {
        await generateMicrotasksForItem(item.id)
      } finally {
        setMicrotasksLoading(false)
        setExpanded(true)
      }
    })
  }

  function handleRegenerateMicrotasks() {
    if (!item) return
    setMicrotasksLoading(true)
    startTransition(async () => {
      try {
        await regenerateMicrotasks(item.id)
      } finally {
        setMicrotasksLoading(false)
      }
    })
  }

  return (
    <div className={clsx('rounded-xl transition-colors', isPending && 'opacity-60')}>
      <div
        className={clsx(
          'flex items-start gap-4 p-4',
          isInteractive ? 'cursor-pointer hover:bg-sunlight-50 active:bg-sunlight-200' : '',
          onClick ? 'cursor-pointer hover:bg-sunlight-50 active:bg-sunlight-200' : ''
        )}
        onClick={() => {
          if (onClick) onClick()
          else if (isInteractive) setShowActions(!showActions)
        }}
      >
        {/* Toggle area for tasks */}
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
          <p className={clsx('text-base leading-relaxed font-sans', config.color)}>
            {text}
          </p>
          {microtasks.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
              className="text-xs text-amber-700 font-medium mt-1"
            >
              {expanded ? 'Ocultar' : `${microtasks.filter(m => m.status === 'completed').length}/${microtasks.length} passos`}
            </button>
          )}
        </div>

        {isInteractive && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
            className="mt-1 flex-shrink-0 text-ink-600/40 hover:text-ink-600"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>

      {/* Action bar */}
      {showActions && isInteractive && (
        <div className="flex items-center gap-2 px-4 pb-3 pl-14">
          {isTask && item.status !== 'completed' && (
            <button
              onClick={handleToggle}
              className="text-xs bg-olive-600/10 text-olive-600 px-3 py-1.5 rounded-lg font-medium"
            >
              Concluir
            </button>
          )}
          {isTask && microtasks.length === 0 && (
            <button
              onClick={handleGenerateMicrotasks}
              disabled={microtasksLoading}
              className="text-xs bg-amber-700/10 text-amber-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
            >
              <Sparkles size={12} />
              {microtasksLoading ? 'Gerando...' : 'Microtarefas'}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-clay-600/60 hover:text-clay-600 px-2 py-1.5 rounded-lg ml-auto"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Microtasks */}
      {expanded && microtasks.length > 0 && (
        <div className="pl-14 pr-4 pb-3 flex flex-col gap-1">
          {microtasks.map((mt) => (
            <MicrotaskRow key={mt.id} microtask={mt} />
          ))}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleRegenerateMicrotasks}
              disabled={microtasksLoading}
              className="text-xs text-amber-700 font-medium"
            >
              {microtasksLoading ? 'Regenerando...' : 'Regenerar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MicrotaskRow({ microtask }: { microtask: Microtask }) {
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
      <span className={clsx('text-sm font-sans', isDone ? 'text-ink-600 line-through' : 'text-ink-900')}>
        {microtask.title}
      </span>
      <button
        onClick={() => startTransition(() => removeMicrotask(microtask.id))}
        className="ml-auto text-ink-600/30 hover:text-clay-600"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
