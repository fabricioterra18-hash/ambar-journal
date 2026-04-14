import { Sparkles, ArrowRight } from 'lucide-react'
import { OnboardingActions } from './actions'

export default function OnboardingPage() {
  return (
    <main className="flex flex-col h-screen min-h-screen p-8 bg-fog-100 z-50 absolute inset-0 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 bg-amber-700 text-sunlight-50 rounded-2xl flex items-center justify-center shadow-lg mb-8">
          <span className="font-heading text-3xl italic">A</span>
        </div>

        <h1 className="text-4xl font-heading text-ink-900 tracking-tight leading-tight mb-4">
          Escreva do seu jeito.<br />
          A organização vem depois.
        </h1>

        <p className="text-ink-600 font-sans text-lg leading-relaxed mb-12">
          Âmbar é um diário focado no método Bullet Journal, com um toque leve de IA para te ajudar a manter o foco, sem jargões ou cobranças.
        </p>

        <div className="bg-surface-lowest rounded-2xl p-6 shadow-sm border border-sunlight-200/20 mb-auto">
          <div className="flex items-start gap-4">
            <Sparkles className="text-amber-700 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-heading text-xl text-ink-900 mb-2">IA Inteligente e Opcional</h3>
              <p className="text-ink-600 font-sans text-[15px] leading-relaxed mb-4">
                Permita que a IA extraia datas e converta suas frases casuais em tarefas estruturadas automaticamente. Nada será alterado sem sua confirmação.
              </p>
            </div>
          </div>
        </div>
      </div>

      <OnboardingActions />
    </main>
  )
}
