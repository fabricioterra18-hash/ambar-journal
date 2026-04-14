'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { createNewCollection } from '@/lib/actions/collection-actions'

export function CollectionActions() {
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) return
    const formData = new FormData()
    formData.set('name', name)

    startTransition(async () => {
      await createNewCollection(formData)
      setName('')
      setIsCreating(false)
    })
  }

  if (isCreating) {
    return (
      <div className="bg-surface-lowest rounded-2xl p-5 border-2 border-amber-700 shadow-sm col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-lg text-ink-900">Nova Coleção</h3>
          <button onClick={() => setIsCreating(false)} className="text-ink-600">
            <X size={18} />
          </button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da coleção"
          className="w-full bg-fog-100 px-4 py-3 rounded-xl text-ink-900 font-sans outline-none mb-3"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
        />
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isPending}
          className="w-full bg-ink-900 text-sunlight-50 py-3 rounded-xl font-sans font-bold disabled:opacity-50"
        >
          {isPending ? 'Criando...' : 'Criar Coleção'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="bg-transparent border border-dashed border-ink-900/20 rounded-2xl p-5 flex flex-col items-center justify-center text-ink-600 hover:bg-ink-900/5 transition-colors cursor-pointer"
    >
      <Plus className="mb-2 opacity-50" size={24} />
      <span className="font-sans text-sm font-medium">Nova Coleção</span>
    </button>
  )
}
