import { Search, Sparkles } from 'lucide-react'
import { getWorkspace } from '@/lib/services/workspace'
import { getItemsForWorkspace } from '@/lib/services/items'
import { SearchBar } from './search-bar'

export default async function InsightsPage() {
  const workspace = await getWorkspace()

  // Get recent insights
  const insights = await getItemsForWorkspace(workspace.id, {
    bullet_type: 'insight',
    limit: 10,
  })

  // Get stuck items (migrated more than once)
  const migratedItems = await getItemsForWorkspace(workspace.id, {
    status: 'migrated',
    limit: 5,
  })

  return (
    <main className="flex-1 flex flex-col p-6 pb-32">
      <header className="pt-8 pb-6 mb-2">
        <p className="text-ink-600 font-sans font-medium text-xs tracking-wide uppercase mb-1">
          Revisão & Busca
        </p>
        <h1 className="text-3xl font-heading text-ink-900 tracking-tight">
          Insights
        </h1>
      </header>

      <SearchBar workspaceId={workspace.id} />

      {migratedItems.length > 0 && (
        <section className="bg-sunlight-50 rounded-2xl p-6 mb-8 shadow-sm border border-sunlight-200/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={64} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-amber-700">
              <Sparkles size={18} />
              <span className="font-sans font-semibold text-xs tracking-wider uppercase">Atenção</span>
            </div>
            <p className="text-ink-900 text-base leading-relaxed font-sans mb-2">
              Você tem <strong>{migratedItems.length} ite{migratedItems.length !== 1 ? 'ns' : 'm'}</strong> migrado{migratedItems.length !== 1 ? 's' : ''}. Deseja reavaliá-los?
            </p>
            <ul className="text-ink-600 text-sm font-sans space-y-1">
              {migratedItems.map((item) => (
                <li key={item.id}>• {item.text}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {insights.length > 0 ? (
        <section>
          <h3 className="font-heading text-xl text-ink-900 mb-4 px-2">Descobertas Recentes</h3>
          <div className="bg-surface-lowest rounded-3xl shadow-sm border border-fog-100/50 overflow-hidden py-2">
            {insights.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4">
                <div className="mt-1 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <Sparkles size={14} className="text-ochre-500" />
                </div>
                <p className="text-base leading-relaxed font-sans text-ochre-500">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-ink-600 font-sans text-sm mb-1">Nenhum insight registrado ainda.</p>
          <p className="text-ink-600/60 font-sans text-xs">Insights aparecem conforme você usa o journal.</p>
        </section>
      )}
    </main>
  )
}
