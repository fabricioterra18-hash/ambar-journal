import { Sparkles, TrendingUp, AlertTriangle, Search } from 'lucide-react'
import { getWorkspace } from '@/lib/services/workspace'
import { getCollections } from '@/lib/services/collections'
import { getItemsForWorkspace } from '@/lib/services/items'
import { getDailySummary, getWeeklySummary } from '@/lib/actions/insight-actions'
import { BulletItem } from '@/components/ui/BulletItem'
import { SearchBar } from './search-bar'

export default async function InsightsPage() {
  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)

  const insights = await getItemsForWorkspace(workspace.id, {
    bullet_type: 'insight',
    limit: 10,
  })

  const migratedItems = await getItemsForWorkspace(workspace.id, {
    status: 'migrated',
    limit: 5,
  })

  let dailySummary: Awaited<ReturnType<typeof getDailySummary>> = null
  let weeklySummary: Awaited<ReturnType<typeof getWeeklySummary>> = null
  try { dailySummary = await getDailySummary() } catch {}
  try { weeklySummary = await getWeeklySummary() } catch {}

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

      {/* Daily summary */}
      {dailySummary && (
        <section className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40 mb-5 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-5">
            <Sparkles size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-coral-500 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="font-sans font-semibold text-xs text-coral-500 tracking-wider uppercase">Resumo do Dia</span>
            </div>
            <p className="text-charcoal-800 text-sm leading-relaxed font-sans">{dailySummary.summary}</p>
            {dailySummary.suggestion && (
              <p className="text-coral-500 text-xs font-sans mt-2 font-medium italic">{dailySummary.suggestion}</p>
            )}
          </div>
        </section>
      )}

      {/* Weekly summary */}
      {weeklySummary && (
        <section className="bg-charcoal-900 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-lavender-500/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-lavender-400" />
            </div>
            <span className="font-sans font-semibold text-xs text-lavender-400 tracking-wider uppercase">Revisao Semanal</span>
          </div>
          <p className="text-white/90 text-sm leading-relaxed font-sans">{weeklySummary.summary}</p>
          {weeklySummary.wins && weeklySummary.wins.length > 0 && (
            <div className="mt-3">
              <span className="text-[10px] font-semibold text-sage-400 uppercase tracking-wider">Conquistas</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {weeklySummary.wins.map((w: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-sage-500/20 text-sage-400 font-medium">
                    ✓ {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          {weeklySummary.patterns && weeklySummary.patterns.length > 0 && (
            <div className="mt-3">
              <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">Padroes</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {weeklySummary.patterns.map((p: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-sky-500/20 text-sky-400 font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {weeklySummary.suggestion && (
            <p className="text-lavender-400/80 text-xs font-sans mt-3 italic">{weeklySummary.suggestion}</p>
          )}
        </section>
      )}

      {/* No AI */}
      {!dailySummary && !weeklySummary && (
        <section className="bg-sand-50 rounded-2xl p-6 mb-5 border border-sand-200/40 text-center">
          <div className="w-12 h-12 rounded-2xl bg-lavender-50 flex items-center justify-center mx-auto mb-3">
            <Sparkles size={20} className="text-lavender-400" />
          </div>
          <p className="text-charcoal-600 font-sans text-sm font-medium">Resumos da IA</p>
          <p className="text-charcoal-400 font-sans text-xs mt-1">Aparecem conforme voce usa o journal. Ative a IA nas configuracoes.</p>
        </section>
      )}

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
