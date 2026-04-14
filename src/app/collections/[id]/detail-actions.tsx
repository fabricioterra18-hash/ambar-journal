'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Pencil, MoreHorizontal, X } from 'lucide-react'
import { editCollection, removeCollection } from '@/lib/actions/collection-actions'
import clsx from 'clsx'

interface Props {
  collectionId: string
  collectionName: string
}

export function CollectionDetailActions({ collectionId, collectionName }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(collectionName)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRename() {
    if (!name.trim() || name.trim() === collectionName) {
      setIsEditing(false)
      setName(collectionName)
      return
    }
    const formData = new FormData()
    formData.set('name', name.trim())
    startTransition(async () => {
      await editCollection(collectionId, formData)
      setIsEditing(false)
      setShowMenu(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await removeCollection(collectionId)
      router.push('/collections')
    })
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename()
            if (e.key === 'Escape') { setIsEditing(false); setName(collectionName) }
          }}
          className="bg-sunlight-50 border border-amber-700/30 rounded-lg px-3 py-1.5 text-sm font-sans text-ink-900 outline-none w-40"
        />
        <button
          onClick={handleRename}
          disabled={isPending}
          className="text-xs px-3 py-1.5 bg-amber-700/10 text-amber-700 font-medium rounded-lg"
        >
          Salvar
        </button>
        <button
          onClick={() => { setIsEditing(false); setName(collectionName) }}
          className="text-ink-600/40 hover:text-ink-600"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  if (isDeleting) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-clay-600 font-sans">Excluir coleção?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs px-3 py-1.5 bg-clay-600/10 text-clay-600 font-medium rounded-lg disabled:opacity-50"
        >
          {isPending ? 'Excluindo...' : 'Sim, excluir'}
        </button>
        <button
          onClick={() => setIsDeleting(false)}
          className="text-xs px-3 py-1.5 bg-ink-900/5 text-ink-600 font-medium rounded-lg"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="text-ink-600/60 hover:text-ink-900 p-2 rounded-xl hover:bg-fog-100 transition-colors"
      >
        <MoreHorizontal size={20} />
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-1 bg-sunlight-50 border-2 border-ink-900 rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
          <button
            onClick={() => { setIsEditing(true); setShowMenu(false) }}
            className="w-full text-left px-4 py-2.5 text-sm font-sans hover:bg-fog-100 flex items-center gap-2"
          >
            <Pencil size={14} /> Renomear
          </button>
          <button
            onClick={() => { setIsDeleting(true); setShowMenu(false) }}
            className="w-full text-left px-4 py-2.5 text-sm font-sans hover:bg-fog-100 flex items-center gap-2 text-clay-600"
          >
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </div>
  )
}
