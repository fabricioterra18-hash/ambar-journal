import { Sparkles } from 'lucide-react'
import { getWeeklySummary } from '@/lib/actions/insight-actions'

export async function WeeklyInsight() {
  let weeklySummary: Awaited<ReturnType<typeof getWeeklySummary>> = null
  try {
    weeklySummary = await getWeeklySummary()
  } catch {
    return null
  }

  if (!weeklySummary) return null

  return (
    <section className="bg-charcoal-900 rounded-2xl p-5 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-lavender-500/20 flex items-center justify-center">
          <Sparkles size={14} className="text-lavender-400" />
        </div>
        <span className="text-xs text-lavender-400 font-semibold uppercase tracking-wider">
          Reflexao Semanal
        </span>
      </div>
      <p className="text-white/90 text-sm leading-relaxed font-sans">{weeklySummary.summary}</p>
      {weeklySummary.wins && weeklySummary.wins.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {weeklySummary.wins.slice(0, 3).map((w: string, i: number) => (
            <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-sage-500/20 text-sage-400 font-medium">
              ✓ {w}
            </span>
          ))}
        </div>
      )}
      {weeklySummary.suggestion && (
        <p className="text-lavender-400/80 text-xs font-sans mt-3 italic">{weeklySummary.suggestion}</p>
      )}
    </section>
  )
}
