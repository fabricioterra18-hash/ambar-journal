import { Folder, Plus } from 'lucide-react'
import Link from 'next/link'
import { getWorkspace } from '@/lib/services/workspace'
import { getCollections, getCollectionItemCount } from '@/lib/services/collections'
import { CollectionActions } from './actions'

const COLORS = ['bg-coral-50 border-coral-100', 'bg-sky-50 border-sky-100', 'bg-lavender-50 border-lavender-100', 'bg-sage-50 border-sage-100', 'bg-honey-50 border-honey-100', 'bg-rose-50 border-rose-100']
const ICON_COLORS = ['text-coral-500', 'text-sky-500', 'text-lavender-500', 'text-sage-500', 'text-honey-500', 'text-rose-500']

export default async function CollectionsPage() {
  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)

  const collectionsWithCounts = await Promise.all(
    collections.map(async (c, i) => ({
      ...c,
      itemCount: await getCollectionItemCount(c.id),
      colorIdx: i % COLORS.length,
    }))
  )

  return (
    <main className="flex-1 flex flex-col p-5 pb-32">
      <header className="pt-6 pb-5">
        <p className="text-charcoal-400 font-sans font-medium text-xs tracking-widest uppercase mb-1">
          Organizacao
        </p>
        <h1 className="text-2xl font-heading text-charcoal-900">
          Colecoes
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {collectionsWithCounts.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.id}`}
            className={`rounded-2xl p-5 border ${COLORS[collection.colorIdx]} hover:-translate-y-0.5 transition-all active:scale-98 block`}
          >
            <div className={`w-10 h-10 rounded-xl bg-surface/60 flex items-center justify-center mb-3 ${ICON_COLORS[collection.colorIdx]}`}>
              <Folder size={20} />
            </div>
            <h3 className="font-sans font-semibold text-sm text-charcoal-900 mb-0.5">{collection.name}</h3>
            <p className="font-sans text-xs text-charcoal-400">
              {collection.itemCount} ite{collection.itemCount !== 1 ? 'ns' : 'm'}
            </p>
          </Link>
        ))}

        <CollectionActions />
      </div>

      {collections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-3xl mb-3">📁</span>
          <p className="text-charcoal-600 font-sans text-sm font-medium">Nenhuma colecao ainda</p>
          <p className="text-charcoal-400 font-sans text-xs mt-1">Crie sua primeira colecao acima</p>
        </div>
      )}
    </main>
  )
}
