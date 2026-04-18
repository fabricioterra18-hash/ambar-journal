'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, Sparkles, PenLine, Zap, ShieldCheck } from 'lucide-react'
import { completeOnboarding } from './onboarding-action'

type Step = {
  icon: React.ReactNode
  eyebrow: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: <Sparkles size={24} />,
    eyebrow: 'Conceito',
    title: 'Um Bullet Journal com IA.',
    body: 'Capture ideias, organize tarefas e transforme pensamentos em ação — tudo em um só lugar.',
  },
  {
    icon: <PenLine size={24} />,
    eyebrow: 'Como funciona',
    title: 'Escreva livremente.',
    body: 'Anote do seu jeito. Organize manualmente ou deixe a IA te ajudar a estruturar. Você escolhe.',
  },
  {
    icon: <Zap size={24} />,
    eyebrow: 'Diferencial',
    title: 'Do pensamento à execução.',
    body: 'Quebre tarefas grandes em microtarefas, descubra o próximo passo e avance sem travar.',
  },
  {
    icon: <ShieldCheck size={24} />,
    eyebrow: 'Controle',
    title: 'A IA é opcional.',
    body: 'Nada acontece sem sua confirmação. Ligue ou desligue quando quiser, nas configurações.',
  },
]

export function OnboardingCarousel() {
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  function handleNext() {
    if (isLast) {
      startTransition(() => completeOnboarding())
    } else {
      setStep(s => s + 1)
    }
  }

  function handleSkip() {
    startTransition(() => completeOnboarding())
  }

  return (
    <main className="flex flex-col h-screen min-h-screen p-8 bg-fog-100 z-50 absolute inset-0 max-w-md mx-auto">
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-amber-700' : 'w-1.5 bg-sand-300'}`}
            />
          ))}
        </div>
        {!isLast && (
          <button
            onClick={handleSkip}
            disabled={isPending}
            className="text-ink-500 font-sans text-sm hover:text-ink-700 transition-colors disabled:opacity-50"
          >
            Pular
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-14 h-14 bg-amber-700 text-sunlight-50 rounded-2xl flex items-center justify-center shadow-lg mb-8">
          {current.icon}
        </div>

        <p className="text-amber-700 font-sans font-medium text-xs tracking-widest uppercase mb-2">
          {current.eyebrow}
        </p>
        <h1 className="text-4xl font-heading text-ink-900 tracking-tight leading-tight mb-4">
          {current.title}
        </h1>
        <p className="text-ink-600 font-sans text-lg leading-relaxed">
          {current.body}
        </p>
      </div>

      <div className="pt-8">
        <button
          onClick={handleNext}
          disabled={isPending}
          className="w-full flex items-center justify-between bg-ink-900 text-sunlight-50 p-4 rounded-full font-sans font-medium text-lg hover:bg-ink-600 transition-colors shadow-xl disabled:opacity-50"
        >
          <span>
            {isPending ? 'Preparando...' : isLast ? 'Começar' : 'Continuar'}
          </span>
          <ArrowRight size={24} />
        </button>
      </div>
    </main>
  )
}
