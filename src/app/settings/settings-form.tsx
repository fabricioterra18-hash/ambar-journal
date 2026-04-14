'use client'

import { useTransition } from 'react'
import { toggleAI, toggleOperationalAI, toggleReflectiveAI, toggleReduceMotion } from '@/lib/actions/preference-actions'
import type { UserPreferences } from '@/types/database'

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors ${checked ? 'bg-amber-700' : 'bg-ink-900/20'} ${disabled ? 'opacity-50' : ''}`}
    >
      <div className={`absolute top-1 w-5 h-5 rounded-full bg-sunlight-50 shadow transition-transform ${checked ? 'left-6' : 'left-1'}`} />
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
      <section className="mb-8">
        <h3 className="font-heading text-lg text-ink-900 mb-4">Inteligência Artificial</h3>
        <div className="bg-surface-lowest rounded-2xl shadow-sm border border-sunlight-200/20 divide-y divide-fog-100">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="font-sans text-base text-ink-900 font-medium">IA Geral</p>
              <p className="font-sans text-xs text-ink-600 mt-0.5">Habilitar todas as funcionalidades de IA</p>
            </div>
            <Toggle checked={preferences.ai_enabled} onChange={(v) => toggle(toggleAI, v)} disabled={isPending} />
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="font-sans text-base text-ink-900 font-medium">IA Operacional</p>
              <p className="font-sans text-xs text-ink-600 mt-0.5">Classificação automática, sugestões, microtarefas</p>
            </div>
            <Toggle checked={preferences.ai_operational_enabled} onChange={(v) => toggle(toggleOperationalAI, v)} disabled={isPending || !preferences.ai_enabled} />
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="font-sans text-base text-ink-900 font-medium">IA Reflexiva</p>
              <p className="font-sans text-xs text-ink-600 mt-0.5">Resumos diários, semanais e padrões</p>
            </div>
            <Toggle checked={preferences.ai_reflective_enabled} onChange={(v) => toggle(toggleReflectiveAI, v)} disabled={isPending || !preferences.ai_enabled} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-heading text-lg text-ink-900 mb-4">Acessibilidade</h3>
        <div className="bg-surface-lowest rounded-2xl shadow-sm border border-sunlight-200/20">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="font-sans text-base text-ink-900 font-medium">Reduzir Movimento</p>
              <p className="font-sans text-xs text-ink-600 mt-0.5">Desabilitar animações e transições</p>
            </div>
            <Toggle checked={preferences.reduce_motion} onChange={(v) => toggle(toggleReduceMotion, v)} disabled={isPending} />
          </div>
        </div>
      </section>
    </>
  )
}
