'use client'

import { useEffect, useState, useTransition } from 'react'
import { Sparkles, Check, X, ListChecks, Zap, Split, Edit3, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import {
  analyzeExistingItem,
  applyReclassify,
  applySplit,
} from '@/lib/actions/ai-actions'
import {
  generateMicrotasksForItem,
  getNextStepAction,
} from '@/lib/actions/microtask-actions'
import type { AnalyzeSuggestion } from '@/lib/ai/analyze'

interface Props {
  itemId: string
  currentText: string
  onApplied?: () => void
  onClose: () => void
}

export function AIAnalyzePanel({ itemId, currentText, onApplied, onClose }: Props) {
  const [suggestion, setSuggestion] = useState<AnalyzeSuggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, startBusy] = useTransition()
  const [nextStep, setNextStep] = useState<{ step: string; why: string } | null>(null)
  const [applied, setApplied] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    analyzeExistingItem(itemId)
      .then(s => { if (!cancelled) setSuggestion(s) })
      .catch(() => { if (!cancelled) setError('Falha ao analisar. Tente de novo.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [itemId])

  function markApplied(key: string) {
    setApplied(a => ({ ...a, [key]: true }))
    if (onApplied) onApplied()
  }

  function handleReclassify() {
    if (!suggestion?.reclassify) return
    startBusy(async () => {
      await applyReclassify(itemId, suggestion.reclassify!)
      markApplied('reclassify')
    })
  }

  function handleSplit() {
    if (!suggestion?.split_into?.length) return
    startBusy(async () => {
      await applySplit(itemId, suggestion.split_into!)
      markApplied('split')
      onClose()
    })
  }

  function handleMicrotasks() {
    startBusy(async () => {
      try { await generateMicrotasksForItem(itemId) } catch {}
      markApplied('microtasks')
    })
  }

  function handleNextStep() {
    startBusy(async () => {
      try {
        const ns = await getNextStepAction(itemId)
        setNextStep(ns)
      } catch {}
    })
  }

  return (
    <div className="bg-lavender-50/60 border border-lavender-200 rounded-2xl p-4 my-2 animate-scale-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-lavender-500 flex items-center justify-center">
          <Sparkles size={12} className="text-white" />
        </div>
        <span className="text-xs font-sans font-semibold text-lavender-600 tracking-wider uppercase">
          Análise da IA
        </span>
        <button onClick={onClose} className="ml-auto text-charcoal-400 hover:text-charcoal-600 p-1">
          <X size={14} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-charcoal-500 py-2">
          <Loader2 size={14} className="animate-spin" />
          Lendo o item…
        </div>
      )}

      {error && !loading && (
        <p className="text-xs text-rose-500 py-1">{error}</p>
      )}

      {suggestion && !loading && (
        <div className="flex flex-col gap-3">
          {/* Summary */}
          <p className="text-sm font-sans text-charcoal-800 leading-snug">
            {suggestion.summary}
          </p>

          {/* Clarifying questions */}
          {suggestion.needs_clarification && suggestion.clarifying_questions.length > 0 && (
            <div className="bg-surface rounded-xl p-3 border border-sand-200">
              <p className="text-[10px] font-sans font-semibold text-charcoal-400 uppercase tracking-wider mb-1.5">
                Pode esclarecer?
              </p>
              <ul className="space-y-1">
                {suggestion.clarifying_questions.slice(0, 3).map((q, i) => (
                  <li key={i} className="text-xs text-charcoal-700 font-sans">• {q}</li>
                ))}
              </ul>
              <p className="text-[10px] text-charcoal-400 mt-1.5 italic">
                (edite o item para responder, depois rode a análise de novo)
              </p>
            </div>
          )}

          {/* Reclassify suggestion */}
          {suggestion.reclassify && !applied.reclassify && (
            <SuggestionRow
              icon={<Edit3 size={12} />}
              label="Ajustar este item"
              detail={summarizeReclassify(suggestion.reclassify, currentText)}
              onApply={handleReclassify}
              disabled={busy}
            />
          )}

          {/* Split suggestion */}
          {suggestion.split_into && suggestion.split_into.length > 1 && !applied.split && (
            <div className="bg-surface rounded-xl p-3 border border-sand-200">
              <div className="flex items-center gap-1.5 mb-2">
                <Split size={12} className="text-coral-500" />
                <p className="text-xs font-sans font-semibold text-charcoal-700">
                  Dividir em {suggestion.split_into.length} itens
                </p>
              </div>
              <ul className="space-y-1 mb-2">
                {suggestion.split_into.map((p, i) => (
                  <li key={i} className="text-xs text-charcoal-600 font-sans flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sand-100 text-charcoal-500">
                      {typeLabel(p.bullet_type)}
                    </span>
                    <span className="truncate">{p.clean_text}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSplit}
                disabled={busy}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-coral-500 text-white font-semibold hover:bg-coral-600 disabled:opacity-40 transition-colors"
              >
                Aplicar divisão
              </button>
            </div>
          )}

          {/* Microtasks */}
          {suggestion.should_generate_microtasks && !applied.microtasks && (
            <SuggestionRow
              icon={<ListChecks size={12} />}
              label="Quebrar em passos"
              detail={suggestion.suggested_plan ?? 'Crie microtarefas para começar com menos fricção.'}
              onApply={handleMicrotasks}
              disabled={busy}
            />
          )}

          {/* Next step hint */}
          {suggestion.next_step_hint && !nextStep && (
            <SuggestionRow
              icon={<Zap size={12} />}
              label="Próximo passo"
              detail={suggestion.next_step_hint}
              onApply={handleNextStep}
              applyLabel="Analisar agora"
              disabled={busy}
            />
          )}
          {nextStep && (
            <div className="bg-honey-50 border border-honey-200 rounded-xl p-3">
              <p className="text-xs font-sans font-semibold text-charcoal-900">{nextStep.step}</p>
              <p className="text-[10px] font-sans text-charcoal-500 mt-0.5">{nextStep.why}</p>
            </div>
          )}

          {/* Nada a sugerir */}
          {!suggestion.reclassify
            && !suggestion.split_into?.length
            && !suggestion.should_generate_microtasks
            && !suggestion.next_step_hint
            && !suggestion.needs_clarification && (
            <p className="text-xs text-charcoal-500 italic">Este item já está claro — nada a ajustar.</p>
          )}

          {/* Rodapé pequeno */}
          <p className="text-[10px] text-charcoal-400 font-sans italic pt-1">
            As sugestões não alteram nada até você aceitar.
          </p>
        </div>
      )}
    </div>
  )
}

function SuggestionRow({
  icon, label, detail, onApply, applyLabel = 'Aplicar', disabled,
}: {
  icon: React.ReactNode; label: string; detail: string; onApply: () => void; applyLabel?: string; disabled?: boolean
}) {
  return (
    <div className="bg-surface rounded-xl p-3 border border-sand-200 flex items-start gap-2.5">
      <div className="w-5 h-5 rounded-md bg-lavender-100 text-lavender-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-sans font-semibold text-charcoal-800">{label}</p>
        <p className="text-[11px] font-sans text-charcoal-500 leading-snug mt-0.5">{detail}</p>
      </div>
      <button
        onClick={onApply}
        disabled={disabled}
        className={clsx(
          'text-[11px] px-2.5 py-1 rounded-lg font-semibold flex-shrink-0',
          'bg-coral-500 text-white hover:bg-coral-600 disabled:opacity-40 transition-colors',
        )}
      >
        <Check size={10} className="inline -mt-0.5 mr-1" />
        {applyLabel}
      </button>
    </div>
  )
}

function typeLabel(t: string): string {
  const map: Record<string, string> = { task: 'Tarefa', event: 'Evento', note: 'Nota', insight: 'Insight' }
  return map[t] ?? t
}

function summarizeReclassify(r: NonNullable<AnalyzeSuggestion['reclassify']>, current: string): string {
  const parts: string[] = []
  if (r.clean_text && r.clean_text.trim() !== current.trim()) parts.push(`texto → "${truncate(r.clean_text, 50)}"`)
  parts.push(`tipo → ${typeLabel(r.bullet_type)}`)
  if (r.suggested_date) parts.push(`data → ${r.suggested_date}`)
  if (r.suggested_time) parts.push(`hora → ${r.suggested_time}`)
  if (r.suggested_collection) parts.push(`coleção → ${r.suggested_collection}`)
  if (r.priority !== null && r.priority !== undefined) parts.push(`prioridade → ${r.priority}`)
  return parts.join(' · ')
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}
