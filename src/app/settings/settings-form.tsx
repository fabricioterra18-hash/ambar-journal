'use client'

import { useTransition } from 'react'
import { toggleAI, toggleOperationalAI, toggleReflectiveAI, toggleReduceMotion } from '@/lib/actions/preference-actions'
import type { UserPreferences } from '@/types/database'
import { Sparkles, Brain, Eye, Accessibility } from 'lucide-react'

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors ${checked ? 'bg-coral-500' : 'bg-sand-300'} ${disabled ? 'opacity-40' : ''}`}
    >
      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

export function SettingsForm({ preferences }: { preferences: UserPreferences }) {
  const [isPending, startTransition] = useTransition()

  function toggle(action: (v: boolean) => Promise<void>, value: boolean) {
    startTransition(() => action(value))
  }

  return (
    <>
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles size={14} className="text-coral-500" />
          <h3 className="font-sans font-semibold text-sm text-charcoal-700">Inteligencia Artificial</h3>
        </div>
        <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 divide-y divide-sand-100">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-sans text-sm text-charcoal-900 font-medium">IA Geral</p>
              <p className="font-sans text-xs text-charcoal-400 mt-0.5">Habilitar todas as funcionalidades</p>
            </div>
            <Toggle checked={preferences.ai_enabled} onChange={(v) => toggle(toggleAI, v)} disabled={isPending} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-coral-50 flex items-center justify-center">
                <Brain size={14} className="text-coral-500" />
              </div>
              <div>
                <p className="font-sans text-sm text-charcoal-900 font-medium">Operacional</p>
                <p className="font-sans text-xs text-charcoal-400 mt-0.5">Classificacao, microtarefas</p>
              </div>
            </div>
            <Toggle checked={preferences.ai_operational_enabled} onChange={(v) => toggle(toggleOperationalAI, v)} disabled={isPending || !preferences.ai_enabled} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-lavender-50 flex items-center justify-center">
                <Eye size={14} className="text-lavender-500" />
              </div>
              <div>
                <p className="font-sans text-sm text-charcoal-900 font-medium">Reflexiva</p>
                <p className="font-sans text-xs text-charcoal-400 mt-0.5">Resumos e padroes</p>
              </div>
            </div>
            <Toggle checked={preferences.ai_reflective_enabled} onChange={(v) => toggle(toggleReflectiveAI, v)} disabled={isPending || !preferences.ai_enabled} />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Accessibility size={14} className="text-charcoal-500" />
          <h3 className="font-sans font-semibold text-sm text-charcoal-700">Acessibilidade</h3>
        </div>
        <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-sans text-sm text-charcoal-900 font-medium">Reduzir Movimento</p>
              <p className="font-sans text-xs text-charcoal-400 mt-0.5">Desabilitar animacoes</p>
            </div>
            <Toggle checked={preferences.reduce_motion} onChange={(v) => toggle(toggleReduceMotion, v)} disabled={isPending} />
          </div>
        </div>
      </section>
    </>
  )
}
