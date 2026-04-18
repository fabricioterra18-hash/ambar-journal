import { Sparkles } from 'lucide-react'
import { getDailySummary } from '@/lib/actions/insight-actions'

export async function DailySummaryCard() {
  let summary: Awaited<ReturnType<typeof getDailySummary>> = null
  try {
    summary = await getDailySummary()
  } catch {
    return null
  }

  if (!summary) return null

  return (
    <section className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40 mb-5 relative overflow-hidden">
      <div className="absolute -top-4 -right-4 opacity-5">
        <Sparkles size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-coral-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-sans font-semibold text-xs text-coral-500 tracking-wider uppercase">
            Resumo do Dia
          </span>
        </div>
        <p className="text-charcoal-800 text-sm leading-relaxed font-sans">{summary.summary}</p>
        {summary.suggestion && (
          <p className="text-coral-500 text-xs font-sans mt-2 font-medium italic">
            {summary.suggestion}
          </p>
        )}
      </div>
    </section>
  )
}
