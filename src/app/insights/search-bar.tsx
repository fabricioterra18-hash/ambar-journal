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
      <div className="bg-surface-lowest flex items-center px-4 py-3 rounded-2xl shadow-sm border border-fog-100/50 mb-8 focus-within:border-amber-700/50 transition-colors">
        <Search size={20} className="text-ink-600 mr-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar registros..."
          className="w-full bg-transparent border-none outline-none text-ink-900 font-sans"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
        />
        {isPending && (
          <div className="w-5 h-5 border-2 border-ink-600/30 border-t-ink-600 rounded-full animate-spin" />
        )}
      </div>

      {searched && results.length > 0 && (
        <section className="mb-8">
          <h3 className="font-heading text-lg text-ink-900 mb-3 px-2">
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </h3>
          <div className="flex flex-col gap-1">
            {results.map((item) => (
              <BulletItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {searched && results.length === 0 && (
        <div className="text-center py-6 mb-8">
          <p className="text-ink-600 font-sans text-sm">Nenhum resultado para &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </>
  )
}
