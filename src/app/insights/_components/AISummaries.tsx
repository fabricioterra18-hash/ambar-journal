import { Sparkles, TrendingUp } from 'lucide-react'
import { getDailySummary, getWeeklySummary } from '@/lib/actions/insight-actions'

export async function AISummaries() {
  const [dailySummary, weeklySummary] = await Promise.all([
    getDailySummary().catch(() => null),
    getWeeklySummary().catch(() => null),
  ])

  if (!dailySummary && !weeklySummary) {
    return (
      <section className="bg-sand-50 rounded-2xl p-6 mb-5 border border-sand-200/40 text-center">
        <div className="w-12 h-12 rounded-2xl bg-lavender-50 flex items-center justify-center mx-auto mb-3">
          <Sparkles size={20} className="text-lavender-400" />
        </div>
        <p className="text-charcoal-600 font-sans text-sm font-medium">Resumos da IA</p>
        <p className="text-charcoal-400 font-sans text-xs mt-1">
          Aparecem conforme voce usa o journal. Ative a IA nas configuracoes.
        </p>
      </section>
    )
  }

  return (
    <>
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
    </>
  )
}

export function AISummariesFallback() {
  return (
    <section className="bg-sand-50 rounded-2xl p-6 mb-5 border border-sand-200/40 flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-sand-200" />
      <div className="flex-1">
        <div className="h-3 bg-sand-200 rounded w-1/3 mb-2" />
        <div className="h-2 bg-sand-200 rounded w-full" />
      </div>
    </section>
  )
}
