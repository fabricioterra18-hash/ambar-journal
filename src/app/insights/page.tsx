import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'
import { getWorkspace } from '@/lib/services/workspace'
import { getCollections } from '@/lib/services/collections'
import { getItemsForWorkspace } from '@/lib/services/items'
import { BulletItem } from '@/components/ui/BulletItem'
import { SearchBar } from './search-bar'
import { AISummaries, AISummariesFallback } from './_components/AISummaries'

export default async function InsightsPage() {
  const workspace = await getWorkspace()

  const [collections, insights, migratedItems] = await Promise.all([
    getCollections(workspace.id),
    getItemsForWorkspace(workspace.id, { bullet_type: 'insight', limit: 10 }),
    getItemsForWorkspace(workspace.id, { status: 'migrated', limit: 5 }),
  ])

  return (
    <main className="flex-1 flex flex-col p-5 pb-32">
      <header className="pt-6 pb-5">
        <p className="text-charcoal-400 font-sans font-medium text-xs tracking-widest uppercase mb-1">
          Revisao & Reflexao
        </p>
        <h1 className="text-2xl font-heading text-charcoal-900">
          Insights
        </h1>
      </header>

      <SearchBar workspaceId={workspace.id} />

      {/* AI summaries em Suspense — não bloqueiam o render da página */}
      <Suspense fallback={<AISummariesFallback />}>
        <AISummaries />
      </Suspense>

      {/* Migrated items */}
      {migratedItems.length > 0 && (
        <section className="bg-coral-50 rounded-2xl p-4 mb-5 border border-coral-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-coral-500 flex items-center justify-center">
              <AlertTriangle size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-sm text-charcoal-900">Itens Migrados</h3>
              <p className="text-xs text-charcoal-500">{migratedItems.length} ite{migratedItems.length !== 1 ? 'ns' : 'm'} para reavaliar</p>
            </div>
          </div>
          <div className="bg-surface/60 rounded-xl overflow-hidden">
            {migratedItems.map((item) => (
              <BulletItem key={item.id} item={item} collections={collections} />
            ))}
          </div>
        </section>
      )}

      {/* Insights */}
      {insights.length > 0 ? (
        <section>
          <h3 className="font-sans font-semibold text-sm text-charcoal-700 mb-3 px-1">Descobertas Recentes</h3>
          <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 overflow-hidden">
            {insights.map((item, i) => (
              <div key={item.id} className={i < insights.length - 1 ? 'border-b border-sand-100' : ''}>
                <BulletItem item={item} collections={collections} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-3">💡</span>
          <p className="text-charcoal-600 font-sans text-sm font-medium">Nenhum insight ainda</p>
          <p className="text-charcoal-400 font-sans text-xs mt-1">Insights aparecem conforme voce usa o journal</p>
        </section>
      )}
    </main>
  )
}
