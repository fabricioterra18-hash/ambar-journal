'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { BookOpen, RefreshCw, ChevronRight, Sparkles, ListChecks, Compass } from 'lucide-react'
import { resetHints, resetOnboarding } from '@/lib/actions/hint-actions'

export function LearnSection() {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  function handleReplayOnboarding() {
    setMsg(null)
    startTransition(async () => {
      await resetOnboarding()
      window.location.href = '/onboarding'
    })
  }

  function handleResetHints() {
    setMsg(null)
    startTransition(async () => {
      await resetHints()
      setMsg('Dicas reativadas. Elas vão aparecer de novo conforme você usar o app.')
    })
  }

  const items = [
    { href: '/tutorial#como', icon: <Compass size={14} className="text-coral-500" />, label: 'Como funciona o Âmbar' },
    { href: '/tutorial#ia', icon: <Sparkles size={14} className="text-lavender-500" />, label: 'O que a IA faz' },
    { href: '/tutorial#microtasks', icon: <ListChecks size={14} className="text-honey-500" />, label: 'Como usar microtarefas' },
  ]

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <BookOpen size={14} className="text-sage-500" />
        <h3 className="font-sans font-semibold text-sm text-charcoal-700">Aprender a usar</h3>
      </div>
      <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 divide-y divide-sand-100">
        <button
          onClick={handleReplayOnboarding}
          disabled={isPending}
          className="w-full flex items-center justify-between p-4 hover:bg-sand-50/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <RefreshCw size={14} className="text-amber-700" />
            </div>
            <p className="font-sans text-sm text-charcoal-900 font-medium">Ver tutorial novamente</p>
          </div>
          <ChevronRight size={14} className="text-charcoal-300" />
        </button>

        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between p-4 hover:bg-sand-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sand-50 flex items-center justify-center">
                {item.icon}
              </div>
              <p className="font-sans text-sm text-charcoal-900 font-medium">{item.label}</p>
            </div>
            <ChevronRight size={14} className="text-charcoal-300" />
          </Link>
        ))}

        <button
          onClick={handleResetHints}
          disabled={isPending}
          className="w-full flex items-center justify-between p-4 hover:bg-sand-50/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sand-50 flex items-center justify-center">
              <Sparkles size={14} className="text-charcoal-500" />
            </div>
            <p className="font-sans text-sm text-charcoal-900 font-medium">Reativar dicas do app</p>
          </div>
          <ChevronRight size={14} className="text-charcoal-300" />
        </button>
      </div>
      {msg && (
        <p className="mt-2 text-[11px] font-sans text-sage-600 px-1">{msg}</p>
      )}
    </section>
  )
}
