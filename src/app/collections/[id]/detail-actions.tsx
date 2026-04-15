'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Pencil, MoreHorizontal, X } from 'lucide-react'
import { editCollection, removeCollection } from '@/lib/actions/collection-actions'

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
          className="bg-sand-50 border border-coral-200 rounded-lg px-3 py-1.5 text-sm font-sans text-charcoal-900 outline-none w-36 focus:border-coral-400 transition-colors"
        />
        <button onClick={handleRename} disabled={isPending} className="text-xs px-3 py-1.5 gradient-coral text-white font-medium rounded-lg">
          Salvar
        </button>
        <button onClick={() => { setIsEditing(false); setName(collectionName) }} className="text-charcoal-400 hover:text-charcoal-600">
          <X size={16} />
        </button>
      </div>
    )
  }

  if (isDeleting) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-rose-500 font-sans font-medium">Excluir?</span>
        <button onClick={handleDelete} disabled={isPending} className="text-xs px-3 py-1.5 bg-rose-50 text-rose-500 font-medium rounded-lg border border-rose-100 disabled:opacity-50">
          {isPending ? 'Excluindo...' : 'Sim'}
        </button>
        <button onClick={() => setIsDeleting(false)} className="text-xs px-3 py-1.5 bg-sand-100 text-charcoal-600 font-medium rounded-lg">
          Nao
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-xl bg-sand-100 flex items-center justify-center text-charcoal-500 hover:bg-sand-200 transition-colors">
        <MoreHorizontal size={18} />
      </button>
      {showMenu && (
        <div className="absolute top-full right-0 mt-1 bg-surface rounded-xl shadow-elevated z-20 py-1 min-w-[150px] border border-sand-200 animate-scale-in">
          <button onClick={() => { setIsEditing(true); setShowMenu(false) }} className="w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 flex items-center gap-2 transition-colors">
            <Pencil size={14} /> Renomear
          </button>
          <button onClick={() => { setIsDeleting(true); setShowMenu(false) }} className="w-full text-left px-3 py-2.5 text-sm font-sans hover:bg-sand-50 flex items-center gap-2 text-rose-500 transition-colors">
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </div>
  )
}
