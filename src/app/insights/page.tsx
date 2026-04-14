import { Sparkles, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import { getWorkspace } from '@/lib/services/workspace'
import { getCollections } from '@/lib/services/collections'
import { getItemsForWorkspace } from '@/lib/services/items'
import { getDailySummary, getWeeklySummary } from '@/lib/actions/insight-actions'
import { BulletItem } from '@/components/ui/BulletItem'
import { SearchBar } from './search-bar'

export default async function InsightsPage() {
  const workspace = await getWorkspace()
  const collections = await getCollections(workspace.id)

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

  // AI Summaries (non-blocking)
  let dailySummary: Awaited<ReturnType<typeof getDailySummary>> = null
  let weeklySummary: Awaited<ReturnType<typeof getWeeklySummary>> = null
  try { dailySummary = await getDailySummary() } catch {}
  try { weeklySummary = await getWeeklySummary() } catch {}

  return (
    <main className="flex-1 flex flex-col p-6 pb-32">
      <header className="pt-8 pb-6 mb-2">
        <p className="text-ink-600 font-sans font-medium text-xs tracking-wide uppercase mb-1">
          Revisao & Reflexao
        </p>
        <h1 className="text-3xl font-heading text-ink-900 tracking-tight">
          Insights
        </h1>
      </header>

      <SearchBar workspaceId={workspace.id} />

      {/* AI Daily Summary */}
      {dailySummary && (
        <section className="bg-sunlight-50 rounded-2xl p-5 mb-5 shadow-sm border border-sunlight-200/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={48} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <Calendar size={14} />
              <span className="font-sans font-semibold text-xs tracking-wider uppercase">Resumo do Dia</span>
            </div>
            <p className="text-ink-900 text-sm leading-relaxed font-sans">{dailySummary.summary}</p>
            {dailySummary.suggestion && (
              <p className="text-amber-700 text-xs font-sans mt-2 italic">
                <Sparkles size={10} className="inline mr-1" />
                {dailySummary.suggestion}
              </p>
            )}
          </div>
        </section>
      )}

      {/* AI Weekly Summary */}
      {weeklySummary && (
        <section className="bg-sunlight-50 rounded-2xl p-5 mb-5 shadow-sm border border-sunlight-200/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={48} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <TrendingUp size={14} />
              <span className="font-sans font-semibold text-xs tracking-wider uppercase">Revisao Semanal</span>
            </div>
            <p className="text-ink-900 text-sm leading-relaxed font-sans">{weeklySummary.summary}</p>
            {weeklySummary.wins && weeklySummary.wins.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-sans font-medium text-olive-600 uppercase tracking-wider">Conquistas</span>
                <ul className="mt-1 space-y-1">
                  {weeklySummary.wins.map((w: string, i: number) => (
                    <li key={i} className="text-sm font-sans text-ink-900 flex items-start gap-2">
                      <span className="text-olive-600 mt-0.5">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weeklySummary.patterns && weeklySummary.patterns.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-sans font-medium text-ink-600 uppercase tracking-wider">Padroes observados</span>
                <ul className="mt-1 space-y-1">
                  {weeklySummary.patterns.map((p: string, i: number) => (
                    <li key={i} className="text-sm font-sans text-ink-900 flex items-start gap-2">
                      <span className="text-amber-700 mt-0.5">•</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weeklySummary.suggestion && (
              <p className="text-amber-700 text-xs font-sans mt-3 italic">
                <Sparkles size={10} className="inline mr-1" />
                {weeklySummary.suggestion}
              </p>
            )}
          </div>
        </section>
      )}

      {/* No AI summaries available */}
      {!dailySummary && !weeklySummary && (
        <section className="bg-sunlight-50/50 rounded-2xl p-5 mb-5 border border-sunlight-200/10 text-center">
          <Sparkles size={24} className="text-amber-700/30 mx-auto mb-2" />
          <p className="text-ink-600 font-sans text-sm">
            Resumos da IA aparecerao aqui conforme voce usar o journal.
          </p>
          <p className="text-ink-600/60 font-sans text-xs mt-1">
            Ative a IA reflexiva nas configuracoes para obter resumos.
          </p>
        </section>
      )}

      {/* Migrated items attention */}
      {migratedItems.length > 0 && (
        <section className="bg-clay-600/5 rounded-2xl p-5 mb-5 border border-clay-600/20">
          <div className="flex items-center gap-2 mb-3 text-clay-600">
            <AlertTriangle size={16} />
            <span className="font-sans font-semibold text-xs tracking-wider uppercase">Atencao</span>
          </div>
          <p className="text-ink-900 text-sm leading-relaxed font-sans mb-3">
            Voce tem <strong>{migratedItems.length} ite{migratedItems.length !== 1 ? 'ns' : 'm'}</strong> migrado{migratedItems.length !== 1 ? 's' : ''}. Considere reavalia-los.
          </p>
          <div className="flex flex-col gap-1">
            {migratedItems.map((item) => (
              <BulletItem key={item.id} item={item} collections={collections} />
            ))}
          </div>
        </section>
      )}

      {/* Recent insights */}
      {insights.length > 0 ? (
        <section>
          <h3 className="font-heading text-xl text-ink-900 mb-4 px-2">Descobertas Recentes</h3>
          <div className="bg-surface-lowest rounded-2xl shadow-sm border border-fog-100/50 overflow-hidden py-1">
            {insights.map((item) => (
              <BulletItem key={item.id} item={item} collections={collections} />
            ))}
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-ink-600 font-sans text-sm mb-1">Nenhum insight registrado ainda.</p>
          <p className="text-ink-600/60 font-sans text-xs">Insights aparecem conforme voce usa o journal.</p>
        </section>
      )}
    </main>
  )
}
