'use client'

import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { BulletItem } from '@/components/ui/BulletItem'
import type { JournalItem } from '@/types/database'
import { searchItemsAction } from './search-action'

export function SearchBar({ workspaceId }: { workspaceId: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JournalItem[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSearch() {
    if (!query.trim()) return
    startTransition(async () => {
      const items = await searchItemsAction(workspaceId, query)
      setResults(items)
      setSearched(true)
    })
  }

  return (
    <>
      <div className="bg-surface flex items-center px-4 py-3 rounded-2xl card-shadow border border-sand-200/40 mb-5 focus-within:border-coral-300 transition-colors">
        <Search size={18} className="text-charcoal-400 mr-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar registros..."
          className="w-full bg-transparent border-none outline-none text-charcoal-900 font-sans text-sm placeholder:text-charcoal-400"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
        />
        {isPending && (
          <div className="w-4 h-4 border-2 border-coral-200 border-t-coral-500 rounded-full animate-spin" />
        )}
      </div>

      {searched && results.length > 0 && (
        <section className="mb-5">
          <h3 className="font-sans font-semibold text-sm text-charcoal-700 mb-3 px-1">
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </h3>
          <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 overflow-hidden">
            {results.map((item, i) => (
              <div key={item.id} className={i < results.length - 1 ? 'border-b border-sand-100' : ''}>
                <BulletItem item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {searched && results.length === 0 && (
        <div className="text-center py-6 mb-5">
          <p className="text-charcoal-400 font-sans text-sm">Nenhum resultado para &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </>
  )
}
