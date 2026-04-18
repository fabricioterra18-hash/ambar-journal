'use client'

import { useState, useTransition } from 'react'
import { Send, Sparkles, Check, X, ArrowLeft, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { captureManualBullet } from '@/lib/actions/bullet-actions'
import { classifyText, saveClassifiedItems } from '@/lib/actions/ai-actions'
import type { ClassificationResult, ClassifiedItem } from '@/lib/ai/classify'
import type { BulletType } from '@/types/database'

const typeLabels: Record<string, string> = {
  task: 'Tarefa',
  event: 'Evento',
  note: 'Nota',
  insight: 'Insight',
}

const typeEmojis: Record<string, string> = {
  task: '✅',
  event: '📅',
  note: '📝',
  insight: '💡',
}

interface JournalComposerProps {
  // null = hoje (usa IA), string = data específica (captura manual)
  date?: string | null
  onCreated?: () => void
  compact?: boolean
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'classifying' }
  | { kind: 'clarify'; original: string; result: ClassificationResult; answers: Record<number, string> }
  | { kind: 'review'; original: string; items: (ClassifiedItem & { _enabled: boolean })[] }
  | { kind: 'saving' }

export function JournalComposer({ date, onCreated }: JournalComposerProps) {
  const [text, setText] = useState('')
  const [bulletType, setBulletType] = useState<BulletType>('task')
  const [time, setTime] = useState('')
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const isDateSpecific = !!date
  const showTime = isDateSpecific && bulletType === 'event'

  function resetAll() {
    setText('')
    setTime('')
    setStage({ kind: 'idle' })
  }

  function handleSubmit() {
    if (!text.trim()) return

    if (isDateSpecific) {
      // captura manual direta, sem IA
      setStage({ kind: 'saving' })
      startTransition(async () => {
        try {
          await captureManualBullet({
            text: text.trim(),
            bullet_type: bulletType,
            date,
            time: showTime && time ? time : null,
          })
          resetAll()
          if (onCreated) onCreated()
        } catch {
          setStage({ kind: 'idle' })
        }
      })
      return
    }

    // Fluxo com IA: classify → clarify (se preciso) → review → save
    setStage({ kind: 'classifying' })
    startTransition(async () => {
      try {
        const result = await classifyText(text.trim())
        if (result.needs_clarification && result.clarifying_questions.length > 0) {
          setStage({ kind: 'clarify', original: text.trim(), result, answers: {} })
        } else {
          goToReview(text.trim(), result.items)
        }
      } catch {
        // IA falhou — salva como nota simples
        setFeedback('IA indisponível. Salvando como nota.')
        setTimeout(() => setFeedback(null), 2500)
        try {
          await saveClassifiedItems([{
            bullet_type: 'note',
            clean_text: text.trim(),
            suggested_date: null,
            suggested_time: null,
            priority: null,
            suggested_collection: null,
            should_break_into_microtasks: false,
            rationale: null,
          }])
        } catch {}
        resetAll()
      }
    })
  }

  function goToReview(original: string, items: ClassifiedItem[]) {
    if (!items.length) {
      setStage({ kind: 'idle' })
      setFeedback('Não entendi. Tente reescrever.')
      setTimeout(() => setFeedback(null), 2500)
      return
    }
    setStage({
      kind: 'review',
      original,
      items: items.map(it => ({ ...it, _enabled: true })),
    })
  }

  function handleSubmitClarifications() {
    if (stage.kind !== 'clarify') return
    const qa = stage.result.clarifying_questions
      .map((q, i) => ({ question: q, answer: (stage.answers[i] ?? '').trim() }))
      .filter(a => a.answer.length > 0)

    if (qa.length === 0) {
      // Usuário pulou — vai direto para review com a classificação original
      goToReview(stage.original, stage.result.items)
      return
    }

    setStage({ kind: 'classifying' })
    startTransition(async () => {
      try {
        const result = await classifyText(stage.original, qa)
        goToReview(stage.original, result.items)
      } catch {
        goToReview(stage.original, stage.result.items)
      }
    })
  }

  function handleSaveReview() {
    if (stage.kind !== 'review') return
    const toSave = stage.items.filter(it => it._enabled).map(({ _enabled, ...rest }) => rest)
    if (!toSave.length) { resetAll(); return }
    setStage({ kind: 'saving' })
    startTransition(async () => {
      try {
        const n = await saveClassifiedItems(toSave)
        setFeedback(n === 1 ? '1 item salvo' : `${n} itens salvos`)
        setTimeout(() => setFeedback(null), 2000)
        resetAll()
        if (onCreated) onCreated()
      } catch {
        setStage({ kind: 'idle' })
      }
    })
  }

  const busy = stage.kind === 'classifying' || stage.kind === 'saving'

  return (
    <div className="bg-surface rounded-2xl p-4 card-shadow border border-sand-200/40">
      {feedback && (
        <div className="bg-sage-50 border border-sage-100 rounded-xl p-2.5 mb-3 flex items-center gap-2 animate-scale-in">
          <Check size={12} className="text-sage-600" />
          <p className="text-xs font-sans text-charcoal-800">{feedback}</p>
        </div>
      )}

      {/* Estado: idle — campo normal de captura */}
      {(stage.kind === 'idle' || stage.kind === 'classifying' || stage.kind === 'saving') && (
        <>
          {isDateSpecific && (
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {(['task', 'event', 'note'] as BulletType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setBulletType(t)}
                  className={clsx(
                    'text-xs px-2.5 py-1 rounded-lg font-medium transition-colors',
                    bulletType === t
                      ? 'bg-coral-500 text-white'
                      : 'bg-sand-100 text-charcoal-600 hover:bg-sand-200',
                  )}
                >
                  {typeEmojis[t]} {typeLabels[t]}
                </button>
              ))}
              {showTime && (
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg border border-sand-200 bg-surface text-charcoal-700 ml-1"
                  aria-label="Hora do evento"
                />
              )}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Registre algo..."
                className="w-full bg-transparent text-charcoal-900 text-[15px] placeholder:text-charcoal-400 resize-none outline-none font-sans"
                rows={2}
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
              />
              {!isDateSpecific && (
                <div className="flex items-center gap-1.5 text-coral-400">
                  <Sparkles size={11} />
                  <span className="text-[10px] font-medium">
                    {stage.kind === 'classifying' ? 'Analisando…' : 'IA organiza e pergunta se precisar'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || busy}
              className="w-10 h-10 gradient-coral text-white flex items-center justify-center rounded-xl disabled:opacity-30 active:scale-95 transition-transform flex-shrink-0 shadow-md"
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </>
      )}

      {/* Estado: clarify — perguntas curtas */}
      {stage.kind === 'clarify' && (
        <ClarifyPanel
          stage={stage}
          onAnswer={(i, v) => setStage({ ...stage, answers: { ...stage.answers, [i]: v } })}
          onCancel={resetAll}
          onSubmit={handleSubmitClarifications}
        />
      )}

      {/* Estado: review — lista editável */}
      {stage.kind === 'review' && (
        <ReviewPanel
          items={stage.items}
          onToggle={(i, enabled) => {
            const next = [...stage.items]
            next[i] = { ...next[i], _enabled: enabled }
            setStage({ ...stage, items: next })
          }}
          onEdit={(i, patch) => {
            const next = [...stage.items]
            next[i] = { ...next[i], ...patch }
            setStage({ ...stage, items: next })
          }}
          onCancel={resetAll}
          onSave={handleSaveReview}
        />
      )}
    </div>
  )
}

// ── Subcomponentes ──

function ClarifyPanel({
  stage, onAnswer, onCancel, onSubmit,
}: {
  stage: Extract<Stage, { kind: 'clarify' }>
  onAnswer: (i: number, v: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="animate-scale-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-lavender-500 flex items-center justify-center">
          <Sparkles size={12} className="text-white" />
        </div>
        <span className="text-xs font-sans font-semibold text-lavender-600 tracking-wider uppercase">
          Pode esclarecer?
        </span>
        <button onClick={onCancel} className="ml-auto text-charcoal-400 hover:text-charcoal-600 p-1" aria-label="Cancelar">
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-charcoal-500 font-sans italic mb-3">
        &ldquo;{stage.original}&rdquo;
      </p>
      <div className="flex flex-col gap-2 mb-3">
        {stage.result.clarifying_questions.slice(0, 3).map((q, i) => (
          <div key={i}>
            <label className="text-xs font-sans font-medium text-charcoal-700">{q}</label>
            <input
              type="text"
              value={stage.answers[i] ?? ''}
              onChange={(e) => onAnswer(i, e.target.value)}
              placeholder="(opcional — pode pular)"
              className="mt-1 w-full text-sm font-sans px-3 py-2 rounded-xl border border-sand-200 focus:border-coral-400 outline-none bg-surface"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSubmit}
          className="flex-1 gradient-coral text-white text-sm font-semibold py-2.5 rounded-xl active:scale-98 transition-transform"
        >
          Continuar
        </button>
        <button
          onClick={onSubmit}
          className="text-xs text-charcoal-500 font-medium px-3 py-2.5 hover:text-charcoal-700 transition-colors"
        >
          Pular
        </button>
      </div>
    </div>
  )
}

function ReviewPanel({
  items, onToggle, onEdit, onCancel, onSave,
}: {
  items: (ClassifiedItem & { _enabled: boolean })[]
  onToggle: (i: number, enabled: boolean) => void
  onEdit: (i: number, patch: Partial<ClassifiedItem>) => void
  onCancel: () => void
  onSave: () => void
}) {
  const enabledCount = items.filter(i => i._enabled).length
  return (
    <div className="animate-scale-in">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onCancel}
          className="text-charcoal-400 hover:text-charcoal-600 p-1"
          aria-label="Voltar"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="w-6 h-6 rounded-lg bg-lavender-500 flex items-center justify-center">
          <Sparkles size={12} className="text-white" />
        </div>
        <span className="text-xs font-sans font-semibold text-lavender-600 tracking-wider uppercase">
          Revisar {items.length === 1 ? 'sugestão' : `${items.length} sugestões`}
        </span>
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {items.map((it, i) => (
          <div
            key={i}
            className={clsx(
              'rounded-xl border p-3 transition-all',
              it._enabled ? 'bg-surface border-sand-200' : 'bg-sand-50 border-sand-100 opacity-60',
            )}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={it._enabled}
                onChange={(e) => onToggle(i, e.target.checked)}
                className="mt-1 accent-coral-500"
                aria-label="Incluir este item"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <select
                    value={it.bullet_type}
                    onChange={(e) => onEdit(i, { bullet_type: e.target.value as ClassifiedItem['bullet_type'] })}
                    className="text-[10px] font-semibold bg-sand-100 text-charcoal-700 px-1.5 py-0.5 rounded"
                  >
                    {(['task', 'event', 'note', 'insight'] as const).map(t => (
                      <option key={t} value={t}>{typeEmojis[t]} {typeLabels[t]}</option>
                    ))}
                  </select>
                  {it.suggested_date && (
                    <input
                      type="date"
                      value={it.suggested_date}
                      onChange={(e) => onEdit(i, { suggested_date: e.target.value })}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-sand-200 bg-surface text-charcoal-700"
                    />
                  )}
                  {it.suggested_time && (
                    <input
                      type="time"
                      value={it.suggested_time}
                      onChange={(e) => onEdit(i, { suggested_time: e.target.value })}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-sand-200 bg-surface text-charcoal-700"
                    />
                  )}
                  {it.suggested_collection && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 font-medium">
                      {it.suggested_collection}
                    </span>
                  )}
                  {it.should_break_into_microtasks && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-lavender-50 text-lavender-600 font-medium">
                      + passos
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={it.clean_text}
                  onChange={(e) => onEdit(i, { clean_text: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none text-charcoal-900 border-b border-transparent focus:border-sand-300 py-0.5"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={enabledCount === 0}
          className="flex-1 gradient-coral text-white text-sm font-semibold py-2.5 rounded-xl active:scale-98 transition-transform disabled:opacity-30"
        >
          Salvar {enabledCount === items.length ? 'tudo' : `${enabledCount} de ${items.length}`}
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-charcoal-500 font-medium px-3 py-2.5 hover:text-charcoal-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
