import { getWorkspace } from '@/lib/services/workspace'
import { getCollection, getCollections } from '@/lib/services/collections'
import { getItemsForWorkspace } from '@/lib/services/items'
import { BulletItem } from '@/components/ui/BulletItem'
import { ChevronLeft, Folder } from 'lucide-react'
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
    <main className="flex-1 flex flex-col p-5 pb-32">
      <header className="pt-6 pb-5">
        <Link href="/collections" className="flex items-center gap-1 text-charcoal-400 hover:text-coral-500 text-xs font-semibold mb-4 transition-colors">
          <ChevronLeft size={14} /> Colecoes
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center">
              <Folder size={20} className="text-coral-500" />
            </div>
            <div>
              <h1 className="text-xl font-heading text-charcoal-900">{collection.name}</h1>
              {collection.description && (
                <p className="text-charcoal-400 font-sans text-xs mt-0.5">{collection.description}</p>
              )}
            </div>
          </div>
          <CollectionDetailActions collectionId={id} collectionName={collection.name} />
        </div>
      </header>

      <p className="text-xs text-charcoal-400 font-medium mb-3 px-1">
        {items.length} ite{items.length !== 1 ? 'ns' : 'm'}
      </p>

      {items.length > 0 ? (
        <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 overflow-hidden">
          {items.map((item, i) => (
            <div key={item.id} className={i < items.length - 1 ? 'border-b border-sand-100' : ''}>
              <BulletItem item={item} collections={allCollections} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-8 card-shadow border border-sand-200/40 flex flex-col items-center text-center">
          <span className="text-3xl mb-3">📁</span>
          <p className="text-charcoal-600 font-sans text-sm font-medium">Nenhum item nesta colecao</p>
          <p className="text-charcoal-400 font-sans text-xs mt-1">Atribua itens do journal a esta colecao</p>
        </div>
      )}
    </main>
  )
}
