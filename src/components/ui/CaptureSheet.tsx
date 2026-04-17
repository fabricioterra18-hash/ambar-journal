'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Send, X, Check, ChevronDown, Calendar, Flag, Folder, Wand2 } from 'lucide-react'
import clsx from 'clsx'
import {
  captureManualBullet,
  classifyWithAI,
  confirmAISuggestions,
} from '@/lib/actions/bullet-actions'
import type { ClassifiedItem } from '@/lib/ai/classify'
import { todayISO } from '@/lib/utils'

interface CaptureSheetProps {
  isOpen: boolean
  onClose: () => void
  collections?: { id: string; name: string }[]
  defaultDate?: string
}

type Mode = 'manual' | 'ai'
type Priority = 0 | 1 | 2 | 3
type CapturableType = 'task' | 'event' | 'note' | 'insight'

const BULLET_TYPES: { value: CapturableType; label: string; emoji: string }[] = [
  { value: 'task', label: 'Tarefa', emoji: '☐' },
  { value: 'event', label: 'Evento', emoji: '◈' },
  { value: 'note', label: 'Nota', emoji: '—' },
  { value: 'insight', label: 'Insight', emoji: '✦' },
]

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 0, label: 'Nenhuma', color: 'text-charcoal-400' },
  { value: 1, label: 'Baixa', color: 'text-sky-500' },
  { value: 2, label: 'Média', color: 'text-honey-500' },
  { value: 3, label: 'Alta', color: 'text-rose-500' },
]

const typeEmojis: Record<string, string> = {
  task: '☐', event: '◈', note: '—', insight: '✦',
}

const typeLabels: Record<string, string> = {
  task: 'Tarefa', event: 'Evento', note: 'Nota', insight: 'Insight',
}

export function CaptureSheet({ isOpen, onClose, collections = [], defaultDate }: CaptureSheetProps) {
  const [mode, setMode] = useState<Mode>('manual')
  const [content, setContent] = useState('')

  // Manual mode state
  const [bulletType, setBulletType] = useState<CapturableType>('task')
  const [date, setDate] = useState(defaultDate || '')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState<Priority>(0)
  const [collectionId, setCollectionId] = useState('')
  const [showOptions, setShowOptions] = useState(false)

  // AI mode state
  const [aiItems, setAiItems] = useState<ClassifiedItem[]>([])
  const [aiQuestions, setAiQuestions] = useState<string[]>([])
  const [aiPhase, setAiPhase] = useState<'input' | 'review'>('input')

  // Shared
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  function reset() {
    setContent('')
    setBulletType('task')
    setDate(defaultDate || '')
    setTime('')
    setPriority(0)
    setCollectionId('')
    setShowOptions(false)
    setAiItems([])
    setAiQuestions([])
    setAiPhase('input')
    setSuccess(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => { reset(); onClose() }, 1800)
  }

  // ── Manual save ──
  function handleManualSave() {
    if (!content.trim()) return
    startTransition(async () => {
      await captureManualBullet({
        text: content.trim(),
        bullet_type: bulletType,
        date: date || null,
        time: time || null,
        priority: priority || null,
        collection_id: collectionId || null,
      })
      showSuccess(`${typeEmojis[bulletType]} ${typeLabels[bulletType]} salva`)
    })
  }

  // ── AI classify ──
  function handleAIClassify() {
    if (!content.trim()) return
    startTransition(async () => {
      try {
        const result = await classifyWithAI(content.trim())
        setAiItems(result.items)
        setAiQuestions(result.needs_clarification ? result.clarifying_questions : [])
        setAiPhase('review')
      } catch {
        // AI failed — stay in input mode
      }
    })
  }

  // ── Confirm AI items ──
  function handleAIConfirm() {
    if (!aiItems.length) return
    startTransition(async () => {
      await confirmAISuggestions(aiItems)
      showSuccess(`${aiItems.length} ite${aiItems.length > 1 ? 'ns' : 'm'} salvo${aiItems.length > 1 ? 's' : ''}`)
    })
  }

  // ── Remove single AI item ──
  function removeAiItem(index: number) {
    setAiItems(prev => prev.filter((_, i) => i !== index))
  }

  // ── Edit AI item type ──
  function editAiItemType(index: number, newType: 'task' | 'event' | 'note' | 'insight') {
    setAiItems(prev => prev.map((item, i) =>
      i === index ? { ...item, bullet_type: newType } : item
    ))
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-charcoal-900/30 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleClose}
      />

      <div className={clsx(
        'fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface z-50 rounded-t-3xl shadow-sheet',
        'transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
        isOpen ? 'translate-y-0' : 'translate-y-full',
      )}>
        <div className="flex flex-col p-5 pb-8 max-h-[85vh] overflow-y-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-sand-300 rounded-full mx-auto mb-4" />

          {/* Success state */}
          {success && (
            <div className="flex flex-col items-center py-8 animate-scale-in">
              <div className="w-12 h-12 rounded-2xl bg-sage-500 flex items-center justify-center mb-3">
                <Check size={24} className="text-white" />
              </div>
              <p className="text-sm font-sans font-medium text-charcoal-900">{success}</p>
            </div>
          )}

          {!success && (
            <>
              {/* Header with mode toggle */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-xl text-charcoal-900">Novo Registro</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setMode('manual'); setAiPhase('input'); setAiItems([]); setAiQuestions([]) }}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                      mode === 'manual' ? 'bg-coral-500 text-white' : 'bg-sand-100 text-charcoal-500',
                    )}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setMode('ai')}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1',
                      mode === 'ai' ? 'bg-coral-500 text-white' : 'bg-sand-100 text-charcoal-500',
                    )}
                  >
                    <Sparkles size={10} /> IA
                  </button>
                  <button onClick={handleClose} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 ml-1">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* ═══ MANUAL MODE ═══ */}
              {mode === 'manual' && (
                <>
                  {/* Type selector */}
                  <div className="flex gap-2 mb-4">
                    {BULLET_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setBulletType(t.value)}
                        className={clsx(
                          'flex-1 py-2 px-1 rounded-xl text-xs font-semibold transition-colors text-center',
                          bulletType === t.value
                            ? 'bg-coral-500 text-white'
                            : 'bg-sand-50 text-charcoal-500 border border-sand-200',
                        )}
                      >
                        <span className="block text-sm mb-0.5">{t.emoji}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Text input */}
                  <textarea
                    autoFocus
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva aqui..."
                    className="w-full bg-sand-50 text-charcoal-900 text-[15px] placeholder:text-charcoal-400 resize-none outline-none min-h-[80px] font-sans rounded-xl p-3.5 border border-sand-200 focus:border-coral-300 transition-colors mb-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleManualSave()
                    }}
                  />

                  {/* Options toggle */}
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center gap-1.5 text-xs font-medium text-charcoal-400 mb-3 self-start"
                  >
                    <ChevronDown size={12} className={clsx('transition-transform', showOptions && 'rotate-180')} />
                    {showOptions ? 'Menos opções' : 'Mais opções'}
                  </button>

                  {showOptions && (
                    <div className="flex flex-col gap-3 mb-4 animate-slide-up">
                      {/* Date & Time */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-semibold text-charcoal-500 uppercase tracking-wider mb-1 block">
                            <Calendar size={10} className="inline mr-1" />Data
                          </label>
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={todayISO()}
                            className="w-full bg-sand-50 border border-sand-200 rounded-lg px-3 py-2 text-sm text-charcoal-900 outline-none focus:border-coral-300 font-sans"
                          />
                        </div>
                        {(bulletType === 'event' || time) && (
                          <div className="w-28">
                            <label className="text-[10px] font-semibold text-charcoal-500 uppercase tracking-wider mb-1 block">
                              Horário
                            </label>
                            <input
                              type="time"
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              className="w-full bg-sand-50 border border-sand-200 rounded-lg px-3 py-2 text-sm text-charcoal-900 outline-none focus:border-coral-300 font-sans"
                            />
                          </div>
                        )}
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="text-[10px] font-semibold text-charcoal-500 uppercase tracking-wider mb-1.5 block">
                          <Flag size={10} className="inline mr-1" />Prioridade
                        </label>
                        <div className="flex gap-1.5">
                          {PRIORITIES.map(p => (
                            <button
                              key={p.value}
                              onClick={() => setPriority(p.value)}
                              className={clsx(
                                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                priority === p.value
                                  ? 'bg-charcoal-900 text-white'
                                  : 'bg-sand-50 border border-sand-200 text-charcoal-500',
                              )}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Collection */}
                      {collections.length > 0 && (
                        <div>
                          <label className="text-[10px] font-semibold text-charcoal-500 uppercase tracking-wider mb-1 block">
                            <Folder size={10} className="inline mr-1" />Coleção
                          </label>
                          <select
                            value={collectionId}
                            onChange={(e) => setCollectionId(e.target.value)}
                            className="w-full bg-sand-50 border border-sand-200 rounded-lg px-3 py-2 text-sm text-charcoal-900 outline-none focus:border-coral-300 font-sans"
                          >
                            <option value="">Nenhuma</option>
                            {collections.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => { setMode('ai') }}
                      className="flex items-center gap-1.5 text-xs font-medium text-coral-500"
                    >
                      <Wand2 size={12} /> Organizar com IA
                    </button>
                    <button
                      onClick={handleManualSave}
                      disabled={!content.trim() || isPending}
                      className="px-6 py-2.5 gradient-coral text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform shadow-md"
                    >
                      {isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Salvar'
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* ═══ AI MODE ═══ */}
              {mode === 'ai' && aiPhase === 'input' && (
                <>
                  <textarea
                    autoFocus
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva livremente... a IA vai organizar para você"
                    className="w-full bg-sand-50 text-charcoal-900 text-[15px] placeholder:text-charcoal-400 resize-none outline-none min-h-[100px] font-sans rounded-xl p-3.5 border border-sand-200 focus:border-coral-300 transition-colors mb-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAIClassify()
                    }}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setMode('manual')}
                      className="text-xs font-medium text-charcoal-400"
                    >
                      Salvar manual
                    </button>
                    <button
                      onClick={handleAIClassify}
                      disabled={!content.trim() || isPending}
                      className="flex items-center gap-2 px-5 py-2.5 gradient-coral text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform shadow-md"
                    >
                      {isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={14} /> Organizar com IA
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* ═══ AI REVIEW ═══ */}
              {mode === 'ai' && aiPhase === 'review' && (
                <>
                  <p className="text-xs text-charcoal-500 font-medium mb-3">
                    A IA identificou {aiItems.length} ite{aiItems.length > 1 ? 'ns' : 'm'}:
                  </p>

                  {/* Item list */}
                  <div className="flex flex-col gap-2 mb-4">
                    {aiItems.map((item, i) => (
                      <div key={i} className="bg-sand-50 rounded-xl p-3 border border-sand-200 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Type pill — tappable to change */}
                              <select
                                value={item.bullet_type}
                                onChange={(e) => editAiItemType(i, e.target.value as 'task' | 'event' | 'note' | 'insight')}
                                className="text-[10px] font-bold uppercase bg-coral-50 text-coral-600 px-2 py-0.5 rounded-md border-none outline-none cursor-pointer"
                              >
                                {BULLET_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                                ))}
                              </select>

                              {item.suggested_date && (
                                <span className="text-[10px] text-charcoal-400 font-medium">
                                  📅 {item.suggested_date}
                                </span>
                              )}
                              {item.suggested_time && (
                                <span className="text-[10px] text-charcoal-400 font-medium">
                                  🕐 {item.suggested_time}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-charcoal-900 font-sans">{item.clean_text}</p>
                          </div>
                          <button
                            onClick={() => removeAiItem(i)}
                            className="text-charcoal-300 hover:text-rose-400 p-1 transition-colors flex-shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Clarifying questions */}
                  {aiQuestions.length > 0 && (
                    <div className="bg-lavender-50 border border-lavender-100 rounded-xl p-3 mb-4">
                      <p className="text-xs font-semibold text-lavender-500 mb-2 flex items-center gap-1">
                        <Sparkles size={10} /> A IA pergunta:
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {aiQuestions.map((q, i) => (
                          <li key={i} className="text-xs text-charcoal-600 font-sans">• {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => { setAiPhase('input'); setAiItems([]); setAiQuestions([]) }}
                      className="text-xs font-medium text-charcoal-400"
                    >
                      Voltar
                    </button>
                    <div className="flex gap-2">
                      {aiItems.length > 0 && (
                        <button
                          onClick={handleAIConfirm}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-5 py-2.5 gradient-coral text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform shadow-md"
                        >
                          {isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check size={14} /> Confirmar {aiItems.length > 1 ? `(${aiItems.length})` : ''}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
