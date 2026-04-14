import { getWorkspace } from '@/lib/services/workspace'
import { getCollection, getCollections } from '@/lib/services/collections'
import { getItemsForWorkspace } from '@/lib/services/items'
import { BulletItem } from '@/components/ui/BulletItem'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { CollectionDetailActions } from './detail-actions'

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getWorkspace()
  const collection = await getCollection(id)
  const allCollections = await getCollections(workspace.id)
  const items = await getItemsForWorkspace(workspace.id, { collection_id: id })

  return (
    <main className="flex-1 flex flex-col p-6 pb-32">
      <header className="pt-8 pb-6 border-b border-fog-100/50 mb-6">
        <Link href="/collections" className="flex items-center gap-1 text-ink-600 hover:text-ink-900 text-sm font-sans mb-3">
          <ChevronLeft size={16} /> Coleções
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading text-ink-900 tracking-tight">{collection.name}</h1>
            {collection.description && (
              <p className="text-ink-600 font-sans text-sm mt-1">{collection.description}</p>
            )}
          </div>
          <CollectionDetailActions collectionId={id} collectionName={collection.name} />
        </div>
      </header>

      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <BulletItem key={item.id} item={item} collections={allCollections} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-ink-600 font-sans text-sm mb-1">Nenhum item nesta coleção.</p>
          <p className="text-ink-600/60 font-sans text-xs">Atribua itens do journal a esta coleção.</p>
        </div>
      )}
    </main>
  )
}
