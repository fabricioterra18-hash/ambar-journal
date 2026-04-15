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
      <div className="bg-surface rounded-2xl p-5 border-2 border-coral-300 card-shadow col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sans font-semibold text-sm text-charcoal-900">Nova Colecao</h3>
          <button onClick={() => setIsCreating(false)} className="text-charcoal-400 hover:text-charcoal-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da colecao"
          className="w-full bg-sand-50 px-4 py-3 rounded-xl text-charcoal-900 font-sans outline-none mb-3 border border-sand-200 focus:border-coral-300 transition-colors"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
        />
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isPending}
          className="w-full gradient-coral text-white py-3 rounded-xl font-sans font-semibold disabled:opacity-40 active:scale-98 transition-transform"
        >
          {isPending ? 'Criando...' : 'Criar Colecao'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="bg-transparent border-2 border-dashed border-sand-300 rounded-2xl p-5 flex flex-col items-center justify-center text-charcoal-400 hover:border-coral-300 hover:text-coral-500 transition-all cursor-pointer active:scale-98"
    >
      <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center mb-2">
        <Plus size={20} />
      </div>
      <span className="font-sans text-xs font-medium">Nova Colecao</span>
    </button>
  )
}
