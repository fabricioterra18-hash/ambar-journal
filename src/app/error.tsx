'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh] text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-rose-500" />
      </div>
      <h2 className="text-xl font-heading text-charcoal-900 mb-2">Algo deu errado</h2>
      <p className="text-charcoal-400 font-sans text-sm mb-6 max-w-xs">
        Ocorreu um erro inesperado. Tente novamente ou volte para a tela inicial.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 gradient-coral text-white font-medium text-sm rounded-xl active:scale-95 transition-transform"
        >
          <RotateCcw size={14} /> Tentar novamente
        </button>
        <a
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-sand-100 text-charcoal-600 font-medium text-sm rounded-xl hover:bg-sand-200 transition-colors"
        >
          Voltar
        </a>
      </div>
    </main>
  )
}
