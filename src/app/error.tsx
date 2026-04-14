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
      <AlertCircle size={40} className="text-clay-600 mb-4" />
      <h2 className="text-xl font-heading text-ink-900 mb-2">Algo deu errado</h2>
      <p className="text-ink-600 font-sans text-sm mb-6 max-w-xs">
        Ocorreu um erro inesperado. Tente novamente ou volte para a tela inicial.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700/10 text-amber-700 font-medium text-sm rounded-xl"
        >
          <RotateCcw size={14} /> Tentar novamente
        </button>
        <a
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-ink-900/5 text-ink-600 font-medium text-sm rounded-xl"
        >
          Voltar ao inicio
        </a>
      </div>
    </main>
  )
}
