'use client'

import { useTransition } from 'react'
import { ArrowRight } from 'lucide-react'
import { completeOnboarding } from './onboarding-action'

export function OnboardingActions() {
  const [isPending, startTransition] = useTransition()

  function handleStart() {
    startTransition(() => completeOnboarding())
  }

  return (
    <div className="pt-8">
      <button
        onClick={handleStart}
        disabled={isPending}
        className="w-full flex items-center justify-between bg-ink-900 text-sunlight-50 p-4 rounded-full font-sans font-medium text-lg hover:bg-ink-600 transition-colors shadow-xl disabled:opacity-50"
      >
        <span>{isPending ? 'Preparando...' : 'Começar meu Journal'}</span>
        <ArrowRight size={24} />
      </button>
    </div>
  )
}
