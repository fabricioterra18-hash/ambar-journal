import { Folder } from 'lucide-react'
import Link from 'next/link'
import { getWorkspace } from '@/lib/services/workspace'
import { getCollections, getCollectionItemCount } from '@/lib/services/collections'
import { CollectionActions } from './actions'

export default async function CollectionsPage() {
  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)

  // Get item counts for each collection
  const collectionsWithCounts = await Promise.all(
    collections.map(async (c) => ({
      ...c,
      itemCount: await getCollectionItemCount(c.id),
    }))
  )

  return (
    <main className="flex-1 flex flex-col p-6 pb-32">
      <header className="pt-8 pb-6 flex items-center justify-between border-b border-fog-100/50 mb-6">
        <div>
          <p className="text-ink-600 font-sans font-medium text-xs tracking-wide uppercase mb-1">
            Organização
          </p>
          <h1 className="text-3xl font-heading text-ink-900 tracking-tight">
            Coleções
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {collectionsWithCounts.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.id}`}
            className="bg-surface-lowest rounded-2xl p-5 shadow-sm border border-sunlight-200/20 hover:-translate-y-1 transition-transform cursor-pointer block"
          >
            <Folder className="text-amber-700 mb-3" size={24} />
            <h3 className="font-heading text-lg text-ink-900 mb-1">{collection.name}</h3>
            <p className="font-sans text-xs text-ink-600">{collection.itemCount} ite{collection.itemCount !== 1 ? 'ns' : 'm'}</p>
          </Link>
        ))}

        <CollectionActions />
      </div>

      {collections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center col-span-2">
          <p className="text-ink-600 font-sans text-sm mb-1">Nenhuma coleção ainda.</p>
          <p className="text-ink-600/60 font-sans text-xs">Crie sua primeira coleção com o botão acima.</p>
        </div>
      )}
    </main>
  )
}
